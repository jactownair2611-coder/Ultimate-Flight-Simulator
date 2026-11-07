import * as THREE from "three";
import { createA320 } from "./aircraft/a320.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

console.log("ULTIMATE FLIGHT SIMULATOR - VERSION 0.6.2");

// ============================================
// SCENE
// ============================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87bce8);
scene.fog = new THREE.Fog(0x87bce8, 1800, 9000);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  12000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ============================================
// LIGHTING
// ============================================

scene.add(new THREE.HemisphereLight(0xffffff, 0x526b48, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(-500, 1000, -300);
sun.castShadow = true;
scene.add(sun);

// ============================================
// GROUND
// ============================================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10000, 10000),
  new THREE.MeshStandardMaterial({ color: 0x477b42 })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

// ============================================
// RUNWAY
// ============================================

const runway = new THREE.Mesh(
  new THREE.BoxGeometry(65, 0.25, 2200),
  new THREE.MeshStandardMaterial({ color: 0x303238 })
);

runway.position.set(0, 0, -850);
runway.receiveShadow = true;
scene.add(runway);

function runwayLine(x, z, width, length) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.04, length),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );

  line.position.set(x, 0.16, z);
  scene.add(line);
}

runwayLine(0, -850, 0.8, 2100);

for (let z = 100; z > -1850; z -= 90) {
  runwayLine(0, z, 0.8, 35);
}

for (const x of [-25, 25]) {
  runwayLine(x, -850, 0.6, 2100);
}

for (let x = -20; x <= 20; x += 5) {
  runwayLine(x, 180, 1.3, 35);
}

// ============================================
// VERSION 0.6 - DYNAMIC WING FLEX
// ============================================

let wingFlexMeshes = [];
let wingFlexAmount = 0;
let simulationTime = 0;

function prepareWingFlex(root) {
  wingFlexMeshes = [];

  root.traverse((object) => {
    if (!object.isMesh || !object.geometry.attributes.position) {
      return;
    }

    object.geometry = object.geometry.clone();

    const geometry = object.geometry;
    const position = geometry.attributes.position;
    const originalPositions = new Float32Array(position.array);
    const weights = new Float32Array(position.count);

    let affectedVertices = 0;

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      const span = Math.abs(x);

      const spanProgress = THREE.MathUtils.clamp(
        (span - 380) / 240,
        0,
        1
      );

      const smoothWeight =
        spanProgress * spanProgress *
        (3 - 2 * spanProgress);

      const inWingChord = y > -260 && y < 50;
      const inWingHeight = z > -140 && z < 120;

      const weight =
        inWingChord && inWingHeight ? smoothWeight : 0;

      weights[i] = weight;

      if (weight > 0.01) affectedVertices++;
    }

    if (affectedVertices > 0) {
      wingFlexMeshes.push({
        geometry,
        originalPositions,
        weights
      });

      console.log("Wing flex prepared:", affectedVertices, "vertices");
    }
  });
}

function updateWingFlex(dt) {
  simulationTime += dt;

  for (const item of wingFlexMeshes) {
    const position = item.geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
      const weight = item.weights[i];
      if (weight === 0) continue;

      const originalZ = item.originalPositions[i * 3 + 2];
      const originalX = item.originalPositions[i * 3];
      const phase = originalX >= 0 ? 0 : Math.PI;

      const flutter =
        Math.sin(simulationTime * 2.1 + phase) * 0.7 +
        Math.sin(simulationTime * 3.4 + phase) * 0.3;

      const displacement = wingFlexAmount * (24 + flutter);

      position.setZ(i, originalZ - displacement * weight);
    }

    position.needsUpdate = true;
    item.geometry.computeVertexNormals();
  }
}

// ============================================
// AIRCRAFT AND FALLBACK
// ============================================

const aircraft = new THREE.Group();
const fallbackAircraft = createA320(THREE);
aircraft.add(fallbackAircraft);
scene.add(aircraft);

// ============================================
// LOAD A320 MODEL
// ============================================

const loader = new GLTFLoader();

loader.load(
  "./aircraft/models/A320_nologo.glb",
  (gltf) => {
    console.log("A320 3D model loaded successfully!");

// Remove the backup aircraft exterior,
// but KEEP its cockpit interior.
for (const child of [...fallbackAircraft.children]) {
  if (child.name !== "cockpit-interior") {
    fallbackAircraft.remove(child);
  }
}

const model = gltf.scene;
    model.rotation.y = Math.PI / 2;

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    const longestDimension = Math.max(size.x, size.y, size.z);
    const targetLength = 23.2;
    const scale = targetLength / longestDimension;

    model.scale.setScalar(scale);
    model.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );

    prepareWingFlex(model);
    aircraft.add(model);
  },
  undefined,
  (error) => {
    console.error("Could not load A320 model:", error);
    console.log("Using backup aircraft.");
  }
);

// ============================================
// FLIGHT MODEL SETTINGS
// ============================================

const GROUND_Y = 3.1;
const clock = new THREE.Clock();

const MASS = 64000;
const WING_AREA = 122.6;
const AIR_DENSITY = 1.225;
const GRAVITY = 9.81;
const MAX_THRUST = 140000;

// Visual/gameplay tuning only; not real aircraft performance data.
const GAME_LIFT_MULTIPLIER = 3.0;
const TAKEOFF_SPEED = 54; // Approximately 105 knots

// ============================================
// FLIGHT VARIABLES
// ============================================

let throttle = 0.35;
let enginePower = 0.35;
let speed = 0;

let pitch = 0;
let pitchTarget = 0;
let roll = 0;
let rollTarget = 0;
let yaw = 0;

let verticalSpeed = 0;
let angleOfAttack = 0;

let airborne = false;
let flaps = 0;
let cockpitCamera = false;

const velocity = new THREE.Vector3();
const keys = {};

const forward = new THREE.Vector3();
const aircraftUp = new THREE.Vector3();
const liftDirection = new THREE.Vector3();
const acceleration = new THREE.Vector3();
const windDirection = new THREE.Vector3();

// ============================================
// CONTROLS
// ============================================

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.repeat) return;

  if (event.key.toLowerCase() === "f") {
    flaps = flaps === 0 ? 1 : 0;
  }

  if (event.key.toLowerCase() === "c") {
    cockpitCamera = !cockpitCamera;
  }

  if (event.key.toLowerCase() === "r") {
    resetAircraft();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// ============================================
// RESET
// ============================================

function resetAircraft() {
  aircraft.position.set(0, GROUND_Y, 120);
  aircraft.rotation.set(0, 0, 0);

  velocity.set(0, 0, 0);

  throttle = 0.35;
  enginePower = 0.35;
  speed = 0;

  pitch = 0;
  pitchTarget = 0;
  roll = 0;
  rollTarget = 0;
  yaw = 0;

  verticalSpeed = 0;
  angleOfAttack = 0;

  airborne = false;
  flaps = 0;
  wingFlexAmount = 0;
}

// ============================================
// MATH HELPERS
// ============================================

function approach(current, target, amount) {
  return current + (target - current) *
    THREE.MathUtils.clamp(amount, 0, 1);
}

// ============================================
// AERODYNAMIC FLIGHT MODEL
// ============================================

function updateFlight(dt) {
  const pitchInput =
    (keys["w"] ? 1 : 0) - (keys["s"] ? 1 : 0);

  const rollInput =
    (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0);

  const yawInput =
    (keys["e"] ? 1 : 0) - (keys["q"] ? 1 : 0);

  if (keys["arrowup"]) throttle += dt * 0.20;
  if (keys["arrowdown"]) throttle -= dt * 0.20;

  throttle = THREE.MathUtils.clamp(throttle, 0, 1);

  // ENGINE SPOOL-UP
  const spoolRate = throttle > enginePower ? 0.45 : 0.65;
  enginePower = approach(enginePower, throttle, dt * spoolRate);

  // CONTROL INPUTS
  pitchTarget += pitchInput * dt * 1.2;
  rollTarget += rollInput * dt * 0.85;

  if (pitchInput === 0) {
    pitchTarget = approach(pitchTarget, 0, dt * 0.08);
  }

  if (rollInput === 0) {
    rollTarget = approach(rollTarget, 0, dt * 0.22);
  }

  pitchTarget = THREE.MathUtils.clamp(pitchTarget, -0.15, 0.35);
  rollTarget = THREE.MathUtils.clamp(rollTarget, -0.75, 0.75);

  pitch = approach(pitch, pitchTarget, dt * 2.8);
  roll = approach(roll, rollTarget, dt * 2.4);

  // BANKED TURNING
  if (airborne && speed > 5) {
    yaw -= GRAVITY * Math.tan(roll) /
      Math.max(speed, 20) * dt;
  }

  yaw += yawInput * dt * 0.12;

  // ORIENTATION
  aircraft.rotation.order = "YXZ";
  aircraft.rotation.x = pitch;
  aircraft.rotation.y = yaw;
  aircraft.rotation.z = -roll;

  forward.set(0, 0, -1)
    .applyQuaternion(aircraft.quaternion)
    .normalize();

  aircraftUp.set(0, 1, 0)
    .applyQuaternion(aircraft.quaternion)
    .normalize();

  speed = velocity.length();

  // THRUST
  const thrustAcceleration = (enginePower * MAX_THRUST) / MASS;
  acceleration.set(0, 0, 0);
  acceleration.addScaledVector(forward, thrustAcceleration);

  // ANGLE OF ATTACK
  let flightPathAngle = 0;

  if (speed > 1) {
    flightPathAngle = Math.atan2(
      velocity.y,
      Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
    );
  }

  angleOfAttack = pitch - flightPathAngle;

  // LIFT COEFFICIENT
  let liftCoefficient = THREE.MathUtils.clamp(
    0.25 + angleOfAttack * 5.2 + flaps * 0.35,
    -0.15,
    1.55
  );

  // SIMPLIFIED STALL
  if (angleOfAttack > 0.24) {
    const stallFactor = THREE.MathUtils.clamp(
      1 - (angleOfAttack - 0.24) * 2.2,
      0.3,
      1
    );

    liftCoefficient *= stallFactor;
  }

  // AERODYNAMIC FORCES
  let lift = 0;
  let drag = 0;

  if (speed > 1) {
    const dynamicPressure =
      0.5 * AIR_DENSITY * speed * speed;

    lift =
      dynamicPressure *
      WING_AREA *
      liftCoefficient *
      GAME_LIFT_MULTIPLIER / MASS;

    const dragCoefficient =
      0.025 +
      0.055 * liftCoefficient * liftCoefficient +
      flaps * 0.012;

    drag =
      dynamicPressure *
      WING_AREA *
      dragCoefficient / MASS;

    windDirection.copy(velocity).normalize();
    acceleration.addScaledVector(windDirection, -drag);

    // LIFT ALSO ACTS DURING THE TAKEOFF ROLL
    liftDirection.copy(aircraftUp);

    liftDirection.addScaledVector(
      windDirection,
      -aircraftUp.dot(windDirection)
    );

    if (liftDirection.lengthSq() > 0.001) {
      liftDirection.normalize();
      acceleration.addScaledVector(liftDirection, lift);
    }
  }

  // WING FLEX RESPONSE
  const loadFactor = Math.max(0, lift / GRAVITY);

  const flexTarget =
    (airborne || speed > 50)
      ? THREE.MathUtils.clamp((loadFactor - 0.15) / 1.5, 0, 1)
      : 0;

  wingFlexAmount = approach(wingFlexAmount, flexTarget, dt * 0.8);

  // GRAVITY
  if (airborne) {
    acceleration.y -= GRAVITY;
  } else {
    // Keep the aircraft on the runway until the takeoff condition is met.
    acceleration.y = 0;
    velocity.y = 0;
  }

  // UPDATE VELOCITY
  velocity.addScaledVector(acceleration, dt);

  // TAKEOFF TRANSITION
  if (!airborne) {
    aircraft.position.y = GROUND_Y;
    velocity.y = 0;

    if (
      speed >= TAKEOFF_SPEED &&
      pitch >= 0.08 &&
      lift > GRAVITY)
     {
      airborne = true;
      console.log("A320 LIFTOFF!");
    }
  }
  // UPDATE POSITION
  aircraft.position.addScaledVector(velocity, dt);

  // LANDING
  if (airborne && aircraft.position.y <= GROUND_Y) {
    aircraft.position.y = GROUND_Y;
    velocity.y = 0;
    airborne = false;
    pitchTarget = 0;
  }

  speed = velocity.length();
  verticalSpeed = velocity.y;
}

// ============================================
// CAMERA
// ============================================

const chaseOffset = new THREE.Vector3(0, 12, 35);
const cameraTarget = new THREE.Vector3();

function updateCamera() {
  if (cockpitCamera) {
    const cockpitPosition = new THREE.Vector3(0, 0.92, -11.6)
      .applyQuaternion(aircraft.quaternion)
      .add(aircraft.position);

    const cockpitLook = new THREE.Vector3(0, 0.4, -100)
      .applyQuaternion(aircraft.quaternion)
      .add(aircraft.position);

    camera.position.copy(cockpitPosition);
    camera.lookAt(cockpitLook);
  } else {
    const offset = chaseOffset.clone()
      .applyQuaternion(aircraft.quaternion);

    camera.position.copy(aircraft.position).add(offset);

    cameraTarget.copy(aircraft.position);
    cameraTarget.y += 2;

    camera.lookAt(cameraTarget);
  }
}

// ============================================
// HUD
// ============================================

function updateHUD() {
  const heading =
    (THREE.MathUtils.radToDeg(yaw) + 360) % 360;

  const values = {
    speed: `${Math.round(speed * 1.94384)} kt`,
    altitude: `${Math.round(aircraft.position.y * 3.28084)} ft`,
    throttle: `${Math.round(throttle * 100)}%`,
    heading: `${Math.round(heading)}Â°`,
    vertical: `${Math.round(verticalSpeed * 196.85)} ft/min`,
    gear: " DOWN",
    flaps: flaps ? " EXTENDED" : " UP",
    aoa: `${THREE.MathUtils.radToDeg(angleOfAttack).toFixed(1)}Â°`
  };

  for (const [id, value] of Object.entries(values)) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
}

// ============================================
// MAIN LOOP
// ============================================

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.04);

  updateFlight(dt);
  updateWingFlex(dt);
  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

// ============================================
// RESIZE
// ============================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

// START
resetAircraft();
animate();

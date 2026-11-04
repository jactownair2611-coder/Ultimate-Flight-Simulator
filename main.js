import * as THREE from "three";
import { createA320 } from "./aircraft/a320.js";

// ============================================
// A320-200 FLIGHT SIMULATOR - VERSION 0.3
// Game/simulation flight model, not real aircraft data
// ============================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87bce8);
scene.fog = new THREE.Fog(0x87bce8, 1800, 9000);

const camera = new THREE.PerspectiveCamera(
  70, window.innerWidth / window.innerHeight, 0.1, 12000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.HemisphereLight(0xffffff, 0x526b48, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(-500, 1000, -300);
sun.castShadow = true;
scene.add(sun);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10000, 10000),
  new THREE.MeshStandardMaterial({ color: 0x477b42 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

// Runway
const runway = new THREE.Mesh(
  new THREE.BoxGeometry(65, 0.25, 2200),
  new THREE.MeshStandardMaterial({ color: 0x303238 })
);
runway.position.set(0, 0, -850);
runway.receiveShadow = true;
scene.add(runway);

function runwayLine(x, z, width, length, color = 0xffffff) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.04, length),
    new THREE.MeshStandardMaterial({ color })
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

// Runway threshold markings
for (let x = -20; x <= 20; x += 5) {
  runwayLine(x, 180, 1.3, 35);
}

// ============================================
// A320-200 MODEL
// Forward direction is local -Z
// ============================================

const aircraft = createA320(THREE);
aircraft.position.set(0, 7.5, 0);
scene.add(aircraft);

const white = new THREE.MeshStandardMaterial({
  color: 0xf2f2f2, roughness: 0.55
});
const dark = new THREE.MeshStandardMaterial({
  color: 0x182532, roughness: 0.4
});
const wingMaterial = new THREE.MeshStandardMaterial({
  color: 0xe5e8eb, roughness: 0.65
});
const engineMaterial = new THREE.MeshStandardMaterial({
  color: 0xbfc5ca, metalness: 0.45, roughness: 0.4
});
const rubber = new THREE.MeshStandardMaterial({ color: 0x171717 });

function box(parent, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d), material
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radius1, radius2, length, material, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius1, radius2, length, 24),
    material
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// Fuselage sections
cylinder(aircraft, 2.0, 2.0, 25, white, 0, 0, 0);
cylinder(aircraft, 1.65, 2.0, 8, white, 0, 0, -16.2);
cylinder(aircraft, 2.0, 1.7, 6, white, 0, 0, 15.2);

// Nose cone
const nose = new THREE.Mesh(
  new THREE.ConeGeometry(1.65, 5.5, 32),
  white
);
nose.rotation.x = -Math.PI / 2;
nose.position.set(0, 0, -22);
nose.castShadow = true;
aircraft.add(nose);

// Tail cone
const tailCone = new THREE.Mesh(
  new THREE.ConeGeometry(1.65, 5, 32),
  white
);
tailCone.rotation.x = Math.PI / 2;
tailCone.position.set(0, 0, 19.5);
aircraft.add(tailCone);

// Cockpit windows
box(aircraft, 2.5, 0.12, 0.35, dark, 0, 1.75, -17.6);
box(aircraft, 0.12, 0.7, 0.35, dark, -1.15, 1.48, -17.6);
box(aircraft, 0.12, 0.7, 0.35, dark, 1.15, 1.48, -17.6);

// Passenger windows
for (let side of [-1, 1]) {
  for (let z = -12; z <= 12; z += 2.1) {
    const windowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 8),
      dark
    );
    windowMesh.scale.set(0.45, 1, 0.45);
    windowMesh.position.set(side * 1.97, 0.65, z);
    aircraft.add(windowMesh);
  }
}

// Swept wings
function makeWing(side) {
  const shape = new THREE.Shape();
  shape.moveTo(2, -1);
  shape.lineTo(17.05, 2.5);
  shape.lineTo(17.05, 4.3);
  shape.lineTo(2, 4);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);

  const wing = new THREE.Mesh(geometry, wingMaterial);
  wing.scale.x = side;
wing.position.x = 0;
  wing.position.y = -0.15;
  wing.castShadow = true;
  aircraft.add(wing);

  // Wing thickness
  const panel = box(
    aircraft, 30, 0.35, 3.6, wingMaterial,
    side * 9.5, -0.2, 1.4
  );
  panel.rotation.y = side * -0.09;

  // Wingtip fence
  const fence = box(
    aircraft, 0.18, 1.8, 2.1, wingMaterial,
    side * 17, 0.65, 2.6
  );
  fence.rotation.y = side * -0.08;
}

makeWing(-1);
makeWing(1);

// Engines
function makeEngine(x) {
  const engine = new THREE.Group();
  engine.position.set(x, -1.45, 2.1);
  aircraft.add(engine);

  cylinder(engine, 1.35, 1.35, 5.2, engineMaterial, 0, 0, 0);
  cylinder(engine, 1.15, 1.35, 1.2, white, 0, 0, -2.7);

  const intake = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.13, 12, 32),
    dark
  );
  intake.position.z = -3.25;
  engine.add(intake);

  const fan = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 24),
    dark
  );
  fan.position.z = -3.22;
  engine.add(fan);

  cylinder(engine, 0.75, 0.75, 0.5, dark, 0, 0, 2.85);
}

makeEngine(-7);
makeEngine(7);

// Horizontal stabilizers
for (const side of [-1, 1]) {
  box(
    aircraft, 10, 0.25, 3, wingMaterial,
    side * 4.2, 0.5, 15.5
  );
}

// Vertical tail
const verticalTail = box(
  aircraft, 0.35, 7.5, 5, white, 0, 4, 15.8
);
verticalTail.rotation.x = -0.12;

// Ailerons and elevators
const ailerons = [];
for (const side of [-1, 1]) {
  const aileron = box(
    aircraft, 5, 0.18, 1.2, dark,
    side * 13, -0.2, 3.2
  );
  ailerons.push(aileron);
}

const elevators = [];
for (const side of [-1, 1]) {
  const elevator = box(
    aircraft, 3.5, 0.16, 1, dark,
    side * 4.2, 0.48, 16.4
  );
  elevators.push(elevator);
}

const rudder = box(
  aircraft, 0.22, 3.5, 1.2, dark,
  0, 4, 17.8
);

// Landing gear
const gearGroup = new THREE.Group();
aircraft.add(gearGroup);

function makeWheel(x, y, z, radius = 0.55) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.35, 20),
    rubber
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  gearGroup.add(wheel);
}

for (const side of [-1, 1]) {
  box(gearGroup, 0.18, 3.2, 0.18, engineMaterial, side * 4.3, -2.5, 3.5);
  makeWheel(side * 4.3, -4.15, 3.5);
  makeWheel(side * 4.3, -4.15, 4.5);
}

box(gearGroup, 0.2, 3.1, 0.2, engineMaterial, 0, -2.5, -13);
makeWheel(0, -4.1, -13);

// Start position
aircraft.position.set(0, 5, 120);

// ============================================
// FLIGHT MODEL
// ============================================

const clock = new THREE.Clock();

let speed = 0;
let throttle = 0.35;
let pitch = 0;
let roll = 0;
let yaw = 0;
let verticalSpeed = 0;
let airborne = false;
let gearDown = true;
let flaps = 0;
let cockpitCamera = false;

const velocity = new THREE.Vector3(0, 0, 0);
const keys = {};

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.repeat) return;

  if (event.key.toLowerCase() === "g") {
    gearDown = !gearDown;
    gearGroup.visible = gearDown;
  }

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

function resetAircraft() {
  aircraft.position.set(0, 5, 120);
  aircraft.rotation.set(0, 0, 0);
  velocity.set(0, 0, 0);
  speed = 0;
  throttle = 0.35;
  pitch = 0;
  roll = 0;
  yaw = 0;
  verticalSpeed = 0;
  airborne = false;
  gearDown = true;
  flaps = 0;
  gearGroup.visible = true;
}

// Smooth control response
function approach(current, target, amount) {
  return current + (target - current) * amount;
}

function updateFlight(dt) {
  const pitchInput =
    (keys["w"] ? 1 : 0) - (keys["s"] ? 1 : 0);

  const rollInput =
    (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0);

  const yawInput =
    (keys["e"] ? 1 : 0) - (keys["q"] ? 1 : 0);

  if (keys["arrowup"]) throttle += dt * 0.25;
  if (keys["arrowdown"]) throttle -= dt * 0.25;
  throttle = THREE.MathUtils.clamp(throttle, 0, 1);

  pitch += pitchInput * dt * 0.45;
  roll += rollInput * dt * 0.75;
  yaw += yawInput * dt * 0.25;

  pitch = THREE.MathUtils.clamp(pitch, -0.35, 0.45);
  roll = THREE.MathUtils.clamp(roll, -0.85, 0.85);

  // Banked aircraft gradually turns
  if (airborne) {
    yaw -= Math.sin(roll) * dt * 0.35;
  }

  // Apply aircraft orientation
  aircraft.rotation.order = "YXZ";
  aircraft.rotation.x = pitch;
  aircraft.rotation.y = yaw;
  aircraft.rotation.z = -roll;

  const forward = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(aircraft.quaternion);

  const up = new THREE.Vector3(0, 1, 0)
    .applyQuaternion(aircraft.quaternion);

  speed = velocity.length();

  // Engine thrust and aerodynamic drag
  const thrust = throttle * 24;
  const drag = 0.0025 * speed * speed;

  const acceleration = new THREE.Vector3()
    .addScaledVector(forward, thrust);

  if (speed > 0.01) {
    acceleration.addScaledVector(
      velocity.clone().normalize(), -drag
    );
  }

  // Approximate angle of attack and lift
  const horizontalSpeed = Math.max(
    1, Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
  );

  const flightPathAngle = Math.atan2(
    velocity.y, horizontalSpeed
  );

  const angleOfAttack = pitch - flightPathAngle;

  const liftCoefficient = THREE.MathUtils.clamp(
    0.18 + angleOfAttack * 4.2 + flaps * 0.35,
    -0.15,
    1.35
  );

  // Lift grows with airspeed squared
  const lift = 0.0035 * speed * speed * liftCoefficient;

  // Lift acts approximately perpendicular to the flight path
  const liftDirection = up.clone()
    .addScaledVector(
      velocity.clone().normalize(),
      -up.dot(velocity.clone().normalize())
    );

  if (liftDirection.lengthSq() > 0.001) {
    liftDirection.normalize();
    acceleration.addScaledVector(liftDirection, lift);
  }

  // Gravity
  acceleration.y -= 9.81;

  // Update velocity and position
  velocity.addScaledVector(acceleration, dt);
  aircraft.position.addScaledVector(velocity, dt);

  speed = velocity.length();
  verticalSpeed = velocity.y;

  // Simplified ground contact and takeoff
  if (!airborne) {
    if (aircraft.position.y < 5) {
      aircraft.position.y = 5;
      velocity.y = 0;
    }

    if (speed > 62 && lift > 9.2) {
      airborne = true;
    }
  } else if (aircraft.position.y <= 5) {
    aircraft.position.y = 5;
    velocity.y = 0;
    airborne = false;
  }

  // Animate ailerons and elevators
  ailerons[0].rotation.z = rollInput * 0.22;
  ailerons[1].rotation.z = -rollInput * 0.22;
  elevators.forEach(e => {
    e.rotation.x = -pitchInput * 0.18;
  });
  rudder.rotation.y = yawInput * 0.2;
}

// ============================================
// CAMERA
// ============================================

const chaseOffset = new THREE.Vector3(0, 12, 35);
const cameraTarget = new THREE.Vector3();

function updateCamera() {
  if (cockpitCamera) {
    const cockpitPosition = new THREE.Vector3(0, 1.5, -15)
      .applyQuaternion(aircraft.quaternion)
      .add(aircraft.position);

    const cockpitLook = new THREE.Vector3(0, 1, -100)
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
  const heading = (THREE.MathUtils.radToDeg(yaw) + 360) % 360;

  const values = {
    speed: ` ${Math.round(speed * 1.94384)} kt`,
    altitude: ` ${Math.round(aircraft.position.y * 3.28084)} ft`,
    throttle: ` ${Math.round(throttle * 100)}%`,
    heading: ` ${Math.round(heading)}°`,
    vertical: ` ${Math.round(verticalSpeed * 196.85)} ft/min`,
    gear: gearDown ? " DOWN" : " UP",
    flaps: flaps ? " EXTENDED" : " UP"
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
  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();



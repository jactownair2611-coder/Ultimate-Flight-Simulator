

import * as THREE from "three";

// ========================================
// ULTIMATE FLIGHT SIMULATOR - VERSION 0.2
// ========================================

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 2500, 12000);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  30000
);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// LIGHTING
const sunlight = new THREE.DirectionalLight(0xffffff, 2.2);
sunlight.position.set(1000, 1500, 500);
sunlight.castShadow = true;
scene.add(sunlight);

scene.add(
  new THREE.HemisphereLight(0xffffff, 0x667788, 1.1)
);

// MATERIALS
const white = new THREE.MeshStandardMaterial({
  color: 0xf1f1f1,
  roughness: 0.55
});

const dark = new THREE.MeshStandardMaterial({
  color: 0x222831,
  roughness: 0.7
});

const metal = new THREE.MeshStandardMaterial({
  color: 0x999999,
  metalness: 0.7,
  roughness: 0.3
});

const glass = new THREE.MeshStandardMaterial({
  color: 0x183c55,
  metalness: 0.4,
  roughness: 0.15
});

// ========================================
// WORLD
// ========================================

// GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20000, 20000),
  new THREE.MeshStandardMaterial({
    color: 0x477b38,
    roughness: 1
  })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -5;
ground.receiveShadow = true;
scene.add(ground);

// RUNWAY
const runway = new THREE.Mesh(
  new THREE.BoxGeometry(100, 1, 1900),
  dark
);

runway.position.set(0, -0.2, -850);
runway.receiveShadow = true;
scene.add(runway);

// RUNWAY CENTER LINE
for (let i = 0; i < 27; i++) {
  const marking = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.15, 35),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  marking.position.set(0, 0.4, -1750 + i * 65);
  scene.add(marking);
}

// RUNWAY EDGE LIGHTS
for (let i = 0; i < 40; i++) {
  const z = -1770 + i * 47;

  for (const x of [-49, 49]) {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.7, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );

    light.position.set(x, 0.7, z);
    scene.add(light);
  }
}

// RUNWAY THRESHOLD MARKINGS
for (let i = 0; i < 8; i++) {
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.2, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  stripe.position.set(-35 + i * 10, 0.45, 70);
  scene.add(stripe);
}

// ========================================
// AIRCRAFT MODEL
// ========================================

const aircraft = new THREE.Group();
scene.add(aircraft);

// FUSELAGE
const fuselage = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 27, 24),
  white
);

fuselage.rotation.x = Math.PI / 2;
fuselage.castShadow = true;
aircraft.add(fuselage);

// NOSE
const nose = new THREE.Mesh(
  new THREE.ConeGeometry(1.5, 5, 24),
  white
);

nose.rotation.x = -Math.PI / 2;
nose.position.z = -16;
aircraft.add(nose);

// COCKPIT WINDOWS
const cockpit = new THREE.Mesh(
  new THREE.SphereGeometry(1.55, 20, 12),
  glass
);

cockpit.scale.set(0.85, 0.75, 1.8);
cockpit.position.set(0, 1.1, -9);
aircraft.add(cockpit);

// MAIN WING
const wing = new THREE.Mesh(
  new THREE.BoxGeometry(43, 0.65, 7),
  white
);

wing.position.z = -1;
wing.castShadow = true;
aircraft.add(wing);

// WING TIPS
for (const side of [-1, 1]) {
  const tip = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.5, 5),
    white
  );

  tip.position.set(side * 22, 0.15, -1);
  aircraft.add(tip);
}

// ENGINE NACELLES
for (const side of [-1, 1]) {
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.25, 8, 20),
    white
  );

  engine.rotation.x = Math.PI / 2;
  engine.position.set(side * 10, -1.4, -2);
  aircraft.add(engine);

  const intake = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 0.2, 20),
    dark
  );

  intake.rotation.x = Math.PI / 2;
  intake.position.set(side * 10, -1.4, -6.1);
  aircraft.add(intake);
}

// HORIZONTAL TAIL
const horizontalTail = new THREE.Mesh(
  new THREE.BoxGeometry(13, 0.5, 4),
  white
);

horizontalTail.position.set(0, 0.3, 11);
aircraft.add(horizontalTail);

// VERTICAL STABILIZER
const verticalTail = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 5, 5),
  white
);

verticalTail.position.set(0, 2.5, 11);
aircraft.add(verticalTail);

// LANDING GEAR
const landingGear = new THREE.Group();
aircraft.add(landingGear);

function makeWheel(x, y, z, radius) {
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 2, 8),
    metal
  );

  leg.position.set(x, y + 1, z);
  landingGear.add(leg);

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.7, 16),
    dark
  );

  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  landingGear.add(wheel);
}

makeWheel(-4, -3.5, 1, 0.8);
makeWheel(4, -3.5, 1, 0.8);
makeWheel(0, -2.8, 12, 0.55);

// CONTROL SURFACES
const ailerons = [];

for (const side of [-1, 1]) {
  const aileron = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.3, 1.8),
    metal
  );

  aileron.position.set(side * 16, -0.1, 2.5);
  aircraft.add(aileron);
  ailerons.push(aileron);
}

const elevator = new THREE.Mesh(
  new THREE.BoxGeometry(7, 0.3, 1.5),
  metal
);

elevator.position.set(0, 0.25, 12);
aircraft.add(elevator);

const rudder = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 2, 1.5),
  metal
);

rudder.position.set(0, 2.5, 13);
aircraft.add(rudder);

// START POSITION
aircraft.position.set(0, 7.5, 0);

// ========================================
// FLIGHT VARIABLES
// ========================================

let speed = 0;
let altitude = 7.5;
let throttle = 0;

let pitch = 0;
let roll = 0;
let yaw = 0;

let verticalSpeed = 0;
let airborne = false;

let gearDown = true;
let flaps = false;
let cockpitCamera = false;

const keys = {};

const clock = new THREE.Clock();

// ========================================
// KEYBOARD CONTROLS
// ========================================

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key.startsWith("arrow")) {
    event.preventDefault();
  }

  if (!keys[key]) {
    if (key === "g") {
      gearDown = !gearDown;
      landingGear.visible = gearDown;
    }

    if (key === "f") {
      flaps = !flaps;
    }

    if (key === "c") {
      cockpitCamera = !cockpitCamera;
    }

    if (key === "r") {
      resetAircraft();
    }
  }

  keys[key] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// ========================================
// RESET
// ========================================

function resetAircraft() {
  aircraft.position.set(0, 7.5, 0);
  aircraft.rotation.set(0, 0, 0);

  speed = 0;
  altitude = 7.5;
  throttle = 0;

  pitch = 0;
  roll = 0;
  yaw = 0;

  verticalSpeed = 0;
  airborne = false;

  gearDown = true;
  flaps = false;
  cockpitCamera = false;

  landingGear.visible = true;
}

// ========================================
// FLIGHT PHYSICS
// ========================================

function updateFlight(dt) {
  // THROTTLE
  if (keys["arrowup"]) throttle += 35 * dt;
  if (keys["arrowdown"]) throttle -= 35 * dt;

  throttle = THREE.MathUtils.clamp(throttle, 0, 100);

  // CONTROL INPUT
  let pitchInput = 0;
  let rollInput = 0;
  let rudderInput = 0;

  if (keys["w"]) pitchInput = 1;
  if (keys["s"]) pitchInput = -1;

  if (keys["a"]) rollInput = 1;
  if (keys["d"]) rollInput = -1;

  if (keys["q"]) rudderInput = 1;
  if (keys["e"]) rudderInput = -1;

  // SMOOTH CONTROL RESPONSE
  pitch += (pitchInput * 0.32 - pitch) * Math.min(1, dt * 2.5);
  roll += (rollInput * 0.75 - roll) * Math.min(1, dt * 3);
  yaw += rudderInput * dt * 0.25;

  // FLIGHT SPEED
  const acceleration = throttle * 0.006 - speed * 0.025;

  speed += acceleration * dt;
  speed = THREE.MathUtils.clamp(speed, 0, 30);

  // TAKEOFF
  if (!airborne && speed > 10 && pitch > 0.10) {
    airborne = true;
  }

  // LIFT AND GRAVITY
  if (airborne) {
    const lift = speed * speed * 0.004;
    const pitchEffect = Math.sin(pitch) * speed * 0.25;
    const flapLift = flaps ? 0.7 : 0;

    verticalSpeed += (
      lift + pitchEffect + flapLift - 2.8
    ) * dt;

    verticalSpeed = THREE.MathUtils.clamp(
      verticalSpeed,
      -12,
      12
    );

    aircraft.position.y += verticalSpeed * dt;

    if (aircraft.position.y <= 7.5) {
      aircraft.position.y = 7.5;
      verticalSpeed = 0;
      airborne = false;
    }
  } else {
    aircraft.position.y = 7.5;
    verticalSpeed = 0;
  }

  // AIRCRAFT ROTATION
  aircraft.rotation.x = pitch;
  aircraft.rotation.z = roll;
  aircraft.rotation.y = yaw;

  // BANK-TO-TURN
  yaw += Math.sin(roll) * speed * 0.0009 * dt;

  // MOVE AIRCRAFT FORWARD
  aircraft.translateZ(-speed * dt);

  // CONTROL SURFACE ANIMATION
  elevator.rotation.x = -pitch * 0.7;
  rudder.rotation.y = -rudderInput * 0.3;

  ailerons[0].rotation.x = roll * 0.4;
  ailerons[1].rotation.x = -roll * 0.4;

  altitude = aircraft.position.y;

  updateHUD();
}

// ========================================
// FLIGHT DISPLAY
// ========================================

function updateHUD() {
  const heading = (
    (THREE.MathUtils.radToDeg(yaw) % 360) + 360
  ) % 360;

  const knots = Math.round(speed * 15);
  const feet = Math.round(altitude * 100);
  const verticalRate = Math.round(verticalSpeed * 600);

  document.getElementById("speed").textContent =
    "AIRSPEED: " + knots + " KTS";

  document.getElementById("altitude").textContent =
    "ALTITUDE: " + feet + " FT";

  document.getElementById("throttle").textContent =
    "THROTTLE: " + Math.round(throttle) + "%";

  document.getElementById("heading").textContent =
    "HEADING: " + Math.round(heading) + "°";

  document.getElementById("vertical").textContent =
    "VERTICAL SPEED: " + verticalRate + " FT/MIN";

  document.getElementById("gear").textContent =
    "GEAR: " + (gearDown ? "DOWN" : "UP");

  document.getElementById("flaps").textContent =
    "FLAPS: " + (flaps ? "EXTENDED" : "RETRACTED");
}

// ========================================
// CAMERA SYSTEM
// ========================================

function updateCamera(dt) {
  if (cockpitCamera) {
    const cockpitPosition = new THREE.Vector3(0, 2.3, -7);
    const lookPosition = new THREE.Vector3(0, 1.5, -100);

    aircraft.localToWorld(cockpitPosition);
    aircraft.localToWorld(lookPosition);

    camera.position.copy(cockpitPosition);
    camera.lookAt(lookPosition);
  } else {
    const offset = new THREE.Vector3(0, 12, 38);

    offset.applyQuaternion(aircraft.quaternion);

    const desiredPosition = aircraft.position.clone().add(offset);

    camera.position.lerp(
      desiredPosition,
      1 - Math.exp(-4 * dt)
    );

    camera.lookAt(aircraft.position);
  }
}

// ========================================
// WINDOW RESIZING
// ========================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========================================
// MAIN LOOP
// ========================================

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);

  updateFlight(dt);
  updateCamera(dt);

  renderer.render(scene, camera);
}

animate();


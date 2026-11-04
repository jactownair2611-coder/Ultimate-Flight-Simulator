
import * as THREE from "three";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 1000, 10000);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// LIGHTING
const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(500, 1000, 500);
scene.add(sunlight);

scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 1));

// GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20000, 20000),
  new THREE.MeshStandardMaterial({ color: 0x477b38 })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -5;
scene.add(ground);

// RUNWAY
const runway = new THREE.Mesh(
  new THREE.BoxGeometry(100, 1, 1800),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);

runway.position.set(0, 0, -1000);
scene.add(runway);

// RUNWAY CENTER LINE
for (let i = 0; i < 25; i++) {
  const marking = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.5, 35),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  marking.position.set(0, 0.6, -1700 + i * 60);
  scene.add(marking);
}

// AIRCRAFT
const aircraft = new THREE.Group();

// Fuselage
const fuselage = new THREE.Mesh(
  new THREE.CylinderGeometry(1.7, 1.7, 22, 16),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);

fuselage.rotation.x = Math.PI / 2;
aircraft.add(fuselage);

// Wings
const wings = new THREE.Mesh(
  new THREE.BoxGeometry(38, 0.7, 6),
  new THREE.MeshStandardMaterial({ color: 0xdddddd })
);

aircraft.add(wings);

// Tail
const tail = new THREE.Mesh(
  new THREE.BoxGeometry(12, 0.5, 4),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);

tail.position.z = 9;
aircraft.add(tail);

// Vertical stabilizer
const fin = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 5, 4),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);

fin.position.set(0, 2.5, 9);
aircraft.add(fin);

aircraft.position.set(0, 8, 0);
scene.add(aircraft);

// FLIGHT VARIABLES
let speed = 0;
let altitude = 8;
let throttle = 0;
let pitch = 0;
let roll = 0;

const keys = {};

// CONTROLS
window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// RESIZE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// FLIGHT UPDATE
function updateFlight() {
  if (keys["arrowup"]) throttle += 0.4;
  if (keys["arrowdown"]) throttle -= 0.4;

  throttle = THREE.MathUtils.clamp(throttle, 0, 100);

  if (keys["w"]) pitch += 0.0008;
  if (keys["s"]) pitch -= 0.0008;

  if (keys["a"]) roll += 0.001;
  if (keys["d"]) roll -= 0.001;

  pitch *= 0.995;
  roll *= 0.995;

  speed += (throttle * 0.8 - speed * 0.08) * 0.016;
  speed = Math.max(0, speed);

  aircraft.rotation.x = pitch;
  aircraft.rotation.z = roll;

  aircraft.position.y += Math.sin(pitch) * speed * 0.015;

  aircraft.translateZ(-speed * 0.016);

  altitude = aircraft.position.y;

  document.getElementById("speed").textContent =
    "SPEED: " + Math.round(speed) + " KTS";

  document.getElementById("altitude").textContent =
    "ALTITUDE: " + Math.round(altitude * 100) + " FT";

  document.getElementById("throttle").textContent =
    "THROTTLE: " + Math.round(throttle) + "%";
}

// CAMERA
function updateCamera() {
  const offset = new THREE.Vector3(0, 12, 35);
  offset.applyQuaternion(aircraft.quaternion);

  camera.position.copy(aircraft.position).add(offset);
  camera.lookAt(aircraft.position);
}

// MAIN LOOP
function animate() {
  requestAnimationFrame(animate);

  updateFlight();
  updateCamera();

  renderer.render(scene, camera);
}

animate();

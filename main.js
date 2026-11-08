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
// ============================================
// AIRPORT GROUP SYSTEM
// ============================================

const airportGroup = new THREE.Group();
airportGroup.name = "Main Airport";
scene.add(airportGroup);
// ============================================
// AIRPORT REGISTRY
// ============================================

const airports = {
  MAIN: {
    name: "Main International Airport",
    code: "MAIN",
    group: airportGroup
  }
};

let activeAirport = "MAIN";

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
airportGroup.add(runway);

function runwayLine(x, z, width, length) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.04, length),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );

  line.position.set(x, 0.16, z);
  airportGroup.add(line);
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
// VERSION 0.8 - AIRPORT ENVIRONMENT
// ============================================

const airportAsphalt = new THREE.MeshStandardMaterial({
  color: 0x34383d,
  roughness: 0.92
});

const apronMaterial = new THREE.MeshStandardMaterial({
  color: 0x55585c,
  roughness: 0.9
});

const taxiYellow = new THREE.MeshStandardMaterial({
  color: 0xf5c928,
  roughness: 0.8
});

const airportWhite = new THREE.MeshStandardMaterial({
  color: 0xf5f5f0,
  roughness: 0.8
});

const terminalMaterial = new THREE.MeshStandardMaterial({
  color: 0xc6cbd0,
  roughness: 0.85
});

const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0x477d9c,
  metalness: 0.35,
  roughness: 0.25
});

// ============================================
// AIRPORT OBJECT HELPER
// ============================================

function airportBox(width, height, length, material, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, length),
    material
  );

  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;

  airportGroup.add(mesh);

  return mesh;
}

// ============================================
// VERSION 0.8.1 - AIRPORT GENERATOR
// ============================================

function createAirport(config) {

  const airport = new THREE.Group();

  airport.name = config.name;

  airport.position.set(
    config.x || 0,
    0,
    config.z || 0
  );

  function addAirportBox(width, height, length, material, x, y, z) {

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, length),
      material
    );

    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    airport.add(mesh);

    return mesh;
  }

  // RUNWAY
  addAirportBox(
    config.runwayWidth,
    0.25,
    config.runwayLength,
    airportAsphalt,
    0,
    0.125,
    0
  );

  // RUNWAY CENTERLINE
  for (
    let z = -config.runwayLength / 2 + 50;
    z < config.runwayLength / 2 - 30;
    z += 90
  ) {
    addAirportBox(
      0.8, 0.04, 35,
      airportWhite,
      0, 0.16, z
    );
  }

  // RUNWAY EDGE MARKINGS
  for (const x of [
    -config.runwayWidth / 2 + 3,
    config.runwayWidth / 2 - 3
  ]) {
    addAirportBox(
      0.6, 0.04, config.runwayLength,
      airportWhite,
      x, 0.16, 0
    );
  }

  // ============================================
  // RUNWAY THRESHOLD MARKINGS
  // ============================================

  for (const end of [-1, 1]) {

    const thresholdZ =
      end * (config.runwayLength / 2 - 35);

    const stripeCount = Math.floor(
      config.runwayWidth / 5
    );

    for (let i = 0; i < stripeCount; i++) {

      const stripeX =
        -config.runwayWidth / 2 + 5 + i * 5;

      addAirportBox(
        1.5, 0.05, 24,
        airportWhite,
        stripeX, 0.17, thresholdZ
      );
    }
  }

  // ============================================
  // RUNWAY DESIGNATION NUMBERS
  // ============================================

  function addRunwayNumber(number, z) {

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 256, 128);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 100px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(number, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const numberMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(25, 12),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );

    numberMesh.rotation.x = -Math.PI / 2;
    numberMesh.position.set(0, 0.19, z);

    airport.add(numberMesh);
  }

  const runwayNumbers =
    config.runwayNumbers || ["09", "27"];

  addRunwayNumber(
    runwayNumbers[0],
    -config.runwayLength / 2 + 75
  );

  addRunwayNumber(
    runwayNumbers[1],
    config.runwayLength / 2 - 75
  );

  // PARALLEL TAXIWAY
  const taxiwayOffset = config.taxiwayOffset || 65;

  addAirportBox(
    config.taxiwayWidth || 20,
    0.12,
    config.runwayLength,
    airportAsphalt,
    taxiwayOffset,
    0.02,
    0
  );

  // TAXIWAY CENTERLINE
  for (
    let z = -config.runwayLength / 2 + 30;
    z < config.runwayLength / 2;
    z += 35
  ) {
    addAirportBox(
      0.35, 0.04, 16,
      taxiYellow,
      taxiwayOffset, 0.11, z
    );
  }

    // ============================================
  // AIRPORT APRON
  // ============================================

  const apronWidth = config.apronWidth || 180;
  const apronLength = config.apronLength || 260;

  const apronX =
    taxiwayOffset +
    (config.taxiwayWidth || 20) / 2 +
    apronWidth / 2 +
    15;

  addAirportBox(
    apronWidth,
    0.12,
    apronLength,
    apronMaterial,
    apronX,
    0.03,
    0
  );

  // TAXIWAY CONNECTION TO APRON
  addAirportBox(
    15,
    0.12,
    22,
    airportAsphalt,
    taxiwayOffset +
      (config.taxiwayWidth || 20) / 2 +
      7.5,
    0.03,
    0
  );

  // ============================================
  // TERMINAL BUILDING
  // ============================================

  const terminalX = apronX + apronWidth / 2 + 125;

  addAirportBox(
    180,
    18,
    50,
    terminalMaterial,
    terminalX,
    9,
    0
  );

  // TERMINAL WINDOWS
  addAirportBox(
    0.5,
    7,
    40,
    glassMaterial,
    terminalX - 25,
    11,
    0
  );

  // TERMINAL ROOF
  addAirportBox(
    185,
    1,
    55,
    airportWhite,
    terminalX,
    18.5,
    0
  );

  // ============================================
  // JET BRIDGES
  // ============================================

  for (const z of [-65, 65]) {

    addAirportBox(
      90,
      4,
      8,
      terminalMaterial,
      terminalX - 115,
      6,
      z
    );

    // GATE CONNECTOR
    addAirportBox(
      12,
      5,
      12,
      glassMaterial,
      terminalX - 65,
      8,
      z
    );
  }
  
  // ============================================
  // AIRCRAFT PARKING STANDS
  // ============================================

  const gatePositions = [-75, 0, 75];

  gatePositions.forEach((z, index) => {

    const standX = apronX + 10;
    const standWidth = 55;
    const standLength = 48;

    // Parking stand outline
    addAirportBox(
      standWidth, 0.04, 0.7,
      airportWhite,
      standX, 0.12, z - standLength / 2
    );

    addAirportBox(
      standWidth, 0.04, 0.7,
      airportWhite,
      standX, 0.12, z + standLength / 2
    );

    addAirportBox(
      0.7, 0.04, standLength,
      airportWhite,
      standX - standWidth / 2, 0.12, z
    );

    addAirportBox(
      0.7, 0.04, standLength,
      airportWhite,
      standX + standWidth / 2, 0.12, z
    );

    // Aircraft lead-in line
    addAirportBox(
      45, 0.04, 0.8,
      taxiYellow,
      standX, 0.13, z
    );

    // Gate sign texture
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#152b43";
    ctx.fillRect(0, 0, 256, 128);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.strokeRect(5, 5, 246, 118);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GATE " + (index + 1), 128, 64);

    const gateTexture = new THREE.CanvasTexture(canvas);

    const gateSign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 6),
      new THREE.MeshBasicMaterial({
        map: gateTexture,
        side: THREE.DoubleSide
      })
    );

    gateSign.position.set(
      standX + 38,
      4,
      z
    );

    airport.add(gateSign);
  });

  // ============================================
  // AIRPORT LIGHTING SYSTEM
  // ============================================

  const lightingGroup = new THREE.Group();
  lightingGroup.name = "Airport Lighting";
  airport.add(lightingGroup);

  // LIGHT MATERIALS
  const runwayLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff
  });

  const thresholdLightMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff55
  });

  const taxiwayLightMaterial = new THREE.MeshBasicMaterial({
    color: 0x0088ff
  });

  const approachLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff
  });

  function addAirportLight(x, y, z, material, size = 1) {

    const light = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 8),
      material
    );

    light.position.set(x, y, z);
    lightingGroup.add(light);

    return light;
  }

  // RUNWAY EDGE LIGHTS
  for (const x of [
    -config.runwayWidth / 2 - 2,
    config.runwayWidth / 2 + 2
  ]) {

    for (
      let z = -config.runwayLength / 2;
      z <= config.runwayLength / 2;
      z += 60
    ) {

      addAirportLight(
        x, 0.8, z,
        runwayLightMaterial,
        1.2
      );
    }
  }

  // GREEN THRESHOLD LIGHTS
  for (const end of [-1, 1]) {

    const z = end * (
      config.runwayLength / 2 - 5
    );

    for (
      let x = -config.runwayWidth / 2;
      x <= config.runwayWidth / 2;
      x += 5
    ) {

      addAirportLight(
        x, 0.8, z,
        thresholdLightMaterial,
        1.3
      );
    }
  }

  // BLUE TAXIWAY EDGE LIGHTS
  for (const side of [-1, 1]) {

    for (
      let z = -config.runwayLength / 2;
      z <= config.runwayLength / 2;
      z += 55
    ) {

      addAirportLight(
        taxiwayOffset +
          side * ((config.taxiwayWidth || 20) / 2),
        0.65,
        z,
        taxiwayLightMaterial,
        0.9
      );
    }
  }

  // APPROACH LIGHTS
  for (const end of [-1, 1]) {

    for (let i = 1; i <= 12; i++) {

      addAirportLight(
        0,
        0.8,
        end * (
          config.runwayLength / 2 + i * 35
        ),
        approachLightMaterial,
        1.3
      );
    }
  }

  console.log("AIRPORT LIGHTING CREATED");

  scene.add(airport);

  return airport;
}

// ============================================
// AIRPORT GENERATOR TEST
// ============================================

const testAirport = createAirport({
  name: "Generator Test Airport",
  x: 2900,
  z: -1200,
  runwayLength: 1400,
  runwayWidth: 50,
  taxiwayWidth: 22,
  taxiwayOffset: 75
});

console.log("AIRPORT GENERATOR TEST LOADED");

  
// ============================================
// PARALLEL TAXIWAY
// ============================================

airportBox(
  24, 0.12, 2000,
  airportAsphalt,
  75, 0.02, -850
);

// Taxiway centerline
for (let z = 120; z > -1820; z -= 35) {
  airportBox(
    0.35, 0.04, 16,
    taxiYellow,
    75, 0.11, z
  );
}

// Taxiway edge markings
for (const x of [63, 87]) {
  airportBox(
    0.35, 0.04, 2000,
    airportWhite,
    x, 0.11, -850
  );
}

// ============================================
// RUNWAY CONNECTORS
// ============================================

for (const z of [-300, -1400]) {
  airportBox(
    85, 0.12, 22,
    airportAsphalt,
    45, 0.02, z
  );

  airportBox(
    0.35, 0.04, 22,
    taxiYellow,
    45, 0.11, z
  );
}

// ============================================
// AIRCRAFT APRON
// ============================================

airportBox(
  270, 0.14, 540,
  apronMaterial,
  220, 0.025, -850
);

// Apron boundary markings
for (const z of [-580, -1120]) {
  airportBox(
    270, 0.04, 0.5,
    airportWhite,
    220, 0.12, z
  );
}

// ============================================
// AIRCRAFT PARKING STANDS
// ============================================

const gatePositions = [-630, -735, -840, -945, -1050];

for (let i = 0; i < gatePositions.length; i++) {
  const z = gatePositions[i];

  // Stand centerline
  airportBox(
    0.4, 0.04, 95,
    taxiYellow,
    225, 0.13, z
  );

  // Parking stop line
  airportBox(
    45, 0.04, 0.5,
    airportWhite,
    225, 0.13, z - 38
  );

  // Stand number marker
  airportBox(
    1.2, 0.04, 1.2,
    airportWhite,
    205, 0.13, z + 45
  );
}

// ============================================
// TERMINAL BUILDING
// ============================================

airportBox(
  130, 28, 560,
  terminalMaterial,
  435, 14, -850
);

// Glass terminal facade
airportBox(
  1.5, 13, 500,
  glassMaterial,
  369, 19, -850
);

// Terminal roof
airportBox(
  145, 3, 575,
  terminalMaterial,
  435, 29.5, -850
);

// ============================================
// JET BRIDGES
// ============================================

for (const z of gatePositions) {
  airportBox(
    35, 5, 9,
    terminalMaterial,
    350, 12, z
  );

  airportBox(
    3, 8, 11,
    glassMaterial,
    333, 8, z
  );
}

// ============================================
// AIRPORT CONTROL TOWER
// ============================================

// Tower base
airportBox(
  22, 45, 22,
  terminalMaterial,
  535, 22.5, -520
);

// Tower windows
airportBox(
  27, 7, 27,
  glassMaterial,
  535, 47, -520
);

// Tower roof
airportBox(
  30, 3, 30,
  terminalMaterial,
  535, 52, -520
);

console.log("VERSION 0.8 AIRPORT ENVIRONMENT LOADED");

 // ============================================
 // VERSION 0.8.1 - AIRPORT LIGHTING
 // ============================================

const runwayLightMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 3
});

const blueLightMaterial = new THREE.MeshStandardMaterial({
  color: 0x2277ff,
  emissive: 0x2277ff,
  emissiveIntensity: 3
});

const greenLightMaterial = new THREE.MeshStandardMaterial({
  color: 0x22ff77,
  emissive: 0x22ff77,
  emissiveIntensity: 3
});

const redLightMaterial = new THREE.MeshStandardMaterial({
  color: 0xff2222,
  emissive: 0xff2222,
  emissiveIntensity: 3
});

function airportLight(x, y, z, material, size = 0.65) {
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(size, 8, 8),
    material
  );

  light.position.set(x, y, z);
  scene.add(light);

  return light;
}

// ============================================
// RUNWAY EDGE LIGHTS
// ============================================

for (let z = 230; z >= -1930; z -= 40) {
  airportLight(-33, 0.45, z, runwayLightMaterial);
  airportLight(33, 0.45, z, runwayLightMaterial);
}

// ============================================
// RUNWAY THRESHOLD LIGHTS
// ============================================

for (let x = -28; x <= 28; x += 4) {
  airportLight(x, 0.45, 245, greenLightMaterial);
  airportLight(x, 0.45, -1945, redLightMaterial);
}

// ============================================
// TAXIWAY EDGE LIGHTS
// ============================================

for (let z = 220; z >= -1900; z -= 55) {
  airportLight(63, 0.4, z, blueLightMaterial, 0.55);
  airportLight(87, 0.4, z, blueLightMaterial, 0.55);
}

// ============================================
// TAXIWAY CENTERLINE LIGHTS
// ============================================

for (let z = 200; z >= -1900; z -= 75) {
  airportLight(75, 0.3, z, greenLightMaterial, 0.35);
}

// ============================================
// APPROACH LIGHTING
// ============================================

// Lights beyond the first runway end
for (let z = 285; z <= 585; z += 30) {
  airportLight(0, 0.5, z, runwayLightMaterial, 0.7);

  airportLight(-6, 0.5, z, runwayLightMaterial, 0.45);
  airportLight(6, 0.5, z, runwayLightMaterial, 0.45);
}

// Lights beyond the opposite runway end
for (let z = -1980; z >= -2280; z -= 30) {
  airportLight(0, 0.5, z, runwayLightMaterial, 0.7);

  airportLight(-6, 0.5, z, runwayLightMaterial, 0.45);
  airportLight(6, 0.5, z, runwayLightMaterial, 0.45);
}

// ============================================
// TAXIWAY DIRECTION SIGNS
// ============================================

function airportSign(label, x, y, z) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;

  const context = canvas.getContext("2d");

  context.fillStyle = "#075b32";
  context.fillRect(0, 0, 512, 192);

  context.strokeStyle = "#ffffff";
  context.lineWidth = 10;
  context.strokeRect(5, 5, 502, 182);

  context.fillStyle = "#ffffff";
  context.font = "bold 100px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, 256, 96);

  const texture = new THREE.CanvasTexture(canvas);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 3),
    new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0x183d25,
      emissiveIntensity: 0.8
    })
  );

  sign.position.set(x, y, z);
  scene.add(sign);

  airportBox(
    0.3, 2.5, 0.3,
    terminalMaterial,
    x, y - 2.5, z
  );
}

airportSign("A →", 98, 3, -300);
airportSign("B →", 98, 3, -1400);
airportSign("GATE 1", 270, 3, -630);
airportSign("GATE 2", 270, 3, -735);
airportSign("GATE 3", 270, 3, -840);
airportSign("GATE 4", 270, 3, -945);
airportSign("GATE 5", 270, 3, -1050);

console.log("VERSION 0.8.1 AIRPORT LIGHTING LOADED");

// ============================================
// VERSION 0.8.2 - ANIMATED GROUND TRAFFIC
// ============================================

const vehicleMaterials = {
  yellow: new THREE.MeshStandardMaterial({ color: 0xf2bd25 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe8e8e8 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x1766a5 }),
  red: new THREE.MeshStandardMaterial({ color: 0xc83232 }),
  black: new THREE.MeshStandardMaterial({ color: 0x202326 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x72a8c4,
    metalness: 0.3,
    roughness: 0.25
  }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x111111 })
};

const groundVehicles = [];

function vehicleBox(parent, width, height, length, material, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, length),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function vehicleWheels(parent, width, length) {
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-length / 2, length / 2]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.22, 12),
        vehicleMaterials.rubber
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.35, z);
      parent.add(wheel);
    }
  }
}

function createGroundVehicle(type, x, z, speed) {
  const group = new THREE.Group();

  if (type === "baggage") {
    vehicleBox(group, 2.2, 1.1, 3.2,
      vehicleMaterials.yellow, 0, 0.9, 0);

    vehicleBox(group, 1.8, 0.9, 2,
      vehicleMaterials.black, 0, 1.9, -0.4);

    vehicleWheels(group, 2.4, 2.6);

    // Luggage trailer
    vehicleBox(group, 2.5, 0.7, 3,
      vehicleMaterials.black, 0, 0.85, 4.5);

    vehicleBox(group, 2.2, 0.7, 2.5,
      vehicleMaterials.yellow, 0, 1.55, 4.5);

  } else if (type === "fuel") {
    vehicleBox(group, 3, 1.5, 6,
      vehicleMaterials.white, 0, 1.1, 0);

    vehicleBox(group, 2.5, 1.6, 3.8,
      vehicleMaterials.yellow, 0, 2.5, -0.5);

    vehicleBox(group, 2.8, 1.1, 2.2,
      vehicleMaterials.white, 0, 2.8, 1.9);

    vehicleWheels(group, 3.2, 4.8);

  } else if (type === "bus") {
    vehicleBox(group, 3, 2.6, 9,
      vehicleMaterials.blue, 0, 1.8, 0);

    vehicleBox(group, 2.8, 1.1, 7.8,
      vehicleMaterials.glass, 0, 3.2, -0.2);

    vehicleWheels(group, 3.2, 7);

  } else if (type === "pushback") {
    vehicleBox(group, 2.8, 1.1, 3.8,
      vehicleMaterials.yellow, 0, 0.9, 0);

    vehicleBox(group, 2.2, 0.8, 1.8,
      vehicleMaterials.red, 0, 1.8, -0.3);

    vehicleWheels(group, 3, 3);
  }

  group.position.set(x, 0, z);
  scene.add(group);

  groundVehicles.push({
    group,
    speed,
    startZ: -580,
    endZ: -1120
  });
}

// Create airport traffic
createGroundVehicle("baggage", 125, -620, -5);
createGroundVehicle("fuel", 165, -1080, 3.5);
createGroundVehicle("bus", 300, -680, -4);
createGroundVehicle("pushback", 320, -1040, 2.5);

// ============================================
// UPDATE GROUND VEHICLES
// ============================================

function updateGroundVehicles(dt) {
  for (const vehicle of groundVehicles) {
    vehicle.group.position.z += vehicle.speed * dt;

    if (vehicle.group.position.z < vehicle.endZ) {
      vehicle.group.position.z = vehicle.startZ;
    }

    if (vehicle.group.position.z > vehicle.startZ) {
      vehicle.group.position.z = vehicle.endZ;
    }
  }
}

console.log("VERSION 0.8.2 GROUND TRAFFIC LOADED");

 // ============================================
 // VERSION 0.9 - WORLD SCENERY
 // ============================================

const sceneryMaterials = {
  mountain: new THREE.MeshStandardMaterial({
    color: 0x68766c,
    roughness: 1
  }),
  mountainSnow: new THREE.MeshStandardMaterial({
    color: 0xcbd3d5,
    roughness: 1
  }),
  city: new THREE.MeshStandardMaterial({
    color: 0x777e85,
    roughness: 0.9
  }),
  cityDark: new THREE.MeshStandardMaterial({
    color: 0x555d65,
    roughness: 0.9
  }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x527d99,
    metalness: 0.25,
    roughness: 0.3
  }),
  tree: new THREE.MeshStandardMaterial({
    color: 0x315b35,
    roughness: 1
  }),
  trunk: new THREE.MeshStandardMaterial({
    color: 0x59432d
  })
};

// ============================================
// SCENERY BUILDING HELPER
// ============================================

function sceneryBox(width, height, depth, material, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );

  mesh.position.set(x, y + height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  return mesh;
}

// ============================================
// DISTANT MOUNTAINS
// ============================================

function createMountain(x, z, radius, height) {
  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 8),
    sceneryMaterials.mountain
  );

  mountain.position.set(x, height / 2 - 5, z);
  mountain.rotation.y = Math.random() * Math.PI;
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  scene.add(mountain);

  // Snow cap
  if (height > 300) {
    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.23, height * 0.25, 8),
      sceneryMaterials.mountainSnow
    );

    snow.position.set(
      x,
      height * 0.84,
      z
    );

    scene.add(snow);
  }
}

for (let i = 0; i < 18; i++) {
  const x = -4200 + i * 500;

  createMountain(
    x,
    -4200 - Math.random() * 500,
    350 + Math.random() * 250,
    450 + Math.random() * 550
  );

  createMountain(
    x + 200,
    2600 + Math.random() * 500,
    350 + Math.random() * 250,
    400 + Math.random() * 450
  );
}

// ============================================
// CITY SKYLINES
// ============================================

function createCityBlock(centerX, centerZ, buildingCount, spacing) {
  for (let i = 0; i < buildingCount; i++) {
    const x = centerX + (Math.random() - 0.5) * spacing;
    const z = centerZ + (Math.random() - 0.5) * spacing;

    const width = 25 + Math.random() * 45;
    const depth = 25 + Math.random() * 45;
    const height = 25 + Math.random() * 130;

    const material = Math.random() > 0.5
      ? sceneryMaterials.city
      : sceneryMaterials.cityDark;

    sceneryBox(
      width,
      height,
      depth,
      material,
      x,
      0,
      z
    );

    // Glass facade section
    if (Math.random() > 0.55) {
      sceneryBox(
        width * 0.8,
        height * 0.7,
        1,
        sceneryMaterials.glass,
        x,
        height * 0.15,
        z - depth / 2 - 0.6
      );
    }
  }
}

// Cities outside the airport area
createCityBlock(1250, -850, 55, 850);
createCityBlock(-1250, -900, 55, 850);
createCityBlock(1650, -2100, 35, 700);
createCityBlock(-1650, -2100, 35, 700);

// ============================================
// SUBURBAN BUILDINGS
// ============================================

function createSuburbs(centerX, centerZ, count) {
  for (let i = 0; i < count; i++) {
    const x = centerX + (Math.random() - 0.5) * 1100;
    const z = centerZ + (Math.random() - 0.5) * 1100;

    const width = 12 + Math.random() * 15;
    const depth = 12 + Math.random() * 15;
    const height = 7 + Math.random() * 10;

    sceneryBox(
      width,
      height,
      depth,
      sceneryMaterials.city,
      x,
      0,
      z
    );
  }
}

createSuburbs(2300, -700, 90);
createSuburbs(-2300, -700, 90);

// ============================================
// TREES
// ============================================

function createTree(x, z, size = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.5 * size,
      0.8 * size,
      5 * size,
      6
    ),
    sceneryMaterials.trunk
  );

  trunk.position.set(x, 2.5 * size, z);
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(3.5 * size, 9 * size, 7),
    sceneryMaterials.tree
  );

  leaves.position.set(x, 8 * size, z);
  scene.add(leaves);
}

// Tree areas away from the runway and taxiways
for (let i = 0; i < 100; i++) {
  createTree(
    800 + Math.random() * 700,
    -250 + Math.random() * 1000,
    0.8 + Math.random() * 1.5
  );

  createTree(
    -800 - Math.random() * 700,
    -250 + Math.random() * 1000,
    0.8 + Math.random() * 1.5
  );
}

console.log("VERSION 0.9 WORLD SCENERY LOADED");

 // ============================================
 // VERSION 0.9.1 - PROCEDURAL TERRAIN
 // ============================================

const terrainGeometry = new THREE.BufferGeometry();

const terrainSize = 10000;
const terrainSegments = 200;

const terrainVertices = [];
const terrainColors = [];
const terrainIndices = [];

const terrainMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 1,
  metalness: 0
});

// Smooth transition function
function terrainSmoothstep(a, b, value) {
  const t = THREE.MathUtils.clamp(
    (value - a) / (b - a),
    0,
    1
  );

  return t * t * (3 - 2 * t);
}

// Procedural terrain height
function getTerrainHeight(x, z) {
  // Keep the airport and nearby city area flat
  const outsideX = Math.max(Math.abs(x) - 1900, 0);
  const outsideZ = Math.max(
    Math.max(-3000 - z, z - 1500),
    0
  );

  const distanceFromAirport = Math.sqrt(
    outsideX * outsideX +
    outsideZ * outsideZ
  );

  const terrainBlend = terrainSmoothstep(
    300,
    1500,
    distanceFromAirport
  );

  // Rolling hills
  let height =
    Math.sin(x * 0.0018) * 65 +
    Math.cos(z * 0.0015) * 55 +
    Math.sin((x + z) * 0.0022) * 35;

  // Larger distant hills
  const hills = [
    [-3200, -1800, 150, 850],
    [3000, -2500, 180, 1100],
    [-3500, 2500, 130, 750],
    [3500, 3000, 170, 900],
    [0, 4300, 100, 1200]
  ];

  for (const hill of hills) {
    const dx = x - hill[0];
    const dz = z - hill[1];

    const distanceSquared = dx * dx + dz * dz;

    height += hill[2] * Math.exp(
      -distanceSquared / (hill[3] * hill[3])
    );
  }

  // Blend hills smoothly into the flat airport area
  return Math.max(0, height * terrainBlend);
}

// ============================================
// GENERATE TERRAIN GRID
// ============================================

for (let iz = 0; iz <= terrainSegments; iz++) {
  for (let ix = 0; ix <= terrainSegments; ix++) {
    const x =
      (ix / terrainSegments - 0.5) * terrainSize;

    const z =
      (iz / terrainSegments - 0.5) * terrainSize;

    const height = getTerrainHeight(x, z);

    terrainVertices.push(x, height, z);

    // Ground color varies with elevation
    const color = new THREE.Color();

    if (height < 35) {
      color.setRGB(0.25, 0.43, 0.20);
    } else if (height < 100) {
      color.setRGB(0.30, 0.39, 0.20);
    } else if (height < 220) {
      color.setRGB(0.38, 0.37, 0.29);
    } else {
      color.setRGB(0.53, 0.52, 0.46);
    }

    terrainColors.push(color.r, color.g, color.b);
  }
}

// ============================================
// TERRAIN TRIANGLES
// ============================================

for (let iz = 0; iz < terrainSegments; iz++) {
  for (let ix = 0; ix < terrainSegments; ix++) {
    const a = iz * (terrainSegments + 1) + ix;
    const b = a + 1;
    const c = a + terrainSegments + 1;
    const d = c + 1;

    terrainIndices.push(a, c, b);
    terrainIndices.push(b, c, d);
  }
}

terrainGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(terrainVertices, 3)
);

terrainGeometry.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(terrainColors, 3)
);

terrainGeometry.setIndex(terrainIndices);
terrainGeometry.computeVertexNormals();

const terrain = new THREE.Mesh(
  terrainGeometry,
  terrainMaterial
);

terrain.receiveShadow = true;
terrain.frustumCulled = true;
scene.add(terrain);

console.log("VERSION 0.9.1 TERRAIN LOADED");

 // ============================================
 // VERSION 0.9.2 - 3D CLOUD SYSTEM
 // ============================================

const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

// Shared geometry and material keep cloud rendering efficient
const cloudGeometry = new THREE.SphereGeometry(1, 14, 10);

const cloudMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1,
  metalness: 0,
  transparent: true,
  opacity: 0.82,
  depthWrite: false
});

const cloudClusters = [];

// Repeatable random number generator
let cloudSeed = 92841;

function cloudRandom() {
  cloudSeed = (cloudSeed * 16807) % 2147483647;
  return (cloudSeed - 1) / 2147483646;
}

// Create one cloud cluster
function createCloud(x, y, z) {
  const cloud = new THREE.Group();

  const puffCount = 5 + Math.floor(cloudRandom() * 5);

  for (let i = 0; i < puffCount; i++) {
    const puff = new THREE.Mesh(
      cloudGeometry,
      cloudMaterial
    );

    const size = 35 + cloudRandom() * 55;

    puff.scale.set(
      size * (1.2 + cloudRandom() * 0.7),
      size * (0.45 + cloudRandom() * 0.25),
      size * (0.8 + cloudRandom() * 0.6)
    );

    puff.position.set(
      (cloudRandom() - 0.5) * 150,
      (cloudRandom() - 0.5) * 25,
      (cloudRandom() - 0.5) * 100
    );

    puff.castShadow = false;
    puff.receiveShadow = false;

    cloud.add(puff);
  }

  cloud.position.set(x, y, z);

  // Each cluster drifts at a slightly different speed
  cloud.userData.speed = 2 + cloudRandom() * 5;

  cloudClusters.push(cloud);
  cloudGroup.add(cloud);
}

// Generate cloud formations around the world
for (let i = 0; i < 42; i++) {
  const x = (cloudRandom() - 0.5) * 8500;
  const z = (cloudRandom() - 0.5) * 8500;
  const y = 550 + cloudRandom() * 400;

  createCloud(x, y, z);
}

// Slowly move clouds across the sky
function updateClouds(dt) {
  for (const cloud of cloudClusters) {
    cloud.position.x += cloud.userData.speed * dt;

    // Wrap clouds around the scenery
    if (cloud.position.x > 4800) {
      cloud.position.x = -4800;
    }
  }
}

console.log("VERSION 0.9.2 CLOUD SYSTEM LOADED");

// ============================================
// VERSION 0.9.3 - ROADS AND ROAD TRAFFIC
// ============================================

const roadGroup = new THREE.Group();
const roadTrafficGroup = new THREE.Group();

scene.add(roadGroup);
scene.add(roadTrafficGroup);

// Road materials
const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x303238,
  roughness: 0.95
});

const roadLineMaterial = new THREE.MeshStandardMaterial({
  color: 0xe8e3c9,
  roughness: 1
});

// Road geometry
const roadWidth = 16;
const roadHeight = 0.35;

const roadRoutes = [
  [
    [850, -1450],
    [1750, -1450],
    [1750, -350],
    [850, -350]
  ],
  [
    [-2900, -1200],
    [-1900, -1200],
    [-1900, -250],
    [-2900, -250]
  ],
  [
    [2100, 500],
    [3200, 500],
    [3200, 1500],
    [2100, 1500]
  ]
];

// Build roads between route points
function createRoadSegment(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;

  const length = Math.sqrt(dx * dx + dz * dz);
  const middleX = (x1 + x2) / 2;
  const middleZ = (z1 + z2) / 2;

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(
      roadWidth,
      roadHeight,
      length
    ),
    roadMaterial
  );

  road.position.set(
    middleX,
    getTerrainHeight(middleX, middleZ) + roadHeight / 2,
    middleZ
  );

  road.rotation.y = Math.atan2(dx, dz);
  road.receiveShadow = true;

  roadGroup.add(road);

  // Dashed center markings
  const dashCount = Math.floor(length / 35);

  for (let i = 0; i < dashCount; i++) {
    const t = (i + 0.5) / dashCount;

    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.06, 12),
      roadLineMaterial
    );

    const x = x1 + dx * t;
    const z = z1 + dz * t;

    dash.position.set(
      x,
      getTerrainHeight(x, z) + roadHeight + 0.04,
      z
    );

    dash.rotation.y = Math.atan2(dx, dz);
    roadGroup.add(dash);
  }
}

// Prepare traffic routes
const preparedRoadRoutes = [];

for (const points of roadRoutes) {
  const route = {
    points: points,
    lengths: [],
    totalLength: 0
  };

  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;

    const dx = points[next][0] - points[i][0];
    const dz = points[next][1] - points[i][1];

    const length = Math.sqrt(dx * dx + dz * dz);

    route.lengths.push(length);
    route.totalLength += length;

    createRoadSegment(
      points[i][0],
      points[i][1],
      points[next][0],
      points[next][1]
    );
  }

  preparedRoadRoutes.push(route);
}

// ============================================
// TRAFFIC VEHICLES
// ============================================

const trafficCars = [];

const carColors = [
  0xc52b2b,
  0xeeeeee,
  0x202a38,
  0x315d9b,
  0xd4bd72,
  0x43835c
];

function createRoadCar(color) {
  const car = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.65,
    metalness: 0.15
  });

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x263b4d,
    roughness: 0.3,
    metalness: 0.2
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.8, 4.3),
    bodyMaterial
  );

  body.position.y = 0.85;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.75, 2.1),
    windowMaterial
  );

  cabin.position.set(0, 1.55, -0.15);
  car.add(cabin);

  const wheelGeometry = new THREE.CylinderGeometry(
    0.48, 0.48, 0.32, 10
  );

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x151515,
    roughness: 1
  });

  for (const x of [-1.12, 1.12]) {
    for (const z of [-1.35, 1.35]) {
      const wheel = new THREE.Mesh(
        wheelGeometry,
        wheelMaterial
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.42, z);
      car.add(wheel);
    }
  }

  // Headlights
  const headlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff4cf
  });

  for (const x of [-0.72, 0.72]) {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.2, 0.08),
      headlightMaterial
    );

    light.position.set(x, 0.95, 2.17);
    car.add(light);
  }

  car.traverse(object => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });

  return car;
}

// Place cars around the road loops
for (let r = 0; r < preparedRoadRoutes.length; r++) {
  const route = preparedRoadRoutes[r];

  for (let i = 0; i < 4; i++) {
    const car = createRoadCar(
      carColors[(r * 4 + i) % carColors.length]
    );

    roadTrafficGroup.add(car);

    trafficCars.push({
      mesh: car,
      route: route,
      distance: (route.totalLength / 4) * i,
      speed: 12 + Math.random() * 7
    });
  }
}

// Find a position along a closed road route
function getRoadRoutePosition(route, distance) {
  let remaining = distance % route.totalLength;

  for (let i = 0; i < route.points.length; i++) {
    const next = (i + 1) % route.points.length;
    const length = route.lengths[i];

    if (remaining <= length) {
      const t = remaining / length;

      const x1 = route.points[i][0];
      const z1 = route.points[i][1];

      const x2 = route.points[next][0];
      const z2 = route.points[next][1];

      return {
        x: THREE.MathUtils.lerp(x1, x2, t),
        z: THREE.MathUtils.lerp(z1, z2, t),
        angle: Math.atan2(x2 - x1, z2 - z1)
      };
    }

    remaining -= length;
  }

  return null;
}

// Update road traffic
function updateRoadTraffic(dt) {
  for (const traffic of trafficCars) {
    traffic.distance += traffic.speed * dt;

    const position = getRoadRoutePosition(
      traffic.route,
      traffic.distance
    );

    if (!position) continue;

    traffic.mesh.position.set(
      position.x,
      getTerrainHeight(position.x, position.z) + roadHeight,
      position.z
    );

    traffic.mesh.rotation.y = position.angle;
  }
}

console.log("VERSION 0.9.3 ROADS AND TRAFFIC LOADED");

 // ============================================
 // VERSION 0.9.4 - DYNAMIC DAY/NIGHT CYCLE
 // ============================================

// In-game clock
let simulatorTime = 10;

const secondsPerGameHour = 10;

// Lighting
const cycleAmbientLight = new THREE.HemisphereLight(
  0xb8d7ff,
  0x41402f,
  1
);

scene.add(cycleAmbientLight);

const cycleSunLight = new THREE.DirectionalLight(
  0xffffff,
  2
);

cycleSunLight.position.set(0, 3000, 0);
cycleSunLight.castShadow = false;

scene.add(cycleSunLight);

// Sun
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(90, 24, 16),
  new THREE.MeshBasicMaterial({
    color: 0xffe6a3
  })
);

scene.add(sunMesh);

// Moon
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(65, 24, 16),
  new THREE.MeshBasicMaterial({
    color: 0xdce6f5
  })
);

scene.add(moonMesh);

// Sky colors
const cycleNightColor = new THREE.Color(0x09152d);
const cycleDawnColor = new THREE.Color(0xe99b79);
const cycleDayColor = new THREE.Color(0x87bce8);
const cycleDuskColor = new THREE.Color(0xc97864);

const cycleSkyColor = new THREE.Color();

// ============================================
// NIGHT SKY STARS
// ============================================

const starPositions = [];

let starSeed = 73921;

function starRandom() {
  starSeed = (starSeed * 16807) % 2147483647;
  return (starSeed - 1) / 2147483646;
}

for (let i = 0; i < 350; i++) {
  const angle = starRandom() * Math.PI * 2;
  const height = starRandom() * 0.9 + 0.1;

  const radius = 4800;

  starPositions.push(
    Math.cos(angle) * radius,
    height * radius,
    Math.sin(angle) * radius
  );
}

const starGeometry = new THREE.BufferGeometry();

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPositions, 3)
);

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 13,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0
});

const starField = new THREE.Points(
  starGeometry,
  starMaterial
);

scene.add(starField);

// ============================================
// DAY/NIGHT UPDATE
// ============================================

function updateDayNight(dt) {
  simulatorTime += dt / secondsPerGameHour;

  if (simulatorTime >= 24) {
    simulatorTime -= 24;
  }

  // Sun rises at 06:00 and sets at 18:00
  const sunAngle =
    ((simulatorTime - 6) / 12) * Math.PI;

  const sunHeight = Math.sin(sunAngle);

  const daylight = THREE.MathUtils.clamp(
    sunHeight,
    0,
    1
  );

  // Position the sun
  const skyRadius = 4200;

  sunMesh.position.set(
    Math.cos(sunAngle) * skyRadius,
    sunHeight * 3200,
    -1200
  );

  // Position the moon opposite the sun
  moonMesh.position.set(
    -sunMesh.position.x,
    -sunMesh.position.y,
    -1200
  );

  sunMesh.visible = sunHeight > 0;
  moonMesh.visible = sunHeight <= 0;

  // Move directional light with the sun
  cycleSunLight.position.copy(sunMesh.position);

  // Sunrise and sunset colors
  const sunriseAmount = Math.exp(
    -Math.pow((simulatorTime - 6) / 1.5, 2)
  );

  const sunsetAmount = Math.exp(
    -Math.pow((simulatorTime - 18) / 1.5, 2)
  );

  // Blend night into daytime
  cycleSkyColor.copy(cycleNightColor).lerp(
    cycleDayColor,
    daylight
  );

  // Add warm sunrise/sunset colors
  cycleSkyColor.lerp(
    cycleDawnColor,
    sunriseAmount * 0.8
  );

  cycleSkyColor.lerp(
    cycleDuskColor,
    sunsetAmount * 0.8
  );

  scene.background.copy(cycleSkyColor);

  if (scene.fog) {
    scene.fog.color.copy(cycleSkyColor);
  }

  // Adjust world lighting
  cycleAmbientLight.intensity =
    0.12 + daylight * 0.95;

  cycleSunLight.intensity =
    0.05 + daylight * 2.0;

  starMaterial.opacity =
    1 - daylight;
}

// ============================================
// MANUAL TIME CONTROL
// ============================================

// Press [ to move time backward
// Press ] to move time forward

window.addEventListener("keydown", (event) => {
  if (event.key === "[") {
    simulatorTime -= 1;

    if (simulatorTime < 0) {
      simulatorTime += 24;
    }
  }

  if (event.key === "]") {
    simulatorTime += 1;

    if (simulatorTime >= 24) {
      simulatorTime -= 24;
    }
  }
});

console.log("VERSION 0.9.4 DAY NIGHT CYCLE LOADED");

// ============================================
// VERSION 1.0 - DYNAMIC WEATHER SYSTEM
// ============================================

const weatherModes = [
  "clear",
  "cloudy",
  "rain",
  "storm"
];

let currentWeather = 0;

let weatherWindX = 0;
let weatherWindZ = 0;
// Weather flight physics
const weatherWindVector = new THREE.Vector3();
const weatherAirVelocity = new THREE.Vector3();

let weatherPhysicsTime = 0;
// Rain particle system
const rainCount = 1200;
const rainPositions = new Float32Array(rainCount * 6);

const rainVelocities = [];

for (let i = 0; i < rainCount; i++) {
  const x = (Math.random() - 0.5) * 700;
  const y = Math.random() * 400;
  const z = (Math.random() - 0.5) * 700;

  const index = i * 6;

  // Start and end of each rain streak
  rainPositions[index] = x;
  rainPositions[index + 1] = y;
  rainPositions[index + 2] = z;

  rainPositions[index + 3] = x;
  rainPositions[index + 4] = y - 18;
  rainPositions[index + 5] = z;

  rainVelocities.push({
    x: x,
    y: y,
    z: z
  });
}

const rainGeometry = new THREE.BufferGeometry();

rainGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(rainPositions, 3)
);

const rainMaterial = new THREE.LineBasicMaterial({
  color: 0xc9e4ff,
  transparent: true,
  opacity: 0.55
});

const rainSystem = new THREE.LineSegments(
  rainGeometry,
  rainMaterial
);

rainSystem.visible = false;
rainSystem.frustumCulled = false;

scene.add(rainSystem);

// ============================================
// WEATHER SETTINGS
// ============================================

function setWeather(mode) {
  currentWeather = weatherModes.indexOf(mode);

  if (currentWeather < 0) {
    currentWeather = 0;
  }

  weatherWindX = 0;
  weatherWindZ = 0;

  switch (mode) {
    case "clear":
      rainSystem.visible = false;
      cloudMaterial.opacity = 0.35;

      if (scene.fog) {
        scene.fog.near = 1800;
        scene.fog.far = 9000;
      }
      break;

    case "cloudy":
      rainSystem.visible = false;
      cloudMaterial.opacity = 0.9;

      if (scene.fog) {
        scene.fog.near = 1200;
        scene.fog.far = 6500;
      }
      break;

    case "rain":
      rainSystem.visible = true;
      rainMaterial.opacity = 0.55;
      cloudMaterial.opacity = 0.95;

      weatherWindX = 12;
      weatherWindZ = 5;

      if (scene.fog) {
        scene.fog.near = 500;
        scene.fog.far = 3500;
      }
      break;

    case "storm":
      rainSystem.visible = true;
      rainMaterial.opacity = 0.85;
      cloudMaterial.opacity = 1;

      weatherWindX = 28;
      weatherWindZ = 14;

      if (scene.fog) {
        scene.fog.near = 250;
        scene.fog.far = 2000;
      }
      break;
  }

  console.log("WEATHER:", mode.toUpperCase());
}

// ============================================
// RAIN MOVEMENT
// ============================================

function updateRain(dt) {
  if (!rainSystem.visible) return;

  // Keep rain around the aircraft
  rainSystem.position.copy(aircraft.position);

  for (let i = 0; i < rainCount; i++) {
    const particle = rainVelocities[i];

    particle.x -= weatherWindX * dt;
    particle.y -= 300 * dt;
    particle.z -= weatherWindZ * dt;

    // Recycle rain above the aircraft
    if (particle.y < -40) {
      particle.y = 400 + Math.random() * 100;
      particle.x = (Math.random() - 0.5) * 700;
      particle.z = (Math.random() - 0.5) * 700;
    }

    // Keep particles inside the weather area
    if (particle.x < -350) particle.x += 700;
    if (particle.x > 350) particle.x -= 700;

    if (particle.z < -350) particle.z += 700;
    if (particle.z > 350) particle.z -= 700;

    const index = i * 6;

    rainPositions[index] = particle.x;
    rainPositions[index + 1] = particle.y;
    rainPositions[index + 2] = particle.z;

    rainPositions[index + 3] =
      particle.x - weatherWindX * 0.035;

    rainPositions[index + 4] =
      particle.y - 18;

    rainPositions[index + 5] =
      particle.z - weatherWindZ * 0.035;
  }

  rainGeometry.attributes.position.needsUpdate = true;
}

// ============================================
// WEATHER CONTROL
// ============================================

// Press Y to cycle through weather conditions
window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  if (event.key.toLowerCase() === "y") {
    currentWeather++;

    if (currentWeather >= weatherModes.length) {
      currentWeather = 0;
    }

    setWeather(weatherModes[currentWeather]);
  }
});

// Start with clear weather
setWeather("clear");

console.log("VERSION 1.0 WEATHER SYSTEM LOADED");


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

    // Keep the cockpit, remove the backup exterior.
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

    // Set cockpit visibility.
    const cockpit = aircraft.getObjectByName("cockpit-interior");

    if (cockpit) {
      cockpit.visible = cockpitCamera;
    }
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
// ============================================
// VERSION 1.0.2 - A320 AUTOPILOT
// ============================================

const autopilot = {
  enabled: false,
  targetHeading: 0,
  targetAltitude: GROUND_Y
};

console.log("VERSION 1.0.2 AUTOPILOT LOADED");
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

    const cockpit = aircraft.getObjectByName("cockpit-interior");

    if (cockpit) {
      cockpit.visible = cockpitCamera;
    }
  }
  if (event.key.toLowerCase() === "r") {
    resetAircraft();
  }
    // AUTOPILOT MASTER SWITCH
  if (event.key.toLowerCase() === "p") {
    if (!airborne) {
      console.log("AP1: Engage after takeoff.");
      return;
    }

    autopilot.enabled = !autopilot.enabled;

    if (autopilot.enabled) {
      autopilot.targetHeading = yaw;
      autopilot.targetAltitude = aircraft.position.y;

      console.log("AP1 ENGAGED");
    } else {
      console.log("AP1 DISENGAGED");
    }
  }

  // HEADING SELECTOR
  if (event.key.toLowerCase() === "j" && autopilot.enabled) {
    autopilot.targetHeading -= THREE.MathUtils.degToRad(5);
  }

  if (event.key.toLowerCase() === "k" && autopilot.enabled) {
    autopilot.targetHeading += THREE.MathUtils.degToRad(5);
  }

  // ALTITUDE SELECTOR
  if (event.key.toLowerCase() === "n" && autopilot.enabled) {
    autopilot.targetAltitude -= 500 / 3.28084;
  }

  if (event.key.toLowerCase() === "m" && autopilot.enabled) {
    autopilot.targetAltitude += 500 / 3.28084;
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
 autopilot.enabled = false;
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
// WEATHER FLIGHT PHYSICS
const weatherWindVelocity = new THREE.Vector3();
let weatherTurbulenceClock = 0;

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
  // ============================================
// AUTOPILOT FLIGHT CONTROL
// ============================================

if (autopilot.enabled) {

  // HEADING HOLD
  const headingError = Math.atan2(
    Math.sin(autopilot.targetHeading - yaw),
    Math.cos(autopilot.targetHeading - yaw)
  );

  rollTarget = THREE.MathUtils.clamp(
    headingError * 1.5,
    -0.35,
    0.35
  );

  // ALTITUDE HOLD
  const altitudeError =
    autopilot.targetAltitude - aircraft.position.y;

  pitchTarget = THREE.MathUtils.clamp(
    altitudeError * 0.0012 - velocity.y * 0.035,
    -0.12,
    0.20
  );

} else {

  // MANUAL FLIGHT CONTROLS
  pitchTarget += pitchInput * dt * 2.0;
  rollTarget += rollInput * dt * 0.85;

  if (pitchInput === 0) {
    pitchTarget = approach(pitchTarget, 0, dt * 0.08);
  }

  if (rollInput === 0) {
    rollTarget = approach(rollTarget, 0, dt * 0.22);
  }

  pitchTarget = THREE.MathUtils.clamp(
    pitchTarget, -0.15, 0.35
  );

  rollTarget = THREE.MathUtils.clamp(
    rollTarget, -0.75, 0.75
  );
}
  pitch = approach(pitch, pitchTarget, dt * 2.8);
 if (keys["w"]) {
  console.log(
    "W HELD | Pitch:",
    THREE.MathUtils.radToDeg(pitch).toFixed(2),
    "| Target:",
    THREE.MathUtils.radToDeg(pitchTarget).toFixed(2),
    "| AoA:",
    THREE.MathUtils.radToDeg(angleOfAttack).toFixed(2)
  );
}
  roll = approach(roll, rollTarget, dt * 2.4);

  // WEATHER WIND
  weatherWindVelocity.set(0, 0, 0);

  if (airborne) {
    weatherWindVelocity.set(
      weatherWindX,
      0,
      weatherWindZ
    );
  }

  // AIR-RELATIVE VELOCITY
  weatherAirVelocity.copy(velocity);
  weatherAirVelocity.sub(weatherWindVelocity);

  speed = weatherAirVelocity.length();

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

  // THRUST
  const thrustAcceleration =
    (enginePower * MAX_THRUST) / MASS;

  acceleration.set(0, 0, 0);
  acceleration.addScaledVector(forward, thrustAcceleration);

  // ANGLE OF ATTACK
  let flightPathAngle = 0;

  if (speed > 1) {
    flightPathAngle = Math.atan2(
      weatherAirVelocity.y,
      Math.sqrt(
        weatherAirVelocity.x ** 2 +
        weatherAirVelocity.z ** 2
      )
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

    windDirection.copy(weatherAirVelocity).normalize();

    acceleration.addScaledVector(
      windDirection,
      -drag
    );

    // LIFT DIRECTION
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

  // WEATHER TURBULENCE
  if (airborne && currentWeather >= 2) {
    weatherTurbulenceClock += dt;

    const turbulenceStrength =
      currentWeather === 3 ? 2.0 : 0.55;

    const turbulenceX =
      Math.sin(weatherTurbulenceClock * 2.7) *
      Math.sin(weatherTurbulenceClock * 0.8);

    const turbulenceY =
      Math.sin(weatherTurbulenceClock * 3.8) *
      Math.cos(weatherTurbulenceClock * 1.2);

    const turbulenceZ =
      Math.cos(weatherTurbulenceClock * 2.1) *
      Math.sin(weatherTurbulenceClock * 0.7);

    acceleration.x += turbulenceX * turbulenceStrength;
    acceleration.y += turbulenceY * turbulenceStrength;
    acceleration.z += turbulenceZ * turbulenceStrength;
  }

  // WING FLEX RESPONSE
  const loadFactor = Math.max(0, lift / GRAVITY);

  const flexTarget =
    (airborne || speed > 50)
      ? THREE.MathUtils.clamp(
          (loadFactor - 0.15) / 1.5,
          0,
          1
        )
      : 0;

  wingFlexAmount = approach(
    wingFlexAmount,
    flexTarget,
    dt * 0.8
  );

  // GRAVITY
  if (airborne) {
    acceleration.y -= GRAVITY;
  } else {
    acceleration.y = 0;
    velocity.y = 0;
  }

  // UPDATE VELOCITY
  velocity.addScaledVector(acceleration, dt);

  // TAKEOFF TRANSITION
  // GROUND-TO-AIR TRANSITION
if (!airborne) {
  aircraft.position.y = GROUND_Y;
  velocity.y = 0;

  const takeoffReady =
    speed >= TAKEOFF_SPEED &&
    pitch >= 0.04 &&
    lift > GRAVITY;

  if (takeoffReady) {
    airborne = true;

    // Give the aircraft an initial upward velocity.
    velocity.y = Math.max(4.0, (lift - GRAVITY) * 0.5);

    console.log("A320 LIFTOFF!", {
      speed,
      pitch,
      lift,
      verticalVelocity: velocity.y
    });
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

  speed = weatherAirVelocity.length();
  verticalSpeed = velocity.y;
}
// ============================================
// CAMERA
// ============================================

const chaseOffset = new THREE.Vector3(0, 12, 35);
const cameraTarget = new THREE.Vector3();


function updateCamera() {
  if (cockpitCamera) {
    const cockpit = aircraft.getObjectByName("cockpit-interior");

    if (cockpit) {
      cockpit.visible = true;
      aircraft.updateMatrixWorld(true);

      // Captain's eye position
      const eyePosition = cockpit.localToWorld(
        new THREE.Vector3(-0.85, 1.25, -11.8)
      );

      // View direction through the windshield
      const lookPosition = cockpit.localToWorld(
        new THREE.Vector3(-0.85, 1.1, -35)
      );

      camera.position.copy(eyePosition);

      camera.up.set(0, 1, 0).applyQuaternion(
        cockpit.getWorldQuaternion(new THREE.Quaternion())
      );

      camera.lookAt(lookPosition);
      return;
    }
  }

  // External chase camera
  camera.up.set(0, 1, 0);

  const offset = chaseOffset.clone()
    .applyQuaternion(aircraft.quaternion);

  camera.position.copy(aircraft.position).add(offset);

  cameraTarget.copy(aircraft.position);
  cameraTarget.y += 2;

  camera.lookAt(cameraTarget);
}


// ============================================
// HUD
// ============================================
  

function updateHUD() {
  const heading =
    (THREE.MathUtils.radToDeg(yaw) + 360) % 360;

  const values = {
    pitch: `${THREE.MathUtils.radToDeg(pitch).toFixed(1)}°`,
    speed: `${Math.round(speed * 1.94384)} kt`,
    altitude: `${Math.round(aircraft.position.y * 3.28084)} ft`,
    throttle: `${Math.round(throttle * 100)}%`,
    heading: `${Math.round(heading)}°`,
    vertical: `${Math.round(verticalSpeed * 196.85)} ft/min`,
    gear: " DOWN",
    flaps: flaps ? " EXTENDED" : " UP",
    aoa: `${THREE.MathUtils.radToDeg(angleOfAttack).toFixed(1)}°`
  };

  // Update the existing simulator HUD
  for (const [id, value] of Object.entries(values)) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  // Update A320 cockpit displays
  if (fallbackAircraft.userData.updateCockpitDisplays) {
    fallbackAircraft.userData.updateCockpitDisplays({
      speed: speed * 1.94384,
      altitude: aircraft.position.y * 3.28084,
      pitch: THREE.MathUtils.radToDeg(pitch),
      roll: THREE.MathUtils.radToDeg(roll),
      verticalSpeed: verticalSpeed * 196.85,
heading: heading
    });
  }
}
  
    // Update A320 cockpit displays
  if (fallbackAircraft.userData.updateCockpitDisplays) {
    fallbackAircraft.userData.updateCockpitDisplays({
      speed: speed * 1.94384,
      altitude: aircraft.position.y * 3.28084,
      pitch: THREE.MathUtils.radToDeg(pitch),
      roll: THREE.MathUtils.radToDeg(roll),
      verticalSpeed: verticalSpeed * 196.85
    });
  }
// ============================================
// MAIN LOOP
// ============================================


function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.04);

  updateFlight(dt);
updateWingFlex(dt);
updateGroundVehicles(dt);
updateClouds(dt);
updateRoadTraffic(dt);
updateDayNight(dt);
updateRain(dt);
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

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

// Airport object helper
function airportBox(width, height, length, material, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, length),
    material
  );

  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);

  return mesh;
}

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
    const cockpit = aircraft.getObjectByName("cockpit-interior");

    if (cockpit) {
      aircraft.updateMatrixWorld(true);

      // Pilot eye position, relative to the cockpit
      const eyePosition = cockpit.localToWorld(
        new THREE.Vector3(0, 0.9, -11.6)
      );

      // Look forward through the windshield
      const lookPosition = cockpit.localToWorld(
        new THREE.Vector3(0, 0.7, -40)
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
updateGroundVehicles(dt);

  // IMPORTANT: Update the camera every frame
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

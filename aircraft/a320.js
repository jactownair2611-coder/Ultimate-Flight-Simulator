
export function createA320(THREE) {
  const plane = new THREE.Group();

  // Materials
  const white = new THREE.MeshStandardMaterial({
    color: 0xf2f3f5,
    roughness: 0.48,
    metalness: 0.12
  });

  const grey = new THREE.MeshStandardMaterial({
    color: 0x858b91,
    metalness: 0.65,
    roughness: 0.35
  });

  const dark = new THREE.MeshStandardMaterial({
    color: 0x172536,
    roughness: 0.25,
    metalness: 0.25
  });

  const engineMaterial = new THREE.MeshStandardMaterial({
    color: 0x343a40,
    metalness: 0.55,
    roughness: 0.4
  });

  const black = new THREE.MeshStandardMaterial({ color: 0x080d14 });

  // Helper for adding objects
  function addMesh(geometry, material, x, y, z, parent = plane) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Main fuselage: nose points toward -Z
  const body = addMesh(
    new THREE.CylinderGeometry(1.65, 1.65, 29, 32),
    white, 0, 0, 0
  );
  body.name = "fuselage";
  body.rotation.x = Math.PI / 2;

  // Rounded nose
  const nose = addMesh(
    new THREE.SphereGeometry(1.62, 32, 20),
    white, 0, 0, -14.3
  );
  nose.name = "nose";
  nose.scale.set(1, 0.88, 1.25);

  const noseTip = addMesh(
  new THREE.SphereGeometry(0.16, 16, 12),
  grey, 0, 0, -16.2
);
noseTip.name = "noseTip";

  // Rear fuselage taper
  const tailCone = addMesh(
    new THREE.ConeGeometry(1.55, 3.2, 32),
    white, 0, 0, 16
  );
  tailCone.rotation.x = -Math.PI / 2;

  // Cockpit windows
  for (let i = 0; i < 3; i++) {
    const window = addMesh(
      new THREE.SphereGeometry(0.23, 16, 12),
      dark,
      (i - 1) * 0.48,
      1.35,
      -14.6
    );
    window.scale.set(1, 0.5, 0.65);
  }

  // Passenger windows on both sides
  for (let side of [-1, 1]) {
    for (let i = 0; i < 25; i++) {
      const z = -11.5 + i * 0.95;
      const window = addMesh(
        new THREE.SphereGeometry(0.105, 10, 8),
        dark,
        side * 1.62,
        0.35,
        z
      );
      window.scale.set(0.45, 1, 1);
    }
  }

  // Wing builder
  function makeWing(side) {
    const shape = new THREE.Shape();

    shape.moveTo(0, -2);
    shape.lineTo(side * 15.5, 1.2);
    shape.lineTo(side * 15.5, 3.8);
    shape.lineTo(side * 5.2, 6.1);
    shape.lineTo(0, 5.2);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.06
    });

    geometry.rotateX(Math.PI / 2);

    const wing = addMesh(geometry, white, 0, -0.05, 0);
    wing.castShadow = true;

    // Winglet at the outer tip
    const winglet = addMesh(
      new THREE.BoxGeometry(0.22, 1.7, 2.1),
      white,
      side * 15.3,
      0.85,
      2.1
    );
    winglet.rotation.z = side * -0.08;
  }

  makeWing(1);
  makeWing(-1);

  // Engine builder
  function makeEngine(x) {
    const engine = new THREE.Group();
    plane.add(engine);

    const nacelle = addMesh(
      new THREE.CylinderGeometry(0.85, 0.95, 5.2, 32),
      engineMaterial, 0, 0, 0, engine
    );
    nacelle.rotation.x = Math.PI / 2;

    // Front inlet
    const inlet = addMesh(
      new THREE.TorusGeometry(0.82, 0.09, 12, 32),
      grey, 0, 0, -2.55, engine
    );

    // Dark fan opening
    const fan = addMesh(
      new THREE.CircleGeometry(0.75, 32),
      black, 0, 0, -2.57, engine
    );

    // Rear exhaust
    addMesh(
      new THREE.TorusGeometry(0.72, 0.08, 12, 32),
      grey, 0, 0, 2.6, engine
    );

    engine.position.set(x, -1.55, 0.5);
  }

  makeEngine(-6.1);
  makeEngine(6.1);

  // Horizontal tailplanes
  for (const side of [-1, 1]) {
    const tail = addMesh(
      new THREE.BoxGeometry(6.8, 0.2, 2.7),
      white,
      side * 2.8,
      0.15,
      13.1
    );
    tail.rotation.y = side * -0.04;
  }

  // Vertical stabilizer
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0, 6.3);
  finShape.lineTo(2.8, 5.1);
  finShape.lineTo(5.2, 0);
  finShape.closePath();

  const finGeometry = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.3,
    bevelEnabled: false
  });

  finGeometry.rotateY(-Math.PI / 2);

  addMesh(finGeometry, white, 0.15, 0, 12.8);

  // Landing gear helper
  function makeWheel(x, y, z, radius = 0.55) {
    const wheel = addMesh(
      new THREE.CylinderGeometry(radius, radius, 0.3, 20),
      black, x, y, z
    );
    wheel.rotation.z = Math.PI / 2;

    const hub = addMesh(
      new THREE.CylinderGeometry(radius * 0.35, radius * 0.35, 0.32, 16),
      grey, x, y, z
    );
    hub.rotation.z = Math.PI / 2;
  }

  // Nose landing gear
  addMesh(
    new THREE.CylinderGeometry(0.09, 0.09, 2.2, 12),
    grey, 0, -2.2, -11.5
  );
  makeWheel(-0.38, -3.2, -11.5, 0.42);
  makeWheel(0.38, -3.2, -11.5, 0.42);

  // Main landing gear
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.CylinderGeometry(0.13, 0.13, 2.3, 12),
      grey, side * 4.1, -2.1, 3
    );

    makeWheel(side * 3.8, -3.25, 2.8);
    makeWheel(side * 4.4, -3.25, 2.8);
  }

  // Wing navigation lights
  addMesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0x660000
    }),
    -15.4, 0, 2.3
  );

  addMesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0x33ff66,
      emissive: 0x006622
    }),
    15.4, 0, 2.3
  );

  // ============================================
  // VERSION 0.5 - A320 COCKPIT
  // ============================================

  const cockpit = new THREE.Group();
cockpit.name = "cockpit-interior";
  plane.add(cockpit);

  const cockpitPanel = new THREE.MeshStandardMaterial({
    color: 0x202a32,
    roughness: 0.8
  });

  const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0x07131c,
    emissive: 0x061c28,
    roughness: 0.3
  });

  const screenGreen = new THREE.MeshStandardMaterial({
    color: 0x45e5a0,
    emissive: 0x145b40
  });

  const screenBlue = new THREE.MeshStandardMaterial({
    color: 0x35a9ef,
    emissive: 0x123d65
  });

  const screenWhite = new THREE.MeshStandardMaterial({
    color: 0xe7f4ff,
    emissive: 0x405060
  });

  function cockpitBox(w, h, d, material, x, y, z) {
    return addMesh(
      new THREE.BoxGeometry(w, h, d),
      material,
      x, y, z,
      cockpit
    );
  }

  // Main instrument dashboard
  cockpitBox(
    4.4, 0.65, 0.55,
    cockpitPanel,
    0, 0.35, -16.6
  );

  // Dashboard upper edge
  cockpitBox(
    4.5, 0.12, 0.6,
    grey,
    0, 0.75, -16.55
  );

  // Display builder
  function makeDisplay(x, y, width, height, type) {

  // Display frame
  cockpitBox(
    width + 0.16,
    height + 0.16,
    0.12,
    cockpitPanel,
    x, y, -16.25
  );

  // Create canvas for the display
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");

  // Create display texture
  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide
  });

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    material
  );

  screen.position.set(x, y, -16.18);
  cockpit.add(screen);

  // Save screen so we can update it later
  cockpitDisplayScreens.push({
    canvas,
    ctx,
    texture,
    type
  });

  // Initial screen background
  ctx.fillStyle = "#071522";
  ctx.fillRect(0, 0, 512, 512);

  if (type === "PFD") {

    // Artificial horizon
    ctx.fillStyle = "#1684bd";
    ctx.fillRect(0, 100, 512, 150);

    ctx.fillStyle = "#8b542d";
    ctx.fillRect(0, 250, 512, 150);

    // Horizon line
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 250);
    ctx.lineTo(512, 250);
    ctx.stroke();

    // Aircraft reference symbol
    ctx.strokeStyle = "#ffd84a";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(175, 250);
    ctx.lineTo(225, 250);
    ctx.lineTo(256, 270);
    ctx.lineTo(287, 250);
    ctx.lineTo(337, 250);
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 27px Arial";
    ctx.fillText("SPD", 20, 45);
    ctx.fillText("ALT", 415, 45);
    ctx.fillText("HDG", 220, 475);

  } else {

    // Basic navigation display background
    ctx.strokeStyle = "#00c878";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(256, 256, 150, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.fillText(type, 20, 45);
  }

  texture.needsUpdate = true;

  // Captain's displays
  makeDisplay(-1.05, 0.35, 1.15, 0.8, "PFD");
  makeDisplay(0.15, 0.35, 1.15, 0.8, "ND");

  // First officer's displays
  makeDisplay(1.35, 0.35, 1.05, 0.8, "PFD");

  // Center pedestal
  cockpitBox(
    1.8, 0.35, 2.0,
    cockpitPanel,
    0, -0.2, -14.8
  );

  // Throttle levers
  for (const x of [-0.25, 0.25]) {
    cockpitBox(
      0.12, 0.42, 0.12,
      grey,
      x, 0.05, -14.6
    );
  }

  // Windscreen lower frame
  cockpitBox(
    4.2, 0.12, 0.16,
    cockpitPanel,
    0, 1.25, -17.1
  );

  // Windscreen center divider
  cockpitBox(
    0.12, 1.0, 0.12,
    cockpitPanel,
    0, 1.75, -17.1
  );

  // Side window frames
  for (const side of [-1, 1]) {
    cockpitBox(
      0.12, 1.0, 0.12,
      cockpitPanel,
      side * 2.0, 1.75, -17.1
    );
  }
// ============================================
// VERSION 0.7 - COCKPIT INTERIOR DETAILS
// ============================================

// Cockpit floor
cockpitBox(
  4.0, 0.12, 5.8,
  cockpitPanel,
  0, -0.65, -13.5
);

// Left and right side consoles
for (const side of [-1, 1]) {
  cockpitBox(
    0.35, 0.45, 3.2,
    cockpitPanel,
    side * 1.85, -0.15, -13.8
  );

  // Side console control surfaces
  cockpitBox(
    0.3, 0.04, 2.7,
    grey,
    side * 1.85, 0.09, -13.8
  );
}

// Captain and first officer seats
for (const side of [-1, 1]) {
  const seat = new THREE.Group();
  cockpit.add(seat);

  // Seat base
  cockpitBox(
    0.85, 0.2, 0.85,
    black,
    side * 0.85, -0.35, -10.8
  );

  // Seat back
  cockpitBox(
    0.85, 1.2, 0.22,
    black,
    side * 0.85, 0.25, -10.35
  );
}

// Captain's and first officer's sidesticks
for (const side of [-1, 1]) {
  cockpitBox(
    0.13, 0.65, 0.13,
    black,
    side * 0.85, 0.05, -15.1
  );

  cockpitBox(
    0.35, 0.12, 0.3,
    grey,
    side * 0.85, 0.38, -15.1
  );
}

// Additional overhead panel
cockpitBox(
  3.2, 0.18, 1.1,
  cockpitPanel,
  0, 2.65, -14.8
);

// Overhead switches
for (let x = -1.2; x <= 1.2; x += 0.4) {
  cockpitBox(
    0.12, 0.1, 0.12,
    grey,
    x, 2.53, -14.8
  );
}
  plane.scale.setScalar(0.8);
  return plane;
}


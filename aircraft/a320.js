
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
  body.rotation.x = Math.PI / 2;

  // Rounded nose
  const nose = addMesh(
    new THREE.SphereGeometry(1.62, 32, 20),
    white, 0, 0, -14.3
  );
  nose.scale.set(1, 0.88, 1.25);

  // Nose tip
  addMesh(
    new THREE.SphereGeometry(0.16, 16, 12),
    grey, 0, 0, -16.2
  );

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

  plane.scale.setScalar(0.8);
  return plane;
}

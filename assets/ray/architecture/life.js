/* Shared palm geometry, terrace details and articulated, instanced residents. */
(() => {
  "use strict";
  const T = window.THREE,
    P = window.RayWorld.prototype;
  P.projectPalmFrond = function () {
    if (this.projectFrondGeo) return this.projectFrondGeo;
    const vertices = [],
      uvs = [];
    const point = (t, side = 0) =>
      new T.Vector3(t * 3.8, Math.sin(t * Math.PI) * 0.82 - t * t * 1.22, side);
    const tri = (a, b, c) => {
      for (const v of [a, b, c]) {
        vertices.push(v.x, v.y, v.z);
        uvs.push(v.x / 3.8, (v.z + 1) * 0.5);
      }
    };
    for (let i = 0; i < 15; i++) {
      const t = (i + 1) / 17,
        a = point(t),
        b = point(t + 0.045);
      const width = Math.sin(t * Math.PI) * 0.66;
      for (const side of [-1, 1]) {
        const tip = point(t + 0.16, side * width);
        tip.y -= 0.13 + width * 0.17;
        const middle = point(t + 0.095, side * width * 0.67);
        middle.y += 0.035;
        tri(a, middle, b);
        tri(b, middle, tip);
      }
      const aa = point(t, -0.018),
        bb = point(t, 0.018),
        cc = point(t + 0.07, -0.014),
        dd = point(t + 0.07, 0.014);
      tri(aa, bb, cc);
      tri(bb, dd, cc);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    this.projectFrondGeo = geometry;
    return geometry;
  };
  P.projectPalm = function (x, z, y, height, rotation = 0) {
    if (!this.projectCurvedTrunk) {
      const trunk = new T.CylinderGeometry(0.12, 0.21, 1, 10, 8),
        p = trunk.attributes.position;
      for (let i = 0; i < p.count; i++)
        p.setX(i, p.getX(i) + 0.11 * Math.pow(p.getY(i) + 0.5, 2));
      trunk.computeVertexNormals();
      this.projectCurvedTrunk = trunk;
    }
    this.addBatch(
      "project-curved-palm-trunks",
      this.projectCurvedTrunk,
      this.materials.trunk,
      x,
      y + height * 0.5,
      z,
      1,
      height,
      1,
      rotation,
    );
    const leanX = 0.11 * Math.cos(rotation),
      leanZ = -0.11 * Math.sin(rotation);
    this.projectCrownshaft ??= new T.CylinderGeometry(0.145, 0.2, 0.6, 10);
    this.addBatch(
      "project-palm-crownshafts",
      this.projectCrownshaft,
      this.materials.projectPalm,
      x + leanX,
      y + height - 0.12,
      z + leanZ,
      1,
      1,
      1,
      rotation,
    );
    const geo = this.projectPalmFrond(),
      baseSize = Math.min(0.96, 0.28 + height * 0.105);
    for (const [ring, count, pitch, scale] of [
      [0, 8, -0.12, 1],
      [1, 6, 0.28, 0.87],
      [2, 3, 0.77, 0.65],
    ])
      for (let i = 0; i < count; i++) {
        const yaw = rotation + (i * Math.PI * 2) / count + ring * 0.61;
        const size = baseSize * scale * (0.94 + this.random() * 0.13);
        const color = new T.Color().setHSL(
          0.235 + this.random() * 0.035,
          0.35,
          0.43 + ring * 0.035 + this.random() * 0.08,
        );
        this.addBatch(
          "project-layered-palm-fronds",
          geo,
          this.materials.projectPalm,
          x + leanX,
          y + height + ring * 0.12,
          z + leanZ,
          size,
          size,
          size,
          yaw,
          color,
          0.04 * Math.sin(yaw),
          pitch,
        );
      }
  };

  P.addTerraceDetails = function () {
    const originalAdd = this.addBatch;
    this.addBatch = function (
      key,
      g,
      mat,
      x,
      y,
      z,
      sx = 1,
      sy = 1,
      sz = 1,
      ry = 0,
      color = null,
      rx = 0,
      rz = 0,
    ) {
      const p = this.alignProjectItem({ x, z, ry, rx, rz });
      return originalAdd.call(
        this,
        key,
        g,
        mat,
        p.x,
        y,
        p.z,
        sx,
        sy,
        sz,
        p.ry,
        color,
        p.rx,
        p.rz,
      );
    };
    try {
      this.material("terraceTextile", 0xe4ded1, { roughness: 0.98 });
      this.material("terraceTowel", 0x558b94, { roughness: 1 });
      this.material("terraceCeramic", 0xcac1ac, { roughness: 0.58 });
      const cup = (this.terraceCupGeo ??= new T.CylinderGeometry(
        0.065,
        0.048,
        0.15,
        12,
      ));
      const pot = (this.terracePotGeo ??= new T.CylinderGeometry(
        0.42,
        0.3,
        0.7,
        14,
      ));
      const roof = 70.82;
      let props = 0;
      for (const center of [-47.5, 47.5]) {
        for (const dx of [-18, 0, 18]) {
          const x = center + dx;
          for (const side of [-1, 1]) {
            this.slab(
              "terrace-side-tables",
              x + side * 4.95,
              roof + 0.18,
              -0.9,
              0.72,
              0.72,
              0.58,
              0.16,
              "wood",
            );
            this.addBatch(
              "terrace-cups",
              cup,
              this.materials.terraceCeramic,
              x + side * 4.95,
              roof + 0.84,
              -0.9,
            );
            this.box(
              "terraceTowel",
              x + side * 2,
              roof + 0.514,
              -0.48,
              0.68,
              0.028,
              0.95,
              side * 0.06,
            );
            this.slab(
              "terrace-cushions",
              x + side * 2,
              roof + 0.506,
              -1.43,
              0.92,
              0.43,
              0.14,
              0.09,
              "terraceTextile",
              side * 0.04,
            );
            props += 4;
          }
        }
        for (const dx of [-25, 25]) {
          this.addBatch(
            "terrace-ceramic-pots",
            pot,
            this.materials.terraceCeramic,
            center + dx,
            roof + 0.51,
            -2.8,
          );
          this.projectShrub(center + dx, -2.8, roof + 0.9, 0.85, dx);
          this.box("bronze", center + dx, roof + 0.38, -0.9, 0.3, 0.55, 0.3);
          this.box("lamp", center + dx, roof + 0.54, -0.9, 0.23, 0.22, 0.23);
          props += 4;
        }
      }
      this.canvas.dataset.terraceProps = String(props);
    } finally {
      this.addBatch = originalAdd;
    }
  };

  P.createResidents = function () {
    const people = [];
    const shore = window.RayBuildingLandscape.marinaShore;
    const promenadeZ = (x) => {
      let i = 1;
      while (i < shore.length - 1 && shore[i][0] < x) i++;
      const a = shore[i - 1],
        b = shore[i];
      return T.MathUtils.lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])) - 16.1;
    };
    // Read actual walk-surface height once; no collision scans are needed during animation.
    this.modelRoot.updateMatrixWorld(true);
    const surfaces = [];
    this.modelRoot.traverse((object) => {
      if (
        object.isMesh &&
        /Pavement|Concrete|Parking/i.test(object.material?.name || "")
      )
        surfaces.push(object);
    });
    const ray = new T.Raycaster();
    const groundHeight = (x, z) => {
      const p = this.alignProjectItem({ x, z });
      ray.set(new T.Vector3(p.x, 5, p.z), new T.Vector3(0, -1, 0));
      ray.far = 5;
      const hit = ray
        .intersectObjects(surfaces, false)
        .find((hit) => hit.point.y > 0.5 && hit.point.y < 3.2);
      return hit?.point.y ?? 1.3;
    };
    const add = (a, b, y, walking = true, index = people.length) => {
      const start = this.alignProjectItem({ x: a[0], z: a[1] }),
        end = this.alignProjectItem({ x: b[0], z: b[1] });
      people.push({
        start: new T.Vector3(start.x, y, start.z),
        end: new T.Vector3(end.x, y, end.z),
        walking,
        phase: index * 2.39996,
        height: 0.94 + (index % 5) * 0.027,
        speed: 0.65 + (index % 4) * 0.08,
        yaw: (index % 6) * 1.047,
      });
    };
    for (const [a, b] of [
      [-62, -43],
      [-15, 12],
      [35, 56],
    ])
      for (let i = 0; i < 3; i++) {
        const lane = (i % 2) * 0.7;
        const za = promenadeZ(a) + lane,
          zb = promenadeZ(b) + lane;
        add([a, za], [b, zb], groundHeight((a + b) / 2, (za + zb) / 2) + 0.025);
      }
    for (const x of [-34, -31, 20, 22, 64, 66]) {
      const z = promenadeZ(x) + 0.25;
      add([x, z], [x, z], groundHeight(x, z) + 0.025, false);
    }
    for (const center of [-47.5, 47.5]) {
      for (let i = 0; i < 2; i++)
        add(
          [center - 21, -2.6 + i * 0.47],
          [center + 21, -2.6 + i * 0.47],
          70.99,
        );
      for (const dx of [-18, 0, 18]) {
        add([center + dx + 5.9, 2.6], [center + dx + 5.9, 2.6], 70.99, false);
        add([center + dx - 5.9, 3.4], [center + dx - 5.9, 3.4], 70.99, false);
      }
    }
    const n = people.length;
    const skin = new T.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.84,
    });
    const cloth = new T.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.97,
    });
    const pants = new T.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
    });
    const dark = new T.MeshStandardMaterial({
      color: 0x332e29,
      roughness: 0.8,
    });
    const sphere = new T.SphereGeometry(1, 10, 8),
      capsule = new T.CapsuleGeometry(0.5, 1, 3, 8);
    const make = (geometry, material, count) => {
      const mesh = new T.InstancedMesh(geometry, material, count);
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      this.scene.add(mesh);
      return mesh;
    };
    const parts = {
      skin: make(sphere, skin, n * 6),
      shirt: make(capsule, cloth, n * 3),
      pants: make(capsule, pants, n * 4),
      shoes: make(this.boxGeometry, dark, n * 2),
      hair: make(
        new T.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.57),
        dark,
        n,
      ),
    };
    const skins = [0xc79c7b, 0x805a42, 0xe0b99c, 0xaa795a, 0x624635];
    const shirts = [0xe6ddd0, 0x648e9c, 0xc2a278, 0x9c776b, 0xc7d4cb, 0x355663];
    people.forEach((person, i) => {
      for (let j = 0; j < 6; j++)
        parts.skin.setColorAt(i * 6 + j, new T.Color(skins[i % skins.length]));
      for (let j = 0; j < 3; j++)
        parts.shirt.setColorAt(
          i * 3 + j,
          new T.Color(shirts[i % shirts.length]),
        );
      for (let j = 0; j < 4; j++)
        parts.pants.setColorAt(
          i * 4 + j,
          new T.Color(i % 3 ? 0x54616b : 0xbab3a3),
        );
    });
    this.residents = {
      people,
      parts,
      dummy: new T.Object3D(),
      up: new T.Vector3(0, 1, 0),
      q: new T.Quaternion(),
      root: new T.Matrix4(),
      local: new T.Matrix4(),
      v: new T.Vector3(),
      s: new T.Vector3(),
      direction: new T.Vector3(),
      a: new T.Vector3(),
      b: new T.Vector3(),
      hip: new T.Vector3(),
      knee: new T.Vector3(),
      ankle: new T.Vector3(),
      identity: new T.Quaternion(),
    };
    this.updateResidents();
    this.canvas.dataset.people = String(n);
    this.canvas.dataset.walkingPeople = String(
      people.filter((person) => person.walking).length,
    );
    this.canvas.dataset.peopleStyle = "articulated-instanced-residents";
  };
  P.updateResidents = function () {
    const state = this.residents;
    if (!state) return;
    const {
      people,
      parts,
      q,
      root,
      local,
      v,
      s,
      direction,
      a,
      b,
      up,
      hip,
      knee,
      ankle,
      identity,
    } = state;
    const stamp = (mesh, index, x, y, z, sx, sy, sz, rotation = null) => {
      v.set(x, y, z);
      s.set(sx, sy, sz);
      local.compose(v, rotation || identity, s);
      local.premultiply(root);
      mesh.setMatrixAt(index, local);
    };
    const limb = (mesh, index, start, end, radius) => {
      direction.subVectors(end, start);
      const length = direction.length();
      q.setFromUnitVectors(up, direction.normalize());
      stamp(
        mesh,
        index,
        (start.x + end.x) * 0.5,
        (start.y + end.y) * 0.5,
        (start.z + end.z) * 0.5,
        radius,
        length * 0.5,
        radius,
        q,
      );
    };
    people.forEach((person, i) => {
      const length = person.start.distanceTo(person.end);
      const t =
        ((this.time * person.speed) / Math.max(length, 1)) * 2 + person.phase;
      const along = person.walking ? (Math.sin(t) + 1) * 0.5 : 0;
      const yaw = person.walking
        ? Math.atan2(
            person.end.x - person.start.x,
            person.end.z - person.start.z,
          ) + (Math.cos(t) < 0 ? Math.PI : 0)
        : person.yaw;
      v.copy(person.start).lerp(person.end, along);
      q.setFromAxisAngle(up, yaw);
      s.setScalar(person.height);
      root.compose(v, q, s);
      const gait = person.walking
        ? Math.sin(this.time * 5.2 + person.phase) *
          0.36 *
          Math.min(1, Math.abs(Math.cos(t)) * 3)
        : Math.sin(this.time * 0.8 + person.phase) * 0.018;
      stamp(parts.shirt, i * 3, 0, 1.225, 0, 0.43, 0.31, 0.31);
      stamp(parts.skin, i * 6, 0, 1.64, 0, 0.142, 0.175, 0.14);
      stamp(parts.skin, i * 6 + 1, 0, 1.455, 0, 0.057, 0.085, 0.055);
      stamp(parts.hair, i, 0, 1.655, -0.012, 0.146, 0.17, 0.145);
      for (const side of [-1, 1]) {
        const j = side === -1 ? 0 : 1,
          angle = gait * side;
        hip.set(side * 0.11, 0.9, 0);
        knee.set(
          side * 0.11,
          0.9 - Math.cos(angle) * 0.405,
          Math.sin(angle) * 0.405,
        );
        const lower = angle - Math.max(0, side * gait) * 0.8;
        ankle.set(
          side * 0.11,
          knee.y - Math.cos(lower) * 0.405,
          knee.z + Math.sin(lower) * 0.405,
        );
        limb(parts.pants, i * 4 + j * 2, hip, knee, 0.16);
        limb(parts.pants, i * 4 + j * 2 + 1, knee, ankle, 0.135);
        stamp(
          parts.shoes,
          i * 2 + j,
          ankle.x,
          ankle.y - 0.015,
          ankle.z + 0.055,
          0.15,
          0.12,
          0.29,
        );
        a.set(side * 0.245, 1.39, 0);
        b.set(side * 0.28, 1.12, -Math.sin(angle) * 0.22);
        limb(parts.shirt, i * 3 + 1 + j, a, b, 0.16);
        a.copy(b);
        b.set(side * 0.275, 0.94, -Math.sin(angle) * 0.35 + 0.035);
        limb(parts.skin, i * 6 + 2 + j, a, b, 0.1);
        stamp(
          parts.skin,
          i * 6 + 4 + j,
          b.x,
          b.y - 0.025,
          b.z,
          0.052,
          0.075,
          0.05,
        );
      }
    });
    for (const mesh of Object.values(parts))
      mesh.instanceMatrix.needsUpdate = true;
  };
  const decorate = P.decorateArchitecture;
  P.decorateArchitecture = function () {
    decorate.call(this);
    this.addTerraceDetails();
    this.createResidents();
    this.canvas.dataset.roofTrees = "layered-fronds-curved-trunks";
  };
  const updateLight = P.updateLight;
  P.updateLight = function (dt) {
    this.updateResidents();
    return updateLight.call(this, dt);
  };
})();

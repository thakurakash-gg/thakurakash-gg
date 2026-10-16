/* Shared, instanced waterfront furnishings and connected floating activity decks. */
(() => {
  "use strict";
  const T = window.THREE,
    P = window.RayWorld.prototype;
  P.clubMaterials = function () {
    if (this.clubMats) return this.clubMats;
    const cloth = document.createElement("canvas");
    cloth.width = cloth.height = 128;
    const c = cloth.getContext("2d");
    c.fillStyle = "#ede7d8";
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 3) {
      c.fillStyle = i % 2 ? "#e5dfd0" : "#e8e2d4";
      c.fillRect(i, 0, 1, 128);
      c.fillRect(0, i, 128, 1);
    }
    const fabric = new T.CanvasTexture(cloth);
    fabric.colorSpace = T.SRGBColorSpace;
    fabric.wrapS = fabric.wrapT = T.RepeatWrapping;
    fabric.repeat.set(3, 3);
    fabric.anisotropy = 4;
    const m = (this.clubMats = {
      wood: this.materials.wood,
      linen: this.material("club-linen", 0xffffff, { map: fabric, roughness: 0.93 }),
      trim: this.material("club-piping", 0xd6c6a8, { roughness: 0.88 }),
      metal: this.material("club-metal", 0x907e60, { roughness: 0.38, metalness: 0.62 }),
      rim: this.material("club-rim", 0xebe9df, { roughness: 0.4, metalness: 0.08 }),
      sage: this.material("club-sage", 0x6e8f87, { roughness: 0.94 }),
      leaf: this.material("club-leaves", 0x7b9f52, { roughness: 0.88, side: T.DoubleSide }),
      curtain: this.material("club-curtain", 0xf4eddf, {
        map: fabric,
        roughness: 1,
        side: T.DoubleSide,
      }),
      canopy: this.material("club-canopy", 0xffffff, {
        map: fabric,
        roughness: 0.95,
        side: T.DoubleSide,
        vertexColors: true,
      }),
    });
    m.curtain.onBeforeCompile = (shader) => {
      shader.uniforms.clubTime = this.clockUniform;
      shader.vertexShader = "uniform float clubTime;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.z+=sin(clubTime*.7+instanceMatrix[3].x*.11+position.x*4.)*.026*pow(1.-position.y,2.);\n#endif",
      );
    };
    m.curtain.customProgramCacheKey = () => "club-curtain-19";
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const n = canvas.getContext("2d");
    n.clearRect(0, 0, 64, 64);
    n.strokeStyle = "#c3c9bb";
    n.lineWidth = 3;
    n.strokeRect(0, 0, 64, 64);
    const net = new T.CanvasTexture(canvas);
    net.wrapS = net.wrapT = T.RepeatWrapping;
    net.repeat.set(12, 9);
    m.net = this.material("club-rope-net", 0xa3b4ac, {
      map: net,
      alphaTest: 0.45,
      side: T.DoubleSide,
      roughness: 1,
    });
    return m;
  };
  P.clubFloatMaterial = function (name) {
    this.clubFloatMats ??= {};
    if (this.clubFloatMats[name]) return this.clubFloatMats[name];
    const mat = this.clubMaterials()[name].clone();
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.clubTime = this.clockUniform;
      shader.vertexShader = "uniform float clubTime;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\n#ifdef USE_INSTANCING\nvec4 clubWorld=modelMatrix*instanceMatrix*vec4(transformed,1.);clubWorld.y+=sin(clubTime*.75+instanceMatrix[3].x*.012+instanceMatrix[3].z*.012)*.025;mvPosition=viewMatrix*clubWorld;gl_Position=projectionMatrix*mvPosition;\n#endif",
      );
    };
    mat.customProgramCacheKey = () => "club-floating-19";
    this.materials["club-float-" + name] = mat;
    return (this.clubFloatMats[name] = mat);
  };
  P.clubGeometry = function (key, create) {
    this.clubGeos ??= {};
    return (this.clubGeos[key] ??= create());
  };
  P.clubBox = function (group, mat, x, y, z, w, h, d, ry = 0, rx = 0, rz = 0) {
    const mesh = new T.Mesh(this.boxGeometry, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.rotation.set(rx, ry, rz);
    group.add(mesh);
    return mesh;
  };
  P.clubRound = function (group, mat, key, x, y, z, w, d, h, r = 0.12, ry = 0) {
    const g = this.clubGeometry(key, () => this.rounded(w, d, h, r)),
      mesh = new T.Mesh(g, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    group.add(mesh);
    return mesh;
  };
  P.clubRod = function (group, mat, a, b, r = 0.025) {
    const g = this.clubGeometry("rod", () => new T.CylinderGeometry(1, 1, 1, 10)),
      mesh = new T.Mesh(g, mat),
      start = new T.Vector3(...a),
      end = new T.Vector3(...b),
      delta = end.clone().sub(start);
    mesh.position.copy(start.add(end).multiplyScalar(0.5));
    mesh.scale.set(r, delta.length(), r);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    group.add(mesh);
  };
  P.clubParasolGeometry = function () {
    return this.clubGeometry("parasol", () => {
      const pos = [],
        uv = [],
        colors = [];
      const color = new T.Color();
      for (let panel = 0; panel < 8; panel++)
        for (let step = 0; step < 2; step++) {
          const a = ((panel + step / 2) * Math.PI) / 4,
            b = ((panel + (step + 1) / 2) * Math.PI) / 4,
            ra = step ? 1.49 : 1.6,
            rb = step ? 1.6 : 1.49;
          const rings = [
            [0, 0.57],
            [0.68, 0.32],
            [1, 0],
          ];
          for (let k = 0; k < 2; k++) {
            const [i, hi] = rings[k],
              [j, hj] = rings[k + 1],
              p = [
                [Math.sin(a) * i * ra, hi, Math.cos(a) * i * ra],
                [Math.sin(a) * j * ra, hj, Math.cos(a) * j * ra],
                [Math.sin(b) * j * rb, hj, Math.cos(b) * j * rb],
                [Math.sin(b) * i * rb, hi, Math.cos(b) * i * rb],
              ];
            for (const q of [0, 1, 2, 0, 2, 3]) {
              pos.push(...p[q]);
              uv.push(p[q][0] * 0.5, p[q][2] * 0.5);
              color.set(panel % 2 ? 0xece4d2 : 0xfffbef);
              colors.push(color.r, color.g, color.b);
            }
          }
        }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
      g.computeVertexNormals();
      return g;
    });
  };
  P.clubCurtainGeometry = function () {
    return this.clubGeometry("curtain", () => {
      const g = new T.PlaneGeometry(1, 1, 24, 6),
        p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        p.setY(i, p.getY(i) + 0.5);
        p.setZ(i, Math.sin(p.getX(i) * Math.PI * 18) * 0.035);
      }
      g.computeVertexNormals();
      return g;
    });
  };
  P.clubChair = function (group, x, z, yaw = 0) {
    const m = this.clubMaterials(),
      chair = new T.Group();
    for (const side of [-1, 1]) {
      this.clubBox(chair, m.wood, side * 0.37, 0.27, 0, 0.07, 0.13, 2.12);
      for (const f of [-1, 1])
        this.clubRod(
          chair,
          m.metal,
          [side * 0.34, 0.05, f * 0.7],
          [side * 0.34, 0.34, f * 0.7],
          0.026,
        );
    }
    for (let n = 0; n < 9; n++)
      this.clubBox(chair, m.wood, 0, 0.34, -0.92 + n * 0.23, 0.72, 0.055, 0.15);
    this.clubRound(chair, m.trim, "chair-edge", 0, 0.36, 0.2, 0.78, 1.38, 0.12, 0.09);
    this.clubRound(chair, m.linen, "chair-seat", 0, 0.39, 0.2, 0.72, 1.32, 0.12, 0.08);
    const back = this.clubRound(
      chair,
      m.linen,
      "chair-back",
      0,
      0.5,
      -0.73,
      0.72,
      0.79,
      0.12,
      0.08,
    );
    back.rotation.x = 0.4;
    this.clubRod(chair, m.metal, [-0.32, 0.32, -0.5], [-0.32, 0.79, -1.02], 0.018);
    this.clubRod(chair, m.metal, [0.32, 0.32, -0.5], [0.32, 0.79, -1.02], 0.018);
    this.clubRound(chair, m.linen, "chair-pillow", 0, 0.8, -0.98, 0.53, 0.22, 0.13, 0.07);
    chair.position.set(x, 0, z);
    chair.rotation.y = yaw;
    group.add(chair);
  };
  P.clubTemplate = function (kind) {
    this.clubTemplates ??= {};
    if (this.clubTemplates[kind]) return this.clubTemplates[kind];
    const m = this.clubMaterials(),
      g = new T.Group();
    if (kind === "sun-pair") {
      this.clubChair(g, -0.66, 0.12);
      this.clubChair(g, 0.66, 0.12);
      this.clubRod(g, m.metal, [0, 0.04, -0.88], [0, 2.72, -0.88], 0.025);
      const base = new T.Mesh(
        this.clubGeometry("umbrella-base", () => new T.CylinderGeometry(0.24, 0.29, 0.07, 20)),
        m.metal,
      );
      base.position.set(0, 0.04, -0.88);
      g.add(base);
      const canopy = new T.Mesh(this.clubParasolGeometry(), m.canopy);
      canopy.position.set(0, 2.18, -0.88);
      g.add(canopy);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        this.clubRod(
          g,
          m.metal,
          [0, 2.72, -0.88],
          [Math.sin(a) * 1.54, 2.19, -0.88 + Math.cos(a) * 1.54],
          0.009,
        );
      }
      this.clubRod(g, m.metal, [0, 0, 0.42], [0, 0.48, 0.42], 0.035);
      const table = new T.Mesh(
        this.clubGeometry("small-table", () => new T.CylinderGeometry(0.28, 0.28, 0.055, 24)),
        m.wood,
      );
      table.position.set(0, 0.49, 0.42);
      g.add(table);
    }
    if (kind === "cabana") {
      this.clubRound(g, m.wood, "cabana-base", 0, 0.1, 0, 3.25, 2.95, 0.22, 0.1);
      this.clubRound(g, m.trim, "cabana-mattress-edge", 0, 0.32, 0.12, 2.85, 2.48, 0.16, 0.12);
      this.clubRound(g, m.linen, "cabana-mattress", 0, 0.4, 0.12, 2.76, 2.38, 0.2, 0.12);
      for (const x of [-0.91, 0, 0.91]) {
        const pillow = this.clubRound(
          g,
          m.linen,
          "cabana-pillow",
          x,
          0.62,
          -0.82,
          0.81,
          0.52,
          0.18,
          0.12,
        );
        pillow.rotation.x = 0.13;
      }
      for (const x of [-1.55, 1.55])
        for (const z of [-1.34, 1.34]) this.clubBox(g, m.wood, x, 1.36, z, 0.105, 2.53, 0.105);
      for (const x of [-1.55, 1.55]) this.clubBox(g, m.wood, x, 2.66, 0, 0.13, 0.16, 2.9);
      for (const z of [-1.34, 1.34]) this.clubBox(g, m.wood, 0, 2.66, z, 3.22, 0.16, 0.13);
      for (let i = 0; i < 15; i++)
        this.clubBox(g, m.wood, -1.47 + i * 0.21, 2.76, 0, 0.13, 0.075, 2.91);
      for (let i = 0; i < 13; i++)
        this.clubBox(g, m.wood, -1.44 + i * 0.24, 1.33, -1.33, 0.16, 1.92, 0.045);
      for (const x of [-1.29, 1.29]) {
        const cloth = new T.Mesh(this.clubCurtainGeometry(), m.curtain);
        cloth.position.set(x, 0.36, 1.37);
        cloth.scale.set(0.43, 2.22, 1);
        g.add(cloth);
      }
      for (const side of [-1, 1]) {
        const cloth = new T.Mesh(this.clubCurtainGeometry(), m.curtain);
        cloth.position.set(side * 1.55, 0.36, 0.85);
        cloth.rotation.y = Math.PI / 2;
        cloth.scale.set(0.95, 2.22, 1);
        g.add(cloth);
      }
    }
    if (kind === "lounge") {
      for (const side of [-1, 1]) {
        this.clubRound(g, m.wood, "sofa-base", 0, 0.12, side * 0.98, 2.8, 0.72, 0.22, 0.07);
        this.clubRound(g, m.linen, "sofa-seat", 0, 0.34, side * 0.98, 2.65, 0.65, 0.16, 0.09);
        this.clubRound(g, m.linen, "sofa-back", 0, 0.48, side * 1.26, 2.68, 0.16, 0.47, 0.06);
        for (const x of [-0.94, 0, 0.94])
          this.clubRound(g, m.sage, "sofa-pillow", x, 0.52, side * 1.12, 0.55, 0.15, 0.39, 0.07);
      }
      this.clubRound(g, m.wood, "lounge-table", 0, 0.34, 0, 1.28, 0.65, 0.09, 0.12);
      for (const x of [-0.46, 0.46]) this.clubBox(g, m.metal, x, 0.18, 0, 0.045, 0.32, 0.44);
    }
    if (kind === "planter") {
      this.clubRound(g, m.wood, "planter", 0, 0, 0, 1.4, 1.1, 0.54, 0.08);
      this.clubBox(g, this.materials.soil, 0, 0.53, 0, 1.27, 0.05, 0.96);
      const leaf = this.clubGeometry("tropical-leaf", () => {
        const p = [],
          uv = [];
        for (let i = 0; i < 10; i++) {
          const a = i / 10,
            b = (i + 1) / 10;
          for (const [t, side] of [
            [a, -1],
            [b, -1],
            [a, 1],
            [a, 1],
            [b, -1],
            [b, 1],
          ]) {
            p.push(t * 1.1, Math.sin(t * Math.PI) * 0.32, side * Math.sin(t * Math.PI) * 0.16);
            uv.push(t, (side + 1) / 2);
          }
        }
        const g = new T.BufferGeometry();
        g.setAttribute("position", new T.Float32BufferAttribute(p, 3));
        g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
        g.computeVertexNormals();
        return g;
      });
      for (let i = 0; i < 18; i++) {
        const mesh = new T.Mesh(leaf, m.leaf);
        mesh.position.set(Math.sin(i * 2.4) * 0.32, 0.57, Math.cos(i * 2.4) * 0.25);
        mesh.rotation.set(0, i * 2.4, -0.3 - (i % 3) * 0.16);
        g.add(mesh);
      }
    }
    if (kind === "swim" || kind === "yoga") {
      const shape = this.clubFloatShape(kind),
        side = this.clubGeometry(kind + "-side", () => this.clubExtrude(shape, 0.32)),
        top = this.clubGeometry(kind + "-top", () => this.clubExtrude(shape, 0.075));
      for (const [geo, mat, y] of [
        [side, this.clubFloatMaterial("rim"), 0.25],
        [top, this.clubFloatMaterial("wood"), 0.57],
      ]) {
        const mesh = new T.Mesh(geo, mat);
        mesh.position.y = y;
        g.add(mesh);
      }
      if (kind === "swim") {
        const rope = this.clubGeometry("swim-net", () => {
          const g = new T.PlaneGeometry(1.6, 2.7, 12, 12);
          g.rotateX(-Math.PI / 2);
          const p = g.attributes.position;
          for (let i = 0; i < p.count; i++)
            p.setY(
              i,
              -0.13 *
                Math.sin((p.getX(i) / 1.6 + 0.5) * Math.PI) *
                Math.sin((p.getZ(i) / 2.7 + 0.5) * Math.PI),
            );
          g.computeVertexNormals();
          return g;
        });
        const net = new T.Mesh(rope, this.clubFloatMaterial("net"));
        net.position.set(-1.04, 0.21, 0);
        g.add(net);
        for (const x of [0.68, 1.3]) {
          this.clubRod(g, this.clubFloatMaterial("metal"), [x, 0.14, 1.52], [x, 1.22, 1.52], 0.026);
          this.clubRod(g, this.clubFloatMaterial("metal"), [x, 1.22, 1.52], [x, 1.22, 2.22], 0.026);
          this.clubRod(g, this.clubFloatMaterial("metal"), [x, 1.22, 2.22], [x, 0.66, 2.22], 0.026);
        }
        for (const y of [-0.32, -0.03, 0.27, 0.57])
          this.clubRod(g, this.clubFloatMaterial("metal"), [0.68, y, 1.52], [1.3, y, 1.52], 0.018);
      } else {
        for (const x of [-1.25, 1.25]) {
          this.clubRound(
            g,
            this.clubFloatMaterial("sage"),
            "yoga-mat",
            x,
            0.65,
            0,
            0.72,
            1.95,
            0.028,
            0.055,
          );
          const towel = new T.Mesh(
            this.clubGeometry("yoga-towel", () => new T.CylinderGeometry(0.085, 0.085, 0.63, 14)),
            this.clubFloatMaterial("linen"),
          );
          towel.rotation.z = Math.PI / 2;
          towel.position.set(x, 0.75, -0.76);
          g.add(towel);
        }
        this.clubRound(
          g,
          this.clubFloatMaterial("wood"),
          "yoga-bench",
          0,
          0.82,
          1.66,
          2.0,
          0.38,
          0.1,
          0.08,
        );
        for (const x of [-0.8, 0.8])
          this.clubBox(g, this.clubFloatMaterial("rim"), x, 0.71, 1.66, 0.1, 0.34, 0.3);
      }
    }
    const parts = [];
    g.updateMatrixWorld(true);
    g.traverse((mesh) => {
      if (!mesh.isMesh) return;
      const position = new T.Vector3(),
        quaternion = new T.Quaternion(),
        scale = new T.Vector3();
      mesh.matrixWorld.decompose(position, quaternion, scale);
      parts.push({ geometry: mesh.geometry, material: mesh.material, position, quaternion, scale });
    });
    this.clubTemplates[kind] = parts;
    return parts;
  };
  P.clubFloatShape = function (kind) {
    this.clubShapes ??= {};
    if (this.clubShapes[kind]) return this.clubShapes[kind];
    const s = new T.Shape();
    if (kind === "swim") {
      const round = (shape, w, d, r) => {
        const x = -w / 2,
          z = -d / 2;
        shape.moveTo(x + r, z);
        shape.lineTo(-x - r, z);
        shape.quadraticCurveTo(-x, z, -x, z + r);
        shape.lineTo(-x, -z - r);
        shape.quadraticCurveTo(-x, -z, -x - r, -z);
        shape.lineTo(x + r, -z);
        shape.quadraticCurveTo(x, -z, x, -z - r);
        shape.lineTo(x, z + r);
        shape.quadraticCurveTo(x, z, x + r, z);
      };
      round(s, 6.2, 5.2, 0.7);
      const hole = new T.Path();
      round(hole, 3.8, 2.8, 0.45);
      s.holes.push(hole);
    } else {
      s.moveTo(-0.1, -1.12);
      s.bezierCurveTo(-1.4, -2.7, -3.1, -1.8, -3, 0);
      s.bezierCurveTo(-2.9, 2.1, -1.1, 2.55, 0.15, 1.15);
      s.bezierCurveTo(1.6, 2.7, 3.1, 1.5, 3, 0);
      s.bezierCurveTo(2.8, -2.4, 1, -2.35, -0.1, -1.12);
    }
    return (this.clubShapes[kind] = s);
  };
  P.clubExtrude = function (shape, h) {
    const g = new T.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.015,
      curveSegments: 12,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  };
  P.clubPlace = function (kind, x, y, z, yaw = 0) {
    const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), yaw);
    for (const part of this.clubTemplate(kind)) {
      const p = part.position.clone().applyQuaternion(q),
        rotation = new T.Euler().setFromQuaternion(q.clone().multiply(part.quaternion));
      this.addBatch(
        "club-" + part.geometry.uuid + "-" + part.material.uuid,
        part.geometry,
        part.material,
        x + p.x,
        y + p.y,
        z + p.z,
        part.scale.x,
        part.scale.y,
        part.scale.z,
        rotation.y,
        null,
        rotation.x,
        rotation.z,
      );
    }
  };
  P.clubWalkway = function (a, b, topA, topB, width, rails = false) {
    const m = this.clubMaterials(),
      start = new T.Vector3(a[0], topA, a[1]),
      end = new T.Vector3(b[0], topB, b[1]),
      delta = end.clone().sub(start),
      length = delta.length(),
      q = new T.Quaternion().setFromUnitVectors(new T.Vector3(1, 0, 0), delta.clone().normalize()),
      r = new T.Euler().setFromQuaternion(q),
      center = start.clone().add(end).multiplyScalar(0.5),
      flat = Math.hypot(b[0] - a[0], b[1] - a[1]),
      nx = -(b[1] - a[1]) / flat,
      nz = (b[0] - a[0]) / flat;
    this.addBatch(
      "club-boardwalk",
      this.boxGeometry,
      m.wood,
      center.x,
      center.y - 0.13,
      center.z,
      length,
      0.26,
      width,
      r.y,
      null,
      r.x,
      r.z,
    );
    for (const side of [-1, 1]) {
      this.addBatch(
        "club-boardwalk-trim",
        this.boxGeometry,
        m.rim,
        center.x + nx * side * (width / 2 - 0.035),
        center.y + 0.025,
        center.z + nz * side * (width / 2 - 0.035),
        length,
        0.05,
        0.055,
        r.y,
        null,
        r.x,
        r.z,
      );
      if (rails) {
        const count = Math.ceil(flat / 2);
        for (let i = 0; i <= count; i++) {
          const t = i / count,
            x = T.MathUtils.lerp(a[0], b[0], t) + nx * side * (width / 2 - 0.06),
            z = T.MathUtils.lerp(a[1], b[1], t) + nz * side * (width / 2 - 0.06),
            y = T.MathUtils.lerp(topA, topB, t);
          this.box("frame", x, y + 0.43, z, 0.045, 0.86, 0.045);
        }
        this.addBatch(
          "club-gangway-handrails",
          this.boxGeometry,
          m.metal,
          center.x + nx * side * (width / 2 - 0.06),
          center.y + 0.86,
          center.z + nz * side * (width / 2 - 0.06),
          length,
          0.035,
          0.04,
          r.y,
          null,
          r.x,
          r.z,
        );
      }
    }
  };
  P.clubSurface = function (key, corners) {
    const pos = [],
      uv = [],
      idx = [];
    for (const p of corners) {
      pos.push(...p);
      uv.push(p[0] * 0.12, p[2] * 0.12);
    }
    idx.push(0, 2, 1, 0, 3, 2);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4,
        k = pos.length / 3;
      pos.push(
        ...corners[i],
        ...corners[j],
        corners[j][0],
        corners[j][1] - 0.3,
        corners[j][2],
        corners[i][0],
        corners[i][1] - 0.3,
        corners[i][2],
      );
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    this.addBatch(key, g, this.materials.wood, 0, 0, 0);
  };
  P.createClubLink = function (link) {
    const dx = link.end[0] - link.start[0],
      dz = link.end[1] - link.start[1],
      len = Math.hypot(dx, dz),
      ux = dx / len,
      uz = dz / len,
      nx = -uz,
      nz = ux,
      half = link.width / 2,
      point = (t, side) => [
        link.start[0] + ux * t + nx * side,
        link.topStart + ((link.topEnd - link.topStart) * t) / len,
        link.start[1] + uz * t + nz * side,
      ],
      openings = [];
    this.clubSurface("club-main-surface", [
      point(0, -half),
      point(len, -half),
      point(len, half),
      point(0, half),
    ]);
    for (const p of window.RayClubDeck.platforms) {
      const t = (p.x - link.start[0]) / ux,
        w = 0.7,
        A = point(t - w, half),
        B = point(t + w, half),
        edge = p.z - p.d / 2;
      this.clubSurface("club-branch-" + p.x, [
        A,
        B,
        [p.x + w, 0.645, edge],
        [p.x - w, 0.645, edge],
      ]);
      openings.push([t - w, t + w]);
      for (const [start, end] of [
        [A, [p.x - w, 0.645, edge]],
        [B, [p.x + w, 0.645, edge]],
      ])
        this.clubEdge(start, end);
    }
    this.clubEdge(point(0, -half), point(len, -half));
    let last = 0;
    for (const [a, b] of openings) {
      this.clubEdge(point(last, half), point(a, half));
      last = b;
    }
    this.clubEdge(point(last, half), point(len, half));
  };
  P.clubEdge = function (a, b) {
    const start = new T.Vector3(...a),
      end = new T.Vector3(...b),
      delta = end.clone().sub(start),
      center = start.clone().add(end).multiplyScalar(0.5),
      r = new T.Euler().setFromQuaternion(
        new T.Quaternion().setFromUnitVectors(new T.Vector3(1, 0, 0), delta.clone().normalize()),
      );
    this.addBatch(
      "club-clean-edge",
      this.boxGeometry,
      this.materials.ivory,
      center.x,
      center.y + 0.025,
      center.z,
      delta.length(),
      0.05,
      0.055,
      r.y,
      null,
      r.x,
      r.z,
    );
  };
  P.createClubDeck = function () {
    const d = window.RayClubDeck;
    if (!d) return;
    this.clubMaterials();
    for (const p of d.items) {
      this.clubPlace(p.kind, p.x, d.deckTop + 0.025, p.z, p.yaw);
      if (p.kind === "planter") this.palm(p.x, p.z, 3.8, d.deckTop + 0.56);
    }
    for (const p of d.platforms) this.clubPlace(p.kind, p.x, 0, p.z);
    for (const p of d.platforms) {
      this.box("bronze", p.x + 2.6, 0.88, p.z, 0.07, 0.48, 0.07);
      this.box("lamp", p.x + 2.6, 1.14, p.z, 0.12, 0.1, 0.12);
    }
    this.canvas.dataset.clubDeck = "furnished-waterfront";
    this.canvas.dataset.clubLoungers = String(
      d.items.filter((p) => p.kind === "sun-pair").length * 2,
    );
    this.canvas.dataset.clubCabanas = String(d.items.filter((p) => p.kind === "cabana").length);
    this.canvas.dataset.clubPlatforms = String(d.platforms.length);
  };
  const marina = P.createMarina;
  P.createMarina = function () {
    marina.call(this);
    this.createClubDeck();
  };
  const preset = P.preset;
  P.preset = function (id) {
    if (id !== "club") return preset.call(this, id);
    this.auto = false;
    const p = this.alignProjectItem({ x: -59, z: 54 }, true);
    let theta = 0.42;
    while (theta - this.orbit.theta > Math.PI) theta -= Math.PI * 2;
    while (theta - this.orbit.theta < -Math.PI) theta += Math.PI * 2;
    this.desired = { theta, phi: 0.64, radius: 96 * this.fitFactor };
    this.desiredTarget.set(p.x, 2.2, p.z);
    this.wake();
  };
})();

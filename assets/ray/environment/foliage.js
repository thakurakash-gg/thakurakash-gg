/* Shared leaf clusters and feathered palm fronds, instanced throughout the gardens. */
(() => {
  const T = window.THREE,
    P = window.RayWorld.prototype,
    original = P.createMaterials;
  P.createMaterials = function () {
    original.call(this);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < 220; i++) {
      const angle = this.random() * Math.PI * 2,
        r = Math.sqrt(this.random()) * 112,
        x = 128 + Math.cos(angle) * r,
        y = 128 + Math.sin(angle) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.random() * Math.PI);
      ctx.fillStyle = ["#8b9b71", "#607548", "#74865a", "#475c39", "#9aa97a"][i % 5];
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.quadraticCurveTo(0, -7, 13, 0);
      ctx.quadraticCurveTo(0, 8, -12, 0);
      ctx.fill();
      ctx.strokeStyle = "#b0b58b";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.restore();
    }
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    this.materials.crown = new T.MeshStandardMaterial({
      color: 0xb9c5a5,
      map,
      alphaTest: 0.4,
      side: T.DoubleSide,
      roughness: 0.95,
    });
    this.materials.crown.onBeforeCompile = (shader) => {
      shader.uniforms.rayWind = this.clockUniform;
      shader.vertexShader = "uniform float rayWind;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x+=sin(rayWind*.6+instanceMatrix[3].x*.13+position.y)*.027*max(0.,position.y);\n#endif",
      );
    };
    this.materials.leaf.color.set(0xa9b795);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 64;
    const s = shadowCanvas.getContext("2d"),
      gradient = s.createRadialGradient(32, 32, 3, 32, 32, 32);
    gradient.addColorStop(0, "rgba(25,34,21,.5)");
    gradient.addColorStop(0.4, "rgba(25,34,21,.25)");
    gradient.addColorStop(1, "rgba(25,34,21,0)");
    s.fillStyle = gradient;
    s.fillRect(0, 0, 64, 64);
    this.foliageShadowMat = new T.MeshBasicMaterial({
      map: new T.CanvasTexture(shadowCanvas),
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });
    this.foliageShadowGeo = new T.PlaneGeometry(1, 1);
    this.foliageShadowGeo.rotateX(-Math.PI / 2);
  };
  P.frondGeometry = function (count = 19) {
    const pos = [],
      uv = [];
    const point = (t) => new T.Vector3(t * 4.5, Math.sin(t * Math.PI) * 0.75 - t * t * 1.45, 0);
    for (let i = 0; i < count; i++) {
      const t = 0.08 + i * (0.87 / count),
        p = point(t),
        width = Math.sin(Math.PI * t) * (0.6 - t * 0.16);
      for (const side of [-1, 1]) {
        const verts = [
          [p.x - 0.07, p.y, 0],
          [p.x + 0.055, p.y, 0],
          [p.x + 0.29, p.y - 0.1, side * width],
          [p.x + 0.055, p.y, 0],
          [p.x + 0.4, p.y - 0.16, side * width * 0.8],
          [p.x + 0.29, p.y - 0.1, side * width],
        ];
        for (const v of verts) pos.push(...v);
        uv.push(0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  };
  P.palm = function (x, z, height = 9, y = 1.1) {
    if (height < 0.5) return;
    const trunk = (this.trunkGeo ??= new T.CylinderGeometry(0.12, 0.22, 1, 8, 5));
    this.addBatch("palm-trunks", trunk, this.materials.trunk, x, y + height / 2, z, 1, height, 1);
    const far = innerWidth < 700 || Math.hypot(x, z) > 650,
      geometry = far
        ? (this.farFrond ??= this.frondGeometry(10))
        : (this.frond ??= this.frondGeometry()),
      fronds = far ? 7 : 11,
      spread = 0.65 + Math.min(1, height / 10) * 0.45;
    for (let i = 0; i < fronds; i++) {
      const angle = (i * Math.PI * 2) / fronds + this.random() * 0.22,
        size = spread * (0.85 + this.random() * 0.25);
      this.addBatch(
        far ? "palm-fronds-far" : "palm-fronds",
        geometry,
        this.materials.leaf,
        x,
        y + height,
        z,
        size,
        size,
        size,
        angle,
        new T.Color().setHSL(
          0.24 + this.random() * 0.045,
          0.17 + this.random() * 0.15,
          0.3 + this.random() * 0.12,
        ),
        this.random() * 0.17,
        0,
      );
    }
    if (y < 2)
      this.addBatch(
        "plant-contact",
        this.foliageShadowGeo,
        this.foliageShadowMat,
        x,
        y + 0.035,
        z,
        height * 0.8,
        1,
        height * 0.8,
      );
  };
  P.leafCluster = function () {
    const pos = [],
      uv = [];
    for (let i = 0; i < 28; i++) {
      const az = this.random() * Math.PI * 2,
        el = Math.acos(2 * this.random() - 1),
        r = 0.3 + this.random() * 0.55,
        center = new T.Vector3(
          Math.sin(el) * Math.cos(az) * r,
          Math.cos(el) * r,
          Math.sin(el) * Math.sin(az) * r,
        ),
        normal = center.clone().normalize(),
        right = new T.Vector3(-normal.z, 0, normal.x).normalize();
      if (right.length() < 0.1) right.set(1, 0, 0);
      const up = new T.Vector3().crossVectors(normal, right).normalize(),
        size = 0.48 + this.random() * 0.3;
      for (const [u, v] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]) {
        const p = center
          .clone()
          .addScaledVector(right, u * size)
          .addScaledVector(up, v * size);
        pos.push(p.x, p.y, p.z);
        uv.push(u * 0.5 + 0.5, v * 0.5 + 0.5);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  };
  P.tree = function (x, z, size = 4, y = 1, maximumClusters = Infinity) {
    if (size < 0.3) return;
    const trunk = (this.treeTrunk ??= new T.CylinderGeometry(0.13, 0.26, 1, 7)),
      geo = (this.crownGeo ??= this.leafCluster());
    this.addBatch(
      "tree-trunks",
      trunk,
      this.materials.trunk,
      x,
      y + size * 0.65,
      z,
      1,
      size * 1.3,
      1,
    );
    const clusters = Math.min(
      maximumClusters,
      innerWidth < 700 ? 2 : Math.hypot(x, z) < 650 ? 5 : 2,
    );
    for (let i = 0; i < clusters; i++) {
      const a = i * 2.399,
        r = size * (i === 0 ? 0.1 : 0.42);
      this.addBatch(
        "tree-crowns",
        geo,
        this.materials.crown,
        x + Math.cos(a) * r,
        y + size * (1.25 + this.random() * 0.35),
        z + Math.sin(a) * r,
        size * 0.7,
        size * 0.65,
        size * 0.7,
        a,
        new T.Color().setHSL(
          0.23 + this.random() * 0.04,
          0.15 + this.random() * 0.14,
          0.43 + this.random() * 0.13,
        ),
      );
    }
    if (y < 2)
      this.addBatch(
        "plant-contact",
        this.foliageShadowGeo,
        this.foliageShadowMat,
        x,
        y + 0.04,
        z,
        size * 2,
        1,
        size * 2,
      );
  };
  P.shrub = function (x, z, size = 1, y = 1.2) {
    const geo = (this.crownGeo ??= this.leafCluster());
    this.addBatch(
      "tree-crowns",
      geo,
      this.materials.crown,
      x,
      y + size * 0.4,
      z,
      size,
      size * 0.65,
      size,
      this.random() * 6.28,
      new T.Color(0x879875),
    );
  };
  P.createVegetation = function () {
    for (let x = -78; x < 80; x += 8) {
      this.palm(x, 31.8, 7 + this.random() * 2.8);
      if (Math.abs(x) > 68) this.tree(x, 25, 3.3);
      for (let j = 0; j < 2; j++) this.shrub(x + j * 2.7, 29, 1.05);
    }
    for (const x of [-78, 78])
      for (let z = -23; z < 25; z += 7) {
        this.palm(x, z, 6 + this.random() * 3);
        this.shrub(x + Math.sign(x) * 2.8, z, 1.6);
      }
    for (let x = -76; x < 80; x += 9) {
      this.tree(x, -27, 3.2 + this.random());
      this.shrub(x + 3, -28, 1.3);
    }
  };
  // Planting is culled by neighborhood block, instead of drawing every leaf in the whole map.
  const originalFlush = P.flush;
  P.flush = function () {
    const grouped = new Map();
    for (const [key, batch] of this.batches) {
      if (!/^(palm-|tree-|plant-contact)/.test(key)) continue;
      for (const item of batch.items) {
        const chunk = key + ":" + Math.floor(item.x / 200) + "," + Math.floor(item.z / 200);
        let group = grouped.get(chunk);
        if (!group) {
          group = { ...batch, items: [] };
          grouped.set(chunk, group);
        }
        group.items.push(item);
      }
      this.batches.delete(key);
    }
    originalFlush.call(this);
    const dummy = new T.Object3D();
    for (const [key, batch] of grouped) {
      const mesh = new T.InstancedMesh(batch.geometry, batch.material, batch.items.length);
      for (let i = 0; i < batch.items.length; i++) {
        const p = batch.items[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.set(p.sx, p.sy, p.sz);
        dummy.rotation.set(p.rx, p.ry, p.rz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (p.color) mesh.setColorAt(i, p.color);
      }
      mesh.castShadow = !key.startsWith("plant-contact");
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      mesh.frustumCulled = true;
      this.scene.add(mesh);
    }
  };
})();

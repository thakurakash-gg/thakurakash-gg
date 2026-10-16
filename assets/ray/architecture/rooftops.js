/* Landscape and rooftop additions preserve the supplied tower geometry. */
(() => {
  "use strict";
  const T = window.THREE,
    P = window.RayWorld.prototype;
  P.alignProjectItem = function (item, shifted = false) {
    const d = window.RayBuildingLandscape,
      a = d.buildingYaw || 0,
      c = Math.cos(a),
      s = Math.sin(a),
      z = item.z - (shifted ? (d.marinaBaseShift ?? 13) : 0),
      x = item.x;
    item.x = x * c + z * s;
    item.z = -x * s + z * c + d.buildingShift;
    const q = new T.Quaternion().setFromEuler(
      new T.Euler(item.rx || 0, item.ry || 0, item.rz || 0),
    );
    q.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), a));
    const e = new T.Euler().setFromQuaternion(q);
    item.rx = e.x;
    item.ry = e.y;
    item.rz = e.z;
    return item;
  };
  const marina = P.createMarina;
  P.createMarina = function () {
    const existing = new Map([...this.batches].map(([key, b]) => [key, b.items.length]));
    marina.call(this);
    for (const [key, b] of this.batches)
      for (let i = existing.get(key) || 0; i < b.items.length; i++)
        this.alignProjectItem(b.items[i], true);
  };
  P.architectureGlazing = function (mat) {
    mat.userData.rayReflective = true;
    mat.color.set(/windows/i.test(mat.name) ? 0x8aa6b4 : 0xa5bdc9);
    mat.metalness = 0.28;
    mat.roughness = 0.14;
    mat.envMapIntensity = 1.65;
    mat.transmission = 0;
    mat.emissive.set(0x274456);
    mat.emissiveIntensity = 0.12;
    if (/^Glass$/i.test(mat.name)) {
      mat.opacity = 0.82;
      mat.transparent = true;
      mat.side = T.DoubleSide;
    }
    if (/windows/i.test(mat.name)) {
      mat.opacity = 1;
      mat.transparent = false;
      mat.depthWrite = true;
    }
    if (mat.isMeshPhysicalMaterial) {
      mat.specularIntensity = 1;
      mat.specularColor.set(0xffffff);
      mat.ior = 1.52;
      mat.clearcoat = 0.35;
      mat.clearcoatRoughness = 0.13;
    }
    mat.needsUpdate = true;
  };
  P.createProjectPlantMaterials = function () {
    if (this.materials.projectLeaf) return;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < 260; i++) {
      const a = this.random() * Math.PI * 2,
        r = Math.sqrt(this.random()) * 116,
        x = 128 + Math.cos(a) * r,
        y = 128 + Math.sin(a) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.random() * Math.PI);
      ctx.fillStyle = ["#86ad50", "#719b40", "#9ebf64", "#688f35", "#b0ca76"][i % 5];
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.quadraticCurveTo(0, -7, 12, 0);
      ctx.quadraticCurveTo(0, 7, -11, 0);
      ctx.fill();
      ctx.restore();
    }
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    this.materials.projectLeaf = new T.MeshStandardMaterial({
      map,
      color: 0xffffff,
      roughness: 0.9,
      alphaTest: 0.4,
      side: T.DoubleSide,
      emissive: 0x324e12,
      emissiveIntensity: 0.09,
    });
    this.materials.projectLeaf.onBeforeCompile = this.materials.crown.onBeforeCompile;
    this.materials.projectPalm = this.materials.leaf.clone();
    this.materials.projectPalm.color.set(0xb4cc85);
    this.materials.projectPalm.onBeforeCompile = this.materials.leaf.onBeforeCompile;
  };
  P.projectShrub = function (x, z, y, size = 1, rotation = 0) {
    const geo = (this.crownGeo ??= this.leafCluster());
    this.addBatch(
      "project-bright-shrubs",
      geo,
      this.materials.projectLeaf,
      x,
      y + size * 0.38,
      z,
      size,
      size * 0.65,
      size,
      rotation,
      new T.Color().setHSL(0.245 + this.random() * 0.025, 0.2, 0.83 + this.random() * 0.1),
    );
  };
  P.projectPalm = function (x, z, y, height, rotation = 0) {
    const trunk = (this.trunkGeo ??= new T.CylinderGeometry(0.12, 0.22, 1, 8, 5));
    this.addBatch(
      "project-palm-trunks",
      trunk,
      this.materials.trunk,
      x,
      y + height / 2,
      z,
      1,
      height,
      1,
      rotation,
    );
    const geo = (this.frond ??= this.frondGeometry());
    for (let i = 0; i < 11; i++) {
      const angle = rotation + (i * Math.PI * 2) / 11,
        size = 0.9 + this.random() * 0.22;
      this.addBatch(
        "project-palm-fronds",
        geo,
        this.materials.projectPalm,
        x,
        y + height,
        z,
        size,
        size,
        size,
        angle,
        new T.Color().setHSL(0.245 + this.random() * 0.02, 0.46, 0.34 + this.random() * 0.09),
        this.random() * 0.14,
        0,
      );
    }
  };
  P.decorateArchitecture = function () {
    const d = window.RayBuildingLandscape,
      shift = d.buildingShift || 0;
    this.elevation = 0;
    this.createProjectPlantMaterials();
    // Every authored addition uses the same translation as the source architecture.
    const originalAdd = this.addBatch;
    this.addBatch = function (
      key,
      geo,
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
        geo,
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
      for (const [x, z, y, palm, size] of d.plants) {
        if (
          d.palmPlanters.some((p) => Math.hypot(x - p[0], z - p[1]) < 2 && Math.abs(y - p[2]) < 1)
        )
          continue;
        this.projectShrub(x, z, y + 0.08, size, this.random() * 6.28);
        if (palm && y > 3) this.projectPalm(x, z, y + 0.1, 3.5 + size * 2, this.random() * 6.28);
      }
      for (const [x, z, y, size, rotation] of d.bedShrubs)
        this.projectShrub(x, z, y + 0.04, size, rotation);
      for (const [x, z, y, height, rotation] of d.palmPlanters)
        this.projectPalm(x, z, y + 0.02, height, rotation);
      const roof = 70.82;
      d.roofPlanters.forEach(([x, z, yaw]) => {
        this.box("ivory", x, roof + 0.29, z, 2.7, 0.55, 1.1, yaw);
        this.box("grassdark", x, roof + 0.59, z, 2.46, 0.12, 0.88, yaw);
        this.projectShrub(x, z, roof + 0.65, 0.85, yaw);
      });
      this.createPenthouses(roof);
      this.slab("source-pool-water", 0, 21.49, 9.8, 25.4, 8.5, 0.025, 0.8, "pool");
    } finally {
      this.addBatch = originalAdd;
    }
    this.canvas.dataset.sourcePlanting = String(d.plants.length);
    this.canvas.dataset.bedShrubs = String(d.bedShrubs.length);
    this.canvas.dataset.planterPalms = String(d.palmPlanters.length);
    this.canvas.dataset.roofPlanters = String(d.roofPlanters.length);
    this.canvas.dataset.buildingShift = String(shift);
    this.canvas.dataset.buildingYaw = ((d.buildingYaw * 180) / Math.PI).toFixed(2);
    this.canvas.dataset.penthouses = "2";
    this.canvas.dataset.terracePools = "6";
  };
  P.createPenthouses = function (roof) {
    const glass = (this.materials.penthouseGlass = new T.MeshPhysicalMaterial({
      name: "Penthouse glass",
      color: 0x7ba5bf,
      metalness: 0.22,
      roughness: 0.06,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      ior: 1.52,
      envMapIntensity: 2.6,
    }));
    glass.userData.rayReflective = true;
    this.modelMaterials.add(glass);
    this.materials.penthouseWall = this.material("penthouseWall", 0xd6cbb4, {
      roughness: 0.78,
    });
    const light = (this.materials.penthouseLight = this.material("penthouseLight", 0xf3e8d0, {
      emissive: 0xffd59d,
      emissiveIntensity: 0.1,
    }));
    light.userData.rayLamp = true;
    this.modelMaterials.add(light);
    const planter = (x, z, y, w = 3.6, d = 1.1) => {
      this.box("ivory", x, y + 0.28, z, w, 0.56, d);
      this.box("grassdark", x, y + 0.58, z, w - 0.18, 0.08, d - 0.18);
      for (let a = -w / 2 + 0.45; a < w / 2; a += 0.7)
        this.projectShrub(x + a, z, y + 0.64, 0.65, this.random() * 6.28);
    };
    for (const tower of [-1, 1]) {
      const center = tower * 47.5;
      this.slab("penthouse-terrace-deck", center, roof + 0.04, 0.5, 55, 10.5, 0.12, 0.6, "wood");
      for (const [index, dx] of [-13, 13].entries()) {
        const x = center + dx,
          z = index ? -12.3 : -14,
          height = index ? 4.2 : 3.4,
          depth = index ? 16 : 14.5;
        this.slab(
          "penthouse-plinth-" + index,
          x,
          roof + 0.025,
          z,
          23.4,
          depth + 1.2,
          0.16,
          0.65,
          "paving",
        );
        this.box("penthouseGlass", x, roof + 0.25 + height / 2, z, 22.2, height, depth);
        this.box(
          "penthouseWall",
          x,
          roof + 0.25 + height / 2,
          z - depth / 2 + 0.15,
          21.7,
          height,
          0.24,
        );
        this.box("wood", x, roof + 0.25, z, 21.8, 0.08, depth - 0.6);
        this.slab(
          "penthouse-canopy-" + index,
          x,
          roof + height + 0.32,
          z,
          24.1,
          depth + 2,
          0.24,
          0.7,
          "ivory",
        );
        this.box("wood", x, roof + height + 0.32, z, 22.9, 0.08, depth + 0.6);
        this.box("penthouseLight", x, roof + height + 0.18, z + depth / 2 - 0.4, 16, 0.055, 0.1);
        for (let a = -10.5; a < 10.6; a += 3.5)
          this.box(
            "bronze",
            x + a,
            roof + 0.25 + height / 2,
            z + depth / 2 + 0.02,
            0.08,
            height,
            0.085,
          );
        for (const side of [-1, 1])
          for (const dz of [-depth / 3, 0, depth / 3])
            this.box(
              "bronze",
              x + side * 11.12,
              roof + 0.25 + height / 2,
              z + dz,
              0.075,
              height,
              0.075,
            );
        // A planted upper roof and a raised louvred wing break up the canopy silhouette.
        planter(x - 5.8, z - 3.6, roof + height + 0.58, 8, 3.3);
        for (const a of [-8, -5, -2])
          this.projectShrub(x + a, z - 3.6, roof + height + 1.2, 1.05, this.random() * 6.28);
        this.projectPalm(
          x - 6.5,
          z - 3.6,
          roof + height + 1.1,
          2.4 + index * 0.5,
          this.random() * 6.28,
        );
        for (let a = 1; a < 11; a += 0.5)
          this.box("bronze", x + a, roof + height + 0.85, z + 2.7, 0.1, 0.14, 6.8);
        for (const a of [1, 10.5])
          this.box("bronze", x + a, roof + height + 0.6, z + 2.7, 0.1, 0.6, 0.1);
        for (const a of [-7, 1, 8]) planter(x + a, z + depth / 2 + 0.75, roof + 0.16, 3.6, 0.85);
        this.box("penthouseWall", x - 4, roof + 0.73, z + 2, 5.2, 0.9, 1.4);
        this.box("white", x - 4, roof + 1.21, z + 2, 4.9, 0.13, 1.2);
        this.box("wood", x + 3, roof + 0.67, z + 2, 2.3, 0.1, 1.4);
        for (const a of [-1, 1])
          this.box("white", x + 3 + a * 1.8, roof + 0.68, z + 2, 1.1, 0.7, 1);
      }
      this.box("penthouseGlass", center, roof + 1.8, -13, 4.2, 3.1, 8);
      this.slab("penthouse-connector", center, roof + 3.4, -13, 5, 9, 0.18, 0.25, "ivory");
      // Three distinct plunge pools face the bay on each tower, within the existing roof edge.
      for (const dx of [-18, 0, 18]) {
        const x = center + dx,
          z = 3.1;
        this.slab("penthouse-pool-plinth", x, roof + 0.16, z, 9.4, 5.1, 0.48, 0.45, "ivory");
        this.slab("penthouse-plunge-water", x, roof + 0.65, z, 8.5, 4.2, 0.025, 0.3, "pool");
        for (const side of [-1, 1]) {
          this.box("ivory", x, roof + 0.74, z + side * 2.32, 9, 0.18, 0.38);
          this.box("ivory", x + side * 4.44, roof + 0.74, z, 0.38, 0.18, 4.55);
        }
        for (const step of [0, 1])
          this.box("paving", x, roof + 0.17 + step * 0.13, z - 2.9 + step * 0.3, 2.8, 0.18, 0.5);
        for (const a of [-2, 2]) {
          this.box("wood", x + a, roof + 0.29, -0.75, 1.35, 0.18, 2.3);
          this.box("white", x + a, roof + 0.43, -0.75, 1.22, 0.13, 2.16);
        }
      }
      for (const dx of [-9, 9]) {
        planter(center + dx, 3.2, roof + 0.18, 2.8, 2.4);
        this.projectPalm(
          center + dx,
          3.2,
          roof + 0.88,
          3.1 + this.random() * 0.8,
          this.random() * 6.28,
        );
      }
      for (const dx of [-22, -11, 0, 11, 22]) {
        planter(center + dx, -23.5, roof + 0.04, 5.4, 1.6);
        this.projectPalm(
          center + dx,
          -23.5,
          roof + 0.7,
          2.6 + this.random() * 0.9,
          this.random() * 6.28,
        );
      }
    }
  };
  P.inspectGlassProbe = function (target) {
    const sample = new Uint16Array(4);
    let energy = 0;
    const values = [];
    // Sample each base cube face in the PMREM atlas. Readback happens only on a
    // lighting change, never during orbiting or the normal animation loop.
    const size = target.width / 3;
    for (const [x, y] of [
      [0.5, 0.5],
      [1.5, 0.5],
      [2.5, 0.5],
      [0.5, 1.5],
      [1.5, 1.5],
      [2.5, 1.5],
    ]) {
      sample.fill(0);
      this.renderer.readRenderTargetPixels(
        target,
        Math.floor(x * size),
        Math.floor(y * size),
        1,
        1,
        sample,
      );
      const rgb = Array.from(sample.slice(0, 3), (value) => T.DataUtils.fromHalfFloat(value));
      values.push(rgb);
      if (!rgb.every(Number.isFinite)) return { valid: false, energy: 0, values };
      energy += rgb.reduce((sum, value) => sum + Math.max(0, value), 0);
    }
    return { valid: energy > 0.00001, energy, values };
  };
  P.captureGlassEnvironment = function () {
    if (this.quality.compact || !this.quality.hdr) {
      this.glassCaptureMood = this.mood;
      this.canvas.dataset.glass = "blue-sky-reflections";
      return;
    }
    this.glassCubeTarget ??= new T.WebGLCubeRenderTarget(256, {
      type: T.HalfFloatType,
      generateMipmaps: true,
      minFilter: T.LinearMipmapLinearFilter,
    });
    // The sky sphere has an 8 km radius. The old 4.5 km far plane clipped it
    // completely, producing black sky pixels in the reflection environment.
    this.glassCubeCamera ??= new T.CubeCamera(2, this.camera.far, this.glassCubeTarget);
    this.glassCubeCamera.position.set(0, 38, window.RayBuildingLandscape.buildingShift || 0);
    const sky = this.sky.position.clone();
    const background = this.scene.background;
    const shadowUpdate = this.renderer.shadowMap.needsUpdate;
    const hidden = [];
    let environment;
    try {
      // Exclude all glazing using this probe, including the added penthouses.
      this.scene.traverse((object) => {
        const materials = object.material
          ? Array.isArray(object.material)
            ? object.material
            : [object.material]
          : [];
        if (object === this.modelRoot || materials.some((mat) => mat.userData.rayReflective)) {
          hidden.push([object, object.visible]);
          object.visible = false;
        }
      });
      this.sky.position.copy(this.glassCubeCamera.position);
      this.scene.background = this.skyUniforms.horizon.value;
      this.renderer.shadowMap.needsUpdate = false;
      this.glassCubeCamera.update(this.renderer, this.scene);
      this.pmremGenerator ??= new T.PMREMGenerator(this.renderer);
      environment = this.pmremGenerator.fromCubemap(this.glassCubeTarget.texture);
      const probe = this.inspectGlassProbe(environment);
      this.canvas.dataset.glassProbe = JSON.stringify({
        mood: this.mood,
        valid: probe.valid,
        energy: probe.energy,
      });
      if (!probe.valid) throw Error("Glass reflection probe contained invalid or empty radiance");
      delete this.canvas.dataset.glassProbeError;
      const old = this.glassEnvironment;
      this.glassEnvironment = environment;
      for (const mat of this.modelMaterials)
        if (mat.userData.rayReflective) {
          mat.envMap = environment.texture;
          mat.needsUpdate = true;
        }
      environment = null;
      old?.dispose();
      this.canvas.dataset.glass = "validated-blue-scene-reflections";
    } catch (error) {
      environment?.dispose();
      // Preserve the last valid reflection, or use the already prepared sky map.
      const fallback = this.glassEnvironment?.texture || this.scene.environment;
      for (const mat of this.modelMaterials)
        if (mat.userData.rayReflective) {
          mat.envMap = fallback;
          mat.needsUpdate = true;
        }
      this.canvas.dataset.glass = "validated-sky-fallback";
      this.canvas.dataset.glassProbeError = error.message;
    } finally {
      for (const [object, visible] of hidden) object.visible = visible;
      this.renderer.shadowMap.needsUpdate = shadowUpdate;
      this.sky.position.copy(sky);
      this.scene.background = background;
      this.glassCaptureMood = this.mood;
    }
  };
  const present = P.renderPresentation;
  P.renderPresentation = function () {
    if (this.modelRoot && this.glassCaptureMood !== this.mood && !this.lightIsMoving)
      this.captureGlassEnvironment();
    present.call(this);
  };
})();

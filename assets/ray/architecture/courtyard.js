/* Lightweight dining garden on the existing connecting roof between the towers. */
(() => {
  "use strict";
  const T = window.THREE,
    P = window.RayWorld.prototype;
  const decorate = P.decorateArchitecture;
  P.decorateArchitecture = function () {
    decorate.call(this);
    const before = new Map([...this.batches].map(([key, batch]) => [key, batch.items.length]));
    const floor = 32.715;
    const materials = this.clubMaterials();
    // Furniture shares unit boxes and existing materials; palms and shrubs use existing batches.
    const place = (geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, yaw = 0, color = null) => {
      const p = this.alignProjectItem({ x, z, ry: yaw });
      this.addBatch(
        "courtyard-" + geometry.uuid + "-" + material.uuid,
        geometry,
        material,
        p.x,
        y,
        p.z,
        sx,
        sy,
        sz,
        p.ry,
        color,
      );
    };
    const box = (material, x, y, z, w, h, d, yaw = 0, color = null) =>
      place(this.boxGeometry, material, x, y, z, w, h, d, yaw, color);
    const outline = [
      [-21.5, -26.5],
      [21.5, -26.5],
      [21.5, -12],
      [18, -3],
      [11.5, 6.6],
      [-11.5, 6.6],
      [-18, -3],
      [-21.5, -12],
    ];
    const shape = new T.Shape(outline.map(([x, z]) => new T.Vector2(x, -z)));
    const deck = new T.ShapeGeometry(shape);
    deck.rotateX(-Math.PI / 2);
    const uv = deck.attributes.uv,
      position = deck.attributes.position;
    for (let i = 0; i < position.count; i++)
      uv.setXY(i, position.getX(i) * 0.25, position.getZ(i) * 0.25);
    place(deck, materials.wood, 0, floor, 0);

    const lantern = (x, z, height = 0.85) => {
      box(materials.metal, x, floor + 0.055, z, 0.33, 0.11, 0.33);
      box(this.materials.lamp, x, floor + height * 0.45, z, 0.14, height * 0.65, 0.14);
      for (const dx of [-0.145, 0.145])
        for (const dz of [-0.145, 0.145])
          box(materials.metal, x + dx, floor + height * 0.5, z + dz, 0.025, height, 0.025);
      box(materials.metal, x, floor + height, z, 0.35, 0.055, 0.35);
    };
    const chair = (x, z, yaw) => {
      const point = (dx, dz) => [
        x + dx * Math.cos(yaw) + dz * Math.sin(yaw),
        z - dx * Math.sin(yaw) + dz * Math.cos(yaw),
      ];
      box(materials.sage, x, floor + 0.47, z, 0.54, 0.12, 0.55, yaw);
      const back = point(0, 0.25);
      box(materials.sage, back[0], floor + 0.79, back[1], 0.55, 0.54, 0.075, yaw);
      for (const dx of [-0.22, 0.22])
        for (const dz of [-0.21, 0.21]) {
          const p = point(dx, dz);
          box(materials.metal, p[0], floor + 0.21, p[1], 0.045, 0.42, 0.045, yaw);
        }
    };
    const plate = new T.CylinderGeometry(0.16, 0.16, 0.025, 10);
    const table = (x, z) => {
      box(materials.wood, x, floor + 0.78, z, 3.1, 0.14, 1.35);
      for (const dx of [-1.26, 1.26])
        for (const dz of [-0.48, 0.48])
          box(materials.metal, x + dx, floor + 0.35, z + dz, 0.075, 0.7, 0.075);
      for (const dx of [-0.95, 0, 0.95])
        for (const side of [-1, 1]) {
          chair(x + dx, z + side * 1.14, side > 0 ? 0 : Math.PI);
          place(plate, materials.linen, x + dx, floor + 0.87, z + side * 0.43);
        }
      box(this.materials.lamp, x, floor + 0.99, z, 0.1, 0.25, 0.1);
    };
    for (const x of [-5.3, 5.3]) for (const z of [-20, -10, 0]) table(x, z);

    const originalAdd = this.addBatch;
    const planting = (callback) => {
      this.addBatch = function (
        key,
        geometry,
        material,
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
          geometry,
          material,
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
        callback();
      } finally {
        this.addBatch = originalAdd;
      }
    };
    const flower = new T.SphereGeometry(1, 5, 3);
    let planters = 0;
    const planter = (x, z, w, d, palm = false) => {
      const h = 0.82;
      box(this.materials.ivory, x - w / 2 + 0.09, floor + h / 2, z, 0.18, h, d);
      box(this.materials.ivory, x + w / 2 - 0.09, floor + h / 2, z, 0.18, h, d);
      box(this.materials.ivory, x, floor + h / 2, z - d / 2 + 0.09, w - 0.3, h, 0.18);
      box(this.materials.ivory, x, floor + h / 2, z + d / 2 - 0.09, w - 0.3, h, 0.18);
      box(this.materials.soil, x, floor + h - 0.08, z, w - 0.32, 0.1, d - 0.32);
      planting(() => {
        for (let dx = -w / 2 + 0.6; dx < w / 2 - 0.3; dx += 0.95)
          for (let dz = -d / 2 + 0.6; dz < d / 2 - 0.3; dz += 0.95)
            this.projectShrub(x + dx, z + dz, floor + h, 0.88, (dx + dz) * 0.7);
        if (palm) this.projectPalm(x, z, floor + h, 4.7, x * 0.13);
      });
      for (let i = 0; i < 6; i++)
        place(
          flower,
          materials.linen,
          x + Math.sin(i * 2.4) * (w * 0.28),
          floor + h + 0.59,
          z + Math.cos(i * 2.4) * (d * 0.25),
          0.15,
          0.13,
          0.15,
          0,
          new T.Color(i % 2 ? 0xbe7787 : 0xe2b6bd),
        );
      planters++;
    };
    planter(0, -20, 4.8, 3.6, true);
    planter(0, -10, 4.8, 3.6);
    planter(0, 1.8, 4.8, 3.1, true);
    for (const side of [-1, 1]) {
      planter(side * 5.4, -25, 1.9, 2.5, true);
      planter(side * 9.2, 4.7, 1.8, 2.4);
    }
    for (const z of [-20, -10, 1.8]) for (const x of [-3.15, 3.15]) lantern(x, z + 2.35);
    for (const side of [-1, 1]) for (const z of [-16, -6, 4.2]) lantern(side * 6, z, 0.62);
    let triangles = 0,
      placements = 0,
      addedBatches = 0;
    for (const [key, batch] of this.batches) {
      const count = batch.items.length - (before.get(key) || 0);
      if (count <= 0) continue;
      placements += count;
      triangles +=
        (count * (batch.geometry.index?.count || batch.geometry.attributes.position.count)) / 3;
      if (!before.has(key)) addedBatches++;
    }
    this.canvas.dataset.courtyard = JSON.stringify({
      style: "planted-dining-garden",
      tables: 6,
      chairs: 36,
      planters,
      palms: 4,
      lanterns: 12,
      newMaterials: 0,
      animatedLights: 0,
      triangles,
      placements,
      addedBatches,
    });
  };
})();

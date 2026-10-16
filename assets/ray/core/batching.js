/* Tiny static fittings are indexed meshes per material and neighborhood block. */
(() => {
  "use strict";
  const T = window.THREE;
  const Context = window.RayCleanContext.prototype;
  const addGeometry = Context.add;
  const fittings =
    /^(villa-window|villa-windows|villa-entrance|villa-garage|villa-front|villa-entry)/;

  function appendQuad(batch, geometry) {
    const attributes = geometry.attributes;
    const base = batch.position.length / 3;
    // villaQuad emits [bottom-left, top-left, bottom-right, bottom-right, top-left, top-right].
    for (const index of [0, 1, 2, 5]) {
      for (const component of ["X", "Y", "Z"]) {
        batch.position.push(attributes.position["get" + component](index));
        batch.normal.push(Math.round(attributes.normal["get" + component](index) * 32767));
        batch.color.push(
          Math.round(
            Math.max(0, Math.min(1, attributes.color?.["get" + component](index) ?? 1)) * 255,
          ),
        );
      }
      batch.uv.push(
        Math.round(attributes.uv.getX(index) * 255),
        Math.round(attributes.uv.getY(index) * 255),
      );
    }
    batch.index.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    geometry.dispose();
  }

  Context.add = function (key, geometry, material) {
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new T.Vector3());
    const block = `${Math.floor(center.x / 480)},${Math.floor(center.z / 480)}`;
    if (fittings.test(key) && geometry.attributes.position.count === 6) {
      this.staticFittings ??= new Map();
      const batchKey = `${material.uuid}@${block}`;
      if (!this.staticFittings.has(batchKey))
        this.staticFittings.set(batchKey, {
          material,
          position: [],
          normal: [],
          color: [],
          uv: [],
          index: [],
        });
      appendQuad(this.staticFittings.get(batchKey), geometry);
      return;
    }
    addGeometry.call(this, `${material.uuid}@${block}`, geometry, material);
  };

  Context.flush = function () {
    // Keep spatial culling; a single map-wide mesh would draw off-screen neighborhoods too.
    for (const [key, part] of this.parts) {
      const mesh = new T.Mesh(this.merge(part.geometries), part.material);
      const category = key.split("@")[0];
      mesh.name = `Neighborhood / ${key}`;
      mesh.receiveShadow = true;
      mesh.castShadow =
        ["buildings", "roofs", "balcony-bands", "villa-walls", "concrete-flat-roofs"].includes(
          category,
        ) || category.startsWith("villa-roof-");
      this.w.scene.add(mesh);
    }
    this.parts.clear();
    let total = 0,
      bytes = 0;
    for (const [key, batch] of this.staticFittings || []) {
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.Float32BufferAttribute(batch.position, 3));
      geometry.setAttribute("normal", new T.Int16BufferAttribute(batch.normal, 3, true));
      geometry.setAttribute("uv", new T.Uint8BufferAttribute(batch.uv, 2, true));
      geometry.setAttribute("color", new T.Uint8BufferAttribute(batch.color, 3, true));
      const Index =
        batch.position.length / 3 > 65535 ? T.Uint32BufferAttribute : T.Uint16BufferAttribute;
      geometry.setIndex(new Index(batch.index, 1));
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const mesh = new T.Mesh(geometry, batch.material);
      mesh.name = `Merged villa fittings / ${key}`;
      mesh.receiveShadow = true;
      this.w.scene.add(mesh);
      total += batch.index.length / 6;
      bytes +=
        Object.values(geometry.attributes).reduce(
          (sum, attribute) => sum + attribute.array.byteLength,
          0,
        ) + geometry.index.array.byteLength;
    }
    this.w.canvas.dataset.villaFittingMode = "indexed-static-chunks";
    this.w.canvas.dataset.villaFittingQuads = String(total);
    this.w.canvas.dataset.villaFittingBytes = String(bytes);
    this.w.canvas.dataset.villaFittingBatches = String(this.staticFittings?.size || 0);
    this.w.canvas.dataset.villaFittingInstances = "0";
    this.staticFittings?.clear();
  };
})();

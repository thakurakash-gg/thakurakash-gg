/* Repeated villa fittings share one quad. Unique footprints are merged by neighborhood block. */
(() => {
  const THREE = window.THREE;
  const Context = window.RayCleanContext.prototype;
  const addGeometry = Context.add;
  const flushGeometry = Context.flush;
  const fittings =
    /^(villa-window|villa-windows|villa-entrance|villa-garage|villa-front|villa-entry)/;

  Context.add = function (key, geometry, material) {
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    const block = `${Math.floor(center.x / 480)},${Math.floor(center.z / 480)}`;
    if (fittings.test(key) && geometry.attributes.position.count === 6) {
      this.fittingBatches ||= new Map();
      const batchKey = `${material.uuid}@${block}`;
      if (!this.fittingBatches.has(batchKey))
        this.fittingBatches.set(batchKey, { material, items: [] });
      const positions = geometry.attributes.position;
      const bottomLeft = new THREE.Vector3().fromBufferAttribute(positions, 0);
      const topLeft = new THREE.Vector3().fromBufferAttribute(positions, 1);
      const bottomRight = new THREE.Vector3().fromBufferAttribute(positions, 2);
      const across = bottomRight.sub(bottomLeft);
      const up = topLeft.sub(bottomLeft);
      const width = across.length(),
        height = up.length();
      across.normalize();
      up.normalize();
      const normal = new THREE.Vector3().crossVectors(across, up);
      const rotation = new THREE.Matrix4().makeBasis(across, up, normal);
      const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotation);
      const color = geometry.attributes.color
        ? new THREE.Color().fromBufferAttribute(geometry.attributes.color, 0)
        : new THREE.Color(0xffffff);
      this.fittingBatches
        .get(batchKey)
        .items.push({ center, quaternion, scale: new THREE.Vector3(width, height, 1), color });
      geometry.dispose();
      return;
    }
    addGeometry.call(this, `${material.uuid}@${block}`, geometry, material);
  };

  Context.flush = function () {
    // Spatial groups preserve exact mapped footprints while allowing frustum culling.
    for (const [key, part] of this.parts) {
      const mesh = new THREE.Mesh(this.merge(part.geometries), part.material);
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
    const quad = (this.fittingQuad ||= new THREE.PlaneGeometry(1, 1));
    const matrix = new THREE.Matrix4();
    let total = 0;
    for (const [key, batch] of this.fittingBatches || []) {
      const mesh = new THREE.InstancedMesh(quad, batch.material, batch.items.length);
      batch.items.forEach((item, index) => {
        matrix.compose(item.center, item.quaternion, item.scale);
        mesh.setMatrixAt(index, matrix);
        mesh.setColorAt(index, item.color);
      });
      mesh.name = `Instanced villa fittings / ${key}`;
      mesh.computeBoundingSphere();
      mesh.receiveShadow = true;
      this.w.scene.add(mesh);
      total += batch.items.length;
    }
    this.fittingBatches?.clear();
    this.w.canvas.dataset.villaFittingInstances = String(total);
  };
})();

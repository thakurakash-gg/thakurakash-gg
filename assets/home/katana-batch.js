/* Merge rigid details sharing a finish; preserve vertices, normals, UVs and moving parts. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KazeyamiBatchRigid = factory();
})(typeof window === "object" ? window : this, function () {
  return function batchRigid(T, root) {
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert(),
      buckets = new Map();
    let sourceMeshes = 0,
      renderMeshes = 0;
    root.traverse((object) => {
      if (!object.isMesh) return;
      sourceMeshes++;
      if (
        object.isInstancedMesh ||
        object.isSkinnedMesh ||
        object.morphTargetInfluences ||
        Array.isArray(object.material) ||
        !object.visible
      )
        return;
      const geometry = object.geometry;
      const schema = Object.keys(geometry.attributes)
        .sort()
        .map((key) =>
          [
            key,
            geometry.attributes[key].itemSize,
            geometry.attributes[key].normalized,
            geometry.attributes[key].array.constructor.name,
          ].join(":"),
        )
        .join("|");
      const key = object.material.uuid + "|" + schema;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(object);
    });
    for (const objects of buckets.values()) {
      if (objects.length < 2) continue;
      const pieces = objects.map((object) =>
        object.geometry
          .clone()
          .applyMatrix4(inverse.clone().multiply(object.matrixWorld)),
      );
      const geometry = new T.BufferGeometry(),
        names = Object.keys(pieces[0].attributes);
      for (const name of names) {
        const attribute = pieces[0].attributes[name],
          array = new attribute.array.constructor(
            pieces.reduce(
              (sum, part) => sum + part.attributes[name].array.length,
              0,
            ),
          );
        let offset = 0;
        for (const part of pieces) {
          array.set(part.attributes[name].array, offset);
          offset += part.attributes[name].array.length;
        }
        geometry.setAttribute(
          name,
          new T.BufferAttribute(
            array,
            attribute.itemSize,
            attribute.normalized,
          ),
        );
      }
      const indices = [];
      let offset = 0;
      for (const part of pieces) {
        const count = part.attributes.position.count;
        if (part.index)
          for (const index of part.index.array) indices.push(index + offset);
        else for (let i = 0; i < count; i++) indices.push(i + offset);
        offset += count;
        part.dispose();
      }
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();
      const mesh = new T.Mesh(geometry, objects[0].material);
      mesh.name = "Batched rigid details";
      for (const object of objects) object.parent.remove(object);
      root.add(mesh);
    }
    root.traverse((object) => {
      if (object.isMesh) renderMeshes++;
    });
    return { sourceMeshes, renderMeshes };
  };
});

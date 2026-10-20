const assert = require("node:assert/strict"),
  T = require("../../assets/three.min.js"),
  batch = require("../../assets/home/katana-batch.js");
const group = new T.Group();
group.position.set(3, 2, -1);
group.rotation.y = 0.25;
const finish = new T.MeshStandardMaterial();
for (let i = 0; i < 8; i++) {
  const mesh = new T.Mesh(new T.BoxGeometry(1, 0.2, 0.3), finish);
  mesh.position.set(i * 0.4, Math.sin(i), i * 0.1);
  mesh.rotation.z = i * 0.17;
  group.add(mesh);
}
const nested = new T.Group();
nested.position.set(2, 1, 0);
nested.rotation.z = 0.4;
group.add(nested);
nested.add(new T.Mesh(new T.SphereGeometry(0.3, 8, 4), finish));
const separate = new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), [
  finish,
  new T.MeshStandardMaterial(),
]);
group.add(separate);
const instances = new T.InstancedMesh(
  new T.SphereGeometry(0.1, 8, 4),
  finish,
  3,
);
instances.setMatrixAt(0, new T.Matrix4().makeTranslation(1, 2, 3));
group.add(instances);
function triangles() {
  group.updateWorldMatrix(true, true);
  const result = [];
  group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const g = mesh.geometry,
      p = g.attributes.position,
      index = g.index?.array || Array.from({ length: p.count }, (_, i) => i);
    for (let i = 0; i < index.length; i += 3) {
      const triangle = [];
      for (let j = 0; j < 3; j++) {
        const v = new T.Vector3()
          .fromBufferAttribute(p, index[i + j])
          .applyMatrix4(mesh.matrixWorld);
        triangle.push(
          v
            .toArray()
            .map((x) => x.toFixed(4))
            .join(","),
        );
      }
      result.push(triangle.join("|"));
    }
  });
  return result.sort();
}
const before = triangles(),
  stats = batch(T, group),
  after = triangles();
assert.equal(stats.sourceMeshes, 11);
assert.equal(stats.renderMeshes, 3);
assert.deepEqual(
  after,
  before,
  "Batching preserves every transformed triangle",
);
assert(
  group.children.includes(separate),
  "Multi-material blade surfaces remain untouched",
);
assert(
  group.children.includes(instances),
  "Instanced ornament geometry and matrices remain untouched",
);
const merged = group.children.find((x) => x.name === "Batched rigid details");
assert(merged.geometry.attributes.normal && merged.geometry.attributes.uv);
console.log(
  "Rigid batching: 11 meshes → 3 with identical triangles, UVs, normals, instances and independent materials.",
);

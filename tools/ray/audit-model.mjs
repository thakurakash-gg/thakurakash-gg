import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const bytes = fs.readFileSync(path.join(root, "assets/ray/models/site.glb"));
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const materials = new Map();
let placed = 0,
  unique = 0;
for (const mesh of gltf.meshes)
  for (const primitive of mesh.primitives)
    unique += gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3;
for (const node of gltf.nodes) {
  if (node.mesh === undefined) continue;
  const attributes = node.extensions?.EXT_mesh_gpu_instancing?.attributes;
  const instances = attributes ? gltf.accessors[Object.values(attributes)[0]].count : 1;
  for (const primitive of gltf.meshes[node.mesh].primitives) {
    const count = gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3,
      name = gltf.materials[primitive.material]?.name || "Unnamed";
    placed += count * instances;
    materials.set(name, (materials.get(name) || 0) + count * instances);
  }
}
const report = {
  modelBytes: bytes.length,
  uniqueTriangles: unique,
  placedTriangles: placed,
  modelMaterialDefinitions: gltf.materials.length,
  largestMaterialGroups: [...materials]
    .map(([name, triangles]) => ({ name, triangles }))
    .sort((a, b) => b.triangles - a.triangles),
};
fs.mkdirSync(path.join(root, "docs/ray"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/ray/model-audit.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

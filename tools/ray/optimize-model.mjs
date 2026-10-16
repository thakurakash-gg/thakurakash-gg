import path from "node:path";
import { fileURLToPath } from "node:url";
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."));
import { instanceUpperFloors } from "./instance-floors.mjs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dequantize,
  weld,
  simplifyPrimitive,
  meshopt,
  prune,
  normals,
} from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const doc = await io.read("assets/ray/models/reference/mobile.glb");
await doc.transform(dequantize());
// Close-up metalwork has split face normals. Weld position seams only on uniform finishes,
// retaining textured wood, glass, planting and all authored parts.
for (const mesh of doc.getRoot().listMeshes())
  for (const prim of mesh.listPrimitives()) {
    if (
      !/^(steel|White Glossy Metal|Metal Black|Black Matt|Painted Plaster Wall|Concrete White)$/.test(
        prim.getMaterial()?.getName() || "",
      )
    )
      continue;
    const material = prim.getMaterial();
    for (const slot of ["BaseColor", "MetallicRoughness", "Normal", "Occlusion", "Emissive"])
      material["set" + slot + "Texture"](null);
    const specular = material.getExtension("KHR_materials_specular");
    if (specular) {
      specular.setSpecularTexture(null);
      specular.setSpecularColorTexture(null);
    }
    prim.setAttribute("TEXCOORD_0", null);
    prim.setAttribute("TEXCOORD_1", null);
    const position = prim.getAttribute("POSITION"),
      vertices = position.getArray(),
      indices = prim.getIndices().getArray(),
      canonical = new Map(),
      remap = new Uint32Array(position.getCount());
    for (let i = 0; i < remap.length; i++) {
      const key = [0, 1, 2].map((k) => Math.round(vertices[i * 3 + k] * 100000)).join(",");
      if (!canonical.has(key)) canonical.set(key, i);
      remap[i] = canonical.get(key);
    }
    const mapped = new Uint32Array(indices.length);
    for (let i = 0; i < indices.length; i++) mapped[i] = remap[indices[i]];
    prim.setIndices(doc.createAccessor().setType("SCALAR").setArray(mapped));
    prim.setAttribute("NORMAL", null);
  }
for (const mesh of doc.getRoot().listMeshes())
  for (const prim of mesh.listPrimitives()) {
    const name = prim.getMaterial()?.getName() || "";
    simplifyPrimitive(prim, {
      simplifier: MeshoptSimplifier,
      ratio: 0.3,
      error: /White Glossy Metal|Concrete White/.test(name)
        ? 0.00008
        : /steel|Black Matt/.test(name)
          ? 0.0005
          : 0.00015,
      lockBorder: false,
    });
  }
await doc.transform(normals(), weld());
await instanceUpperFloors(doc);
await doc.transform(weld(), prune(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
await io.write("assets/ray/models/site.glb", doc);
console.log(
  "triangles",
  doc
    .getRoot()
    .listMeshes()
    .reduce(
      (n, m) =>
        n +
        m
          .listPrimitives()
          .reduce(
            (s, p) => s + (p.getIndices()?.getCount() || p.getAttribute("POSITION").getCount()) / 3,
            0,
          ),
      0,
    ),
);

import { transformPrimitive, instance, dedup } from "@gltf-transform/functions";
// Extract matching upper-floor assemblies after baking their existing node transforms.
export async function instanceUpperFloors(document) {
  const scene = document.getRoot().getDefaultScene(),
    period = 3.465,
    report = { assemblies: 0, placements: 0 };
  for (const node of [...document.getRoot().listNodes()]) {
    const mesh = node.getMesh();
    if (!mesh || !["Cube.027", "Cube.113"].includes(mesh.getName())) continue;
    const world = node.getWorldMatrix(),
      replacement = [];
    for (const original of mesh.listPrimitives()) {
      const primitive = original.clone();
      transformPrimitive(primitive, world);
      const positions = primitive.getAttribute("POSITION").getArray(),
        indices =
          primitive.getIndices()?.getArray() ||
          Uint32Array.from({ length: positions.length / 3 }, (_, i) => i),
        groups = new Map();
      for (let i = 0; i < indices.length; i += 3) {
        const triangle = [indices[i], indices[i + 1], indices[i + 2]],
          heights = triangle.map((v) => positions[v * 3 + 1]),
          mean = heights.reduce((a, b) => a + b) / 3;
        const floor =
          Math.min(...heights) > 28 &&
          Math.max(...heights) < 68.8 &&
          Math.max(...heights) - Math.min(...heights) < period + 0.03
            ? Math.floor((mean - 26.8) / period)
            : -1;
        if (!groups.has(floor)) groups.set(floor, []);
        groups.get(floor).push(...triangle);
      }
      const templates = [];
      for (const [floor, ids] of groups) {
        const dy = floor < 0 ? 0 : floor * period,
          points = new Set(
            ids.map((i) =>
              [positions[i * 3], positions[i * 3 + 1] - dy, positions[i * 3 + 2]]
                .map((v) => Math.round(v * 10))
                .join(","),
            ),
          );
        let match =
          floor < 0
            ? null
            : templates.find((t) => {
                if (Math.abs(t.ids.length - ids.length) / ids.length > 0.025) return false;
                let common = 0;
                for (const p of points) if (t.points.has(p)) common++;
                return common / Math.max(points.size, t.points.size) > 0.94;
              });
        if (!match) {
          const p = document.createPrimitive().setMaterial(primitive.getMaterial());
          for (const semantic of primitive.listSemantics()) {
            const source = primitive.getAttribute(semantic),
              array = source.getArray(),
              size = source.getElementSize(),
              values = new Float32Array(ids.length * size);
            ids.forEach((vertex, j) => {
              for (let k = 0; k < size; k++)
                values[j * size + k] =
                  array[vertex * size + k] - (semantic === "POSITION" && k === 1 ? dy : 0);
            });
            p.setAttribute(
              semantic,
              document.createAccessor().setType(source.getType()).setArray(values),
            );
          }
          const newMesh = document
            .createMesh("Upper floor / " + original.getMaterial().getName())
            .addPrimitive(p);
          match = { ids, points, mesh: newMesh, count: 0 };
          if (floor >= 0) templates.push(match);
        }
        const floorNode = document
          .createNode(floor < 0 ? "Building base and transitions" : "Repeated upper floor")
          .setMesh(match.mesh)
          .setTranslation([0, dy, 0]);
        scene.addChild(floorNode);
        match.count++;
      }
      for (const t of templates)
        if (t.count > 1) {
          report.assemblies++;
          report.placements += t.count;
        }
    }
    node.setMesh(null);
  }
  await document.transform(dedup(), instance({ min: 2 }));
  console.log("Upper floor reuse", report);
  return report;
}

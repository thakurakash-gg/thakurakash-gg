/* Shared circular spine keeps the curved blade inside its hollow scabbard
   throughout extraction. Geometry data is independent of the renderer. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KazeyamiKatanaGeometry = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const radius = 1 / 0.044;
  const bladeStart = -6.2;
  const mouth = -0.18;
  const travel = 6.48;
  function point(s, normal = 0, z = 0) {
    const a = s / radius;
    return [
      Math.sin(a) * (radius - normal),
      radius - Math.cos(a) * (radius - normal),
      z,
    ];
  }
  function pose(amount) {
    const angle = (amount * travel) / radius;
    return {
      angle,
      x: radius * Math.sin(angle),
      y: radius * (1 - Math.cos(angle)),
    };
  }
  function geometry() {
    const positions = [],
      uvs = [],
      indices = [],
      groups = [];
    function vertex(p, u = 0, v = 0) {
      const index = positions.length / 3;
      positions.push(...p);
      uvs.push(u, v);
      return index;
    }
    // Orient each face against its intended outward direction.
    function triangle(a, b, c, normal, material = 0) {
      const pa = positions.slice(a * 3, a * 3 + 3);
      const pb = positions.slice(b * 3, b * 3 + 3);
      const pc = positions.slice(c * 3, c * 3 + 3);
      const u = pb.map((v, i) => v - pa[i]),
        v = pc.map((v, i) => v - pa[i]);
      const n = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      if (n.reduce((sum, value, i) => sum + value * normal[i], 0) < 0)
        [b, c] = [c, b];
      const start = indices.length;
      indices.push(a, b, c);
      const previous = groups[groups.length - 1];
      if (previous && previous.materialIndex === material) previous.count += 3;
      else groups.push({ start, count: 3, materialIndex: material });
    }
    return { positions, uvs, indices, groups, vertex, triangle };
  }
  function finish(g) {
    const sorted = [],
      groups = [];
    for (let material = 0; material < 3; material++) {
      const start = sorted.length;
      for (const group of g.groups)
        if (group.materialIndex === material)
          for (let i = group.start; i < group.start + group.count; i++)
            sorted.push(g.indices[i]);
      if (sorted.length > start)
        groups.push({
          start,
          count: sorted.length - start,
          materialIndex: material,
        });
    }
    g.indices = sorted;
    g.groups = groups;
    return g;
  }
  function bladeData() {
    const g = geometry();
    // Spine, broad face, cutting bevel and reverse face share welded vertices.
    const profile = [
      [0.205, 0],
      [0.11, 0.046],
      [-0.14, 0.04],
      [-0.205, 0],
      [-0.14, -0.04],
      [0.11, -0.046],
    ];
    const segments = 124,
      sides = profile.length;
    const tip = g.vertex(point(bladeStart, 0.18), 0, 0.94);
    const rings = [];
    for (let i = 1; i <= segments; i++) {
      const s = bladeStart + ((0.05 - bladeStart) * i) / segments;
      const taper = Math.min(1, (s - bladeStart) / 0.38);
      const ring = profile.map(([y, z]) => {
        const offset = y * taper + 0.18 * (1 - taper);
        return g.vertex(
          point(s, offset, z * taper),
          i / segments,
          (offset + 0.205) / 0.41,
        );
      });
      rings.push(ring);
      for (let j = 0; j < sides; j++) {
        const k = (j + 1) % sides;
        const nY = (profile[j][0] + profile[k][0]) / 2;
        const nZ = (profile[j][1] + profile[k][1]) / 2;
        const normal = [
          -Math.sin(s / radius) * nY,
          Math.cos(s / radius) * nY,
          nZ,
        ];
        const material = j === 1 || j === 4 ? 1 : j === 2 || j === 3 ? 2 : 0;
        if (i === 1) g.triangle(tip, ring[j], ring[k], normal, material);
        else {
          const previous = rings[i - 2];
          g.triangle(previous[j], ring[j], previous[k], normal, material);
          g.triangle(previous[k], ring[j], ring[k], normal, material);
        }
      }
    }
    const end = g.vertex(point(0.05), 1, 0.5),
      last = rings[rings.length - 1];
    for (let j = 0; j < sides; j++)
      g.triangle(end, last[j], last[(j + 1) % sides], [1, 0, 0]);
    return finish(g);
  }
  function sheathData() {
    const g = geometry(),
      segments = 100,
      sides = 32,
      surfaces = [];
    for (let shell = 0; shell < 2; shell++) {
      const rings = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments,
          start = shell ? -6.35 : -6.48;
        const s = start + (mouth - start) * t;
        const ring = [];
        for (let j = 0; j < sides; j++) {
          const a = (j / sides) * Math.PI * 2;
          const height = shell ? 0.244 : 0.29;
          const depth = shell ? 0.103 : 0.15;
          const y = Math.cos(a) * height,
            z = Math.sin(a) * depth;
          ring.push(g.vertex(point(s, y, z), t, j / sides));
        }
        rings.push(ring);
        if (i)
          for (let j = 0; j < sides; j++) {
            const k = (j + 1) % sides,
              a = ((j + 0.5) / sides) * Math.PI * 2;
            const sign = shell ? -1 : 1;
            const normal = [
              -Math.sin(s / radius) * Math.cos(a) * sign,
              Math.cos(s / radius) * Math.cos(a) * sign,
              Math.sin(a) * sign,
            ];
            g.triangle(
              rings[i - 1][j],
              ring[j],
              rings[i - 1][k],
              normal,
              shell,
            );
            g.triangle(rings[i - 1][k], ring[j], ring[k], normal, shell);
          }
      }
      // Solid rear end, cavity terminates before the outer cap.
      const start = shell ? -6.35 : -6.48,
        center = g.vertex(point(start));
      const sign = shell ? 1 : -1;
      for (let j = 0; j < sides; j++)
        g.triangle(
          center,
          rings[0][j],
          rings[0][(j + 1) % sides],
          [Math.cos(start / radius) * sign, Math.sin(start / radius) * sign, 0],
          shell,
        );
      surfaces.push(rings);
    }
    // Annular mouth joins both walls and leaves a genuine opening for the blade.
    const outer = surfaces[0][segments],
      inner = surfaces[1][segments];
    const normal = [Math.cos(mouth / radius), Math.sin(mouth / radius), 0];
    for (let j = 0; j < sides; j++) {
      const k = (j + 1) % sides;
      g.triangle(outer[j], outer[k], inner[j], normal, 1);
      g.triangle(outer[k], inner[k], inner[j], normal, 1);
    }
    return finish(g);
  }
  return {
    radius,
    bladeStart,
    mouth,
    travel,
    point,
    pose,
    bladeData,
    sheathData,
  };
});

/* Original procedural katana: no remote model, textures or animation framework. */
(() => {
  "use strict";
  const stage = document.querySelector("#katana-stage");
  if (!stage) return;
  const fallback = () => {
    stage.classList.add("is-unavailable");
    document.querySelector("#opening").classList.add("static-opening");
    document.querySelector(".blade-controls").hidden = true;
  };
  if (!window.THREE) {
    fallback();
    return;
  }
  const T = window.THREE;
  const G = window.KazeyamiKatanaGeometry;
  const finish = window.KazeyamiKatanaFinish;
  const createInteraction = window.KazeyamiKatanaInteraction;
  if (!G || !createInteraction || !finish || !window.KazeyamiKatanaFlight) {
    fallback();
    return;
  }
  const opening = document.querySelector("#opening");
  const stageHome = stage.parentElement,
    stageSibling = stage.nextSibling;
  let launched = false,
    returning = false,
    lastScrollY = scrollY;
  function dockCanvas(docked) {
    if (stage.classList.contains("is-docked") === docked) return;
    stage.classList.toggle("is-docked", docked);
    if (docked) stage.setAttribute("aria-hidden", "true");
    else stage.removeAttribute("aria-hidden");
    if (docked) document.body.append(stage);
    else stageHome.insertBefore(stage, stageSibling);
    measureAnchors();
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(pointer: coarse)").matches || innerWidth <= 700;
  const canvas = stage.querySelector("canvas");
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !compact,
      powerPreference: "low-power",
    });
  } catch {
    fallback();
    return;
  }
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 13);
  const model = new T.Group();
  scene.add(model);
  const blade = new T.Group();
  const sheath = new T.Group();
  model.add(blade, sheath);
  const steel = new T.Group(),
    hilt = new T.Group();
  blade.add(steel, hilt);
  const mapFrom = (w, h, paint) => {
    const surface = document.createElement("canvas");
    surface.width = w;
    surface.height = h;
    paint(surface.getContext("2d"), w, h);
    const map = new T.CanvasTexture(surface);
    map.encoding = T.sRGBEncoding;
    map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return map;
  };
  let seed = 714;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Broad studio panels give the metal readable highlights at every orientation.
  const studioMap = mapFrom(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#dce6ef");
    g.addColorStop(0.3, "#727b8b");
    g.addColorStop(0.46, "#f6f2e8");
    g.addColorStop(0.55, "#22252d");
    g.addColorStop(0.75, "#949baf");
    g.addColorStop(1, "#25272d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff7e9";
    ctx.fillRect(70, 25, 70, 150);
    ctx.fillStyle = "#eef6ff";
    ctx.fillRect(330, 10, 35, 210);
  });
  studioMap.mapping = T.EquirectangularReflectionMapping;
  const pmrem = new T.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(studioMap);
  scene.environment = environment.texture;
  studioMap.dispose();
  pmrem.dispose();
  scene.add(new T.HemisphereLight(0xe9f1ff, 0x42362f, 1.7));
  const light = (color, intensity, x, y, z) => {
    const l = new T.DirectionalLight(color, intensity);
    l.position.set(x, y, z);
    scene.add(l);
  };
  light(0xffffff, 2.5, -3, 5, 8);
  light(0x9bbde5, 1.6, 4, -3, 5);
  light(0xf5a56c, 1.4, -3, -4, -2);
  const metal = new T.MeshStandardMaterial({
    color: 0xc7ced3,
    metalness: 1,
    roughness: 0.24,
    envMapIntensity: 1.5,
  });
  const edge = new T.MeshStandardMaterial({
    color: 0xf0f1ef,
    metalness: 0.95,
    roughness: 0.15,
  });
  const gold = new T.MeshStandardMaterial({
    color: 0xa37d3d,
    metalness: 0.87,
    roughness: 0.34,
  });
  const dark = new T.MeshStandardMaterial({
    color: 0x141719,
    metalness: 0.5,
    roughness: 0.37,
  });
  const lacquerMap = mapFrom(2048, 512, (ctx, w, h) =>
    finish.lacquer(ctx, w, h),
  );
  const inlayMask = mapFrom(2048, 512, (ctx, w, h) =>
    finish.lacquer(ctx, w, h, true),
  );
  inlayMask.encoding = T.LinearEncoding;
  const lacquer = new T.MeshPhysicalMaterial({
    map: lacquerMap,
    metalnessMap: inlayMask,
    metalness: 0.95,
    bumpMap: inlayMask,
    bumpScale: 0.003,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.13,
  });
  const skinMap = mapFrom(512, 256, finish.rayskin);
  const skin = new T.MeshStandardMaterial({
    map: skinMap,
    bumpMap: skinMap,
    bumpScale: 0.002,
    roughness: 0.82,
  });
  const clothMap = mapFrom(256, 128, finish.cloth);
  const cloth = new T.MeshStandardMaterial({
    map: clothMap,
    bumpMap: clothMap,
    bumpScale: 0.003,
    roughness: 0.94,
  });
  const mesh = (geometry, material, parent, x = 0, y = 0, z = 0) => {
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const hamon = mapFrom(1024, 128, (ctx, w, h) => {
    ctx.fillStyle = "#adb5bd";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#eef1ed";
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const y = 31 + Math.sin(x * 0.037) * 3 + Math.sin(x * 0.013) * 4;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "#53606b";
    ctx.font = "24px serif";
    ctx.fillText("\u98a8  \u5149", 810, 85);
  });
  const bladeFace = new T.MeshStandardMaterial({
    map: hamon,
    metalness: 0.87,
    roughness: 0.27,
  });
  function fromData(data) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(data.positions, 3),
    );
    geometry.setAttribute("uv", new T.Float32BufferAttribute(data.uvs, 2));
    geometry.setIndex(data.indices);
    data.groups.forEach((group) =>
      geometry.addGroup(group.start, group.count, group.materialIndex),
    );
    geometry.computeVertexNormals();
    return geometry;
  }
  // One closed blade, including the kissaki: no overlapping face or bevel strips.
  mesh(fromData(G.bladeData()), [metal, bladeFace, edge], steel);
  mesh(fromData(G.sheathData()), [lacquer, dark], sheath);
  const mouthPoints = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    mouthPoints.push(
      new T.Vector3(
        ...G.point(G.mouth, Math.cos(a) * 0.281, Math.sin(a) * 0.142),
      ),
    );
  }
  mesh(
    new T.TubeGeometry(
      new T.CatmullRomCurve3(mouthPoints, true),
      48,
      0.015,
      6,
      true,
    ),
    dark,
    sheath,
  );
  const cylinder = (radius, depth, mat, parent, x, y = 0) => {
    const m = mesh(
      new T.CylinderGeometry(radius, radius, depth, 48),
      mat,
      parent,
      x,
      y,
    );
    m.rotation.z = Math.PI / 2;
    return m;
  };
  // Beveled bronze fittings catch studio highlights on real curved surfaces.
  const goldGrain = mapFrom(256, 128, (ctx, w, h) => {
    ctx.fillStyle = "#bfbfbf";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2800; i++) {
      ctx.fillStyle = random() > 0.5 ? "#c5c5c5" : "#b5b5b5";
      ctx.fillRect(random() * w, random() * h, 1 + random() * 12, 0.5);
    }
  });
  goldGrain.wrapS = goldGrain.wrapT = T.RepeatWrapping;
  gold.color.setHex(0xb89455);
  gold.metalness = 1;
  gold.roughness = 0.27;
  gold.envMapIntensity = 1.4;
  gold.bumpMap = goldGrain;
  gold.bumpScale = 0.0007;
  const roundedRect = (w, h, r) => {
    const shape = new T.Shape();
    const x = -w / 2,
      y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  };
  function extrudedFitting(shape, depth, bevel, steps = 1) {
    const g = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 32,
      steps,
    });
    g.translate(0, 0, -depth / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }
  const collar = roundedRect(0.19, 0.47, 0.022);
  const collarHole = roundedRect(0.106, 0.413, 0.009);
  collar.holes.push(new T.Path(collarHole.getPoints(16).reverse()));
  const collarGeometry = extrudedFitting(collar, 0.32, 0.009, 12);
  const collarPositions = collarGeometry.attributes.position;
  for (let i = 0; i < collarPositions.count; i++) {
    const x = collarPositions.getX(i);
    collarPositions.setZ(
      i,
      collarPositions.getZ(i) * (1 + 0.12 * Math.cos((x / 0.32) * Math.PI)),
    );
  }
  collarGeometry.computeVertexNormals();
  const habakiMap = mapFrom(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#b49a58";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#44351d";
    ctx.lineWidth = 5;
    for (let x = -h; x < w + h; x += 36)
      for (const direction of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h * direction, h);
        ctx.stroke();
      }
    ctx.strokeStyle = "#d3b672";
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  });
  const collarUV = collarGeometry.attributes.uv;
  for (let i = 0; i < collarPositions.count; i++)
    collarUV.setXY(
      i,
      collarPositions.getX(i) / 0.34 + 0.5,
      collarPositions.getY(i) / 0.49 + 0.5,
    );
  const habaki = gold.clone();
  habaki.color.setHex(0xffffff);
  habaki.map = habakiMap;
  habaki.bumpMap = habakiMap;
  habaki.bumpScale = 0.001;
  mesh(collarGeometry, habaki, steel, 0.08);
  const guardShape = new T.Shape();
  guardShape.absellipse(0, 0, 0.36, 0.468, 0, Math.PI * 2, false);
  const guardGeometry = extrudedFitting(guardShape, 0.085, 0.009);
  const guardPositions = guardGeometry.attributes.position,
    guardUV = guardGeometry.attributes.uv;
  for (let i = 0; i < guardPositions.count; i++)
    guardUV.setXY(
      i,
      0.5 - guardPositions.getZ(i) / 0.75,
      0.5 + guardPositions.getY(i) / 0.96,
    );
  const guardMetal = new T.MeshStandardMaterial({
    map: mapFrom(512, 512, finish.guard),
    bumpMap: mapFrom(512, 512, (ctx, w, h) => finish.guard(ctx, w, h, true)),
    bumpScale: 0.008,
    metalness: 0.88,
    roughness: 0.39,
  });
  mesh(guardGeometry, guardMetal, hilt, 0.34);
  const rimShape = new T.Shape();
  rimShape.absellipse(0, 0, 0.383, 0.491, 0, Math.PI * 2, false);
  const rimHole = new T.Path();
  rimHole.absellipse(0, 0, 0.353, 0.461, 0, Math.PI * 2, true);
  rimShape.holes.push(rimHole);
  // A complete annular metal band surrounds the plate; it is never buried in it.
  mesh(extrudedFitting(rimShape, 0.112, 0.004), gold, hilt, 0.34);
  const grip = cylinder(0.21, 2.5, skin, hilt, 1.68);
  grip.scale.z = 0.82;
  cylinder(0.23, 0.14, gold, hilt, 0.49).scale.z = 0.82;
  cylinder(0.23, 0.14, dark, hilt, 2.97).scale.z = 0.82;
  cylinder(0.232, 0.025, gold, hilt, 2.9).scale.z = 0.82;
  // Black cotton straps cross over ivory rayskin, leaving narrow diamond openings.
  function braid(handedness) {
    const positions = [],
      uvs = [],
      indices = [];
    const steps = 400,
      turns = 11;
    const profile = [
      [-0.07, -0.004],
      [-0.067, -0.008],
      [0.067, -0.008],
      [0.07, -0.004],
      [0.07, 0.004],
      [0.067, 0.008],
      [-0.067, 0.008],
      [-0.07, 0.004],
    ];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        a =
          t * turns * Math.PI * 2 * handedness + (handedness < 0 ? Math.PI : 0);
      const lift =
        0.017 + 0.011 * Math.sin(t * turns * Math.PI * 2) * handedness;
      const normal = new T.Vector3(0, Math.cos(a), Math.sin(a)).normalize();
      const tangent = new T.Vector3(
        2.36,
        -(0.212 + lift) * Math.sin(a) * turns * Math.PI * 2 * handedness,
        (0.177 + lift) * Math.cos(a) * turns * Math.PI * 2 * handedness,
      ).normalize();
      const across = new T.Vector3().crossVectors(tangent, normal).normalize();
      const center = new T.Vector3(
        0.53 + t * 2.36,
        Math.cos(a) * (0.212 + lift),
        Math.sin(a) * (0.177 + lift),
      );
      for (let j = 0; j < profile.length; j++) {
        const p = center
          .clone()
          .addScaledVector(across, profile[j][0])
          .addScaledVector(normal, profile[j][1]);
        positions.push(p.x, p.y, p.z);
        uvs.push(t * 3, j / 8);
        if (i < steps) {
          const n = i * 8 + j,
            k = i * 8 + ((j + 1) % 8);
          indices.push(n, k, n + 8, k, k + 8, n + 8);
        }
      }
    }
    for (let j = 1; j < 7; j++) {
      indices.push(0, j + 1, j);
      const n = steps * 8;
      indices.push(n, n + j, n + j + 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    const m = cloth.clone();
    m.side = T.DoubleSide;
    mesh(g, m, hilt);
  }
  braid(1);
  braid(-1);
  // Small sculpted menuki share a single batch on both faces of the hilt.
  const relief = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), gold, 30);
  const reliefPose = new T.Object3D();
  let reliefIndex = 0;
  for (const side of [-1, 1])
    for (const x of [1.1, 1.68, 2.26]) {
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal / 5) * Math.PI * 2;
        reliefPose.position.set(
          x + Math.cos(angle) * 0.035,
          Math.sin(angle) * 0.035,
          side * 0.187,
        );
        reliefPose.rotation.set(0, 0, angle);
        reliefPose.scale.set(0.032, 0.017, 0.009);
        reliefPose.updateMatrix();
        relief.setMatrixAt(reliefIndex++, reliefPose.matrix);
      }
    }
  hilt.add(relief);
  // Closed gold collars follow the scabbard's curved spine and leave its mouth open.
  function scabbardBand(center, width) {
    const positions = [],
      indices = [],
      uvs = [];
    const profile = [
      [-0.5, 0.289, 0.149],
      [-0.5, 0.302, 0.162],
      [0.5, 0.302, 0.162],
      [0.5, 0.289, 0.149],
    ];
    profile.forEach(([along, height, depth], row) => {
      for (let j = 0; j < 48; j++) {
        const a = (j / 48) * Math.PI * 2;
        positions.push(
          ...G.point(
            center + along * width,
            Math.cos(a) * height,
            Math.sin(a) * depth,
          ),
        );
        uvs.push(j / 48, row / 4);
      }
    });
    for (let row = 0; row < 4; row++)
      for (let j = 0; j < 48; j++) {
        const a = row * 48 + j,
          b = row * 48 + ((j + 1) % 48),
          c = ((row + 1) % 4) * 48 + j,
          d = ((row + 1) % 4) * 48 + ((j + 1) % 48);
        indices.push(a, c, b, b, c, d);
      }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const bandMaterial = gold.clone();
    bandMaterial.side = T.DoubleSide;
    mesh(geometry, bandMaterial, sheath);
  }
  scabbardBand(-0.34, 0.055);
  scabbardBand(-6.29, 0.035);
  for (const center of [-5.45, -2.2]) {
    scabbardBand(center, 0.025);
    scabbardBand(center + 0.075, 0.025);
  }
  // Wide matte cloth replaces the wire-like rope. All folds share one mesh.
  const ribbonMap = mapFrom(256, 128, finish.cord);
  ribbonMap.wrapS = ribbonMap.wrapT = T.RepeatWrapping;
  ribbonMap.repeat.set(8, 1);
  const ribbonMaterial = new T.MeshStandardMaterial({
    color: 0x7c1d38,
    map: ribbonMap,
    bumpMap: ribbonMap,
    bumpScale: 0.0015,
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.25,
  });
  const ribbonParts = [];
  function ribbon(points, width, steps, outward) {
    const curve = new T.CatmullRomCurve3(
      points.map((point) => new T.Vector3(...point)),
    );
    const positions = [],
      uvs = [],
      indices = [];
    const half = width / 2,
      thickness = 0.009;
    const profile = [
      [-half, -thickness],
      [half, -thickness],
      [half, thickness],
      [-half, thickness],
    ];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        center = curve.getPoint(t),
        tangent = curve.getTangent(t).normalize();
      const hint = outward ? outward(t) : new T.Vector3(0, 0, 1);
      const across = new T.Vector3().crossVectors(tangent, hint).normalize();
      const normal = new T.Vector3().crossVectors(across, tangent).normalize();
      for (let corner = 0; corner < 4; corner++) {
        const point = center
          .clone()
          .addScaledVector(across, profile[corner][0])
          .addScaledVector(normal, profile[corner][1]);
        positions.push(point.x, point.y, point.z);
        uvs.push(t, corner === 0 || corner === 3 ? 0 : 1);
        if (i < steps) {
          const n = i * 4 + corner,
            next = i * 4 + ((corner + 1) % 4);
          indices.push(n, next, n + 4, next, next + 4, n + 4);
        }
      }
    }
    indices.push(0, 2, 1, 0, 3, 2);
    const end = steps * 4;
    indices.push(end, end + 1, end + 2, end, end + 2, end + 3);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    ribbonParts.push(geometry);
  }
  const winding = [];
  for (let i = 0; i <= 180; i++) {
    const t = i / 180,
      a = t * Math.PI * 6;
    winding.push(
      G.point(-1.43 + t * 0.69, Math.cos(a) * 0.318, Math.sin(a) * 0.179),
    );
  }
  ribbon(
    winding,
    0.145,
    180,
    (t) =>
      new T.Vector3(0, Math.cos(t * Math.PI * 6), Math.sin(t * Math.PI * 6)),
  );
  // A compact square knot with two short cloth tails, held close to the cover.
  ribbon(
    [
      G.point(-1.3, 0.04, 0.231),
      G.point(-1.15, 0.105, 0.25),
      G.point(-0.98, -0.035, 0.252),
      G.point(-0.86, 0.025, 0.23),
    ],
    0.105,
    48,
  );
  ribbon(
    [
      G.point(-1.3, -0.02, 0.235),
      G.point(-1.14, -0.09, 0.27),
      G.point(-0.99, 0.075, 0.275),
      G.point(-0.88, 0.025, 0.24),
    ],
    0.105,
    48,
  );
  ribbon(
    [
      G.point(-1.15, -0.01, 0.245),
      G.point(-1.4, -0.11, 0.23),
      G.point(-1.73, -0.14, 0.18),
    ],
    0.09,
    36,
  );
  ribbon(
    [
      G.point(-1.11, -0.025, 0.25),
      G.point(-1.19, -0.18, 0.22),
      G.point(-1.36, -0.27, 0.16),
    ],
    0.085,
    36,
  );
  function mergeParts(parts) {
    const positions = [],
      normals = [],
      uvs = [],
      indices = [];
    for (const part of parts) {
      const offset = positions.length / 3;
      positions.push(...part.attributes.position.array);
      normals.push(...part.attributes.normal.array);
      uvs.push(...part.attributes.uv.array);
      for (const index of part.index.array) indices.push(offset + index);
      part.dispose();
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
  }
  mesh(mergeParts(ribbonParts), ribbonMaterial, sheath);
  // Clone only the finishes on disappearing parts: the blade keeps its metal finish.
  function dissolvingPart(group) {
    const amount = { value: 0 },
      copies = new Map();
    group.traverse((object) => {
      if (!object.isMesh) return;
      const copy = (source) => {
        if (copies.has(source)) return copies.get(source);
        const material = source.clone();
        material.onBeforeCompile = (shader) => {
          shader.uniforms.uEvaporate = amount;
          shader.fragmentShader =
            "uniform float uEvaporate;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <alphatest_fragment>",
            `
            #include <alphatest_fragment>
            float grain = fract(sin(dot(floor(gl_FragCoord.xy / 1.6), vec2(12.9898, 78.233))) * 43758.5453);
            if (uEvaporate >= 1.0 || grain < uEvaporate) discard;
          `,
          );
        };
        material.customProgramCacheKey = () => "kazeyami-evaporation-1";
        copies.set(source, material);
        return material;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(copy)
        : copy(object.material);
    });
    return amount;
  }
  const sheathDissolve = dissolvingPart(sheath);
  const flight = window.KazeyamiKatanaFlight();
  const sparkPositions = new Float32Array(24 * 3);
  const sparkGeometry = new T.BufferGeometry();
  sparkGeometry.setAttribute(
    "position",
    new T.BufferAttribute(sparkPositions, 3),
  );
  const sparkMaterial = new T.PointsMaterial({
    color: 0xf4d597,
    size: 1.8,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: T.AdditiveBlending,
  });
  const sparks = new T.Points(sparkGeometry, sparkMaterial);
  sparks.frustumCulled = false;
  scene.add(sparks);
  const drawButton = document.querySelector("#draw-blade");
  const interaction = createInteraction();
  const intro = window.KazeyamiKatanaIntro;
  let introStart = null,
    introCancelled = reduced.matches || !intro;
  const skipIntro = () => {
    introCancelled = true;
  };
  let draw = 0,
    progress = 0,
    pointerX = 0,
    pointerY = 0,
    inView = true,
    frame = 0,
    last = 0;
  function syncDrawButton() {
    const open = interaction.target() >= 0.5;
    drawButton.setAttribute("aria-pressed", String(open));
    drawButton.querySelector("span").textContent = open
      ? "Sheathe the blade"
      : "Draw the blade";
    drawButton.title = open ? "Sheathe the blade" : "Draw the blade";
  }
  drawButton.addEventListener("click", () => {
    skipIntro();
    returning = false;
    interaction.toggle();
    syncDrawButton();
    requestRender();
  });
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    skipIntro();
    returning = false;
    interaction.down({
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      type: e.pointerType,
      draw,
    });
  });
  stage.addEventListener("pointermove", (e) => {
    if (compact) return;
    const dragging = interaction.move({
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      width: stage.clientWidth,
    });
    if (dragging && !stage.hasPointerCapture(e.pointerId))
      stage.setPointerCapture(e.pointerId);
    const rect = stage.getBoundingClientRect();
    pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    syncDrawButton();
    requestRender();
  });
  stage.addEventListener("pointerup", (e) => {
    interaction.up({ id: e.pointerId, x: e.clientX, y: e.clientY });
    if (stage.hasPointerCapture(e.pointerId))
      stage.releasePointerCapture(e.pointerId);
    syncDrawButton();
    requestRender();
  });
  stage.addEventListener("pointercancel", () => interaction.cancel());
  stage.addEventListener("pointerleave", (e) => {
    if (!stage.hasPointerCapture(e.pointerId)) interaction.cancel();
    pointerX = 0;
    pointerY = 0;
    requestRender();
  });
  const copy = document.querySelector(".opening-copy"),
    name = document.querySelector(".opening-name"),
    compositionAnchor = document.querySelector(".katana-composition-anchor"),
    meta = document.querySelector(".opening-meta"),
    reveal = document.querySelector(".reveal-copy"),
    wordmark = document.querySelector("header .wordmark");
  const clamp = T.MathUtils.clamp;
  function returnToCover() {
    if (document.body.classList.contains("menu-open")) return;
    if (!launched && !flight.isRaised()) return;
    returning = true;
    interaction.setTarget(0);
    syncDrawButton();
    requestRender();
  }
  // An upward gesture at the page's top has no scroll event of its own.
  window.addEventListener(
    "wheel",
    (event) => {
      if (event.deltaY < -5 && scrollY <= 1) returnToCover();
    },
    { passive: true },
  );
  let touchY = null;
  window.addEventListener(
    "touchstart",
    (event) => {
      touchY = event.touches[0]?.clientY ?? null;
    },
    { passive: true },
  );
  window.addEventListener(
    "touchmove",
    (event) => {
      if (
        touchY !== null &&
        event.touches[0]?.clientY - touchY > 12 &&
        scrollY <= 1
      )
        returnToCover();
    },
    { passive: true },
  );
  function scroll() {
    // Drawing is deliberate: ordinary scrolling never starts a full-screen effect.
    progress = 0;
    if (progress > 0.015) skipIntro();
    const upward = scrollY < lastScrollY - 1;
    const downward = scrollY > lastScrollY + 1;
    if (
      upward &&
      launched &&
      opening.getBoundingClientRect().bottom > innerHeight * 0.8
    )
      returnToCover();
    if (downward && returning && !flight.isRaised() && draw < 0.01)
      returning = false;
    if (!launched && !returning) interaction.scroll(progress);
    lastScrollY = scrollY;
    syncDrawButton();
    const fade = clamp(1 - progress * 3, 0, 1),
      appear = clamp((progress - 0.34) * 3, 0, 1);
    for (const el of [copy, name, meta]) {
      el.style.opacity = fade;
      el.style.visibility = fade < 0.01 ? "hidden" : "visible";
    }

    reveal.style.opacity = appear;
    reveal.style.transform = `translateY(${(1 - appear) * 35}px)`;
    reveal.style.visibility = appear < 0.01 ? "hidden" : "visible";
    if (
      inView &&
      (flight.isRaised() || Math.abs(interaction.target() - draw) > 0.001)
    )
      requestRender();
  }
  let width = 0,
    height = 0;
  let restingX = 0,
    restingY = 0,
    assemblyY = 0,
    restingWidth = 0,
    logoX = 0,
    logoY = 0,
    logoWidth = 0;
  function measureAnchors() {
    const bounds = stage.getBoundingClientRect();
    const brand = compositionAnchor.getBoundingClientRect(),
      logo = wordmark.getBoundingClientRect();
    assemblyY = brand.top - bounds.top + brand.height * 0.45;
    restingX = brand.left - bounds.left + brand.width * 0.5;
    restingWidth = brand.width;
    // The hero composition owns the sword's resting pose independently of copy.
    restingY = brand.top - bounds.top + brand.height * 0.5;
    logoX = logo.left - bounds.left + logo.width * 0.5;
    logoY = logo.bottom - bounds.top + 8;
    logoWidth = logo.width * 0.82;
    wordmarkArt?.sync();
  }
  const wordmarkArt =
    compact ? null : window.KazeyamiKatanaWordmark?.(T, scene, camera, stage, name);
  const pixelTrail =
    compact ? null : window.KazeyamiPixelTrail?.(T, renderer, stage, requestRender);
  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    const cap = compact
      ? 1
      : navigator.deviceMemory && navigator.deviceMemory <= 4
        ? 1.25
        : 1.5;
    renderer.setPixelRatio(Math.min(devicePixelRatio, cap));
    renderer.setSize(width, height, false);
    pixelTrail?.resize();
    wordmarkArt?.resize();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    measureAnchors();
    requestRender();
  }
  function requestRender() {
    if (
      !frame &&
      (inView || launched) &&
      !document.hidden &&
      !document.body.classList.contains("menu-open")
    )
      frame = requestAnimationFrame(render);
  }
  function render(now) {
    frame = 0;
    if ((!inView && !launched) || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const target = interaction.target();
    if (introStart === null) introStart = now;
    const entrance =
      !introCancelled && !reduced.matches && !compact
        ? intro.pose((now - introStart) / 1000)
        : null;
    const assembling = entrance?.active ?? false;
    const landing = assembling ? entrance.landing : 1;
    if (assembling) draw = entrance.draw;
    else {
      // Reverse the flight first, then slide the blade into its restored scabbard.
      const drawTarget = flight.isRaised() && target < 0.5 ? 1 : target;
      draw +=
        (drawTarget - draw) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 6));
    }
    if (entrance && !assembling) {
      introCancelled = true;
      draw = target;
    }
    hilt.position.x = assembling ? entrance.hiltX : 0;
    steel.position.x = assembling ? entrance.steelX : 0;
    hilt.rotation.z = assembling ? entrance.hiltRoll : 0;
    steel.rotation.z = assembling ? entrance.steelRoll : 0;
    sheath.rotation.z = assembling ? entrance.sheathRoll : 0;
    stage.classList.toggle("is-assembling", assembling);
    const docking = flight.update(dt, {
      draw,
      target,
      dragging: interaction.isDragging(),
      assembling,
      reduced: reduced.matches,
    });
    const lift = docking.progress;
    if (target < 0.5) launched = false;
    else if (lift > 0) launched = true;
    dockCanvas(lift >= 0.999);
    const extraction = G.pose(draw);
    blade.rotation.z = extraction.angle;
    blade.position.set(extraction.x, extraction.y, 0);
    // A drawn curved blade is levelled by its chord as it becomes the header accent.
    const start = G.point(-6.2);
    const tipX =
      extraction.x +
      start[0] * Math.cos(extraction.angle) -
      start[1] * Math.sin(extraction.angle);
    const tipY =
      extraction.y +
      start[0] * Math.sin(extraction.angle) +
      start[1] * Math.cos(extraction.angle);
    const gripEndX = extraction.x + 2.97 * Math.cos(extraction.angle);
    const gripEndY = extraction.y + 2.97 * Math.sin(extraction.angle);
    const chord = Math.atan2(gripEndY - tipY, gripEndX - tipX);
    const roll =
      T.MathUtils.lerp(0.03, 0.06, landing) * (1 - lift) -
      chord * lift +
      (assembling ? entrance.kick : 0);
    model.rotation.set(
      (1 - lift) * (0.08 + (reduced.matches ? 0 : pointerY * 0.025)),
      (1 - lift) *
        (-0.24 * (1 - landing) + (reduced.matches ? 0 : pointerX * 0.04)),
      roll,
    );
    const viewHeight =
      2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    const worldPerPixel = viewHeight / height;
    const viewWidth = worldPerPixel * width;
    const assemblyScale = Math.min(0.4, (restingWidth * worldPerPixel) / 9.5);
    const restingScale = Math.min(
      1.4,
      (restingWidth * 0.96 * worldPerPixel) / 9.5,
    );
    const closedScale = T.MathUtils.lerp(assemblyScale, restingScale, landing);
    const drawnScale = Math.min(
      restingScale,
      (restingWidth * 1.3 * worldPerPixel) / 16,
    );
    const startScale = T.MathUtils.lerp(closedScale, drawnScale, draw);
    const endScale = (logoWidth * worldPerPixel) / 9.2;
    const scale = startScale * Math.pow(endScale / startScale, lift);
    model.scale.setScalar(scale);
    const bladeCenterX = (tipX + gripEndX) * 0.5;
    const bladeCenterY = (tipY + gripEndY) * 0.5;
    const centerX = T.MathUtils.lerp(
      T.MathUtils.lerp(-1.72, 1.45, draw),
      bladeCenterX,
      lift,
    );
    const centerY = T.MathUtils.lerp(0.48, bladeCenterY, lift);
    const rotatedX = centerX * Math.cos(roll) - centerY * Math.sin(roll);
    const rotatedY = centerX * Math.sin(roll) + centerY * Math.cos(roll);
    const restingAnchorX = restingX;
    const restingAnchorY = T.MathUtils.lerp(assemblyY, restingY, landing);
    const anchorX = T.MathUtils.lerp(restingAnchorX, logoX, lift);
    const anchorY = T.MathUtils.lerp(restingAnchorY, logoY, lift);
    model.position.set(
      (anchorX - width * 0.5) * worldPerPixel - rotatedX * scale,
      (height * 0.5 - anchorY) * worldPerPixel - rotatedY * scale,
      0,
    );
    sheathDissolve.value = assembling ? 0 : docking.sheath;
    hilt.visible = true;
    sheath.visible = sheathDissolve.value < 1;
    // A single tiny point batch carries gold flecks upward from the disappearing cover.
    sparks.visible = docking.sheath > 0 && docking.sheath < 1;
    if (sparks.visible) {
      model.updateMatrixWorld(true);
      const origin = sheath.localToWorld(new T.Vector3(...G.point(-2.7)));
      for (let i = 0; i < 24; i++) {
        const age = (docking.sheath + i / 24) % 1;
        sparkPositions[i * 3] =
          origin.x + Math.sin(i * 2.4) * age * scale * 1.7;
        sparkPositions[i * 3 + 1] = origin.y + age * scale * 3;
        sparkPositions[i * 3 + 2] = origin.z + 0.2;
      }
      sparkGeometry.attributes.position.needsUpdate = true;
      sparkMaterial.opacity = Math.sin(docking.sheath * Math.PI) * 0.8;
    }
    stage.dataset.katanaPose = assembling
      ? landing > 0
        ? "landing"
        : "assembling"
      : lift >= 0.999
        ? "docked"
        : lift > 0
          ? "lifting"
          : "resting";
    // The scabbard stays fixed. Circular extraction keeps every concealed blade
    // section on the cavity spine, so it exits the mouth rather than the side.
    wordmarkArt?.update(progress, inView);
    const pixelsMoving = pixelTrail
      ? pixelTrail.render(scene, camera, now)
      : (renderer.render(scene, camera), false);
    stage.classList.add("is-ready");
    wordmarkArt?.enable();
    // No idle animation loop: render only while moving toward an interaction target.
    if (
      assembling ||
      docking.moving ||
      Math.abs(target - draw) > 0.001 ||
      pixelsMoving
    )
      requestRender();
  }
  const observer = new IntersectionObserver(
    (entries) => {
      inView = entries[0].isIntersecting;
      if (inView || launched) {
        last = 0;
        requestRender();
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { rootMargin: "80px" },
  );
  observer.observe(opening);
  new ResizeObserver(resize).observe(stage);
  window.addEventListener("scroll", scroll, { passive: true });
  reduced.addEventListener("change", scroll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestRender();
  });
  new MutationObserver(() => {
    if (document.body.classList.contains("menu-open")) {
      pixelTrail?.clear();
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestRender();
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    dockCanvas(false);
    launched = false;
    returning = true;
    interaction.setTarget(0);
    stage.classList.remove("is-ready");
    stage.classList.add("is-unavailable");
    wordmarkArt?.disable();
    cancelAnimationFrame(frame);
    frame = 0;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    stage.classList.remove("is-unavailable");
    resize();
    scroll();
  });
  resize();
  // Compile the complete model before starting the entrance clock. The browser
  // never presents a partially compiled sword or the old loading illustration.
  renderer.compile(scene, camera);
  scroll();
})();

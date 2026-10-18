/* Original procedural katana: no remote model, textures or animation framework. */
(() => {
  "use strict";
  const stage = document.querySelector("#katana-stage");
  if (!stage) return;
  const fallback = () => {
    document.querySelector("#opening").classList.add("static-opening");
    document.querySelector(".blade-controls").hidden = true;
  };
  if (!window.THREE) {
    fallback();
    return;
  }
  const T = window.THREE;
  const G = window.KazeyamiKatanaGeometry;
  const createInteraction = window.KazeyamiKatanaInteraction;
  if (!G || !createInteraction) {
    fallback();
    return;
  }
  const opening = document.querySelector("#opening");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = stage.querySelector("canvas");
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
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
  function paintLacquer(ctx, w, h, mask = false) {
    ctx.fillStyle = mask ? "#252525" : "#141719";
    ctx.fillRect(0, 0, w, h);
    if (!mask) {
      for (let i = 0; i < 7000; i++) {
        const x = (i * 83.17) % w,
          y = (i * 47.31) % h;
        ctx.fillStyle = i % 2 ? "#1c2021" : "#101415";
        ctx.fillRect(x, y, 1, 0.5);
      }
    }
    // Original gold-leaf botanical scrollwork on the lacquer, with a matching
    // metal mask so the inlay catches the same light as the forged fittings.
    for (let strand = 0; strand < 3; strand++) {
      ctx.strokeStyle = mask
        ? "#fff"
        : ["#a78543", "#c5a35d", "#90723a"][strand];
      ctx.lineWidth = strand === 1 ? 1.8 : 1.1;
      ctx.beginPath();
      for (let x = 40; x <= w - 45; x += 3) {
        const y =
          h * 0.5 + Math.sin(x * 0.012 + strand * 0.9) * 53 + (strand - 1) * 20;
        x === 40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let x = 75 + strand * 19; x < w - 65; x += 43) {
        const y =
          h * 0.5 + Math.sin(x * 0.012 + strand * 0.9) * 53 + (strand - 1) * 20;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.cos(x * 0.012 + strand * 0.9) * 0.7);
        ctx.fillStyle = mask ? "#fff" : "#bea062";
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(3, side * 14, 15, side * 14);
          ctx.quadraticCurveTo(13, side * 3, 0, 0);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }
  const lacquerMap = mapFrom(2048, 512, (ctx, w, h) => paintLacquer(ctx, w, h));
  const inlayMask = mapFrom(2048, 512, (ctx, w, h) =>
    paintLacquer(ctx, w, h, true),
  );
  inlayMask.encoding = T.LinearEncoding;
  const lacquer = new T.MeshPhysicalMaterial({
    map: lacquerMap,
    metalnessMap: inlayMask,
    metalness: 0.95,
    bumpMap: inlayMask,
    bumpScale: 0.0009,
    roughness: 0.31,
    clearcoat: 0.8,
    clearcoatRoughness: 0.18,
  });
  const skinMap = mapFrom(256, 128, (ctx, w, h) => {
    ctx.fillStyle = "#1b1c19";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8)
      for (let x = 0; x < w; x += 8) {
        ctx.fillStyle = "#53544b";
        ctx.beginPath();
        ctx.arc(x + (y % 16 ? 4 : 0), y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
  });
  const skin = new T.MeshStandardMaterial({ map: skinMap, roughness: 0.9 });
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
  mesh(collarGeometry, gold, steel, 0.08);
  const guardShape = new T.Shape();
  guardShape.absellipse(0, 0, 0.36, 0.468, 0, Math.PI * 2, false);
  mesh(extrudedFitting(guardShape, 0.085, 0.009), dark, hilt, 0.34);
  const rimShape = new T.Shape();
  rimShape.absellipse(0, 0, 0.383, 0.491, 0, Math.PI * 2, false);
  const rimHole = new T.Path();
  rimHole.absellipse(0, 0, 0.353, 0.461, 0, Math.PI * 2, true);
  rimShape.holes.push(rimHole);
  // A complete annular metal band surrounds the plate; it is never buried in it.
  mesh(extrudedFitting(rimShape, 0.112, 0.004), gold, hilt, 0.34);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const engraving = mesh(
      new T.TorusGeometry(0.024, 0.006, 6, 12),
      gold,
      hilt,
      0.396,
      Math.cos(a) * 0.35,
      Math.sin(a) * 0.265,
    );
    engraving.rotation.y = Math.PI / 2;
  }
  const grip = cylinder(0.21, 2.5, skin, hilt, 1.68);
  grip.scale.z = 0.82;
  cylinder(0.23, 0.14, gold, hilt, 0.49).scale.z = 0.82;
  cylinder(0.23, 0.14, gold, hilt, 2.97).scale.z = 0.82;
  // Rounded gilded straps alternate above and below each crossing.
  function braid(handedness) {
    const positions = [],
      uvs = [],
      indices = [];
    const steps = 400,
      turns = 8;
    const profile = [
      [-0.046, -0.004],
      [-0.043, -0.008],
      [0.043, -0.008],
      [0.046, -0.004],
      [0.046, 0.004],
      [0.043, 0.008],
      [-0.043, 0.008],
      [-0.046, 0.004],
    ];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        a = t * turns * Math.PI * 2 * handedness;
      const lift =
        0.015 + 0.007 * Math.cos(t * turns * Math.PI * 2) * handedness;
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
    const m = gold.clone();
    m.roughness = 0.34;
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
  scabbardBand(-0.34, 0.18);
  scabbardBand(-6.29, 0.28);
  scabbardBand(-4.85, 0.075);
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
    interaction.toggle();
    syncDrawButton();
    requestRender();
  });
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    skipIntro();
    interaction.down({
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      type: e.pointerType,
      draw,
    });
  });
  stage.addEventListener("pointermove", (e) => {
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
    peek = document.querySelector(".work-peek"),
    meta = document.querySelector(".opening-meta"),
    reveal = document.querySelector(".reveal-copy"),
    prompt = document.querySelector(".scroll-prompt");
  const clamp = T.MathUtils.clamp;
  function scroll() {
    progress = reduced.matches
      ? 0
      : clamp(
          -opening.getBoundingClientRect().top /
            Math.max(1, opening.offsetHeight - innerHeight),
          0,
          1,
        );
    if (progress > 0.015) skipIntro();
    interaction.scroll(progress);
    syncDrawButton();
    const fade = clamp(1 - progress * 3, 0, 1),
      appear = clamp((progress - 0.34) * 3, 0, 1);
    for (const el of [copy, name, peek, meta]) {
      el.style.opacity = fade;
      el.style.visibility = fade < 0.01 ? "hidden" : "visible";
    }
    prompt.style.opacity = fade;
    prompt.style.visibility = fade < 0.01 ? "hidden" : "visible";
    reveal.style.opacity = appear;
    reveal.style.transform = `translateY(${(1 - appear) * 35}px)`;
    reveal.style.visibility = appear < 0.01 ? "hidden" : "visible";
    requestRender();
  }
  let width = 0,
    height = 0;
  const pixelTrail = window.KazeyamiPixelTrail?.(
    T,
    renderer,
    stage,
    requestRender,
  );
  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    const cap =
      navigator.deviceMemory && navigator.deviceMemory <= 4 ? 1.35 : 1.8;
    renderer.setPixelRatio(Math.min(devicePixelRatio, cap));
    renderer.setSize(width, height, false);
    pixelTrail?.resize();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }
  function requestRender() {
    if (
      !frame &&
      inView &&
      !document.hidden &&
      !document.body.classList.contains("menu-open")
    )
      frame = requestAnimationFrame(render);
  }
  function render(now) {
    frame = 0;
    if (!inView || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const poseProgress = progress;
    const target = interaction.target();
    if (introStart === null) introStart = now;
    const entrance =
      !introCancelled && !reduced.matches
        ? intro.pose((now - introStart) / 1000)
        : null;
    const assembling = entrance?.active ?? false;
    if (assembling) draw = entrance.draw;
    else
      draw += (target - draw) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 6));
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
    const mobile = width < 600;
    model.rotation.set(
      0.12 + (reduced.matches ? 0 : pointerY * 0.06),
      -0.42 + (reduced.matches ? 0 : pointerX * 0.11),
      0.48 - poseProgress * 0.5 - draw * 0.2 + (assembling ? entrance.kick : 0),
    );
    const viewWidth =
      2 *
      camera.position.z *
      Math.tan(T.MathUtils.degToRad(camera.fov / 2)) *
      camera.aspect;
    const initialScale = mobile ? 0.86 : 1.6;
    const extractedScale = Math.min(
      0.96,
      (viewWidth / (mobile ? 10 : 16)) * 0.88,
    );
    const scale = T.MathUtils.lerp(initialScale, extractedScale, draw);
    model.scale.setScalar(scale * (1 - poseProgress * 0.29));
    model.position.set(
      mobile ? 1.0 - draw * 2.4 : 2.7 - draw * 3.4,
      0.12 + poseProgress * 1.9,
      0,
    );
    const extraction = G.pose(draw);
    blade.rotation.z = extraction.angle;
    blade.position.set(extraction.x, extraction.y, 0);
    // The scabbard stays fixed. Circular extraction keeps every concealed blade
    // section on the cavity spine, so it exits the mouth rather than the side.
    const pixelsMoving = pixelTrail
      ? pixelTrail.render(scene, camera, now)
      : (renderer.render(scene, camera), false);
    stage.classList.add("is-ready");
    // No idle animation loop: render only while moving toward an interaction target.
    if (assembling || Math.abs(target - draw) > 0.001 || pixelsMoving)
      requestRender();
  }
  const observer = new IntersectionObserver(
    (entries) => {
      inView = entries[0].isIntersecting;
      if (inView) {
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
    stage.classList.remove("is-ready");
    cancelAnimationFrame(frame);
    frame = 0;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    resize();
    scroll();
  });
  resize();
  scroll();
})();

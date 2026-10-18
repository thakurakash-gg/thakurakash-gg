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
  if (!G) { fallback(); return; }
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
  const lacquerMap = mapFrom(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = "#141415";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 10000; i++) {
      const v = 14 + Math.floor(random() * 18);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(random() * w, random() * h, 1, 1);
    }
    // Hand-drawn vermilion wind ribbons, rather than the reference's artwork.
    for (let i = 0; i < 9; i++) {
      const x = 280 + i * 61;
      ctx.strokeStyle = i % 2 ? "#b33123" : "#e9472d";
      ctx.lineWidth = 3 + random() * 13;
      ctx.beginPath();
      ctx.moveTo(x - 100, h + 20);
      ctx.bezierCurveTo(x + 110, 150, x - 90, 95, x + 100, -20);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#ae9158";
    for (let i = 0; i < 240; i++) {
      const x = random() * w,
        y = random() * h;
      ctx.fillRect(x, y, 1 + random() * 3, 1);
    }
  });
  const lacquer = new T.MeshPhysicalMaterial({
    map: lacquerMap,
    metalness: 0.3,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
  });
  const clothMap = mapFrom(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#dfdbd1";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 3) {
      ctx.strokeStyle = i % 2 ? "#bcb9b2" : "#f7f4ec";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
      ctx.strokeStyle = "#cac6bd66";
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
  });
  clothMap.wrapS = clothMap.wrapT = T.RepeatWrapping;
  const cloth = new T.MeshStandardMaterial({
    map: clothMap,
    roughness: 0.88,
    color: 0xf4efe5,
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
    ctx.fillStyle = '#adb5bd'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#eef1ed'; ctx.lineWidth = 10; ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const y = 31 + Math.sin(x * 0.037) * 3 + Math.sin(x * 0.013) * 4;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.fillStyle = '#53606b'; ctx.font = '24px serif';
    ctx.fillText('\u98a8  \u5149', 810, 85);
  });
  const bladeFace = new T.MeshStandardMaterial({ map: hamon, metalness: 0.87, roughness: 0.27 });
  function fromData(data) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(data.uvs, 2));
    geometry.setIndex(data.indices);
    data.groups.forEach(group => geometry.addGroup(group.start, group.count, group.materialIndex));
    geometry.computeVertexNormals();
    return geometry;
  }
  // One closed blade, including the kissaki: no overlapping face or bevel strips.
  mesh(fromData(G.bladeData()), [metal, bladeFace, edge], blade);
  mesh(fromData(G.sheathData()), [lacquer, dark], sheath);
  const mouthPoints = [];
  for (let i = 0; i <= 48; i++) {
    const a = i / 48 * Math.PI * 2;
    mouthPoints.push(new T.Vector3(...G.point(G.mouth, Math.cos(a) * 0.281, Math.sin(a) * 0.142)));
  }
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(mouthPoints, true), 48, 0.015, 6, true), dark, sheath);
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
  // Gold habaki and a pierced, scalloped tsuba with an original radial ornament.
  mesh(new T.BoxGeometry(0.35, 0.43, 0.19), gold, blade, 0.08);
  const guard = cylinder(0.49, 0.115, dark, blade, 0.34);
  guard.scale.z = 0.8;
  const guardRim = mesh(
    new T.TorusGeometry(0.465, 0.024, 6, 64),
    gold,
    blade,
    0.34,
  );
  guardRim.rotation.y = Math.PI / 2;
  guardRim.scale.y = 1.05;
  guardRim.scale.x = 0.8;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const ornament = mesh(
      new T.TorusGeometry(0.035, 0.012, 4, 8),
      gold,
      blade,
      0.405,
      Math.cos(a) * 0.37,
      Math.sin(a) * 0.29,
    );
    ornament.rotation.y = Math.PI / 2;
  }
  const grip = cylinder(0.21, 2.5, skin, blade, 1.68);
  grip.scale.z = 0.82;
  cylinder(0.23, 0.14, dark, blade, 0.49).scale.z = 0.82;
  cylinder(0.23, 0.14, gold, blade, 2.97).scale.z = 0.82;
  // Two opposing ribbon helices create real interlaced diamond openings.
  function braid(handedness) {
    const points = [],
      normals = [],
      triangles = [],
      turns = 10,
      steps = turns * 32;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        a = t * turns * Math.PI * 2 * handedness;
      const x = 0.53 + t * 2.36;
      for (const offset of [-0.065, 0.065]) {
        points.push(x + offset, Math.cos(a) * 0.22, Math.sin(a) * 0.185);
        normals.push(t * 8, offset < 0 ? 0 : 1);
      }
      if (i < steps) {
        const n = i * 2;
        triangles.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(points, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(normals, 2));
    g.setIndex(triangles);
    g.computeVertexNormals();
    const m = cloth.clone();
    m.side = T.DoubleSide;
    mesh(g, m, blade);
  }
  braid(1);
  braid(-1);
  for (let i = 0; i < 3; i++)
    mesh(
      new T.SphereGeometry(0.04, 8, 6),
      gold,
      blade,
      1.1 + i * 0.55,
      0,
      0.18,
    );
  const drawButton = document.querySelector("#draw-blade");
  let userDraw = null,
    draw = 0,
    progress = 0,
    pointerX = 0,
    pointerY = 0,
    inView = true,
    frame = 0,
    last = 0;
  let down = null,
    dragAmount = 0;
  drawButton.addEventListener("click", () => {
    userDraw = draw > 0.5 ? 0 : 1;
    drawButton.setAttribute("aria-pressed", String(!!userDraw));
    drawButton.querySelector("span").textContent = userDraw
      ? "Sheathe the blade"
      : "Draw the blade";
    requestRender();
  });
  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") {
      down = e.clientX;
      dragAmount = draw;
      stage.setPointerCapture(e.pointerId);
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (down !== null) {
      userDraw = T.MathUtils.clamp(
        dragAmount + ((e.clientX - down) / stage.clientWidth) * 2,
        0,
        1,
      );
      drawButton.setAttribute("aria-pressed", String(userDraw > 0.5));
    }
    pointerX = (e.clientX / stage.clientWidth - 0.5) * 2;
    pointerY = (e.clientY / stage.clientHeight - 0.5) * 2;
    requestRender();
  });
  stage.addEventListener("pointerup", () => {
    down = null;
    drawButton.querySelector("span").textContent =
      userDraw > 0.5 ? "Sheathe the blade" : "Draw the blade";
  });
  stage.addEventListener("pointercancel", () => {
    down = null;
  });
  stage.addEventListener("pointerleave", () => {
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
  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    const cap =
      navigator.deviceMemory && navigator.deviceMemory <= 4 ? 1.35 : 1.8;
    renderer.setPixelRatio(Math.min(devicePixelRatio, cap));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }
  function requestRender() {
    if (!frame && inView && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function render(now) {
    frame = 0;
    if (!inView || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const poseProgress = progress;
    const target = userDraw ?? clamp(poseProgress * 2.2, 0, 1);
    draw += (target - draw) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 6));
    const mobile = width < 600;
    model.rotation.set(
      0.12 + (reduced.matches ? 0 : pointerY * 0.06),
      -0.42 + (reduced.matches ? 0 : pointerX * 0.11),
      0.48 - poseProgress * 0.5 - draw * 0.2,
    );
    const scale = mobile ? 0.86 - draw * 0.32 : 1.6 - draw * 0.64;
    model.scale.setScalar(scale * (1 - poseProgress * 0.29));
    model.position.set(mobile ? 1.0 - draw * 1.3 : 2.7 - draw * 3.4, 0.12 + poseProgress * 1.9, 0);
    const extraction = G.pose(draw);
    blade.rotation.z = extraction.angle;
    blade.position.set(extraction.x, extraction.y, 0);
    // The scabbard stays fixed. Circular extraction keeps every concealed blade
    // section on the cavity spine, so it exits the mouth rather than the side.
    drawButton.setAttribute('aria-pressed', String(draw > 0.5));
    drawButton.querySelector('span').textContent = draw > 0.5 ? 'Sheathe the blade' : 'Draw the blade';
    renderer.render(scene, camera);
    stage.classList.add("is-ready");
    // No idle animation loop: render only while moving toward an interaction target.
    if (Math.abs(target - draw) > 0.001) requestRender();
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

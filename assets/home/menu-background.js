/* Original temple vignette. Created on first menu open; asleep when closed. */
(() => {
  const menu = document.querySelector("#menu");
  if (!menu) return;
  const stage = document.createElement("div");
  stage.className = "menu-world";
  stage.setAttribute("aria-hidden", "true");
  menu.prepend(stage);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let renderer, scene, camera, rain, rainPositions, leaves, leavesData;
  let frame = 0,
    last = 0,
    elapsed = 0,
    loading = false,
    pointerX = 0,
    pointerY = 0;
  const open = () =>
    document.body.classList.contains("menu-open") && !document.hidden;
  function make(T) {
    const canvas = document.createElement("canvas");
    stage.append(canvas);
    try {
      renderer = new T.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      canvas.remove();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    scene = new T.Scene();
    scene.background = new T.Color(0x101e28);
    scene.fog = new T.FogExp2(0x152731, 0.035);
    camera = new T.PerspectiveCamera(43, 1, 0.1, 100);
    scene.add(new T.HemisphereLight(0x9db5cd, 0x27362d, 1.8));
    const moonlight = new T.DirectionalLight(0xb5c8e2, 2.2);
    moonlight.position.set(-6, 12, 6);
    scene.add(moonlight);
    const mat = (color, roughness = 0.8) =>
      new T.MeshStandardMaterial({ color, roughness });
    const timber = mat(0x28332e),
      roof = mat(0x152d35),
      stone = mat(0x3d4744),
      red = mat(0x863d32),
      gold = mat(0xa18858);
    const warm = new T.MeshBasicMaterial({ color: 0xe9b36d, fog: false });
    warm.color.multiplyScalar(1.7);
    const boxGeometry = new T.BoxGeometry(1, 1, 1);
    function box(material, x, y, z, w, h, d) {
      const mesh = new T.Mesh(boxGeometry, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      scene.add(mesh);
      return mesh;
    }
    function post(x, y, z, radius, height, material) {
      const mesh = new T.Mesh(
        new T.CylinderGeometry(radius, radius * 1.06, height, 10),
        material,
      );
      mesh.position.set(x, y, z);
      scene.add(mesh);
    }
    box(mat(0x263c35), 0, -0.3, -9, 48, 0.6, 45);
    for (let i = 0; i < 15; i++)
      box(stone, 0, i * 0.12, 3 - i * 0.5, 6.6, 0.16, 0.52);
    box(stone, 0, 1.65, -6, 11, 0.5, 6);
    function templeRoof(w, d, y, z) {
      const vertices = [],
        indices = [];
      for (const side of [-1, 1]) {
        const start = vertices.length / 3;
        for (let row = 0; row <= 8; row++) {
          const v = row / 8;
          for (let col = 0; col <= 24; col++) {
            const u = col / 12 - 1;
            vertices.push(
              u * w * (0.82 + 0.18 * v),
              y +
                0.9 * Math.pow(1 - v, 1.2) +
                0.28 * Math.pow(v, 6) * Math.pow(Math.abs(u), 5),
              z + side * d * v,
            );
            if (row < 8 && col < 24) {
              const n = start + row * 25 + col;
              indices.push(n, n + 1, n + 25, n + 1, n + 26, n + 25);
            }
          }
        }
        const points = Array.from({ length: 25 }, (_, i) => {
          const u = i / 12 - 1;
          return new T.Vector3(
            u * w,
            y + 0.28 * Math.pow(Math.abs(u), 5),
            z + side * d,
          );
        });
        scene.add(
          new T.Mesh(
            new T.TubeGeometry(
              new T.CatmullRomCurve3(points),
              32,
              0.045,
              5,
              false,
            ),
            gold,
          ),
        );
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const material = roof.clone();
      material.side = T.DoubleSide;
      scene.add(new T.Mesh(geo, material));
      box(gold, 0, y + 0.93, z, w * 1.66, 0.1, 0.13);
    }
    box(timber, 0, 3.15, -6, 9, 2.7, 4.1);
    box(timber, 0, 6.05, -6.3, 6, 1.9, 3);
    templeRoof(5.6, 3, 4.4, -6.1);
    templeRoof(4.1, 2.2, 7.05, -6.3);
    for (const [count, y, z, span] of [
      [11, 3.2, -3.92, 8],
      [7, 6.0, -4.77, 5.3],
    ]) {
      for (let i = 0; i < count; i++) {
        const x = (i / (count - 1) - 0.5) * span;
        box(warm, x, y, z, 0.45, 0.92, 0.03);
        box(timber, x, y, z + 0.025, 0.035, 1, 0.04);
      }
    }
    for (const x of [-4.2, -2.1, 0, 2.1, 4.2])
      post(x, 3, -3.7, 0.075, 2.7, red);
    // A torii frames the approach without adding navigation or controls.
    for (const x of [-3, 3]) {
      post(x, 2.35, 2.4, 0.13, 4.8, red);
      box(stone, x, 0.1, 2.4, 0.5, 0.2, 0.5);
    }
    const beam = new T.Shape();
    beam.moveTo(-3.9, 4.55);
    beam.quadraticCurveTo(0, 4.15, 3.9, 4.55);
    beam.lineTo(3.9, 4.83);
    beam.quadraticCurveTo(0, 4.43, -3.9, 4.83);
    beam.closePath();
    const gate = new T.Mesh(
      new T.ExtrudeGeometry(beam, {
        depth: 0.26,
        bevelEnabled: true,
        bevelSize: 0.03,
        bevelThickness: 0.02,
        bevelSegments: 1,
        steps: 1,
      }),
      red,
    );
    gate.position.z = 2.3;
    scene.add(gate);
    box(red, 0, 3.7, 2.4, 7, 0.17, 0.22);
    box(gold, 0, 4, 2.57, 0.28, 0.58, 0.05);
    // Lantern light is emissive geometry and a small shared halo, not shadow lights.
    const haloCanvas = document.createElement("canvas");
    haloCanvas.width = haloCanvas.height = 64;
    const context = haloCanvas.getContext("2d"),
      gradient = context.createRadialGradient(32, 32, 1, 32, 32, 32);
    gradient.addColorStop(0, "#ffc47788");
    gradient.addColorStop(0.3, "#f4a95130");
    gradient.addColorStop(1, "#e9994000");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const halo = new T.SpriteMaterial({
      map: new T.CanvasTexture(haloCanvas),
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
    });
    for (const [x, z] of [
      [-4, 4],
      [4, 4],
      [-3.6, -1],
      [3.6, -1],
    ]) {
      post(x, 0.6, z, 0.08, 1.3, timber);
      box(warm, x, 1.4, z, 0.4, 0.5, 0.4);
      box(roof, x, 1.72, z, 0.62, 0.15, 0.62);
      for (const dx of [-0.23, 0.23])
        for (const dz of [-0.23, 0.23])
          box(timber, x + dx, 1.4, z + dz, 0.04, 0.6, 0.04);
      const glow = new T.Sprite(halo);
      glow.position.set(x, 1.45, z);
      glow.scale.set(2.5, 2.5, 1);
      scene.add(glow);
    }
    // Repeated forest silhouettes and wind-blown leaves share geometry/materials.
    const forest = new T.InstancedMesh(
      new T.ConeGeometry(1, 1, 7),
      mat(0x233b35),
      90,
    );
    const dummy = new T.Object3D();
    for (let i = 0; i < 30; i++) {
      const side = i % 2 ? 1 : -1,
        x = side * (6 + ((i * 2.37) % 10)),
        z = -3 - ((i * 3.71) % 25);
      for (let j = 0; j < 3; j++) {
        dummy.position.set(x, 1.5 + j * 1.6, z);
        dummy.scale.set(2.2 - j * 0.4, 3, 2.2 - j * 0.4);
        dummy.updateMatrix();
        forest.setMatrixAt(i * 3 + j, dummy.matrix);
      }
    }
    scene.add(forest);
    const moonCanvas = document.createElement("canvas");
    moonCanvas.width = moonCanvas.height = 128;
    const mctx = moonCanvas.getContext("2d");
    mctx.fillStyle = "#be8277";
    mctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 450; i++) {
      mctx.fillStyle = `rgba(73,43,46,${0.02 + (i % 7) * 0.008})`;
      mctx.beginPath();
      mctx.arc((i * 37) % 128, (i * 71) % 128, 2 + (i % 12), 0, 7);
      mctx.fill();
    }
    const moon = new T.Mesh(
      new T.SphereGeometry(1.9, 32, 20),
      new T.MeshBasicMaterial({
        map: new T.CanvasTexture(moonCanvas),
        fog: false,
      }),
    );
    moon.position.set(5, 10, -19);
    scene.add(moon);
    rainPositions = new Float32Array(360 * 6);
    for (let i = 0; i < 360; i++) {
      const x = ((i * 7.71) % 28) - 14,
        y = (i * 1.13) % 18,
        z = ((i * 5.17) % 25) - 8;
      rainPositions.set([x, y, z, x - 0.045, y + 0.3, z], i * 6);
    }
    const rainGeo = new T.BufferGeometry();
    rainGeo.setAttribute("position", new T.BufferAttribute(rainPositions, 3));
    rain = new T.LineSegments(
      rainGeo,
      new T.LineBasicMaterial({
        color: 0x9ab8ca,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      }),
    );
    scene.add(rain);
    leaves = new T.InstancedMesh(
      new T.PlaneGeometry(0.13, 0.24),
      new T.MeshBasicMaterial({ color: 0xb65e46, side: T.DoubleSide }),
      36,
    );
    leavesData = Array.from({ length: 36 }, (_, i) => ({
      x: ((i * 2.17) % 18) - 9,
      y: (i * 0.77) % 12,
      z: ((i * 3.19) % 17) - 5,
    }));
    scene.add(leaves);
    leaves.userData.dummy = dummy;
    resize();
  }
  function resize() {
    if (!renderer) return;
    const w = stage.clientWidth,
      h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (open()) render(performance.now(), true);
  }
  function render(now, once = false) {
    frame = 0;
    if (!open() || !renderer) return;
    if (!once && now - last < 33) {
      frame = requestAnimationFrame(render);
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (!motion.matches) elapsed += dt;
    camera.position.set(2 + pointerX * 0.4, 6.5 + pointerY * 0.2, 22);
    camera.lookAt(0, 4, -4);
    if (!motion.matches) {
      for (let i = 0; i < 360; i++) {
        const n = i * 6;
        rainPositions[n + 1] -= dt * 8;
        rainPositions[n + 4] -= dt * 8;
        if (rainPositions[n + 1] < 0) {
          rainPositions[n + 1] += 18;
          rainPositions[n + 4] += 18;
        }
      }
      rain.geometry.attributes.position.needsUpdate = true;
    }
    const dummy = leaves.userData.dummy;
    leavesData.forEach((leaf, i) => {
      dummy.position.set(
        leaf.x + Math.sin(elapsed * 0.4 + i) * 0.8,
        (((leaf.y - elapsed * 0.4) % 12) + 12) % 12,
        leaf.z,
      );
      dummy.rotation.set(elapsed * 0.3 + i, i, elapsed * 0.5 + i);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
    });
    leaves.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    stage.classList.add("is-ready");
    if (!once && !motion.matches) frame = requestAnimationFrame(render);
  }
  async function start() {
    if (!open()) return;
    if (!renderer && !loading) {
      loading = true;
      try {
        if (!window.THREE)
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "assets/three.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.append(script);
          });
        make(window.THREE);
      } catch {
      } finally {
        loading = false;
      }
    }
    cancelAnimationFrame(frame);
    frame = 0;
    last = performance.now();
    if (renderer && open()) render(last, motion.matches);
  }
  function sync() {
    if (open()) start();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  new MutationObserver(sync).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  new ResizeObserver(resize).observe(stage);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  menu.addEventListener(
    "pointermove",
    (event) => {
      const rect = menu.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    },
    { passive: true },
  );
})();

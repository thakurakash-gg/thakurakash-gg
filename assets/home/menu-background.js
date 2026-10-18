/* Three folded-metal ribbons, built locally and animated only while the menu is open. */
(() => {
  const menu = document.querySelector("#menu");
  if (!menu) return;
  const stage = document.createElement("div");
  stage.className = "menu-world";
  stage.setAttribute("aria-hidden", "true");
  menu.prepend(stage);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let renderer, scene, camera, sculpture;
  let frame = 0,
    last = 0,
    elapsed = 0,
    loading = false;
  let pointerX = 0,
    pointerY = 0,
    turnX = 0,
    turnY = 0;
  const isOpen = () =>
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
    renderer.toneMappingExposure = 1.05;
    scene = new T.Scene();
    scene.background = new T.Color(0x101214);
    camera = new T.OrthographicCamera(-2, 2, 4, -4, 0.1, 40);
    camera.position.set(0, 0, 14);
    const studio = document.createElement("canvas");
    studio.width = 512;
    studio.height = 256;
    const ctx = studio.getContext("2d"),
      gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "#8a949b");
    gradient.addColorStop(0.22, "#111519");
    gradient.addColorStop(0.43, "#c3b9a3");
    gradient.addColorStop(0.51, "#262a30");
    gradient.addColorStop(0.8, "#858b91");
    gradient.addColorStop(1, "#13171b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    const panel = ctx.createLinearGradient(80, 0, 165, 0);
    panel.addColorStop(0, "#272d33");
    panel.addColorStop(0.3, "#f4f1e8");
    panel.addColorStop(0.6, "#fffdf7");
    panel.addColorStop(1, "#343a40");
    ctx.fillStyle = panel;
    ctx.fillRect(80, 8, 85, 232);
    ctx.fillStyle = "#bca481";
    ctx.fillRect(345, 18, 35, 190);
    const studioMap = new T.CanvasTexture(studio);
    studioMap.colorSpace = T.SRGBColorSpace;
    studioMap.mapping = T.EquirectangularReflectionMapping;
    const pmrem = new T.PMREMGenerator(renderer),
      environment = pmrem.fromEquirectangular(studioMap);
    scene.environment = environment.texture;
    studioMap.dispose();
    pmrem.dispose();
    scene.add(new T.HemisphereLight(0xe5e9ed, 0x1b1b22, 1.4));
    const key = new T.DirectionalLight(0xfff2d9, 3);
    key.position.set(-3, 4, 7);
    scene.add(key);
    const rim = new T.DirectionalLight(0xadc8e5, 2);
    rim.position.set(4, -2, 3);
    scene.add(rim);
    sculpture = new T.Group();
    scene.add(sculpture);
    const finishes = [0xd2c3a5, 0xa2aab4, 0x7b463c];
    for (let ribbon = 0; ribbon < 3; ribbon++) {
      const positions = [],
        uvs = [],
        indices = [];
      const rows = 144,
        columns = 8,
        phase = ribbon * 2.094;
      for (let row = 0; row <= rows; row++) {
        const t = row / rows,
          angle = t * 5.8 + phase;
        const centerX = Math.sin(angle) * 0.72,
          centerZ = Math.cos(angle) * 0.72;
        const twist = angle + 0.55 * Math.sin(t * 5 + phase);
        const width = 0.56 + 0.12 * Math.sin(t * 7 + phase);
        for (let col = 0; col <= columns; col++) {
          const u = (col / columns) * 2 - 1;
          positions.push(
            centerX + Math.cos(twist) * u * width,
            (t - 0.5) * 8.6 + 0.22 * u * u * Math.sin(angle),
            centerZ + Math.sin(twist) * u * width,
          );
          uvs.push(col / columns, t);
          if (row < rows && col < columns) {
            const n = row * (columns + 1) + col;
            indices.push(
              n,
              n + 1,
              n + columns + 1,
              n + 1,
              n + columns + 2,
              n + columns + 1,
            );
          }
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const material = new T.MeshPhysicalMaterial({
        color: finishes[ribbon],
        metalness: 1,
        roughness: 0.28,
        clearcoat: 0.35,
        clearcoatRoughness: 0.3,
        envMapIntensity: 1.3,
        side: T.DoubleSide,
      });
      const mesh = new T.Mesh(geometry, material);
      sculpture.add(mesh);
    }
    sculpture.position.y = -1.45;
    resize();
  }
  function resize() {
    if (!renderer) return;
    const width = stage.clientWidth,
      height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const halfWidth = (4 * width) / height;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.updateProjectionMatrix();
    sculpture.position.x = halfWidth * 0.53;
    if (isOpen()) render(performance.now(), true);
  }
  function render(now, once = false) {
    frame = 0;
    if (!isOpen() || !renderer) return;
    if (!once && now - last < 1000 / 24) {
      frame = requestAnimationFrame(render);
      return;
    }
    const dt = Math.min(0.06, (now - last) / 1000 || 0.016);
    last = now;
    if (!motion.matches) elapsed += dt;
    turnX += (pointerX - turnX) * 0.08;
    turnY += (pointerY - turnY) * 0.08;
    sculpture.rotation.set(
      motion.matches ? 0 : turnY * 0.11,
      -0.55 +
        (motion.matches ? 0 : Math.sin(elapsed * 0.18) * 0.14 + turnX * 0.16),
      -0.19 + (motion.matches ? 0 : Math.sin(elapsed * 0.13) * 0.035),
    );
    renderer.render(scene, camera);
    stage.classList.add("is-ready");
    if (!once && !motion.matches) frame = requestAnimationFrame(render);
  }
  async function start() {
    if (!isOpen()) return;
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
    if (renderer && isOpen()) render(last, motion.matches);
  }
  function sync() {
    if (isOpen()) start();
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
      const bounds = menu.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
      pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
    },
    { passive: true },
  );
})();

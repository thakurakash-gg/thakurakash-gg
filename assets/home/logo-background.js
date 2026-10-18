/* Shared, instanced Kazeyami marks for collaboration and the navigation drawer. */
window.KazeyamiLogoBackground = function createLogoBackground(stage) {
  if (!stage || !window.THREE) return null;
  const T = window.THREE;
  const canvas =
    stage.querySelector("canvas") ||
    stage.appendChild(document.createElement("canvas"));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return;
  }
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.setClearColor(0x0c0c10, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 19;
  scene.add(new T.HemisphereLight(0xffffff, 0x171724, 2.2));
  const key = new T.DirectionalLight(0xffffff, 3.5);
  key.position.set(-5, 7, 9);
  scene.add(key);
  const rim = new T.DirectionalLight(0xffffff, 1.8);
  rim.position.set(7, -2, 3);
  scene.add(rim);
  const paths = [
    [
      [-0.2681, 0.9872],
      [-0.3021, 0.9638],
      [-0.8021, 0.4596],
      [-0.8234, 0.4234],
      [-0.834, 0.383],
      [-0.8319, 0.0851],
      [-0.8149, 0.0404],
      [-0.7957, 0.0149],
      [-0.7447, -0.0191],
      [-0.7043, -0.0298],
      [-0.6766, -0.0298],
      [-0.634, -0.0191],
      [-0.6021, 0.0],
      [-0.066, 0.5362],
      [-0.0617, 0.566],
      [-0.0787, 0.5894],
      [-0.1085, 0.5936],
      [-0.1255, 0.5851],
      [-0.6511, 0.0596],
      [-0.6702, 0.0489],
      [-0.7, 0.0468],
      [-0.7234, 0.0553],
      [-0.7468, 0.0766],
      [-0.7574, 0.1021],
      [-0.7574, 0.3787],
      [-0.7489, 0.4021],
      [-0.2404, 0.9149],
      [-0.2106, 0.9255],
      [0.466, 0.9255],
      [0.4894, 0.9191],
      [0.5128, 0.9],
      [0.5255, 0.8745],
      [0.5277, 0.8511],
      [0.5149, 0.8191],
      [-0.8043, -0.4894],
      [-0.8234, -0.5213],
      [-0.834, -0.5638],
      [-0.834, -0.8617],
      [-0.8234, -0.9043],
      [-0.8064, -0.934],
      [-0.7766, -0.9638],
      [-0.7426, -0.983],
      [-0.7085, -0.9915],
      [-0.3149, -0.9915],
      [-0.2702, -0.9787],
      [-0.2362, -0.9553],
      [-0.217, -0.934],
      [-0.1979, -0.8979],
      [-0.1894, -0.8596],
      [-0.1915, -0.8213],
      [-0.2, -0.7936],
      [-0.217, -0.7638],
      [-0.3277, -0.6383],
      [-0.3362, -0.6191],
      [-0.3362, -0.5872],
      [-0.3277, -0.5681],
      [0.6511, 0.4106],
      [0.6745, 0.4213],
      [0.7043, 0.4213],
      [0.7298, 0.4085],
      [0.7447, 0.3936],
      [0.7553, 0.3681],
      [0.7553, 0.1532],
      [0.7468, 0.1319],
      [0.2745, -0.3426],
      [0.0553, -0.5511],
      [0.034, -0.5851],
      [0.0234, -0.6213],
      [0.0234, -0.666],
      [0.0447, -0.7213],
      [0.2404, -0.9383],
      [0.2809, -0.9723],
      [0.3362, -0.9915],
      [0.666, -0.9915],
      [0.6979, -0.983],
      [0.7298, -0.966],
      [0.7532, -0.9447],
      [0.7809, -0.8979],
      [0.7894, -0.8383],
      [0.7787, -0.7936],
      [0.7553, -0.7553],
      [0.4979, -0.5],
      [0.4702, -0.4957],
      [0.4532, -0.5043],
      [0.4404, -0.5255],
      [0.4426, -0.5468],
      [0.7064, -0.8191],
      [0.7128, -0.8404],
      [0.7085, -0.8723],
      [0.6936, -0.8957],
      [0.6723, -0.9106],
      [0.6596, -0.9149],
      [0.3319, -0.9128],
      [0.3021, -0.8915],
      [0.1149, -0.6872],
      [0.1, -0.6596],
      [0.1, -0.6277],
      [0.1128, -0.6021],
      [0.3213, -0.4043],
      [0.8106, 0.0894],
      [0.8234, 0.1149],
      [0.8319, 0.1489],
      [0.8298, 0.3851],
      [0.8085, 0.4362],
      [0.7787, 0.4681],
      [0.7468, 0.4872],
      [0.7085, 0.4979],
      [0.6553, 0.4957],
      [0.6149, 0.4787],
      [0.5872, 0.4574],
      [-0.3915, -0.5255],
      [-0.4085, -0.5617],
      [-0.4128, -0.583],
      [-0.4085, -0.6447],
      [-0.3809, -0.6957],
      [-0.2702, -0.8234],
      [-0.266, -0.8574],
      [-0.2766, -0.8851],
      [-0.2894, -0.9],
      [-0.3191, -0.9149],
      [-0.7043, -0.9149],
      [-0.734, -0.9],
      [-0.7532, -0.8745],
      [-0.7574, -0.8596],
      [-0.7574, -0.566],
      [-0.7468, -0.5404],
      [0.5723, 0.7681],
      [0.5936, 0.8043],
      [0.6021, 0.8319],
      [0.6021, 0.883],
      [0.5915, 0.917],
      [0.5766, 0.9426],
      [0.5362, 0.9809],
      [0.4851, 1.0],
      [-0.2106, 1.0021],
    ],
  ];
  const shape = new T.Shape();
  paths[0].forEach((point, i) =>
    i ? shape.lineTo(...point) : shape.moveTo(...point),
  );
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: 0.62,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.035,
    bevelSegments: 2,
    steps: 1,
  });
  geometry.translate(0, 0, -0.31);
  const materials = [0xff175b, 0xe7e7e7, 0x29292d].map(
    (color) =>
      new T.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.18 }),
  );
  const batches = materials.map((material) => {
    const batch = new T.InstancedMesh(geometry, material, 9);
    batch.instanceMatrix.setUsage(T.DynamicDrawUsage);
    batch.frustumCulled = false;
    scene.add(batch);
    return batch;
  });
  const pieces = Array.from({ length: 27 }, (_, i) => {
    const angle = i * 2.39996,
      radius = Math.sqrt((i + 1) / 27) * 0.47;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: ((i % 5) - 2) * 0.62,
      size: 0.5 + (i % 4) * 0.1,
    };
  });
  const dummy = new T.Object3D();
  let viewWidth = 1,
    viewHeight = 1,
    visible = false,
    frame = 0,
    previous = 0,
    elapsed = 0;
  function paint() {
    pieces.forEach((piece, i) => {
      const t = reduced.matches ? 0 : elapsed;
      dummy.position.set(
        piece.x * viewWidth + Math.sin(t * 0.24 + i) * 0.22,
        piece.y * viewHeight + Math.cos(t * 0.25 + i) * 0.22,
        piece.z,
      );
      dummy.rotation.set(
        i * 0.72 + t * Math.sin(i) * 0.06,
        i * 0.46 + t * Math.cos(i) * 0.08,
        i * 0.91 + t * 0.025,
      );
      dummy.scale.setScalar(piece.size * (camera.aspect < 0.7 ? 0.58 : 1));
      dummy.updateMatrix();
      batches[i % 3].setMatrixAt(Math.floor(i / 3), dummy.matrix);
    });
    batches.forEach((batch) => {
      batch.instanceMatrix.needsUpdate = true;
    });
    renderer.render(scene, camera);
  }
  function resize() {
    const width = stage.clientWidth,
      height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    viewHeight =
      2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    viewWidth = viewHeight * camera.aspect;
    paint();
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    if (!previous) previous = now;
    if (now - previous >= 33) {
      elapsed += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      paint();
    }
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    if (visible && !document.hidden && !reduced.matches && !frame) {
      previous = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  new ResizeObserver(resize).observe(stage);
  function setActive(active) {
    visible = active;
    cancelAnimationFrame(frame);
    frame = 0;
    if (visible) {
      paint();
      schedule();
    }
  }
  reduced.addEventListener("change", () => {
    cancelAnimationFrame(frame);
    frame = 0;
    paint();
    schedule();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    frame = 0;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    resize();
    schedule();
  });
  resize();
  return { setActive };
};

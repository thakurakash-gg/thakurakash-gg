/* A small, self-contained Three.js gallery. No scene models or post-processing downloads. */
(() => {
  "use strict";
  const stage = document.querySelector("#studio-gallery");
  if (!stage) return;
  const canvas = stage.querySelector("canvas");
  const video = document.querySelector("#gallery-video");
  const motionButton = document.querySelector("#gallery-motion");
  const hint = document.querySelector("#gallery-hint");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  const conserve = Boolean(
    connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || ""),
  );
  let wanted = !reduce.matches && !conserve;
  let ready = false,
    visible = false,
    booting = false,
    active = false;
  let renderFrame = 0,
    lastDraw = 0,
    lastTime = 0;
  let yaw = 0,
    targetYaw = 0,
    tilt = 0,
    targetTilt = 0,
    drag = null;
  let renderer, scene, camera, display, cards, T, resolution;
  const shortDevice =
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    navigator.hardwareConcurrency <= 4;
  let viewIndex = 0;
  const requestDraw = () => {
    if (!active && ready && visible && !document.hidden) {
      active = true;
      renderFrame = requestAnimationFrame(frame);
    }
  };
  function label() {
    motionButton.textContent =
      !ready && !wanted
        ? "Enable 3D"
        : wanted
          ? "Pause motion"
          : "Resume motion";
    motionButton.setAttribute("aria-pressed", String(!wanted));
  }
  function stop() {
    cancelAnimationFrame(renderFrame);
    active = false;
    video.pause();
  }
  function sync() {
    if (!ready || !visible || document.hidden) {
      stop();
      return;
    }
    if (wanted && video.getAttribute("src")) video.play().catch(() => {});
    else video.pause();
    requestDraw();
    label();
  }

  function roundShape(width, height, radius) {
    const x = -width / 2,
      y = -height / 2,
      s = new T.Shape();
    s.moveTo(x + radius, y);
    s.lineTo(x + width - radius, y);
    s.quadraticCurveTo(x + width, y, x + width, y + radius);
    s.lineTo(x + width, y + height - radius);
    s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    s.lineTo(x + radius, y + height);
    s.quadraticCurveTo(x, y + height, x, y + height - radius);
    s.lineTo(x, y + radius);
    s.quadraticCurveTo(x, y, x + radius, y);
    return s;
  }
  function textureSettings(texture) {
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return texture;
  }
  function titleTexture(title, note) {
    const sheet = document.createElement("canvas");
    sheet.width = 1024;
    sheet.height = 128;
    const ctx = sheet.getContext("2d");
    ctx.clearRect(0, 0, 1024, 128);
    ctx.fillStyle = "#27392f";
    ctx.font = "500 37px Manrope, sans-serif";
    ctx.fillText(title, 0, 50);
    ctx.fillStyle = "#65726a";
    ctx.font = "23px Manrope, sans-serif";
    ctx.fillText(note, 0, 96);
    return textureSettings(new T.CanvasTexture(sheet));
  }
  function card({ width, height, color, title, note, poster }) {
    const group = new T.Group();
    const frame = new T.ExtrudeGeometry(roundShape(width, height, 0.09), {
      depth: 0.13,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.025,
      bevelSegments: 2,
      curveSegments: 8,
      steps: 1,
    });
    frame.translate(0, 0, -0.15);
    const back = new T.Mesh(
      frame,
      new T.MeshStandardMaterial({
        color,
        roughness: 0.65,
        metalness: 0.04,
        dithering: true,
      }),
    );
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);
    const photoWidth = width - 0.34,
      photoHeight = (photoWidth * 9) / 16;
    const imageMaterial = new T.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });
    const image = new T.Mesh(
      new T.PlaneGeometry(photoWidth, photoHeight),
      imageMaterial,
    );
    image.position.set(0, (height - photoHeight) / 2 - 0.17, 0.034);
    group.add(image);
    new T.TextureLoader().load(
      poster,
      (texture) => {
        if (imageMaterial.map?.isVideoTexture) {
          texture.dispose();
          return;
        }
        imageMaterial.map = textureSettings(texture);
        imageMaterial.needsUpdate = true;
        requestDraw();
      },
      undefined,
      () => {},
    );
    const caption = new T.Mesh(
      new T.PlaneGeometry(photoWidth, photoWidth / 8),
      new T.MeshBasicMaterial({
        map: titleTexture(title, note),
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
    );
    caption.position.set(0, -height / 2 + 0.36, 0.038);
    group.add(caption);
    return { group, image, imageMaterial };
  }

  function resize() {
    if (!renderer) return;
    const width = stage.clientWidth,
      height = stage.clientHeight;
    const aspect = width / Math.max(1, height),
      phone = width < 650;
    const baseHeight = phone ? 9.6 : Math.max(5.6, 12.9 / aspect);
    camera.left = (-baseHeight * aspect) / 2;
    camera.right = (baseHeight * aspect) / 2;
    camera.top = baseHeight / 2;
    camera.bottom = -baseHeight / 2;
    camera.updateProjectionMatrix();
    cards[0].group.position.set(0, 0.32, 0.7);
    cards[1].group.position.set(
      phone ? -1.95 : -4.18,
      phone ? 1.75 : 0.2,
      -0.7,
    );
    cards[2].group.position.set(phone ? 1.9 : 4.12, phone ? 1.2 : -0.1, -0.3);
    const cap = shortDevice ? 1.15 : 1.6;
    resolution = Math.min(
      devicePixelRatio || 1,
      cap,
      Math.sqrt(1350000 / (width * height)),
    );
    renderer.setPixelRatio(resolution);
    renderer.setSize(width, height, false);
    renderer.shadowMap.needsUpdate = true;
    stage.dataset.pixelRatio = resolution.toFixed(2);
    requestDraw();
  }

  async function boot() {
    if (booting || ready) return;
    booting = true;
    try {
      if (!window.THREE)
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "assets/three.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.append(script);
        });
      T = window.THREE;
      renderer = new T.WebGLRenderer({
        canvas,
        antialias: !shortDevice,
        alpha: false,
        powerPreference: "low-power",
      });
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = !shortDevice;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = false;
      scene = new T.Scene();
      scene.background = new T.Color(0xdfe5e4);
      camera = new T.OrthographicCamera(-7, 7, 3, -3, 0.1, 70);
      camera.position.set(0.1, 2.9, 14);
      camera.lookAt(0, 0, 0);
      scene.add(new T.HemisphereLight(0xffffff, 0x9aa99f, 1.8));
      const key = new T.DirectionalLight(0xfff4df, 2.6);
      key.position.set(-4, 8, 7);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -9;
      key.shadow.camera.right = 9;
      key.shadow.camera.top = 7;
      key.shadow.camera.bottom = -7;
      key.shadow.normalBias = 0.045;
      key.shadow.bias = -0.0002;
      scene.add(key);
      const fill = new T.DirectionalLight(0xd6d8ff, 0.8);
      fill.position.set(7, 3, -3);
      scene.add(fill);

      const floor = new T.Mesh(
        new T.PlaneGeometry(100, 100),
        new T.MeshStandardMaterial({
          color: 0xdfe5e4,
          roughness: 1,
          dithering: true,
        }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.25;
      floor.receiveShadow = true;
      scene.add(floor);
      display = new T.Group();
      scene.add(display);
      cards = [
        card({
          width: 5.55,
          height: 3.72,
          color: 0xf1eee5,
          title: "Experience Center",
          note: "Architecture / Film",
          poster: "assets/experience-center-poster.jpg",
        }),
        card({
          width: 3.6,
          height: 2.8,
          color: 0xd6c3af,
          title: "AMD",
          note: "3D / Medical animation",
          poster: "assets/studio/amd-preview.webp",
        }),
        card({
          width: 3.6,
          height: 2.8,
          color: 0xd9d1e3,
          title: "Mario miniature",
          note: "Sculpt / Print design",
          poster: "assets/studio/mario-preview.webp",
        }),
      ];
      cards.forEach((c) => display.add(c.group));
      cards[1].group.rotation.set(0.04, 0.22, -0.13);
      cards[2].group.rotation.set(-0.03, -0.22, 0.11);
      cards[0].group.rotation.z = -0.018;

      // One smooth plinth underneath the work gives the scene an architectural scale.
      const plinthGeometry = new T.ExtrudeGeometry(
        roundShape(6.4, 3.25, 0.35),
        {
          depth: 0.1,
          bevelEnabled: true,
          bevelSize: 0.045,
          bevelThickness: 0.025,
          bevelSegments: 2,
          curveSegments: 12,
          steps: 1,
        },
      );
      plinthGeometry.rotateX(-Math.PI / 2);
      const plinth = new T.InstancedMesh(
        plinthGeometry,
        new T.MeshStandardMaterial({
          color: 0xb1c4b9,
          roughness: 0.62,
          metalness: 0.05,
          dithering: true,
        }),
        4,
      );
      const matrix = new T.Matrix4();
      for (let i = 0; i < 4; i++) {
        matrix.makeTranslation(0, -2.05 + i * 0.14, 0.2);
        plinth.setMatrixAt(i, matrix);
      }
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      scene.add(plinth);
      ready = true;
      new ResizeObserver(resize).observe(stage);
      resize();
      renderer.render(scene, camera);
      stage.classList.add("is-ready");
      stage.dataset.renderer = "webgl";
      stage.dataset.drawCalls = String(renderer.info.render.calls);
      stage.dataset.triangles = String(renderer.info.render.triangles);
      hint.textContent = "Drag gently to change the view";
      if (wanted) enableVideo();
      sync();
    } catch {
      ready = false;
      hint.textContent = "Selected work from the studio";
      motionButton.hidden = true;
      document.querySelector("#gallery-view").hidden = true;
      renderer?.dispose();
    }
  }

  function enableVideo() {
    if (video.getAttribute("src")) return;
    video.src = "assets/experience-center.mp4";
    video.load();
    video.addEventListener(
      "loadeddata",
      () => {
        const texture = textureSettings(new T.VideoTexture(video));
        texture.generateMipmaps = false;
        const previous = cards[0].imageMaterial.map;
        if (previous && !previous.isVideoTexture) previous.dispose();
        cards[0].imageMaterial.map = texture;
        cards[0].imageMaterial.needsUpdate = true;
        sync();
      },
      { once: true },
    );
  }
  function frame(now) {
    if (!visible || document.hidden) {
      stop();
      return;
    }
    const dt = Math.min(0.05, (now - (lastTime || now)) / 1000);
    lastTime = now;
    const changing =
      Math.abs(yaw - targetYaw) + Math.abs(tilt - targetTilt) > 0.0004;
    const fps = changing || drag ? 60 : 30;
    if (now - lastDraw >= 1000 / fps - 1) {
      yaw += (targetYaw - yaw) * (1 - Math.exp(-9 * dt));
      tilt += (targetTilt - tilt) * (1 - Math.exp(-9 * dt));
      display.rotation.y = yaw;
      display.rotation.x = tilt;
      renderer.render(scene, camera);
      lastDraw = now;
    }
    if (changing || drag || (wanted && !video.paused))
      renderFrame = requestAnimationFrame(frame);
    else active = false;
  }
  canvas.addEventListener("pointerdown", (event) => {
    if (!ready) return;
    drag = { x: event.clientX, y: event.clientY, base: targetYaw };
    canvas.setPointerCapture(event.pointerId);

    requestDraw();
  });
  canvas.addEventListener(
    "pointermove",
    (event) => {
      if (!ready || reduce.matches) return;
      const rect = canvas.getBoundingClientRect();
      if (drag)
        targetYaw = T.MathUtils.clamp(
          drag.base + (event.clientX - drag.x) / stage.clientWidth,
          -0.3,
          0.3,
        );
      else if (event.pointerType === "mouse") {
        targetYaw = ((event.clientX - rect.left) / rect.width - 0.5) * 0.12;
        targetTilt = ((event.clientY - rect.top) / rect.height - 0.5) * 0.045;
      }

      requestDraw();
    },
    { passive: true },
  );
  const release = () => {
    drag = null;
    requestDraw();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", () => {
    if (!drag) {
      targetYaw = 0;
      targetTilt = 0;
      requestDraw();
    }
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stop();
    stage.classList.remove("is-ready");
    hint.textContent = "Selected work from the studio";
    motionButton.hidden = true;
    document.querySelector("#gallery-view").hidden = true;
  });
  document
    .querySelector("#gallery-view")
    .addEventListener("click", async () => {
      if (!ready) {
        await boot();
        if (!ready) return;
      }
      const views = [
        { yaw: 0, tilt: 0, label: "Front view" },
        { yaw: -0.23, tilt: -0.035, label: "Left view" },
        { yaw: 0.23, tilt: 0.025, label: "Right view" },
      ];
      viewIndex = (viewIndex + 1) % views.length;
      targetYaw = views[viewIndex].yaw;
      targetTilt = views[viewIndex].tilt;
      document.querySelector("#gallery-status").textContent =
        views[viewIndex].label;
      if (reduce.matches) {
        yaw = targetYaw;
        tilt = targetTilt;
        display.rotation.set(tilt, yaw, 0);
        renderer.render(scene, camera);
      }
      requestDraw();
    });
  motionButton.addEventListener("click", () => {
    wanted = !wanted;
    if (!ready) boot();
    else {
      if (wanted) enableVideo();
      sync();
    }
    label();
  });
  video.addEventListener("play", requestDraw);
  video.addEventListener("error", () => {
    wanted = false;
    label();
    requestDraw();
  });
  reduce.addEventListener("change", (event) => {
    if (event.matches) {
      wanted = false;
      targetYaw = yaw;
      targetTilt = tilt;
      sync();
    }
  });
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("studio:film-open", stop);
  document.addEventListener("studio:film-close", sync);
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !ready && !booting && wanted) boot();
      else sync();
    },
    { threshold: 0.08 },
  ).observe(stage);
  window.addEventListener("pagehide", stop);
  label();
})();

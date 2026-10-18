/* Pixelate the rendered sculpture itself, in a short screen-space wake. */
(() => {
  "use strict";
  window.KazeyamiPixelTrail = function (T, renderer, stage, requestRender) {
    const allowed = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const blockSize = 32;
    let columns = 1,
      rows = 1,
      energy = new Float32Array(1),
      bytes;
    let texture, target, material, quadScene, quadCamera;
    let active = false,
      previous = null,
      lastTime = 0;
    const uniforms = {
      sceneImage: { value: null },
      trail: { value: null },
      grid: { value: new T.Vector2(1, 1) },
    };

    function clear() {
      energy.fill(0);
      previous = null;
      if (active) requestRender();
      active = false;
    }
    function resize() {
      clear();
      columns = Math.max(1, Math.ceil(stage.clientWidth / blockSize));
      rows = Math.max(1, Math.ceil(stage.clientHeight / blockSize));
      energy = new Float32Array(columns * rows);
      bytes = new Uint8Array(columns * rows * 4);
      if (texture) texture.dispose();
      texture = null;
      uniforms.grid.value.set(columns, rows);
      if (target) {
        const size = renderer.getDrawingBufferSize(new T.Vector2());
        target.setSize(size.x, size.y);
      }
    }
    function prepare() {
      if (!texture) {
        texture = new T.DataTexture(bytes, columns, rows, T.RGBAFormat);
        texture.minFilter = texture.magFilter = T.NearestFilter;
        texture.generateMipmaps = false;
        uniforms.trail.value = texture;
      }
      if (target) return;
      const size = renderer.getDrawingBufferSize(new T.Vector2());
      target = new T.WebGLRenderTarget(size.x, size.y, {
        depthBuffer: true,
        stencilBuffer: false,
      });
      if (renderer.capabilities.isWebGL2) target.samples = 2;
      uniforms.sceneImage.value = target.texture;
      material = new T.ShaderMaterial({
        uniforms,
        depthTest: false,
        depthWrite: false,
        vertexShader: `varying vec2 vUv;
          void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
        fragmentShader: `uniform sampler2D sceneImage;
          uniform sampler2D trail;
          uniform vec2 grid;
          varying vec2 vUv;
          void main(){
            vec2 cell=(floor(vUv*grid)+0.5)/grid;
            float strength=texture2D(trail,cell).r;
            vec4 sharp=texture2D(sceneImage,vUv);
            vec4 coarse=texture2D(sceneImage,cell);
            gl_FragColor=mix(sharp,coarse,strength);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      });
      quadScene = new T.Scene();
      quadCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      quadScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), material));
    }
    function brush(x, y) {
      const gx = (x / stage.clientWidth) * columns;
      const gy = (1 - y / stage.clientHeight) * rows;
      for (
        let row = Math.max(0, Math.floor(gy - 2));
        row < Math.min(rows, Math.ceil(gy + 2));
        row++
      ) {
        for (
          let col = Math.max(0, Math.floor(gx - 2));
          col < Math.min(columns, Math.ceil(gx + 2));
          col++
        ) {
          const distance = Math.hypot(col + 0.5 - gx, row + 0.5 - gy);
          // Irregular cell edges, but a continuous, fully pixelated core.
          const edge = 1.55 + ((col * 13 + row * 7) % 5) * 0.1;
          const value = Math.max(0, Math.min(1, (edge - distance) * 2.4));
          const index = row * columns + col;
          energy[index] = Math.max(energy[index], value);
        }
      }
    }
    document.addEventListener(
      "pointermove",
      (event) => {
        if (
          !allowed.matches ||
          event.pointerType !== "mouse" ||
          document.hidden ||
          event.target.closest("button,a,input,textarea,select,[role=dialog]")
        )
          return;
        const rect = stage.getBoundingClientRect();
        const x = event.clientX - rect.left,
          y = event.clientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
          previous = null;
          return;
        }
        if (!previous) previous = { x, y };
        const distance = Math.hypot(x - previous.x, y - previous.y);
        const steps = Math.min(20, Math.max(1, Math.ceil(distance / 16)));
        for (let i = 1; i <= steps; i++)
          brush(
            previous.x + ((x - previous.x) * i) / steps,
            previous.y + ((y - previous.y) * i) / steps,
          );
        previous = { x, y };
        if (!active) lastTime = performance.now();
        active = true;
        requestRender();
      },
      { passive: true },
    );
    document.addEventListener("pointerleave", () => {
      previous = null;
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
    });
    allowed.addEventListener("change", clear);

    function render(scene, camera, now) {
      if (!active || !allowed.matches) {
        renderer.render(scene, camera);
        return false;
      }
      prepare();
      const dt = Math.min(0.06, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      let remaining = false;
      for (let i = 0; i < energy.length; i++) {
        // Hold coarse blocks briefly, then resolve cleanly to the original image.
        energy[i] = Math.max(0, energy[i] - dt * 1.65);
        const strength = Math.min(1, energy[i] * 1.9);
        bytes[i * 4] = Math.round(strength * 255);
        bytes[i * 4 + 3] = 255;
        if (strength > 0.004) remaining = true;
      }
      texture.needsUpdate = true;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCamera);
      active = remaining;
      return remaining;
    }
    resize();
    return { resize, render, clear };
  };
})();

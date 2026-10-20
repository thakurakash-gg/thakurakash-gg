(() => {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (
    !matchMedia("(hover: hover) and (pointer: fine)").matches ||
    innerWidth <= 700 ||
    motion.matches ||
    navigator.connection?.saveData
  )
    return;
  const vertex = `attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
  const fragment = `precision mediump float;varying vec2 uv;uniform sampler2D photo;uniform sampler2D motionField;uniform float power;void main(){vec2 push=(texture2D(motionField,uv).rg-.5)*2.;vec2 at=clamp(uv-push*.055*power,.001,.999);float bend=length(push);vec2 fringe=push*.003*power;vec3 rgb=vec3(texture2D(photo,clamp(at+fringe,.001,.999)).r,texture2D(photo,at).g,texture2D(photo,clamp(at-fringe,.001,.999)).b);rgb*=1.-bend*.04*power;gl_FragColor=vec4(rgb,1.);}`;
  function boot(panel) {
    const image = panel.querySelector("img"),
      canvas = document.createElement("canvas");
    canvas.className = "image-flow-canvas";
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;
    function shader(type, source) {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error("shader");
      return s;
    }
    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    } catch {
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    function texture(unit) {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    texture(0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(gl.getUniformLocation(program, "photo"), 0);
    const fieldTexture = texture(1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.uniform1i(gl.getUniformLocation(program, "motionField"), 1);
    const power = gl.getUniformLocation(program, "power");
    const size = 64,
      field = new Float32Array(size * size * 2),
      next = new Float32Array(field.length),
      pixels = new Uint8Array(size * size * 4);
    let pointer = null,
      lastPoint = null,
      vx = 0,
      vy = 0,
      inside = false,
      visible = true,
      running = false,
      energy = 0,
      frame = 0;
    panel.insertBefore(canvas, image.nextSibling);
    function resize() {
      canvas.width = Math.round(
        image.clientWidth * Math.min(devicePixelRatio, 1.5),
      );
      canvas.height = Math.round(
        image.clientHeight * Math.min(devicePixelRatio, 1.5),
      );
      canvas.style.height = image.clientHeight + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
      start();
    }
    new ResizeObserver(resize).observe(image);
    function sample(x, y, c) {
      x = Math.max(0, Math.min(size - 1, x));
      y = Math.max(0, Math.min(size - 1, y));
      const a = Math.floor(x),
        b = Math.floor(y),
        tx = x - a,
        ty = y - b;
      const get = (i, j) =>
        field[(Math.min(size - 1, j) * size + Math.min(size - 1, i)) * 2 + c];
      return (
        (get(a, b) * (1 - tx) + get(a + 1, b) * tx) * (1 - ty) +
        (get(a, b + 1) * (1 - tx) + get(a + 1, b + 1) * tx) * ty
      );
    }
    function render() {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      energy = 0;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 2;
          let a = sample(x - field[i] * 0.7, y - field[i + 1] * 0.7, 0) * 0.952,
            b = sample(x - field[i] * 0.7, y - field[i + 1] * 0.7, 1) * 0.952;
          if (pointer && !motion.matches) {
            const dx = x / size - pointer.x,
              dy = y / size - pointer.y,
              gaussian = Math.exp(-(dx * dx + dy * dy) / 0.012);
            a += vx * gaussian * 0.35;
            b += vy * gaussian * 0.35;
          }
          next[i] = Math.max(-1, Math.min(1, a));
          next[i + 1] = Math.max(-1, Math.min(1, b));
          energy += Math.abs(a) + Math.abs(b);
        }
      field.set(next);
      vx *= 0.72;
      vy *= 0.72;
      for (let i = 0; i < size * size; i++) {
        pixels[i * 4] = Math.round(127.5 + field[i * 2] * 127.5);
        pixels[i * 4 + 1] = Math.round(127.5 + field[i * 2 + 1] * 127.5);
        pixels[i * 4 + 2] = 128;
        pixels[i * 4 + 3] = 255;
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        size,
        size,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
      );
      gl.uniform1f(power, motion.matches ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      panel.classList.add("flow-ready");
      if (energy > 0.03 || Math.abs(vx) + Math.abs(vy) > 0.001) {
        frame = requestAnimationFrame(render);
      } else running = false;
    }
    function start() {
      if (!running) {
        running = true;
        frame = requestAnimationFrame(render);
      }
    }
    panel.addEventListener("pointermove", (e) => {
      if (motion.matches) return;
      const r = image.getBoundingClientRect();
      if (e.clientY > r.bottom) return;
      const point = {
        x: (e.clientX - r.left) / r.width,
        y: 1 - (e.clientY - r.top) / r.height,
      };
      if (lastPoint) {
        vx = Math.max(-1, Math.min(1, (point.x - lastPoint.x) * 24));
        vy = Math.max(-1, Math.min(1, (point.y - lastPoint.y) * 24));
      }
      pointer = point;
      lastPoint = point;
      inside = true;
      start();
    });
    panel.addEventListener("pointerleave", () => {
      inside = false;
      pointer = null;
      lastPoint = null;
    });
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
      },
      { threshold: 0.01 },
    ).observe(panel);
    motion.addEventListener("change", () => {
      inside = false;
      field.fill(0);
      pointer = null;
      start();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && visible) start();
    });
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      panel.classList.remove("flow-ready");
      canvas.style.display = "none";
    });
    resize();
  }
  document.querySelectorAll(".drag-visual").forEach((panel) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const img = panel.querySelector("img");
        if (img.complete && img.naturalWidth) boot(panel);
        else img.addEventListener("load", () => boot(panel), { once: true });
      },
      { rootMargin: "100px" },
    );
    observer.observe(panel);
  });
})();

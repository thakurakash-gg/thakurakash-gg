/* Render the actual hero typography in the same pixel-effect layer as the sword. */
window.KazeyamiKatanaWordmark = function (T, scene, camera, stage, name) {
  const color = getComputedStyle(name).color;
  const material = new T.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const art = new T.Mesh(new T.PlaneGeometry(1, 1), material);
  art.position.z = -0.4;
  art.renderOrder = -1;
  scene.add(art);
  let bounds;
  function spans() {
    const text = [...name.childNodes].find(
      (node) =>
        node.nodeType === Node.TEXT_NODE &&
        node.textContent.includes("Kazeyami"),
    );
    const start = text.textContent.indexOf("Kazeyami");
    const range = document.createRange();
    range.setStart(text, start);
    range.setEnd(text, start + 8);
    const copyright = name.querySelector("sup");
    return [
      {
        text: "Kazeyami",
        rect: range.getBoundingClientRect(),
        style: getComputedStyle(name),
      },
      {
        text: copyright.textContent,
        rect: copyright.getBoundingClientRect(),
        style: getComputedStyle(copyright),
      },
    ];
  }
  function measure(items) {
    const left = Math.min(...items.map((item) => item.rect.left)),
      top = Math.min(...items.map((item) => item.rect.top));
    return {
      left,
      top,
      width: Math.max(...items.map((item) => item.rect.right)) - left,
      height: Math.max(...items.map((item) => item.rect.bottom)) - top,
    };
  }
  function sync() {
    bounds = measure(spans());
    const stageBounds = stage.getBoundingClientRect();
    const perPixel =
      (2 *
        (camera.position.z - art.position.z) *
        Math.tan(T.MathUtils.degToRad(camera.fov / 2))) /
      stage.clientHeight;
    art.scale.set(bounds.width * perPixel, bounds.height * perPixel, 1);
    art.position.x =
      (bounds.left -
        stageBounds.left +
        bounds.width / 2 -
        stage.clientWidth / 2) *
      perPixel;
    art.position.y =
      (stage.clientHeight / 2 -
        (bounds.top - stageBounds.top + bounds.height / 2)) *
      perPixel;
  }
  function resize() {
    const items = spans();
    bounds = measure(items);
    const surface = document.createElement("canvas"),
      ratio = Math.min(devicePixelRatio, 1.8);
    surface.width = Math.ceil(bounds.width * ratio);
    surface.height = Math.ceil(bounds.height * ratio);
    const ctx = surface.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.fillStyle = color;
    for (const item of items) {
      ctx.font = `${item.style.fontWeight} ${item.style.fontSize} ${item.style.fontFamily}`;
      ctx.textBaseline = "alphabetic";
      const size = parseFloat(item.style.fontSize),
        spacing = parseFloat(item.style.letterSpacing) || 0;
      const baseline =
        item.rect.top -
        bounds.top +
        (ctx.measureText(item.text).fontBoundingBoxAscent || size * 0.91);
      if ("letterSpacing" in ctx) {
        ctx.letterSpacing = `${spacing}px`;
        ctx.fillText(item.text, item.rect.left - bounds.left, baseline);
      } else {
        let x = item.rect.left - bounds.left;
        for (const character of item.text) {
          ctx.fillText(character, x, baseline);
          x += ctx.measureText(character).width + spacing;
        }
      }
      ctx.letterSpacing = "0px";
    }
    material.map?.dispose();
    material.map = new T.CanvasTexture(surface);
    material.map.encoding = T.sRGBEncoding;
    material.map.generateMipmaps = false;
    material.map.minFilter = T.LinearFilter;
    material.needsUpdate = true;
    sync();
  }
  return {
    resize,
    sync,
    enable() {
      name.classList.add("is-webgl-wordmark");
      stage.classList.add("has-wordmark");
    },
    disable() {
      name.classList.remove("is-webgl-wordmark");
    },
    update(progress, visible) {
      material.opacity = Math.max(0, 1 - progress * 3);
      art.visible = visible && material.opacity > 0.001;
    },
  };
};

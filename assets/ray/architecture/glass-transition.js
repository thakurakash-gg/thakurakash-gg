/* Blend validated lighting atlases in linear HDR; glazing keeps one texture binding. */
(() => {
  "use strict";
  const T = window.THREE,
    P = window.RayWorld.prototype;
  const moods = ["morning", "afternoon", "evening", "night"];
  P.updateGlassBlend = function (dt, force = false) {
    if (!this.glassBlendTarget) return;
    const target = moods.indexOf(this.mood);
    if (target < 0) return;
    const weights = this.glassBlendWeights,
      k = Math.min(1, Math.max(0, dt) * 3);
    let changed = force;
    for (let index = 0; index < 4; index++) {
      const desired = index === target ? 1 : 0;
      if (Math.abs(weights[index] - desired) > 0.00001) {
        weights[index] += (desired - weights[index]) * k;
        changed = true;
      } else weights[index] = desired;
    }
    if (!changed) return;
    const total = weights.reduce((sum, value) => sum + value, 0);
    for (let index = 0; index < 4; index++) weights[index] /= total;
    this.glassBlendUniforms.weights.value.fromArray(weights);
    const previous = this.renderer.getRenderTarget(),
      shadow = this.renderer.shadowMap.needsUpdate;
    try {
      this.renderer.shadowMap.needsUpdate = false;
      this.renderer.setRenderTarget(this.glassBlendTarget);
      this.renderer.render(this.glassBlendScene, this.glassBlendCamera);
    } finally {
      this.renderer.setRenderTarget(previous);
      this.renderer.shadowMap.needsUpdate = shadow;
    }
    this.canvas.dataset.glassBlendWeights = weights.map((value) => value.toFixed(4)).join(",");
  };
  const prepare = P.prepareGlassEnvironments;
  P.prepareGlassEnvironments = async function (progress) {
    await prepare.call(this, progress);
    if (!moods.every((mood) => this.glassEnvironments?.has(mood))) return;
    const first = this.glassEnvironments.get("morning").target;
    this.glassBlendTarget = new T.WebGLRenderTarget(first.width, first.height, {
      type: T.HalfFloatType,
      minFilter: T.LinearFilter,
      magFilter: T.LinearFilter,
      depthBuffer: false,
    });
    this.glassBlendTarget.texture.mapping = T.CubeUVReflectionMapping;
    this.glassBlendTarget.texture.colorSpace = T.LinearSRGBColorSpace;
    this.glassBlendWeights = moods.map((mood) => (mood === this.mood ? 1 : 0));
    const uniforms = { weights: { value: new T.Vector4() } };
    moods.forEach(
      (mood, index) =>
        (uniforms["map" + index] = { value: this.glassEnvironments.get(mood).target.texture }),
    );
    this.glassBlendUniforms = uniforms;
    const material = new T.ShaderMaterial({
      uniforms,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: `precision highp float;varying vec2 vUv;uniform sampler2D map0,map1,map2,map3;uniform vec4 weights;
        void main(){vec3 radiance=texture2D(map0,vUv).rgb*weights.x+
          texture2D(map1,vUv).rgb*weights.y+texture2D(map2,vUv).rgb*weights.z+
          texture2D(map3,vUv).rgb*weights.w;gl_FragColor=vec4(radiance,1.);}`,
    });
    this.glassBlendScene = new T.Scene();
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    this.glassBlendScene.add(quad);
    this.glassBlendCamera = new T.Camera();
    this.updateGlassBlend(0, true);
    for (const mat of this.modelMaterials)
      if (mat.userData.rayReflective) {
        mat.envMap = this.glassBlendTarget.texture;
        mat.needsUpdate = true;
      }
    this.canvas.dataset.glassTransition = "continuous-linear-hdr";
  };
  const select = P.useGlassEnvironment;
  P.useGlassEnvironment = function (environment, probe) {
    if (!this.glassBlendTarget) return select.call(this, environment, probe);
    // Selection updates diagnostics only. The bound atlas fades every frame,
    // including interrupted transitions; it is never swapped at the end.
    this.glassCaptureMood = this.mood;
    this.canvas.dataset.glassProbe = JSON.stringify({ mood: this.mood, ...probe });
  };
  const light = P.updateLight;
  P.updateLight = function (dt) {
    const moving = light.call(this, dt);
    this.updateGlassBlend(dt);
    return moving;
  };
})();

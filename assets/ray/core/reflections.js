/* Keep reflection density proportional to the actual drawing buffer, including portrait phones. */
(() => {
  const THREE = window.THREE;
  window.RayWorld.prototype.resizeReflection = function () {
    const size = this.renderer.getDrawingBufferSize((this.reflectionSize ||= new THREE.Vector2()));
    const scale = this.quality.reflectionScale;
    const maximum = Math.min(1536, this.renderer.capabilities.maxTextureSize);
    const fit = Math.min(scale, maximum / Math.max(size.x, size.y));
    const width = Math.max(256, Math.round(size.x * fit));
    const height = Math.max(256, Math.round(size.y * fit));
    if (this.mirrorTarget.width !== width || this.mirrorTarget.height !== height) {
      this.mirrorTarget.setSize(width, height);
    }
  };
})();

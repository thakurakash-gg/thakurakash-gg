/* Capability hints choose the initial budget; measured frame cost then refines it. */
(() => {
  "use strict";
  window.RayQuality = function () {
    const memory = navigator.deviceMemory || 8;
    const cores = navigator.hardwareConcurrency || 8;
    const connection = navigator.connection || {};
    const limited = memory <= 4 || cores <= 4;
    const nativeRatio = window.devicePixelRatio || 1;
    const pixelBudget = limited ? 2800000 : 5500000;
    const maximumRatio = Math.min(
      Math.max(nativeRatio, limited ? 1.25 : 1.5),
      2,
      Math.sqrt(pixelBudget / (innerWidth * innerHeight)),
    );
    return {
      compact: limited,
      tier: limited ? "balanced" : "high",
      pixelRatio: Math.max(1, maximumRatio),
      shadowSize: limited ? 2048 : 4096,
      reflectionScale: limited ? 0.55 : 0.7,
      reflectionMinimum: 0.4,
      contactScale: 1,
      contactShading: !limited,
      saveData: Boolean(connection.saveData),
    };
  };

  // Smooth reflections follow every camera frame. Adapt their resolution, never their motion.
  window.RayAdaptQuality = function (now) {
    const renderer = this.renderer;
    const quality = this.quality;
    this.canvas.dataset.pixelRatio = renderer.getPixelRatio().toFixed(2);
    this.canvas.dataset.reflectionSize = `${this.mirrorTarget.width} × ${this.mirrorTarget.height}`;
    this.canvas.dataset.quality = quality.tier;
    if (!this.performanceStart) {
      this.performanceStart = now;
      return;
    }
    if (now - this.performanceStart < 5000 || now - (this.lastQualityChange || 0) < 2500) return;
    this.performanceSamples = (this.performanceSamples || 0) + 1;
    if (this.performanceSamples < 90) return;
    this.performanceSamples = 0;
    const slow = this.frameMs > 25 && this.renderCostMs > 9;
    const headroom = this.frameMs < 19 && this.renderCostMs < 11;
    const current = renderer.getPixelRatio();
    let next = current;
    if (slow) {
      quality.tier = "adaptive";
      if (quality.contactShading) quality.contactShading = false;
      else if (quality.reflectionScale > quality.reflectionMinimum + 0.01)
        quality.reflectionScale -= 0.1;
      else next = Math.max(1, current - 0.1);
      this.lastQualityChange = now;
    } else if (headroom && current < quality.pixelRatio) {
      next = Math.min(quality.pixelRatio, current + 0.05);
      this.lastQualityChange = now;
    } else if (headroom && quality.reflectionScale < 0.7) {
      quality.reflectionScale = Math.min(0.7, quality.reflectionScale + 0.025);
      this.lastQualityChange = now;
    }
    if (Math.abs(next - current) > 0.01) {
      renderer.setPixelRatio(next);
      renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    }
  };
})();

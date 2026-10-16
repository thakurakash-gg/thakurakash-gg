/* Developer diagnostics are DOM data only; the visitor's interface stays uncluttered. */
(() => {
  "use strict";
  const T = window.THREE,
    P = window.RayWorld.prototype;
  const present = P.renderPresentation;
  P.renderPresentation = function () {
    present.call(this);
    if (!this.modelRoot || this.time - (this.lastMaterialAudit ?? -10) < 2)
      return;
    this.lastMaterialAudit = this.time;
    const materials = new Set();
    let instanceBatches = 0,
      instances = 0;
    this.scene.traverse((object) => {
      if (object.material)
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(material);
      if (object.isInstancedMesh) {
        instanceBatches++;
        instances += object.count;
      }
    });
    const stageMaterials = [...materials];
    const report = {
      sceneMaterials: materials.size,
      customShaderMaterials: stageMaterials.filter(
        (material) => material.isShaderMaterial,
      ).length,
      patchedMaterials: stageMaterials.filter(
        (material) =>
          material.onBeforeCompile !== T.Material.prototype.onBeforeCompile,
      ).length,
      physicalMaterials: stageMaterials.filter(
        (material) => material.isMeshPhysicalMaterial,
      ).length,
      compiledPrograms: this.renderer.info.programs?.length || 0,
      presentationMaterials: this.presentationScene ? 1 : 0,
      instanceBatches,
      instances,
    };
    this.canvas.dataset.materialAudit = JSON.stringify(report);
    this.canvas.dataset.instanceBatches = String(instanceBatches);
    this.canvas.dataset.instances = String(instances);
  };
})();

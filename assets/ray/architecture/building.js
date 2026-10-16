/* The supplied architecture is preserved in the optimized model; additions are landscape and lighting. */
(() => {
  "use strict";
  const T = window.THREE,
    P = window.RayWorld.prototype;
  P.createLand = function () {};
  P.createVegetation = function () {};
  P.createBuilding = function () {
    this.canvas.dataset.building = "loading";
    this.buildingReady = new Promise((resolve, reject) => {
      const loader = new window.RayGLTFLoader();
      loader.setMeshoptDecoder(window.RayMeshoptDecoder);
      this.canvas.dataset.modelDetail = "site-distance";
      loader.load(
        "assets/ray/models/site.glb?v=render-25",
        (gltf) => {
          const root = gltf.scene;
          root.name = "RAY supplied architecture";
          root.rotation.y = -Math.PI / 2 + (window.RayBuildingLandscape.buildingYaw || 0);
          root.position.y = 1.25;
          root.position.z = window.RayBuildingLandscape.buildingShift || 0;
          this.modelMaterials = new Set();
          root.traverse((mesh) => {
            if (!mesh.isMesh) return;
            mesh.receiveShadow = true;
            mesh.castShadow = true;
            for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
              if (this.modelMaterials.has(mat)) continue;
              this.modelMaterials.add(mat);
              mat.envMapIntensity = 0.9;
              if (mat.map)
                mat.map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
              if (/glass/i.test(mat.name)) {
                mat.depthWrite = false;
                mat.roughness = 0.18;
                mat.envMapIntensity = 1.35;
              }
              if (/windows/i.test(mat.name)) {
                mat.color.set(0x516c73);
                mat.metalness = 0.44;
                mat.roughness = 0.24;
                mat.emissive.set(0x000000);
                mat.envMapIntensity = 1.3;
                this.roomMaterial(mat);
              }
              if (/glass|windows/i.test(mat.name) && this.architectureGlazing)
                this.architectureGlazing(mat);
              if (/emmis/i.test(mat.name)) {
                mat.userData.rayLamp = true;
                mat.emissiveIntensity = 0.1;
              }
              if (/grass/i.test(mat.name)) {
                mat.roughness = 1;
                mat.color.multiply(new T.Color(0xb8c6a0));
              }
            }
          });
          root.traverse((object) => {
            if (object.isInstancedMesh) {
              object.computeBoundingSphere();
              object.frustumCulled = true;
            }
          });
          this.scene.add(root);
          this.modelRoot = root;
          this.decorateArchitecture();
          this.flush();
          this.renderer.shadowMap.needsUpdate = true;
          this.lastMirror = 0;
          let instances = 0,
            instanceBatches = 0;
          this.scene.traverse((object) => {
            if (object.isInstancedMesh) {
              instances += object.count;
              instanceBatches++;
            }
          });
          this.canvas.dataset.instanceBatches = String(instanceBatches);
          this.canvas.dataset.instances = String(instances);
          this.canvas.dataset.building = "source-model";
          this.canvas.dataset.buildingSize = "207.2 × 87.7 m";
          document.getElementById("terrain-status").hidden = true;

          this.wake();
          resolve(root);
        },
        (event) => {
          const status = document.getElementById("terrain-status");
          status.hidden = false;
          status.textContent = event.total
            ? "Preparing the architecture · " +
              Math.min(100, Math.round((event.loaded / event.total) * 100)) +
              "%"
            : "Preparing the architecture…";
        },
        (error) => {
          const status = document.getElementById("terrain-status");
          status.hidden = false;
          status.textContent = "The architecture could not load. Refresh to try again.";
          this.canvas.dataset.building = "error";
          console.error("RAY architecture load failed", error);
          reject(error);
        },
      );
    });
    this.buildingReady.catch(() => {});
  };
  P.roomMaterial = function (mat) {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.rayRoomNight = this.skyUniforms.night;
      shader.vertexShader =
        "varying vec3 rayRoomWorld;varying vec3 rayRoomNormal;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nrayRoomWorld=(modelMatrix*vec4(transformed,1.)).xyz;rayRoomNormal=normalize(mat3(modelMatrix)*normal);",
      );
      shader.fragmentShader =
        "uniform float rayRoomNight;varying vec3 rayRoomWorld;varying vec3 rayRoomNormal;\n" +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
 vec3 face=abs(normalize(rayRoomNormal));float u=face.x>face.z?rayRoomWorld.z:rayRoomWorld.x;vec2 room=vec2(u/3.15,(rayRoomWorld.y-1.25)/3.465);vec2 cell=floor(room);float choice=fract(sin(dot(cell,vec2(41.73,93.27)))*43758.5453);vec3 eye=normalize(cameraPosition-rayRoomWorld);vec2 inside=fract(room+vec2((eye.x+eye.z)*.06,eye.y*.04));float curtains=smoothstep(.03,.15,inside.x)*(1.-smoothstep(.86,.98,inside.x));float ceiling=smoothstep(.72,.92,inside.y)*.4+.45;float furniture=1.-step(.25,inside.x)*step(inside.x,.78)*step(.18,inside.y)*step(inside.y,.31)*.6;float lit=step(.56,choice);vec3 warmth=mix(vec3(.95,.69,.37),vec3(.74,.82,.77),step(.86,choice));totalEmissiveRadiance+=warmth*lit*curtains*ceiling*furniture*(.018+rayRoomNight*1.3);
 `,
      );
    };
  };
  P.decorateArchitecture = function () {
    const d = window.RayBuildingLandscape || { plants: [], roofPlanters: [] };
    this.elevation = 0;
    for (const [x, z, y, palm, size] of d.plants) {
      this.shrub(x, z, size, y + 0.08);
      if (palm) this.palm(x, z, 3.5 + size * 2, y + 0.1);
    }
    const roof = 70.82;
    d.roofPlanters.forEach(([x, z, yaw], i) => {
      this.box("ivory", x, roof + 0.29, z, 2.7, 0.55, 1.1, yaw);
      this.box("grassdark", x, roof + 0.59, z, 2.46, 0.12, 0.88, yaw);
      this.shrub(x, z, 0.8, roof + 0.65);
      if (i % 8 === 0) this.palm(x, z, 2.5, roof + 0.65);
    });
    for (const cx of [-64, -32, 32, 64]) {
      this.slab("source-roof-teak-deck", cx, roof + 0.035, -9, 12.5, 11, 0.09, 0.25, "wood");
      for (const x of [cx - 5.5, cx + 5.5])
        for (const z of [-13.8, -4.2]) this.box("bronze", x, roof + 1.45, z, 0.12, 2.8, 0.12);
      for (let x = cx - 5.7; x <= cx + 5.7; x += 0.4)
        this.box("wood", x, roof + 2.9, -9, 0.1, 0.13, 10.3);
      for (const dx of [-3, 3]) {
        this.box("wood", cx + dx, roof + 0.2, 3.5, 1.3, 0.16, 2.6);
        this.box("white", cx + dx, roof + 0.34, 3.5, 1.18, 0.12, 2.45);
        this.box("bronze", cx + dx, roof + 0.1, 3.5, 1, 0.18, 2.1);
      }
    }
    this.slab("source-pool-water", 0, 21.49, 9.8, 25.4, 8.5, 0.025, 0.8, "pool");
    this.canvas.dataset.sourcePlanting = String(d.plants.length);
    this.canvas.dataset.roofPlanters = String(d.roofPlanters.length);
  };
  const originalUpdate = P.updateLight;
  P.updateLight = function (dt) {
    const moving = originalUpdate.call(this, dt);
    this.lightIsMoving = moving;
    if (this.modelMaterials)
      for (const mat of this.modelMaterials) {
        mat.envMapIntensity =
          (mat.userData.rayReflective ? 1.65 : 0.9) * (1 - this.lightState.night * 0.83);
        if (mat.userData.rayLamp) mat.emissiveIntensity = 0.035 + this.lightState.night * 1.3;
      }
    return moving;
  };
})();

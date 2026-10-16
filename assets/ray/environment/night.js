/* Night-only road guidance uses one merged ribbon; vessel lights share yacht batches. */
(() => {
  "use strict";
  const T = window.THREE,
    P = window.RayWorld.prototype;
  const createMaterials = P.createMaterials;
  P.createMaterials = function () {
    createMaterials.call(this);
    for (const [name, color] of [
      ["shipWarm", 0xffdeb0],
      ["shipPort", 0xef5347],
      ["shipStarboard", 0x62d8ad],
    ]) {
      const mat = new T.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0,
        roughness: 0.25,
      });
      mat.name = name;
      mat.userData.rayShipLight = true;
      this.materials[name] = mat;
    }
  };
  const build = window.RayCleanContext.prototype.build;
  window.RayCleanContext.prototype.build = function () {
    const result = build.call(this),
      w = this.w;
    const positions = [],
      uvs = [],
      importance = [];
    let majorSegments = 0,
      localSegments = 0;
    for (const road of this.d.roads) {
      if (!["Northeast 123rd Street", "Broad Causeway", "96th Street"].includes(road.n)) continue;
      const major = true;
      const width = major ? 4.6 : 1.5;
      let distance = 0;
      for (let i = 0; i < road.p.length - 1; i++) {
        const a = road.p[i],
          b = road.p[i + 1],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          length = Math.hypot(dx, dz);
        if (length < 0.2) {
          distance += length;
          continue;
        }
        const nx = -dz / length,
          nz = dx / length;
        for (const [end, side] of [
          [0, -1],
          [0, 1],
          [1, -1],
          [0, 1],
          [1, 1],
          [1, -1],
        ]) {
          const p = end ? b : a,
            x = p[0] + (nx * side * width) / 2,
            z = p[1] + (nz * side * width) / 2;
          const y = this.roadSurfaceHeight(x, z, road.y?.[i + end] || 1.255) + 0.045;
          positions.push(x, y, z);
          uvs.push(side, distance + end * length);
          importance.push(major ? 1 : 0);
        }
        major ? majorSegments++ : localSegments++;
        distance += length;
      }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("roadImportance", new T.Float32BufferAttribute(importance, 1));
    const material = new T.ShaderMaterial({
      name: "Night road guidance",
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      uniforms: { night: w.skyUniforms.night },
      vertexShader: `attribute float roadImportance;varying vec2 vRoad;varying float vMajor,vDistance;
        void main(){vRoad=uv;vMajor=roadImportance;vec4 p=modelMatrix*vec4(position,1.);
        vDistance=length(p.xz);gl_Position=projectionMatrix*viewMatrix*p;}`,
      fragmentShader: `precision highp float;uniform float night;varying vec2 vRoad;varying float vMajor,vDistance;
        void main(){float across=abs(vRoad.x);float aa=max(fwidth(vRoad.x),.015);
        float core=1.-smoothstep(.055,.10+aa,across);
        float halo=exp(-across*across*7.)*.24*(1.-smoothstep(.78,1.,across));
        float localDashes=mix(.28,1.,smoothstep(.1,.16,fract(vRoad.y/9.))*(1.-smoothstep(.66,.72,fract(vRoad.y/9.))));
        float strength=mix(.38*localDashes,1.,vMajor)*night*night;
        float fade=1.-smoothstep(1250.,1780.,vDistance);
        vec3 color=mix(vec3(1.,.72,.39),vec3(1.,.88,.51),vMajor);
        gl_FragColor=vec4(color*1.8,(core+halo)*strength*fade);}`,
    });
    material.extensions.derivatives = true;
    material.userData.rayNightPaths = true;
    w.nightRoads = new T.Mesh(geometry, material);
    w.nightRoads.name = "Night road guidance / highways and surrounding streets";
    w.nightRoads.renderOrder = 2;
    w.scene.add(w.nightRoads);
    w.canvas.dataset.nightRoads = JSON.stringify({ majorSegments, localSegments, drawCalls: 1 });
    return result;
  };
  const update = P.updateLight;
  P.updateLight = function (dt) {
    const moving = update.call(this, dt),
      night = this.lightState.night;
    for (const key of ["shipWarm", "shipPort", "shipStarboard"])
      this.materials[key].emissiveIntensity = night * 4;
    this.materials.boatglass.emissive.set(0xe8bc79);
    this.materials.boatglass.emissiveIntensity = 0.005 + night * 0.48;
    if (this.nightRoads) this.nightRoads.visible = night > 0.015;
    return moving;
  };
})();

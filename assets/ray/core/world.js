/* RAY exterior study with authored architecture and clean mapped surroundings. */
(() => {
  "use strict";
  const T = window.THREE;
  if (!T) return;
  class RayWorld {
    constructor(canvas, onCamera) {
      this.canvas = canvas;
      this.onCamera = onCamera;
      this.time = 0;
      this.paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.auto = false;
      this.frame = 0;
      this.last = 0;
      this.pointers = new Map();
      this.target = new T.Vector3(0, 33, window.RayBuildingLandscape.buildingShift || 0);
      this.desiredTarget = this.target.clone();
      this.orbit = { theta: 0.4, phi: 1.285, radius: 270 };
      this.desired = { ...this.orbit };
      this.sunColor = new T.Color();
      this.seed = 42;
      this.batches = new Map();
      this.boats = [];
      this.birds = [];
      this.waterUniforms = [];
      this.mood = "morning";
      this.quality = window.RayQuality();
      this.canvas.dataset.quality = this.quality.tier;
      this.renderer = new T.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      this.renderer.setPixelRatio(this.quality.pixelRatio);
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = T.PCFSoftShadowMap;
      this.renderer.shadowMap.autoUpdate = false;
      this.quality.hdr = this.renderer.capabilities.isWebGL2
        ? this.renderer.extensions.has("EXT_color_buffer_float")
        : this.renderer.extensions.has("EXT_color_buffer_half_float");
      this.scene = new T.Scene();
      this.scene.fog = new T.FogExp2(0xc4d6db, 0.00042);
      this.camera = new T.PerspectiveCamera(40, 1, 2, 11000);
      this.clockUniform = { value: 0 };
      this.boxGeometry = new T.BoxGeometry(1, 1, 1);
      this.materials = {};
      this.createMaterials();
      this.createSky();
      this.createLights();
      this.createWater();
      this.elevation = 0.4;
      this.createLand();
      this.createBuilding();
      this.createVegetation();
      this.elevation = 0;
      this.createMarina();
      this.createBirds();
      this.context = new RayCleanContext(this, window.RayMapData).build();
      this.flush();
      this.bind();
      this.resize();
      this.applyLighting("morning", true);
      this.renderer.shadowMap.needsUpdate = true;
      this.canvas.dataset.ready = "true";
      this.wake();
      const status = document.getElementById("terrain-status");
      if (status) status.hidden = true;
    }
    random() {
      this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
      return this.seed / 4294967296;
    }
    material(name, color, options = {}) {
      return (this.materials[name] = new T.MeshStandardMaterial({
        color,
        roughness: 0.75,
        ...options,
      }));
    }
    createMaterials() {
      this.material("ivory", 0xe6dfce, { roughness: 0.62 });
      this.material("slab", 0xeee9dc, { roughness: 0.56 });
      this.material("bronze", 0x76634d, { metalness: 0.45, roughness: 0.38 });
      this.material("frame", 0xb8c5c1, { metalness: 0.5, roughness: 0.27 });
      this.material("glass", 0x668998, {
        roughness: 0.19,
        metalness: 0.55,
        envMapIntensity: 1.2,
        emissive: 0xe5b26d,
        emissiveIntensity: 0,
      });
      this.material("litglass", 0x668998, {
        roughness: 0.19,
        metalness: 0.5,
        envMapIntensity: 1.2,
        emissive: 0xe5b26d,
        emissiveIntensity: 0,
      });
      this.material("lamp", 0xe6dac2, {
        roughness: 0.4,
        emissive: 0xffd399,
        emissiveIntensity: 0,
      });
      this.material("darkglass", 0x3e697a, {
        roughness: 0.23,
        metalness: 0.48,
        envMapIntensity: 1,
      });
      this.material("railing", 0x91b9c4, {
        roughness: 0.13,
        metalness: 0.15,
        transparent: true,
        opacity: 0.33,
        depthWrite: false,
      });
      this.material("paving", 0xcfc5ad, { roughness: 0.95 });
      this.material("walk", 0xe4d8bd, { roughness: 0.85 });
      this.material("soil", 0x67794f, { roughness: 1 });
      this.material("grass", 0x6b7c50, { roughness: 1 });
      this.material("grassdark", 0x536e4d, { roughness: 1 });
      this.material("road", 0x515e60, { roughness: 1 });
      this.material("marking", 0xc5c5b8, { roughness: 1 });
      this.material("wood", 0x9b7955, { roughness: 0.78 });
      this.material("roof", 0xb48066, { roughness: 0.9 });
      this.material("white", 0xe6e4d6, { roughness: 0.5 });
      this.material("hull", 0xecede5, { roughness: 0.35, metalness: 0.08 });
      this.material("boatglass", 0x214d63, {
        roughness: 0.14,
        metalness: 0.55,
      });
      this.material("trunk", 0x8c8065, { roughness: 1 });
      this.material("leaf", 0x426c48, { roughness: 0.95, side: T.DoubleSide });
      this.material("crown", 0x5e7850, { roughness: 1 });
      this.material("shadow", 0x2a382c, { roughness: 1 });
      this.material("pool", 0x2babb2, {
        roughness: 0.12,
        metalness: 0.2,
        emissive: 0x287b83,
        emissiveIntensity: 0.18,
      });
      // Shared teak texture adds deck detail without adding repeated geometry.
      const teakCanvas = document.createElement("canvas");
      teakCanvas.width = 256;
      teakCanvas.height = 256;
      const teak = teakCanvas.getContext("2d");
      teak.fillStyle = "#a58258";
      teak.fillRect(0, 0, 256, 256);
      for (let n = 0; n < 16; n++) {
        const y = n * 16;
        teak.fillStyle = n % 3 === 0 ? "#bd986b" : n % 3 === 1 ? "#af8c61" : "#a88459";
        teak.fillRect(0, y, 256, 15);
        teak.fillStyle = "#6a5740";
        teak.fillRect(0, y, 256, 1);
        teak.fillRect((n % 3) * 83, y, 1, 16);
      }
      const teakMap = new T.CanvasTexture(teakCanvas);
      teakMap.colorSpace = T.SRGBColorSpace;
      teakMap.wrapS = teakMap.wrapT = T.RepeatWrapping;
      teakMap.repeat.set(2, 2);
      this.materials.wood.map = teakMap;
      this.materials.wood.color.set(0xffffff);
      const terrainCanvas = document.createElement("canvas");
      terrainCanvas.width = terrainCanvas.height = 128;
      const terrainCtx = terrainCanvas.getContext("2d"),
        pixels = terrainCtx.createImageData(128, 128);
      for (let i = 0; i < 128 * 128; i++) {
        const shade = 224 + Math.floor(this.random() * 30);
        pixels.data[i * 4] = shade;
        pixels.data[i * 4 + 1] = shade;
        pixels.data[i * 4 + 2] = shade;
        pixels.data[i * 4 + 3] = 255;
      }
      terrainCtx.putImageData(pixels, 0, 0);
      const groundTexture = new T.CanvasTexture(terrainCanvas);
      groundTexture.wrapS = groundTexture.wrapT = T.RepeatWrapping;
      groundTexture.repeat.set(0.035, 0.035);
      this.materials.soil.map = groundTexture;
      this.materials.leaf.onBeforeCompile = (shader) => {
        shader.uniforms.rayWind = this.clockUniform;
        shader.vertexShader = "uniform float rayWind;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.z += sin(rayWind*.8+instanceMatrix[3].x*.13+instanceMatrix[3].z*.11)*pow(clamp(position.x/4.,0.,1.),2.)*.12;\ntransformed.y += sin(rayWind*.55+instanceMatrix[3].x*.2)*clamp(position.x/4.,0.,1.)*.04;\n#endif",
        );
      };
    }
    addBatch(
      key,
      geometry,
      material,
      x,
      y,
      z,
      sx = 1,
      sy = 1,
      sz = 1,
      ry = 0,
      color = null,
      rx = 0,
      rz = 0,
    ) {
      let batch = this.batches.get(key);
      if (!batch) {
        batch = { geometry, material, items: [] };
        this.batches.set(key, batch);
      }
      batch.items.push({
        x,
        y: y + (this.elevation || 0),
        z,
        sx,
        sy,
        sz,
        ry,
        rx,
        rz,
        color,
      });
    }
    box(mat, x, y, z, w, h, d, ry = 0, color = null) {
      this.addBatch(
        "box-" + mat,
        this.boxGeometry,
        this.materials[mat],
        x,
        y,
        z,
        w,
        h,
        d,
        ry,
        color,
      );
    }
    mesh(geometry, material, x = 0, y = 0, z = 0) {
      const m = new T.Mesh(geometry, material);
      m.position.set(x, y + (this.elevation || 0), z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
      return m;
    }
    rounded(w, d, h, r = 1.2) {
      const s = new T.Shape(),
        x = -w / 2,
        z = -d / 2;
      s.moveTo(x + r, z);
      s.lineTo(x + w - r, z);
      s.quadraticCurveTo(x + w, z, x + w, z + r);
      s.lineTo(x + w, z + d - r);
      s.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
      s.lineTo(x + r, z + d);
      s.quadraticCurveTo(x, z + d, x, z + d - r);
      s.lineTo(x, z + r);
      s.quadraticCurveTo(x, z, x + r, z);
      const g = new T.ExtrudeGeometry(s, {
        depth: h,
        bevelEnabled: false,
        curveSegments: 6,
      });
      g.rotateX(-Math.PI / 2);
      return g;
    }
    slab(key, x, y, z, w, d, h = 0.24, r = 1.5, mat = "slab") {
      this.addBatch(
        key,
        this.roundCache?.[key] || ((this.roundCache ??= {})[key] = this.rounded(w, d, h, r)),
        this.materials[mat],
        x,
        y,
        z,
      );
    }
    createSky() {
      const uniforms = {
        top: { value: new T.Color(0x629bb9) },
        horizon: { value: new T.Color(0xe2e7db) },
        sunDirection: { value: new T.Vector3(-0.6, 0.6, 0.4) },
        sunTint: { value: new T.Color(0xffe8bd) },
        rayTime: this.clockUniform,
        night: { value: 0 },
      };
      this.skyUniforms = uniforms;
      const material = new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        uniforms,
        vertexShader:
          "varying vec3 direction;void main(){direction=position/8000.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: `precision highp float;
varying vec3 direction;
uniform vec3 top;
uniform vec3 horizon;
uniform vec3 sunDirection;
uniform vec3 sunTint;
uniform highp float rayTime;
uniform float night;

 float hash(vec2 p){
return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);

}
float noise(vec2 p){
vec2 i=floor(p),f=fract(p);
f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);

}
float fbm(vec2 p){
return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.1)*.15;

}

 void main(){
vec3 dir=normalize(direction);
float h=max(dir.y,0.);
vec3 color=mix(horizon,top,pow(h,.46));
float sun=max(0.,dot(dir,normalize(sunDirection)));
color+=sunTint*(pow(sun,28.)*.24+pow(sun,420.)*.55)*(1.-night);
vec2 p=dir.xz/max(.16,dir.y+.13)*1.65+vec2(rayTime*.002,rayTime*.0004);
float cloud=smoothstep(.54,.76,fbm(p))*smoothstep(.01,.16,h)*(1.-smoothstep(.4,.95,h));
color=mix(color,mix(vec3(.98,.96,.89),vec3(.2,.25,.34),night),cloud*.6);
gl_FragColor=vec4(color,1.);

#include <tonemapping_fragment>
#include <colorspace_fragment>

}
`,
      });
      this.sky = this.mesh(new T.SphereGeometry(8000, 32, 16), material);
      this.sky.castShadow = false;
      this.sky.receiveShadow = false;
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d"),
        gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, "#739eb6");
      gradient.addColorStop(0.45, "#d6e0dd");
      gradient.addColorStop(0.55, "#b3c2b9");
      gradient.addColorStop(1, "#637565");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 512);
      const glow = ctx.createRadialGradient(230, 210, 0, 230, 210, 160);
      glow.addColorStop(0, "#fff5d8");
      glow.addColorStop(1, "#fff5d800");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1024, 512);
      const texture = new T.CanvasTexture(canvas);
      texture.mapping = T.EquirectangularReflectionMapping;
      texture.colorSpace = T.SRGBColorSpace;
      if (!this.quality.hdr) {
        texture.dispose();
        this.canvas.dataset.environmentFallback = "ambient";
        return;
      }
      // Keep one generator alive for the initial sky and later glass captures.
      this.pmremGenerator = new T.PMREMGenerator(this.renderer);
      this.environment = this.pmremGenerator.fromEquirectangular(texture);
      this.scene.environment = this.environment.texture;
      texture.dispose();
    }
    createLights() {
      this.hemi = new T.HemisphereLight(0xcbdfea, 0x9d9177, 0.75);
      this.scene.add(this.hemi);
      this.sun = new T.DirectionalLight(0xffedc7, 3.5);
      this.sun.position.set(-150, 190, 150);
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(this.quality.shadowSize, this.quality.shadowSize);
      Object.assign(this.sun.shadow.camera, {
        left: -240,
        right: 240,
        top: 240,
        bottom: -190,
        near: 1,
        far: 650,
      });
      this.sun.shadow.bias = -0.00018;
      this.sun.shadow.normalBias = 0.13;
      this.sun.shadow.radius = 2.5;
      this.sun.target.position.set(0, 15, 0);
      this.scene.add(this.sun, this.sun.target);
      this.fill = new T.DirectionalLight(0xa2c8da, 0.4);
      this.fill.position.set(140, 85, -100);
      this.scene.add(this.fill);
    }
    createWater() {
      window.RayCreateOcean(this);
    }
    createLand() {
      // Proposed footprint; the clean context uses mapped roads, coastlines and building footprints.
      this.slab("podium-base", 0, 0.7, 0, 143, 54, 0.5, 3, "paving");
      this.box("walk", 0, 0.85, 34, 172, 0.3, 10);
      this.box("paving", 0, -0.5, 32.8, 172, 2.7, 4);
      this.box("soil", 0, -0.65, -1, 172, 2.7, 63);
    }
    outline(points) {
      const shape = new T.Shape();
      points.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
      shape.closePath();
      return shape;
    }
    shapeGeometry(shape, h) {
      const g = new T.ExtrudeGeometry(shape, {
        depth: h,
        bevelEnabled: false,
        curveSegments: 18,
      });
      g.rotateX(-Math.PI / 2);
      return g;
    }
    wingShape(mirror = false, scale = 1) {
      const shape = new T.Shape(),
        cx = -37.5;
      const p = (x, z) => [(mirror ? -1 : 1) * (cx + (x - cx) * scale), -z * scale];
      const move = (x, z) => shape.moveTo(...p(x, z)),
        line = (x, z) => shape.lineTo(...p(x, z)),
        curve = (a, b, c, d, e, f) => shape.bezierCurveTo(...p(a, b), ...p(c, d), ...p(e, f));
      move(-66, -12);
      curve(-66, -15, -65, -16, -62, -16);
      line(-56, -16);
      line(-54.5, -13.1);
      line(-22, -13.1);
      line(-21, -16);
      line(-11.4, -16);
      curve(-9.4, -16, -8.7, -14.8, -8.7, -12.4);
      line(-8.7, 10.8);
      curve(-8.7, 13.2, -10.2, 14.1, -13.2, 14.6);
      curve(-28, 17.9, -48.5, 18, -62.9, 14.8);
      curve(-65.2, 14.3, -66.5, 13.2, -66.5, 10.8);
      line(-66, -12);
      shape.closePath();
      return shape;
    }
    perimeter(shape, pitch = 2.45) {
      const raw = shape.getPoints(24).map((p) => new T.Vector2(p.x, -p.y)),
        out = [];
      for (let i = 0; i < raw.length - 1; i++) {
        const a = raw[i],
          b = raw[i + 1],
          length = a.distanceTo(b);
        if (length < 0.03) continue;
        const count = Math.ceil(length / pitch);
        for (let j = 0; j < count; j++) {
          const p = a.clone().lerp(b, j / count),
            q = a.clone().lerp(b, (j + 1) / count);
          out.push({
            a: p,
            b: q,
            x: (p.x + q.x) / 2,
            z: (p.y + q.y) / 2,
            length: p.distanceTo(q),
            angle: -Math.atan2(q.y - p.y, q.x - p.x),
          });
        }
      }
      return out;
    }
    createBuilding() {
      // The curved, recessed wings and central lower connection follow the reference set.
      const base = 17.3,
        floors = 14,
        step = 3.25,
        top = base + floors * step;
      const podiumShape = new T.Shape();
      podiumShape.moveTo(-68, 21);
      podiumShape.lineTo(68, 21);
      podiumShape.quadraticCurveTo(70, 21, 70, 18);
      podiumShape.lineTo(70, -23);
      podiumShape.bezierCurveTo(70, -26, 62, -28, 53, -28.5);
      podiumShape.bezierCurveTo(22, -30, 18, -28.5, 9, -28.5);
      podiumShape.lineTo(-9, -28.5);
      podiumShape.bezierCurveTo(-18, -28.5, -22, -30, -53, -28.5);
      podiumShape.quadraticCurveTo(-70, -28, -70, -23);
      podiumShape.lineTo(-70, 18);
      podiumShape.quadraticCurveTo(-70, 21, -68, 21);
      podiumShape.closePath();
      const podFloors = [1.8, 5.2, 8.55, 11.9, 15.25, 17.3];
      const podEdges = this.perimeter(podiumShape, 3.15);
      const podBody = new T.Mesh(
        this.shapeGeometry(podiumShape, 15.1).scale(0.987, 1, 0.975),
        this.materials.darkglass,
      );
      podBody.position.y = 1.8 + (this.elevation || 0);
      this.scene.add(podBody);
      podBody.receiveShadow = true;
      podBody.castShadow = true;
      for (const y of podFloors)
        this.addBatch(
          "curved-podium-slabs",
          (this.podSlab ??= this.shapeGeometry(podiumShape, 0.21)),
          this.materials.slab,
          0,
          y,
          0,
        );
      for (const segment of podEdges) {
        const { x, z, length, angle } = segment;
        for (const floorY of podFloors)
          this.box("slab", x, floorY + 0.09, z, length + 0.06, 0.23, 0.24, angle);
        this.box("frame", x, 8.6, z, 0.09, 13.6, 0.12, angle);
        for (let f = 0; f < 4; f++) {
          const c = new T.Color().setHSL(0.55, 0.12, 0.55 + (f % 2) * 0.06);
          this.box(
            "glass",
            x * 0.99,
            3.5 + f * 3.35,
            z * 0.985,
            length - 0.1,
            2.92,
            0.045,
            angle,
            c,
          );
        }
        if (z > 20 && Math.round(x) % 3 === 0)
          this.box("ivory", x, 8.55, z + 0.3, 0.22, 13.4, 0.45, angle);
      }
      // An amenity pavilion spans the courtyard beneath the upper separation.
      this.box("darkglass", 0, 22, 1, 18, 9.2, 26);
      for (const y of [17.3, 20.55, 23.8, 27.05]) this.box("slab", 0, y, 1, 18, 0.2, 27.8);
      for (let x = -7.8; x < 9; x += 2.6)
        for (const z of [-12.5, 14.5]) this.box("frame", x, 22, z, 0.09, 9.4, 0.1);
      for (const mirror of [false, true]) {
        const sign = mirror ? -1 : 1,
          cx = sign * -37.5,
          shape = this.wingShape(mirror),
          inner = this.wingShape(mirror, 0.94),
          edges = this.perimeter(shape),
          inside = this.perimeter(inner);
        const body = new T.Mesh(
          this.shapeGeometry(this.wingShape(mirror, 0.91), floors * step),
          this.materials.darkglass,
        );
        body.position.y = base + (this.elevation || 0);
        body.receiveShadow = true;
        body.castShadow = true;
        this.scene.add(body);
        const slabGeo = this.shapeGeometry(shape, 0.2);
        for (let f = 0; f <= floors; f++) {
          const y = base + f * step;
          this.addBatch("bowed-wing-slabs-" + sign, slabGeo, this.materials.slab, 0, y, 0);
          if (f === floors) continue;
          for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            this.box(
              "railing",
              edge.x,
              y + 0.82,
              edge.z,
              edge.length + 0.015,
              1.02,
              0.045,
              edge.angle,
            );
            this.box("frame", edge.x, y + 1.36, edge.z, edge.length + 0.01, 0.04, 0.04, edge.angle);
          }
          for (let i = 0; i < inside.length; i++) {
            const edge = inside[i],
              lit = (i * 7 + f * 3) % 11 < 3,
              shade = 0.46 + ((i + f * 2) % 5) * 0.035;
            this.box(
              lit ? "litglass" : "glass",
              edge.x,
              y + 1.65,
              edge.z,
              edge.length - 0.09,
              2.91,
              0.035,
              edge.angle,
              new T.Color().setHSL(0.55, 0.1, shade),
            );
            this.box("frame", edge.a.x, y + 1.65, edge.a.y, 0.075, 3.04, 0.085, edge.angle);
            if ((i + f) % 6 === 0) {
              const inward = new T.Vector2(cx - edge.x, -edge.z).normalize();
              this.box(
                "ivory",
                edge.x + inward.x * 0.3,
                y + 1.64,
                edge.z + inward.y * 0.3,
                0.35,
                2.7,
                0.15,
                edge.angle,
                new T.Color(0xc2bbae),
              );
            }
          }
        }
        // Recessed service cores and open corridors on the landward elevation.
        for (const dx of [-24, 24]) {
          this.slab(
            "rounded-cores",
            cx + dx,
            base,
            -13.2,
            5.6,
            7.5,
            floors * step + 2.8,
            1.4,
            "ivory",
          );
          for (let f = 0; f < floors; f++)
            this.box("frame", cx + dx, base + f * step + 1.7, -17.05, 4.8, 0.11, 0.12);
        }
        // Four planted rooftop pavilions with smaller pergolas rather than oversized boxes.
        for (const dx of [-15, 14]) {
          this.slab("penthouse-garden", cx + dx, top + 0.22, 1, 20.5, 21, 0.18, 1, "paving");
          this.box("darkglass", cx + dx, top + 1.75, -1, 15.5, 2.9, 12);
          this.slab("penthouse-canopy", cx + dx, top + 3.28, -1, 16.2, 13, 0.18, 0.7);
          for (let a = -9; a <= 9; a += 0.8)
            this.box("wood", cx + dx + a, top + 3.5, 8, 0.11, 0.12, 6);
          for (const a of [-8.7, 8.7]) this.box("bronze", cx + dx + a, top + 2.1, 9, 0.1, 2.8, 0.1);
          for (const z of [-9.7, 12.8]) {
            this.box("ivory", cx + dx, top + 0.76, z, 20, 0.8, 1);
            this.box("grassdark", cx + dx, top + 1.24, z, 19.5, 0.25, 0.85);
          }
          for (const a of [-8, 0, 8]) this.palm(cx + dx + a, 12.8, 2.8, top + 1.3);
        }
        this.box("bronze", cx, top + 2.7, -3, 13, 4.5, 9);
        for (let y = top + 0.7; y < top + 5; y += 0.35)
          this.box("frame", cx, y, 1.6, 13.3, 0.08, 0.12);
      }
      // Pool and planted terrace on the setback above the podium.
      this.slab("terrace-pool-rim", 0, 17.54, 24, 20.5, 6.4, 0.22, 1.2, "ivory");
      this.slab("terrace-pool-water", 0, 17.79, 24, 19.3, 5.2, 0.035, 0.9, "pool");
      for (const x of [-59, -49, -39, -29, -19, 19, 29, 39, 49, 59]) {
        this.box("ivory", x, 17.85, 24.4, 4.3, 0.4, 1.5);
        this.box("wood", x, 18.15, 24.4, 3.9, 0.15, 1.25);
        this.box("white", x, 18.45, 24.9, 3.8, 0.45, 0.3);
        this.box("ivory", x, 17.8, 28.8, 5, 0.7, 1.1);
        this.box("grassdark", x, 18.27, 28.8, 4.7, 0.28, 0.9);
      }
      for (const x of [-62, -43, -24, 24, 43, 62]) this.palm(x, 28.2, 4.8, 17.7);
      for (const x of [-61, -46, -31, -16, 16, 31, 46, 61]) {
        this.box("white", x, 18.0, 22, 1.8, 0.16, 3);
        this.box("bronze", x, 17.8, 22, 0.14, 0.4, 2.7);
      }
      // Finer louver screens at the back of the parking podium preserve the reference's rhythm.
      for (let x = -66; x <= 66; x += 0.7) this.box("bronze", x, 8.5, -21.12, 0.12, 11, 0.21);
    }
    beam(mat, a, b, width = 0.18, depth = 0.18) {
      const delta = new T.Vector3().subVectors(b, a),
        length = delta.length(),
        middle = a.clone().add(b).multiplyScalar(0.5),
        mesh = new T.Mesh(
          new T.CylinderGeometry(width / 2, depth / 2, length, 6),
          this.materials[mat],
        );
      mesh.position.copy(middle);
      mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
      this.scene.add(mesh);
      return mesh;
    }
    dockRibbon(points, width, mat = "wood", height = 0.55, y = 0.7) {
      const positions = [],
        uvs = [],
        indices = [];
      for (let i = 0; i < points.length; i++) {
        const prev = points[Math.max(0, i - 1)],
          next = points[Math.min(points.length - 1, i + 1)],
          t = new T.Vector2(next[0] - prev[0], next[1] - prev[1]).normalize(),
          n = new T.Vector2(-t.y, t.x);
        for (const side of [-1, 1]) {
          positions.push(
            points[i][0] + ((n.x * width) / 2) * side,
            y,
            points[i][1] + ((n.y * width) / 2) * side,
          );
          uvs.push(i / 3, (side + 1) / 2);
        }
        if (i < points.length - 1) {
          const a = i * 2;
          indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const material = this.materials[mat].clone();
      material.side = T.DoubleSide;
      const mesh = this.mesh(geometry, material);
      mesh.castShadow = false;
      return mesh;
    }
    createMarina() {
      // Multi-view reconstruction: shore walk, three rectangular basins, outer spine and end yacht slips.
      const shore = 39.5,
        quay = window.RayBuildingLandscape?.marinaShore || [
          [-87, shore - 0.7],
          [-59, shore],
          [-30, shore + 0.6],
          [6, shore + 0.9],
          [41, shore + 0.7],
          [79, shore],
        ];
      const head = (x) => {
        for (let i = 1; i < quay.length; i++)
          if (x <= quay[i][0]) {
            const a = quay[i - 1],
              b = quay[i];
            return T.MathUtils.lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
          }
        return quay.at(-1)[1];
      };
      // The source model's curved white boundary is the inboard marina edge.
      const dock = (x, z, w, d) => {
        this.box("wood", x, 0.72, z, w, 0.4, d);
        if (d > w) {
          for (const side of [-1, 1])
            this.box("ivory", x + side * (w / 2 - 0.05), 0.97, z, 0.06, 0.06, d);
        } else {
          for (const side of [-1, 1])
            this.box("ivory", x, 0.97, z + side * (d / 2 - 0.05), w, 0.06, 0.06);
        }
      };
      dock(41.5, 58, 71, 2.25); // The outer parallel dock is separated from the promenade by water.
      for (const x of [-30, 6, 41, 77]) {
        const start = head(x) - 0.5,
          end = 59.05,
          length = end - start;
        this.addBatch(
          "dock-gangways",
          this.boxGeometry,
          this.materials.wood,
          x,
          1.055,
          (start + end) / 2,
          2.1,
          0.38,
          length,
          0,
          null,
          Math.atan(0.65 / length),
        );
      }
      dock(-30, 71, 2.5, 28);
      dock(77, 77, 2.5, 40);
      dock(-12, 48.5, 36, 1.6); // Short inner finger in the first basin.
      const link = window.RayBuildingLandscape?.marinaLink;
      if (link) this.createClubLink(link);

      for (const [x, z, width] of window.RayBuildingLandscape?.endFingers || [
        [89, 57.5, 24],
        [89, 95, 24],
      ])
        dock(x, z, width, 1.65);
      const moor = (x, z, scale, type = 1, rotation = 0) => {
        const boat = this.makeBoat(scale, type);
        boat.position.set(x, 0.13, z);
        boat.rotation.y = rotation;
        this.scene.add(boat);
      };
      for (const [x, scale, type] of [
        [-23, 1.12, 2],
        [-6, 0.82, 0],
        [2, 1.25, 2],
        [14, 1.1, 1],
        [23, 0.65, 0],
        [31, 0.93, 1],
        [36, 0.78, 0],
        [46, 0.6, 0],
        [59, 0.84, 1],
        [68, 0.98, 1],
      ])
        moor(x, (x < 6 ? 49.3 : 59.125) + scale * 6.2 + 1.65, scale, type);
      moor(84, 77, 2.0, 2);
      moor(86, 105, 0.78, 1);
      for (let x = -82; x < 81; x += 10) {
        this.box("bronze", x, 1.8, head(x) - 1.2, 0.1, 0.8, 0.1);
        this.box("lamp", x, 2.28, head(x) - 1.2, 0.16, 0.18, 0.16);
      }
      for (const x of [-30, 6, 41, 77])
        for (const z of [43, 56, 67]) {
          this.box("ivory", x, 0.8, z, 0.17, 1.2, 0.17);
          this.box("bronze", x, 1.44, z, 0.3, 0.08, 0.12);
        }
      for (const [scale, offset, radius] of [
        [0.85, 0, 88],
        [1.25, 2.4, 148],
      ]) {
        const moving = this.makeBoat(scale, 2);
        this.scene.add(moving);
        const wake = this.makeWake();
        this.scene.add(wake);
        this.boats.push({ group: moving, offset, radius, wake });
      }
      this.batchStaticBoats();
    }
    mergeBoat(group) {
      const parts = new Map();
      group.updateMatrixWorld(true);
      for (const mesh of group.children) {
        if (!mesh.isMesh) continue;
        let geo = mesh.geometry.clone();
        geo.applyMatrix4(mesh.matrixWorld);
        if (geo.index) geo = geo.toNonIndexed();
        if (!geo.attributes.normal) geo.computeVertexNormals();
        const key = mesh.material.uuid;
        let entry = parts.get(key);
        if (!entry) {
          entry = { material: mesh.material, geometries: [] };
          parts.set(key, entry);
        }
        entry.geometries.push(geo);
      }
      const result = new T.Group();
      result.name = "Detailed motor yacht";
      result.userData.yacht = true;
      for (const { material, geometries } of parts.values()) {
        let count = 0;
        for (const g of geometries) count += g.attributes.position.count;
        const positions = new Float32Array(count * 3),
          normals = new Float32Array(count * 3),
          uvs = new Float32Array(count * 2);
        let offset = 0;
        for (const geo of geometries) {
          positions.set(geo.attributes.position.array, offset * 3);
          normals.set(geo.attributes.normal.array, offset * 3);
          if (geo.attributes.uv) uvs.set(geo.attributes.uv.array, offset * 2);
          offset += geo.attributes.position.count;
          geo.dispose();
        }
        const geometry = new T.BufferGeometry();
        geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
        geometry.setAttribute("normal", new T.BufferAttribute(normals, 3));
        geometry.setAttribute("uv", new T.BufferAttribute(uvs, 2));
        const mesh = new T.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        result.add(mesh);
      }
      return result;
    }
    batchStaticBoats() {
      for (const group of [...this.scene.children]) {
        if (!group.userData.yacht || this.boats.some((b) => b.group === group)) continue;
        group.updateMatrixWorld(true);
        for (const mesh of group.children) {
          const pos = new T.Vector3(),
            q = new T.Quaternion(),
            scale = new T.Vector3(),
            rot = new T.Euler();
          mesh.matrixWorld.decompose(pos, q, scale);
          rot.setFromQuaternion(q);
          this.addBatch(
            "yacht-" + mesh.geometry.uuid,
            mesh.geometry,
            mesh.material,
            pos.x,
            pos.y,
            pos.z,
            scale.x,
            scale.y,
            scale.z,
            rot.y,
            null,
            rot.x,
            rot.z,
          );
        }
        this.scene.remove(group);
      }
    }
    makeWake() {
      const group = new T.Group();
      const material = new T.MeshBasicMaterial({
        color: 0xe6f4ed,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: T.DoubleSide,
      });
      for (const side of [-1, 1]) {
        const shape = new T.Shape();
        shape.moveTo(side * 0.8, 0);
        shape.lineTo(side * 4.5, 19);
        shape.lineTo(side * 3.3, 19);
        shape.lineTo(side * 0.65, 0);
        const geometry = new T.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        const mesh = new T.Mesh(geometry, material);
        group.add(mesh);
      }
      group.position.y = 0.04;
      return group;
    }
    makeBoat(scale = 1, type = 0) {
      this.yachtTemplates ??= {};
      if (this.yachtTemplates[type]) {
        const cached = this.yachtTemplates[type].clone();
        cached.scale.setScalar(scale);
        return cached;
      }
      // Curved hull sections, layered decks, swept glazing and repeated fine hardware share geometry.
      const group = new T.Group();
      group.name = "Detailed motor yacht";
      const positions = [],
        indices = [],
        sections = [
          [-6, 0.0, 0.35],
          [-5.4, 1.2, 0.6],
          [-4, 1.65, 0.66],
          [-1, 1.85, 0.72],
          [2, 1.75, 0.82],
          [4.6, 1.2, 1.05],
          [6.8, 0, 1.25],
        ];
      const sides = 12;
      for (const [z, width, deck] of sections)
        for (let j = 0; j <= sides; j++) {
          const angle = (Math.PI * j) / sides;
          positions.push(Math.cos(angle) * width, deck * 0.9 - Math.sin(angle) * 0.95, z);
        }
      for (let i = 0; i < sections.length - 1; i++)
        for (let j = 0; j < sides; j++) {
          const a = i * (sides + 1) + j,
            b = a + sides + 1;
          indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      const hullGeometry = new T.BufferGeometry();
      hullGeometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
      hullGeometry.setIndex(indices);
      hullGeometry.computeVertexNormals();
      const hull = new T.Mesh(hullGeometry, this.materials.hull);
      hull.castShadow = true;
      hull.material.side = T.DoubleSide;
      group.add(hull);
      const deckShape = new T.Shape();
      deckShape.moveTo(0, -6.9);
      deckShape.bezierCurveTo(1.5, -5.2, 1.86, -2, 1.85, 0.8);
      deckShape.lineTo(1.5, 5.2);
      deckShape.quadraticCurveTo(0, 5.9, -1.5, 5.2);
      deckShape.lineTo(-1.85, 0.8);
      deckShape.bezierCurveTo(-1.86, -2, -1.5, -5.2, 0, -6.9);
      deckShape.closePath();
      const deckGeo = this.shapeGeometry(deckShape, 0.12),
        deck = new T.Mesh(deckGeo, this.materials.wood);
      deck.position.y = 1.05;
      group.add(deck);
      const add = (geo, mat, x, y, z) => {
        const mesh = new T.Mesh(geo, this.materials[mat]);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        group.add(mesh);
        return mesh;
      };
      add(this.rounded(2.9, 5, 0.38, 0.45), "white", 0, 1.12, -0.9);
      const cabin = add(this.rounded(2.5, 3.9, 0.9, 0.45), "boatglass", 0, 1.55, -0.5);
      cabin.rotation.x = 0.04;
      add(this.rounded(3, 4.5, 0.14, 0.5), "white", 0, 2.48, -0.7);
      add(this.rounded(2.4, 2.8, 0.32, 0.4), "white", 0, 2.62, -1.3);
      if (type !== 0) {
        add(this.rounded(2.25, 2.7, 0.65, 0.35), "boatglass", 0, 2.92, -1.3);
        add(this.rounded(2.65, 3.1, 0.13, 0.45), "white", 0, 3.62, -1.3);
      }
      add(new T.BoxGeometry(2.2, 0.22, 1.8), "white", 0, 1.44, 3.8);
      add(new T.BoxGeometry(2.3, 0.15, 1), "white", 0, 1.4, -4.45);
      // Stainless guard rails are one tubular curve per side, with light vertical stanchions.
      const railMat = this.materials.frame;
      for (const side of [-1, 1]) {
        const points = [];
        for (const [z, width] of sections.slice(1, -1)) {
          points.push(new T.Vector3(side * (width * 0.93), 1.65, z));
        }
        const curve = new T.CatmullRomCurve3(points);
        const rail = new T.Mesh(new T.TubeGeometry(curve, 28, 0.025, 5, false), railMat);
        group.add(rail);
        for (const p of points) {
          const post = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.58, 5), railMat);
          post.position.set(p.x, 1.36, p.z);
          group.add(post);
        }
        for (let i = 0; i < 5; i++)
          add(new T.SphereGeometry(0.1, 8, 5), "boatglass", side * 1.78, 0.7, -3.7 + i * 1.6);
      }
      for (const x of [-0.6, 0.6]) {
        const mast = add(
          new T.CylinderGeometry(0.035, 0.035, 1.2, 6),
          "frame",
          x,
          type ? 4.25 : 3.26,
          -1.7,
        );
        mast.rotation.z = x * 0.25;
      }
      add(new T.SphereGeometry(0.25, 12, 8), "white", 0, type ? 3.95 : 2.95, -1.6);
      // Dark fenders, cleats and swim platform finish the shared yacht templates.
      for (const side of [-1, 1])
        for (const z of [-3.5, -1, 1.5]) {
          add(new T.CapsuleGeometry(0.1, 0.38, 3, 6), "boatglass", side * 1.86, 0.95, z);
          add(new T.BoxGeometry(0.08, 0.08, 0.3), "frame", side * 1.67, 1.25, z);
        }
      add(this.rounded(2.4, 1.15, 0.12, 0.23), "wood", 0, 0.62, -6.1);
      // Deck plank seams remain geometry-free, using a shared static material map.
      const merged = this.mergeBoat(group);
      this.yachtTemplates[type] = merged;
      const result = merged.clone();
      result.scale.setScalar(scale);
      return result;
    }
    frondGeometry() {
      const positions = [],
        normals = [],
        uv = [];
      for (let i = 0; i < 11; i++) {
        const t0 = i / 11,
          t1 = (i + 1) / 11;
        function p(t, side) {
          const width = Math.sin(t * Math.PI) * (0.43 - (t % 0.18) * 0.5);
          return [t * 4.8, Math.sin(t * Math.PI) * 0.55 - t * t * 1.15, side * width];
        }
        const a = p(t0, -1),
          b = p(t0, 1),
          c = p(t1, -1),
          d = p(t1, 1);
        positions.push(...a, ...b, ...c, ...b, ...d, ...c);
        for (let k = 0; k < 6; k++) {
          normals.push(0, 1, 0);
          uv.push(t0, k % 2);
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
      g.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
      g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      return g;
    }
    palm(x, z, height = 9, y = 1.1) {
      const trunk = (this.trunkGeo ??= new T.CylinderGeometry(0.14, 0.24, 1, 7));
      this.addBatch(
        "palm-trunks",
        trunk,
        this.materials.trunk,
        x,
        y + height / 2,
        z,
        1,
        height,
        1,
        0,
      );
      const geometry = (this.frond ??= this.frondGeometry());
      for (let i = 0; i < 9; i++) {
        const angle = (i * Math.PI * 2) / 9 + this.random() * 0.2,
          size = 0.8 + this.random() * 0.3;
        this.addBatch(
          "palm-fronds",
          geometry,
          this.materials.leaf,
          x,
          y + height,
          z,
          size,
          size,
          size,
          angle,
          new T.Color().setHSL(
            0.27 + this.random() * 0.035,
            0.22 + this.random() * 0.16,
            0.22 + this.random() * 0.09,
          ),
          this.random() * 0.13,
          0,
        );
      }
    }
    tree(x, z, size = 4, y = 1) {
      const trunk = (this.treeTrunk ??= new T.CylinderGeometry(0.2, 0.36, 1, 6));
      this.addBatch(
        "tree-trunks",
        trunk,
        this.materials.trunk,
        x,
        y + size * 0.6,
        z,
        1,
        size * 1.2,
        1,
      );
      const geo = (this.crownGeo ??= new T.SphereGeometry(1, 8, 6));
      for (let i = 0; i < 6; i++) {
        const a = i * 2.4;
        this.addBatch(
          "tree-crowns",
          geo,
          this.materials.crown,
          x + Math.cos(a) * size * 0.4,
          y + size * (1.1 + this.random() * 0.4),
          z + Math.sin(a) * size * 0.4,
          size * 0.65,
          size * 0.7,
          size * 0.65,
          a,
          new T.Color().setHSL(
            0.25 + this.random() * 0.05,
            0.16 + this.random() * 0.14,
            0.25 + this.random() * 0.09,
          ),
        );
      }
    }
    createVegetation() {
      for (let x = -72; x <= 72; x += 12) this.palm(x, 31.8, 6.5);
      for (const x of [-72, 72]) for (let z = -17; z < 22; z += 13) this.palm(x, z, 5.5);
    }
    createBirds() {
      const material = new T.MeshStandardMaterial({
        color: 0x65747c,
        roughness: 1,
        side: T.DoubleSide,
      });
      const wingGeometry = new T.BufferGeometry();
      wingGeometry.setAttribute(
        "position",
        new T.Float32BufferAttribute([0, 0, 0, 1.4, 0.15, -0.3, 0.4, 0, 0.35], 3),
      );
      wingGeometry.computeVertexNormals();
      for (let i = 0; i < 7; i++) {
        const g = new T.Group(),
          left = new T.Mesh(wingGeometry, material),
          right = new T.Mesh(wingGeometry, material);
        right.scale.x = -1;
        g.add(left, right);
        this.scene.add(g);
        this.birds.push({ g, left, right, offset: i * 0.6 });
      }
    }
    flush() {
      const matrix = new T.Matrix4(),
        position = new T.Vector3(),
        scale = new T.Vector3(),
        quaternion = new T.Quaternion(),
        rotation = new T.Euler();
      for (const [key, b] of this.batches) {
        const mesh = new T.InstancedMesh(b.geometry, b.material, b.items.length);
        b.items.forEach((item, i) => {
          position.set(item.x, item.y, item.z);
          scale.set(item.sx, item.sy, item.sz);
          rotation.set(item.rx, item.ry, item.rz);
          quaternion.setFromEuler(rotation);
          matrix.compose(position, quaternion, scale);
          mesh.setMatrixAt(i, matrix);
          if (item.color) mesh.setColorAt(i, item.color);
        });
        mesh.castShadow = !["glass", "litglass", "darkglass", "railing", "pool"].some(
          (name) => b.material === this.materials[name],
        );
        mesh.receiveShadow = b.material !== this.materials.railing;
        mesh.computeBoundingSphere();
        mesh.frustumCulled = true;
        if (b.material === this.materials.railing) mesh.renderOrder = 2;
        this.scene.add(mesh);
      }
      this.batches.clear();
    }
    applyLighting(mood, immediate = false) {
      this.mood = mood;
      const presets = {
        morning: {
          pos: [-190, 130, 65],
          color: 0xffecd1,
          sky: 0x629fc3,
          horizon: 0xc5dbe5,
          intensity: 2.6,
          ambient: 0.66,
          exposure: 0.96,
          water: 1,
          night: 0,
        },
        afternoon: {
          pos: [80, 160, 90],
          color: 0xfff5e1,
          sky: 0x5d98be,
          horizon: 0xc7dce6,
          intensity: 2.8,
          ambient: 0.64,
          exposure: 0.98,
          water: 1.03,
          night: 0,
        },
        evening: {
          pos: [-145, 37, 75],
          color: 0xffc082,
          sky: 0x8498b7,
          horizon: 0xe6c6ab,
          intensity: 2.8,
          ambient: 0.5,
          exposure: 1.01,
          water: 0.82,
          night: 0.12,
        },
        night: {
          pos: [-110, 145, 120],
          color: 0xa8c9ee,
          sky: 0x142c49,
          horizon: 0x62758a,
          intensity: 0.42,
          ambient: 0.26,
          exposure: 1.02,
          water: 0.36,
          night: 1,
        },
      };
      this.lightDesired = presets[mood];
      if (immediate) this.lightState = JSON.parse(JSON.stringify(this.lightDesired));
      this.renderer.shadowMap.needsUpdate = true;
      this.wake();
    }
    updateLight(dt) {
      const d = this.lightDesired,
        s = this.lightState,
        k = Math.min(1, dt * 3);
      let moving = false;
      for (const key of ["intensity", "ambient", "exposure", "water", "night"]) {
        s[key] += (d[key] - s[key]) * k;
        if (Math.abs(d[key] - s[key]) > 0.001) moving = true;
      }
      for (let i = 0; i < 3; i++) {
        s.pos[i] += (d.pos[i] - s.pos[i]) * k;
        if (Math.abs(d.pos[i] - s.pos[i]) > 0.02) moving = true;
      }
      this.sun.position.fromArray(s.pos);
      this.sun.color.lerp(new T.Color(d.color), k);
      this.sun.intensity = s.intensity;
      this.hemi.intensity = s.ambient;
      this.fill.intensity = s.ambient * 0.5;
      this.renderer.toneMappingExposure = s.exposure;
      this.skyUniforms.top.value.lerp(new T.Color(d.sky), k);
      this.skyUniforms.horizon.value.lerp(new T.Color(d.horizon), k);
      this.scene.fog.color.copy(this.skyUniforms.horizon.value);
      this.skyUniforms.sunDirection.value.copy(this.sun.position).normalize();
      this.skyUniforms.sunTint.value.copy(this.sun.color);
      this.skyUniforms.night.value = s.night;
      for (const [name, material] of Object.entries(this.materials))
        material.envMapIntensity =
          (name === "glass" || name === "litglass" ? 1.2 : 1) * (1 - s.night * 0.86);
      this.materials.litglass.emissiveIntensity = s.night * 0.9;
      this.materials.lamp.emissiveIntensity = s.night * 2;
      this.materials.pool.emissiveIntensity = 0.1 + s.night * 0.5;
      for (const u of this.waterUniforms) {
        u.sunDirection.value.copy(this.sun.position).normalize();
        u.light.value.copy(this.sun.color);
        u.exposure.value = s.water;
        if (u.horizon) u.horizon.value.copy(this.skyUniforms.horizon.value);
      }
      if (moving && (!this.lastShadow || this.time - this.lastShadow > 0.15)) {
        this.renderer.shadowMap.needsUpdate = true;
        this.lastShadow = this.time;
      }
      return moving;
    }
    preset(which) {
      const p = {
        exterior: { theta: 0.4, phi: 1.285, radius: 270 },
        marina: { theta: 0.36, phi: 1.12, radius: 280 },
        rooftop: { theta: 0.5, phi: 0.63, radius: 230 },
        surroundings: { theta: 2.65, phi: 0.97, radius: 330 },
        masterplan: { theta: 0.2, phi: 0.3, radius: 440 },
      }[which];
      if (!p) return;
      this.auto = false;
      let angle = p.theta;
      while (angle - this.orbit.theta > Math.PI) angle -= Math.PI * 2;
      while (angle - this.orbit.theta < -Math.PI) angle += Math.PI * 2;
      this.desired = { ...p, theta: angle, radius: p.radius * this.fitFactor };
      this.desiredTarget.set(
        0,
        which === "marina" ? 26 : 33,
        (window.RayBuildingLandscape.buildingShift || 0) + (which === "marina" ? 22 : 0),
      );
      this.wake();
    }
    zoom(delta) {
      this.desired.radius = T.MathUtils.clamp(
        this.desired.radius + delta * this.fitFactor,
        95 * this.fitFactor,
        440 * this.fitFactor,
      );
      this.wake();
    }
    rotate(delta) {
      this.auto = false;
      this.desired.theta += delta;
      this.wake();
    }
    setAuto(value) {
      this.auto = value;
      this.wake();
    }
    setPaused(value) {
      this.paused = value;
      this.wake();
    }
    bind() {
      const canvas = this.canvas;
      canvas.addEventListener("contextmenu", (e) => e.preventDefault());
      canvas.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 && e.button !== 2) return;
        canvas.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        this.auto = false;
        canvas.classList.add("dragging");
        this.dragged = true;
      });
      canvas.addEventListener("pointermove", (e) => {
        const old = this.pointers.get(e.pointerId);
        if (!old) return;
        const before = [...this.pointers.values()];
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pointers.size === 2) {
          const after = [...this.pointers.values()],
            d0 = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y),
            d1 = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
          if (d0 > 0 && d1 > 0)
            this.desired.radius = T.MathUtils.clamp(
              (this.desired.radius * d0) / d1,
              95 * this.fitFactor,
              440 * this.fitFactor,
            );
        } else {
          this.desired.theta -= (e.clientX - old.x) * 0.006;
          this.desired.phi = T.MathUtils.clamp(
            this.desired.phi + (e.clientY - old.y) * 0.004,
            0.22,
            1.48,
          );
        }
        this.wake();
      });
      const end = (e) => {
        this.pointers.delete(e.pointerId);
        if (!this.pointers.size) canvas.classList.remove("dragging");
      };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
      canvas.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          this.zoom(e.deltaY * 0.11);
        },
        { passive: false },
      );
      window.addEventListener("resize", () => this.resize());
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          cancelAnimationFrame(this.frame);
          this.frame = 0;
          this.last = 0;
        } else this.wake();
      });
      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        cancelAnimationFrame(this.frame);
        this.frame = 0;
        document.getElementById("load-state").hidden = false;
        document.getElementById("load-state").textContent =
          "The 3D session paused. Refresh to reload the scene.";
      });
    }
    resize() {
      const w = this.canvas.clientWidth,
        h = this.canvas.clientHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.fov = w < 700 ? 51 : 40;
      this.camera.updateProjectionMatrix();
      const fit = w < 700 ? Math.max(1, 0.86 / (w / h)) : 1,
        previous = this.fitFactor || 1;
      this.orbit.radius *= fit / previous;
      this.desired.radius *= fit / previous;
      this.fitFactor = fit;
      this.wake();
    }
    wake() {
      if (!this.frame && !document.hidden)
        this.frame = requestAnimationFrame((t) => this.render(t));
    }
    render(now) {
      this.frameStarted = performance.now();
      this.frame = 0;
      if (document.hidden) return;
      if (this.last) {
        this.frameMs = (this.frameMs || 33) * 0.9 + (now - this.last) * 0.1;
        this.canvas.dataset.frameMs = this.frameMs.toFixed(1);
      }
      const dt = this.last ? Math.min(0.08, (now - this.last) / 1000) : 0.033;
      this.last = now;
      if (!this.paused) this.time += dt;
      this.clockUniform.value = this.time;
      const lightingMoves = this.updateLight(dt);
      if (this.context) this.context.update(this.time);
      if (this.auto) this.desired.theta += dt * 0.09;
      let cameraMoves = this.target.distanceToSquared(this.desiredTarget) > 0.00001;
      this.target.lerp(this.desiredTarget, Math.min(1, dt * 6));
      for (const key of ["theta", "phi", "radius"]) {
        const difference = this.desired[key] - this.orbit[key];
        this.orbit[key] += difference * Math.min(1, dt * 8);
        if (Math.abs(difference) > 0.0001) cameraMoves = true;
      }
      const { theta, phi, radius } = this.orbit;
      this.camera.position.set(
        this.target.x + radius * Math.sin(phi) * Math.sin(theta),
        this.target.y + radius * Math.cos(phi),
        this.target.z + radius * Math.sin(phi) * Math.cos(theta),
      );
      this.camera.lookAt(this.target);
      this.sky.position.copy(this.camera.position);
      this.boats.forEach(({ group, offset, radius: r, wake }) => {
        const a = this.time * 0.015 + offset;
        group.position.set(
          -95 + Math.sin(a) * r,
          0.14 + Math.sin(this.time * 0.6 + offset) * 0.06,
          (r < 100 ? 215 : 335) + Math.cos(a) * (r < 100 ? 45 : 38),
        );
        group.rotation.y = Math.atan2(r * Math.cos(a), -(r < 100 ? 45 : 38) * Math.sin(a));
        group.rotation.z = Math.sin(this.time * 0.6 + offset) * 0.009;
        if (wake) {
          wake.position.set(group.position.x, 0.02, group.position.z);
          wake.rotation.y = group.rotation.y;
          wake.scale.setScalar(group.scale.x);
        }
      });
      this.birds.forEach(({ g, left, right, offset }) => {
        const t = this.time * 0.055 + offset;
        g.position.set(Math.sin(t) * 150, 91 + Math.sin(t * 2) * 8, Math.cos(t) * 140);
        g.rotation.y = t + Math.PI / 2;
        left.rotation.z = Math.sin(this.time * 3.7 + offset) * 0.3;
        right.rotation.z = -left.rotation.z;
      });
      if (!this.lastMirror || cameraMoves || lightingMoves || now - this.lastMirror > 120) {
        const mirror = this.mirrorCamera;
        mirror.copy(this.camera);
        mirror.position.y = -this.camera.position.y - 0.24;
        mirror.up.set(0, -1, 0);
        mirror.lookAt(this.target.x, -this.target.y - 0.24, this.target.z);
        mirror.updateMatrixWorld();
        mirror.matrixWorldInverse.copy(mirror.matrixWorld).invert();
        this.textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
        this.textureMatrix.multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
        this.resizeReflection();
        this.water.visible = false;
        this.sky.position.copy(mirror.position);
        this.renderer.setRenderTarget(this.mirrorTarget);
        this.renderer.render(this.scene, mirror);
        this.renderer.setRenderTarget(null);
        this.water.visible = true;
        this.sky.position.copy(this.camera.position);
        this.lastMirror = now;
      }
      this.renderPresentation();
      this.renderCostMs = performance.now() - this.frameStarted;
      window.RayAdaptQuality.call(this, now);
      const degrees = ((((theta * 180) / Math.PI) % 360) + 360) % 360;
      this.canvas.dataset.angle = degrees.toFixed(1);
      this.canvas.dataset.camera = [
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z,
      ]
        .map((x) => x.toFixed(2))
        .join(",");
      this.canvas.dataset.drawCalls = this.sceneCalls;
      this.canvas.dataset.triangles = this.sceneTriangles;
      this.canvas.dataset.mood = this.mood;
      this.canvas.dataset.renderCostMs = this.renderCostMs.toFixed(1);
      this.canvas.dataset.boats = this.boats
        .map((b) => [b.group.position.x.toFixed(2), b.group.position.z.toFixed(2)].join(","))
        .join(";");
      if (this.onCamera)
        this.onCamera({
          angle: degrees,
          radius: radius / this.fitFactor,
          auto: this.auto,
        });
      if (!this.paused || cameraMoves || lightingMoves || this.auto) this.wake();
    }
  }
  window.RayWorld = RayWorld;
})();

/* Kazeyami LIVE / Blue Hour. Original stage study. Three.js r158-compatible. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const smallScreen = matchMedia("(max-width: 700px)").matches;
  let reduced = reducedQuery.matches,
    active = true,
    raf = 0,
    lastFrame = 0;
  let renderer, scene, camera, water, sun, fill, venue, sky, config, environment;
  let state = {
    night: 0,
    targetNight: 0,
    cue: "opening",
    running: false,
    start: 0,
    group: "all",
    motion: !reduced,
    elapsed: 0,
  };
  const worldObjects = [],
    fixtures = [],
    stageLights = [],
    batches = new Map(),
    fireworks = [];
  const vec = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  let seed = 1979;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const stagePosition = [50, 0, 330],
    stageYaw = -0.961592653589793;
  const ledUniforms = {
    time: { value: 0 },
    strength: { value: 0.8 },
    colour: { value: null },
    night: { value: 1 },
  };
  let orbit = {
    target: null,
    desired: null,
    theta: 0.29,
    phi: 1.34,
    radius: 84,
    dTheta: 0.29,
    dPhi: 1.34,
    dRadius: 84,
  };
  const views = {
    audience: { target: [0, 7, 8], theta: 0.25, phi: 1.36, radius: 112 },
    stage: { target: [0, 8, -2], theta: -0.55, phi: 1.39, radius: 37 },
    aerial: { target: [0, 0, 33], theta: 0.67, phi: 0.54, radius: 198 },
    bay: {
      world: true,
      target: [-120, 18, -530],
      theta: 0.6,
      phi: 1.35,
      radius: 850,
    },
  };
  const cueData = {
    opening: {
      colour: "#5c7fff",
      intensity: 75,
      spread: 0.38,
      speed: 0.22,
      label: "Opening look",
    },
    performance: {
      colour: "#a077ff",
      intensity: 90,
      spread: 0.8,
      speed: 0.55,
      label: "Performance look",
    },
    finale: {
      colour: "#e0eaff",
      intensity: 100,
      spread: 1.15,
      speed: 0.35,
      label: "Finale look",
    },
  };
  function fail(message) {
    active = false;
    cancelAnimationFrame(raf);
    $("loading").hidden = true;
    $("fallback").hidden = false;
    if (message) $("fallback").querySelector("p").textContent = message;
    document.body.dataset.experienceState = "error";
  }
  function material(colour, options = {}) {
    return new THREE.MeshStandardMaterial({
      color: colour,
      roughness: 0.75,
      metalness: 0.1,
      ...options,
    });
  }
  function queue(
    geometry,
    mat,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    parent = venue,
  ) {
    const transform = new THREE.Matrix4().compose(
      vec(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      vec(...scale),
    );
    const g = geometry.clone().applyMatrix4(transform);
    const key = mat.uuid + parent.uuid;
    if (!batches.has(key)) batches.set(key, { geometries: [], mat, parent });
    batches.get(key).geometries.push(g);
  }
  const unitBox = () => new THREE.BoxGeometry(1, 1, 1);
  let boxGeo, cylGeo, sphereGeo;
  function box(x, y, z, w, h, d, mat, parent = venue, rotation = [0, 0, 0]) {
    queue(boxGeo, mat, [x, y, z], rotation, [w, h, d], parent);
  }
  function cylinder(x, y, z, r, h, mat, parent = venue) {
    queue(cylGeo, mat, [x, y, z], [0, 0, 0], [r, h, r], parent);
  }
  function bar(a, b, r, mat, parent = venue) {
    const av = vec(...a),
      bv = vec(...b),
      delta = bv.clone().sub(av);
    const g = new THREE.CylinderGeometry(r, r, delta.length(), 5, 1);
    g.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        vec(0, 1, 0),
        delta.normalize(),
      ),
    );
    g.translate(...av.add(bv).multiplyScalar(0.5).toArray());
    queue(g, mat, [0, 0, 0], [0, 0, 0], [1, 1, 1], parent);
    g.dispose();
  }
  function flush() {
    for (const { geometries, mat, parent } of batches.values()) {
      const arrays = { position: [], normal: [], uv: [] };
      for (let geo of geometries) {
        if (geo.index) {
          const old = geo;
          geo = geo.toNonIndexed();
          old.dispose();
        }
        for (const name of Object.keys(arrays)) {
          const attr = geo.attributes[name];
          if (attr) arrays[name].push(attr.array);
          else
            arrays[name].push(
              new Float32Array(
                geo.attributes.position.count * (name === "uv" ? 2 : 3),
              ),
            );
        }
        geo.dispose();
      }
      const geo = new THREE.BufferGeometry();
      for (const [name, chunks] of Object.entries(arrays)) {
        const array = new Float32Array(
          chunks.reduce((n, a) => n + a.length, 0),
        );
        let offset = 0;
        for (const chunk of chunks) {
          array.set(chunk, offset);
          offset += chunk.length;
        }
        geo.setAttribute(
          name,
          new THREE.BufferAttribute(array, name === "uv" ? 2 : 3),
        );
      }
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = mat.userData.castShadow !== false;
      mesh.receiveShadow = true;
      parent.add(mesh);
    }
    batches.clear();
  }
  function planShape(points, height, mat, parent = scene) {
    if (points.length < 3) return;
    const shape = new THREE.Shape(
      points.map((p) => new THREE.Vector2(p[0], -p[1])),
    );
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 1,
    });
    geo.rotateX(-Math.PI / 2);
    queue(geo, mat, [0, 0, 0], [0, 0, 0], [1, 1, 1], parent);
    geo.dispose();
  }
  function makeTexture(draw, w = 512, h = 512) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  function label(text, width = 512, height = 128, colour = "#dce7ff") {
    const tex = makeTexture(
      (ctx, w, h) => {
        ctx.fillStyle = "#080d1b";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = colour;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "500 " + Math.floor(h * 0.4) + "px Arial";
        ctx.fillText(text, w / 2, h / 2);
      },
      width,
      height,
    );
    return new THREE.MeshBasicMaterial({ map: tex });
  }
  function panel(x, y, z, w, h, mat, parent = venue) {
    const g = new THREE.PlaneGeometry(w, h);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  let mats = {};
  function buildMaterials() {
    const groundTex = makeTexture(
      (c, w, h) => {
        c.fillStyle = "#a8b393";
        c.fillRect(0, 0, w, h);
        for (let i = 0; i < 16000; i++) {
          c.fillStyle = rand() > 0.5 ? "#a1ad8b" : "#b0b99d";
          c.fillRect(rand() * w, rand() * h, 1 + rand() * 3, 1);
        }
      },
      256,
      256,
    );
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(40, 40);
    const roadTex = makeTexture(
      (c, w, h) => {
        c.fillStyle = "#525864";
        c.fillRect(0, 0, w, h);
        for (let i = 0; i < 8000; i++) {
          c.fillStyle = rand() > 0.5 ? "#626775" : "#464b57";
          c.fillRect(rand() * w, rand() * h, 1, 1);
        }
      },
      128,
      128,
    );
    mats = {
      black: material("#202735", { roughness: 0.65, metalness: 0.25 }),
      deck: material("#252b35", { roughness: 0.85 }),
      steel: material("#a1a9bd", { metalness: 0.45, roughness: 0.32 }),
      darkSteel: material("#475168", { metalness: 0.4, roughness: 0.42 }),
      petal: material("#526389", {
        metalness: 0.2,
        roughness: 0.48,
        side: THREE.DoubleSide,
      }),
      edge: new THREE.MeshBasicMaterial({ color: "#657ff2" }),
      white: material("#d6d8d5", { roughness: 0.8 }),
      grass: material("#7c8b65", { map: groundTex, roughness: 1 }),
      land: material("#9ca38e", { roughness: 1 }),
      road: material("#717783", { map: roadTex, roughness: 1 }),
      path: material("#b4b4aa", { roughness: 1 }),
      foliage: material("#395346", { roughness: 1 }),
      bark: material("#554b43", { roughness: 1 }),
      water: material("#28445a", { metalness: 0.65, roughness: 0.3 }),
      glass: material("#809aac", { metalness: 0.65, roughness: 0.25 }),
      red: material("#743046"),
      audience: material("#273147", { roughness: 1 }),
      glow: new THREE.MeshBasicMaterial({ color: "#d8e7ff" }),
    };
    ledUniforms.colour.value = new THREE.Color(cueData.opening.colour);
  }
  function truss(a, b, width = 0.55, parent = venue) {
    const av = vec(...a),
      bv = vec(...b),
      direction = bv.clone().sub(av).normalize(),
      axis = Math.abs(direction.y) > 0.8 ? vec(1, 0, 0) : vec(0, 1, 0);
    const u = new THREE.Vector3()
        .crossVectors(direction, axis)
        .normalize()
        .multiplyScalar(width / 2),
      v = new THREE.Vector3()
        .crossVectors(direction, u)
        .normalize()
        .multiplyScalar(width / 2);
    const corners = [
      u.clone().add(v),
      u.clone().sub(v),
      u.clone().negate().sub(v),
      v.clone().sub(u),
    ];
    for (const c of corners)
      bar(
        av.clone().add(c).toArray(),
        bv.clone().add(c).toArray(),
        0.045,
        mats.steel,
        parent,
      );
    const length = av.distanceTo(bv),
      segments = Math.ceil(length / 1.7);
    for (let j = 0; j < segments; j++)
      for (let k = 0; k < 4; k++) {
        const p = av
          .clone()
          .lerp(bv, j / segments)
          .add(corners[k]);
        const q = av
          .clone()
          .lerp(bv, (j + 1) / segments)
          .add(corners[(k + 1) % 4]);
        bar(p.toArray(), q.toArray(), 0.027, mats.steel, parent);
      }
  }
  function petal(side, index) {
    const positions = [],
      uvs = [],
      indices = [],
      N = 24,
      M = 8;
    function point(t, s) {
      const x =
        side *
        (5 +
          index * 4 +
          Math.sin(t * Math.PI * 0.85) * 7 +
          s * (2.4 + 2 * Math.sin(t * Math.PI)));
      const y =
        3 + Math.sin(t * Math.PI * 0.65) * (18 + index * 2) + s * s * 0.8;
      const z =
        -7 - index * 0.3 + t * (6 + index * 1.4) + s * (index - 1) * 1.1;
      return [x, y, z];
    }
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= M; j++) {
        const t = i / N,
          s = (j / M - 0.5) * 2;
        positions.push(...point(t, s));
        uvs.push(j / M, t);
      }
    for (let i = 0; i < N; i++)
      for (let j = 0; j < M; j++) {
        const a = i * (M + 1) + j,
          b = a + M + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    queue(geo, mats.petal);
    geo.dispose();
    for (const s of [-1, 1])
      for (let i = 0; i < N; i++) {
        bar(point(i / N, s), point((i + 1) / N, s), 0.065, mats.edge);
      }
    for (let j = 0; j < 5; j++)
      for (let i = 0; i < N; i++) {
        const s = -0.8 + j * 0.4;
        bar(point(i / N, s), point((i + 1) / N, s), 0.022, mats.darkSteel);
      }
  }
  function buildStage() {
    venue = new THREE.Group();
    venue.position.set(...stagePosition);
    venue.rotation.y = stageYaw;
    scene.add(venue);
    box(0, 1.6, 0, 57, 2.1, 23, mats.black);
    box(0, 2.73, 0, 57, 0.18, 23, mats.deck);
    box(0, 3.3, -5, 12, 1.1, 8, mats.black);
    box(0, 3.89, -5, 12, 0.12, 8, mats.deck);
    box(0, 1.9, 17, 5, 2.65, 13, mats.black);
    box(0, 3.27, 17, 5, 0.12, 13, mats.deck);
    cylinder(0, 1.9, 24, 4.5, 2.7, mats.black);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++)
        box(side * 25, 0.65 + i * 0.31, 14 - i * 0.9, 4, 0.3, 0.9, mats.deck);
      truss([side * 28, 3, -9], [side * 28, 24, -9]);
      truss([side * 28, 24, -9], [side * 20, 26, -7]);
      truss([side * 27, 3, 8], [side * 27, 23, 8]);
      truss([side * 27, 23, 8], [side * 27, 24, -9]);
      for (let i = 0; i < 9; i++)
        box(side * 24.8, 19 - i * 0.71, 7, 1.3, 0.63, 1.05, mats.black, venue, [
          -0.04 * i,
          0,
          0,
        ]);
      for (let i = 0; i < 4; i++)
        box(
          side * (5 + i * 3.4),
          3.05,
          10.3,
          2,
          0.6,
          1.2,
          mats.black,
          venue,
          [0.3, 0, 0],
        );
      for (let i = 0; i < 3; i++) petal(side, i);
    }
    truss([-28, 24, -9], [28, 24, -9]);
    truss([-27, 23, 8], [27, 23, 8]);
    // Performance chamber: open framing and a backlit anonymous silhouette.
    for (const x of [-4.8, 4.8])
      for (const z of [-8.8, -1.2])
        box(x, 8.4, z, 0.12, 9.2, 0.12, mats.darkSteel);
    for (const y of [3.9, 13]) {
      box(0, y, -8.8, 9.7, 0.13, 0.14, mats.edge);
      box(0, y, -1.2, 9.7, 0.13, 0.14, mats.edge);
    }
    for (const x of [-4.8, 4.8]) {
      box(x, 8.5, -8.8, 0.06, 9, 0.05, mats.edge);
      bar([x, 13, -8.8], [x, 13, -1.2], 0.04, mats.edge);
    }
    const led = new THREE.ShaderMaterial({
      uniforms: ledUniforms,
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec2 vUv;uniform float time;uniform float strength;uniform float night;uniform vec3 colour;void main(){vec2 p=(vUv-.5)*2.;p.x*=.82;float r=length(p);float a=atan(p.y,p.x);float bend=r+.11*sin(a*3.+r*4.-time*.11);float ribbon=pow(.5+.5*sin(bend*28.-a*3.+sin(a*2.)*1.7-time*.17),7.);float folds=pow(.5+.5*sin(bend*46.+a*4.+time*.08),14.);float mask=1.-smoothstep(.35,1.15,r);float glow=pow(max(0.,1.-r),2.);float grid=.94+.06*sin(vUv.y*480.);vec3 c=vec3(.012,.022,.05)+colour*(.09+mask*(ribbon*.85+folds*.16)+glow*.28)+vec3(.15,.22,.34)*pow(ribbon,4.)*mask;gl_FragColor=vec4(c*strength*grid*mix(.65,1.,night),1.);}",
    });
    worldObjects.push(led);
    panel(0, 8.5, -8.7, 9.4, 9, led);
    for (const side of [-1, 1]) {
      box(side * 14.5, 10, 4.7, 11, 14, 0.45, mats.black);
      const screen = panel(side * 14.5, 10, 5, 10.7, 13.7, led);
      screen.rotation.z = side * -0.04;
      box(side * 33.8, 9.7, 1, 7.5, 13.4, 0.8, mats.black);
      panel(side * 33.8, 9.7, 1.45, 7.2, 13.1, led);
      panel(side * 33.8, 2.25, 1.46, 7.2, 0.75, label("BLUE HOUR", 512, 64));
    }
    // Long-hair silhouette is original geometry, not a representation of the artist's face.
    const silhouette = new THREE.Group();
    silhouette.position.set(0, 3.95, -4.5);
    venue.add(silhouette);
    const shadow = new THREE.MeshBasicMaterial({ color: "#05070d" });
    queue(
      sphereGeo,
      shadow,
      [0, 2.1, 0],
      [0, 0, 0.12],
      [0.24, 0.32, 0.19],
      silhouette,
    );
    queue(
      new THREE.ConeGeometry(0.52, 1.65, 12),
      shadow,
      [0, 1.11, 0],
      [0, 0, 0],
      [1, 1, 0.55],
      silhouette,
    );
    queue(
      new THREE.ConeGeometry(0.35, 1.17, 12),
      shadow,
      [-0.04, 1.73, -0.1],
      [0, 0, -0.16],
      [1, 1, 0.6],
      silhouette,
    );
    bar([-0.23, 1.73, 0], [-0.6, 1.02, 0.05], 0.09, shadow, silhouette);
    bar([0.23, 1.73, 0], [0.53, 2.05, 0.02], 0.09, shadow, silhouette);
    bar([0.53, 2.05, 0.02], [0.24, 2.15, 0.05], 0.075, shadow, silhouette);
    bar([0.25, 2.2, 0.08], [0.58, 2.15, 0.08], 0.025, mats.steel, silhouette);
    for (const x of [-0.17, 0.17])
      bar([x, 0.9, 0], [x, 0.02, 0.02], 0.09, shadow, silhouette);
    // Band risers, drum kit, keyboard and backline.
    for (const side of [-1, 1]) {
      box(side * 9, 3.2, -3, 5, 0.8, 4, mats.deck);
      if (side === -1) {
        for (let i = 0; i < 4; i++)
          cylinder(
            -9 + (i - 1.5) * 0.8,
            4.2,
            -3 + (i % 2) * 0.5,
            0.38,
            0.45,
            mats.black,
          );
        queue(
          new THREE.CylinderGeometry(0.8, 0.8, 0.65, 20),
          mats.black,
          [-9, 3.9, -1.5],
          [Math.PI / 2, 0, 0],
        );
        for (const x of [-10.4, -7.8]) {
          bar([x, 3.5, -3], [x, 5.6, -3], 0.03, mats.steel);
          queue(new THREE.CylinderGeometry(0.48, 0.48, 0.025, 20), mats.steel, [
            x,
            5.6,
            -3,
          ]);
        }
      } else {
        box(10, 4.6, -2, 2.1, 0.16, 0.65, mats.black);
        bar([9.2, 3.7, -2], [10.6, 4.6, -2], 0.035, mats.steel);
        bar([10.6, 3.7, -2], [9.2, 4.6, -2], 0.035, mats.steel);
      }
      for (let i = 0; i < 3; i++)
        box(side * 18, 3.5, -5 + i * 1.2, 1.2, 1.4, 1, mats.black);
    }
    panel(0, 2.05, 11.58, 20, 0.85, label("ADO  /  BLUE HOUR", 1024, 64));
    for (const x of [-21, 0, 21]) {
      const light = new THREE.SpotLight("#a8bfff", 2800, 85, 0.6, 0.8, 2);
      light.position.set(x, 19, 28);
      light.target.position.set(x * 0.6, 6, 0);
      venue.add(light, light.target);
      stageLights.push(light);
    }
    // Twenty-four virtual moving heads, each with an eight-channel preview patch.
    for (let i = 0; i < 24; i++) makeFixture(i);
    buildVenue();
  }
  function makeFixture(index) {
    const overhead = index < 12,
      i = index % 12;
    const x = overhead ? -23 + (i * 46) / 11 : -25 + (i * 50) / 11;
    const y = overhead ? 22.5 : 3.1,
      z = overhead ? 7 : 9.7;
    box(x, y, z, 0.65, 0.36, 0.65, mats.black);
    const head = new THREE.Group();
    head.position.set(x, y, z);
    venue.add(head);
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.3, 0.6, 10),
      mats.black,
    );
    body.rotation.x = Math.PI / 2;
    head.add(body);
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.19, 14),
      new THREE.MeshBasicMaterial({ color: "#b9d2ff" }),
    );
    lens.position.z = 0.31;
    head.add(lens);
    const cone = new THREE.ConeGeometry(1, 1, 18, 1, true);
    cone.translate(0, -0.5, 0);
    cone.rotateX(-Math.PI / 2);
    const beam = new THREE.Mesh(
      cone,
      new THREE.ShaderMaterial({
        uniforms: {
          colour: { value: new THREE.Color("#5c7fff") },
          power: { value: 0.07 },
        },
        vertexShader:
          "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 vUv;uniform vec3 colour;uniform float power;void main(){float edge=pow(max(0.,sin(vUv.x*3.14159265)),1.5);float fade=pow(vUv.y,.55);gl_FragColor=vec4(colour,power*edge*fade);}",
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    beam.position.z = 0.33;
    head.add(beam);
    fixtures.push({
      index,
      head,
      beam,
      lens,
      overhead,
      colour: new THREE.Color("#5c7fff"),
      intensity: 0.75,
      patch: new Uint8Array(8),
    });
  }
  function buildVenue() {
    // Audience deck, central access aisle, barriers and front-of-house control position.
    box(0, 0.58, 57, 82, 0.12, 67, mats.deck);
    for (const side of [-1, 1]) {
      for (let row = 0; row < 2; row++)
        for (let i = 0; i < 9; i++) {
          const x = side * (5 + i * 4),
            z = 29 + row * 33;
          bar([x, 0.7, z], [x, 1.8, z], 0.035, mats.steel);
          bar([x + 3.8, 0.7, z], [x + 3.8, 1.8, z], 0.035, mats.steel);
          bar([x, 1.8, z], [x + 3.8, 1.8, z], 0.04, mats.steel);
        }
      for (let i = 0; i < 10; i++) {
        const z = 18 + i * 9;
        bar([side * 44, 0.7, z], [side * 44, 1.7, z], 0.03, mats.steel);
        if (i < 9)
          bar([side * 44, 1.7, z], [side * 44, 1.7, z + 9], 0.03, mats.steel);
      }
      // Festival concession and production tents.
      for (let i = 0; i < 3; i++) {
        const x = side * 56,
          z = 35 + i * 21;
        box(x, 1.9, z, 9, 2.8, 6, mats.white);
        queue(
          new THREE.ConeGeometry(6.4, 2.8, 4),
          mats.white,
          [x, 4.5, z],
          [0, Math.PI / 4, 0],
          [1, 1, 0.75],
        );
        box(x, 2, z + 3.06, 7, 1.6, 0.1, mats.black);
        panel(
          x,
          3.15,
          z + 3.13,
          7,
          0.5,
          label(side < 0 ? "TOKYO / FOOD" : "BLUE HOUR / GOODS", 512, 48),
        );
      }
      // Technical compounds behind stage.
      box(side * 21, 2.4, -24, 12, 4, 6, mats.darkSteel);
      panel(side * 21, 3, -20.95, 9, 0.8, label("PRODUCTION", 512, 64));
    }
    box(0, 1.9, 81, 10, 2.5, 6, mats.black);
    box(0, 4, 81, 11, 0.2, 7, mats.darkSteel);
    for (const x of [-4.6, 4.6])
      bar([x, 0.5, 78], [x, 4, 78], 0.06, mats.steel);
    for (let i = 0; i < 3; i++) {
      box(
        -3 + i * 3,
        3.1,
        79.5,
        1.7,
        0.18,
        0.8,
        mats.black,
        venue,
        [0.25, 0, 0],
      );
      panel(
        -3 + i * 3,
        3.4,
        79,
        1.1,
        0.45,
        label(i === 1 ? "LIGHTING" : "SHOW CTRL", 256, 64),
      );
    }
    panel(0, 2.1, 84.1, 8, 0.65, label("FRONT OF HOUSE", 512, 64));
    for (const side of [-1, 1]) {
      truss([side * 15, 0.7, 103], [side * 15, 5, 103], 0.35);
      box(side * 9, 4.8, 103, 12, 0.25, 0.3, mats.black);
    }
    panel(0, 4.7, 103.2, 28, 1.6, label("BLUE HOUR  /  ENTRANCE", 1024, 96));
    // Human proportions, varied clothing and shared instanced geometry keep the crowd legible.
    const count=smallScreen?210:420;
    mats.audience.color.set('#ffffff');mats.audience.name='CrowdClothing';
    const skin=material('#ffffff',{roughness:.96});skin.name='CrowdSkin';
    const pants=material('#42464b',{roughness:1});pants.name='CrowdTrousers';
    const hair=material('#282725',{roughness:1});hair.name='CrowdHair';
    const headGeo=new THREE.IcosahedronGeometry(1,1);
    const bodyGeo=new THREE.CapsuleGeometry(.18,.35,2,6);
    const heads=new THREE.InstancedMesh(headGeo,skin,count);
    const bodies=new THREE.InstancedMesh(bodyGeo,mats.audience,count);
    const hairCaps=new THREE.InstancedMesh(headGeo,hair,count);
    const legs=new THREE.InstancedMesh(cylGeo,pants,count*2);
    const arms=new THREE.InstancedMesh(cylGeo,mats.audience,count*2);
    const feet=new THREE.InstancedMesh(boxGeo,pants,count*2);
    const d=new THREE.Object3D(),clothing=['#b9b7aa','#596978','#82776c','#6d8075','#a18d84','#414b57'],skins=['#b78765','#d9b18b','#936c51','#e0bea0','#c59876'];
    for(let i=0;i<count;i++){
      const side=i%2?1:-1,x=side*(5+rand()*31),z=33+rand()*39,h=1.57+rand()*.23,ground=.68,scale=h/1.7;
      const shirt=new THREE.Color(clothing[i%clothing.length]);
      d.rotation.set(0,rand()*.35-.175,0);d.position.set(x,ground+1.17*scale,z);d.scale.set(1,scale,1);d.updateMatrix();bodies.setMatrixAt(i,d.matrix);bodies.setColorAt(i,shirt);
      d.position.set(x,ground+1.56*scale,z);d.scale.set(.125,.15,.13);d.updateMatrix();heads.setMatrixAt(i,d.matrix);heads.setColorAt(i,new THREE.Color(skins[i%skins.length]));
      d.position.set(x,ground+1.65*scale,z+.015);d.scale.set(.131,.07,.135);d.updateMatrix();hairCaps.setMatrixAt(i,d.matrix);
      for(let j=0;j<2;j++){
        const sign=j?1:-1;
        d.rotation.set(0,0,sign*.025);d.position.set(x+sign*.095,ground+.4*scale,z);d.scale.set(.067,.8*scale,.075);d.updateMatrix();legs.setMatrixAt(i*2+j,d.matrix);
        d.rotation.set(0,0,sign*.08);d.position.set(x+sign*.235,ground+1.13*scale,z);d.scale.set(.055,.57*scale,.055);d.updateMatrix();arms.setMatrixAt(i*2+j,d.matrix);arms.setColorAt(i*2+j,shirt);
        d.rotation.set(0,0,0);d.position.set(x+sign*.095,ground+.045,z-.04);d.scale.set(.14,.09,.27);d.updateMatrix();feet.setMatrixAt(i*2+j,d.matrix);
      }
    }
    for(const mesh of [heads,bodies,hairCaps,legs,arms,feet]){mesh.castShadow=true;mesh.receiveShadow=true;venue.add(mesh);}
  }

  let particles, particlePositions, particleColours;
  const particleCount = smallScreen ? 720 : 1500;
  function buildFireworks() {
    particlePositions = new Float32Array(particleCount * 3);
    particleColours = new Float32Array(particleCount * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(particleColours, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { pixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader:
        "varying vec3 c;uniform float pixelRatio;void main(){c=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(320.*pixelRatio/max(1.,-p.z),1.5,6.);gl_Position=projectionMatrix*p;}",
      fragmentShader:
        "varying vec3 c;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(c*2.4,pow(1.-r,1.1));}",
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
    particles = new THREE.Points(g, mat);
    particles.frustumCulled = false;
    particles.visible = false;
    venue.add(particles);
  }
  function triggerFireworks() {
    if (reduced) {
      setCue("finale", true);
      $("show-status").textContent = "Finale look · Reduced motion";
      return;
    }
    fireworks.length = 0;
    const centres = [
      [-35, 42, -45],
      [0, 58, -62],
      [34, 46, -48],
    ];
    const n = Math.floor(particleCount / 3);
    centres.forEach((c, j) => {
      for (let i = 0; i < n; i++) {
        const u = rand() * 2 - 1,
          a = rand() * Math.PI * 2,
          speed = 8 + rand() * 11,
          v = Math.sqrt(1 - u * u);
        fireworks.push({
          c,
          v: [v * Math.cos(a) * speed, u * speed, v * Math.sin(a) * speed],
          delay: j * 0.7,
          life: 2.2 + rand() * 1.4,
          colour: new THREE.Color(j === 1 ? "#cfb8ff" : "#b3dfff"),
        });
      }
    });
    state.fireworkStart = state.elapsed - 0.6;
    particles.visible = true;
    $("fireworks").disabled = true;
    $("show-status").textContent = "Fireworks preview";
  }
  function updateFireworks(t) {
    if (!particles.visible) return;
    let alive = 0;
    fireworks.forEach((p, i) => {
      const age = t - state.fireworkStart - p.delay,
        ok = age >= 0 && age < p.life;
      if (ok) alive++;
      for (let k = 0; k < 3; k++) {
        particlePositions[i * 3 + k] = ok
          ? p.c[k] + p.v[k] * age + (k === 1 ? -2.5 * age * age : 0)
          : -10000;
        particleColours[i * 3 + k] = ok
          ? p.colour.toArray()[k] * Math.pow(1 - age / p.life, 0.7)
          : 0;
      }
    });
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate = true;
    if (t - state.fireworkStart > 5.2) {
      particles.visible = false;
      fireworks.length = 0;
      $("fireworks").disabled = false;
      if (!state.running) $("show-status").textContent = "Ready when you are.";
    }
  }
  function setCue(name, stop = true) {
    if (stop && state.running) stopShow();
    state.cue = name;
    const cue = cueData[name];
    fixtures.forEach((f) => {
      f.colour.set(cue.colour);
      f.intensity = cue.intensity / 100;
    });
    ledUniforms.colour.value.set(cue.colour);
    ledUniforms.strength.value = 0.9;
    document
      .querySelectorAll("[data-cue]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.cue === name)),
      );
    $("cue-label").textContent = cue.label;
    $("intensity").value = cue.intensity;
    $("intensity-value").textContent = cue.intensity + "%";
    $("light-colour").value = cue.colour;
    state.group = "all";
    $("fixture-group").value = "all";
  }
  function stopShow() {
    state.running = false;
    $("run-show").querySelector("span").textContent = "Run the show";
    $("run-show").setAttribute("aria-pressed", "false");
    $("show-status").textContent = "Show stopped · Explore freely";
    if (particles) {
      particles.visible = false;
      fireworks.length = 0;
      $("fireworks").disabled = false;
    }
  }
  function runShow() {
    if (state.running) {
      stopShow();
      return;
    }
    setTime("night");
    setCue("opening", false);
    state.running = true;
    state.start = state.elapsed;
    state.lastShowStep = 0;
    $("run-show").querySelector("span").textContent = "Stop show";
    $("run-show").setAttribute("aria-pressed", "true");
    $("show-status").textContent = "01 / Opening · 36-second preview";
  }
  function setTime(time) {
    if (time === "day" && state.running) stopShow();
    state.targetNight = time === "night" ? 1 : 0;
    document
      .querySelectorAll("[data-time]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.time === time)),
      );
  }
  function localToWorld(p) {
    return venue.localToWorld(vec(...p));
  }
  function setView(name, immediate = false) {
    const view = views[name];
    state.viewName = name;
    orbit.desired = view.world
      ? vec(...view.target)
      : localToWorld(view.target);
    orbit.dTheta = view.theta + (view.world ? 0 : stageYaw);
    orbit.dPhi = view.phi;
    orbit.dRadius = view.radius;
    if (name === "audience" && innerWidth < 700) {
      orbit.dRadius = 82 * Math.max(1, 0.82 / (innerWidth / innerHeight));
      orbit.dTheta = stageYaw + 0.05;
      orbit.dPhi = 1.36;
    }
    if (name === "aerial" && innerWidth < 700)
      orbit.dRadius = 198 * Math.max(1, 0.8 / (innerWidth / innerHeight));
    if (immediate || reduced) {
      orbit.target.copy(orbit.desired);
      orbit.theta = orbit.dTheta;
      orbit.phi = orbit.dPhi;
      orbit.radius = orbit.dRadius;
    }
    document
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.view === name)),
      );
    $("view-hint").textContent =
      name === "aerial"
        ? "Event layout study · Drag to explore"
        : "Drag to orbit · Scroll or pinch to zoom";
  }
  function updateLights(t) {
    const cue = cueData[state.cue],
      motion = state.motion && !reduced;
    fixtures.forEach((f, i) => {
      const phase = t * cue.speed + (i % 12) * 0.3;
      const target = vec(
        Math.sin(phase) * 22 * cue.spread,
        f.overhead ? 0.6 : 19 + Math.cos(phase * 0.7) * 9,
        f.overhead
          ? 37 + Math.cos(phase) * 20
          : 20 + Math.sin(phase * 0.8) * 24,
      );
      if (!motion)
        target.set(Math.sin(i * 0.6) * 28, f.overhead ? 0.6 : 26, 30);
      const from = f.head.position,
        world = venue.localToWorld(target.clone());
      f.head.lookAt(world);
      const length = clamp(from.distanceTo(target), 12, 72);
      f.beam.scale.set(length * 0.055, length * 0.055, length);
      f.beam.material.uniforms.colour.value.copy(f.colour);
      f.beam.material.uniforms.power.value =
        f.intensity *
        (f.overhead ? 0.095 : 0.065) *
        (0.15 + 0.85 * state.night);
      f.lens.material.color.copy(f.colour).multiplyScalar(f.intensity * 1.8);
      f.beam.visible = f.intensity > 0.01;
      const colour = f.colour.clone().convertLinearToSRGB();
      f.patch.set([
        Math.round(f.intensity * 255),
        motion ? Math.round((Math.sin(phase) * 0.35 + 0.5) * 255) : 128,
        motion ? Math.round((Math.cos(phase) * 0.2 + 0.5) * 255) : 128,
        Math.round(colour.r * 255),
        Math.round(colour.g * 255),
        Math.round(colour.b * 255),
        Math.round((cue.spread / 1.15) * 255),
        f.intensity > 0 ? 255 : 0,
      ]);
    });
    stageLights.forEach((light, i) => {
      const f = fixtures[i * 4];
      light.intensity = f.intensity * 3600;
      light.color.copy(f.colour).lerp(new THREE.Color("#dde8ff"), 0.6);
    });
    const f = fixtures[state.group === "floor" ? 12 : 0];
    if (Math.floor(t * 3) !== state.patchTick) {
      state.patchTick = Math.floor(t * 3);
      $("patch-values").textContent =
        "Dimmer " +
        f.patch[0] +
        " / Pan " +
        f.patch[1] +
        " / Tilt " +
        f.patch[2] +
        " · RGB " +
        Array.from(f.patch.slice(3, 6)).join(", ");
    }
  }
  function bindControls() {
    document
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.addEventListener("click", () => setView(b.dataset.view)),
      );
    document
      .querySelectorAll("[data-time]")
      .forEach((b) =>
        b.addEventListener("click", () => setTime(b.dataset.time)),
      );
    document
      .querySelectorAll("[data-cue]")
      .forEach((b) => b.addEventListener("click", () => setCue(b.dataset.cue)));
    $("run-show").addEventListener("click", runShow);
    $("fireworks").addEventListener("click", triggerFireworks);
    const deskOpen = (open) => {
      $("show-desk").hidden = !open;
      $("desk-toggle").setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("desk-open", open);
    };
    $("desk-toggle").addEventListener("click", () =>
      deskOpen($("show-desk").hidden),
    );
    $("desk-close").addEventListener("click", () => {
      deskOpen(false);
      $("desk-toggle").focus();
    });
    $("help-open").addEventListener("click", () => $("about").showModal());
    $("help-close").addEventListener("click", () => $("about").close());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("show-desk").hidden) {
        deskOpen(false);
        $("desk-toggle").focus();
      }
    });
    $("fixture-group").addEventListener("change", (e) => {
      state.group = e.target.value;
      const f = fixtures.find(
        (f) =>
          state.group === "all" || f.overhead === (state.group === "overhead"),
      );
      $("intensity").value = Math.round(f.intensity * 100);
      $("intensity-value").textContent = $("intensity").value + "%";
      $("light-colour").value = "#" + f.colour.getHexString();
    });
    function forSelected(cb) {
      if (state.running) stopShow();
      fixtures
        .filter(
          (f) =>
            state.group === "all" ||
            f.overhead === (state.group === "overhead"),
        )
        .forEach(cb);
      $("cue-label").textContent = "Custom lighting look";
      document
        .querySelectorAll("[data-cue]")
        .forEach((b) => b.setAttribute("aria-pressed", "false"));
    }
    $("intensity").addEventListener("input", (e) => {
      const value = +e.target.value;
      $("intensity-value").textContent = value + "%";
      forSelected((f) => (f.intensity = value / 100));
    });
    const colour = (value) => {
      forSelected((f) => f.colour.set(value));
      $("light-colour").value = value;
      ledUniforms.colour.value.set(value);
    };
    $("light-colour").addEventListener("input", (e) => colour(e.target.value));
    document
      .querySelectorAll("[data-colour]")
      .forEach((b) =>
        b.addEventListener("click", () => colour(b.dataset.colour)),
      );
    $("movement").checked = !reduced;
    $("movement").addEventListener("change", (e) => {
      state.motion = e.target.checked;
    });
    $("zoom-in").addEventListener("click", () => {
      state.viewName = null;
      orbit.dRadius = clamp(orbit.dRadius * 0.8, 22, 1400);
    });
    $("zoom-out").addEventListener("click", () => {
      state.viewName = null;
      orbit.dRadius = clamp(orbit.dRadius * 1.25, 22, 1400);
    });
    $("retry").addEventListener("click", () => location.reload());
    reducedQuery.addEventListener("change", (e) => {
      reduced = e.matches;
      if (reduced) {
        state.motion = false;
        $("movement").checked = false;
        particles.visible = false;
        fireworks.length = 0;
        $("fireworks").disabled = false;
      }
    });
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute(
      "aria-label",
      "Interactive concert venue. Drag to orbit. Arrow keys rotate, plus and minus zoom, Home resets.",
    );
    const pointers = new Map();
    let previousPinch = 0,
      previousCentre = null;
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("pointerdown", (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvas.setPointerCapture(e.pointerId);
      canvas.focus({ preventScroll: true });
      previousPinch = 0;
      previousCentre = null;
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      state.viewName = null;
      const old = pointers.get(e.pointerId),
        dx = e.clientX - old.x,
        dy = e.clientY - old.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values()),
          distance = Math.hypot(a.x - b.x, a.y - b.y),
          centre = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (previousPinch)
          orbit.dRadius = clamp(
            (orbit.dRadius * previousPinch) / distance,
            22,
            1400,
          );
        if (previousCentre)
          panCamera(centre.x - previousCentre.x, centre.y - previousCentre.y);
        previousPinch = distance;
        previousCentre = centre;
      } else if (e.buttons === 2 || e.shiftKey) panCamera(dx, dy);
      else {
        orbit.dTheta -= dx * 0.005;
        orbit.dPhi = clamp(orbit.dPhi - dy * 0.004, 0.15, 1.51);
      }
    });
    function release(e) {
      pointers.delete(e.pointerId);
      previousPinch = 0;
      previousCentre = null;
    }
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("lostpointercapture", release);
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        state.viewName = null;
        orbit.dRadius = clamp(
          orbit.dRadius * Math.exp(e.deltaY * 0.001),
          22,
          1400,
        );
      },
      { passive: false },
    );
    canvas.addEventListener("keydown", (e) => {
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "+",
          "=",
          "-",
          "Home",
        ].includes(e.key)
      )
        e.preventDefault();
      if (e.key !== "Home") state.viewName = null;
      if (e.key === "ArrowLeft") orbit.dTheta += 0.1;
      if (e.key === "ArrowRight") orbit.dTheta -= 0.1;
      if (e.key === "ArrowUp")
        orbit.dPhi = clamp(orbit.dPhi - 0.08, 0.15, 1.51);
      if (e.key === "ArrowDown")
        orbit.dPhi = clamp(orbit.dPhi + 0.08, 0.15, 1.51);
      if (e.key === "+" || e.key === "=")
        orbit.dRadius = clamp(orbit.dRadius * 0.85, 22, 1400);
      if (e.key === "-") orbit.dRadius = clamp(orbit.dRadius / 0.85, 22, 1400);
      if (e.key === "Home") setView("audience");
    });
    function panCamera(dx, dy) {
      const speed = orbit.dRadius * 0.0013;
      orbit.desired.x +=
        (-Math.cos(orbit.theta) * dx - Math.sin(orbit.theta) * dy) * speed;
      orbit.desired.z +=
        (Math.sin(orbit.theta) * dx - Math.cos(orbit.theta) * dy) * speed;
      orbit.desired.x = clamp(orbit.desired.x, -700, 900);
      orbit.desired.z = clamp(orbit.desired.z, -1200, 1000);
    }
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      fail("The 3D view was interrupted. Try again to reopen the venue.");
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        active = false;
        cancelAnimationFrame(raf);
        lastFrame = 0;
      } else if (document.body.dataset.experienceState === "ready") {
        active = true;
        raf = requestAnimationFrame(frame);
      }
    });
    window.addEventListener("resize", resize);
    window.addEventListener("pagehide", dispose, { once: true });
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) location.reload();
    });
  }
  function resize() {
    if (!renderer) return;
    const w = innerWidth,
      h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 700 && h > w ? 62 : 48;
    camera.updateProjectionMatrix();
    if (state.viewName) setView(state.viewName);
  }
  let slowFrames = 0,
    sampleFrames = 0;
  function frame(now) {
    if (!active) return;
    const dt = lastFrame ? Math.min(0.08, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    state.elapsed += dt;
    const t = state.elapsed,
      smooth = reduced ? 1 : 1 - Math.exp(-dt * 7);
    state.night = lerp(state.night, state.targetNight, smooth);
    if (state.running) {
      const age = t - state.start,
        step = age < 12 ? 0 : age < 25 ? 1 : age < 36 ? 2 : 3;
      if (step !== state.lastShowStep) {
        state.lastShowStep = step;
        if (step === 1) {
          setCue("performance", false);
          $("show-status").textContent = "02 / Performance";
        }
        if (step === 2) {
          setCue("finale", false);
          triggerFireworks();
          $("show-status").textContent = "03 / Finale";
        }
        if (step === 3) {
          stopShow();
          $("show-status").textContent = "Show complete · Replay or explore";
        }
      }
    }
    orbit.target.lerp(orbit.desired, smooth);
    orbit.theta = lerp(orbit.theta, orbit.dTheta, smooth);
    orbit.phi = lerp(orbit.phi, orbit.dPhi, smooth);
    orbit.radius = lerp(orbit.radius, orbit.dRadius, smooth);
    camera.position
      .copy(orbit.target)
      .add(
        vec(
          Math.sin(orbit.theta) * Math.sin(orbit.phi),
          Math.cos(orbit.phi),
          Math.cos(orbit.theta) * Math.sin(orbit.phi),
        ).multiplyScalar(orbit.radius),
      );
    camera.position.y = Math.max(2, camera.position.y);
    camera.lookAt(orbit.target);
    camera.clearViewOffset();
    ledUniforms.time.value = reduced ? 0 : t;
    ledUniforms.night.value = state.night;
    environment.update(reduced ? 0 : t, state.night, camera);
    updateLights(reduced ? 0 : t);
    updateFireworks(t);
    environment.render(camera, now, orbit.target);
    if (dt > 0) {
      sampleFrames++;
      if (dt > 0.038) slowFrames++;
    }
    if (
      sampleFrames === 150 &&
      slowFrames > 70 &&
      renderer.getPixelRatio() > 1
    ) {
      environment.quality.contactShading = false;
      environment.quality.compact = true;
      renderer.setPixelRatio(Math.min(renderer.getPixelRatio(), 1.25));
      resize();
      particles.material.uniforms.pixelRatio.value = renderer.getPixelRatio();
      $("quality-label").textContent = "BALANCED QUALITY";
    }
    raf = requestAnimationFrame(frame);
  }
  function dispose() {
    active = false;
    cancelAnimationFrame(raf);
    scene?.traverse((object) => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const m of materials) {
        if (!m) continue;
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose?.();
      }
    });
    environment?.dispose();
    renderer?.dispose();
  }
  async function init() {
    try {
      if (!window.THREE)
        throw new Error(
          "The 3D library could not load. Check your connection and try again.",
        );
      renderer = new THREE.WebGLRenderer({
        antialias: !smallScreen,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(
        Math.min(Math.max(devicePixelRatio, 1.5), 2, Math.sqrt(4500000 / (innerWidth * innerHeight))),
      );
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      $("viewport").append(renderer.domElement);
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2("#17253c", 0.00048);
      camera = new THREE.PerspectiveCamera(
        48,
        innerWidth / innerHeight,
        0.5,
        18000,
      );
      boxGeo = unitBox();
      cylGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
      sphereGeo = new THREE.SphereGeometry(1, 10, 8);
      orbit.target = vec();
      orbit.desired = vec();
      fill = new THREE.HemisphereLight("#adbeef", "#242b34", 0.65);
      scene.add(fill);
      sun = new THREE.DirectionalLight("#e6ecff", 0.22);
      sun.position.set(-200, 300, 100);
      scene.add(sun);
      buildMaterials();
      const response = await fetch("assets/live/odaiba.json?v=1.1.0");
      if (!response.ok)
        throw new Error(
          "The Tokyo site context could not load. Check your connection and try again.",
        );
      config = await response.json();
      if (!config.land?.length)
        throw new Error("The site context is incomplete. Try again.");
      $("load-message").textContent = "Building the stage and lighting rig";
      environment = new window.LiveEnvironment({
        renderer, scene, camera, sun, fill, mats, queue, box, bar, cylinder, planShape, random: rand
      });
      await environment.build(config);
      water=environment.water; sky=environment.sky;
      buildStage();
      flush();
      buildFireworks();
      environment.finalize();
      await environment.waterReady;
      venue.updateMatrixWorld(true);
      setView("audience", true);
      setCue("opening", false);
      bindControls();
      resize();
      document.body.dataset.experienceState = "ready";
      // Render before revealing; no minimum loading delay or forced introduction.
      frame(performance.now());
      $("loading").classList.add("ready");
      $("loading").addEventListener(
        "transitionend",
        () => ($("loading").hidden = true),
        { once: true },
      );
      if (reduced) $("loading").hidden = true;
    } catch (error) {
      console.error("Kazeyami LIVE:", error);
      environment?.dispose();
    renderer?.dispose();
      fail(error.message);
    }
  }
  init();
})();

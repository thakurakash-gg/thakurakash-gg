/* Original procedural katana: no remote model, textures or animation framework. */
(() => {
  'use strict';
  const stage = document.querySelector('#katana-stage');
  if (!stage || !window.THREE) return;
  const T = window.THREE;
  const opening = document.querySelector('#opening');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = stage.querySelector('canvas');
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch { return; }
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, .1, 100);
  camera.position.set(0, 0, 15);
  const model = new T.Group();
  scene.add(model);
  const blade = new T.Group();
  const sheath = new T.Group();
  model.add(blade, sheath);
  const mapFrom = (w, h, paint) => {
    const surface = document.createElement('canvas');
    surface.width = w; surface.height = h;
    paint(surface.getContext('2d'), w, h);
    const map = new T.CanvasTexture(surface);
    map.encoding = T.sRGBEncoding;
    map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return map;
  };
  let seed = 714;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // Broad studio panels give the metal readable highlights at every orientation.
  const studioMap = mapFrom(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#dce6ef'); g.addColorStop(.3, '#727b8b');
    g.addColorStop(.46, '#f6f2e8'); g.addColorStop(.55, '#22252d');
    g.addColorStop(.75, '#949baf'); g.addColorStop(1, '#25272d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff7e9'; ctx.fillRect(70, 25, 70, 150);
    ctx.fillStyle = '#eef6ff'; ctx.fillRect(330, 10, 35, 210);
  });
  studioMap.mapping = T.EquirectangularReflectionMapping;
  const pmrem = new T.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(studioMap);
  scene.environment = environment.texture;
  studioMap.dispose(); pmrem.dispose();
  scene.add(new T.HemisphereLight(0xe9f1ff, 0x42362f, 1.7));
  const light = (color, intensity, x, y, z) => {
    const l = new T.DirectionalLight(color, intensity); l.position.set(x, y, z); scene.add(l);
  };
  light(0xffffff, 2.5, -3, 5, 8);
  light(0x9bbde5, 1.6, 4, -3, 5);
  light(0xf5a56c, 1.4, -3, -4, -2);
  const metal = new T.MeshStandardMaterial({ color: 0xc7ced3, metalness: 1, roughness: .24, envMapIntensity: 1.5 });
  const edge = new T.MeshStandardMaterial({ color: 0xf0f1ef, metalness: .95, roughness: .15 });
  const gold = new T.MeshStandardMaterial({ color: 0xa37d3d, metalness: .87, roughness: .34 });
  const dark = new T.MeshStandardMaterial({ color: 0x141719, metalness: .5, roughness: .37 });
  const lacquerMap = mapFrom(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#141415'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 10000; i++) {
      const v = 14 + Math.floor(random() * 18);
      ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(random() * w, random() * h, 1, 1);
    }
    // Hand-drawn vermilion wind ribbons, rather than the reference's artwork.
    for (let i = 0; i < 9; i++) {
      const x = 280 + i * 61;
      ctx.strokeStyle = i % 2 ? '#b33123' : '#e9472d'; ctx.lineWidth = 3 + random() * 13;
      ctx.beginPath(); ctx.moveTo(x - 100, h + 20);
      ctx.bezierCurveTo(x + 110, 150, x - 90, 95, x + 100, -20); ctx.stroke();
    }
    ctx.globalAlpha = .4; ctx.fillStyle = '#ae9158';
    for (let i = 0; i < 240; i++) { const x = random() * w, y = random() * h; ctx.fillRect(x, y, 1 + random() * 3, 1); }
  });
  const lacquer = new T.MeshPhysicalMaterial({ map: lacquerMap, metalness: .3, roughness: .25, clearcoat: 1, clearcoatRoughness: .16 });
  const clothMap = mapFrom(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#dfdbd1'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 3) {
      ctx.strokeStyle = i % 2 ? '#bcb9b2' : '#f7f4ec'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.strokeStyle = '#cac6bd66'; ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
  });
  clothMap.wrapS = clothMap.wrapT = T.RepeatWrapping;
  const cloth = new T.MeshStandardMaterial({ map: clothMap, roughness: .88, color: 0xf4efe5 });
  const skinMap = mapFrom(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1b1c19'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = '#53544b'; ctx.beginPath(); ctx.arc(x + (y % 16 ? 4 : 0), y, 2.1, 0, Math.PI * 2); ctx.fill();
    }
  });
  const skin = new T.MeshStandardMaterial({ map: skinMap, roughness: .9 });
  const mesh = (geometry, material, parent, x = 0, y = 0, z = 0) => {
    const m = new T.Mesh(geometry, material); m.position.set(x, y, z); parent.add(m); return m;
  };
  const curveY = (x) => .022 * x * x;
  // Continuous lofted blade and scabbard: curved silhouette, beveled cutting edge.
  function loft(start, end, height, depth, material, parent, tip = false) {
    const positions = [], uvs = [], indices = [];
    const segments = 90, sides = 8;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments, x = start + (end - start) * t;
      const taper = tip ? Math.min(1, t * 20 + .015) : .84 + t * .16;
      for (let j = 0; j < sides; j++) {
        const angle = j / sides * Math.PI * 2;
        positions.push(x, curveY(x) + Math.sin(angle) * height * taper, Math.cos(angle) * depth * taper);
        uvs.push(t, j / (sides - 1));
      }
    }
    for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) {
      const a = i * sides + j, b = i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
      indices.push(a, b, c, b, d, c);
    }
    // Both end caps are closed; no open model seams during the reveal.
    for (let j = 1; j < sides - 1; j++) { indices.push(0, j + 1, j); const o = segments * sides; indices.push(o, o + j, o + j + 1); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals();
    return mesh(g, material, parent);
  }
  loft(-6.2, .05, .205, .045, metal, blade, true);
  // A separate narrow polished bevel catches the light along the cutting edge.
  const bevelPoints = [];
  for (let i = 0; i < 75; i++) { const x = -6.13 + i / 74 * 6.16; bevelPoints.push(new T.Vector3(x, curveY(x) - .19 * Math.min(1, (x + 6.2) * 3), .005)); }
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(bevelPoints), 80, .012, 4, false), edge, blade);
  // Temper line is painted into a blade-only map, with no animated shader overhead.
  const hamon = mapFrom(1024, 128, (ctx,w,h) => {
    ctx.fillStyle = '#adb5bd'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#eef1ed'; ctx.lineWidth = 14; ctx.beginPath();
    for (let x = 0; x <= w; x += 2) { const y = 91 + Math.sin(x * .037) * 3 + Math.sin(x * .013) * 5; x ? ctx.lineTo(x,y) : ctx.moveTo(x,y); } ctx.stroke();
    ctx.fillStyle = '#53606b'; ctx.font = '24px serif'; ctx.fillText('風  光', 810, 60);
  });
  const bladeFace = new T.MeshStandardMaterial({ map: hamon, metalness: .87, roughness: .27 });
  const strip = new T.Shape(); strip.moveTo(-6.17, curveY(-6.17));
  for (let i = 1; i <= 80; i++) { const x = -6.17 + i / 80 * 6.2; strip.lineTo(x, curveY(x) + .16); }
  for (let i = 80; i >= 1; i--) { const x = -6.17 + i / 80 * 6.2; strip.lineTo(x, curveY(x) - .17); } strip.closePath();
  const faceGeo = new T.ShapeGeometry(strip, 80);
  const uv = faceGeo.attributes.uv, pos = faceGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 6.2) / 6.25, (pos.getY(i) - curveY(pos.getX(i)) + .205) / .41);
  mesh(faceGeo, bladeFace, blade, 0, 0, .043);
  loft(-6.4, -.18, .29, .15, lacquer, sheath);
  const cylinder = (radius, depth, mat, parent, x, y = 0) => {
    const m = mesh(new T.CylinderGeometry(radius, radius, depth, 48), mat, parent, x, y);
    m.rotation.z = Math.PI / 2; return m;
  };
  const mouth = cylinder(.295, .1, dark, sheath, -.16); mouth.scale.z = .58;
  const cap = cylinder(.25, .12, dark, sheath, -6.4, curveY(-6.4)); cap.scale.z = .58;
  // Gold habaki and a pierced, scalloped tsuba with an original radial ornament.
  mesh(new T.BoxGeometry(.35, .43, .19), gold, blade, .08);
  const guard = cylinder(.49, .115, dark, blade, .34); guard.scale.z = .8;
  const guardRim = mesh(new T.TorusGeometry(.465,.024,6,64), gold, blade, .34); guardRim.rotation.y = Math.PI / 2; guardRim.scale.y = 1.05; guardRim.scale.x = .8;
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    const ornament = mesh(new T.TorusGeometry(.035,.012,4,8), gold, blade, .275, Math.cos(a)*.37,Math.sin(a)*.29);
    ornament.rotation.y = Math.PI/2;
  }
  const grip = cylinder(.21, 2.5, skin, blade, 1.68); grip.scale.z = .82;
  cylinder(.23,.14,dark,blade,.49).scale.z=.82;
  cylinder(.23,.14,gold,blade,2.97).scale.z=.82;
  // Two opposing ribbon helices create real interlaced diamond openings.
  function braid(handedness) {
    const points=[], normals=[], triangles=[], turns=10, steps=turns*32;
    for(let i=0;i<=steps;i++) {
      const t=i/steps,a=t*turns*Math.PI*2*handedness;
      const x=.53+t*2.36;
      for(const offset of [-.065,.065]) {
        points.push(x+offset,Math.cos(a)*.22,Math.sin(a)*.185);
        normals.push(t*8,offset<0?0:1);
      }
      if(i<steps) { const n=i*2; triangles.push(n,n+1,n+2,n+1,n+3,n+2); }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('uv',new T.Float32BufferAttribute(normals,2));g.setIndex(triangles);g.computeVertexNormals();
    const m=cloth.clone();m.side=T.DoubleSide;mesh(g,m,blade);
  }
  braid(1);braid(-1);
  for(let i=0;i<3;i++) mesh(new T.SphereGeometry(.04,8,6),gold,blade,1.1+i*.55,0,.18);
  const drawButton=document.querySelector('#draw-blade');
  const pauseButton=document.querySelector('#motion-toggle');
  let userDraw=0,draw=0,progress=0,pointerX=0,pointerY=0,paused=false,inView=true,frame=0,last=0;
  let down=null,dragAmount=0;
  drawButton.addEventListener('click',()=>{
    userDraw=userDraw?0:1;drawButton.setAttribute('aria-pressed',String(!!userDraw));
    drawButton.querySelector('span').textContent=userDraw?'Sheathe the blade':'Draw the blade'; requestRender();
  });
  pauseButton.addEventListener('click',()=>{
    paused=!paused;pauseButton.textContent=paused?'Resume motion':'Pause motion';pauseButton.setAttribute('aria-pressed',String(paused));requestRender();
  });
  stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){down=e.clientX;dragAmount=userDraw;stage.setPointerCapture(e.pointerId);}});
  stage.addEventListener('pointermove',e=>{
    if(down!==null){userDraw=T.MathUtils.clamp(dragAmount+(e.clientX-down)/stage.clientWidth*2,0,1);drawButton.setAttribute('aria-pressed',String(userDraw>.5));}
    pointerX=(e.clientX/stage.clientWidth-.5)*2;pointerY=(e.clientY/stage.clientHeight-.5)*2;requestRender();
  });
  stage.addEventListener('pointerup',()=>{down=null;drawButton.querySelector('span').textContent=userDraw>.5?'Sheathe the blade':'Draw the blade';});
  stage.addEventListener('pointercancel',()=>{down=null;});
  stage.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;requestRender();});
  const copy=document.querySelector('.opening-copy'),name=document.querySelector('.opening-name'),peek=document.querySelector('.work-peek'),meta=document.querySelector('.opening-meta'),reveal=document.querySelector('.reveal-copy');
  const clamp=T.MathUtils.clamp;
  function scroll(){
    progress=reduced.matches?0:clamp(-opening.getBoundingClientRect().top/Math.max(1,opening.offsetHeight-innerHeight),0,1);
    const fade=clamp(1-progress*3,0,1),appear=clamp((progress-.34)*3,0,1);
    for(const el of [copy,name,peek,meta]){el.style.opacity=fade;el.style.visibility=fade<.01?'hidden':'visible';}
    reveal.style.opacity=appear;reveal.style.transform=`translateY(${(1-appear)*35}px)`;reveal.style.visibility=appear<.01?'hidden':'visible';
    requestRender();
  }
  let width=0,height=0;
  function resize(){
    width=stage.clientWidth;height=stage.clientHeight;
    const cap=(navigator.deviceMemory&&navigator.deviceMemory<=4)?1.35:1.8;
    renderer.setPixelRatio(Math.min(devicePixelRatio,cap));renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();requestRender();
  }
  function requestRender(){if(!frame&&inView&&!document.hidden)frame=requestAnimationFrame(render);}
  function render(now){
    frame=0;if(!inView||document.hidden)return;
    const dt=Math.min(.05,(now-last)/1000||.016);last=now;
    const target=Math.max(userDraw,clamp(progress*2.2,0,1));
    draw+= (target-draw)*(reduced.matches?1:1-Math.exp(-dt*6));
    const mobile=width<600;
    model.rotation.set(.12+(paused||reduced.matches?0:pointerY*.06),-.28+(paused||reduced.matches?0:pointerX*.11),.48-progress*.5);
    const scale=mobile?.83:1.15;
    model.scale.setScalar(scale*(1-progress*.29));
    model.position.set(mobile?.8:.2, .12+progress*1.9,0);
    blade.position.x=draw*1.1;sheath.position.x=-draw*3.5;
    sheath.position.y=-draw*.16;
    renderer.render(scene,camera);
    stage.classList.add('is-ready');
    // No idle animation loop: render only while moving toward an interaction target.
    if(Math.abs(target-draw)>.001)requestRender();
  }
  const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView){last=0;requestRender();}else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'80px'});observer.observe(opening);
  new ResizeObserver(resize).observe(stage);
  window.addEventListener('scroll',scroll,{passive:true});
  reduced.addEventListener('change',scroll);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else requestRender();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stage.classList.remove('is-ready');cancelAnimationFrame(frame);frame=0;});
  canvas.addEventListener('webglcontextrestored',()=>{resize();scroll();});
  resize();scroll();
})();

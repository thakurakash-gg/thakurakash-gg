/* The supplied architecture is preserved in the optimized model; additions are landscape and lighting. */
(()=>{'use strict';const T=window.THREE,P=window.RayWorld.prototype;
P.createLand=function(){};
P.createVegetation=function(){};
P.createBuilding=function(){
 this.canvas.dataset.building='loading';this.buildingReady=new Promise((resolve,reject)=>{
  const loader=new window.RayGLTFLoader();loader.setMeshoptDecoder(window.RayMeshoptDecoder);
  const mobile=innerWidth<700||matchMedia('(pointer:coarse)').matches;this.canvas.dataset.modelDetail=mobile?'mobile':'desktop';loader.load('assets/ray-building'+(mobile?'-mobile':'')+'.glb?v=source-8',gltf=>{
   const root=gltf.scene;root.name='RAY supplied architecture';root.rotation.y=-Math.PI/2;root.position.y=1.25;this.modelMaterials=new Set();
   root.traverse(mesh=>{if(!mesh.isMesh)return;mesh.receiveShadow=true;mesh.castShadow=true;for(const mat of(Array.isArray(mesh.material)?mesh.material:[mesh.material])){
    if(this.modelMaterials.has(mat))continue;this.modelMaterials.add(mat);mat.envMapIntensity=.9;if(mat.map)mat.map.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
    if(/glass/i.test(mat.name)){mat.depthWrite=false;mat.roughness=.18;mat.envMapIntensity=1.35;}
    if(/windows/i.test(mat.name)){mat.color.set(0x516c73);mat.metalness=.44;mat.roughness=.24;mat.emissive.set(0x000000);mat.envMapIntensity=1.3;this.roomMaterial(mat);}
    if(/emmis/i.test(mat.name)){mat.userData.rayLamp=true;mat.emissiveIntensity=.1;}
    if(/grass/i.test(mat.name)){mat.roughness=1;mat.color.multiply(new T.Color(0xb8c6a0));}
   }});
   this.scene.add(root);this.modelRoot=root;this.decorateArchitecture();this.flush();this.renderer.shadowMap.needsUpdate=true;this.lastMirror=0;this.canvas.dataset.building='source-model';this.canvas.dataset.buildingSize='207.2 × 87.7 m';document.getElementById('terrain-status').hidden=true;document.getElementById('load-state').hidden=true;this.wake();resolve(root);
  },event=>{const status=document.getElementById('terrain-status');status.hidden=false;status.textContent=event.total?'Preparing the architecture · '+Math.round(event.loaded/event.total*100)+'%':'Preparing the architecture…';},error=>{const status=document.getElementById('terrain-status');status.hidden=false;status.textContent='The architecture could not load. Refresh to try again.';this.canvas.dataset.building='error';console.error('RAY architecture load failed',error);reject(error);});
 });this.buildingReady.catch(()=>{});
};
P.roomMaterial=function(mat){mat.onBeforeCompile=shader=>{
 shader.uniforms.rayRoomNight=this.skyUniforms.night;shader.vertexShader='varying vec3 rayRoomWorld;varying vec3 rayRoomNormal;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nrayRoomWorld=(modelMatrix*vec4(transformed,1.)).xyz;rayRoomNormal=normalize(mat3(modelMatrix)*normal);');
 shader.fragmentShader='uniform float rayRoomNight;varying vec3 rayRoomWorld;varying vec3 rayRoomNormal;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 vec3 face=abs(normalize(rayRoomNormal));float u=face.x>face.z?rayRoomWorld.z:rayRoomWorld.x;vec2 room=vec2(u/3.15,(rayRoomWorld.y-1.25)/3.465);vec2 cell=floor(room);float choice=fract(sin(dot(cell,vec2(41.73,93.27)))*43758.5453);vec3 eye=normalize(cameraPosition-rayRoomWorld);vec2 inside=fract(room+vec2((eye.x+eye.z)*.06,eye.y*.04));float curtains=smoothstep(.03,.15,inside.x)*(1.-smoothstep(.86,.98,inside.x));float ceiling=smoothstep(.72,.92,inside.y)*.4+.45;float furniture=1.-step(.25,inside.x)*step(inside.x,.78)*step(.18,inside.y)*step(inside.y,.31)*.6;float lit=step(.56,choice);vec3 warmth=mix(vec3(.95,.69,.37),vec3(.74,.82,.77),step(.86,choice));totalEmissiveRadiance+=warmth*lit*curtains*ceiling*furniture*(.018+rayRoomNight*1.3);
 `);
 };};
P.decorateArchitecture=function(){
 const d=window.RayBuildingLandscape||{plants:[],roofPlanters:[]};this.elevation=0;
 for(const[x,z,y,palm,size]of d.plants){this.shrub(x,z,size,y+.08);if(palm)this.palm(x,z,3.5+size*2,y+.1);}
 const roof=70.82;d.roofPlanters.forEach(([x,z,yaw],i)=>{this.box('ivory',x,roof+.29,z,2.7,.55,1.1,yaw);this.box('grassdark',x,roof+.59,z,2.46,.12,.88,yaw);this.shrub(x,z,.8,roof+.65);if(i%8===0)this.palm(x,z,2.5,roof+.65);});
 for(const cx of[-64,-32,32,64]){this.slab('source-roof-teak-deck',cx,roof+.035,-9,12.5,11,.09,.25,'wood');for(const x of[cx-5.5,cx+5.5])for(const z of[-13.8,-4.2])this.box('bronze',x,roof+1.45,z,.12,2.8,.12);for(let x=cx-5.7;x<=cx+5.7;x+=.4)this.box('wood',x,roof+2.9,-9,.10,.13,10.3);for(const dx of[-3,3]){this.box('wood',cx+dx,roof+.2,3.5,1.3,.16,2.6);this.box('white',cx+dx,roof+.34,3.5,1.18,.12,2.45);this.box('bronze',cx+dx,roof+.1,3.5,1,.18,2.1);}}
 this.slab('source-pool-water',0,21.49,9.8,25.4,8.5,.025,.8,'pool');
 this.canvas.dataset.sourcePlanting=String(d.plants.length);this.canvas.dataset.roofPlanters=String(d.roofPlanters.length);
};
const originalUpdate=P.updateLight;
P.updateLight=function(dt){const moving=originalUpdate.call(this,dt);if(this.modelMaterials)for(const mat of this.modelMaterials){mat.envMapIntensity=(/glass|windows/i.test(mat.name)?1.25:.9)*(1-this.lightState.night*.83);if(mat.userData.rayLamp)mat.emissiveIntensity=.035+this.lightState.night*1.3;}return moving;};
})();

/* Native-authored Odaiba geometry, with distance-based foliage for the web preview. */
(() => {
 'use strict';
 const T=window.THREE,P=window.LiveEnvironment.prototype,VERSION='2.0.0';
 const root='assets/live/production/';
 P.loadModel=function(file){return new Promise((resolve,reject)=>{const l=new window.RayGLTFLoader();l.setMeshoptDecoder(window.RayMeshoptDecoder);l.load(root+file+'?v='+VERSION,resolve,undefined,reject);});};
 P.photo=function(file,linear=false){return new Promise((resolve,reject)=>new T.TextureLoader().load(root+file+'?v='+VERSION,t=>{t.flipY=false;t.colorSpace=linear?T.NoColorSpace:T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());resolve(t);},undefined,reject));};
 P.worldSurface=function(name,map,normal,tile=3){
  const m=new T.MeshStandardMaterial({name,map,normalMap:normal,normalScale:new T.Vector2(.65,-.65),roughness:.9});
  m.onBeforeCompile=shader=>{
   shader.uniforms.groundTile={value:tile};
   shader.vertexShader='varying vec3 prodWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nprodWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   shader.fragmentShader='varying vec3 prodWorld;uniform float groundTile;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','diffuseColor*=texture2D(map,prodWorld.xz/groundTile);');
  };
  m.customProgramCacheKey=()=>name+'-production-2';this.materials.push(m);return m;
 };
 P.parkSurface=function(grass,paving,mask,geo){
  const m=this.worldSurface('Shiokaze / 4K source surfaces',grass.Diffuse,grass.nor_dx,2.7),original=m.onBeforeCompile;
  m.onBeforeCompile=shader=>{
   original(shader);
   shader.uniforms.parkPaving={value:paving.Diffuse};shader.uniforms.coverMask={value:mask};
   shader.uniforms.coverBounds={value:new T.Vector4(...geo.context.bounds)};
   shader.fragmentShader='uniform sampler2D parkPaving,coverMask;uniform vec4 coverBounds;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('diffuseColor*=texture2D(map,prodWorld.xz/groundTile);',`
     vec2 coverUv=(prodWorld.xz-coverBounds.xy)/(coverBounds.zw-coverBounds.xy);
     float grassCover=texture2D(coverMask,coverUv).r;
     grassCover=max(grassCover,1.-smoothstep(66.,67.,distance(prodWorld.xz,vec2(-30.,285.))));
     vec3 grassA=texture2D(map,prodWorld.xz/2.7).rgb;
     vec3 grassB=texture2D(map,prodWorld.xz/4.31+vec2(.37)).rgb;
     float macro=.5+.22*sin(prodWorld.x*.05)*sin(prodWorld.z*.067);
     vec3 grassColour=mix(grassA,grassB,macro)*mix(vec3(.30,.60,.32),vec3(.48,.72,.40),macro);
     diffuseColor.rgb*=mix(texture2D(parkPaving,prodWorld.xz/3.).rgb,grassColour,grassCover);
   `);
  };
  m.customProgramCacheKey=()=> 'shiokaze-landcover-2';return m;
 };
 P.registeredSurface=function(context,detail,geo){
  const m=new T.MeshStandardMaterial({name:'Registered GSI / PLATEAU aerial',roughness:.96});
  m.onBeforeCompile=shader=>{
   shader.uniforms.orthoContext={value:context};shader.uniforms.orthoDetail={value:detail};
   shader.uniforms.contextBounds={value:new T.Vector4(...geo.context.bounds)};shader.uniforms.detailBounds={value:new T.Vector4(...geo.detail.bounds)};
   shader.vertexShader='varying vec3 prodWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nprodWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   shader.fragmentShader='varying vec3 prodWorld;uniform sampler2D orthoContext,orthoDetail;uniform vec4 contextBounds,detailBounds;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
    vec2 c=(prodWorld.xz-contextBounds.xy)/(contextBounds.zw-contextBounds.xy);
    vec2 d=(prodWorld.xz-detailBounds.xy)/(detailBounds.zw-detailBounds.xy);
    vec2 e=min(d,1.-d);float blend=smoothstep(0.,.018,min(e.x,e.y));
    diffuseColor.rgb*=mix(texture2D(orthoContext,c).rgb,texture2D(orthoDetail,clamp(d,.001,.999)).rgb,blend);
   `);
  };
  m.customProgramCacheKey=()=> 'registered-tokyo-2';this.materials.push(m);return m;
 };
 P.prepareMesh=function(rootNode){
  rootNode.updateMatrixWorld(true);
  rootNode.traverse(o=>{if(!o.isMesh)return;o.receiveShadow=true;o.castShadow=true;
   for(const m of Array.isArray(o.material)?o.material:[o.material]){
    if(m.map)m.map.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
    if(/Prod_Grass|Landscape_Lawn/.test(m.name)){
     o.material=this.parkMaterial;o.castShadow=false;this.surfaceUV(o.geometry,2.7,o.matrixWorld);
    }else if(/Prod_Paving/.test(m.name)){
     o.material=this.pavingMaterial;o.castShadow=false;this.surfaceUV(o.geometry,3.,o.matrixWorld);
    }else if(/Prod_Road|Infra_Asphalt/.test(m.name)){
     o.material=this.roadMaterial;o.castShadow=false;this.surfaceUV(o.geometry,4.,o.matrixWorld);
    }else{
     m.roughness=Math.max(.3,m.roughness);this.materials.push(m);
     if(/Prod_Canopy/.test(m.name))m.side=T.DoubleSide;
     if(/Infra_Glass/.test(m.name)){m.side=T.DoubleSide;m.color.set('#57717e');m.roughness=.25;m.metalness=.4;}
    }
   }
  });
 };
 P.surfaceUV=function(g,tile,matrix){
  const pos=g.getAttribute('position'),uv=new Float32Array(pos.count*2),p=new T.Vector3();
  for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i);if(matrix)p.applyMatrix4(matrix);uv[i*2]=p.x/tile;uv[i*2+1]=p.z/tile;}
  g.setAttribute('uv',new T.BufferAttribute(uv,2));
 };
 P.loadSourceContext=async function(){
  this.quality.contactShading=false;
  document.getElementById('load-message').textContent='Loading the detailed Odaiba venue';
  const names=['Production_Site','Production_ParkGround','Production_Yurikamome','Production_LocalBridges','Production_HotelFacades','Production_Washingtonia_0','Production_Washingtonia_1','Production_CoastalPine_0','Production_CoastalPine_1'].filter(n=>!this.quality.compact||n!=='Production_HotelFacades');
  const [city,ground,geo,plants,south,impostors,context,detail,mask,...loaded]=await Promise.all([
   this.loadModel(this.quality.compact?'tokyo-city-v2-mobile.glb':'tokyo-city-v2.glb'),
   new Promise((resolve,reject)=>{const l=new window.RayGLTFLoader();l.setMeshoptDecoder(window.RayMeshoptDecoder);l.load('assets/live/models/tokyo-ground.glb',resolve,undefined,reject);}),
   fetch(root+'registration.json?v='+VERSION).then(r=>r.json()),
   fetch(root+'planting-v2.json?v='+VERSION).then(r=>r.json()),
   fetch(root+'planting-southern.json?v='+VERSION).then(r=>r.json()),
   fetch(root+'tree-impostors.json?v='+VERSION).then(r=>r.json()),
   this.photo('registered-context.webp'),this.photo('registered-detail.webp'),this.photo('landcover-mask.png',true),
   ...names.map(n=>this.loadModel(n+(this.quality.compact&&/Washingtonia|CoastalPine/.test(n)?'-mobile':'')+'.glb'))
  ]);
  const surfaces={};
  for(const name of ['leafy_grass','concrete_pavement','asphalt_02']){
   const [Diffuse,nor_dx]=await Promise.all([this.photo(name+'-Diffuse.webp'),this.photo(name+'-nor_dx.webp',true)]);surfaces[name]={Diffuse,nor_dx};
  }
  this.parkMaterial=this.parkSurface(surfaces.leafy_grass,surfaces.concrete_pavement,mask,geo);
  this.pavingMaterial=this.worldSurface('Park / concrete paving',surfaces.concrete_pavement.Diffuse,surfaces.concrete_pavement.nor_dx,3);
  this.roadMaterial=this.worldSurface('Tokyo / asphalt',surfaces.asphalt_02.Diffuse,surfaces.asphalt_02.nor_dx,4);
  ground.scene.traverse(o=>{if(o.isMesh){o.material=this.registeredSurface(context,detail,geo);o.receiveShadow=true;o.castShadow=false;}});
  this.scene.add(ground.scene);this.cityMaterials=[];
  city.scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
   for(const m of Array.isArray(o.material)?o.material:[o.material]){m.roughness=.78;m.metalness=.04;m.envMapIntensity=.7;if(m.map)m.map.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());this.cityMaterials.push(m);this.materials.push(m);}
  });this.scene.add(city.scene);
  this.foliageSources={};
  loaded.forEach((g,i)=>{const name=names[i];
   if(/Washingtonia|CoastalPine/.test(name)){g.scene.updateMatrixWorld(true);this.foliageSources[name]=g.scene;return;}
   g.scene.name=name;this.prepareMesh(g.scene);this.scene.add(g.scene);
  });
  this.treeMeta=impostors;this.planting=plants.trees.filter((_,i)=>!this.quality.compact||i%3===0);this.southPlanting=south;
  this.treeAtlases=await Promise.all(impostors.map(info=>new Promise((resolve,reject)=>new T.TextureLoader().load(root+info.atlas+'?v='+VERSION,t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());resolve(t);},undefined,reject))));
  this.sun.target.position.set(-30,3,230);this.canvas.dataset.source='PLATEAU-registered-Odaiba-v2';this.canvas.dataset.contextTrees=String(this.planting.length);
 };
 P.buildBuildings=async function(){};
 P.buildRoads=function(){};
 P.buildVegetation=function(){
  this.treePools=[];this.treeNear=[];this.treeLastCamera=new T.Vector3(1e6,0,1e6);this.treeLastTime=-1;
  for(let species=0;species<2;species++){
   const meta=this.treeMeta[species],geo=new T.PlaneGeometry(meta.width,meta.height);geo.translate(0,meta.height/2+meta.bottom,0);
   for(let frame=0;frame<4;frame++){
    const map=this.treeAtlases[species].clone();map.needsUpdate=true;map.repeat.set(.25,1);map.offset.set(frame*.25,0);
    const mat=new T.MeshBasicMaterial({map,alphaTest:.36,side:T.DoubleSide,color:'#e4ebe0'}),mesh=new T.InstancedMesh(geo,mat,this.planting.length);mesh.count=0;mesh.frustumCulled=false;mesh.name='Coastal canopy / distant view';this.scene.add(mesh);this.treePools.push({species,frame,mesh});
   }
  }
  for(const [kind,prefix] of [['palm','Production_Washingtonia_'],['pine','Production_CoastalPine_']]){
   for(let variant=0;variant<2;variant++){
    const src=this.foliageSources[prefix+variant],rows=this.southPlanting[kind].filter(r=>r[2]===variant),dummy=new T.Object3D();
    src.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld),mat=o.material;
     for(const m of Array.isArray(mat)?mat:[mat]){m.side=T.DoubleSide;this.materials.push(m);}
     const inst=new T.InstancedMesh(g,mat,rows.length);inst.castShadow=!this.quality.compact;inst.receiveShadow=true;
     rows.forEach(([x,z,_,scale,angle],i)=>{dummy.position.set(x,.44,z);dummy.rotation.set(0,angle,0);dummy.scale.setScalar(scale);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});inst.computeBoundingSphere();this.scene.add(inst);
    });
   }
  }
 };
 P.updateTreeLods=function(time,camera){
  if(!this.treePools)return;
  const night=this.night.value;
  for(const p of this.treePools)p.mesh.material.color.setRGB(1-night*.72,1-night*.66,1-night*.55);
  if(time-this.treeLastTime<.45&&this.treeLastCamera.distanceToSquared(camera.position)<9)return;
  this.treeLastTime=time;this.treeLastCamera.copy(camera.position);const lists=this.treePools.map(()=>[]),nearLists=[[],[]],dummy=new T.Object3D();
  for(const row of this.planting){const [x,z,species,scale,angle]=row,d=Math.hypot(camera.position.x-x,camera.position.z-z);
   if(d<(this.quality.compact?28:48)&&this.treeNear.length){nearLists[species].push(row);continue;}
   let az=(Math.atan2(camera.position.z-z,camera.position.x-x)-angle)%(Math.PI*2);if(az<0)az+=Math.PI*2;const f=Math.floor(az/(Math.PI/2)+.5)%4;lists[species*4+f].push(row);
  }
  this.treePools.forEach((pool,index)=>{const rows=lists[index];pool.mesh.count=rows.length;rows.forEach(([x,z,_,scale],i)=>{dummy.position.set(x,.44,z);dummy.rotation.set(0,Math.atan2(camera.position.x-x,camera.position.z-z),0);dummy.scale.setScalar(scale);dummy.updateMatrix();pool.mesh.setMatrixAt(i,dummy.matrix);});pool.mesh.instanceMatrix.needsUpdate=true;});
  this.treeNear.forEach(pool=>{const rows=nearLists[pool.species];pool.mesh.count=rows.length;rows.forEach(([x,z,_,scale,angle],i)=>{dummy.position.set(x,.44,z);dummy.rotation.set(0,angle,0);dummy.scale.setScalar(scale);dummy.updateMatrix();pool.mesh.setMatrixAt(i,dummy.matrix);});pool.mesh.instanceMatrix.needsUpdate=true;});
 };
 P.loadNearTrees=async function(){
  if(this.quality.compact)return;
  const sources=await Promise.all([this.loadModel('island_tree_01-near.glb'),this.loadModel('island_tree_02-near.glb')]);
  sources.forEach((g,species)=>{g.scene.updateMatrixWorld(true);g.scene.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone().applyMatrix4(o.matrixWorld),mat=o.material;for(const m of Array.isArray(mat)?mat:[mat]){m.side=T.DoubleSide;m.alphaTest=Math.max(m.alphaTest,.35);this.materials.push(m);}const mesh=new T.InstancedMesh(geo,mat,this.planting.length);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;this.scene.add(mesh);this.treeNear.push({species,mesh});});});this.treeLastTime=-10;
 };
 const update=P.update;
 P.update=function(time,night,camera){update.call(this,time,night,camera);this.updateTreeLods(time,camera);};
})();

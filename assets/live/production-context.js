/* Native-authored Odaiba geometry, with distance-based foliage for the web preview. */
(() => {
 'use strict';
 const T=window.THREE,P=window.LiveEnvironment.prototype,VERSION='2.1.0';
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
     if(/Prod_Canopy|Finish_Canopy|Finish_Velour/.test(m.name))m.side=T.DoubleSide;
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
  this.quality.contactShading=false;this.distanceFogDensity=.00065;
  document.getElementById('load-message').textContent='Loading the detailed Odaiba venue';
  const names=['Production_Site','Production_ParkGround','Production_Yurikamome','Production_LocalBridges','Production_HotelFacades','Production_Washingtonia_0','Production_Washingtonia_1','Production_CoastalPine_0','Production_CoastalPine_1'].filter(n=>n!=='Production_HotelFacades'&&!/CoastalPine/.test(n));
  const [city,ground,geo,plants,south,context,detail,mask,...loaded]=await Promise.all([
   this.loadModel(this.quality.compact?'tokyo-city-atlas-mobile.glb':'tokyo-city-atlas-desktop.glb'),
   new Promise((resolve,reject)=>{const l=new window.RayGLTFLoader();l.setMeshoptDecoder(window.RayMeshoptDecoder);l.load('assets/live/models/tokyo-ground.glb',resolve,undefined,reject);}),
   fetch(root+'registration.json?v='+VERSION).then(r=>r.json()),
   fetch(root+'planting-fixed.json?v='+VERSION).then(r=>r.json()),
   fetch(root+'planting-southern-fixed.json?v='+VERSION).then(r=>r.json()),
   this.photo('registered-context.webp'),this.photo('registered-detail.webp'),this.photo('landcover-mask-web.webp',true),
   ...names.map(n=>this.loadModel(n+(/Washingtonia|CoastalPine/.test(n)?'-mobile':'')+'.glb'))
  ]);
  const surfaces={};
  for(const name of ['leafy_grass','concrete_pavement','asphalt_02']){
   const [Diffuse,nor_dx]=await Promise.all([this.photo(name+'-Diffuse-web.webp'),this.photo(name+'-nor_dx.webp',true)]);surfaces[name]={Diffuse,nor_dx};
  }
  this.parkMaterial=this.parkSurface(surfaces.leafy_grass,surfaces.concrete_pavement,mask,geo);
  this.pavingMaterial=this.worldSurface('Park / concrete paving',surfaces.concrete_pavement.Diffuse,surfaces.concrete_pavement.nor_dx,3);
  this.roadMaterial=this.worldSurface('Tokyo / asphalt',surfaces.asphalt_02.Diffuse,surfaces.asphalt_02.nor_dx,4);
  ground.scene.traverse(o=>{if(o.isMesh){o.material=this.registeredSurface(context,detail,geo);o.receiveShadow=true;o.castShadow=false;}});
  this.scene.add(ground.scene);this.cityMaterials=[];
  city.scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
   const source=o.material,mat=new T.MeshLambertMaterial({map:source.map,color:source.color,vertexColors:true});o.material=mat;this.cityMaterials.push(mat);if(mat.map)mat.map.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());this.materials.push(mat);
  });this.scene.add(city.scene);
  this.foliageSources={};
  loaded.forEach((g,i)=>{const name=names[i];
   if(/Washingtonia|CoastalPine/.test(name)){g.scene.updateMatrixWorld(true);this.foliageSources[name]=g.scene;return;}
   g.scene.name=name;this.prepareMesh(g.scene);this.scene.add(g.scene);
  });
  this.planting=plants.trees;this.southPlanting=south;
  this.treeMeta=await fetch(root+'tree-impostors.json?v='+VERSION).then(r=>r.json());
  this.treeAtlases=await Promise.all(this.treeMeta.map(info=>new Promise((resolve,reject)=>new T.TextureLoader().load(root+info.atlas+'?v='+VERSION,t=>{t.colorSpace=T.SRGBColorSpace;resolve(t);},undefined,reject))));
  this.sun.target.position.set(-30,3,230);this.canvas.dataset.source='PLATEAU-registered-Odaiba-v2';this.canvas.dataset.contextTrees=String(this.planting.length);
 };
 P.buildBuildings=async function(){};
 P.buildRoads=function(){};

 // Web-only trees: opaque, instanced canopy meshes. Unreal keeps its library assets.
 P.buildVegetation=function(){
  this.webTreeMeshes=[];
  this.treeCards=[];this.treeCardTime=-10;this.treeCardCamera=new T.Vector3(1e6,0,1e6);
  for(let species=0;species<2;species++)for(let frame=0;frame<4;frame++){
   const meta=this.treeMeta[species],geo=new T.PlaneGeometry(meta.width,meta.height);geo.translate(0,meta.height/2+meta.bottom,0);
   const map=this.treeAtlases[species].clone();map.repeat.set(.25,1);map.offset.set(frame*.25,0);map.needsUpdate=true;
   const mat=new T.MeshBasicMaterial({map,alphaTest:.4,side:T.DoubleSide,color:'#d5dfcc'}),mesh=new T.InstancedMesh(geo,mat,this.planting.length);mesh.count=0;mesh.frustumCulled=false;this.scene.add(mesh);this.treeCards.push({species,frame,mesh});
  }
  const trunk=new T.CylinderGeometry(.13,.23,3.0,6,1);trunk.translate(0,1.5,0);
  const bark=new T.MeshLambertMaterial({color:'#665a46'});
  this.materials.push(bark);
  const canopies=[0,1].map(species=>{
   const positions=[],normals=[],colours=[];
   const clusters=species===0?[[0,4,0,1.7],[1.05,3.5,.2,1.35],[-.95,3.6,.1,1.4],[.1,3.55,-1,1.3]]:[[0,4.1,0,1.45],[.9,3.4,.1,1.4],[-.8,3.5,.1,1.35],[0,3.5,-.9,1.3]];
   for(const [x,y,z,r] of clusters){
    const g=new T.IcosahedronGeometry(r,1),p=g.getAttribute('position'),n=g.getAttribute('normal');
    for(let i=0;i<p.count;i++){
     positions.push(p.getX(i)+x,p.getY(i)+y,p.getZ(i)+z);normals.push(n.getX(i),n.getY(i),n.getZ(i));
     const shade=.80+.17*(p.getY(i)/r+.5)+.08*Math.sin(i*2.4);
     colours.push(shade,shade,shade*.91);
    }g.dispose();
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colours,3));g.computeBoundingSphere();return g;
  });
  const leaves=[new T.MeshLambertMaterial({color:'#67814b',vertexColors:true}),new T.MeshLambertMaterial({color:'#506f43',vertexColors:true})];this.materials.push(...leaves);
  const chunks=new Map(),dummy=new T.Object3D();
  for(const row of this.planting){const key=String(row[2]);if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(row);}
  for(const rows of chunks.values()){
   const species=rows[0][2]%2;
   for(const [g,m] of [[canopies[species],leaves[species]],[trunk,bark]]){
    const mesh=new T.InstancedMesh(g,m,rows.length);mesh.name='Web canopy / low polygon';mesh.castShadow=false;mesh.receiveShadow=true;
    rows.forEach(([x,z,_,scale,angle],i)=>{dummy.position.set(x,.44,z);dummy.rotation.set(0,angle,0);dummy.scale.setScalar(Math.min(2.3,scale));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    mesh.computeBoundingSphere();this.scene.add(mesh);this.webTreeMeshes.push(mesh);
   }
  }
  for(const [kind,prefix] of [['palm','Production_Washingtonia_']]){
   for(let variant=0;variant<2;variant++){
    const src=this.foliageSources[prefix+variant],rows=this.southPlanting[kind].filter(r=>r[2]===variant);
    src.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld),mat=o.material;
     for(const m of Array.isArray(mat)?mat:[mat]){m.side=T.DoubleSide;this.materials.push(m);}
     const inst=new T.InstancedMesh(g,mat,rows.length);inst.castShadow=false;inst.receiveShadow=true;
     rows.forEach(([x,z,_,scale,angle],i)=>{dummy.position.set(x,.44,z);dummy.rotation.set(0,angle,0);dummy.scale.setScalar(scale);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});inst.computeBoundingSphere();this.scene.add(inst);
    });
   }
  }
 };
 P.loadNearTrees=async function(){};
 const baseUpdate=P.update;
 P.update=function(time,night,camera){
  baseUpdate.call(this,time,night,camera);if(!this.treeCards)return;
  const aerial=camera.position.y>55;for(const mesh of this.webTreeMeshes)mesh.visible=aerial;
  for(const pool of this.treeCards){pool.mesh.visible=!aerial;pool.mesh.material.color.setRGB(1-night*.72,1-night*.66,1-night*.55);}
  if(aerial||time-this.treeCardTime<.45&&this.treeCardCamera.distanceToSquared(camera.position)<9)return;
  this.treeCardTime=time;this.treeCardCamera.copy(camera.position);const lists=this.treeCards.map(()=>[]),dummy=new T.Object3D();
  for(const row of this.planting){
   const [x,z,species,scale,angle]=row;let az=(Math.atan2(camera.position.z-z,camera.position.x-x)-angle)%(Math.PI*2);if(az<0)az+=Math.PI*2;
   lists[species*4+Math.floor(az/(Math.PI/2)+.5)%4].push(row);
  }
  this.treeCards.forEach((pool,i)=>{const rows=lists[i];pool.mesh.count=rows.length;rows.forEach(([x,z,_,scale],j)=>{dummy.position.set(x,.44,z);dummy.rotation.set(0,Math.atan2(camera.position.x-x,camera.position.z-z),0);dummy.scale.setScalar(scale);dummy.updateMatrix();pool.mesh.setMatrixAt(j,dummy.matrix);});pool.mesh.instanceMatrix.needsUpdate=true;});
 };
})();

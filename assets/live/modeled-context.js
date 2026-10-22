/* Authored Tokyo source scene. Geographic origin: 139.76935 E, 35.62635 N. */
(() => {
  'use strict';
  const T=window.THREE,P=window.LiveEnvironment.prototype;
  P.loadModel=function(file){return new Promise((resolve,reject)=>{const loader=new window.RayGLTFLoader();loader.setMeshoptDecoder(window.RayMeshoptDecoder);loader.load('assets/live/models/'+file+'?v=1.2.5',resolve,undefined,reject);});};
  P.loadSourceContext=async function(){
    document.getElementById('load-message').textContent='Loading the modeled Tokyo waterfront';
    const [city,ground,trees,plants,gardens]=await Promise.all([
      this.loadModel(this.quality.compact?'tokyo-city-mobile.glb':'tokyo-city-web.glb'),
      this.loadModel('tokyo-ground.glb'),this.loadModel('tokyo-botanical.glb'),
      fetch('assets/live/models/vegetation.json?v=1.2.5').then(r=>{if(!r.ok)throw new Error('The park planting could not load.');return r.json();}),this.loadModel('tokyo-gardens.glb')
    ]);
    gardens.scene.traverse(o=>{if(o.isMesh){o.material=this.grass;o.receiveShadow=true;}});this.scene.add(gardens.scene);
    this.treeLibrary=trees.scene;this.planting=plants;this.cityMaterials=[];
    for(const [name,root] of [['Tokyo / PLATEAU 2025',city.scene],['Shiokaze / source landscape',ground.scene]]){
      root.name=name;root.traverse(o=>{if(!o.isMesh)return;o.castShadow=name.startsWith('Tokyo');o.receiveShadow=true;
        for(const m of Array.isArray(o.material)?o.material:[o.material]){
          m.roughness=.82;m.metalness=0;m.envMapIntensity=.65;
          if(m.map)m.map.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
          if(name.startsWith('Tokyo')){
            this.cityMaterials.push(m);
            // Light selected glazing only; facade photographs retain their own detail.
            m.onBeforeCompile=shader=>{
              shader.uniforms.tokyoNight=this.night;
              shader.vertexShader='varying vec3 tokyoWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ntokyoWorld=(modelMatrix*vec4(transformed,1.)).xyz;');shader.fragmentShader='uniform float tokyoNight;varying vec3 tokyoWorld;\n'+shader.fragmentShader;
              shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
                float glazing=step(diffuseColor.r*1.1,diffuseColor.b)*step(diffuseColor.r*1.025,diffuseColor.g)*(1.-smoothstep(.15,.36,diffuseColor.g));vec3 room=floor(tokyoWorld/3.4);float occupied=step(.72,fract(sin(dot(room,vec3(12.9898,78.233,37.719)))*43758.5453));float bands=step(.22,fract(tokyoWorld.y/3.4))*step(fract(tokyoWorld.y/3.4),.8);glazing*=occupied*bands;
                totalEmissiveRadiance+=vec3(.85,.60,.26)*glazing*tokyoNight*.24;`);
            };m.customProgramCacheKey=()=> 'tokyo-photo-glazing-123';
          }
          this.materials.push(m);
        }
      });this.scene.add(root);
    }
    this.canvas.dataset.source='PLATEAU-2025-textured-LOD2';
    this.canvas.dataset.contextBuildings=String(city.scene.children.length);
  };
  P.buildBuildings=async function(){};
  P.buildVegetation=function(){
    const placements=this.planting.filter((p,i)=>{const dx=p[0]-50,dz=p[1]-330,lx=Math.cos(-.961592653589793)*dx-Math.sin(-.961592653589793)*dz,lz=Math.sin(-.961592653589793)*dx+Math.cos(-.961592653589793)*dz;return !(Math.abs(lx)<72&&lz>-38&&lz<125)&&(!this.quality.compact||i%2===0);}),dummy=new T.Object3D();
    this.treeLibrary.traverse(source=>{
      if(!source.isMesh)return;
      const match=source.name.match(/broadleaf[_ ](\d)/);if(!match)return;
      const species=Number(match[1]),list=placements.filter(p=>p[2]===species),mat=source.material;
      for(const m of Array.isArray(mat)?mat:[mat]){m.side=T.DoubleSide;m.roughness=.88;m.envMapIntensity=.9;if(m.name.startsWith('CoastalCanopy')){m.transparent=false;m.alphaTest=.42;m.depthWrite=true;m.color.setRGB(1.5,1.7,1.3);m.emissive.setRGB(.1,.14,.06);m.emissiveMap=m.map;m.emissiveIntensity=.6;}this.materials.push(m);}
      const tree=new T.InstancedMesh(source.geometry,mat,list.length);tree.name=source.name;tree.castShadow=true;tree.receiveShadow=true;
      list.forEach(([x,z,_,scale,angle],i)=>{dummy.position.set(x,.48,z);dummy.rotation.set(0,angle,0);dummy.scale.setScalar(scale);dummy.updateMatrix();tree.setMatrixAt(i,dummy.matrix);});
      tree.computeBoundingSphere();this.scene.add(tree);
    });
    this.canvas.dataset.contextTrees=String(placements.length);this.canvas.dataset.vegetation='modeled-coastal-broadleaf';
  };
  const roads=P.buildRoads;
  P.buildRoads=function(){const paths=this.data.paths;this.data.paths=paths.filter(p=>p.points.some(v=>Math.hypot(v[0]-50,v[1]-330)<170));roads.call(this);this.data.paths=paths;};
})();

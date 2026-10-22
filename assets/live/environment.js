/* Tokyo context uses the same PBR, foliage and atmosphere approach as RAY. */
(() => {
  "use strict";
  const T=window.THREE;
  class LiveEnvironment {
    constructor(api){
      Object.assign(this,api); this.canvas=this.renderer.domElement;
      const limited=(navigator.deviceMemory||8)<=4||(navigator.hardwareConcurrency||8)<=4;
      this.quality={compact:limited||innerWidth<700,hdr:this.renderer.capabilities.isWebGL2&&this.renderer.extensions.has('EXT_color_buffer_float'),contactShading:!limited&&innerWidth>=700,contactScale:1};
      this.materials=[];this.night={value:0};this.clockUniform={value:0};this.waterUniforms=[];this.lastMirror=0;this.lastNight=-1;this.lastCamera=new T.Vector3(99999,99999,99999);
      this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
      this.sun.color.set('#ffedcb');this.sun.castShadow=true;this.sun.shadow.mapSize.set(this.quality.compact?2048:4096,this.quality.compact?2048:4096);
      Object.assign(this.sun.shadow.camera,{left:-225,right:225,top:210,bottom:-210,near:1,far:1050});
      this.sun.shadow.bias=-.00013;this.sun.shadow.normalBias=.12;this.sun.shadow.radius=2.5;
      this.sun.target.position.set(80,2,40);this.scene.add(this.sun.target);
      this.fill.color.set('#c6dce6');this.fill.groundColor.set('#a59d7f');
      this.rim=new T.DirectionalLight('#b9d8e6',.4);this.rim.position.set(350,150,-180);this.scene.add(this.rim);
      this.groundMaterials=[];
    }
    rng(){return this.random();}
    texture(kind){
      const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
      if(kind==='leaves'){
        for(let i=0;i<370;i++){
          const a=this.rng()*Math.PI*2,r=Math.sqrt(this.rng())*224;
          x.save();x.translate(256+Math.cos(a)*r,256+Math.sin(a)*r);x.rotate(this.rng()*Math.PI);
          const col=['#869668','#637e4c','#73885a','#465e39','#a1ab7b'][i%5];x.fillStyle=col;
          x.beginPath();x.moveTo(-16,0);x.quadraticCurveTo(0,-9,17,0);x.quadraticCurveTo(0,10,-16,0);x.fill();x.strokeStyle='#b8bd8a';x.lineWidth=.7;x.beginPath();x.moveTo(-12,0);x.lineTo(13,0);x.stroke();x.restore();
        }
      }else if(kind.startsWith('facade')||kind==='emission'){
        const mode=kind.split('-')[1]||'white';x.fillStyle=kind==='emission'?'#000':mode==='glass'?'#748689':mode==='sand'?'#d4d0c2':'#e4e3d8';x.fillRect(0,0,512,512);
        for(let row=0;row<4;row++)for(let col=0;col<4;col++){
          const px=col*128+22,py=row*128+28,lit=((row*17+col*11)%7)<2;
          if(kind==='emission'){if(lit){x.fillStyle=col%2?'#bd9b68':'#bba880';x.fillRect(px+6,py+5,73,73);}continue;}
          x.fillStyle='#9caaa7';x.fillRect(px-3,py-3,93,88);
          const g=x.createLinearGradient(px,py,px+88,py+80);g.addColorStop(0,'#5b7984');g.addColorStop(.48,'#91a7a9');g.addColorStop(.53,'#647e83');g.addColorStop(1,'#435f6b');x.fillStyle=g;x.fillRect(px,py,86,81);
          x.fillStyle=lit?'#bcb9a3':'#7d8d8d';x.fillRect(px+3,py+3,80,12+(row+col)%3*8);
          x.fillStyle='#c4c8c0';x.fillRect(px+42,py,2,81);x.fillRect(px,py+78,86,3);
          x.fillStyle='#8f9b97';x.fillRect(px-5,py+82,97,4);x.fillStyle='#dedfd4';x.fillRect(px-5,py+86,97,3);
        }
      }else if(kind==='shadow'){
        const g=x.createRadialGradient(256,256,10,256,256,256);g.addColorStop(0,'rgba(22,30,20,.5)');g.addColorStop(.45,'rgba(22,30,20,.26)');g.addColorStop(1,'rgba(22,30,20,0)');x.fillStyle=g;x.fillRect(0,0,512,512);
      }else{
        const base=kind==='grass'?[127,140,99]:kind==='asphalt'?[76,81,80]:kind==='roof'?[150,158,152]:kind==='sand'?[193,183,160]:kind==='bark'?[120,109,89]:[190,185,170];
        const pixels=x.createImageData(512,512);
        for(let y=0;y<512;y++)for(let z=0;z<512;z++){
          const i=(y*512+z)*4,macro=Math.sin(z*.027)*Math.cos(y*.019)*3+Math.sin((z+y)*.007)*4,n=(this.rng()-.5)*(kind==='grass'?23:13);
          for(let k=0;k<3;k++)pixels.data[i+k]=base[k]+macro+n;pixels.data[i+3]=255;
        }x.putImageData(pixels,0,0);
        if(kind==='paving'){x.strokeStyle='#8e918777';x.lineWidth=1;for(let y=0;y<512;y+=64){x.beginPath();x.moveTo(0,y);x.lineTo(512,y);x.stroke();for(let z=0;z<512;z+=128)x.strokeRect(z+(y%128?64:0),y,128,64);}}
        if(kind==='bark'){for(let z=0;z<512;z+=7){x.strokeStyle=z%3?'#5e594966':'#bcaf8d88';x.beginPath();x.moveTo(z,0);x.bezierCurveTo(z+8,160,z-6,330,z+3,512);x.stroke();}}
      }
      const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());return tex;
    }
    mat(name,colour,options={}){
      const m=new T.MeshStandardMaterial({color:colour,roughness:.85,...options});m.name='live_'+name;m.userData.castShadow=!['grass','ground','walk','road','marking','sand','shadow'].includes(name);this.materials.push(m);
      m.onBeforeCompile=shader=>{
        shader.uniforms.liveNight=this.night;shader.uniforms.liveTime=this.clockUniform;
        shader.vertexShader='varying vec3 liveWorld;uniform float liveTime;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvec4 lp=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nlp=instanceMatrix*lp;\n#endif\nliveWorld=(modelMatrix*lp).xyz;');
        shader.fragmentShader='varying vec3 liveWorld;uniform float liveNight;\n'+shader.fragmentShader;
        if(['grass','ground','walk','road','sand'].includes(name)){
          shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\ndiffuseColor*=texture2D(map,liveWorld.xz*.16);\n#endif');
        }
      };m.customProgramCacheKey=()=> 'live-pbr-'+name+'-11';return m;
    }
    mesh(geo,mat,x=0,y=0,z=0){const mesh=new T.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.receiveShadow=true;this.scene.add(mesh);return mesh;}
    async build(data){
      this.data=data;const a=this;
      this.ground=this.mat('ground','#d3d2c2',{map:this.texture('paving'),roughness:.96});
      this.grass=this.mat('grass','#ffffff',{map:this.texture('grass'),roughness:1});
      this.walk=this.mat('walk','#e3dfd2',{map:this.texture('paving'),roughness:.9});
      this.road=this.mat('road','#dedfda',{map:this.texture('asphalt'),roughness:.94});
      this.sand=this.mat('sand','#ffffff',{map:this.texture('sand'),roughness:1});
      this.concrete=this.mat('concrete','#d8d9cc',{map:this.texture('roof'),roughness:.9});
      this.marking=this.mat('marking','#dbdbc7',{roughness:.95});
      this.trunkMat=this.mat('bark','#ffffff',{map:this.texture('bark'),roughness:1});
      this.foliage=this.mat('leaves','#bcc8a6',{map:this.texture('leaves'),alphaTest:.43,side:T.DoubleSide,roughness:.97});
      this.foliage.onBeforeCompile=((original)=>shader=>{original(shader);shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x+=sin(liveTime*.6+instanceMatrix[3].x*.13+position.y)*.025*max(0.,position.y);\n#endif');})(this.foliage.onBeforeCompile);
      this.foliage.customProgramCacheKey=()=> 'live-leaves-wind-11';
      this.shadowMat=new T.MeshBasicMaterial({map:this.texture('shadow'),transparent:true,depthWrite:false,opacity:.65});this.shadowMat.userData.castShadow=false;
      this.shadowGeo=new T.PlaneGeometry(1,1);this.shadowGeo.rotateX(-Math.PI/2);
      await this.loadSourceContext();
      this.buildRoads();await this.yieldFrame();await this.buildBuildings();await this.yieldFrame();this.buildVegetation();await this.yieldFrame();this.buildCoast();this.buildLandmarks();this.buildStreetLife();this.createSky();
      window.LiveCreateOcean(this);
      this.canvas.dataset.context='tokyo-modeled-source';this.canvas.dataset.vegetation='modeled-coastal-broadleaf';
    }
    buildRoads(){
      const nodeDiscs=new Set();
      for(const road of this.data.paths){
        const major=!['footway','path','pedestrian'].includes(road.kind),width=road.width|| (major?7:2.5),height=road.bridge?((road.kind==='motorway'&&road.points.some(p=>p[0]<1100&&p[1]<-700))?49:7.5):(major?.52:.55);
        const pts=road.points,mat=major?this.road:this.walk;
        for(let i=1;i<pts.length;i++){
          const [x,z]=pts[i-1],[bx,bz]=pts[i],dx=bx-x,dz=bz-z,len=Math.hypot(dx,dz);if(len<.2)continue;
          if(!road.bridge&&!this.data.land.some(r=>this.inside([(x+bx)/2,(z+bz)/2],r)))continue;
          const yaw=Math.atan2(dx,dz);
          this.box((x+bx)/2,height,(z+bz)/2,width,.1,len+.15,mat,this.scene,[0,yaw,0]);
          if(major&&Math.hypot(x,z)<900){
            // Raised kerbs and occasional centre-line dashes, using mapped alignments.
            for(const side of [-1,1])this.box((x+bx)/2+Math.cos(yaw)*side*(width/2+.18),height+.08,(z+bz)/2-Math.sin(yaw)*side*(width/2+.18),.35,.2,len+.2,this.concrete,this.scene,[0,yaw,0]);
            if(len>7&&width>5)for(let d=2;d<len-1;d+=9)this.box(x+dx*d/len,height+.058,z+dz*d/len,.1,.015,3,this.marking,this.scene,[0,yaw,0]);
          }
          if(!major&&Math.hypot(x,z)<600){
            const key=Math.round(x)+','+Math.round(z);if(!nodeDiscs.has(key)){nodeDiscs.add(key);this.cylinder(x,height,z,width/2,.1,mat,this.scene);}
          }
        }
      }
    }
    facadeMaterial(kind){
      const m=this.mat('facade-'+kind,'#ffffff',{map:this.texture('facade-'+kind),emissiveMap:this.texture('emission'),emissive:'#ffdfb2',emissiveIntensity:0,roughness:.52,metalness:.12,side:T.DoubleSide});
      this.windowMaterials??=[];this.windowMaterials.push(m);return m;
    }
    quad(a,b,height,y,mat,uOffset=0){
      const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=dz/length*.035,nz=-dx/length*.035;
      const vertices=[a[0]+nx,y,a[1]+nz,b[0]+nx,y,b[1]+nz,a[0]+nx,y+height,a[1]+nz,b[0]+nx,y,b[1]+nz,b[0]+nx,y+height,b[1]+nz,a[0]+nx,y+height,a[1]+nz];
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      const u=length/12,v=height/13.6;g.setAttribute('uv',new T.Float32BufferAttribute([uOffset,0,uOffset+u,0,uOffset,v,uOffset+u,0,uOffset+u,v,uOffset,v],2));g.computeVertexNormals();this.queue(g,mat,[0,0,0],[0,0,0],[1,1,1],this.scene);g.dispose();
    }
    yieldFrame(){return new Promise(resolve=>typeof requestAnimationFrame==='function'?requestAnimationFrame(()=>resolve()):setTimeout(resolve,0));}
    async buildBuildings(){
      const facades=[this.facadeMaterial('white'),this.facadeMaterial('sand'),this.facadeMaterial('glass')];
      const roof=this.mat('roof','#c3c7c1',{map:this.texture('roof'),roughness:.88});
      const service=this.mat('service','#a6adaa',{metalness:.2,roughness:.6});
      let total=0;
      for(const b of this.data.buildings){
        const pts=b.points,h=b.h,centre=pts.reduce((r,p)=>[r[0]+p[0]/pts.length,r[1]+p[1]/pts.length],[0,0]),distance=Math.hypot(...centre);
        const close=distance<800,facade=facades[b.id%3];
        // Mapping-only park roofs are kept low, with specific heights retained where known.
        this.planShape(pts,h,roof,this.scene);
        for(let i=1;i<pts.length;i++){
          const a=pts[i-1],c=pts[i],len=Math.hypot(c[0]-a[0],c[1]-a[1]);if(len<.8)continue;
          this.quad(a,c,Math.max(.1,h-.7),.45,facade,(b.id%7)*.25);
          if(close&&len>3&&h>7){
            const yaw=Math.atan2(c[0]-a[0],c[1]-a[1]);
            this.box((a[0]+c[0])/2,h+.16,(a[1]+c[1])/2,.3,.45,len,this.concrete,this.scene,[0,yaw,0]);
            for(let y=3.6;y<h-1;y+=3.4)this.box((a[0]+c[0])/2,y,(a[1]+c[1])/2,.22,.16,len+.12,this.concrete,this.scene,[0,yaw,0]);
          }
        }
        if(close&&h>7){
          for(let j=0;j<2;j++)this.box(centre[0]+j*4,h+.7,centre[1],2.6,1.1,2,service,this.scene);
        }
        total++;
        if(total%180===0)await this.yieldFrame();
      }
      this.canvas.dataset.contextBuildings=String(total);
    }
    leafGeometry(cards=24){
      const positions=[],uv=[];
      for(let i=0;i<cards;i++){
        const az=this.rng()*Math.PI*2,el=Math.acos(2*this.rng()-1),r=.3+this.rng()*.55,center=new T.Vector3(Math.sin(el)*Math.cos(az)*r,Math.cos(el)*r,Math.sin(el)*Math.sin(az)*r),normal=center.clone().normalize(),right=new T.Vector3(-normal.z,0,normal.x).normalize();
        if(right.length()<.1)right.set(1,0,0);const up=new T.Vector3().crossVectors(normal,right).normalize(),size=.48+this.rng()*.3;
        for(const [u,v] of [[-1,-1],[1,-1],[-1,1],[-1,1],[1,-1],[1,1]]){const p=center.clone().addScaledVector(right,u*size).addScaledVector(up,v*size);positions.push(...p.toArray());uv.push(u*.5+.5,v*.5+.5);}
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
    }
    inside(p,ring){let ok=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])ok=!ok;}return ok;}
    lineDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
    buildVegetation(){
      const positions=[],max=this.quality.compact?480:900,validGreens=[...this.data.parks,...(this.data.greens||[]).filter(g=>g.kind!=='beach').map(g=>g.points)];
      const nearbyRoads=this.data.paths.filter(p=>p.points.some(v=>Math.hypot(...v)<1200));
      const nearbyBuildings=this.data.buildings.filter(b=>b.points.some(v=>Math.hypot(...v)<1200));
      for(let i=0;i<18000&&positions.length<max;i++){
        const x=-170+this.rng()*1150,z=-1050+this.rng()*1900;
        if(!this.data.land.some(r=>this.inside([x,z],r)))continue;
        const isGreen=validGreens.some(r=>this.inside([x,z],r));if(!isGreen&&this.rng()>.08)continue;
        const local=new T.Vector3(x-80,0,z-40).applyAxisAngle(new T.Vector3(0,1,0),-2.18);
        if(Math.abs(local.x)<69&&local.z>-33&&local.z<119)continue;
        if(nearbyBuildings.some(b=>this.inside([x,z],b.points)))continue;
        if(nearbyRoads.some(p=>p.points.some((a,j)=>j&&this.lineDistance(x,z,p.points[j-1],a)<(p.width||3)/2+1.8)))continue;
        positions.push([x,z,3.7+this.rng()*3.7,this.rng()]);
      }
      const clusters=this.quality.compact?3:5,leaves=new T.InstancedMesh(this.leafGeometry(this.quality.compact?18:28),this.foliage,positions.length*clusters);
      const trunkGeo=new T.CylinderGeometry(.13,.26,1,7,2),trunks=new T.InstancedMesh(trunkGeo,this.trunkMat,positions.length),dummy=new T.Object3D();
      leaves.castShadow=true;leaves.receiveShadow=true;trunks.castShadow=true;
      positions.forEach(([x,z,size,r],i)=>{
        dummy.position.set(x,.5+size*.65,z);dummy.scale.set(1,size*1.3,1);dummy.rotation.set(0,r*6,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
        for(let c=0;c<clusters;c++){const a=c*2.399+r*2,rad=size*(c===0?.1:.42);
          dummy.position.set(x+Math.cos(a)*rad,.5+size*(1.25+(c%3)*.13),z+Math.sin(a)*rad);dummy.scale.set(size*.7,size*.65,size*.7);dummy.rotation.set(r*.2,a,r*.15);dummy.updateMatrix();leaves.setMatrixAt(i*clusters+c,dummy.matrix);
          leaves.setColorAt(i*clusters+c,new T.Color().setHSL(.23+r*.035,.16+r*.12,.49+r*.13));
        }
        this.queue(this.shadowGeo,this.shadowMat,[x,.51,z],[0,0,0],[size*2.2,1,size*2.2],this.scene);
        for(let n=0;n<2;n++){const a=r*6+n*2.3;this.bar([x,size*.7,z],[x+Math.cos(a)*size*.5,size*1.35,z+Math.sin(a)*size*.5],.08,this.trunkMat,this.scene);}
      });
      this.scene.add(leaves,trunks);this.canvas.dataset.contextTrees=String(positions.length);
      // Low planting beds break up the hard edge between paths and lawns.
      const shrubs=new T.InstancedMesh(this.leafGeometry(12),this.foliage,positions.length),obj=new T.Object3D();
      positions.forEach(([x,z,h,r],i)=>{obj.position.set(x+1.3,.8,z-1);obj.rotation.set(0,r*6,0);obj.scale.set(1.4,.65,1.2);obj.updateMatrix();shrubs.setMatrixAt(i,obj.matrix);shrubs.setColorAt(i,new T.Color('#a7b98b'));});shrubs.castShadow=true;this.scene.add(shrubs);
    }
    buildCoast(){
      for(const line of this.data.coasts||[])for(let i=1;i<line.length;i++){
        const a=line[i-1],b=line[i];if(Math.min(Math.hypot(...a),Math.hypot(...b))>1600)continue;
        const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.2)continue;
        this.box((a[0]+b[0])/2,.35,(a[1]+b[1])/2,.6,1.7,len+.15,this.concrete,this.scene,[0,Math.atan2(dx,dz),0]);
        if(len>8&&Math.hypot(...a)<600){
          const yaw=Math.atan2(dx,dz),nx=dz/len*1.2,nz=-dx/len*1.2;
          for(let d=2;d<len;d+=3.5){const x=a[0]+dx*d/len+nx,z=a[1]+dz*d/len+nz;this.bar([x,1.15,z],[x,2.15,z],.035,this.mats.steel,this.scene);}
          this.bar([a[0]+nx,2.15,a[1]+nz],[b[0]+nx,2.15,b[1]+nz],.045,this.mats.steel,this.scene);
        }
      }
    }
    buildLandmarks(){
      const b=new T.Group();b.position.set(-493,0,-1109);b.rotation.y=-.365;this.scene.add(b);
      this.box(0,44,0,1020,5,25,this.concrete,b);this.box(0,49,0,1020,.5,23,this.road,b);
      const nightLight=new T.MeshStandardMaterial({color:'#e3dfd0',emissive:'#ffe3b1',emissiveIntensity:0,roughness:.5});this.bridgeLight=nightLight;this.materials.push(nightLight);
      for(const x of [-235,235]){
        for(const z of [-17,17]){this.box(x,64,z,6,128,6,this.concrete,b);this.box(x,128,z,12,3,8,nightLight,b);this.box(x,5,z,15,10,16,this.concrete,b);}
        this.bar([x,98,-17],[x,98,17],1.8,this.concrete,b);this.bar([x,127,-17],[x,127,17],1.8,this.concrete,b);
      }
      for(const z of [-17,17]){let prev=null;for(let i=0;i<=70;i++){
        const x=-470+i*940/70,y=Math.abs(x)<235?58+70*x*x/(235*235):128-80*(Math.abs(x)-235)/235;
        if(prev)this.bar(prev,[x,y,z],.45,this.mats.steel,b);if(i%2===0)this.bar([x,49,z],[x,y,z],.16,this.mats.steel,b);prev=[x,y,z];
      }}
    }
    buildStreetLife(){
      const wood=this.mat('wood','#987c58',{roughness:.82}),metal=this.mat('furniture','#596463',{metalness:.4,roughness:.6});
      const sharedLamp=new T.MeshStandardMaterial({color:'#fff3d4',emissive:'#ffe4ae',emissiveIntensity:0});sharedLamp.name='live_lamp';this.lampMaterials=[sharedLamp];
      let lampCount=0;
      for(const p of this.data.paths){
        if(!['footway','pedestrian'].includes(p.kind))continue;
        for(let i=1;i<p.points.length;i++){
          const a=p.points[i-1],b=p.points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<25||Math.hypot(...a)>650)continue;
          const nx=dz/len,nz=-dx/len;
          for(let d=12;d<len;d+=36){
            if(lampCount++>95)break;
            const x=a[0]+dx*d/len+nx*3,z=a[1]+dz*d/len+nz*3;
            const local=new T.Vector3(x-80,0,z-40).applyAxisAngle(new T.Vector3(0,1,0),-2.18);
            if(Math.abs(local.x)<67&&local.z>-32&&local.z<116)continue;
            this.bar([x,.5,z],[x,5.9,z],.075,metal,this.scene);
            this.box(x,5.85,z,.75,.13,.75,this.mats.white,this.scene);
            this.box(x,5.75,z,.5,.04,.5,sharedLamp,this.scene);
            this.box(x+nx*2.7,.98,z+nz*2.7,2.1,.12,.55,wood,this.scene,[0,Math.atan2(nx,nz)+Math.PI/2,0]);
            for(const side of [-1,1])this.box(x+nx*2.7+side*.75,.72,z+nz*2.7,.1,.6,.48,metal,this.scene);
          }
        }
      }
      const carMat=[this.mat('car-white','#d5dad5',{metalness:.35,roughness:.32}),this.mat('car-dark','#405461',{metalness:.5,roughness:.3}),this.mat('car-silver','#919c9d',{metalness:.5,roughness:.3})];
      let count=0;
      for(const p of this.data.paths.filter(p=>['primary','secondary','tertiary','residential'].includes(p.kind))){
        for(let i=1;i<p.points.length&&count<80;i++){
          const a=p.points[i-1],b=p.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<35||Math.hypot(...a)>1050)continue;
          const yaw=Math.atan2(b[0]-a[0],b[1]-a[1]),x=(a[0]+b[0])/2+Math.cos(yaw)*1.4,z=(a[1]+b[1])/2-Math.sin(yaw)*1.4;
          this.box(x,1.1,z,1.7,.7,4.1,carMat[count%3],this.scene,[0,yaw,0]);this.box(x,1.65,z,1.4,.55,2.2,this.mats.glass,this.scene,[0,yaw,0]);count++;
        }
      }
    }
    createSky(){
      const uniforms={top:{value:new T.Color('#639dbd')},horizon:{value:new T.Color('#e0e5dc')},sunDirection:{value:new T.Vector3(-.5,.7,.4)},sunTint:{value:new T.Color('#ffe8bd')},time:this.clockUniform,night:this.night};
      this.skyUniforms=uniforms;
      const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms,vertexShader:'varying vec3 direction;void main(){direction=position/8000.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
      varying vec3 direction;uniform vec3 top,horizon,sunDirection,sunTint;uniform float time,night;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      float fbm(vec2 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.1)*.15;}
      void main(){vec3 dir=normalize(direction);float h=max(dir.y,0.);vec3 color=mix(horizon,top,pow(h,.46));float sun=max(0.,dot(dir,normalize(sunDirection)));color+=sunTint*(pow(sun,28.)*.24+pow(sun,420.)*.55)*(1.-night);vec2 p=dir.xz/max(.16,dir.y+.13)*1.65+vec2(time*.002,time*.0004);float cloud=smoothstep(.54,.76,fbm(p))*smoothstep(.01,.16,h)*(1.-smoothstep(.4,.95,h));color=mix(color,mix(vec3(.98,.96,.89),vec3(.2,.25,.34),night),cloud*.6);gl_FragColor=vec4(color,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
      this.sky=this.mesh(new T.SphereGeometry(8000,32,16),mat);this.sky.castShadow=false;this.sky.receiveShadow=false;
      const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#739eb6');g.addColorStop(.45,'#d6e0dd');g.addColorStop(.55,'#b3c2b9');g.addColorStop(1,'#637565');x.fillStyle=g;x.fillRect(0,0,1024,512);
      const glow=x.createRadialGradient(230,210,0,230,210,160);glow.addColorStop(0,'#fff5d8');glow.addColorStop(1,'#fff5d800');x.fillStyle=glow;x.fillRect(0,0,1024,512);
      const tex=new T.CanvasTexture(c);tex.mapping=T.EquirectangularReflectionMapping;tex.colorSpace=T.SRGBColorSpace;
      this.pmrem=new T.PMREMGenerator(this.renderer);this.environment=this.pmrem.fromEquirectangular(tex);this.scene.environment=this.environment.texture;tex.dispose();
    }
    finalize(){this.renderer.shadowMap.needsUpdate=true;this.scene.traverse(o=>{if(o.material?.isMeshStandardMaterial&&!this.materials.includes(o.material))this.materials.push(o.material);});}
    update(time,night,camera){
      this.camera=camera;this.clockUniform.value=time;this.night.value=night;this.sky.position.copy(camera.position);
      this.skyUniforms.top.value.lerpColors(new T.Color('#639dbd'),new T.Color('#0b1b32'),night);
      this.skyUniforms.horizon.value.lerpColors(new T.Color('#e0e5dc'),new T.Color('#52657a'),night);
      this.scene.fog.color.copy(this.skyUniforms.horizon.value);this.scene.fog.density=.00016;
      this.sun.intensity=3.5*(1-night)+.32*night;this.fill.intensity=.75*(1-night)+.32*night;this.rim.intensity=.4*(1-night)+.12*night;
      this.sun.position.set(-240,390*(1-night)+135*night,240);this.sun.color.lerpColors(new T.Color('#ffedcb'),new T.Color('#a8c6e4'),night);
      this.skyUniforms.sunDirection.value.copy(this.sun.position).normalize();this.skyUniforms.sunTint.value.copy(this.sun.color);
      this.renderer.toneMappingExposure=1.05*(1-night)+1.1*night;
      for(const m of this.materials)if(m.isMeshStandardMaterial)m.envMapIntensity=.8*(1-night)+.26*night;
      for(const m of this.windowMaterials||[])m.emissiveIntensity=night*.75;
      for(const m of this.lampMaterials||[])m.emissiveIntensity=night*2;
      this.bridgeLight.emissiveIntensity=night*.65;
      for(const u of this.waterUniforms){u.rayTime.value=time;u.sunDirection.value.copy(this.sun.position).normalize();u.horizon.value.copy(this.skyUniforms.horizon.value);u.deep.value.lerpColors(new T.Color('#164957'),new T.Color('#0b2535'),night);u.shallow.value.lerpColors(new T.Color('#42858a'),new T.Color('#1b424f'),night);u.light.value.copy(this.sun.color);u.exposure.value=1-night*.35;}
      if(Math.abs(night-this.lastNight)>.025){this.renderer.shadowMap.needsUpdate=true;this.lastNight=night;}
    }
    render(camera,now,target){
      this.camera=camera;
      const moved=this.lastCamera.distanceToSquared(camera.position)>.0001;
      if(moved||now-this.lastMirror>160){
        const mirror=this.mirrorCamera;mirror.copy(camera);mirror.position.y=-camera.position.y-.24;mirror.up.set(0,-1,0);mirror.lookAt(target.x,-target.y-.24,target.z);mirror.updateMatrixWorld();mirror.matrixWorldInverse.copy(mirror.matrixWorld).invert();
        this.textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
        const scale=this.quality.compact?.33:.48,w=Math.min(1000,Math.ceil(innerWidth*scale)),h=Math.min(700,Math.ceil(innerHeight*scale));
        if(this.mirrorTarget.width!==w||this.mirrorTarget.height!==h)this.mirrorTarget.setSize(w,h);
        this.water.visible=false;this.sky.position.copy(mirror.position);this.renderer.setRenderTarget(this.mirrorTarget);this.renderer.render(this.scene,mirror);this.renderer.setRenderTarget(null);this.water.visible=true;this.sky.position.copy(camera.position);this.lastMirror=now;this.lastCamera.copy(camera.position);
      }
      this.renderPresentation();
      this.canvas.dataset.drawCalls=String(this.sceneCalls);this.canvas.dataset.triangles=String(this.sceneTriangles);this.canvas.dataset.quality=this.quality.contactShading?'contact-shaded':'balanced-pbr';
    }
    dispose(){this.mirrorTarget?.dispose();this.presentationTarget?.dispose();this.presentationScene?.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.environment?.dispose();this.pmrem?.dispose();}
    wake(){}
  }
  window.LiveEnvironment=LiveEnvironment;
})();
/* Shared facade finishes, box-projected rooms and animated swimming-pool surfaces. */
(() => {
  "use strict";
  const T = window.THREE,
    P = window.RayWorld.prototype;
  const surfaceVertex = `
varying vec3 raySurfaceWorld, raySurfaceNormal;
`;
  function surfaceCoordinates(shader) {
    shader.vertexShader = surfaceVertex + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `
vec4 raySurfaceLocal=vec4(transformed,1.);
vec3 raySurfaceN=objectNormal;
#ifdef USE_INSTANCING
  raySurfaceLocal=instanceMatrix*raySurfaceLocal;
  raySurfaceN=mat3(instanceMatrix)*raySurfaceN;
#endif
raySurfaceWorld=(modelMatrix*raySurfaceLocal).xyz;
raySurfaceNormal=normalize(mat3(modelMatrix)*raySurfaceN);
#include <project_vertex>
`,
    );
    shader.fragmentShader = surfaceVertex + shader.fragmentShader;
  }
  const noise = `
float finishHash(vec2 p) {
  vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
float finishNoise(vec2 p) {
  vec2 c=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(finishHash(c),finishHash(c+vec2(1.,0.)),f.x),
    mix(finishHash(c+vec2(0.,1.)),finishHash(c+1.),f.x),f.y);
}
`;
  P.roomMaterial = function (mat) {
    mat.userData.rayParallaxRooms = true;
    mat.customProgramCacheKey = () => "ray-box-rooms-v2";
    mat.onBeforeCompile = (shader) => {
      surfaceCoordinates(shader);
      shader.uniforms.rayRoomNight = this.skyUniforms.night;
      shader.fragmentShader =
        `uniform float rayRoomNight;\n${noise}
float roomBox(vec3 origin, vec3 direction, vec3 low, vec3 high) {
  vec3 t1=(low-origin)/direction, t2=(high-origin)/direction;
  vec3 nearT=min(t1,t2), farT=max(t1,t2);
  float enter=max(max(nearT.x,nearT.y),nearT.z);
  float leave=min(min(farT.x,farT.y),farT.z);
  return enter>0. && leave>enter ? enter : 10000.;
}
void roomObject(vec3 origin, vec3 direction, vec3 low, vec3 high, vec3 finish,
  inout float closest, inout vec3 color) {
  float distanceToObject=roomBox(origin,direction,low,high);
  if(distanceToObject<closest) { closest=distanceToObject; color=finish; }
}
vec3 roomInterior(vec3 origin, vec3 direction, vec4 seed) {
  // Mirroring, furniture placement and finishes are stable for each room.
  float roomStyle=floor(seed.x*6.);
  origin.x*=seed.y>.5?-1.:1.;
  direction.x*=seed.y>.5?-1.:1.;
  vec3 farT=max((-vec3(1.)-origin)/direction,(vec3(1.)-origin)/direction);
  float closest=min(min(farT.x,farT.y),farT.z);
  vec3 hit=origin+direction*closest;
  vec3 wall=mix(vec3(.57,.52,.43),vec3(.49,.57,.58),step(.55,seed.z));
  wall=mix(wall,vec3(.67,.62,.52),seed.y*.28);
  vec3 wood=mix(vec3(.25,.16,.095),vec3(.44,.34,.23),seed.y);
  vec3 fabric=mix(vec3(.63,.55,.43),vec3(.30,.43,.46),seed.z);
  vec3 room=wall;
  if(hit.y<-.99) {
    room=wood;
    float joint=step(.975,fract(hit.x*(4.+floor(seed.z*3.))+hit.z*.19));
    room*=1.-joint*.15;
    if(abs(hit.x)<.67 && abs(hit.z)<.58) room=mix(vec3(.45,.42,.34),fabric,.3);
  } else if(hit.y>.99) room=vec3(.76,.73,.66);
  else if(hit.z<-.99) {
    room*=.91;
    if(roomStyle==3.) {
      // Study: a bookshelf and an uneven collection of books on the rear wall.
      if(hit.x<-.22 && hit.y<.6) {
        room=wood*.7;
        float shelf=step(.88,fract((hit.y+1.)*3.));
        float book=finishHash(vec2(floor((hit.x+1.)*18.),floor((hit.y+1.)*3.)));
        room=mix(mix(vec3(.22,.32,.33),vec3(.59,.37,.21),book),wood,shelf);
      }
    } else if(roomStyle==4. && abs(hit.x)<.69 && hit.y>-.12 && hit.y<.58) {
      room=mix(vec3(.065,.1,.12),vec3(.16,.28,.31),seed.z);
    } else if(abs(hit.x-.22)<.28+seed.y*.2 && abs(hit.y-.2)<.21+seed.z*.11) {
      float artwork=step(.15,hit.y+hit.x*(.3+seed.y));
      room=mix(vec3(.13,.25,.25),vec3(.58,.35,.18),artwork);
    }
  } else room*=.73;
  // Choose bounds first; every pixel casts only three furniture queries, even
  // when neighboring windows use different layouts on the same GPU wavefront.
  vec3 lowA=vec3(-.88,-1.,-.8), highA=vec3(.43,-.43,-.04), colorA=fabric;
  vec3 lowB=vec3(.57,-1.,-.45), highB=vec3(.93,-.48,.19), colorB=fabric*.8;
  vec3 lowC=vec3(-.22,-.95,.18), highC=vec3(.51,-.76,.66), colorC=wood;
  if(roomStyle>=1. && roomStyle<2.) {
    // Bedroom: bed, upholstered headboard and a bedside cabinet.
    lowA=vec3(-.68,-1.,-.9); highA=vec3(.55,-.52,.56); colorA=vec3(.75,.7,.59);
    lowB=vec3(-.74,-1.,-.96); highB=vec3(.6,-.07,-.83); colorB=fabric;
    lowC=vec3(.67,-1.,-.87); highC=vec3(.94,-.52,-.41);
  } else if(roomStyle>=2. && roomStyle<3.) {
    // Dining room: table and contrasting seats.
    lowA=vec3(-.62,-.65,-.61); highA=vec3(.62,-.56,.38); colorA=wood;
    lowB=vec3(-.85,-1.,-.48); highB=vec3(-.61,-.37,.17); colorB=fabric;
    lowC=vec3(.61,-1.,-.48); highC=vec3(.86,-.37,.17); colorC=fabric;
  } else if(roomStyle>=3. && roomStyle<4.) {
    // Study: rear desk, chair and screen, with books on the wall.
    lowA=vec3(-.08,-.61,-.96); highA=vec3(.92,-.51,-.43); colorA=wood;
    lowB=vec3(.17,-1.,-.39); highB=vec3(.61,-.32,.07); colorB=fabric*.7;
    lowC=vec3(.26,-.5,-.88); highC=vec3(.66,-.12,-.8); colorC=vec3(.08,.13,.15);
  } else if(roomStyle>=4. && roomStyle<5.) {
    // Media lounge: low sofa, console and a side table.
    lowA=vec3(-.89,-1.,-.2); highA=vec3(.26,-.48,.54);
    lowB=vec3(-.86,-1.,-.98); highB=vec3(.88,-.68,-.73); colorB=wood;
    lowC=vec3(.36,-1.,-.23); highC=vec3(.78,-.79,.2); colorC=wood*.8;
  } else if(roomStyle>=5.) {
    // Quiet sitting room: two chairs and a small table.
    lowA=vec3(-.78,-1.,-.59); highA=vec3(-.22,-.42,-.04);
    lowB=vec3(.25,-1.,-.6); highB=vec3(.81,-.42,-.05); colorB=fabric;
    lowC=vec3(-.11,-1.,-.49); highC=vec3(.12,-.61,-.2);
  }
  roomObject(origin,direction,lowA,highA,colorA,closest,room);
  roomObject(origin,direction,lowB,highB,colorB,closest,room);
  roomObject(origin,direction,lowC,highC,colorC,closest,room);
  return room;
}

` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `
#include <emissivemap_fragment>
vec3 roomN=normalize(raySurfaceNormal);
if(abs(roomN.y)<.65) {
  vec3 roomT=normalize(cross(vec3(0.,1.,0.),roomN));
  vec2 grid=vec2(dot(raySurfaceWorld,roomT)/3.15,(raySurfaceWorld.y-1.25)/3.465);
  vec2 cell=floor(grid), pane=fract(grid);
  vec4 seed=vec4(finishHash(cell+vec2(17.3,41.7)),finishHash(cell+vec2(71.2,9.4)),
    finishHash(cell+vec2(5.8,83.1)),finishHash(cell+vec2(94.6,23.9)));
  vec3 eye=normalize(cameraPosition-raySurfaceWorld);
  float roomDepth=2.35+seed.z*1.2;
  vec3 direction=vec3(-dot(eye,roomT)/1.575,-eye.y/1.7325,-max(dot(eye,roomN),.08)/roomDepth);
  direction+=vec3(.00001);
  vec3 interior=roomInterior(vec3(pane*2.-1.,.999),direction,seed);
  float leftCurtain=.025+seed.y*.24, rightCurtain=.025+seed.z*.28;
  float opening=smoothstep(leftCurtain-.015,leftCurtain+.015,pane.x)*
    (1.-smoothstep(1.-rightCurtain-.015,1.-rightCurtain+.015,pane.x));
  float shade=step(.79,seed.w)*smoothstep(.52+seed.y*.25,.55+seed.y*.25,pane.y);
  opening*=1.-shade*.92;
  vec3 curtainColor=mix(vec3(.69,.64,.54),vec3(.44,.49,.49),seed.x);
  float foldFilter=1.-smoothstep(.4,2.,fwidth(pane.x*90.));
  float folds=.94+.06*cos(pane.x*90.)*foldFilter;
  interior=mix(curtainColor*folds,interior,opening);
  float occupied=step(.31,seed.w);
  float brightness=.55+seed.z*.85;
  vec3 warmth=mix(vec3(1.,.69,.37),vec3(.82,.89,.97),smoothstep(.61,.95,seed.y));
  diffuseColor.rgb=mix(diffuseColor.rgb,interior,.27+seed.z*.08+rayRoomNight*.2);
  totalEmissiveRadiance+=interior*(.025+occupied*brightness*warmth*rayRoomNight*1.55);

}
`,
      );
    };
    this.canvas.dataset.windows = "box-projected-parallax-rooms";
    this.canvas.dataset.windowStyles = "6";
    this.canvas.dataset.windowVariation = "layouts-curtains-finishes-and-lighting";
  };

  P.wallFinishTexture = function () {
    if (this.wallTexture) return this.wallTexture;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f2eee5";
    ctx.fillRect(0, 0, 512, 512);
    let seed = 2719;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    // Continuous lime-plaster grain: no panel pattern or joints.
    for (let i = 0; i < 80; i++) {
      const grey = 223 + Math.floor(random() * 27);
      ctx.fillStyle = `rgba(${grey + 9},${grey + 3},${grey - 9},${0.02 + random() * 0.025})`;
      ctx.beginPath();
      ctx.ellipse(
        random() * 512,
        random() * 512,
        10 + random() * 70,
        3 + random() * 22,
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    for (let i = 0; i < 20000; i++) {
      const c = 226 + Math.floor(random() * 27);
      ctx.fillStyle = `rgba(${c},${c - 3},${c - 11},${0.02 + random() * 0.03})`;
      ctx.fillRect(random() * 512, random() * 512, 1 + random() * 2, 1 + random() * 2);
    }
    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.wallTexture = texture;
    return texture;
  };
  P.applyWallFinish = function (mat) {
    if (mat.userData.rayWallFinish) return;
    mat.userData.rayWallFinish = true;
    mat.color.set(0xf5f1e8);
    mat.metalness = 0;
    mat.roughness = 0.78;
    mat.customProgramCacheKey = () => "ray-smooth-warm-plaster-v3";
    mat.onBeforeCompile = (shader) => {
      surfaceCoordinates(shader);
      shader.uniforms.rayWallMap = { value: this.wallFinishTexture() };
      shader.fragmentShader = `uniform sampler2D rayWallMap;\n${noise}` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
#include <map_fragment>
vec3 wallN=abs(normalize(raySurfaceNormal));
vec2 wallUV=wallN.y>max(wallN.x,wallN.z)?raySurfaceWorld.xz:wallN.x>wallN.z?raySurfaceWorld.zy:raySurfaceWorld.xy;
vec3 plaster=texture2D(rayWallMap,wallUV*.4).rgb;
float plasterVariation=finishNoise(wallUV*.7+vec2(8.1,3.4));
plaster*=.985+plasterVariation*.025;
diffuseColor.rgb*=mix(vec3(1.),plaster,.32);
`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `
#include <normal_fragment_maps>
float plasterHeight=dot(plaster,vec3(.3333))*.0015;
vec3 sigmaX=dFdx(-vViewPosition),sigmaY=dFdy(-vViewPosition);
vec3 R1=cross(sigmaY,normal),R2=cross(normal,sigmaX);
float determinant=dot(sigmaX,R1);
vec3 gradient=sign(determinant)*(dFdx(plasterHeight)*R1+dFdy(plasterHeight)*R2);
normal=normalize(max(abs(determinant),.00000001)*normal-gradient);
`,
      );
    };
    mat.needsUpdate = true;
  };
  P.applyPoolWater = function (mat) {
    if (!mat || mat.userData.rayPoolWater) return;
    mat.userData.rayPoolWater = true;
    mat.color.set(0x39a6b4);
    mat.roughness = 0.12;
    mat.metalness = 0.22;
    mat.envMapIntensity = 1.6;
    mat.customProgramCacheKey = () => "ray-pool-ripples-v1";
    mat.onBeforeCompile = (shader) => {
      surfaceCoordinates(shader);
      shader.uniforms.rayPoolTime = this.clockUniform;
      shader.uniforms.rayPoolNight = this.skyUniforms.night;
      shader.fragmentShader =
        `uniform float rayPoolTime,rayPoolNight;\n${noise}` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `
#include <normal_fragment_maps>
vec2 poolP=raySurfaceWorld.xz;
float poolA=dot(poolP,vec2(2.13,1.37))-rayPoolTime*1.14;
float poolB=dot(poolP,vec2(-1.61,2.79))-rayPoolTime*.87;
vec2 poolSlope=vec2(2.13,1.37)*cos(poolA)*.012+vec2(-1.61,2.79)*cos(poolB)*.008;
vec3 poolN=normalize(vec3(-poolSlope.x,1.,-poolSlope.y));
normal=normalize(mat3(viewMatrix)*poolN);
`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `
#include <emissivemap_fragment>
float causticA=finishNoise(raySurfaceWorld.xz*2.3+vec2(rayPoolTime*.14,-rayPoolTime*.19));
float causticB=finishNoise(raySurfaceWorld.zx*3.17+vec2(-rayPoolTime*.11,7.));
float causticLine=pow(1.-abs(causticA-causticB),22.);
totalEmissiveRadiance+=vec3(.018,.09,.095)*causticLine*(1.-rayPoolNight*.85);
`,
      );
    };
    mat.needsUpdate = true;
  };
  const decorate = P.decorateArchitecture;
  P.decorateArchitecture = function () {
    decorate.call(this);
    for (const mat of this.modelMaterials)
      if (/^(Painted Plaster Wall|Concrete White|Concrete|White Textured)$/.test(mat.name))
        this.applyWallFinish(mat);
    this.applyWallFinish(this.materials.penthouseWall);
    this.applyPoolWater(this.materials.pool);
    this.applyPoolWater(this.context?.mats?.pool);
    this.canvas.dataset.wallFinish = "smooth-warm-white-plaster";
    this.canvas.dataset.poolWater = "animated-ripples-and-caustics";
  };
})();

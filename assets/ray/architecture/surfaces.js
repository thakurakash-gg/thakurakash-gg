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
    mat.customProgramCacheKey = () => "ray-box-rooms-v1";
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
vec3 roomInterior(vec3 origin, vec3 direction, float choice) {
  vec3 farT=max((-vec3(1.)-origin)/direction,(vec3(1.)-origin)/direction);
  float distanceToWall=min(min(farT.x,farT.y),farT.z);
  vec3 hit=origin+direction*distanceToWall;
  vec3 room=mix(vec3(.46,.42,.34),vec3(.58,.62,.62),step(.7,choice));
  if(hit.y<-.99) {
    room=vec3(.23,.17,.115);
    float board=step(.96,fract(hit.x*5.+hit.z*.12));
    room*=1.-board*.15;
    if(abs(hit.x)<.65 && abs(hit.z)<.55) room=vec3(.42,.38,.31);
  } else if(hit.y>.99) room=vec3(.73,.7,.62);
  else if(hit.z<-.99) {
    room*=.86;
    if(abs(hit.x-.25)<.38 && abs(hit.y-.12)<.3)
      room=mix(vec3(.12,.23,.24),vec3(.53,.36,.2),step(.2,hit.y+hit.x*.3));
  } else room*=.72;
  float sofa=roomBox(origin,direction,vec3(-.8,-1.,-.62),vec3(.52,-.47,.14));
  float table=roomBox(origin,direction,vec3(-.22,-.97,.25),vec3(.58,-.78,.73));
  if(sofa<distanceToWall) { room=vec3(.57,.52,.42); distanceToWall=sofa; }
  if(table<distanceToWall) room=vec3(.24,.16,.09);
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
  float choice=finishHash(cell);
  vec3 eye=normalize(cameraPosition-raySurfaceWorld);
  vec3 direction=vec3(-dot(eye,roomT)/1.575,-eye.y/1.7325,-max(dot(eye,roomN),.08)/2.7);
  direction+=vec3(.00001);
  vec3 interior=roomInterior(vec3(pane*2.-1.,.999),direction,choice);
  float curtain=smoothstep(.035,.14,pane.x)*(1.-smoothstep(.86,.965,pane.x));
  interior=mix(vec3(.48,.46,.39),interior,curtain);
  float occupied=step(.42,choice);
  vec3 warmth=mix(vec3(1.,.72,.43),vec3(.77,.85,.91),step(.86,choice));
  diffuseColor.rgb=mix(diffuseColor.rgb,interior,.24+rayRoomNight*.22);
  totalEmissiveRadiance+=interior*(.035+occupied*warmth*rayRoomNight*1.8);
}
`,
      );
    };
    this.canvas.dataset.windows = "box-projected-parallax-rooms";
  };

  P.wallFinishTexture = function () {
    if (this.wallTexture) return this.wallTexture;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ddd8cb";
    ctx.fillRect(0, 0, 512, 512);
    let seed = 2719;
    const random = () =>
      (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 44000; i++) {
      const c = 170 + Math.floor(random() * 67);
      ctx.fillStyle = `rgba(${c},${c - 3},${c - 11},${0.035 + random() * 0.08})`;
      ctx.fillRect(
        random() * 512,
        random() * 512,
        1 + random() * 2,
        1 + random() * 2,
      );
    }
    ctx.strokeStyle = "rgba(110,105,93,.14)";
    ctx.lineWidth = 1;
    for (let y = 0; y < 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(512, y + 0.5);
      ctx.stroke();
      const x = (y / 128) % 2 ? 384 : 128;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, y);
      ctx.lineTo(x + 0.5, y + 128);
      ctx.stroke();
    }
    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(
      8,
      this.renderer.capabilities.getMaxAnisotropy(),
    );
    this.wallTexture = texture;
    return texture;
  };
  P.applyWallFinish = function (mat) {
    if (mat.userData.rayWallFinish) return;
    mat.userData.rayWallFinish = true;
    mat.color.set(0xf2efe8);
    mat.roughness = 0.84;
    mat.customProgramCacheKey = () => "ray-world-limestone-v1";
    mat.onBeforeCompile = (shader) => {
      surfaceCoordinates(shader);
      shader.uniforms.rayWallMap = { value: this.wallFinishTexture() };
      shader.fragmentShader =
        "uniform sampler2D rayWallMap;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
#include <map_fragment>
vec3 wallN=abs(normalize(raySurfaceNormal));
vec2 wallUV=wallN.y>max(wallN.x,wallN.z)?raySurfaceWorld.xz:wallN.x>wallN.z?raySurfaceWorld.zy:raySurfaceWorld.xy;
vec3 stone=texture2D(rayWallMap,wallUV*.25).rgb;
diffuseColor.rgb*=mix(vec3(.93),stone, .48);
`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `
#include <normal_fragment_maps>
float stoneHeight=dot(stone,vec3(.3333))*.003;
vec3 sigmaX=dFdx(-vViewPosition),sigmaY=dFdy(-vViewPosition);
vec3 R1=cross(sigmaY,normal),R2=cross(normal,sigmaX);
float determinant=dot(sigmaX,R1);
vec3 gradient=sign(determinant)*(dFdx(stoneHeight)*R1+dFdy(stoneHeight)*R2);
normal=normalize(abs(determinant)*normal-gradient);
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
        `uniform float rayPoolTime,rayPoolNight;\n${noise}` +
        shader.fragmentShader;
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
      if (
        /^(Painted Plaster Wall|Concrete White|White Textured)$/.test(mat.name)
      )
        this.applyWallFinish(mat);
    this.applyWallFinish(this.materials.penthouseWall);
    this.applyPoolWater(this.materials.pool);
    this.applyPoolWater(this.context?.mats?.pool);
    this.canvas.dataset.wallFinish = "world-projected-limestone";
    this.canvas.dataset.poolWater = "animated-ripples-and-caustics";
  };
})();

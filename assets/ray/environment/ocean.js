/* Analytic ocean with traveling wave fronts guided by a shoreline distance field. */
(() => {
  const T = window.THREE;
  window.RayCreateOcean = function (w) {
    w.mirrorTarget = new T.WebGLRenderTarget(
      Math.ceil(innerWidth * 0.65),
      Math.ceil(innerHeight * 0.65),
      {
        minFilter: T.LinearMipmapLinearFilter,
        magFilter: T.LinearFilter,
        generateMipmaps: true,
        type: w.quality.hdr ? T.HalfFloatType : T.UnsignedByteType,
      },
    );
    w.mirrorCamera = new T.PerspectiveCamera();
    w.textureMatrix = new T.Matrix4();
    let resolveWater;
    w.waterReady = new Promise((resolve) => {
      resolveWater = resolve;
    });
    const field = new T.TextureLoader().load(
      window.RayAssets.get("assets/ray/textures/shore-distance.png"),
      () => {
        w.wake();
        resolveWater();
      },
    );
    field.flipY = false;
    field.colorSpace = T.NoColorSpace;
    field.minFilter = T.LinearFilter;
    field.magFilter = T.LinearFilter;
    field.generateMipmaps = false;
    const uniforms = {
      reflectionMap: { value: w.mirrorTarget.texture },
      // A planar image belongs to the main camera, never a cubemap camera.
      reflectionPass: { value: 0 },
      reflectionMatrix: { value: w.textureMatrix },
      shoreField: { value: field },
      rayTime: w.clockUniform,
      sunDirection: { value: new T.Vector3(-0.5, 0.7, 0.5) },
      deep: { value: new T.Color(0x164957) },
      shallow: { value: new T.Color(0x428f91) },
      light: { value: new T.Color(0xffe9bf) },
      horizon: { value: new T.Color(0xc5dbe5) },
      exposure: { value: 1 },
    };
    w.waterUniforms.push(uniforms);
    // Long waves share their height and analytic derivatives between both shader stages.
    const spectrum = `
float waterHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
vec3 waterNoise(vec2 p) {
  vec2 cell = floor(p), f = fract(p), u = f*f*(3.-2.*f), du = 6.*f*(1.-f);
  float a=waterHash(cell), b=waterHash(cell+vec2(1.,0.));
  float c=waterHash(cell+vec2(0.,1.)), d=waterHash(cell+vec2(1.,1.));
  return vec3(mix(mix(a,b,u.x),mix(c,d,u.x),u.y),
    mix(b-a,d-c,u.y)*du.x, mix(c-a,d-b,u.x)*du.y);
}
void windWave(vec2 p, vec2 direction, float wavelength, float amplitude,
  float phaseOffset, vec3 warp, inout float height, inout vec2 slope) {
  float k=6.2831853/wavelength;
  float phase=dot(direction,p)*k-sqrt(9.81*k)*rayTime+phaseOffset+warp.x*.7;
  height+=amplitude*sin(phase);
  slope+=amplitude*cos(phase)*(direction*k+warp.yz*.7);
}
void waterSpectrum(vec2 p, vec4 shore, out float height, out vec2 slope, out float shorePhase) {
  vec3 warp=waterNoise(p*.019+vec2(2.7,9.1));
  warp.yz*=.019;
  height=0.; slope=vec2(0.);
  windWave(p,normalize(vec2(-.83,-.56)),53.7,.18,1.2,warp,height,slope);
  windWave(p,normalize(vec2(-.42,-.91)),31.3,.09,4.7,warp,height,slope);
  windWave(p,normalize(vec2(-.97,-.24)),19.1,.045,2.9,warp,height,slope);
  windWave(p,normalize(vec2(-.62,-.78)),12.7,.023,5.1,warp,height,slope);
  float distanceToShore=shore.r*200.;
  vec2 outward=shore.gb*2.-1.;
  outward/=max(length(outward),.001);
  // Positive time moves crests toward smaller SDF distances, onto the shore.
  shorePhase=distanceToShore*.31+rayTime*1.38+warp.x*3.8;
  float envelope=exp(-distanceToShore/48.)*(1.-smoothstep(130.,180.,distanceToShore));
  vec2 phaseGradient=outward*.31+warp.yz*3.8;
  float blend=1.-envelope*.68;
  height*=blend; slope*=blend;
  height+=envelope*.115*sin(shorePhase);
  slope+=envelope*.115*(cos(shorePhase)*phaseGradient-sin(shorePhase)*outward/48.);
}
`;
    const vertex = `precision highp float;
uniform highp float rayTime;
uniform mat4 reflectionMatrix;
uniform sampler2D shoreField;
varying vec4 reflectionCoord;
varying vec3 world;
${spectrum}
void main() {
  vec3 p=position;
  vec4 shore=texture2D(shoreField,clamp((p.xz+1900.)/3800.,.001,.999));
  float height, phase; vec2 slope;
  waterSpectrum(p.xz,shore,height,slope,phase);
  p.y+=height;
  world=(modelMatrix*vec4(p,1.)).xyz;
  reflectionCoord=reflectionMatrix*vec4(world,1.);
  gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
}`;
    const fragment = `precision highp float;
varying vec4 reflectionCoord;
varying vec3 world;
uniform sampler2D reflectionMap;
uniform sampler2D shoreField;
uniform highp float rayTime;
uniform vec3 sunDirection, deep, shallow, light, horizon;
uniform float exposure, reflectionPass;
${spectrum}
void main() {
  vec4 shore=texture2D(shoreField,clamp((world.xz+1900.)/3800.,.001,.999));
  float d=shore.r*200., height, phase;
  vec2 slope;
  waterSpectrum(world.xz,shore,height,slope,phase);
  float detail=1.-smoothstep(.45,2.5,length(fwidth(world.xz)));
  vec2 flow=world.xz+vec2(-.42,-.7)*rayTime;
  vec3 rippleA=waterNoise(flow*.59);
  vec3 rippleB=waterNoise(mat2(.793,-.609,.609,.793)*flow*1.037+13.7);
  slope+=detail*(rippleA.yz*.021+mat2(.793,.609,-.609,.793)*rippleB.yz*.012);
  vec3 normal=normalize(vec3(-slope.x,1.,-slope.y)), eye=normalize(cameraPosition-world);
  // Normalization can round a dot product slightly above one. pow() is
  // undefined for a negative base, even when its exponent is an integer.
  float fresnel=pow(clamp(1.-dot(eye,normal),0.,1.),4.);
  vec3 color=mix(deep,shallow,exp(-d/65.)*.74);
  vec3 reflected=horizon;
  // Glass captures still see shaded water, without reprojecting an unrelated
  // camera image or feeding the building's previous reflection back into itself.
  if(reflectionPass<.5 && reflectionCoord.w>.0001) {
    vec2 reflectedUV=reflectionCoord.xy/reflectionCoord.w+normal.xz*.013;
    float edge=smoothstep(0.,.05,min(min(reflectedUV.x,reflectedUV.y),min(1.-reflectedUV.x,1.-reflectedUV.y)));
    reflected=mix(horizon,texture2D(reflectionMap,clamp(reflectedUV,.001,.999)).rgb,edge);
  }
  color=mix(color,reflected,.19+fresnel*.58);
  float sun=max(0.,dot(reflect(-normalize(sunDirection),normal),eye));
  color+=light*(pow(sun,110.)*.26+pow(sun,28.)*.012);
  float breakup=waterNoise(world.xz*.13+vec2(rayTime*.04,0.)).x;
  float foam=pow(max(0.,sin(phase)),18.)*(1.-smoothstep(2.,15.,d))*.16*smoothstep(.32,.7,breakup);
  float wash=(1.-smoothstep(.3,2.4+sin(rayTime*.45)*.4,d))*.035;
  color=mix(color,vec3(.8,.94,.91),foam+wash);
  float caustic=pow(1.-abs(rippleA.x-rippleB.x),24.);
  color+=vec3(.025,.065,.06)*caustic*exp(-d/13.);
  float farFade=smoothstep(1000.,1850.,length(world.xz));
  float haze=(1.-exp(-length(cameraPosition-world)*.0002))*.2;
  color=mix(color*exposure,horizon,max(farFade,haze));
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  float dither=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5;
  gl_FragColor.rgb+=dither/255.;
}`;
    const material = new T.ShaderMaterial({
      uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    const radii = [];
    for (let r = 0; r <= 600; r += 4) radii.push(r);
    for (let r = 660; r <= 1980; r += 60) radii.push(r);
    for (let r = 2250; r <= 6000; r += 250) radii.push(r);
    const sides = w.quality.compact ? 192 : 320,
      positions = [],
      indices = [];
    for (let j = 0; j < radii.length; j++)
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        positions.push(Math.cos(angle) * radii[j], 0, Math.sin(angle) * radii[j]);
        if (j < radii.length - 1) {
          const a = j * sides + i,
            b = j * sides + ((i + 1) % sides);
          indices.push(a, b, a + sides, b, b + sides, a + sides);
        }
      }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    material.extensions.derivatives = true;
    w.water = w.mesh(geometry, material, 0, -0.12, 0);
    w.water.castShadow = false;
    w.water.receiveShadow = false;
    w.canvas.dataset.water = "directional-spectrum-and-shore-tides";
  };
})();

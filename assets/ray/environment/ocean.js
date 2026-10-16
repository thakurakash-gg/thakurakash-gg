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
    const vertex = `precision highp float;
uniform highp float rayTime;
uniform mat4 reflectionMatrix;
uniform sampler2D shoreField;
varying vec4 reflectionCoord;
varying vec3 world;

 void main(){
vec3 p=position;
vec2 uv=clamp((p.xz+1900.)/3800.,.001,.999);
vec4 shore=texture2D(shoreField,uv);
float d=shore.r*200.,env=exp(-d/130.);
float a=dot(p.xz,vec2(.035,.055))+rayTime*.55,b=dot(p.xz,vec2(.085,-.043))-rayTime*.42;
p.y+=sin(a)*.24+sin(b)*.14+env*(sin(d*.24+rayTime*.65)*.16+sin(d*.49+rayTime*.9)*.03);
world=(modelMatrix*vec4(p,1.)).xyz;
reflectionCoord=reflectionMatrix*vec4(world,1.);
gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);

}
`;
    const fragment = `precision highp float;
varying vec4 reflectionCoord;
varying vec3 world;
uniform sampler2D reflectionMap;
uniform sampler2D shoreField;
uniform highp float rayTime;
uniform vec3 sunDirection;
uniform vec3 deep;
uniform vec3 shallow;
uniform vec3 light;
uniform vec3 horizon;
uniform float exposure;

 void main(){
vec2 uv=clamp((world.xz+1900.)/3800.,.001,.999);
vec4 shore=texture2D(shoreField,uv);
float d=shore.r*200.,env=exp(-d/130.);
vec2 toward=normalize(shore.gb*2.-1.+vec2(.0001));
float a=dot(world.xz,vec2(.035,.055))+rayTime*.55,b=dot(world.xz,vec2(.085,-.043))-rayTime*.42,phase=d*.24+rayTime*.65,phase2=d*.49+rayTime*.9;
vec2 slope=vec2(.035,.055)*cos(a)*.24+vec2(.085,-.043)*cos(b)*.14+toward*env*(cos(phase)*.045+cos(phase2)*.014);
float detail=1.-smoothstep(.6,3.5,length(fwidth(world.xz)));
vec2 warped=world.xz+vec2(sin(world.z*.017),sin(world.x*.021))*3.7;
slope+=detail*(vec2(.013,.009)*cos(dot(warped,vec2(.413,.287))+rayTime*.74)+vec2(-.007,.012)*cos(dot(warped,vec2(-.631,.897))-rayTime*.63)+vec2(.009,-.006)*cos(dot(warped,vec2(.277,-.391))+rayTime*.37));
vec3 normal=normalize(vec3(-slope.x,1.,-slope.y)),eye=normalize(cameraPosition-world);
float fresnel=pow(1.-max(0.,dot(eye,normal)),3.2);
vec3 color=mix(deep,shallow,exp(-d/65.)*.74);
vec2 reflectedUV=reflectionCoord.xy/reflectionCoord.w+normal.xz*.016;
float reflectionEdge=smoothstep(0.,.05,min(min(reflectedUV.x,reflectedUV.y),min(1.-reflectedUV.x,1.-reflectedUV.y)));
vec3 reflected=mix(horizon,texture2D(reflectionMap,clamp(reflectedUV,.001,.999)).rgb,reflectionEdge);
color=mix(color,reflected,.13+fresnel*.54);
float sun=max(0.,dot(reflect(-normalize(sunDirection),normal),eye));
color+=light*(pow(sun,135.)*.23+pow(sun,35.)*.009);
float crest=pow(max(0.,sin(phase)),24.);
float foam=crest*(1.-smoothstep(4.,28.,d))*.12*(.6+.4*sin(world.x*.037+world.z*.026+rayTime*.16));
float wash=(1.-smoothstep(.6,3.1+sin(rayTime*.45)*.8,d))*(.017+.02*sin(rayTime*.75+world.x*.025));
color=mix(color,vec3(.82,.94,.91),foam+wash);
float caustic=pow(max(0.,sin(world.x*.29+rayTime*.33)*sin(world.z*.27-rayTime*.28)),8.);
color+=vec3(.03,.08,.07)*caustic*exp(-d/12.);
float farFade=smoothstep(1000.,1850.,length(world.xz));
float haze=(1.-exp(-length(cameraPosition-world)*.0002))*.2;
color=mix(color*exposure,horizon,max(farFade,haze));
gl_FragColor=vec4(color,1.);

 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 float dither=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5;
gl_FragColor.rgb+=dither/255.;


}
`;
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
    w.canvas.dataset.water = "shoreward-waves";
  };
})();

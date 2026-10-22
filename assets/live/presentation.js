/* A stable depth-based contact pass adds scale and recess shading without grain. */
(() => {
  const T = window.THREE,
    P = window.LiveEnvironment.prototype;
  P.renderPresentation = function () {
    if (!this.quality.contactShading || !this.quality.hdr) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
      this.sceneCalls = this.renderer.info.render.calls;
      this.sceneTriangles = this.renderer.info.render.triangles;
      return;
    }
    const size = this.renderer
      .getDrawingBufferSize((this.presentationSize ??= new T.Vector2()))
      .multiplyScalar(this.quality.contactScale)
      .floor();
    if (!this.presentationTarget) {
      this.presentationTarget = new T.WebGLRenderTarget(size.x, size.y, {
        type: T.HalfFloatType,
        minFilter: T.LinearFilter,
        magFilter: T.LinearFilter,
        depthBuffer: true,
      });
      this.presentationTarget.samples = this.quality.compact
        ? 0
        : Math.min(4, this.renderer.capabilities.maxSamples || 0);
      this.presentationTarget.depthTexture = new T.DepthTexture(size.x, size.y, T.UnsignedIntType);
      this.presentationUniforms = {
        image: { value: this.presentationTarget.texture },
        depth: { value: this.presentationTarget.depthTexture },
        inverseProjection: { value: new T.Matrix4() },
        projection: { value: new T.Matrix4() },
        resolution: { value: size.clone() },
      };
      const sampleCount = this.quality.compact ? 6 : 12;
      const material = new T.ShaderMaterial({
        uniforms: this.presentationUniforms,
        depthTest: false,
        depthWrite: false,
        toneMapped: true,
        vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
        fragmentShader: `
   precision highp float;
varying vec2 vUv;
uniform sampler2D image;
uniform sampler2D depth;
uniform mat4 inverseProjection;
uniform mat4 projection;
uniform vec2 resolution;

   vec3 viewPoint(vec2 uv,float z){
vec4 p=inverseProjection*vec4(uv*2.-1.,z*2.-1.,1.);
return p.xyz/p.w;

}

   void main(){
vec3 color=texture2D(image,vUv).rgb;
float d=texture2D(depth,vUv).r;
float ao=0.;

   if(d<.9999){
vec3 p=viewPoint(vUv,d);
vec3 normal=normalize(cross(dFdx(p),dFdy(p)));
vec3 tangent=normalize(cross(normal,abs(normal.z)<.9?vec3(0.,0.,1.):vec3(0.,1.,0.)));
vec3 bitangent=cross(normal,tangent);
float radius=1.65;
float angle=0.;

    for(int i=0;
i<${sampleCount};
i++){
float f=float(i);
angle=f*2.399963;
float radial=.28+.7*(f+1.)/${sampleCount}.;
vec3 direction=normalize(tangent*cos(angle)+bitangent*sin(angle)+normal*(.5+radial));
vec3 samplePoint=p+direction*radius*radial;
vec4 screen=projection*vec4(samplePoint,1.);
vec2 uv=screen.xy/screen.w*.5+.5;
float sd=texture2D(depth,clamp(uv,.001,.999)).r;
float sampleZ=viewPoint(uv,sd).z;
float range=1.-smoothstep(.15,radius*2.,abs(sampleZ-p.z));
ao+=step(samplePoint.z+.07,sampleZ)*range;

}

    ao=clamp(ao/${sampleCount}.,0.,.8);

}

   color*=1.-ao*.58;
gl_FragColor=vec4(color,1.);

   #include <tonemapping_fragment>
   #include <colorspace_fragment>

}
`,
      });
      material.extensions.derivatives = true;
      this.presentationScene = new T.Scene();
      const plane = new T.Mesh(new T.PlaneGeometry(2, 2), material);
      plane.frustumCulled = false;
      this.presentationScene.add(plane);
      this.presentationCamera = new T.Camera();
    }
    if (this.presentationTarget.width !== size.x || this.presentationTarget.height !== size.y) {
      this.presentationTarget.setSize(size.x, size.y);
      this.presentationUniforms.resolution.value.copy(size);
    }
    this.presentationUniforms.inverseProjection.value.copy(this.camera.projectionMatrixInverse);
    this.presentationUniforms.projection.value.copy(this.camera.projectionMatrix);
    this.renderer.setRenderTarget(this.presentationTarget);
    this.renderer.render(this.scene, this.camera);
    this.sceneCalls = this.renderer.info.render.calls;
    this.sceneTriangles = this.renderer.info.render.triangles;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.presentationScene, this.presentationCamera);
  };
})();

  /* =====================================================================
   *  9. RENDERER / SCENE / CAMERA / POST-PROCESSING
   * ===================================================================== */
  const canvas = document.getElementById( 'c' );
  const renderer = new T.WebGLRenderer( { canvas, antialias: false, stencil: false, powerPreference: 'high-performance' } );
  const isMobile = /Android|iPhone|iPad|Mobi/i.test( navigator.userAgent );
  const PR = Math.min( window.devicePixelRatio || 1, isMobile ? 1.5 : 2 );
  let curPR = PR;      // live pixel ratio (adaptive resolution may lower it temporarily, never above PR)
  renderer.setPixelRatio( PR );
  renderer.setSize( window.innerWidth, window.innerHeight, false );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = DEV;      // game page: the loop refreshes the shadow map itself (see main/loop.js); editor: every frame

  const scene = new T.Scene();
  scene.fog = new T.FogExp2( 0xb9d6ee, 0.0013 );
  const camera = new T.PerspectiveCamera( 38, window.innerWidth / window.innerHeight, 0.5, 6000 );
  camera.position.set( 150, 125, 140 );
  const controls = new T.OrbitControls( camera, canvas );
  controls.target.set( 0, 4, -6 );
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.minDistance = 4; controls.maxDistance = 1400;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.autoRotateSpeed = 0.5;
  controls.update();

  // Linear HDR render target (multisampled on WebGL2) -> bokeh DoF -> ACES + sRGB
  const isGL2 = renderer.capabilities.isWebGL2;
  const RTClass = isGL2 && T.WebGLMultisampleRenderTarget ? T.WebGLMultisampleRenderTarget : T.WebGLRenderTarget;
  const rt = new RTClass( window.innerWidth * PR, window.innerHeight * PR, { type: T.HalfFloatType, format: T.RGBAFormat, minFilter: T.LinearFilter, magFilter: T.LinearFilter } );
  if ( isGL2 && 'samples' in rt ) rt.samples = 4;
  const composer = new T.EffectComposer( renderer, rt );
  composer.setPixelRatio( PR );
  composer.setSize( window.innerWidth, window.innerHeight );
  composer.addPass( new T.RenderPass( scene, camera ) );
  const bokeh = new T.BokehPass( scene, camera, { focus: 40, aperture: 0.00015, maxblur: 0.0035, width: window.innerWidth * PR, height: window.innerHeight * PR } );
  composer.addPass( bokeh );
  const FinalShader = {
    uniforms: { tDiffuse: { value: null }, exposure: { value: 1.1 }, vignette: { value: 0.32 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
    uniform sampler2D tDiffuse; uniform float exposure, vignette; varying vec2 vUv;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
    void main(){
      vec3 c = max(texture2D(tDiffuse, vUv).rgb, 0.0) * exposure;
      c = aces(c);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.12);
      vec2 d = vUv - 0.5;
      c *= 1.0 - vignette * smoothstep(0.35, 0.95, length(d) * 1.25);
      c = pow(c, vec3(1.0 / 2.2));
      float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      c += (n - 0.5) / 255.0;
      gl_FragColor = vec4(c, 1.0);
    }`
  };
  const finalPass = new T.ShaderPass( FinalShader );
  composer.addPass( finalPass );

  /* ---- Sky dome: gradient + sun disc/halo + moon + stars --------------- */
  const skyUniforms = {
    uZenith: { value: new T.Color() }, uHorizon: { value: new T.Color() }, uSunDir: { value: new T.Vector3( 0, 1, 0 ) },
    uSunColor: { value: new T.Color( 1, 0.9, 0.7 ) }, uNight: { value: 0 }, uOvercast: { value: 0 }
  };
  const sky = new T.Mesh( new T.SphereGeometry( 1, 40, 20 ), new T.ShaderMaterial( {
    uniforms: skyUniforms, side: T.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: `
    uniform vec3 uZenith, uHorizon, uSunDir, uSunColor; uniform float uNight, uOvercast; varying vec3 vDir;
    float h31(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
    void main(){
      vec3 d = normalize(vDir);
      float h = clamp(d.y, 0.0, 1.0);
      vec3 col = mix(uHorizon, uZenith, pow(h, 0.55));
      if (d.y < 0.0) col = uHorizon * (1.0 + d.y * 0.25);
      float sd = max(dot(d, uSunDir), 0.0);
      float vis = smoothstep(-0.08, 0.02, d.y) * (1.0 - uOvercast * 0.85);
      col += uSunColor * (smoothstep(0.9993, 0.9998, sd) * 9.0 + pow(sd, 64.0) * 0.4 + pow(sd, 6.0) * 0.14) * vis;
      float md = dot(d, -uSunDir);
      col += vec3(0.85, 0.92, 1.0) * smoothstep(0.9991, 0.9995, md) * uNight * 2.2 * vis;
      vec3 sp = floor(d * 230.0);
      float s = step(0.9965, h31(sp)) * uNight * smoothstep(0.04, 0.3, d.y) * (1.0 - uOvercast);
      col += vec3(s) * (0.5 + 0.5 * h31(sp + 7.0)) * (0.7 + 0.3 * sin(h31(sp) * 60.0));
      gl_FragColor = vec4(col, 1.0);
    }`
  } ) );
  sky.scale.setScalar( 1500 ); sky.frustumCulled = false; sky.renderOrder = -1000;
  scene.add( sky );

  /* ---- Lights ---------------------------------------------------------- */
  const hemi = new T.HemisphereLight( 0x9cc4ff, 0x6b5a3c, 0.6 );
  scene.add( hemi );
  const sun = new T.DirectionalLight( 0xfff0dd, 3 );
  sun.castShadow = true;
  sun.shadow.mapSize.set( isMobile ? 2048 : 4096, isMobile ? 2048 : 4096 );
  const SH = 230;
  Object.assign( sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 10, far: 1400 } );
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.5; sun.shadow.radius = 2.5;
  const shadowCenter = new T.Vector3( 0, 0, -5 );
  sun.target.position.copy( shadowCenter );
  scene.add( sun, sun.target );

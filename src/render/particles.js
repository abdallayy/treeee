  /* =====================================================================
   *  7. PARTICLE FIELDS (petals, pollen, mist, fireflies, rain)
   *  Fully GPU animated: a box of seeds that wraps around `uCenter`.
   *  CPU only accumulates fall/drift so changing wind never "jumps".
   * ===================================================================== */
  const POINT_VS = `
  attribute vec3 aSeed; attribute vec4 aRnd;
  uniform float uFall, uTime, uSize, uScale, uSwirl, uShape;
  uniform vec2 uDrift, uFade; uniform vec3 uCenter, uBox;
  varying float vAlpha; varying float vRot; varying float vTint; varying float vSpin;
  void main(){
    vec3 lo = uCenter - uBox * 0.5;
    vec3 q = aSeed * uBox;
    float sp = 0.6 + aRnd.z * 0.8;
    q.y -= uFall * sp;
    q.xz += uDrift * (0.6 + aRnd.z * 0.8);
    q.x += sin(uTime * (0.6 + aRnd.y) + aRnd.y * 20.0) * uSwirl;
    q.z += cos(uTime * (0.5 + aRnd.x) + aRnd.x * 17.0) * uSwirl;
    q.y += sin(uTime * 1.3 + aRnd.w * 20.0) * uSwirl * 0.4;
    q = lo + mod(q - lo, uBox);
    vec4 mv = modelViewMatrix * vec4(q, 1.0);
    gl_Position = projectionMatrix * mv;
    float d = max(-mv.z, 0.5);
    gl_PointSize = min(uSize * (0.6 + aRnd.x * 0.8) * uScale / d, 300.0);
    vec3 e = abs((q - uCenter) / uBox) * 2.0;
    float edge = 1.0 - smoothstep(0.78, 1.0, max(max(e.x, e.y), e.z));
    vAlpha = edge * (1.0 - smoothstep(uFade.x, uFade.y, d)) * smoothstep(0.4, 2.0, d);
    vRot = aRnd.w * 6.283 + uTime * (1.0 + aRnd.y * 2.0) * uShape;
    vSpin = uTime * (1.5 + aRnd.x * 2.0) + aRnd.z * 9.0;
    vTint = aRnd.y;
  }`;
  const POINT_FS = `
  uniform vec3 uColor; uniform float uOpacity, uShape, uBlink, uTime;
  varying float vAlpha; varying float vRot; varying float vTint; varying float vSpin;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float a; vec3 col = uColor;
    if (uShape < 0.5) {
      a = smoothstep(1.0, 0.0, length(c) * 2.0); a *= a;
    } else {
      float s = sin(vRot), co = cos(vRot);
      c = mat2(co, -s, s, co) * c;
      c.y /= (0.3 + 0.7 * abs(cos(vSpin)));                 // petals flip while falling
      float d = length(c * vec2(1.0, 1.9)) * 2.0;
      a = smoothstep(1.0, 0.8, d);
      col = mix(uColor, vec3(1.0, 0.9, 0.93), vTint * 0.55) * (0.85 + 0.3 * vTint);
    }
    float blink = mix(1.0, 0.35 + 0.65 * sin(uTime * 2.2 + vTint * 40.0), uBlink);
    float al = a * vAlpha * uOpacity * max(blink, 0.0);
    if (al < 0.004) discard;
    gl_FragColor = vec4(col, al);
  }`;
  const pointSystems = [];
  function makePoints ( o )
  {
    const n = o.count, g = new T.BufferGeometry();
    const seed = new Float32Array( n * 3 ), rnd = new Float32Array( n * 4 );
    for ( let i = 0; i < n * 3; i++ ) seed[ i ] = Math.random();
    for ( let i = 0; i < n * 4; i++ ) rnd[ i ] = Math.random();
    g.setAttribute( 'position', new T.BufferAttribute( new Float32Array( n * 3 ), 3 ) );
    g.setAttribute( 'aSeed', new T.BufferAttribute( seed, 3 ) );
    g.setAttribute( 'aRnd', new T.BufferAttribute( rnd, 4 ) );
    const u = {
      uFall: { value: 0 }, uTime: { value: 0 }, uSize: { value: o.size }, uScale: { value: 1000 }, uSwirl: { value: o.swirl || 0 },
      uShape: { value: o.shape || 0 }, uDrift: { value: new T.Vector2() }, uFade: { value: new T.Vector2( o.box[ 0 ] * 0.25, o.box[ 0 ] * 0.5 ) },
      uCenter: { value: new T.Vector3().copy( o.center || new T.Vector3() ) }, uBox: { value: new T.Vector3( o.box[ 0 ], o.box[ 1 ], o.box[ 2 ] ) },
      uColor: { value: o.color }, uOpacity: { value: o.opacity }, uBlink: { value: o.blink || 0 }
    };
    const mat = new T.ShaderMaterial( { uniforms: u, vertexShader: POINT_VS, fragmentShader: POINT_FS, transparent: true, depthWrite: false, blending: o.additive ? T.AdditiveBlending : T.NormalBlending } );
    const pts = new T.Points( g, mat );
    pts.frustumCulled = false; pts.renderOrder = 5;
    const sys = { points: pts, u, fall: o.fall || 0, driftBase: o.driftBase || 0, driftMul: o.driftMul || 0, follow: !!o.follow, followY: o.followY, baseOpacity: o.opacity };
    pointSystems.push( sys );
    return sys;
  }
  function makeRain ( count, box )
  {
    const g = new T.BufferGeometry();
    const seed = new Float32Array( count * 6 ), end = new Float32Array( count * 2 ), rr = new Float32Array( count * 2 );
    for ( let i = 0; i < count; i++ )
    {
      const x = Math.random(), y = Math.random(), z = Math.random(), r = Math.random();
      for ( let k = 0; k < 2; k++ ) { seed.set( [ x, y, z ], i * 6 + k * 3 ); end[ i * 2 + k ] = k; rr[ i * 2 + k ] = r; }
    }
    g.setAttribute( 'position', new T.BufferAttribute( new Float32Array( count * 6 ), 3 ) );
    g.setAttribute( 'aSeed', new T.BufferAttribute( seed, 3 ) );
    g.setAttribute( 'aEnd', new T.BufferAttribute( end, 1 ) );
    g.setAttribute( 'aR', new T.BufferAttribute( rr, 1 ) );
    const u = {
      uFall: { value: 0 }, uDrift: { value: new T.Vector2() }, uCenter: { value: new T.Vector3() }, uBox: { value: new T.Vector3( box[ 0 ], box[ 1 ], box[ 2 ] ) },
      uVel: { value: new T.Vector3( 0, -1, 0 ) }, uOpacity: { value: 0 }, uColor: { value: new T.Color( 0.55, 0.62, 0.72 ) }
    };
    const mat = new T.ShaderMaterial( {
      uniforms: u, transparent: true, depthWrite: false,
      vertexShader: `
      attribute vec3 aSeed; attribute float aEnd; attribute float aR;
      uniform float uFall; uniform vec2 uDrift; uniform vec3 uCenter, uBox, uVel;
      varying float vA;
      void main(){
        vec3 lo = uCenter - uBox * 0.5;
        vec3 q = aSeed * uBox; float sp = 0.85 + aR * 0.3;
        q.y -= uFall * sp; q.xz += uDrift * sp;
        q = lo + mod(q - lo, uBox);
        vec3 tail = q - normalize(uVel) * (1.6 + aR * 1.4);
        vec4 mv = modelViewMatrix * vec4(mix(q, tail, aEnd), 1.0);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        vec3 e = abs((q - uCenter) / uBox) * 2.0;
        vA = (1.0 - aEnd * 0.85) * (1.0 - smoothstep(uBox.x * 0.25, uBox.x * 0.5, d)) * (1.0 - smoothstep(0.8, 1.0, e.y));
      }`,
      fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vA;
      void main(){ gl_FragColor = vec4(uColor, vA * uOpacity * 0.55); }`
    } );
    const ls = new T.LineSegments( g, mat );
    ls.frustumCulled = false; ls.renderOrder = 6;
    return { points: ls, u };
  }

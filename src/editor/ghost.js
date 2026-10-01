    /* ---------- hologram ghost: the real asset's meshes, semi-transparent clones of their real materials + a fresnel / scan-line shell ---------- */
    const holoU = { uTime: { value: 0 }, uColor: { value: new T.Color( 0x6cf2c2 ) }, uOpacity: { value: 1 } };
    const holoMat = new T.ShaderMaterial( {
      uniforms: holoU, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 mv = modelViewMatrix * vec4( position, 1.0 ); vN = normalize( normalMatrix * normal ); vV = -mv.xyz; vY = ( modelMatrix * vec4( position, 1.0 ) ).y; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uColor; uniform float uTime, uOpacity; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = pow( 1.0 - abs( dot( normalize( vN ), normalize( vV ) ) ), 2.2 ); float scan = 0.5 + 0.5 * sin( vY * 5.0 - uTime * 2.5 ); float sweep = smoothstep( 0.96, 1.0, sin( vY * 0.35 - uTime * 1.2 ) ); float a = ( 0.14 + f * 0.62 + scan * 0.06 + sweep * 0.25 ) * uOpacity; gl_FragColor = vec4( uColor * ( 0.7 + f * 0.9 + sweep ), a ); }'
    } );
    const ghostMatCache = new Map();
    function ghostMaterial ( src )      // same material (map, vertex colours, procedural stone / timber / tile shading, wind) - just translucent
    {
      let g = ghostMatCache.get( src ); if ( g ) return g;
      g = src.clone(); g.onBeforeCompile = src.onBeforeCompile; g.customProgramCacheKey = src.customProgramCacheKey;
      g.transparent = true; g.opacity = 0.6; g.depthWrite = true; ghostMatCache.set( src, g ); return g;
    }
    function ghostify ( asset )
    {
      const view = asset.clone( true );      // shares geometry; every mesh keeps its real hierarchy and transform
      const meshes = []; view.traverse( n => { if ( n.isMesh ) meshes.push( n ); } );
      meshes.forEach( m =>
      {
        m.material = Array.isArray( m.material ) ? m.material.map( ghostMaterial ) : ghostMaterial( m.material );
        m.castShadow = m.receiveShadow = false; m.customDepthMaterial = undefined; m.renderOrder = 6;
        const shell = new T.Mesh( m.geometry, holoMat ); shell.renderOrder = 7; shell.raycast = () => { }; m.add( shell );
      } );
      return view;
    }
    const ghostRoot = new T.Group(); ghostRoot.visible = false; scene.add( ghostRoot );
    const ghost = { live: false, view: null, asset: null, key: '', dirty: false, t: 0 };
    const ghostPool = new Map(), GHOST_POOL_LIMIT = 8;
    function disposeGhost () { if ( ghost.view ) ghostRoot.remove( ghost.view ); ghost.view = ghost.asset = null; ghost.key = ''; ghost.dirty = false; }
    function useGhost ( key, createAsset )
    {
      let entry = ghostPool.get( key );
      if ( !entry ) { const asset = createAsset(); entry = { asset, view: ghostify( asset ) }; }
      ghostPool.delete( key ); ghostPool.set( key, entry );
      if ( ghost.view ) ghostRoot.remove( ghost.view );
      ghost.key = key; ghost.asset = entry.asset; ghost.view = entry.view; ghostRoot.add( ghost.view );
      while ( ghostPool.size > GHOST_POOL_LIMIT )
      {
        const oldest = [ ...ghostPool.keys() ].find( k => k !== ghost.key ); if ( oldest === undefined ) break;
        const stale = ghostPool.get( oldest ); ghostPool.delete( oldest ); disposeAsset( stale.asset );
      }
    }
    function showProto () { useGhost( 'rigid:' + sess.type, () => { const a = getAssetPrototype( sess.type ).clone( true ); a.userData.sharedGeometry = true; return a; } ); ghost.exact = false; }
    function buildExact ()      // terrain-draped asset at the final pose; built only after the cursor / gizmo rests, then adopted by confirm
    {
      const it = sessItem( sess ); ghost.dirty = false; useGhost( JSON.stringify( it ), () => buildAsset( it, false ) ); ghost.exact = true;
      ghostRoot.position.set( 0, 0, 0 ); ghostRoot.rotation.set( 0, 0, 0 ); ghostRoot.scale.setScalar( 1 );
    }
    function buildGhost () { disposeGhost(); ghost.live = !RIGID[ sess.type ]; ghost.exact = false; ghost.t = performance.now(); ghost.dirty = ghost.live; showProto(); }
    function takeGhostAsset ( item )
    {
      if ( !ghost.live || !ghost.exact || ghost.dirty || !ghost.asset || ghost.key !== JSON.stringify( item ) ) return null;
      const a = ghost.asset; ghostPool.delete( ghost.key ); return a;
    }

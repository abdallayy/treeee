  /* ---- Meadow: wind-swayed grass + flowers over the WHOLE map, in frustum-culled / LOD'd chunks ---- */
  const meadow = [], CELL = 80;
  ( function meadowBuild ()
  {
    const rnd = mulberry32( 31337 ), NC = MAP / CELL, GMAX = isMobile ? 900 : 2000;
    const P = [], Cc = [], Nn = [], I = [];      // one tuft = 5 blades at baked orientations
    for ( let b = 0; b < 5; b++ )
    {
      const ox = ( rnd() - 0.5 ) * 0.4, oz = ( rnd() - 0.5 ) * 0.4, ang = rnd() * 6.28, h = 0.5 + rnd() * 0.3, w = 0.05 + rnd() * 0.02;
      const dx = Math.cos( ang ), dz = Math.sin( ang ), px = -dz, pz = dx, bend = 0.1 + rnd() * 0.15, base = P.length / 3;
      const v = ( t, hw, y ) => { P.push( ox + dx * bend * t * t * 1.4 + px * hw, y, oz + dz * bend * t * t * 1.4 + pz * hw ); Nn.push( 0, 1, 0 ); const k = 0.4 + 0.6 * t; Cc.push( k, k, k ); };
      v( 0, -w, 0 ); v( 0, w, 0 ); v( 0.55, -w * 0.7, h * 0.55 ); v( 0.55, w * 0.7, h * 0.55 ); v( 1, 0, h );
      I.push( base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 2, base + 3, base + 4 );
    }
    const gGeo = new T.BufferGeometry(); gGeo.setIndex( I );
    gGeo.setAttribute( 'position', new T.Float32BufferAttribute( P, 3 ) ); gGeo.setAttribute( 'normal', new T.Float32BufferAttribute( Nn, 3 ) ); gGeo.setAttribute( 'color', new T.Float32BufferAttribute( Cc, 3 ) );
    const gMat = new T.MeshStandardMaterial( { vertexColors: true, roughness: 0.85, side: T.DoubleSide } ); addWind( gMat, 'grass' );
    // flower: stem + cup head (near-white vertex colour = tinted per instance) + yellow centre
    const fGeo = mkGeo( [ [ cyl4, [ 0, 0.16, 0, 0.012, 0.32, 0.012 ], '#3f7a2a' ], [ cup6, [ 0, 0.34, 0, 0.11, 0.06, 0.11 ], '#ffffff' ], [ ico0, [ 0, 0.37, 0, 0.045, 0.04, 0.045 ], '#f2b820' ] ], 0.5 );
    const fMat = new T.MeshStandardMaterial( { vertexColors: true, roughness: 0.7 } ); addWind( fMat, 'grass' );
    const ob = fMat.onBeforeCompile;
    fMat.onBeforeCompile = sh => { ob( sh ); sh.vertexShader = sh.vertexShader.replace( '#include <color_vertex>', 'vColor = color; if ( min( color.r, min( color.g, color.b ) ) > 0.6 ) vColor = instanceColor;' ); };
    fMat.customProgramCacheKey = () => 'wind-flower';
    const FCOL = [ '#e0262e', '#f6d21f', '#9350d9', '#fbfbf4' ].map( C );      // red, yellow, purple, white
    const m4 = new T.Matrix4(), col = new T.Color(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3();
    for ( let cz = 0; cz < NC; cz++ ) for ( let cx = 0; cx < NC; cx++ )
    {
      const x0 = -HALF + cx * CELL, z0 = -HALF + cz * CELL, mx = x0 + CELL / 2, mz = z0 + CELL / 2;
      const nG = Math.floor( GMAX * ( 0.22 + 0.78 * Math.exp( -( mx * mx + mz * mz ) / 90000 ) ) ), nFmax = Math.ceil( nG * 0.35 );
      const gm = new T.InstancedMesh( gGeo, gMat, nG ), fm = new T.InstancedMesh( fGeo, fMat, nFmax );
      let n = 0, nf = 0;
      for ( let i = 0; i < nG; i++ )
      {
        const x = x0 + rnd() * CELL, z = z0 + rnd() * CELL, h = hGrid( x, z );
        if ( noise2( x * 0.08 + 3, z * 0.08 ) < 0.22 && rnd() < 0.6 ) continue;
        if ( riverDist( x, z ) < 8.5 || ( h > 60 && rnd() < ( h - 60 ) / 45 ) ) continue;
        if ( Math.abs( x ) < 210 && Math.abs( z ) < 210 && pathDist( x, z ) < 1.3 ) continue;
        if ( farmZones.some( f => ( f.x - x ) ** 2 + ( f.z - z ) ** 2 < f.r * f.r ) ) continue;
        if ( placed.some( t => ( t.x - x ) ** 2 + ( t.z - z ) ** 2 < t.r * t.r * 0.8 ) ) continue;
        if ( Math.hypot( hGrid( x - 1.5, z ) - hGrid( x + 1.5, z ), hGrid( x, z - 1.5 ) - hGrid( x, z + 1.5 ) ) / 3 > 0.75 ) continue;
        const s = 0.75 + rnd() * 0.9;
        ps.set( x, h - 0.03, z ); sc.set( s, s * ( 0.8 + rnd() * 0.6 ), s ); m4.compose( ps, q.identity(), sc ); gm.setMatrixAt( n, m4 );
        col.setHSL( 0.22 + rnd() * 0.09 - noise2( x * 0.03, z * 0.03 ) * 0.04, 0.45 + rnd() * 0.2, 0.26 + rnd() * 0.14 ).convertSRGBToLinear(); gm.setColorAt( n, col ); n++;
        if ( nf < nFmax && rnd() < 0.03 + 0.3 * smoothstep( 0.5, 0.78, noise2( x * 0.05 + 9, z * 0.05 + 4 ) ) )
        {
          const fx = x + ( rnd() - 0.5 ) * 1.2, fz = z + ( rnd() - 0.5 ) * 1.2, fs = 1.4 + rnd() * 0.9;
          const ci = rnd() < 0.55 ? Math.floor( rnd() * 4 ) : Math.min( 3, Math.floor( noise2( x * 0.03 + 50, z * 0.03 ) * 4.6 ) );
          ps.set( fx, h - 0.02, fz ); sc.setScalar( fs ); q.setFromAxisAngle( Y_AXIS, rnd() * 6.28 ); m4.compose( ps, q, sc ); fm.setMatrixAt( nf, m4 );
          fm.setColorAt( nf, col.copy( FCOL[ ci ] ).multiplyScalar( 0.9 + rnd() * 0.2 ) ); nf++;
        }
      }
      [ gm, fm ].forEach( ( im, k ) => { im.instanceMatrix.needsUpdate = true; if ( im.instanceColor ) im.instanceColor.needsUpdate = true; im.frustumCulled = false; im.receiveShadow = true; im.count = k ? nf : n; im.visible = false; scene.add( im ); } );
      meadow.push( { x: mx, z: mz, y: hGrid( mx, mz ), gm, fm, n, nf } );
    }
  } )();
  const _fr = new T.Frustum(), _pm = new T.Matrix4(), _sp = new T.Sphere( new T.Vector3(), 110 );
  function updateMeadow ()
  {
    _pm.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ); _fr.setFromProjectionMatrix( _pm );
    const cp = camera.position;
    for ( const c of meadow )
    {
      const d = Math.hypot( c.x - cp.x, c.z - cp.z ); _sp.center.set( c.x, c.y + 15, c.z );
      const vis = d < Q.grassDist && _fr.intersectsSphere( _sp ), f = d < Q.grassDist * 0.33 ? 1 : d < Q.grassDist * 0.65 ? 0.5 : 0.22;
      c.gm.visible = vis && c.n > 0; c.fm.visible = vis && c.nf > 0;
      if ( vis ) { c.gm.count = Math.ceil( c.n * f ); c.fm.count = Math.ceil( c.nf * f ); }
    }
    for ( const s of stoneChunks )      // stones: same per-chunk frustum + distance culling
    {
      const d = Math.hypot( s.x - cp.x, s.z - cp.z ); _sp.center.set( s.x, 30, s.z ); _sp.radius = s.r;
      s.im.visible = d - s.r < Q.grassDist * 1.8 && _fr.intersectsSphere( _sp ); _sp.radius = 110;
    }
  }

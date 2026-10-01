  /* =====================================================================
   *  4. THE FOUR PROCEDURAL TREE SPECIES
   *  Each builder returns { bark, leaf, H } – two merged BufferGeometries.
   * ===================================================================== */

  /* ---- 4a. ROUNDED OAK: thick curved trunk + layered, tufted spherical canopy ---- */
  function buildOak ( seed )
  {
    R = mulberry32( seed );
    const H = 11, bark = new Mesher( H ), leaf = new Mesher( H );
    const barkCol = C( '#6d4c33' );
    const lean = ( R() - 0.5 ) * 1.4;
    const pts = [ [ 0, -0.5, 0 ], [ 0.3 * lean, 1.3, 0.2 ], [ -0.45 + 0.6 * lean, 2.7, 0.35 ], [ 0.35, 4.2, -0.15 ], [ 0.05 + 0.3 * lean, 5.6, 0.1 ] ]
      .map( a => new T.Vector3( a[ 0 ], a[ 1 ], a[ 2 ] ) );
    const trunk = tube( pts, t => 0.72 * ( 1 - t ) + 0.32 * t + 0.5 * Math.exp( -t * 7 ), 14, 26, 0.10 );
    bark.add( trunk, ID, { color: barkCol, grad: 0.15, sway: 1 } );
    addRoots( bark, barkCol, 4, 0.85, 1.3 );
    const curve = trunk.userData.curve;

    const lobes = [];
    lobes.push( { c: new T.Vector3( 0.2 + 0.3 * lean, 7.4, 0 ), r: 3.0 } );                    // crown
    const n = 8;
    for ( let i = 0; i < n; i++ )
    {                                                          // skirt of big lobes
      const a = i / n * Math.PI * 2 + R() * 0.6, rad = 2.4 + R() * 0.9, y = 6.0 + R() * 1.3 + ( i % 2 ) * 0.7;
      lobes.push( { c: new T.Vector3( Math.cos( a ) * rad + 0.2, y, Math.sin( a ) * rad ), r: 1.55 + R() * 0.75 } );
    }
    for ( let i = 0; i < 3; i++ )
    {                                                          // upper layer
      const a = R() * 6.28;
      lobes.push( { c: new T.Vector3( Math.cos( a ) * 1.3, 9.0 + R() * 0.6, Math.sin( a ) * 1.3 ), r: 1.4 + R() * 0.5 } );
    }
    // branches from the trunk into every second skirt lobe
    lobes.forEach( ( L, i ) =>
    {
      if ( i > 0 && i <= n && i % 2 === 0 )
      {
        const s = curve.getPointAt( 0.62 + R() * 0.3 );
        const e = L.c.clone().lerp( s, 0.25 );
        const mid = s.clone().lerp( e, 0.5 ).add( new T.Vector3( ( R() - 0.5 ) * 0.6, 0.7, ( R() - 0.5 ) * 0.6 ) );
        bark.add( tube( [ s, mid, e ], t => 0.21 * ( 1 - t ) + 0.07 * t, 7, 8, 0.05 ), ID, { color: barkCol, grad: 0.15, sway: 1 } );
      }
    } );
    lobes.forEach( L =>
    {
      const up = clamp( ( L.c.y - 5 ) / 5, 0, 1 );
      addLobe( leaf, BLOBS_FLAT, L.c, L.r, pick( OAK, up ), { grad: 0.4 } );
      const k = 3 + Math.floor( R() * 2 );                                                   // surface tufts = "layered" look
      for ( let j = 0; j < k; j++ )
      {
        const d = randUnit(); d.y = Math.abs( d.y ) * 0.8 + 0.1;
        addLobe( leaf, BLOBS_FLAT_S, L.c.clone().addScaledVector( d, L.r * 0.78 ), L.r * 0.45, pick( OAK, up + 0.25 ), { grad: 0.45, squash: 0.8 } );
      }
    } );
    return { bark: bark.build(), leaf: leaf.build(), H };
  }

  /* ---- 4b. PINE: tall straight trunk + stacked, jagged cone tiers ---- */
  function buildPine ( seed )
  {
    R = mulberry32( seed );
    const H = 13.5, bark = new Mesher( H ), leaf = new Mesher( H );
    const barkCol = C( '#5a4130' );
    const pts = [ [ 0, -0.5, 0 ], [ 0.08 * ( R() - 0.5 ) * 2, 4.5, 0.05 ], [ 0, 9, -0.05 ], [ 0.05, 12, 0 ] ].map( a => new T.Vector3( a[ 0 ], a[ 1 ], a[ 2 ] ) );
    bark.add( tube( pts, t => 0.45 * ( 1 - t ) + 0.10 * t + 0.4 * Math.exp( -t * 10 ), 10, 22, 0.08 ), ID, { color: barkCol, grad: 0.2, sway: 1 } );
    addRoots( bark, barkCol, 3, 0.55, 0.9 );
    const layers = 7 + Math.floor( R() * 2 );
    for ( let i = 0; i < layers; i++ )
    {
      const t = i / ( layers - 1 );
      const y = 2.4 + t * 8.4, rad = lerp( 3.3, 0.85, Math.pow( t, 0.9 ) ) * ( 0.92 + R() * 0.16 ), h = lerp( 3.3, 2.1, t );
      const col = pick( PINE, t );
      leaf.add( jaggedCone( rad, h, 9, 0.18 ), M( 0, y + h / 2, 0, 1, 1, 1, 0, R() * 6.28, 0 ), { color: col, grad: 0.45, sway: 1, flutter: 0.35 } );
      const m = 9;                                     // needle clusters drooping off the rim
      for ( let k = 0; k < m; k++ )
      {
        const a = k / m * Math.PI * 2 + R() * 0.5;
        const dir = new T.Vector3( Math.cos( a ) * 0.75, -0.62, Math.sin( a ) * 0.75 );
        const pos = new T.Vector3( Math.cos( a ) * rad * 0.84, y + 0.25, Math.sin( a ) * rad * 0.84 );
        const s = 0.55 + rad * 0.12;
        leaf.add( new T.ConeGeometry( 0.26, 1.2, 5, 1 ), MD( pos, dir, s, s, s ), { color: pick( PINE, t * 0.7 ), grad: 0.4, sway: 1, flutter: 0.9 } );
      }
    }
    leaf.add( new T.ConeGeometry( 0.5, 2.0, 6, 1 ), M( 0, 13.0, 0 ), { color: PINE[ 4 ], grad: 0.3, sway: 1, flutter: 0.3 } );
    return { bark: bark.build(), leaf: leaf.build(), H };
  }

  /* ---- 4c. CHERRY BLOSSOM: twisted trunk, umbrella of soft pink clouds ---- */
  function buildSakura ( seed )
  {
    R = mulberry32( seed );
    const H = 9.5, bark = new Mesher( H ), leaf = new Mesher( H );
    const barkCol = C( '#52372c' );
    const lean = ( R() - 0.5 ) * 1.0, tw = R() * 6.28, N = 7, pts = [];
    for ( let i = 0; i <= N; i++ )
    {
      const t = i / N, ang = tw + t * 3.4, rad = 0.45 * Math.sin( t * Math.PI ) * ( 0.7 + 0.3 * R() );
      pts.push( new T.Vector3( Math.cos( ang ) * rad + lean * t * t, t * 3.4 - 0.5, Math.sin( ang ) * rad ) );   // the twist
    }
    bark.add( tube( pts, t => 0.6 * ( 1 - t ) + 0.3 * t + 0.42 * Math.exp( -t * 8 ), 10, 30, 0.14 ), ID, { color: barkCol, grad: 0.15, sway: 1 } );
    addRoots( bark, barkCol, 4, 0.7, 1.1 );
    const top = pts[ N ], ends = [];
    const nL = 4;
    for ( let k = 0; k < nL; k++ )
    {
      const a = k / nL * Math.PI * 2 + R() * 0.8;
      const dir = new T.Vector3( Math.cos( a ), 0, Math.sin( a ) ), perp = new T.Vector3( -dir.z, 0, dir.x );
      const p = [ top.clone(),
      top.clone().addScaledVector( dir, 1.0 ).addScaledVector( perp, 0.4 ).add( new T.Vector3( 0, 0.9, 0 ) ),
      top.clone().addScaledVector( dir, 2.3 ).addScaledVector( perp, -0.3 ).add( new T.Vector3( 0, 1.9, 0 ) ),
      top.clone().addScaledVector( dir, 3.4 ).add( new T.Vector3( 0, 2.6 + R() * 0.8, 0 ) ) ];
      bark.add( tube( p, t => 0.27 * ( 1 - t ) + 0.07 * t, 7, 16, 0.12 ), ID, { color: barkCol, grad: 0.15, sway: 1 } );
      const end = p[ 3 ]; ends.push( end );
      for ( let j = 0; j < 2; j++ )
      {                    // twigs to satellite lobes
        const off = new T.Vector3( ( R() - 0.5 ) * 3.4, -0.3 + R() * 0.9, ( R() - 0.5 ) * 3.4 );
        const e2 = end.clone().add( off );
        bark.add( tube( [ end.clone(), end.clone().lerp( e2, 0.5 ).add( new T.Vector3( 0, 0.4, 0 ) ), e2 ], t => 0.09 * ( 1 - t ) + 0.035, 5, 6, 0.05 ), ID, { color: barkCol, grad: 0.1, sway: 1 } );
        ends.push( e2 );
      }
    }
    ends.push( top.clone().add( new T.Vector3( 0, 3.6, 0 ) ) );
    ends.forEach( e =>
    {
      const r = 1.55 + R() * 0.65, up = clamp( ( e.y - 4 ) / 5, 0, 1 );
      addLobe( leaf, BLOBS_SOFT, e, r, pick( SAKURA, 0.35 + up * 0.5 ), { grad: 0.3, flutter: 1.4 } );
      for ( let j = 0; j < 4; j++ )
      {                    // blossom puffs on the surface
        const d = randUnit(); d.y = d.y * 0.7 + 0.25;
        addLobe( leaf, BLOBS_SOFT_S, e.clone().addScaledVector( d, r * 0.8 ), r * 0.42, pick( SAKURA, 0.6 + R() * 0.4 ), { grad: 0.3, flutter: 1.8, squash: 0.8 } );
      }
      for ( let j = 0; j < 2; j++ )
      {                    // hanging blossom clumps
        const a = R() * 6.28;
        addLobe( leaf, BLOBS_SOFT_S, e.clone().add( new T.Vector3( Math.cos( a ) * r * 0.7, -r * 0.82, Math.sin( a ) * r * 0.7 ) ), 0.38 + R() * 0.2, pick( SAKURA, 0.8 ), { grad: 0.2, flutter: 2.4, squash: 1.1 } );
      }
    } );
    return { bark: bark.build(), leaf: leaf.build(), H };
  }

  /* ---- 4d. FANTASY TREE: bulbous toon spheres + swollen, hollowed trunk ---- */
  function buildFantasy ( seed )
  {
    R = mulberry32( seed );
    const H = 10.5, bark = new Mesher( H ), leaf = new Mesher( H );
    const barkCol = C( '#8b6a50' ), darkCol = C( '#1a0f0a' ), rimCol = C( '#a8805a' );
    const lean = ( R() - 0.5 ) * 1.2;
    const pts = [ [ 0, -0.6, 0 ], [ 0.4 * lean, 1.2, 0.3 ], [ -0.5 + 0.4 * lean, 3.0, -0.1 ], [ 0.45, 4.8, 0.25 ], [ 0, 6.2, 0 ] ].map( a => new T.Vector3( a[ 0 ], a[ 1 ], a[ 2 ] ) );
    const radiusFn = t => 0.40 + 0.95 * Math.exp( -t * 4.5 ) + 0.28 * Math.sin( Math.min( t * 3.2, 3.14 ) );
    const trunk = tube( pts, radiusFn, 16, 30, 0.05 );
    bark.add( trunk, ID, { color: barkCol, grad: 0.18, sway: 1 } );
    addRoots( bark, barkCol, 5, 1.2, 1.5 );
    const curve = trunk.userData.curve;

    // Hollows: dark cavity + raised bark rim, oriented along the trunk surface normal
    function hollow ( t, yaw, k )
    {
      const P = curve.getPointAt( t ), r = radiusFn( t );
      const dir = new T.Vector3( Math.sin( yaw ), 0, Math.cos( yaw ) );
      const c = P.clone().addScaledVector( dir, r * 0.9 );
      const q = new T.Quaternion().setFromUnitVectors( new T.Vector3( 0, 0, 1 ), dir );
      bark.add( new T.SphereGeometry( 0.5, 14, 10 ), MQ( c, q, new T.Vector3( 0.85 * k, 1.2 * k, 0.45 * k ) ), { color: darkCol, grad: 0, sway: 1 } );
      bark.add( new T.TorusGeometry( 0.46, 0.12, 8, 18 ), MQ( c.clone().addScaledVector( dir, 0.1 * k ), q, new T.Vector3( 0.88 * k, 1.25 * k, 1 ) ), { color: rimCol, grad: 0.1, sway: 1 } );
    }
    const yaw = R() * 6.28;
    hollow( 0.17, yaw, 1.0 );
    hollow( 0.46, yaw + 1.9, 0.55 );

    const lobes = [ { c: new T.Vector3( 0.2, 8.0, 0 ), r: 2.8 } ];
    for ( let i = 0; i < 7; i++ )
    {
      const a = i / 7 * Math.PI * 2 + R() * 0.5, rad = 2.6 + R() * 0.4;
      lobes.push( { c: new T.Vector3( Math.cos( a ) * rad + 0.2, 6.8 + R() * 1.5, Math.sin( a ) * rad ), r: 1.7 + R() * 0.5 } );
    }
    for ( let i = 0; i < 4; i++ )
    {
      const a = R() * 6.28;
      lobes.push( { c: new T.Vector3( Math.cos( a ) * 1.4, 9.6 + R() * 0.6, Math.sin( a ) * 1.4 ), r: 1.3 + R() * 0.4 } );
    }
    const top = pts[ 4 ];
    lobes.forEach( ( L, i ) =>
    {
      if ( i > 0 && i < 8 && i % 2 === 1 )
      {
        const e = L.c.clone().lerp( top, 0.3 ), mid = top.clone().lerp( e, 0.5 ).add( new T.Vector3( 0, 0.5, 0 ) );
        bark.add( tube( [ top.clone(), mid, e ], t => 0.3 * ( 1 - t ) + 0.1 * t, 8, 8, 0.04 ), ID, { color: barkCol, grad: 0.15, sway: 1 } );
      }
      const up = clamp( ( L.c.y - 6 ) / 4, 0, 1 );
      leaf.add( SPHERE, M( L.c.x, L.c.y, L.c.z, L.r, L.r * 0.92, L.r ), { color: pick( FANTASY, up ), grad: 0.42, sway: 1, flutter: 0.6 } );
    } );
    for ( let i = 0; i < 9; i++ )
    {                         // extra bulbs for a puffy toon silhouette
      const L = lobes[ Math.floor( R() * lobes.length ) ], d = randUnit(); d.y = Math.abs( d.y ) * 0.7 + 0.15;
      const r = 0.6 + R() * 0.35, c = L.c.clone().addScaledVector( d, L.r * 0.92 );
      leaf.add( SPHERE, M( c.x, c.y, c.z, r ), { color: pick( FANTASY, 0.75 ), grad: 0.4, sway: 1, flutter: 0.8 } );
    }
    return { bark: bark.build(), leaf: leaf.build(), H };
  }

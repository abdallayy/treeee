  /* =====================================================================
   *  10. BUILD THE WORLD
   * ===================================================================== */
  const barkTex = makeBarkTexture(), leafTex = makeLeafTexture(), groundTex = makeGroundTexture();
  groundTex.repeat.set( MAP / 4.2, MAP / 4.2 );

  const barkMat = new T.MeshStandardMaterial( { map: barkTex, bumpMap: barkTex, bumpScale: 0.8, vertexColors: true, roughness: 0.95, metalness: 0 } );
  const leafMats = {
    oak: new T.MeshStandardMaterial( { vertexColors: true, flatShading: true, roughness: 0.85, map: leafTex } ),
    pine: new T.MeshStandardMaterial( { vertexColors: true, flatShading: true, roughness: 0.9, map: leafTex } ),
    sakura: new T.MeshStandardMaterial( { vertexColors: true, roughness: 0.72, map: leafTex, emissive: C( '#ff7fa8' ), emissiveIntensity: 0.05 } ),
    fantasy: new T.MeshStandardMaterial( { vertexColors: true, roughness: 0.4, metalness: 0.0, emissive: C( '#2b7a1a' ), emissiveIntensity: 0.07 } )
  };
  addWind( barkMat, 'tree' ); Object.values( leafMats ).forEach( m => addWind( m, 'tree' ) );
  const treeDepth = new T.MeshDepthMaterial( { depthPacking: T.RGBADepthPacking } );
  addWind( treeDepth, 'tree' );

  /* ---- Terrain --------------------------------------------------------- */
  const SEG = isMobile ? 380 : 500, DX = MAP / SEG, TG = { h: null };
  function hGrid ( x, z )          // bilinear height on the rendered terrain grid (fast; matches the mesh)
  {
    const NS = SEG + 1, fx = clamp( ( x + HALF ) / DX, 0, SEG - 1e-3 ), fz = clamp( ( z + HALF ) / DX, 0, SEG - 1e-3 ), ix = fx | 0, iz = fz | 0, tx = fx - ix, tz = fz - iz, h = TG.h, i = iz * NS + ix;
    return lerp( lerp( h[ i ], h[ i + 1 ], tx ), lerp( h[ i + NS ], h[ i + NS + 1 ], tx ), tz );
  }
  function groundNormal ( x, z ) { const e = 1.5; return new T.Vector3( terrainHeight( x - e, z ) - terrainHeight( x + e, z ), 2 * e, terrainHeight( x, z - e ) - terrainHeight( x, z + e ) ).normalize(); }
  const terrainGeo = new T.PlaneGeometry( MAP, MAP, SEG, SEG );
  terrainGeo.rotateX( -Math.PI / 2 );
  // Dirt tracks linking the castles (sampled polylines used to tint the terrain)
  const ringPts = ( cx, cz, r, n ) => Array.from( { length: n }, ( _, i ) => { const a = i / n * 6.283, rr = r + 2.2 * Math.sin( a * 3 + 1 ); return [ cx + Math.cos( a ) * rr, cz + Math.sin( a ) * rr ]; } );
  const PATHS = [
    [ [ -50, -35.5 ], [ -45, -33 ], [ -38, -32 ], [ -30, -27 ], [ -21, -27 ], [ -13, -21 ], [ -7, -15 ], [ bridgeX - 5, -13.7 ], [ bridgeX, -12 ], [ bridgeX + 5, -10.3 ], [ 13, -7 ], [ 20, -2 ], [ 27, 3 ], [ 33, 6 ], [ 40, 8 ] ],
    ringPts( CASTLE.x, CASTLE.z, 28, 16 ), ringPts( FV.x, FV.z, 10, 10 ),
    [ [ 40, 8 ], [ 46, 16 ], [ 54, 21 ], [ 63, 17 ] ], [ [ 40, 8 ], [ 44, -2 ], [ 52, -9 ], [ 58, -21 ] ],
    [ [ 40, 8 ], [ 37, 26 ], [ 31, 42 ], [ 22, 53 ], [ 14, 62 ], [ 7, 62.6 ], [ stoneX, 62 ], [ stoneX - 8, 63 ], [ -18, 65 ], [ -40, 69 ], [ -64, 72 ], [ -86, 76 ] ],
    [ [ 14, 62 ], [ 35, 64 ], [ 60, 66 ], [ 96, 68 ] ], [ [ 31, 42 ], [ 22, 41 ], [ 14, 40 ] ],
    [ [ -64, -14 ], [ -78, 0 ], [ -92, 18 ], [ -100, 30 ], [ -96, 52 ], [ -86, 76 ] ],
    [ [ 58, -21 ], [ 75, -24 ], [ 90, -28 ], [ 104, -30 ], [ 102, -50 ], [ 100, -66 ] ], [ [ 58, -21 ], [ 58, -45 ], [ 57, -65 ], [ 58, -82 ] ],
    [ [ -30, -27 ], [ -28, -42 ], [ -25, -55 ], [ -23, -62 ] ]
  ].map( ( pts, i ) => new T.CatmullRomCurve3( pts.map( a => new T.Vector3( a[ 0 ], 0, a[ 1 ] ) ), i === 1 || i === 2 ).getPoints( 70 ) );
  function pathDist ( x, z )
  {
    let best = 1e9;
    for ( const pl of PATHS ) for ( let i = 0; i < pl.length; i++ ) { const dx = pl[ i ].x - x, dz = pl[ i ].z - z, d = dx * dx + dz * dz; if ( d < best ) best = d; }
    return Math.sqrt( best );
  }
  ( function shapeTerrain ()
  {
    const p = terrainGeo.attributes.position, cols = new Float32Array( p.count * 3 ), NS = SEG + 1, hg = new Float32Array( p.count );
    for ( let i = 0; i < p.count; i++ ) hg[ i ] = terrainHeight( p.getX( i ), p.getZ( i ) );
    TG.h = hg;
    const cGrassA = C( '#4a8434' ), cGrassB = C( '#6c9f3e' ), cDry = C( '#8c9a4c' ), cSoil = C( '#5b4431' ), cRock = C( '#7d786f' ), cPath = C( '#a8894f' ), cMud = C( '#6b5a3c' ), cSand = C( '#9a8a62' ), cRockD = C( '#59554f' ), cSnow = C( '#f0f4f7' ), cAlpine = C( '#6d7e55' );
    const col = new T.Color(), rk = new T.Color();
    for ( let i = 0; i < p.count; i++ )
    {
      const x = p.getX( i ), z = p.getZ( i ), h = hg[ i ];
      p.setY( i, h );
      const r = Math.hypot( x, z );
      const ix = i % NS, iz = ( i / NS ) | 0, sx = ( hg[ ix > 0 ? i - 1 : i ] - hg[ ix < SEG ? i + 1 : i ] ) / ( 2 * DX ), sz = ( hg[ iz > 0 ? i - NS : i ] - hg[ iz < SEG ? i + NS : i ] ) / ( 2 * DX );
      const slope = Math.hypot( sx, sz );
      const n1 = noise2( x * 0.05, z * 0.05 ), n2 = noise2( x * 0.3, z * 0.3 );
      col.copy( cGrassA ).lerp( cGrassB, smoothstep( 0.3, 0.7, n1 ) );
      col.lerp( cDry, smoothstep( 0.62, 0.85, noise2( x * 0.02 + 40, z * 0.02 ) ) * 0.55 );
      col.lerp( cSoil, smoothstep( 0.62, 0.74, n2 * 0.5 + noise2( x * 0.09, z * 0.09 ) * 0.5 ) * ( 1 - smoothstep( 60, 95, r ) ) );
      if ( r < 200 )
      {                                              // dirt tracks between the castles
        const pd = pathDist( x, z );
        col.lerp( cPath, ( 1 - smoothstep( 1.1, 2.6 + n2 * 0.8, pd ) ) * 0.9 );
      }
      const rm = riverMask( x, z );
      if ( rm > 0 )
      {                                               // muddy banks, sandy bed
        const dr = riverDist( x, z );
        col.lerp( cMud, ( 1 - smoothstep( 5.5, 10, dr ) ) * 0.75 * rm );
        col.lerp( cSand, ( 1 - smoothstep( 3, 6.5, dr ) ) * rm );
      }
      col.lerp( cAlpine, smoothstep( 28, 62, h ) );
      rk.copy( cRock ).lerp( cRockD, n2 );
      col.lerp( rk, clamp( smoothstep( 0.42, 0.85, slope + ( n2 - 0.5 ) * 0.25 ) + smoothstep( 70, 115, h ) * 0.45, 0, 1 ) );
      col.lerp( cSnow, smoothstep( 95, 125, h + ( n2 - 0.5 ) * 14 ) * ( 1 - smoothstep( 0.8, 1.4, slope ) * 0.6 ) );
      cols[ i * 3 ] = col.r; cols[ i * 3 + 1 ] = col.g; cols[ i * 3 + 2 ] = col.b;
    }
    terrainGeo.setAttribute( 'color', new T.BufferAttribute( cols, 3 ) );
    terrainGeo.computeVertexNormals();
  } )();
  const terrainMat = new T.MeshStandardMaterial( { vertexColors: true, map: groundTex, bumpMap: groundTex, bumpScale: 0.6, roughness: 0.95, metalness: 0 } );
  const terrain = new T.Mesh( terrainGeo, terrainMat );
  terrain.receiveShadow = true;
  scene.add( terrain );

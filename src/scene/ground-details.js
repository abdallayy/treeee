  /* ---- Soil patches with grass-blended edges at every trunk base --------- */
  function makeSoilGeo ( list, dy, hf )      // draped vertex-by-vertex on the terrain (+dy when a tree is raised in the editor)
  {
    dy = dy || 0; hf = hf || terrainHeight; const pos = [], col = [], nor = [], idx = [];
    const RS = 5, SEG = 22;
    const soilD = C( '#3f2e20' ), soilM = C( '#5d4730' ), grass = C( '#587f38' ), tmp = new T.Color();
    list.forEach( t =>
    {
      const base = pos.length / 3, r = t.r * 1.15;
      const vi = ( ring, s ) => ring === 0 ? base : base + 1 + ( ring - 1 ) * SEG + ( s % SEG );
      pos.push( t.x, hf( t.x, t.z ) + 0.05 + dy, t.z ); nor.push( 0, 1, 0 ); col.push( soilD.r, soilD.g, soilD.b );
      for ( let ring = 1; ring <= RS; ring++ ) for ( let s = 0; s < SEG; s++ )
      {
        const a = s / SEG * Math.PI * 2, wob = 0.85 + 0.3 * noise2( Math.cos( a ) * 2 + t.x, Math.sin( a ) * 2 + t.z );
        const rr = ring / RS * r * wob, px = t.x + Math.cos( a ) * rr, pz = t.z + Math.sin( a ) * rr;
        pos.push( px, hf( px, pz ) + 0.05 + dy, pz ); nor.push( 0, 1, 0 );
        const f = ring / RS;
        if ( f < 0.55 ) tmp.copy( soilD ).lerp( soilM, f / 0.55 ); else tmp.copy( soilM ).lerp( grass, smoothstep( 0.55, 1.0, f ) );
        const v = 0.9 + 0.2 * hash2( px * 9, pz * 9 );
        col.push( tmp.r * v, tmp.g * v, tmp.b * v );
      }
      for ( let s = 0; s < SEG; s++ ) idx.push( vi( 0, 0 ), vi( 1, s + 1 ), vi( 1, s ) );
      for ( let ring = 1; ring < RS; ring++ ) for ( let s = 0; s < SEG; s++ )
      {
        const I0 = vi( ring, s ), I1 = vi( ring, s + 1 ), O0 = vi( ring + 1, s ), O1 = vi( ring + 1, s + 1 );
        idx.push( I0, I1, O0, I1, O1, O0 );
      }
    } );
    const g = new T.BufferGeometry();
    g.setIndex( idx );
    g.setAttribute( 'position', new T.Float32BufferAttribute( pos, 3 ) );
    g.setAttribute( 'normal', new T.Float32BufferAttribute( nor, 3 ) );
    g.setAttribute( 'color', new T.Float32BufferAttribute( col, 3 ) );
    return g;
  }
  function getSoilMat () { return getSoilMat.m || ( getSoilMat.m = new T.MeshStandardMaterial( { vertexColors: true, roughness: 1, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 } ) ); }
  ( function soil ()      // static patches for the generated hero trees; editor-placed trees carry their own soil inside their assembly
  {
    const m = new T.Mesh( makeSoilGeo( placed.filter( t => !t.world ), 0 ), getSoilMat() );
    m.receiveShadow = true; scene.add( m );
  } )();

  /* ---- Stones: clustered at tree bases + scattered on the meadow ---------- */
  ( function stones ()
  {
    const rnd = mulberry32( 777 );
    const mats = [];
    const add = ( x, z, s ) =>
    {
      const y = terrainHeight( x, z ) - s * 0.12;
      mats.push( { m: M( x, y, z, s, s * ( 0.5 + rnd() * 0.3 ), s * ( 0.8 + rnd() * 0.4 ), ( rnd() - 0.5 ) * 0.4, rnd() * 6.28, ( rnd() - 0.5 ) * 0.4 ), s } );
    };
    placed.filter( t => !t.world ).forEach( t => { const n = 6 + Math.floor( rnd() * 5 ); for ( let i = 0; i < n; i++ ) { const a = rnd() * 6.28, d = t.r * ( 0.55 + rnd() * 0.9 ); add( t.x + Math.cos( a ) * d, t.z + Math.sin( a ) * d, 0.14 + Math.pow( rnd(), 2.2 ) * 0.5 ); } } );
    for ( let i = 0; i < 420; i++ )
    {                          // river-bank stones
      const z = ( rnd() - 0.5 ) * MAP * 0.98, x = riverX( z ) + ( rnd() < 0.5 ? -1 : 1 ) * ( 6.4 + rnd() * 3.2 );
      add( x, z, 0.15 + Math.pow( rnd(), 2 ) * 0.55 );
    }
    for ( let i = 0; i < 1100; i++ ) { const x = ( rnd() - 0.5 ) * MAP * 0.98, z = ( rnd() - 0.5 ) * MAP * 0.98; if ( riverDist( x, z ) < 9 ) continue; add( x, z, 0.1 + Math.pow( rnd(), 3 ) * 0.9 ); }
    const im = new T.InstancedMesh( new T.DodecahedronGeometry( 1, 0 ), new T.MeshStandardMaterial( { roughness: 0.92, flatShading: true } ), mats.length );
    const c = new T.Color();
    mats.forEach( ( o, i ) =>
    {
      im.setMatrixAt( i, o.m );
      c.copy( C( '#8b8880' ) ).multiplyScalar( 0.65 + rnd() * 0.55 );
      if ( rnd() < 0.3 ) c.lerp( C( '#5d7a43' ), 0.35 );          // mossy
      im.setColorAt( i, c );
    } );
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
    im.castShadow = true; im.receiveShadow = true; scene.add( im );
  } )();


  /* ---- Fallen petals: carpet around the great sakura and a trail toward the river ---- */
  ( function groundPetals ()
  {
    return; const rnd = mulberry32( 909 ), n = 280, sh = heroes.find( h => h.type === 'sakura' );
    const im = new T.InstancedMesh( new T.PlaneGeometry( 0.26, 0.17 ), new T.MeshStandardMaterial( { roughness: 0.8, side: T.DoubleSide } ), n );
    const c = new T.Color(), pinks = [ '#ffb3cb', '#ffc6d8', '#f79cb9', '#ffe0ea' ];
    let i = 0, guard = 0;
    while ( i < n && guard++ < 4000 )
    {
      let x, z;
      if ( rnd() < 0.5 ) { const t = rnd(); x = lerp( -14, -2, t ) + ( rnd() - 0.5 ) * ( 2.5 + t * 3.5 ); z = lerp( 16, 29, t ) + ( rnd() - 0.5 ) * ( 2.5 + t * 3.5 ); }
      else { const a = rnd() * 6.28, d = 3 + Math.sqrt( rnd() ) * 16; x = sh.x + Math.cos( a ) * d; z = sh.z + Math.sin( a ) * d; }
      if ( riverMask( x, z ) > 0.2 && riverDist( x, z ) < 7.5 ) continue;
      im.setMatrixAt( i, M( x, terrainHeight( x, z ) + 0.09, z, 0.8 + rnd() * 0.8, 0.8 + rnd() * 0.8, 1, -Math.PI / 2, 0, rnd() * 6.28 ) );
      im.setColorAt( i, c.set( pinks[ Math.floor( rnd() * pinks.length ) ] ).convertSRGBToLinear() ); i++;
    }
    im.count = i; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.receiveShadow = true;
    scene.add( im );
  } )();

  /* ---- Farms: crop rows, wooden fences, scarecrows & decor (all InstancedMesh) ---- */
  const cyl4 = new T.CylinderGeometry( 1, 1, 1, 4, 1 ), cyl8 = new T.CylinderGeometry( 1, 1, 1, 8, 1 ), cone4 = new T.ConeGeometry( 1, 1, 4, 1 ), cone8 = new T.ConeGeometry( 1, 1, 8, 1 ), cup6 = new T.CylinderGeometry( 1, 0.45, 1, 6, 1 ), ico0 = new T.IcosahedronGeometry( 1, 0 ), box1 = new T.BoxGeometry( 1, 1, 1 );
  const mkGeo = ( parts, H ) => { const m = new Mesher( H || 1.2 ); parts.forEach( p => m.add( p[ 0 ], M( ...p[ 1 ] ), { color: C( p[ 2 ] ), sway: 0, grad: 0.2, phase: 0 } ) ); return m.build(); };
  /* ---- Farms: every farm is ONE assembly generated from ONE record (x, z, yaw, scale, dy, crop) ----
   *  Group = [ ground (draped on the terrain) + props (fence, gate, scarecrow, decor / cattle merged into one mesh) + crops (instanced) ].
   *  Ground, fence, crops and props all sample the same height function (terrain + dy), so they cannot drift apart, and the
   *  whole assembly is rebuilt / removed as one unit on every add, move, rotate, resize or delete. */
  const farmZones = [], farmAsm = [];
  let _fk = null, _fm = null;
  const FARM_ROW = { wheat: [ 0.55, 1.15 ], carrot: [ 0.5, 1.15 ], leafy: [ 0.75, 1.5 ], pumpkin: [ 1.7, 1.9 ], berry: [ 1.5, 2.3 ] };       // plant spacing (u, v) in farm units
  const FARM_GROUND = { wheat: 'gold', carrot: 'soil', leafy: 'grass', pumpkin: 'soil', berry: 'grass', livestock: 'pen' };
  function farmKit ()       // shared geometry + materials, built once
  {
    if ( _fk ) return _fk;
    const ico1 = new T.IcosahedronGeometry( 1, 1 );
    const farmMat = new T.MeshStandardMaterial( { vertexColors: true, roughness: 0.9 } ); addWind( farmMat, 'tree' );      // one material for fence + props + crops (crops sway through their baked aWind)
    const sw = ( g, k ) => { g.computeBoundingBox(); const hh = g.boundingBox.max.y || 1, P = g.attributes.position, Wd = g.attributes.aWind; for ( let i = 0; i < P.count; i++ ) Wd.setX( i, k * Math.pow( clamp( P.getY( i ) / hh, 0, 1 ), 1.7 ) ); return g; };
    const wheat = mkGeo( [ 0, 1, 2 ].flatMap( i => { const a = i * 2.1, ox = Math.cos( a ) * 0.09, oz = Math.sin( a ) * 0.09; return [ [ cyl4, [ ox, 0.42, oz, 0.016, 0.84, 0.016 ], '#b9a23c' ], [ cyl4, [ ox, 0.98, oz, 0.045, 0.3, 0.045 ], '#e2bd52' ] ]; } ) );
    const carrot = mkGeo( [ [ cone4, [ 0.04, 0.2, 0, 0.07, 0.4, 0.07, 0, 0, -0.35 ], '#4f9a35' ], [ cone4, [ -0.04, 0.2, 0.03, 0.07, 0.4, 0.07, 0, 0, 0.35 ], '#5aa83c' ], [ cone4, [ 0, 0.22, -0.04, 0.07, 0.44, 0.07, -0.3, 0, 0 ], '#468c30' ], [ cyl8, [ 0, 0.02, 0, 0.07, 0.07, 0.07 ], '#e8802a' ] ] );
    const leafy = mkGeo( [ [ ico0, [ 0, 0.2, 0, 0.3, 0.2, 0.3 ], '#6cb04a' ], [ ico0, [ 0, 0.32, 0, 0.2, 0.15, 0.2 ], '#8ed05e' ], [ ico0, [ 0.2, 0.14, 0, 0.18, 0.1, 0.24, 0, 0, 0.5 ], '#4f9a3c' ], [ ico0, [ -0.18, 0.14, 0.05, 0.18, 0.1, 0.22, 0, 0, -0.5 ], '#5aa640' ] ] );
    const scGeo = mkGeo( [ [ cyl8, [ 0, 1, 0, 0.05, 2, 0.05 ], '#6a4a2c' ], [ box1, [ 0, 1.45, 0, 1.6, 0.07, 0.07 ], '#6a4a2c' ], [ box1, [ 0, 1.3, 0, 0.5, 0.65, 0.28 ], '#3f6aa8' ], [ box1, [ 0.85, 1.38, 0, 0.35, 0.07, 0.07 ], '#d9b44a' ], [ box1, [ -0.85, 1.38, 0, 0.35, 0.07, 0.07 ], '#d9b44a' ], [ ico0, [ 0, 1.86, 0, 0.24, 0.26, 0.24 ], '#d9c38a' ], [ cyl8, [ 0, 2.05, 0, 0.44, 0.04, 0.44 ], '#5a3f28' ], [ cone8, [ 0, 2.28, 0, 0.26, 0.4, 0.26 ], '#5a3f28' ] ], 2.6 );
    const pumpkin = mkGeo( [ [ ico1, [ 0, 0.2, 0, 0.3, 0.22, 0.3 ], '#e8791c' ], [ ico1, [ 0, 0.2, 0, 0.22, 0.23, 0.31, 0, 0.8, 0 ], '#d9680f' ], [ cyl4, [ 0, 0.45, 0, 0.04, 0.12, 0.04 ], '#55702e' ], [ ico0, [ 0.42, 0.03, 0.1, 0.26, 0.03, 0.18, 0, 0.5, 0 ], '#4f9a3c' ], [ ico0, [ -0.36, 0.03, -0.14, 0.22, 0.03, 0.16, 0, -0.4, 0 ], '#468c30' ] ] );
    const squash = mkGeo( [ [ ico1, [ 0, 0.15, 0.26, 0.14, 0.14, 0.22 ], '#d9b25a' ], [ ico1, [ 0, 0.17, -0.1, 0.21, 0.17, 0.22 ], '#e0bb64' ], [ cyl4, [ 0, 0.32, -0.1, 0.035, 0.09, 0.035 ], '#55702e' ], [ ico0, [ 0.4, 0.03, 0, 0.24, 0.03, 0.17, 0, 0.3, 0 ], '#4f9a3c' ] ] );
    const bush = hexB => mkGeo( [ [ ico1, [ 0, 0.36, 0, 0.46, 0.36, 0.46 ], '#3b7a32' ], [ ico1, [ 0.24, 0.3, 0.12, 0.3, 0.26, 0.3 ], '#47893a' ], [ ico1, [ -0.22, 0.32, -0.1, 0.32, 0.28, 0.32 ], '#33702c' ],
    ...[ [ 0.34, 0.62, 0.1 ], [ -0.1, 0.7, 0.2 ], [ -0.3, 0.56, -0.14 ], [ 0.12, 0.66, -0.26 ], [ 0, 0.78, 0 ], [ 0.4, 0.44, -0.2 ], [ -0.4, 0.46, 0.2 ] ].map( q => [ ico0, [ q[ 0 ], q[ 1 ], q[ 2 ], 0.07, 0.07, 0.07 ], hexB ] ) ] );
    const cow = mkGeo( [      // faces +X, feet at y = 0
      [ box1, [ 0, 0.95, 0, 1.7, 0.8, 0.85 ], '#f1ede4' ], [ box1, [ -0.35, 1, 0, 0.6, 0.82, 0.87 ], '#2b2724' ], [ box1, [ 0.5, 1.05, 0, 0.34, 0.62, 0.88 ], '#2b2724' ],
      [ box1, [ 1.05, 1.22, 0, 0.55, 0.46, 0.44 ], '#f1ede4' ], [ box1, [ 1.34, 1.12, 0, 0.26, 0.3, 0.36 ], '#e7b3a6' ], [ box1, [ 1.12, 1.35, 0, 0.2, 0.12, 0.46 ], '#2b2724' ],
      [ box1, [ 1, 1.48, 0.27, 0.1, 0.08, 0.2 ], '#2b2724' ], [ box1, [ 1, 1.48, -0.27, 0.1, 0.08, 0.2 ], '#2b2724' ],
      [ cone4, [ 1, 1.58, 0.16, 0.05, 0.2, 0.05 ], '#e9e1c8' ], [ cone4, [ 1, 1.58, -0.16, 0.05, 0.2, 0.05 ], '#e9e1c8' ],
      [ box1, [ 0.62, 0.35, 0.3, 0.18, 0.72, 0.18 ], '#e6e1d6' ], [ box1, [ 0.62, 0.35, -0.3, 0.18, 0.72, 0.18 ], '#e6e1d6' ],
      [ box1, [ -0.62, 0.35, 0.3, 0.18, 0.72, 0.18 ], '#e6e1d6' ], [ box1, [ -0.62, 0.35, -0.3, 0.18, 0.72, 0.18 ], '#e6e1d6' ],
      [ box1, [ -0.92, 0.95, 0, 0.1, 0.62, 0.1, 0, 0, 0.25 ], '#2b2724' ] ], 1.6 );
    _fk = { farmMat, geos: { wheat: sw( wheat, 0.9 ), carrot: sw( carrot, 0.35 ), leafy: sw( leafy, 0.25 ), pumpkin: sw( pumpkin, 0.08 ), squash: sw( squash, 0.08 ), berryR: sw( bush( '#c91f2e' ), 0.3 ), berryB: sw( bush( '#3c4fbe' ), 0.3 ) }, scGeo, cow };
    return _fk;
  }
  function farmMats ()
  {
    if ( _fm ) return _fm;
    const mk = ( c0, c1, rows, seed ) => canvasTex( 128, ( g, S ) =>
    {
      g.fillStyle = c0; g.fillRect( 0, 0, S, S ); const r = mulberry32( seed );
      if ( rows ) for ( let i = 0; i < 16; i++ ) { g.fillStyle = c1; g.fillRect( 0, i * 8, S, 3 ); }
      for ( let i = 0; i < 700; i++ ) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.12)'; g.fillRect( r() * S, r() * S, 1, rows ? 4 : 2 ); }
    } );
    const tx = { soil: mk( '#5a3f28', '#3d2a1a', true, 11 ), grass: mk( '#5e8a36', '#3f6a24', true, 12 ), gold: mk( '#c9a548', '#a08030', true, 13 ), pen: mk( '#6b5a3a', '#4a3d27', false, 14 ) };
    _fm = {}; Object.keys( tx ).forEach( k => { _fm[ k ] = new T.MeshStandardMaterial( { map: tx[ k ], roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 } ); } );
    return _fm;
  }
  function addBuilt ( mesher, geo, matrix, kb )       // append an already-built Mesher geometry (scarecrow, cow, crop) into another Mesher
  {
    const k = kb === undefined ? 1 : kb;
    const P = geo.attributes.position, N = geo.attributes.normal, Cc = geo.attributes.color, U = geo.attributes.uv, Wd = geo.attributes.aWind;
    const nm = new T.Matrix3().getNormalMatrix( matrix ), v = new T.Vector3(), n = new T.Vector3();
    for ( let i = 0; i < P.count; i++ )
    {
      v.fromBufferAttribute( P, i ).applyMatrix4( matrix ); mesher.p.push( v.x, v.y, v.z );
      n.fromBufferAttribute( N, i ).applyMatrix3( nm ).normalize(); mesher.n.push( n.x, n.y, n.z );
      mesher.c.push( Cc.getX( i ) * k, Cc.getY( i ) * k, Cc.getZ( i ) * k ); mesher.u.push( U.getX( i ), U.getY( i ) ); mesher.w.push( Wd.getX( i ), Wd.getY( i ), Wd.getZ( i ) );
    }
  }
  function buildFarm ( p )
  {
    const K = farmKit(), FM = farmMats(), S = p.s, c = Math.cos( p.yaw ), sn = Math.sin( p.yaw ), pen = p.crop === 'livestock', XA = new T.Vector3( 1, 0, 0 );
    const rnd = mulberry32( ( ( Math.abs( p.x ) * 131 + Math.abs( p.z ) * 71 ) | 0 ) + 606 );
    const W = ( u, v ) => [ p.x + ( u * c + v * sn ) * S, p.z + ( -u * sn + v * c ) * S ];     // farm-local (u, v) -> world x, z
    const H = ( X, Z ) => ( p.flat ? 0 : terrainHeight( X, Z ) ) + p.dy;                                        // the ONE height function every part samples

    // 1. ground: a fine grid draped vertex-by-vertex over the terrain
    const gw = p.wd * S, gd = p.dp * S;
    const gg = new T.PlaneGeometry( gw, gd, Math.max( 4, Math.ceil( gw / 1.6 ) ), Math.max( 4, Math.ceil( gd / 1.6 ) ) ); gg.rotateX( -Math.PI / 2 ); gg.rotateY( p.yaw );
    { const pp = gg.attributes.position, uv = gg.attributes.uv; for ( let i = 0; i < pp.count; i++ ) { const X = pp.getX( i ) + p.x, Z = pp.getZ( i ) + p.z; pp.setXYZ( i, X, H( X, Z ) + 0.12, Z ); uv.setXY( i, uv.getX( i ) * gw / 5, uv.getY( i ) * gd / 5 ); } }
    gg.computeVertexNormals();

    // 2. props: fence (rails follow the slope), gate, scarecrow, decor, cattle - all merged into ONE mesh
    const pm = new Mesher( 1.2 ), WOOD = '#8a6a48';
    const put = ( geo, x, y, z, sx, sy, sz, rx, ry, rz, hex ) => pm.add( geo, M( x, y, z, sx, sy, sz, rx, ry, rz ), { color: C( hex ), sway: 0, grad: 0.2, phase: 0 } );
    const a = p.wd / 2 + 0.7, b = p.dp / 2 + 0.7;
    const rail = ( X0, Z0, X1, Z1, h ) =>
    {
      const y0 = H( X0, Z0 ) + h * S, y1 = H( X1, Z1 ) + h * S, dx = X1 - X0, dy = y1 - y0, dz = Z1 - Z0, L = Math.hypot( dx, dy, dz );
      const q = new T.Quaternion().setFromUnitVectors( XA, new T.Vector3( dx / L, dy / L, dz / L ) );
      pm.add( box1, MQ( new T.Vector3( ( X0 + X1 ) / 2, ( y0 + y1 ) / 2, ( Z0 + Z1 ) / 2 ), q, new T.Vector3( L, 0.08 * S, 0.07 * S ) ), { color: C( WOOD ), sway: 0, grad: 0.2, phase: 0 } );
    };
    const side = ( u0, v0, u1, v1, gate ) =>
    {
      const n = Math.max( 1, Math.round( Math.hypot( u1 - u0, v1 - v0 ) / 1.8 ) );
      for ( let i = 0; i <= n; i++ )
      {
        const u = lerp( u0, u1, i / n ), v = lerp( v0, v1, i / n );
        if ( !( gate && Math.abs( u ) < 1.8 ) ) { const [ X, Z ] = W( u, v ); put( box1, X, H( X, Z ) + 0.5 * S, Z, 0.16 * S, 1.1 * S, 0.16 * S, 0, p.yaw, 0, WOOD ); }
        if ( i < n )
        {
          const um = lerp( u0, u1, ( i + 0.5 ) / n ); if ( gate && Math.abs( um ) < 1.8 ) continue;          // gate opening
          const [ X0, Z0 ] = W( u, v ), [ X1, Z1 ] = W( lerp( u0, u1, ( i + 1 ) / n ), lerp( v0, v1, ( i + 1 ) / n ) );
          [ 0.4, 0.82 ].forEach( h => rail( X0, Z0, X1, Z1, h ) );
        }
      }
    };
    side( -a, -b, a, -b, false ); side( -a, b, a, b, true ); side( -a, -b, -a, b, false ); side( a, -b, a, b, false );
    [ -1.8, 1.8 ].forEach( u => { const [ X, Z ] = W( u, b ); put( box1, X, H( X, Z ) + 0.65 * S, Z, 0.2 * S, 1.4 * S, 0.2 * S, 0, p.yaw, 0, '#6a4a2c' ); } );

    // 3. crops (instanced), scarecrow + decor, or cattle
    const lists = {}, addCrop = ( key, X, Z, sx, sy ) => ( lists[ key ] || ( lists[ key ] = [] ) ).push( M( X, H( X, Z ) + 0.1, Z, sx * S, sy * S, sx * S, 0, rnd() * 6.28, 0 ) );
    if ( !pen )
    {
      const [ dx, dz ] = FARM_ROW[ p.crop ];
      let iz = 0;
      for ( let v = -p.dp / 2 + 1.5; v <= p.dp / 2 - 1.3; v += dz, iz++ ) for ( let u = -p.wd / 2 + 1.4; u <= p.wd / 2 - 1.4; u += dx )
      {
        if ( Math.abs( u ) < 1.4 && Math.abs( v ) < 1.4 ) continue;                            // clear spot for the scarecrow
        const [ X, Z ] = W( u + ( rnd() - 0.5 ) * 0.1, v + ( rnd() - 0.5 ) * 0.1 ), j = 0.85 + rnd() * 0.3, jy = 0.8 + rnd() * 0.45;
        if ( p.crop === 'pumpkin' ) addCrop( rnd() < 0.65 ? 'pumpkin' : 'squash', X, Z, 1.15 + rnd() * 0.45, 1.15 + rnd() * 0.4 );
        else if ( p.crop === 'berry' ) addCrop( ( Math.round( ( u + p.wd / 2 ) / dx ) + iz ) & 1 ? 'berryR' : 'berryB', X, Z, 1 + rnd() * 0.3, 0.95 + rnd() * 0.3 );
        else addCrop( p.crop, X, Z, j, jy );
      }
      addBuilt( pm, K.scGeo, M( p.x, H( p.x, p.z ), p.z, S, S, S, 0, p.yaw + ( rnd() - 0.5 ), 0 ) );
      [ [ a + 1.6, -b + 0.8, 0.5 ], [ a + 1.6, -b + 2.1, 0.5 ], [ a + 1.7, -b + 1.45, 1.4 ] ].forEach( q => { const [ X, Z ] = W( q[ 0 ], q[ 1 ] ); put( cyl8, X, H( X, Z ) + q[ 2 ] * S, Z, 0.55 * S, 0.9 * S, 0.55 * S, 0, p.yaw, Math.PI / 2, '#d6b85a' ); } );
      [ [ -a - 1.4, b - 0.6 ], [ -a - 2.5, b - 1.3 ] ].forEach( q => { const [ X, Z ] = W( q[ 0 ], q[ 1 ] ); put( cyl8, X, H( X, Z ) + 0.42 * S, Z, 0.42 * S, 0.95 * S, 0.42 * S, 0, rnd() * 6, 0, '#7a5230' ); } );
      { const [ X, Z ] = W( -a - 1.6, -b + 1.5 ); put( box1, X, H( X, Z ) + 0.22 * S, Z, 2.2 * S, 0.5 * S, 0.7 * S, 0, p.yaw, 0, WOOD ); }
    }
    else
    {
      { const [ X, Z ] = W( -p.wd / 2 + 3, -p.dp / 2 + 1.6 ); put( box1, X, H( X, Z ) + 0.3 * S, Z, 2.6 * S, 0.5 * S, 0.8 * S, 0, p.yaw, 0, WOOD ); put( box1, X, H( X, Z ) + 0.52 * S, Z, 2.3 * S, 0.06 * S, 0.5 * S, 0, p.yaw, 0, '#4a86a8' ); }
      [ [ p.wd / 2 - 2, p.dp / 2 - 2, 0.5 ], [ p.wd / 2 - 2, p.dp / 2 - 3.3, 0.5 ], [ p.wd / 2 - 2.1, p.dp / 2 - 2.65, 1.4 ] ].forEach( q => { const [ X, Z ] = W( q[ 0 ], q[ 1 ] ); put( cyl8, X, H( X, Z ) + q[ 2 ] * S, Z, 0.55 * S, 0.9 * S, 0.55 * S, 0, p.yaw, Math.PI / 2, '#d6b85a' ); } );
      const spots = [];
      for ( let tries = 0; tries < 80 && spots.length < 4; tries++ )
      {
        const u = ( rnd() - 0.5 ) * ( p.wd - 7 ), v = ( rnd() - 0.5 ) * ( p.dp - 6 ); if ( spots.some( s => Math.hypot( s[ 0 ] - u, s[ 1 ] - v ) < 3.4 ) ) continue; spots.push( [ u, v ] );
        const [ X, Z ] = W( u, v ); addBuilt( pm, K.cow, M( X, H( X, Z ) + 0.1, Z, S, S, S, 0, rnd() * 6.28, 0 ) );
      }
    }
    // 4. fuse everything into ONE mesh: ground patch + fence + gate + scarecrow / cattle + every crop plant (2 draw groups: ground texture, vertex-coloured props)
    Object.keys( lists ).forEach( key => lists[ key ].forEach( m4 => addBuilt( pm, K.geos[ key ], m4, 0.8 + rnd() * 0.35 ) ) );
    const farm = new T.Mesh( mergeParts( [ gg.toNonIndexed(), pm.build() ] ), [ FM[ FARM_GROUND[ p.crop ] ], K.farmMat ] );
    farm.geometry.applyMatrix4( itemTransform( p, p.flat ) );
    farm.castShadow = true; farm.receiveShadow = true; farm.userData.ownGeo = true;
    return farm;
  }
  function mountFarms ()
  {
    farmZones.length = 0;
    wg.plots.forEach( p => { farmZones.push( { x: p.x, z: p.z, r: Math.hypot( p.wd, p.dp ) * p.s / 2 + 3 } ); const g = buildFarm( p ); g.traverse( n => { n.userData.itemId = p.id; } ); scene.add( g ); farmAsm.push( g ); } );
  }
  function unmountFarms () { farmAsm.forEach( g => { scene.remove( g ); g.traverse( n => { if ( n.userData.ownGeo ) n.geometry.dispose(); if ( n.isInstancedMesh && n.dispose ) n.dispose(); } ); } ); farmAsm.length = 0; }
  mountFarms();

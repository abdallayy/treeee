
  /* ---- Realistic medieval world: castle, timber-frame village, oak treehouses, bridge ----
   *  buildWorld( { only: item, flat } ) builds ONE isolated item through exactly the same builders as the map
   *  (used for catalog thumbnails and the placement ghost); flat = true drapes it on a level plane at y = 0. */
  function buildWorld ( opts )
  {
    const only = opts && opts.only, flatMode = !!( opts && opts.flat );
    const terrainHeight = flatMode ? ( () => 0 ) : TERRAIN_H;
    R = mulberry32( 7001 );      // stable per-part colour jitter: rebuilding the map never re-rolls it
    const m = new Mesher( 30 ), w = new Mesher( 30 ), rnd = mulberry32( 2026 );
    const dead = new Set( MAPD.removed ), catalog = [], treeMeshes = [], treeAsm = []; let curAdded = null;
    const reg = ( type, x, z, r, meta ) => { const id = curAdded ? curAdded.id : type + '@' + x.toFixed( 2 ) + ',' + z.toFixed( 2 ); catalog.push( { id, type, x, z, r: r * ( curAdded ? Math.max( curAdded.sx || 1, curAdded.sz || 1 ) : 1 ), added: !!curAdded, meta } ); if ( !only ) curTag = id; return !curAdded && !DEV && dead.has( id ); };
    const bx = new T.BoxGeometry( 1, 1, 1 ), cyl = new T.CylinderGeometry( 1, 1, 1, 24, 1 ), cone = new T.ConeGeometry( 1, 1, 24, 1 );
    const ban = new T.PlaneGeometry( 1, 1, 1, 8 ), gable = new T.BufferGeometry();
    {
      const A = [ -.5, 0, -.5 ], B = [ .5, 0, -.5 ], Q = [ .5, 0, .5 ], D = [ -.5, 0, .5 ], E = [ -.5, 1, 0 ], F = [ .5, 1, 0 ];
      gable.setAttribute( 'position', new T.Float32BufferAttribute( [ D, Q, F, D, F, E, B, A, E, B, E, F, Q, B, F, A, D, E ].flat(), 3 ) ); gable.computeVertexNormals();
    }
    // material ids drive the procedural shader: 1 stone blocks, 2 timber, 3 roof tiles, 4 cloth, 0 plaster/plain
    const K = ( h, id ) => { const c = C( h ); c.mid = id; return c; };
    const o = c => ( { color: c, sway: 0, grad: 0.3, flutter: c.mid || 0 } ), wo = { color: C( '#ffcf7a' ), sway: 0, grad: 0 };
    const P = ( b, x, y, z, sx, sy, sz, rx, ry, rz ) => b.clone().multiply( M( x, y, z, sx, sy, sz, rx, ry, rz ) );
    const pal = ( a, id ) => K( a[ Math.floor( rnd() * a.length ) ], id );
    const put = ( b, g, x, y, z, sx, sy, sz, c, ry ) => m.add( g, P( b, x, y, z, sx, sy, sz, 0, ry || 0, 0 ), o( c ) );
    const tilt = ( b, g, x, y, z, sx, sy, sz, rz, c ) => m.add( g, P( b, x, y, z, sx, sy, sz, 0, 0, rz ), o( c ) );
    const glow = ( b, g, x, y, z, sx, sy, sz ) => w.add( g, P( b, x, y, z, sx, sy, sz ), wo );
    const baseAt = ( x, z, yaw, dy ) => { const b = M( x, terrainHeight( x, z ) + ( dy || 0 ) + ( curAdded && curAdded.dy || 0 ), z, 1, 1, 1, 0, yaw, 0 ); if ( curAdded && curAdded.scale ) b.multiply( new T.Matrix4().makeScale( curAdded.scale, curAdded.scale, curAdded.scale ) ); return b; };
    const stone = h => K( h, 1 ), wood = h => K( h, 2 ), tile = h => K( h, 3 ), cloth = h => K( h, 4 ), iron = K( '#2b2b2e', 0 );
    const banner = ( b, x, y, z, wd, ht, ry, c ) => { put( b, ban, x, y, z, wd, ht, 1, c, ry ); put( b, ban, x, y, z + ( ry ? 0 : .03 ), wd * .18, ht * .96, 1, cloth( '#d9b24a' ), ry ); };

    /* ---------- Castle ---------- */
    function castleFn ( cx, cz, cyaw )
    {
      const b = baseAt( cx, cz, cyaw ), st = stone( '#b3aea3' ), st2 = stone( '#968f84' ), slate = tile( '#3f5670' ), slate2 = tile( '#6a3a34' ), red = cloth( '#9c2a26' ), blue = cloth( '#27467f' );
      // battered plinth + curtain walls
      [ [ 0, -12, 27.4, 3 ], [ 0, 12, 27.4, 3 ] ].forEach( p => put( b, bx, p[ 0 ], -3, p[ 1 ], p[ 2 ], 4, p[ 3 ], st2 ) );
      [ -12, 12 ].forEach( x => put( b, bx, x, -3, 0, 3, 4, 27.4, st2 ) );
      put( b, bx, 0, 1, -11.5, 26, 12, 1.8, st ); put( b, bx, 0, 1, 11.5, 26, 12, 1.8, st );
      put( b, bx, -11.5, 1, 0, 1.8, 12, 26, st ); put( b, bx, 11.5, 1, 0, 1.8, 12, 26, st );
      [ [ 0, -12.5, 26, .8 ], [ 0, 12.5, 26, .8 ] ].forEach( p => put( b, bx, p[ 0 ], 6.4, p[ 1 ], p[ 2 ], .7, p[ 3 ], st2 ) );
      [ -12.5, 12.5 ].forEach( x => put( b, bx, x, 6.4, 0, .8, .7, 26, st2 ) );
      for ( let i = -5; i <= 5; i++ ) [ [ i * 2.3, -11.5 ], [ i * 2.3, 11.5 ], [ -11.5, i * 2.3 ], [ 11.5, i * 2.3 ] ].forEach( p => put( b, bx, p[ 0 ], 7.7, p[ 1 ], 1.3, 1.4, 1.3, st ) );
      for ( let i = -4; i <= 4; i++ ) { [ -1, 1 ].forEach( s => { put( b, bx, i * 2.7, 3.2, s * 12.45, .28, 1.5, .2, iron ); put( b, bx, s * 12.45, 3.2, i * 2.7, .2, 1.5, .28, iron ); } ); }
      banner( b, -8.5, 3.6, 12.55, 2.4, 6, 0, red ); banner( b, 8.5, 3.6, 12.55, 2.4, 6, 0, blue );
      [ [ -1, -1 ], [ 1, -1 ], [ -1, 1 ], [ 1, 1 ] ].forEach( ( s, i ) =>
      {
        const x = s[ 0 ] * 11.5, z = s[ 1 ] * 11.5;
        put( b, cyl, x, -3, z, 3.4, 4, 3.4, st2 ); put( b, cyl, x, 4.5, z, 2.7, 19, 2.7, st ); put( b, cyl, x, 13.6, z, 3.2, 1.2, 3.2, st2 );
        for ( let k = 0; k < 12; k++ ) { const a = k / 12 * 6.283; put( b, bx, x + Math.cos( a ) * 3, 14.9, z + Math.sin( a ) * 3, 1, 1.2, 1, st, -a ); }
        put( b, cone, x, 19.6, z, 3.5, 11, 3.5, i % 2 ? slate2 : slate ); put( b, bx, x, 26.5, z, .12, 4.2, .12, iron );
        glow( b, bx, x, 9, z + s[ 1 ] * 2.65, .35, 1.7, .25 ); glow( b, bx, x + s[ 0 ] * 2.65, 9, z, .25, 1.7, .35 );
      } );
      // gatehouse
      put( b, bx, 0, 1.5, 13.3, 7.4, 13, 5.2, st ); put( b, bx, 0, 2.4, 16, 3, 4.8, .6, iron ); put( b, bx, 0, 5, 16.1, 3.8, .8, .6, st2 );
      for ( let i = -3; i <= 3; i++ ) put( b, bx, i * .38, 2.4, 16.35, .07, 4.8, .07, K( '#111114', 0 ) );
      [ -3.6, 3.6 ].forEach( x => { put( b, cyl, x, 2.5, 13.3, 1.9, 15, 1.9, st2 ); put( b, cone, x, 13.5, 13.3, 2.4, 6.5, 2.4, slate2 ); } );
      put( b, bx, 0, 8.9, 13.3, 7.8, 1, 5.8, st2 ); for ( let i = -3; i <= 3; i++ ) put( b, bx, i * 1.2, 9.9, 15.9, .9, 1, .9, st );
      banner( b, 0, 6.9, 16.3, 1.6, 2.4, 0, red );
      // keep
      put( b, bx, 0, 8, -1, 11, 26, 11, st ); put( b, bx, 0, 21.5, -1, 12.6, 1.4, 12.6, st2 );
      for ( let i = -2; i <= 2; i++ ) [ [ i * 2.6, -7.2 ], [ i * 2.6, 5.2 ], [ -6.2, i * 2.6 - 1 ], [ 6.2, i * 2.6 - 1 ] ].forEach( p => put( b, bx, p[ 0 ], 22.9, p[ 1 ], 1.2, 1.4, 1.2, st ) );
      [ [ -5.3, -6.3 ], [ 5.3, -6.3 ], [ -5.3, 4.3 ], [ 5.3, 4.3 ] ].forEach( ( p, i ) =>
      { put( b, cyl, p[ 0 ], 24, p[ 1 ], 1.6, 10, 1.6, st ); put( b, cone, p[ 0 ], 33, p[ 1 ], 2.1, 9, 2.1, i % 2 ? slate : slate2 ); } );
      put( b, cyl, 0, 27, -1, 3.4, 10, 3.4, st2 ); put( b, cone, 0, 42, -1, 4.4, 20, 4.4, slate ); put( b, bx, 0, 54, -1, .15, 4, .15, iron );
      banner( b, -3.6, 15, 4.6, 2.2, 9, 0, red ); banner( b, 3.6, 15, 4.6, 2.2, 9, 0, blue ); banner( b, 5.6, 15, 0, 2.2, 9, Math.PI / 2, red ); banner( b, -5.6, 15, 0, 2.2, 9, -Math.PI / 2, blue );
      for ( const y of [ 9, 14, 19 ] ) for ( const x of [ -3.6, 0, 3.6 ] ) { if ( y === 14 && x !== 0 ) continue; glow( b, bx, x, y, 4.55, .9, 2.3, .3 ); put( b, bx, x, y + 1.4, 4.55, 1.2, .35, .34, st2 ); }
      for ( const y of [ 9, 15 ] ) for ( const z of [ -3, 1.5 ] ) { glow( b, bx, 5.55, y, z, .3, 2.3, .9 ); glow( b, bx, -5.55, y, z, .3, 2.3, .9 ); }
      put( b, cyl, -6, 12, -8.5, 2.6, 34, 2.6, st ); put( b, cyl, -6, 29.5, -8.5, 3.2, 1.6, 3.2, st2 ); put( b, cone, -6, 37.5, -8.5, 3.6, 15, 3.6, slate2 );
      for ( const y of [ 14, 22 ] ) glow( b, bx, -6, y, -6, .7, 2.2, .3 );
      // courtyard halls
      [ [ -6.5, 6.5, 0 ], [ 6.5, 6.5, 0 ] ].forEach( ( p, i ) =>
      { put( b, bx, p[ 0 ], 2.5, p[ 1 ], 6.5, 5, 4.6, i ? stone( '#c2b79f' ) : stone( '#b0a58c' ) ); m.add( gable, P( b, p[ 0 ], 5, p[ 1 ], 7.6, 3.4, 5.6 ), o( i ? slate2 : tile( '#7a4b32' ) ) ); glow( b, bx, p[ 0 ], 3, p[ 1 ] + 2.35, .8, .9, .2 ); } );
      put( b, cyl, 0, .6, 7.5, 1.1, 1.4, 1.1, st2 ); put( b, cyl, 0, .8, 7.5, .7, 1.3, .7, K( '#1b3a4a', 0 ) );
    }
    if ( !only && !reg( 'castle', CASTLE.x, CASTLE.z, 22, { yaw: CASTLE.yaw } ) ) castleFn( CASTLE.x, CASTLE.z, CASTLE.yaw ); curTag = null;

    /* ---------- Timber-frame village below the castle ---------- */
    const sites = [ { x: CASTLE.x, z: CASTLE.z, r: 22 }, { x: bridgeX, z: -12, r: 14 } ];
    const free = ( x, z, r ) => pathDist( x, z ) > r * 0.6 + 1.6 && !( riverMask( x, z ) > 0.2 && riverDist( x, z ) < 12 ) && sites.every( s => Math.hypot( s.x - x, s.z - z ) > s.r + r );
    function tudor ( x, z, yaw, wd, dp, h )
    {
      { const rr = Math.max( wd, dp ) * .75 + 1; if ( reg( 'tudor', x, z, rr, { yaw, wd, dp, h } ) ) { sites.push( { x, z, r: rr } ); return; } }
      const choose = ( palette, salt, id ) => K( palette[ Math.floor( hash2( x * .71 + salt, z * .83 - salt ) * palette.length ) ], id );
      const b = baseAt( x, z, yaw, 0.5 ), plaster = choose( [ '#e6dbbd', '#d8c9a3', '#ece1c6', '#d3c19a' ], 0, 0 ), roof = choose( [ '#9a4a35', '#84402f', '#5f6e7a', '#8d5233' ], 3, 3 ), beam = wood( '#3d2a1a' );
      put( b, bx, 0, 0.2, 0, wd + .2, 3.2, dp + .2, stone( '#9d988d' ) );
      put( b, bx, 0, 1.8 + h / 2, 0, wd + .5, h, dp + .5, plaster ); put( b, bx, 0, 1.8 + h * .5, 0, wd + .65, .3, dp + .65, beam );
      [ [ -1, -1 ], [ 1, -1 ], [ -1, 1 ], [ 1, 1 ] ].forEach( s => put( b, bx, s[ 0 ] * ( wd / 2 + .2 ), 1.8 + h / 2, s[ 1 ] * ( dp / 2 + .2 ), .32, h, .32, beam ) );
      for ( let i = -1; i <= 1; i++ ) put( b, bx, i * wd * .3, 1.8 + h * .75, dp / 2 + .28, .18, h * .5, .1, beam );
      m.add( gable, P( b, 0, 1.8 + h, 0, wd + 1.6, h * .75 + 1, dp + 1.4 ), o( roof ) );
      put( b, bx, wd * .3, 1.8 + h + 1.5, -dp * .15, .85, 2.8, .85, stone( '#8b8378' ) );
      put( b, bx, 0, 1.2, dp / 2 + .2, 1, 2, .2, wood( '#4a301c' ) );
      [ -1, 1 ].forEach( s => { glow( b, bx, s * wd * .3, 1.8 + h * .55, dp / 2 + .3, .75, .8, .14 ); put( b, bx, s * ( wd * .3 + .55 ), 1.8 + h * .55, dp / 2 + .32, .3, .9, .1, wood( '#5b6b3e' ) ); put( b, bx, s * ( wd * .3 - .55 ), 1.8 + h * .55, dp / 2 + .32, .3, .9, .1, wood( '#5b6b3e' ) ); } );
      curTag = null; sites.push( { x, z, r: Math.max( wd, dp ) * .75 + 1 } );
    }
    for ( let t = 0, n = 0; t < ( only ? 0 : 2500 ) && n < 44; t++ )
    {
      const a = rnd() * 6.283, d = 23 + rnd() * 12, x = CASTLE.x + Math.cos( a ) * d, z = CASTLE.z + Math.sin( a ) * d;
      const wd = 3.4 + rnd() * 1.8, dp = 3 + rnd() * 1.2;
      if ( !free( x, z, 3.0 ) ) continue;
      tudor( x, z, Math.atan2( CASTLE.x - x, CASTLE.z - z ) + ( rnd() - .5 ) * .4, wd, dp, 2 + Math.floor( rnd() * 2 ) * 1.4 ); n++;
    }

    /* ---------- Forest village: log cabins + oak treehouses ---------- */
    function cabin ( b, wd, dp, seed )
    {
      const choose = ( palette, salt, id ) => K( palette[ Math.floor( hash2( ( seed || 0 ) + salt, ( seed || 0 ) - salt ) * palette.length ) ], id );
      const logs = choose( [ '#7a5a3c', '#8a6a48', '#6d4f36' ], 2, 2 ), roof = choose( [ '#5d4b3a', '#4f5a3f', '#6b5a48' ], 3, 3 );
      put( b, bx, 0, .2, 0, wd + .3, 1, dp + .3, stone( '#9a958a' ) ); put( b, bx, 0, 1.6, 0, wd, 2.4, dp, logs );
      for ( let k = 0; k < 5; k++ ) { put( b, cyl, wd / 2, .9 + k * .5, 0, .28, .3, dp + .5, logs ); }
      m.add( gable, P( b, 0, 2.8, 0, wd + 1.5, 2.3, dp + 1.3 ), o( roof ) );
      put( b, bx, wd * .3, 5.2, -dp * .1, .8, 2.6, .8, stone( '#8b8378' ) );
      put( b, bx, 0, 1.3, dp / 2 + .05, .95, 1.9, .16, wood( '#4a301c' ) );
      [ -1, 1 ].forEach( s => { glow( b, bx, s * wd * .32, 1.9, dp / 2 + .05, .7, .7, .14 ); put( b, bx, s * ( wd * .32 + .5 ), 1.9, dp / 2 + .1, .28, .8, .1, wood( '#4a5a34' ) ); put( b, bx, s * ( wd * .32 - .5 ), 1.9, dp / 2 + .1, .28, .8, .1, wood( '#4a5a34' ) ); } );
      put( b, bx, 0, .75, dp / 2 + 1, wd * .7, .18, 1.6, wood( '#7a5a3c' ) );[ -1, 1 ].forEach( s => put( b, bx, s * wd * .33, 1.9, dp / 2 + 1.7, .16, 2.2, .16, wood( '#5a3f28' ) ) );
      glow( b, bx, wd * .3, 2.6, dp / 2 + 1.7, .2, .28, .2 );
    }
    function cabinAt ( x, z, yaw, wd, dp )
    {
      if ( reg( 'cabin', x, z, 5, { yaw, wd, dp } ) ) { sites.push( { x, z, r: 5 } ); return; }
      cabin( baseAt( x, z, yaw, .3 ), wd, dp, x * 13.1 + z * 7.7 ); curTag = null; sites.push( { x, z, r: 5 } );
    }
    const treeTops = [];
    function treehouse ( x, z, k )
    {
      const ry0 = rnd() * 6.283, ry = curAdded && curAdded.yaw !== undefined ? curAdded.yaw : ry0; if ( reg( 'treehouse', x, z, 7, { yaw: ry, v: k } ) ) { sites.push( { x, z, r: 7 } ); return; }
      const thSc = curAdded && curAdded.scale || 1, thDy = curAdded && curAdded.dy || 0, gy = terrainHeight( x, z ), t = plant( 'oak', x, z, 2.4 * thSc, k, { y: gy + thDy } ); placed[ placed.length - 1 ].world = true;
      if ( currentItemTransform ) t.meshes.forEach( mm => { mm.updateMatrix(); mm.matrix.premultiply( currentItemTransform ); mm.matrix.decompose( mm.position, mm.quaternion, mm.scale ); } );
      { const tid = curAdded ? curAdded.id : curTag; if ( tid ) t.meshes.forEach( mm => { mm.userData.itemId = tid; } ); } treeMeshes.push( ...t.meshes ); const y0 = gy + thDy + 6.8 * thSc, b = M( x, y0, z, 1, 1, 1, 0, ry, 0 ); if ( curAdded && curAdded.scale ) b.multiply( new T.Matrix4().makeScale( curAdded.scale, curAdded.scale, curAdded.scale ) ); const wd = wood( '#7a5a3c' ), wd2 = wood( '#5a3f28' );
      put( b, cyl, 0, 0, 0, 4.7, .4, 4.7, wd );
      for ( let i = 0; i < 6; i++ ) { const a = i / 6 * 6.283, pb = P( b, 0, -.4, 0, 1, 1, 1, 0, -a, 0 ); m.add( bx, P( pb, 2.5, -1, 0, 3, .3, .3, 0, 0, .7 ), o( wd2 ) ); }
      for ( let i = 0; i < 14; i++ ) { const a = i / 14 * 6.283; if ( Math.abs( a - 3.14 ) < .55 ) continue; put( b, bx, Math.cos( a ) * 4.5, .7, Math.sin( a ) * 4.5, .16, 1.4, .16, wd2, -a ); }
      put( b, cyl, 0, 1.3, 0, 4.6, .12, 4.6, wd2 );
      cabin( P( b, 1.5, .2, 0, 1, 1, 1, 0, 0, 0 ), 4.4, 3.4, x * 13.1 + z * 7.7 );
      [ -.5, .5 ].forEach( s => tilt( b, bx, -4.8, -3.3, s, .14, 7.4, .14, .04, wd2 ) );
      for ( let i = 0; i < 14; i++ ) put( b, bx, -4.8 - i * .012, -6.5 + i * .5, 0, .1, .1, 1.1, wd2 );
      glow( b, bx, 3.7, 1.9, 3.7, .2, .28, .2 );
      treeTops.push( { x: x + Math.cos( -ry ) * 4.4, z: z + Math.sin( -ry ) * 4.4, y: y0 + .5 } ); curTag = null; sites.push( { x, z, r: 7 } );
    }
    ( only ? [] : [ [ 30, 22 ], [ 50, 22 ], [ 54, -4 ], [ 30, -8 ] ] ).forEach( ( p, i ) => treehouse( p[ 0 ], p[ 1 ], i ) );
    for ( let i = 0; i < treeTops.length; i++ ) for ( let j = i + 1; j < treeTops.length; j++ )
    {
      const a = treeTops[ i ], c = treeTops[ j ], L = Math.hypot( a.x - c.x, a.z - c.z ); if ( L > 34 ) continue;
      const ang = Math.atan2( c.z - a.z, c.x - a.x ), N = Math.floor( L / 1.0 );
      for ( let k = 0; k <= N; k++ )
      {
        const t = k / N, X = lerp( a.x, c.x, t ), Y = lerp( a.y, c.y, t ) - 2.6 * Math.sin( t * 3.1416 ), Z = lerp( a.z, c.z, t ); put( ID, bx, X, Y, Z, .95, .08, .9, wood( '#7a5a3c' ), -ang );
        if ( k % 3 === 0 ) { const nx = -Math.sin( ang ) * .5, nz = Math.cos( ang ) * .5; put( ID, bx, X + nx, Y + .5, Z + nz, .05, 1, .05, wood( '#3d2a1a' ) ); put( ID, bx, X - nx, Y + .5, Z - nz, .05, 1, .05, wood( '#3d2a1a' ) ); }
      }
    }
    for ( let t = 0, n = 0; t < ( only ? 0 : 2500 ) && n < 14; t++ )
    {
      const a = rnd() * 6.283, d = 7 + rnd() * 19, x = FV.x + Math.cos( a ) * d, z = FV.z + Math.sin( a ) * d;
      if ( !free( x, z, 4.6 ) ) continue;
      cabinAt( x, z, Math.atan2( FV.x - x, FV.z - z ) + ( rnd() - .5 ) * .6, 4 + rnd() * 1.6, 3.6 + rnd() ); n++;
    }
    ( function well ()
    {
      if ( only ) return;
      const b = baseAt( FV.x, FV.z, 0 ); put( b, cyl, 0, .6, 0, 1.7, 1.2, 1.7, stone( '#a39e93' ) ); put( b, cyl, 0, 1.15, 0, 1.3, .1, 1.3, K( '#1b3a4a', 0 ) );
      [ -1, 1 ].forEach( s => put( b, bx, s * 1.6, 2, 0, .2, 2.6, .2, wood( '#5a3f28' ) ) ); put( b, bx, 0, 3.3, 0, 3.6, .2, .2, wood( '#5a3f28' ) );
      m.add( gable, P( b, 0, 3.3, 0, 4.2, 1.3, 2.4 ), o( tile( '#5d4b3a' ) ) ); sites.push( { x: FV.x, z: FV.z, r: 3 } );
    } )();

    /* ---------- Wooden bridge ---------- */
    ( function bridge ()
    {
      if ( only || reg( 'woodenBridge', bridgeX, -12, 14, { yaw: -0.34 } ) ) return;
      const b = M( bridgeX, 0, -12, 1, 1, 1, 0, -0.34, 0 ), wd = wood( '#7d5a38' ), wd2 = wood( '#5a3f28' );
      put( b, bx, 0, 1, 0, 24, .5, 3.6, wd );[ -1.2, 1.2 ].forEach( s => put( b, bx, 0, .6, s, 24, .5, .4, wd2 ) );
      for ( let i = -5; i <= 5; i++ ) [ -1.7, 1.7 ].forEach( s => put( b, bx, i * 2.2, 1.8, s, .25, 1.3, .25, wd2 ) );
      [ -1.7, 1.7 ].forEach( s => { put( b, bx, 0, 2.35, s, 24, .22, .22, wd2 ); put( b, bx, 0, 1.75, s, 24, .12, .12, wd2 ); } );
      [ -6, 0, 6 ].forEach( x => [ -1.4, 1.4 ].forEach( s => put( b, bx, x, -.6, s, .7, 3.4, .7, wd2 ) ) );
      [ -12.4, 12.4 ].forEach( x => put( b, bx, x, .3, 0, 2, 1.6, 3.8, stone( '#9a968c' ) ) ); curTag = null;
    } )();
    /* ---------- EXPANSION: outer walls, riverbank village, stone bridge, mills, farms, enclave ---------- */
    const extras = { sails: [], wheels: [], fields: [], plots: [] };
    ( function outerWall ()
    {
      if ( only || reg( 'wall', CASTLE.x, CASTLE.z, 42 ) ) return;
      const R0 = 39.5, N = 44, gA = 0.40, st = stone( '#a8a398' ), st2 = stone( '#8f897e' ), tl = tile( '#3f5670' ), tl2 = tile( '#6a3a34' );
      const pt = i => { const a = i / N * 6.283; return [ CASTLE.x + Math.cos( a ) * R0, CASTLE.z + Math.sin( a ) * R0, a ]; };
      const dA = a => Math.abs( Math.atan2( Math.sin( a - gA ), Math.cos( a - gA ) ) );
      for ( let i = 0; i < N; i++ )
      {
        const p = pt( i ), q = pt( i + 1 ), am = ( p[ 2 ] + q[ 2 ] ) / 2; if ( dA( am ) < 0.13 ) continue;
        const mx = ( p[ 0 ] + q[ 0 ] ) / 2, mz = ( p[ 1 ] + q[ 1 ] ) / 2, ln = Math.hypot( q[ 0 ] - p[ 0 ], q[ 1 ] - p[ 1 ] ) + .6, y = terrainHeight( mx, mz );
        const b = M( mx, y, mz, 1, 1, 1, 0, -Math.atan2( q[ 1 ] - p[ 1 ], q[ 0 ] - p[ 0 ] ), 0 );
        put( b, bx, 0, 1.5, 0, ln, 11, 1.7, st ); put( b, bx, 0, 7.1, .9, ln, .35, .5, st2 );
        for ( let k = -1; k <= 1; k++ ) put( b, bx, k * ln / 3, 7.5, 0, ln / 4.2, 1.2, 1.7, st );
        if ( i % 4 === 0 ) { const x = p[ 0 ], z = p[ 1 ], yt = terrainHeight( x, z ); put( ID, cyl, x, yt + 3, z, 2.5, 17, 2.5, st2 ); put( ID, cyl, x, yt + 11.7, z, 2.9, 1, 2.9, st ); put( ID, cone, x, yt + 15.5, z, 3.1, 7, 3.1, i % 8 ? tl2 : tl ); glow( ID, bx, x + Math.cos( p[ 2 ] ) * 2.5, yt + 8, z + Math.sin( p[ 2 ] ) * 2.5, .35, 1.4, .35 ); }
      }
      [ -1, 1 ].forEach( s =>
      {
        const a = gA + s * 0.13, x = CASTLE.x + Math.cos( a ) * R0, z = CASTLE.z + Math.sin( a ) * R0, yt = terrainHeight( x, z );
        put( ID, cyl, x, yt + 4, z, 3.2, 20, 3.2, st ); put( ID, cyl, x, yt + 14.3, z, 3.7, 1.1, 3.7, st2 ); put( ID, cone, x, yt + 19, z, 3.9, 8.5, 3.9, tl2 );
        banner( ID, x + Math.cos( a ) * 3.4, yt + 9, z + Math.sin( a ) * 3.4, 2, 6, Math.atan2( Math.cos( a ), Math.sin( a ) ), s > 0 ? cloth( '#9c2a26' ) : cloth( '#27467f' ) );
      } );
      const gx = CASTLE.x + Math.cos( gA ) * R0, gz = CASTLE.z + Math.sin( gA ) * R0;
      put( M( gx, terrainHeight( gx, gz ), gz, 1, 1, 1, 0, -gA + Math.PI / 2, 0 ), bx, 0, 10.5, 0, 10.6, 3.2, 3.6, st2 ); curTag = null;
    } )();
    // riverbank village
    for ( let t = 0, n = 0; t < ( only ? 0 : 4000 ) && n < 40; t++ )
    {
      const z = 40 + rnd() * 46, cx = riverX( z ), s = rnd() < .5 ? -1 : 1, x = cx + s * ( 12 + rnd() * 22 );
      if ( !free( x, z, 3.8 ) ) continue;
      tudor( x, z, Math.atan2( cx - x, 0.001 ) + ( rnd() - .5 ) * .3, 3.6 + rnd() * 2, 3.2 + rnd() * 1.2, 2 + Math.floor( rnd() * 2 ) * 1.4 ); n++;
    }
    // stone arch bridge
    ( function stoneBridge ()
    {
      if ( only || reg( 'stoneBridge', stoneX, 62, 15 ) ) return;
      const b = M( stoneX, 0, 62, 1, 1, 1, 0, 0, 0 ), st = stone( '#a39e93' ), st2 = stone( '#8d877c' );
      put( b, bx, 0, 3, 0, 21.2, .8, 4.6, st );
      [ -7.2, 0, 7.2 ].forEach( ax => { for ( let i = 0; i <= 10; i++ ) { const a = Math.PI * i / 10; m.add( bx, P( b, ax + Math.cos( a ) * 3.4, -.4 + Math.sin( a ) * 3.4, 0, 1.05, .95, 4.4, 0, 0, a - Math.PI / 2 ), o( st2 ) ); } } );
      [ -3.6, 3.6 ].forEach( px => put( b, bx, px, 1, 0, 1.2, 4.6, 4.4, st2 ) );[ -1, 1 ].forEach( s => { put( b, bx, s * 10.8, .6, 0, 1.6, 5.4, 4.4, st2 ); put( b, bx, s * 9.4, 1.5, 0, 6, .7, 4.5, st ); tilt( b, bx, s * 14.6, 1.7, 0, 8.6, .7, 4.6, -s * .32, st ); put( b, bx, s * 14.5, -.4, 0, 8, 3.8, 4.4, st2 ); } );
      [ -2.3, 2.3 ].forEach( z => { put( b, bx, 0, 3.75, z, 21.2, .7, .5, st );[ -1, 1 ].forEach( s => tilt( b, bx, s * 14.6, 2.4, z, 8.6, .7, .5, -s * .32, st ) ); } );
      curTag = null; sites.push( { x: stoneX, z: 62, r: 12 } );
    } )();
    // windmills (sails are separate meshes animated in the render loop)
    const sm = new Mesher( 30 ), wheelM = new Mesher( 30 ), tap = new T.CylinderGeometry( .62, 1, 1, 10, 1 );
    for ( let k = 0; k < 4; k++ )
    {
      const bb = M( 0, 0, 0, 1, 1, 1, 0, 0, k * Math.PI / 2 + .5 ), wd = wood( '#5a3f28' );
      sm.add( bx, P( bb, 0, 6.3, 0, .42, 12.6, .3 ), o( wd ) ); sm.add( bx, P( bb, 2.4, 7, -.05, .14, 9.2, .14 ), o( wd ) );
      for ( let i = 0; i < 8; i++ ) sm.add( bx, P( bb, 1.2, 2.8 + i * 1.05, -.05, 2.5, .12, .12 ), o( wd ) );
      for ( let i = 0; i < 4; i++ ) sm.add( bx, P( bb, 1.2, 3.3 + i * 2.0, -.1, 2.2, 1.6, .05 ), o( K( '#e6dcc2', 0 ) ) );
    }
    sm.add( cyl, P( M( 0, 0, 0 ), 0, 0, .1, 1, 1.4, 1, Math.PI / 2, 0, 0 ), o( wood( '#3d2a1a' ) ) );
    function windmill ( x, z, yaw )
    {
      if ( reg( 'windmill', x, z, 8, { yaw } ) ) { sites.push( { x, z, r: 8 } ); return; }
      const b = baseAt( x, z, yaw );
      put( b, cyl, 0, 1.25, 0, 5.8, 4.5, 5.8, stone( '#a39e93' ) ); put( b, tap, 0, 8, 0, 5.2, 9, 5.2, wood( '#8a6a48' ) ); put( b, cone, 0, 14.6, 0, 3.9, 4.4, 3.9, tile( '#5f4e3a' ) );
      for ( let k = 0; k < 8; k++ ) { const a = k / 8 * 6.283; put( b, bx, Math.cos( a ) * 4.3, 8, Math.sin( a ) * 4.3, .3, 9, .3, wood( '#4a331f' ), -a ); }
      put( b, cyl, 0, 4.7, 0, 5.6, .35, 5.6, wood( '#6a4a2c' ) ); put( b, bx, 0, 1.4, 5.7, 1.7, 2.9, .3, wood( '#3d2a1a' ) ); put( b, bx, 0, -0.5 + 3, -8, .35, .35, 9, wood( '#5a3f28' ) );
      glow( b, bx, 0, 8.6, 4.35, .8, 1.1, .3 ); glow( b, bx, 0, 6.2, -4.5, .6, .9, .3 );
      extras.sails.push( { p: new T.Vector3( 0, 13.4, 3.5 ).applyMatrix4( b ), yaw, s: curAdded && curAdded.scale || 1, id: curTag } ); curTag = null; sites.push( { x, z, r: 8 } );
    }
    ( only ? [] : HILLS ).forEach( ( h, i ) => windmill( h.x, h.z, [ 0.9, -0.7, 2.4 ][ i ] ) );
    // watermills with rotating wheels
    for ( let k = 0; k < 16; k++ )
    {
      const a = k / 16 * 6.283, tl = 2 * Math.PI * 3.5 / 16 + .25;
      wheelM.add( bx, M( 0, Math.cos( a ) * 3.5, Math.sin( a ) * 3.5, 1, .32, tl, a, 0, 0 ), o( wood( '#5a3f28' ) ) );
      if ( k % 2 === 0 ) { wheelM.add( bx, M( 0, Math.cos( a ) * 1.75, Math.sin( a ) * 1.75, 1, 3.5, .3, a, 0, 0 ), o( wood( '#6a4a2c' ) ) ); wheelM.add( bx, M( 0, Math.cos( a ) * 3.7, Math.sin( a ) * 3.7, 1.4, .9, .14, a, 0, 0 ), o( wood( '#7a5a3c' ) ) ); }
    }
    wheelM.add( cyl, M( 0, 0, 0, .35, 3.4, .35, 0, 0, Math.PI / 2 ), o( wood( '#3d2a1a' ) ) );
    ( only ? [] : [ [ 40, 1 ], [ -62, -1 ] ] ).forEach( q =>
    {
      const z = q[ 0 ], s = q[ 1 ], cx = riverX( z ), bxc = cx + s * 11.4, b = baseAt( bxc, z, 0, .3 );
      if ( reg( 'watermill', bxc, z, 9, { yaw: s > 0 ? 0 : Math.PI } ) ) return;
      put( b, bx, 0, 1.6, 0, 7.4, 4.6, 6.4, stone( '#a39e93' ) ); put( b, bx, 0, 5, 0, 7.6, 2.6, 6.6, K( '#d8c9a3', 0 ) ); put( b, bx, 0, 5, 0, 7.8, .3, 6.8, wood( '#3d2a1a' ) );
      m.add( gable, P( b, 0, 6.3, 0, 9, 3.4, 7.6 ), o( tile( '#7a4b32' ) ) ); put( b, bx, s * 1.5, 9, -1.2, 1, 3, 1, stone( '#8b8378' ) );
      put( b, bx, 0, 1.4, 3.25, 1.3, 2.6, .2, wood( '#3d2a1a' ) ); glow( b, bx, 2.2, 5.2, 3.35, .9, 1, .14 ); glow( b, bx, -2.2, 5.2, 3.35, .9, 1, .14 );
      for ( let i = 0; i < 4; i++ ) put( b, bx, -2.5 + i * .9, .5, 3.9, .7, .9, .6, K( '#cbb98a', 0 ), i );
      put( b, bx, -s * 5.6, 3.8, 0, 3.4, .4, 1.4, wood( '#6a4a2c' ) );
      extras.wheels.push( { x: cx + s * 6.9, y: 1.4, z, id: curTag } ); curTag = null; sites.push( { x: bxc, z, r: 9 } );
    } );
    // farming hamlets
    function field ( x, z, wd, dp, yaw, kind, type )      // registers ONE farm record; buildFarm() turns it into a single assembly
    {
      const ty = type || 'farm', s = curAdded && curAdded.scale || 1, dy = curAdded && curAdded.dy || 0;
      if ( reg( ty, x, z, ( Math.hypot( wd, dp ) / 2 + 2 ) * s, { yaw, wd, dp, kind } ) ) return;
      const crop = FARM_CROPS[ ty ] || [ 'wheat', 'carrot', 'leafy' ][ kind ] || 'carrot';
      extras.plots.push( { x, z, wd, dp, yaw, s, dy, crop, flat: flatMode, rx: curAdded && curAdded.rx, ry: curAdded && curAdded.ry, rz: curAdded && curAdded.rz, sx: curAdded && curAdded.sx, sy: curAdded && curAdded.sy, sz: curAdded && curAdded.sz, id: catalog[ catalog.length - 1 ].id } ); curTag = null;
    }
    ( only ? [] : HAMLETS ).forEach( ( h, hi ) =>
    {
      tudor( h.x, h.z, rnd() * 6.28, 6, 4.6, 3.2 );
      const bb = baseAt( h.x + 13, h.z + 3, .4 ); put( bb, bx, 0, 2.5, 0, 9, 5.5, 7, wood( '#7a5a3c' ) ); m.add( gable, P( bb, 0, 5.2, 0, 10.6, 4.4, 8.6 ), o( tile( '#5a4a3a' ) ) ); put( bb, bx, 0, 1.8, 3.55, 3.4, 3.6, .2, wood( '#3d2a1a' ) );
      for ( let k = 0; k < 4; k++ ) { const hb = baseAt( h.x - 9 + k * 2.6, h.z - 9 + ( k % 2 ) * 2, 0 ); put( hb, cyl, 0, .9, 0, 1.3, 1.8, 1.3, K( '#c9a24a', 0 ) ); put( hb, cone, 0, 2.6, 0, 1.4, 1.8, 1.4, K( '#c9a24a', 0 ) ); }
      for ( let k = 0; k < 2; k++ ) { const a = 1 + k * 3.3, x = h.x + Math.cos( a ) * 17, z = h.z + Math.sin( a ) * 17; cabinAt( x, z, a + 3.14, 4.4, 3.8 ); }
      for ( let k = 0; k < 7; k++ ) { const a = k / 7 * 6.283 + hi, d = 30 + ( k % 2 ) * 4; field( h.x + Math.cos( a ) * d, h.z + Math.sin( a ) * d, 18, 14, a + 1.57 * ( k % 2 ), k % 3 ); }
      sites.push( { x: h.x, z: h.z, r: 26 } );
    } );
    // gigantic-tree enclave deep in the forest
    const ec = treeTops.length;
    ( only ? [] : [ [ 100, -66 ], [ 116, -60 ], [ 110, -82 ], [ 92, -84 ] ] ).forEach( ( p, i ) => treehouse( p[ 0 ], p[ 1 ], i + 1 ) );
    for ( let i = ec; i < treeTops.length; i++ ) for ( let j = i + 1; j < treeTops.length; j++ )
    {
      const a = treeTops[ i ], c = treeTops[ j ], L = Math.hypot( a.x - c.x, a.z - c.z ); if ( L > 34 ) continue;
      const ang = Math.atan2( c.z - a.z, c.x - a.x ), N = Math.floor( L );
      for ( let k = 0; k <= N; k++ ) { const t = k / N, X = lerp( a.x, c.x, t ), Y = lerp( a.y, c.y, t ) - 2.6 * Math.sin( t * 3.1416 ), Z = lerp( a.z, c.z, t ); put( ID, bx, X, Y, Z, .95, .08, .9, wood( '#7a5a3c' ), -ang ); }
    }
    const build = {
      tudor: o => tudor( o.x, o.z, o.yaw || 0, o.wd || 4.4, o.dp || 3.6, o.h || 2 ),
      cabin: o => { if ( reg( 'cabin', o.x, o.z, 5 ) ) return; cabin( baseAt( o.x, o.z, o.yaw || 0, .3 ), o.wd || 4.4, o.dp || 3.8, o.x * 13.1 + o.z * 7.7 ); sites.push( { x: o.x, z: o.z, r: 5 } ); },
      windmill: o => windmill( o.x, o.z, o.yaw || 0 ),
      treehouse: o => treehouse( o.x, o.z, o.v || 0 ),
      castle: o => { if ( !reg( 'castle', o.x, o.z, 22 ) ) castleFn( o.x, o.z, o.yaw || 0 ); sites.push( { x: o.x, z: o.z, r: 22 } ); },
      woodenBridge: o => { const b = M( o.x, o.dy || 0, o.z, 1, 1, 1, 0, o.yaw !== undefined ? o.yaw : -.34, 0 ); if ( curAdded.scale ) b.multiply( new T.Matrix4().makeScale( curAdded.scale, curAdded.scale, curAdded.scale ) ); const wd = wood( '#7d5a38' ), wd2 = wood( '#5a3f28' ); if ( reg( 'woodenBridge', o.x, o.z, 14 * ( curAdded.scale || 1 ) ) ) return; put( b, bx, 0, 1, 0, 24, .5, 3.6, wd );[ -1.2, 1.2 ].forEach( s => put( b, bx, 0, .6, s, 24, .5, .4, wd2 ) ); for ( let i = -5; i <= 5; i++ ) [ -1.7, 1.7 ].forEach( s => put( b, bx, i * 2.2, 1.8, s, .25, 1.3, .25, wd2 ) ); },
      stoneBridge: o => { if ( reg( 'stoneBridge', o.x, o.z, 15 ) ) return; const b = baseAt( o.x, o.z, o.yaw || 0 ), st = stone( '#a39e93' ); put( b, bx, 0, 1.5, 0, 21, .8, 4.6, st );[ -1, 1 ].forEach( s => put( b, bx, 0, 2.3, s * 2, 21, .5, .5, stone( '#8d877c' ) ) ); },
      watermill: item => { if ( reg( 'watermill', item.x, item.z, 9 ) ) return; const b = baseAt( item.x, item.z, item.yaw || 0 ); put( b, bx, 0, 2, 0, 7.4, 4.6, 6.4, stone( '#a39e93' ) ); put( b, bx, 0, 5, 0, 7.6, 2.6, 6.6, K( '#d8c9a3', 0 ) ); m.add( gable, P( b, 0, 6.3, 0, 9, 3.4, 7.6 ), o( tile( '#7a4b32' ) ) ); { const wy = item.yaw || 0; const ws = item.scale || 1; extras.wheels.push( { x: item.x + 5 * ws * Math.cos( wy ), y: terrainHeight( item.x, item.z ) + 1.7 * ws + ( item.dy || 0 ), z: item.z - 5 * ws * Math.sin( wy ), yaw: wy, s: ws } ); } },
      wall: o => { if ( reg( 'wall', o.x, o.z, 6 ) ) return; const b = baseAt( o.x, o.z, o.yaw || 0 ); put( b, bx, 0, 2.5, 0, 12, 5, 1.5, stone( '#a8a398' ) ); put( b, bx, 0, 5.2, 0, 12.5, .5, 1.8, stone( '#8f897e' ) ); },
      farm: o => field( o.x, o.z, o.wd || 18, o.dp || 14, o.yaw || 0, o.kind || 1, 'farm' ),
      farmWheat: o => field( o.x, o.z, o.wd || 18, o.dp || 14, o.yaw || 0, 0, 'farmWheat' ),
      farmPumpkin: o => field( o.x, o.z, o.wd || 18, o.dp || 14, o.yaw || 0, 0, 'farmPumpkin' ),
      farmBerry: o => field( o.x, o.z, o.wd || 18, o.dp || 14, o.yaw || 0, 0, 'farmBerry' ),
      farmLivestock: o => field( o.x, o.z, o.wd || 18, o.dp || 14, o.yaw || 0, 0, 'farmLivestock' )
    };
    Object.keys( TREE_DEFS ).forEach( key =>
    {
      const d = TREE_DEFS[ key ];
      build[ key ] = o =>
      {
        const s = d.s * ( o.scale || 1 );
        if ( reg( key, o.x, o.z, ( d.sp === 'pine' ? 2.6 : d.sp === 'fantasy' ? 2.2 : 2.0 ) * s ) ) return;
        const q = new T.Quaternion().setFromAxisAngle( new T.Vector3( 0, 1, 0 ), o.yaw || 0 );
        const t = plant( d.sp, o.x, o.z, s, o.v || 0, { q, y: terrainHeight( o.x, o.z ) + ( o.dy || 0 ) } );
        const rec = placed[ placed.length - 1 ]; rec.world = true;
        // ONE mesh per tree: bark + foliage + the grass-blended soil disc are baked into a single BufferGeometry (3 draw groups),
        // sharing one height reference (terrain + dy), so there is no gap, no floating tile and no z-fighting between them.
        const parts = t.meshes.map( mm => { treeGroup.remove( mm ); mm.updateMatrix(); return ( mm.geometry.index ? mm.geometry.toNonIndexed() : mm.geometry.clone() ).applyMatrix4( mm.matrix ); } );
        parts.push( makeSoilGeo( [ rec ], o.dy || 0, terrainHeight ).toNonIndexed() );
        const tree = new T.Mesh( mergeParts( parts ), [ barkMat, leafMats[ d.sp ], getSoilMat() ] );
        if ( currentItemTransform ) tree.geometry.applyMatrix4( currentItemTransform );
        tree.castShadow = true; tree.receiveShadow = true; tree.customDepthMaterial = treeDepth;
        tree.userData.itemId = o.id; tree.userData.ownGeo = true; treeGroup.add( tree ); treeMeshes.push( tree ); treeAsm.push( tree );
      };
    } );
    ( only ? [ only ] : MAPD.added ).forEach( o =>
    {
      if ( !build[ o.type ] ) return;
      let hs = 2166136261; for ( const ch of String( o.id ) ) hs = Math.imul( hs ^ ch.charCodeAt( 0 ), 16777619 );
      R = mulberry32( hs >>> 0 );      // per-item jitter seed: the same item looks identical in the map, the ghost and the catalog
      const sailStart = extras.sails.length, wheelStart = extras.wheels.length;
      curAdded = o; currentItemTransform = itemTransform( o, flatMode ); currentItemK = Math.max( 1, ( o.scale || 1 ) * Math.max( o.sx || 1, o.sy || 1, o.sz || 1 ) );
      try
      {
        build[ o.type ]( o );
        transformParts( extras.sails, sailStart, currentItemTransform );
        transformParts( extras.wheels, wheelStart, currentItemTransform );
        for ( let i = sailStart; i < extras.sails.length; i++ ) extras.sails[ i ].id = o.id;
        for ( let i = wheelStart; i < extras.wheels.length; i++ ) extras.wheels[ i ].id = o.id;
      }
      finally { currentItemTransform = null; curAdded = null; curTag = null; currentItemK = 1; }
    } );
    Object.assign( extras, { catalog, treeMeshes, treeAsm, body: m.build(), windows: w.build(), sailGeo: sm.build(), wheelGeo: wheelM.build() } );
    return extras;
  }

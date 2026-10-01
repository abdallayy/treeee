  /* ---- Trees: 3 variants per species, 4 hero trees + a surrounding forest --- */
  const SPECIES = { oak: buildOak, pine: buildPine, sakura: buildSakura, fantasy: buildFantasy };
  const variants = {};
  Object.keys( SPECIES ).forEach( ( k, si ) => { variants[ k ] = [ 0, 1, 2 ].map( v => SPECIES[ k ]( 1000 + si * 97 + v * 31 ) ); } );

  const treeGroup = new T.Group(); scene.add( treeGroup );
  const placed = [];                 // {x,z,r,type}
  const heroes = [ { type: 'sakura', x: -22, z: 9, y: terrainHeight( -22, 9 ) } ];   // anchor only (no tree)
  function plant ( type, x, z, scale, variant, opt )
  {
    const v = variants[ type ][ variant % 3 ];
    const y = terrainHeight( x, z );
    const bark = new T.Mesh( v.bark, barkMat ), leaf = new T.Mesh( v.leaf, leafMats[ type ] );
    [ bark, leaf ].forEach( m =>
    {
      m.position.set( x, opt && opt.y !== undefined ? opt.y : y, z ); m.scale.setScalar( scale ); if ( opt && opt.q ) m.quaternion.copy( opt.q );
      m.castShadow = true; m.receiveShadow = true; m.customDepthMaterial = treeDepth;
      treeGroup.add( m );
    } );
    placed.push( { x, z, r: ( type === 'pine' ? 2.6 : type === 'fantasy' ? 2.2 : 2.0 ) * scale, type } );
    return { x, y, z, H: v.H * scale, type, meshes: [ bark, leaf ] };
  }
  // Hero trees: one giant of each species in its domain (matches the reference map)

  // Castles and the cathedral are "keep-out" zones for the forest

  const keepOut = [ { x: CASTLE.x, z: CASTLE.z, r: 43 }, { x: FV.x, z: FV.z, r: 24 }, { x: bridgeX, z: -12, r: 9 }, { x: 10, z: 62, r: 30 }, { x: -14, z: 64, r: 22 }, { x: 12.6, z: 40, r: 14 }, { x: -23, z: -62, r: 14 }, { x: 104, z: -74, r: 28 },
  ...HILLS.map( h => ( { x: h.x, z: h.z, r: 13 } ) ), ...HAMLETS.map( h => ( { x: h.x, z: h.z, r: 46 } ) ), { x: -22, z: 9, r: 13 } ];

  // Forest: fill each biome (oak kingdom / pine reach / sakura domain / fantasy enclave)
  ( function forest ()
  {
    return; const rnd = mulberry32( 4242 ), cnt = { oak: 0, pine: 0, sakura: 0, fantasy: 0 };
    const f = isMobile ? 0.55 : 1;
    const target = { oak: 150 * f, pine: 190 * f, sakura: 44 * f, fantasy: 0 };
    const spacing = { oak: 7.2, pine: 4.8, sakura: 6.4, fantasy: 6.8 };
    const sc = { oak: [ 0.8, 0.55 ], pine: [ 0.75, 0.75 ], sakura: [ 0.85, 0.45 ], fantasy: [ 0.85, 0.5 ] };
    for ( let tries = 0; tries < 60000; tries++ )
    {
      if ( Object.keys( cnt ).every( k => cnt[ k ] >= target[ k ] ) ) break;
      const x = ( rnd() * 2 - 1 ) * 230, z = -200 + rnd() * 350;
      const type = biomeAt( x, z );
      if ( cnt[ type ] >= target[ type ] ) continue;
      if ( riverMask( x, z ) > 0.3 && riverDist( x, z ) < 10 ) continue;
      if ( pathDist( x, z ) < 3.4 ) continue;
      if ( keepOut.some( k => Math.hypot( k.x - x, k.z - z ) < k.r ) ) continue;
      if ( placed.some( p => Math.hypot( p.x - x, p.z - z ) < p.r * 0.9 + spacing[ type ] * 0.5 ) ) continue;
      const h = terrainHeight( x, z );
      const sl = Math.hypot( ( terrainHeight( x - 2, z ) - terrainHeight( x + 2, z ) ) / 4, ( terrainHeight( x, z - 2 ) - terrainHeight( x, z + 2 ) ) / 4 );
      if ( sl > 0.6 || h > 22 ) continue;
      plant( type, x, z, sc[ type ][ 0 ] + rnd() * sc[ type ][ 1 ], Math.floor( rnd() * 3 ) );
      cnt[ type ]++;
    }
  } )();

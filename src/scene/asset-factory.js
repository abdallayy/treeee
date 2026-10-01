  /* ---- Standalone asset factory ----
   *  Builds ONE catalog item through the very same builders the map uses (buildWorld({ only }) + buildFarm), returning a
   *  Group in build coordinates. The editor's catalog thumbnails, placement ghost and move ghost are all made from this,
   *  so they can never diverge from the object that ends up on the map. */
  function buildAsset ( item, flat )
  {
    const before = placed.length, x = buildWorld( { only: item, flat: !!flat } ), g = new T.Group(), moved = new Set();
    const addMesh = ( geo, mat ) => { if ( !geo.attributes.position.count ) { geo.dispose(); return; } const m = new T.Mesh( geo, mat ); m.castShadow = m.receiveShadow = true; m.userData.ownGeo = true; g.add( m ); };
    addMesh( x.body, landmarkMat ); addMesh( x.windows, winMat );
    x.sails.forEach( sl => { const sg = new T.Group(); sg.position.copy( sl.p ); sg.rotation.set( ...( sl.rot || [ 0, sl.yaw, 0 ] ) ); sg.scale.set( sl.sx || sl.s || 1, sl.sy || sl.s || 1, sl.sz || sl.s || 1 ); const m = new T.Mesh( x.sailGeo, landmarkMat ); m.userData.sail = true; m.castShadow = true; sg.add( m ); g.add( sg ); } );
    x.wheels.forEach( wl => { const m = new T.Mesh( x.wheelGeo, landmarkMat ); m.userData.wheel = true; m.rotation.order = 'XYZ'; m.rotation.set( ...( wl.rot || [ 0, wl.yaw || 0, 0 ] ) ); m.position.set( wl.x, wl.y, wl.z ); m.scale.set( wl.sx || wl.s || 1, wl.sy || wl.s || 1, wl.sz || wl.s || 1 ); m.castShadow = true; g.add( m ); } );
    if ( !x.sails.length ) x.sailGeo.dispose(); if ( !x.wheels.length ) x.wheelGeo.dispose();
    x.plots.forEach( p => { const f = buildFarm( p ); f.userData.itemId = item.id; g.add( f ); } );
    [ ...x.treeAsm, ...x.treeMeshes ].forEach( m => { if ( moved.has( m ) ) return; moved.add( m ); treeGroup.remove( m ); g.add( m ); } );      // trees / treehouse trunks were planted into the live treeGroup: pull them back out
    placed.splice( before );                                                                                                                         // ...and out of the live forest bookkeeping
    g.userData.item = item; g.userData.cat = x.catalog; return g;
  }
  function disposeAsset ( g ) { if ( g.userData.sharedGeometry || g.userData.assetPrototype ) return; g.traverse( n => { if ( n.userData.ownGeo && n.geometry ) n.geometry.dispose(); } ); }
  const assetPrototypeCache = new Map();
  function getAssetPrototype ( type )
  {
    let asset = assetPrototypeCache.get( type );
    if ( !asset )
    {
      asset = buildAsset( { id: 'prototype:' + type, type, x: 0, z: 0, yaw: 0, scale: 1, v: 0 }, true );
      asset.userData.assetPrototype = true; assetPrototypeCache.set( type, asset );
    }
    return asset;
  }

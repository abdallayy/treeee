    /* ---------- incremental world: edits never rebuild the map ----------
     *  Every item baked into the merged meshes owns vertex ranges (Mesher.ranges). Hiding an item zeroes just those vertices
     *  (+ wind weights) and re-uploads only that slice; showing it copies the saved slice back. Items added this session are
     *  standalone groups (the ghost's own asset is adopted, nothing is rebuilt), so add / delete / move cost O(one item). */
    const touch = ( a, lo, hi ) => { const d = dirtyAttr.get( a ); if ( d ) { d[ 0 ] = Math.min( d[ 0 ], lo ); d[ 1 ] = Math.max( d[ 1 ], hi ); } else dirtyAttr.set( a, [ lo, hi ] ); };
    function flushHidden () { dirtyAttr.forEach( ( r, a ) => { a.updateRange.offset = r[ 0 ]; a.updateRange.count = r[ 1 ] - r[ 0 ]; a.needsUpdate = true; } ); dirtyAttr.clear(); }
    function setBaseVisible ( id, vis )
    {
      if ( vis === !hiddenBase.has( id ) ) return;
      if ( vis ) { hiddenBase.get( id ).forEach( b => { b.a.array.set( b.d, b.s ); touch( b.a, b.s, b.s + b.d.length ); } ); hiddenBase.delete( id ); }
      else
      {
        const bk = [];
        [ wg.body, wg.windows ].forEach( geo =>
        {
          const rs = geo.userData.ranges && geo.userData.ranges[ id ]; if ( !rs ) return;
          [ geo.attributes.position, geo.attributes.aWind ].forEach( a => rs.forEach( ( [ st, n ] ) => { const lo = st * a.itemSize, hi = ( st + n ) * a.itemSize; bk.push( { a, s: lo, d: a.array.slice( lo, hi ) } ); a.array.fill( 0, lo, hi ); touch( a, lo, hi ); } ) );
        } );
        hiddenBase.set( id, bk );
      }
      worldObjs.forEach( o => { if ( o.userData.itemId === id ) o.visible = vis; } );
      wg.treeMeshes.forEach( o => { if ( o.userData.itemId === id ) o.visible = vis; } );
      farmAsm.forEach( g => { if ( g.userData.itemId === id ) g.visible = vis; } );
    }
    function mountStandalone ( o )
    {
      let g = pending.get( o.id ), cat; pending.delete( o.id );
      const sc = o.scale || 1, big = sc * Math.max( o.sx || 1, o.sz || 1 );
      if ( RIGID[ o.type ] )
      {
        const proto = getAssetPrototype( o.type ); g = proto.clone( true ); g.userData.sharedGeometry = true; g.userData.assetPrototype = false;
        g.position.set( o.x, baseY( o.type, o.x, o.z ) + ( o.dy || 0 ), o.z );
        g.quaternion.setFromEuler( new T.Euler( o.rx || 0, o.ry || 0, o.rz || 0, 'XYZ' ) ).multiply( new T.Quaternion().setFromAxisAngle( Y_AXIS, o.yaw || 0 ) );
        g.scale.set( sc * ( o.sx || 1 ), sc * ( o.sy || 1 ), sc * ( o.sz || 1 ) );
        const pc = proto.userData.cat && proto.userData.cat[ 0 ]; cat = { type: o.type, r: ( pc ? pc.r : FOOT[ o.type ] || 5 ) * big };
      }
      else { g = g || buildAsset( o, false ); const c = g.userData.cat && g.userData.cat[ 0 ]; cat = c ? { ...c } : { type: o.type, r: footR( o.type, big ) }; }
      Object.assign( cat, { id: o.id, x: o.x, z: o.z, added: true, dy: o.dy || 0, meta: cat.meta || {} } );
      g.traverse( n => { if ( n.userData.sail ) sailMeshes.push( n ); if ( n.userData.wheel ) wheelMeshes.push( n ); } );
      scene.add( g ); standalone.set( o.id, { key: JSON.stringify( o ), group: g, entry: cat } );
    }
    function unmountStandalone ( id )
    {
      const v = standalone.get( id ); if ( !v ) return; scene.remove( v.group );
      v.group.traverse( n => { let i = sailMeshes.indexOf( n ); if ( i >= 0 ) sailMeshes.splice( i, 1 ); i = wheelMeshes.indexOf( n ); if ( i >= 0 ) wheelMeshes.splice( i, 1 ); } );
      disposeAsset( v.group ); standalone.delete( id );
    }
    function syncWorld ()
    {
      const added = new Map( MAPD.added.map( o => [ o.id, o ] ) ), removed = new Set( MAPD.removed );
      wg.catalog.forEach( e => { const o = added.get( e.id ), vis = e.added ? ( !!o && JSON.stringify( o ) === loadJSON.get( e.id ) ) : !removed.has( e.id ); mergedVis.set( e.id, vis ); setBaseVisible( e.id, vis ); } );
      standalone.forEach( ( v, id ) => { const o = added.get( id ); if ( !o || JSON.stringify( o ) !== v.key ) unmountStandalone( id ); } );
      const need = []; added.forEach( ( o, id ) => { if ( !mergedVis.get( id ) && !standalone.has( id ) ) need.push( o ); } );
      const heavy = need.filter( o => !RIGID[ o.type ] && !pending.has( o.id ) ).length;
      need.forEach( o => { if ( heavy > 1 && !RIGID[ o.type ] && !pending.has( o.id ) ) { if ( !queued.has( o.id ) ) { queued.add( o.id ); buildQ.push( o.id ); } } else mountStandalone( o ); } );
      pending.clear(); flushHidden(); updateClear();
    }
    function updateClear ()
    {
      const arr = WU.uClear.value; let n = 0;
      liveCatalog().forEach( e => { if ( e.added && !TREE_DEFS[ e.type ] && !/^farm/.test( e.type ) && n < arr.length ) arr[ n++ ].set( e.x, e.z, e.r * 0.8, 0 ); } );
      WU.uClearN.value = n;
      for ( ; n < arr.length; n++ ) arr[ n ].set( 0, 0, 0, 0 );
    }
    function drainQ ()      // heavy items of a batch pop in one at a time (~6 ms budget per frame): no frame spike
    {
      if ( !buildQ.length ) return; const t0 = performance.now(); let did = false;
      while ( buildQ.length && ( !did || performance.now() - t0 < 6 ) )
      {
        const id = buildQ.shift(); queued.delete( id ); const o = MAPD.added.find( x => x.id === id );
        if ( !o || standalone.has( id ) || mergedVis.get( id ) ) continue; mountStandalone( o ); did = true;
      }
      if ( did ) { updateClear(); if ( !gs ) refreshSelUI(); if ( $( 'devLibrary' ).classList.contains( 'open' ) ) renderPlaced(); }
    }

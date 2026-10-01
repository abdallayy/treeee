    /* ---------- Move (M): any selection - one object or many - moves as a rigid group with the X / Y / Z gizmo ---------- */
    const groupRoot = new T.Group(); scene.add( groupRoot );
    function clearGroupGhosts () { [ ...groupRoot.children ].forEach( c => groupRoot.remove( c ) ); }
    function syncPivot () { const g = gs; pivot.position.set( g.ax + g.dx, hGrid( g.ax, g.az ) + g.dy, g.az + g.dz ); pivot.quaternion.identity(); pivot.scale.set( 1, 1, 1 ); }
    function endGroupUI () { if ( tc ) tc.detach(); controls.enabled = true; clearGroupGhosts(); sessRing.show( false ); $( 'devGroupBar' ).hidden = true; selPool.forEach( r => { r.show( false ); r.color( 0xffd66b ); } ); }
    function beginMoveSel ( listArg )
    {
      const list = ( listArg || selEntries ).filter( e => !( e.type === 'wall' && e.r > 30 ) );
      if ( !list.length ) { toast( 'The castle outer wall can only be deleted.' ); return; }
      if ( sess ) cancelSession(); if ( gs ) cancelGroup();
      const before = snap(), items = []; let cx = 0, cz = 0;
      list.forEach( ( it, i ) =>
      {
        let rec;
        if ( it.added ) { const o = MAPD.added.find( q => q.id === it.id ); if ( !o ) return; rec = Object.assign( { scale: 1, yaw: 0, dy: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, v: 0 }, o ); }
        else { const mt = it.meta || {}; rec = { id: newId() + i, type: it.type, x: it.x, z: it.z, yaw: mt.yaw || 0, scale: 1, dy: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, v: mt.v || 0, from: it.id, wd: mt.wd, dp: mt.dp, h: mt.h, kind: mt.kind }; }
        items.push( { rec, r: it.r, srcId: it.id, added: !!it.added } ); cx += it.x; cz += it.z;
      } );
      if ( !items.length ) return; cx /= items.length; cz /= items.length;
      const gone = new Set( items.map( o => o.srcId ) );
      MAPD.added = MAPD.added.filter( o => !gone.has( o.id ) ); MAPD.removed = [ ...new Set( [ ...MAPD.removed, ...items.filter( o => !o.added ).map( o => o.srcId ) ] ) ];
      items.forEach( o => { const a = getAssetPrototype( o.rec.type ).clone( true ); a.userData.sharedGeometry = true; o.view = ghostify( a ); groupRoot.add( o.view ); } );   // same hologram look as a normal placement ghost
      gs = { before, items, ax: cx, az: cz, dx: 0, dz: 0, dy: 0, rot: 0, grab: null, h0: hover, valid: true, ids: items.map( o => o.srcId ) };
      selIds.clear(); devApply( false ); refreshSelUI(); setHover( null ); controls.enabled = true;
      $( 'devGroupBar' ).hidden = false; $( 'devGroupTitle' ).textContent = items.length === 1 ? 'Moving ' + labelOf( items[ 0 ].rec.type ) : 'Moving ' + items.length + ' objects';
      if ( tc ) { tc.setMode( 'translate' ); tc.setSpace( 'world' ); tc.showX = tc.showY = tc.showZ = true; tc.setTranslationSnap( GRID ); tc.setRotationSnap( null ); tc.setScaleSnap( null ); syncPivot(); tc.attach( pivot ); }
      placeGroup();
    }
    function placeGroup ()
    {
      const g = gs, c = Math.cos( g.rot ), sn = Math.sin( g.rot ); g.valid = true;
      g.items.forEach( ( o, i ) =>
      {
        const r = o.rec, ox = r.x - g.ax, oz = r.z - g.az; o.nx = g.ax + g.dx + c * ox + sn * oz; o.nz = g.az + g.dz - sn * ox + c * oz; o.nyaw = r.yaw + g.rot;
        if ( !( Math.abs( o.nx ) < HALF - 4 && Math.abs( o.nz ) < HALF - 4 ) ) g.valid = false;
        const y = baseY( r.type, o.nx, o.nz ) + ( r.dy || 0 ) + g.dy, sc = r.scale;
        o.view.position.set( o.nx, y, o.nz ); o.view.quaternion.setFromEuler( new T.Euler( r.rx, r.ry, r.rz, 'XYZ' ) ).multiply( new T.Quaternion().setFromAxisAngle( Y_AXIS, o.nyaw ) ); o.view.scale.set( sc * r.sx, sc * r.sy, sc * r.sz );
      } );
      const col = g.valid ? 0x6cf2c2 : 0xff6b5e; holoU.uColor.value.set( col );
      g.items.forEach( ( o, i ) => { if ( i >= 160 ) return; const ring = selPool[ i ] || ( selPool[ i ] = new TerrainRing( 0xffd66b, 0.8 ) ); ring.set( o.nx, o.nz, o.r ); ring.color( col ); ring.show( true ); } );
    }
    function cancelGroup ()
    {
      const g = gs; if ( !g ) return; gs = null; endGroupUI(); loadSnap( g.before ); devApply( false ); setSel( g.ids );
    }
    function confirmGroup ()
    {
      const g = gs; if ( !g ) return; if ( !g.valid ) { toast( 'Some objects are outside the map.' ); return; }
      gs = null; endGroupUI(); pushUndo( g.before );
      const ids = []; g.items.forEach( o => { const r = Object.assign( {}, o.rec, { x: o.nx, z: o.nz, yaw: o.nyaw, dy: ( o.rec.dy || 0 ) + g.dy } ); MAPD.added.push( sessItem( r ) ); ids.push( r.id ); } );
      devApply(); setSel( ids ); pulse( g.ax + g.dx, g.az + g.dz, 8 ); toast( ids.length === 1 ? 'Moved' : ids.length + ' objects moved', true );
    }
    function tickGroup ( now )
    {
      holoU.uTime.value = now * 0.001; holoU.uOpacity.value = 0.86 + 0.14 * Math.sin( now * 0.004 );
      if ( tc || !hover || hover === gs.h0 || ( devTickN++ & 1 ) ) return;      // no gizmo available: follow the cursor instead
      const p = pickGround( hover.x, hover.y ); if ( !p ) return; if ( !gs.grab ) gs.grab = p.clone();
      const dx = Math.round( ( p.x - gs.grab.x ) / GRID ) * GRID, dz = Math.round( ( p.z - gs.grab.z ) / GRID ) * GRID; if ( dx !== gs.dx || dz !== gs.dz ) { gs.dx = dx; gs.dz = dz; placeGroup(); }
    }

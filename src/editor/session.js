    /* ---------- placement / move session ---------- */
    const bar = () => $( 'devBar' );
    function updateBar ()
    {
      if ( !sess ) return;
      const values = { x: sess.x, worldY: baseY( sess.type, sess.x, sess.z ) + sess.dy, z: sess.z, rx: sess.rx * 180 / Math.PI, ry: sess.ry * 180 / Math.PI, rz: sess.rz * 180 / Math.PI, sx: sess.sx, sy: sess.sy, sz: sess.sz };
      Object.keys( values ).forEach( key => { const value = $( 'devRange-' + key ); if ( value ) value.value = values[ key ]; const number = $( 'devNumber-' + key ); if ( number ) number.value = Number( values[ key ] ).toFixed( key[ 0 ] === 'r' ? 1 : 2 ); } );
      $( 'devSnap' ).checked = sess.snap; $( 'devUniform' ).checked = sess.uniform; $( 'devConfirm' ).disabled = !sess.locked || !sess.valid; $( 'devConfirm' ).textContent = sess.mode === 'move' ? 'Apply' : 'Confirm';
      $( 'devDelete' ).disabled = sess.mode !== 'move';
      document.querySelectorAll( '#devTools button' ).forEach( b => b.setAttribute( 'aria-pressed', String( b.dataset.tool === sess.tool ) ) );
      document.querySelectorAll( '.dev-transform-panel' ).forEach( p => { p.hidden = p.dataset.panel !== sess.tool; } );
      $( 'devBarHint' ).textContent = !sess.locked ? 'Aim with the cursor, click to lock · R rotates · [ ] resizes · Esc cancels' : 'Drag the handles or type values · Enter confirms · R rotates · Esc cancels';
    }
    function teardown () { if ( tc ) tc.detach(); ghostRoot.visible = false; disposeGhost(); sessRing.show( false ); bar().hidden = true; controls.enabled = true; }
    function lockSession () { sess.locked = true; if ( tc ) tc.attach( pivot ); setTool( sess.tool ); syncGhost(); updateBar(); }
    function startSession ( o )
    {
      if ( sess ) cancelSession();
      sess = Object.assign( { dy: 0, yaw: 0, scale: 1, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, v: 0, snap: true, uniform: false, tool: 'move', locked: false, valid: true }, o ); sess.id = o.keepId || newId(); if ( !sess.before ) sess.before = snap();
      sess.initial = { x: sess.x, z: sess.z, dy: sess.dy, yaw: sess.yaw, rx: sess.rx, ry: sess.ry, rz: sess.rz, scale: sess.scale, sx: sess.sx, sy: sess.sy, sz: sess.sz };
      $( 'devBarTitle' ).textContent = ( sess.mode === 'move' ? 'Editing: ' : 'Placing: ' ) + labelOf( sess.type );
      setHover( null ); buildGhost(); bar().hidden = false;
      if ( sess.locked ) lockSession(); else { if ( tc ) tc.detach(); setTool( 'move' ); syncGhost(); updateBar(); }
    }
    function cancelSession ()
    {
      const s = sess; if ( !s ) return; sess = null; teardown();
      if ( s.mode === 'move' && s.before ) { loadSnap( s.before ); devApply( false ); }
    }
    function confirmSession ()
    {
      if ( !sess || !sess.locked || !sess.valid ) return;
      const s = sess, item = sessItem( s ), adopted = takeGhostAsset( item );
      sess = null; teardown(); pushUndo( s.before ); MAPD.added.push( item ); if ( adopted ) pending.set( item.id, adopted );
      devApply(); pulse( item.x, item.z, footR( item.type, item.scale * Math.max( item.sx, item.sz ) ) ); toast( labelOf( item.type ) + ( s.mode === 'move' ? ' updated' : ' placed' ), true );
    }
    function aimAt ( p ) { sess.x = sess.snap ? Math.round( p.x / GRID ) * GRID : rd( p.x, 2 ); sess.z = sess.snap ? Math.round( p.z / GRID ) * GRID : rd( p.z, 2 ); }
    function beginPlace ( type, at )
    {
      const touch = lastPtr === 'touch', s = { type, mode: 'place', x: at.x, z: at.z, locked: touch, v: ( TREE_DEFS[ type ] || type === 'treehouse' ) ? Math.floor( Math.random() * 3 ) : 0 };
      startSession( s ); if ( sess.snap ) { aimAt( at ); syncGhost(); }
    }
    function beginMove ( it )
    {
      if ( it.type === 'wall' && it.r > 30 ) { toast( 'The castle outer wall is a single generated ring - delete it, or add wall segments instead.' ); return; }
      if ( sess ) cancelSession();
      const before = snap(); let init;
      if ( it.added )
      {
        const orig = MAPD.added.find( o => o.id === it.id ); if ( !orig ) return;
        MAPD.added = MAPD.added.filter( o => o.id !== it.id );
        init = { x: orig.x, z: orig.z, yaw: orig.yaw || 0, scale: orig.scale || 1, dy: orig.dy || 0, rx: orig.rx || 0, ry: orig.ry || 0, rz: orig.rz || 0, sx: orig.sx || 1, sy: orig.sy || 1, sz: orig.sz || 1, v: orig.v || 0, keepId: orig.id, from: orig.from, wd: orig.wd, dp: orig.dp, h: orig.h, kind: orig.kind };
      }
      else
      {
        MAPD.removed = [ ...new Set( [ ...MAPD.removed, it.id ] ) ];    // base items are "moved" by hiding the original and adding a copy
        const mt = it.meta || {}; init = { x: it.x, z: it.z, yaw: mt.yaw || 0, scale: 1, dy: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, v: mt.v || 0, from: it.id, wd: mt.wd, dp: mt.dp, h: mt.h, kind: mt.kind };
      }
      select( null ); devApply( false ); startSession( { ...init, type: it.type, mode: 'move', locked: true, before } );
    }
    function deleteSel ()
    {
      const list = selEntries.filter( e => !( e.type === 'wall' && e.r > 30 ) ).concat( selEntries.filter( e => e.type === 'wall' && e.r > 30 ) ); if ( !list.length ) return;
      pushUndo( snap() ); const del = new Set( list.map( e => e.id ) );
      MAPD.added = MAPD.added.filter( o => !del.has( o.id ) ); MAPD.removed = [ ...new Set( [ ...MAPD.removed, ...list.filter( e => !e.added ).map( e => e.id ) ] ) ];
      const a = selAnchor; selIds.clear(); devApply(); pulse( a.x, a.z, a.r ); pulseRing.color( 0xff8f80 ); toast( list.length + ' objects deleted', true );
    }
    function focusSelection () { if ( selEntries.length > 1 ) { focusOn( selAnchor.x, selAnchor.z, selAnchor.r ); toast( 'Focus · ' + selEntries.length + ' objects' ); } else focusItem( selected ); }
    function deleteItem ( it )
    {
      pushUndo( snap() );
      if ( it.added ) MAPD.added = MAPD.added.filter( o => o.id !== it.id ); else MAPD.removed = [ ...new Set( [ ...MAPD.removed, it.id ] ) ];
      select( null ); devApply(); pulse( it.x, it.z, it.r ); pulseRing.color( 0xff8f80 ); toast( labelOf( it.type ) + ' deleted', true );
    }

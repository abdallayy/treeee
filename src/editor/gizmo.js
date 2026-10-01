    /* ---------- gizmo (three.js TransformControls on an invisible pivot) ---------- */
    const pivot = new T.Object3D(); scene.add( pivot ); let tc = null;
    if ( T.TransformControls )
    {
      tc = new T.TransformControls( camera, canvas ); tc.setSpace( 'world' ); tc.setSize( 1.15 ); scene.add( tc );
      tc.addEventListener( 'dragging-changed', e => { controls.enabled = !e.value; } );
      tc.addEventListener( 'objectChange', onGizmoChange );
    }
    function setTool ( tool )
    {
      sess.tool = tool;
      if ( tc )
      {
        tc.setMode( tool === 'rotate' ? 'rotate' : tool === 'scale' ? 'scale' : 'translate' );
        tc.showX = tc.showY = tc.showZ = true;
        tc.setTranslationSnap( sess.snap && tool === 'move' ? GRID : null ); tc.setRotationSnap( sess.snap ? Math.PI / 12 : null ); tc.setScaleSnap( sess.snap && tool === 'scale' ? 0.05 : null );
      }
      document.querySelectorAll( '#devTools button' ).forEach( b => b.setAttribute( 'aria-pressed', String( b.dataset.tool === tool ) ) );
    }
    function onGizmoChange ()
    {
      if ( gs ) { const p = pivot.position; gs.dx = rd( p.x - gs.ax, 2 ); gs.dz = rd( p.z - gs.az, 2 ); gs.dy = clamp( rd( p.y - hGrid( gs.ax, gs.az ), 2 ), -40, 160 ); placeGroup(); return; }
      if ( !sess || !sess.locked ) return;
      const p = pivot.position;
      if ( sess.tool === 'move' ) { sess.x = rd( p.x, 2 ); sess.z = rd( p.z, 2 ); sess.dy = clamp( rd( p.y - baseY( sess.type, sess.x, sess.z ), 2 ), -40, 160 ); }
      else if ( sess.tool === 'scale' )
      {
        const values = [ pivot.scale.x, pivot.scale.y, pivot.scale.z ];
        if ( sess.uniform ) { const previous = [ sess.sx, sess.sy, sess.sz ], axis = values.reduce( ( best, value, i ) => Math.abs( value - previous[ i ] ) > Math.abs( values[ best ] - previous[ best ] ) ? i : best, 0 ); values.fill( values[ axis ] ); }
        sess.sx = clamp( rd( values[ 0 ], 3 ), 0.25, 4 ); sess.sy = clamp( rd( values[ 1 ], 3 ), 0.25, 4 ); sess.sz = clamp( rd( values[ 2 ], 3 ), 0.25, 4 );
      }
      else
      {
        const baseYaw = new T.Quaternion().setFromAxisAngle( Y_AXIS, -sess.yaw ), extra = pivot.quaternion.clone().multiply( baseYaw );
        const e = new T.Euler().setFromQuaternion( extra, 'XYZ' ); sess.rx = rd( e.x, 4 ); sess.ry = rd( e.y, 4 ); sess.rz = rd( e.z, 4 );
      }
      syncGhost(); updateBar();
    }
    function syncGhost ()
    {
      if ( !sess ) { ghostRoot.visible = false; sessRing.show( false ); return; }
      const y = baseY( sess.type, sess.x, sess.z ) + sess.dy, q = new T.Quaternion().setFromEuler( new T.Euler( sess.rx, sess.ry, sess.rz, 'XYZ' ) ).multiply( new T.Quaternion().setFromAxisAngle( Y_AXIS, sess.yaw ) );
      if ( ghost.live ) { ghost.dirty = true; ghost.t = performance.now(); if ( ghost.exact ) showProto(); }
      ghostRoot.position.set( sess.x, y, sess.z ); ghostRoot.quaternion.copy( q ); ghostRoot.scale.set( sess.scale * sess.sx, sess.scale * sess.sy, sess.scale * sess.sz ); ghostRoot.visible = true;
      pivot.position.set( sess.x, y, sess.z ); pivot.quaternion.copy( q ); pivot.scale.set( sess.sx, sess.sy, sess.sz );
      sess.valid = Math.abs( sess.x ) < HALF - 4 && Math.abs( sess.z ) < HALF - 4; holoU.uColor.value.set( sess.valid ? 0x6cf2c2 : 0xff6b5e ); sessRing.set( sess.x, sess.z, footR( sess.type, sess.scale * Math.max( sess.sx, sess.sz ) ) ); sessRing.color( sess.valid ? 0x6cf2c2 : 0xff6b5e ); sessRing.show( true );
    }

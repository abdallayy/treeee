    /* ---------- session bar ---------- */
    $( 'devTools' ).onclick = e => { const b = e.target.closest( '[data-tool]' ); if ( b && sess ) { setTool( b.dataset.tool ); updateBar(); } };
    $( 'devBar' ).addEventListener( 'input', e =>
    {
      const input = e.target.closest( '[data-transform]' ); if ( !input || !sess ) return;
      const field = input.dataset.transform, value = +input.value; if ( !Number.isFinite( value ) ) return;
      if ( field === 'worldY' ) sess.dy = value - baseY( sess.type, sess.x, sess.z );
      else if ( field === 'rx' || field === 'ry' || field === 'rz' ) sess[ field ] = value * Math.PI / 180;
      else if ( field === 'sx' || field === 'sy' || field === 'sz' )
      {
        if ( sess.uniform ) sess.sx = sess.sy = sess.sz = value; else sess[ field ] = value;
      }
      else sess[ field ] = value;
      syncGhost(); updateBar();
    } );
    $( 'devUniform' ).onchange = e => { if ( !sess ) return; sess.uniform = e.target.checked; if ( sess.uniform ) sess.sx = sess.sy = sess.sz = sess.sx; syncGhost(); updateBar(); };
    $( 'devResetTransforms' ).onclick = () =>
    {
      if ( !sess ) return; Object.assign( sess, sess.initial ); syncGhost(); updateBar();
    };
    $( 'devDelete' ).onclick = () =>
    {
      if ( !sess || sess.mode !== 'move' ) return;
      const b0 = sess.before; sess = null; teardown(); pushUndo( b0 ); devApply(); toast( 'Object deleted', true );
    };
    $( 'devSnap' ).onchange = e => { if ( !sess ) return; sess.snap = e.target.checked; setTool( sess.tool ); };
    $( 'devCancel' ).onclick = cancelSession; $( 'devConfirm' ).onclick = confirmSession;

    /* ---------- input wiring ---------- */
    canvas.addEventListener( 'contextmenu', e => e.preventDefault() );
    let rc = null, lp = null, lpStart = null;
    document.addEventListener( 'pointerdown', e => { lastPtr = e.pointerType || 'mouse'; if ( menuOpen && !e.target.closest( '#devCtx' ) ) closeMenu(); }, true );
    canvas.addEventListener( 'pointerdown', e =>
    {
      if ( e.button === 2 ) rc = { x: e.clientX, y: e.clientY, t: performance.now() };
      if ( e.pointerType === 'touch' && e.isPrimary ) { clearTimeout( lp ); lpStart = { x: e.clientX, y: e.clientY }; lp = setTimeout( () => { lp = null; openContextAt( lpStart.x, lpStart.y ); }, 550 ); }
      else { clearTimeout( lp ); lp = null; }
    } );
    canvas.addEventListener( 'pointermove', e => { if ( lp && Math.hypot( e.clientX - lpStart.x, e.clientY - lpStart.y ) > 8 ) { clearTimeout( lp ); lp = null; } } );
    canvas.addEventListener( 'pointerup', e =>
    {
      clearTimeout( lp ); lp = null;
      if ( e.button === 2 && rc ) { const d = rc; rc = null; if ( Math.hypot( e.clientX - d.x, e.clientY - d.y ) < 6 && performance.now() - d.t < 600 ) openContextAt( e.clientX, e.clientY ); }
    } );
    canvas.addEventListener( 'pointercancel', () => { clearTimeout( lp ); lp = null; rc = null; } );
    canvas.addEventListener( 'wheel', closeMenu, { passive: true } );
    window.addEventListener( 'wheel', e =>      // Shift + wheel resizes the hologram / locked object (capture phase, so the orbit zoom does not also fire)
    {
      if ( !sess || !e.shiftKey || e.target !== canvas ) return; e.preventDefault(); e.stopPropagation();
      const d = e.deltaY || e.deltaX, scale = clamp( rd( sess.sx * ( d < 0 ? 1.06 : 1 / 1.06 ), 2 ), 0.25, 4 ); sess.sx = sess.sy = sess.sz = scale; syncGhost(); updateBar();
    }, { capture: true, passive: false } );
    window.addEventListener( 'blur', closeMenu ); window.addEventListener( 'resize', closeMenu );
    document.addEventListener( 'keydown', e =>
    {
      const c = e.code, typing = /INPUT|TEXTAREA|SELECT/.test( e.target.tagName ), mod = e.ctrlKey || e.metaKey;      // e.code = physical key: F / M / E / S keep working on an Arabic keyboard layout
      if ( c === 'Escape' ) { if ( modalOpen ) closeModal(); else if ( menuOpen ) closeMenu(); else if ( gs ) cancelGroup(); else if ( sess ) cancelSession(); else if ( selIds.size ) select( null ); else if ( selTool ) setSelTool( false ); else $( 'devLibrary' ).classList.remove( 'open' ); return; }
      if ( typing || modalOpen ) return;
      if ( mod && c === 'KeyZ' ) { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
      if ( mod && c === 'KeyY' ) { e.preventDefault(); doRedo(); return; }
      if ( mod || e.altKey ) return;
      if ( c === 'KeyF' ) { e.preventDefault(); closeMenu(); focusTarget(); return; }
      if ( gs )
      {
        const st = e.shiftKey ? 5 : 1; let d = true;
        if ( c === 'KeyR' ) gs.rot += ( e.shiftKey ? -1 : 1 ) * Math.PI / 12;
        else if ( c === 'ArrowLeft' ) gs.dx -= st; else if ( c === 'ArrowRight' ) gs.dx += st; else if ( c === 'ArrowUp' ) gs.dz -= st; else if ( c === 'ArrowDown' ) gs.dz += st;
        else if ( c === 'PageUp' ) gs.dy += st; else if ( c === 'PageDown' ) gs.dy -= st;
        else if ( ( c === 'Enter' || c === 'NumpadEnter' ) && e.target.tagName !== 'BUTTON' ) { e.preventDefault(); confirmGroup(); return; } else d = false;
        if ( d ) { e.preventDefault(); syncPivot(); placeGroup(); }
        return;
      }
      if ( !sess )
      {
        if ( c === 'KeyS' ) { e.preventDefault(); setSelTool( !selTool ); return; }
        const list = selEntries.length ? selEntries : ( hoverItem ? [ hoverItem ] : [] );
        if ( c === 'Delete' || c === 'Backspace' ) { if ( list.length ) { e.preventDefault(); if ( selEntries.length > 1 ) deleteSel(); else deleteItem( list[ 0 ] ); } return; }
        if ( c === 'KeyM' ) { if ( list.length ) { e.preventDefault(); beginMoveSel( list ); } return; }
        if ( c === 'KeyE' ) { e.preventDefault(); if ( selEntries.length > 1 ) toast( 'Edit works on one object - use M to move the whole selection.' ); else if ( list.length ) beginMove( list[ 0 ] ); return; }
        return;
      }
      if ( c === 'KeyR' ) { sess.yaw += ( e.shiftKey ? -1 : 1 ) * Math.PI / 12; syncGhost(); updateBar(); return; }
      if ( c === 'BracketLeft' || c === 'BracketRight' ) { const f = c === 'BracketRight' ? 1.08 : 1 / 1.08; sess.sx = clamp( rd( sess.sx * f, 3 ), 0.25, 4 ); sess.sy = clamp( rd( sess.sy * f, 3 ), 0.25, 4 ); sess.sz = clamp( rd( sess.sz * f, 3 ), 0.25, 4 ); syncGhost(); updateBar(); return; }
      const tag = e.target.tagName;
      if ( ( c === 'Enter' || c === 'NumpadEnter' ) && tag !== 'BUTTON' ) { e.preventDefault(); if ( !sess.locked ) lockSession(); else confirmSession(); }
      else if ( sess.locked && /^(Digit|Numpad)[123]$/.test( c ) ) { setTool( [ 'move', 'rotate', 'scale' ][ +c.slice( -1 ) - 1 ] ); updateBar(); }
    } );
    document.addEventListener( 'keydown', e =>      // Ctrl+A: select everything (own listener so it never competes with the editing shortcuts)
    {
      if ( e.code !== 'KeyA' || !( e.ctrlKey || e.metaKey ) || sess || gs || modalOpen || /INPUT|TEXTAREA|SELECT/.test( e.target.tagName ) ) return;
      e.preventDefault(); setSel( liveCatalog().filter( q => !( q.type === 'wall' && q.r > 30 ) ).map( q => q.id ) ); toast( selIds.size + ' objects selected' );
    } );

    /* canvas tap (from the shared pointer handler): lock the following ghost in place */
    devClick = ( cx, cy ) =>
    {
      if ( menuOpen ) { closeMenu(); return; }
      if ( gs ) return;
      if ( !sess ) { const it = pickAt( cx, cy ).item; if ( lastMod ) { if ( it ) toggleSel( it ); } else select( it ); return; }
      if ( sess.locked ) return;
      const p = pickGround( cx, cy ); if ( !p ) return; aimAt( p ); lockSession();
    };
    devBusy = () => !!sess || !!gs || menuOpen || modalOpen;
    devTick = now =>
    {
      tickFocus( now ); tickPulse( now ); drainQ();
      if ( gs ) { cursorRing.show( false ); hoverRing.show( false ); $( 'devHoverTip' ).hidden = true; $( 'devChip' ).style.opacity = 0; tickGroup( now ); return; }
      if ( !sess ) { updateHover( now ); updateChip(); return; }
      cursorRing.show( false ); hoverRing.show( false ); $( 'devHoverTip' ).hidden = true; $( 'devChip' ).style.opacity = 0;
      holoU.uTime.value = now * 0.001; holoU.uOpacity.value = 0.86 + 0.14 * Math.sin( now * 0.004 );
      if ( ghost.live && ghost.dirty && now - ghost.t > 140 ) buildExact();
      if ( sess.locked || !hover || ( devTickN++ & 1 ) ) return;
      const p = pickGround( hover.x, hover.y ); if ( p ) { const px = sess.x, pz = sess.z; aimAt( p ); if ( px !== sess.x || pz !== sess.z ) syncGhost(); }
    };
    syncWorld();
    devStatus();

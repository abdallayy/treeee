    /* ---------- box select (Shift / Ctrl + drag, or the Select tool): works like the Windows desktop ---------- */
    function inBox ( x0, y0, x1, y1 )
    {
      const out = [], k = ( innerHeight * 0.5 ) / Math.tan( camera.fov * Math.PI / 360 );
      liveCatalog().forEach( e =>
      {
        if ( e.type === 'wall' && e.r > 30 ) return; _v.set( e.x, hGrid( e.x, e.z ) + Math.min( e.r * 0.4, 6 ), e.z ).project( camera ); if ( _v.z > 1 ) return;
        const px = ( _v.x * 0.5 + 0.5 ) * innerWidth, py = ( -_v.y * 0.5 + 0.5 ) * innerHeight, rp = clamp( e.r * 0.5 * k / Math.max( 1, camera.position.distanceTo( _v.set( e.x, 0, e.z ) ) ), 5, 110 );
        const ddx = Math.max( x0 - px, 0, px - x1 ), ddy = Math.max( y0 - py, 0, py - y1 ); if ( ddx * ddx + ddy * ddy <= rp * rp ) out.push( e.id );
      } );
      return out;
    }
    function setSelTool ( on ) { selTool = on; const b = $( 'devSelect' ); b.classList.toggle( 'on', on ); b.setAttribute( 'aria-pressed', String( on ) ); canvas.style.cursor = on ? 'crosshair' : ''; if ( on ) toast( 'Select tool: drag a box · Shift adds · S to leave' ); }
    window.addEventListener( 'pointerdown', e =>
    {
      if ( e.target !== canvas ) return; lastMod = e.shiftKey || e.ctrlKey || e.metaKey; if ( e.button !== 0 || sess || gs || menuOpen || modalOpen ) return;
      if ( !( selTool || lastMod ) ) return;
      mq = { x0: e.clientX, y0: e.clientY, add: lastMod, base: lastMod ? [ ...selIds ] : [], on: false }; controls.enabled = false;
    }, true );
    window.addEventListener( 'pointermove', e =>
    {
      if ( !mq ) return; const x1 = e.clientX, y1 = e.clientY; if ( !mq.on && Math.hypot( x1 - mq.x0, y1 - mq.y0 ) < 6 ) return; mq.on = true;
      const l = Math.min( mq.x0, x1 ), t = Math.min( mq.y0, y1 ), w = Math.abs( x1 - mq.x0 ), h = Math.abs( y1 - mq.y0 );
      const mqEl = $( 'devMarquee' ); mqEl.hidden = false; mqEl.style.transform = 'translate(' + l + 'px,' + t + 'px)'; mqEl.style.width = w + 'px'; mqEl.style.height = h + 'px';
      const now = performance.now(); if ( now - ( mq.t || 0 ) < 40 ) return; mq.t = now; setSel( mq.base.concat( inBox( l, t, l + w, t + h ) ) ); mqEl.dataset.n = selIds.size + ' selected';
    } );
    const endMarquee = () => { if ( !mq ) return; const m = mq; mq = null; $( 'devMarquee' ).hidden = true; controls.enabled = true; if ( m.on ) { const n = selIds.size; if ( n ) toast( n + ( n === 1 ? ' object selected' : ' objects selected' ) ); } };
    window.addEventListener( 'pointerup', endMarquee, true ); window.addEventListener( 'pointercancel', endMarquee, true );

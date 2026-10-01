    /* ---------- focus (F): smooth fly-to, keeps the viewing angle, distance fitted to the object's size ---------- */
    let fa = null;
    const easeIO = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow( -2 * k + 2, 3 ) / 2;
    function focusOn ( x, z, r )
    {
      const y = hGrid( x, z ) + Math.min( ( r || 4 ) * 0.25, 12 ), off = camera.position.clone().sub( controls.target ), cur = off.length();
      const want = r ? clamp( r * 3.1 + 18, 28, 420 ) : cur;
      fa = { t0: performance.now(), dur: 520, from: controls.target.clone(), to: new T.Vector3( x, y, z ), dir: off.normalize(), d0: cur, d1: Math.min( cur, want ) < want * 0.6 ? want : ( r ? want : cur ) };
      pulse( x, z, r || 3 );
    }
    function focusItem ( it ) { if ( it ) { focusOn( it.x, it.z, it.r ); toast( 'Focus · ' + labelOf( it.type ) ); } }
    function focusTarget ()
    {
      if ( sess && !gs ) { focusOn( sess.x, sess.z, footR( sess.type, sess.scale * Math.max( sess.sx, sess.sz ) ) ); return; }
      if ( gs ) { focusOn( gs.ax + gs.dx, gs.az + gs.dz, gs.gr ); return; }
      if ( selEntries.length > 1 ) { focusSelection(); return; }
      const it = selected || hoverItem; if ( it ) { focusItem( it ); return; }
      const g = hover && pickGround( hover.x, hover.y ); if ( g ) focusOn( g.x, g.z, 0 ); else toast( 'Hover or select an object, then press F' );
    }
    function tickFocus ( now )
    {
      if ( !fa ) return; const k = clamp( ( now - fa.t0 ) / fa.dur, 0, 1 ), e = easeIO( k ), d = lerp( fa.d0, fa.d1, e );
      controls.target.lerpVectors( fa.from, fa.to, e ); camera.position.copy( controls.target ).addScaledVector( fa.dir, d ); controls.update(); if ( k >= 1 ) fa = null;
    }
    canvas.addEventListener( 'pointerdown', () => { fa = null; } ); canvas.addEventListener( 'wheel', () => { fa = null; }, { passive: true } );

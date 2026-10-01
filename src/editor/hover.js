    let hoverItem = null, hvPrev = null, hvT = 0, hvDone = true;
    function setHover ( it ) { hoverItem = it; if ( it ) { hoverRing.set( it.x, it.z, it.r ); hoverRing.show( true ); } else hoverRing.show( false ); canvas.style.cursor = it ? 'pointer' : 'crosshair'; }
    function setCursor ( ground, over )
    {
      if ( !ground ) { cursorRing.show( false ); return; }
      const r = Math.round( clamp( camera.position.distanceTo( ground ) * 0.011, 0.9, 7 ) * 4 ) / 4;
      cursorRing.set( ground.x, ground.z, r ); cursorRing.color( over ? 0xffd66b : 0xeafff3 ); cursorRing.show( true );
    }
    function updateHover ( now )
    {
      const tip = $( 'devHoverTip' );
      if ( !hover || menuOpen || modalOpen || mq ) { if ( hoverItem ) setHover( null ); hvPrev = null; cursorRing.show( false ); tip.hidden = true; return; }
      const ck = camera.position.x + camera.position.y * 3.1 + camera.position.z * 7.7 + controls.target.x * 1.3;
      if ( hvPrev && hvPrev.x === hover.x && hvPrev.y === hover.y && hvPrev.k === ck ) return;
      hvPrev = { x: hover.x, y: hover.y, k: ck };
      const p = pickAt( hover.x, hover.y ); if ( p.item !== hoverItem ) setHover( p.item ); setCursor( p.ground, !!p.item );
      if ( p.item ) { tip.textContent = labelOf( p.item.type ); tip.hidden = false; tip.style.transform = 'translate(' + ( hover.x + 16 ) + 'px,' + ( hover.y + 18 ) + 'px)'; } else tip.hidden = true;
    }

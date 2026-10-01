  /* =====================================================================
   *  5. PROCEDURAL TEXTURES (canvas based, all tileable)
   * ===================================================================== */
  function canvasTex ( S, draw, srgb )
  {
    const cv = document.createElement( 'canvas' ); cv.width = cv.height = S;
    const g = cv.getContext( '2d' );
    draw( g, S );
    const tex = new T.CanvasTexture( cv );
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.anisotropy = 8;
    if ( srgb !== false ) tex.encoding = T.sRGBEncoding;
    return tex;
  }
  function wrapStroke ( g, S, x, y, fn )
  {       // draw a stroke so it tiles across edges
    for ( const dx of [ -S, 0, S ] ) for ( const dy of [ -S, 0, S ] )
    {
      if ( x + dx < -40 || x + dx > S + 40 || y + dy < -120 || y + dy > S + 120 ) continue;
      fn( x + dx, y + dy );
    }
  }
  function makeBarkTexture ()
  {
    return canvasTex( 256, ( g, S ) =>
    {
      g.fillStyle = '#b9b2a8'; g.fillRect( 0, 0, S, S );
      const r = mulberry32( 99 );
      for ( let i = 0; i < 700; i++ )
      {
        const x = r() * S, y = r() * S, w = 1 + r() * 3.2, len = 25 + r() * 100, v = ( r() - 0.5 ) * 2, wob = ( r() - 0.5 ) * 6;
        g.strokeStyle = v > 0 ? `rgba(255,250,240,${ 0.12 + v * 0.35 })` : `rgba(20,14,10,${ 0.15 - v * 0.45 })`;
        g.lineWidth = w;
        wrapStroke( g, S, x, y, ( px, py ) => { g.beginPath(); g.moveTo( px, py ); g.quadraticCurveTo( px + wob, py + len / 2, px, py + len ); g.stroke(); } );
      }
    } );
  }
  function makeLeafTexture ()
  {
    return canvasTex( 256, ( g, S ) =>
    {
      g.fillStyle = '#d6d6d0'; g.fillRect( 0, 0, S, S );
      const r = mulberry32( 5 );
      for ( let i = 0; i < 420; i++ )
      {
        const x = r() * S, y = r() * S, rad = 3 + r() * 14, light = r() > 0.5;
        g.fillStyle = light ? 'rgba(255,255,255,0.10)' : 'rgba(40,50,30,0.10)';
        wrapStroke( g, S, x, y, ( px, py ) => { g.beginPath(); g.arc( px, py, rad, 0, 6.283 ); g.fill(); } );
      }
    } );
  }
  function makeGroundTexture ()
  {
    return canvasTex( 512, ( g, S ) =>
    {
      g.fillStyle = '#c2c3b6'; g.fillRect( 0, 0, S, S );
      const r = mulberry32( 21 );
      for ( let i = 0; i < 9000; i++ )
      {
        const x = r() * S, y = r() * S, l = 2 + r() * 7, v = ( r() - 0.5 ) * 2;
        g.strokeStyle = v > 0 ? `rgba(255,255,235,${ 0.06 + v * 0.22 })` : `rgba(30,35,20,${ 0.06 - v * 0.26 })`;
        g.lineWidth = 1 + r();
        const lean = ( r() - 0.5 ) * 3;
        wrapStroke( g, S, x, y, ( px, py ) => { g.beginPath(); g.moveTo( px, py ); g.lineTo( px + lean, py - l ); g.stroke(); } );
      }
      for ( let i = 0; i < 500; i++ )
      {
        const x = r() * S, y = r() * S, rad = 0.8 + r() * 1.8;
        g.fillStyle = `rgba(70,60,45,${ 0.1 + r() * 0.2 })`;
        wrapStroke( g, S, x, y, ( px, py ) => { g.beginPath(); g.arc( px, py, rad, 0, 6.283 ); g.fill(); } );
      }
    } );
  }

  /* ---- River water: flowing ribbon following the channel ---- */
  const waterTex = canvasTex( 256, ( g, S ) =>
  {
    g.fillStyle = '#e8eef2'; g.fillRect( 0, 0, S, S );
    const r = mulberry32( 8 );
    for ( let i = 0; i < 260; i++ )
    {
      const x = r() * S, y = r() * S, len = 20 + r() * 60, wob = ( r() - 0.5 ) * 14, light = r() > 0.45;
      g.strokeStyle = light ? 'rgba(255,255,255,0.45)' : 'rgba(40,90,130,0.28)'; g.lineWidth = 1 + r() * 2.5;
      wrapStroke( g, S, x, y, ( px, py ) => { g.beginPath(); g.moveTo( px, py ); g.quadraticCurveTo( px + wob, py + len / 2, px, py + len ); g.stroke(); } );
    }
  } );
  waterTex.repeat.set( 2, 1 );
  ( function river ()
  {
    const pos = [], uv = [], col = [], idx = [], nor = [];
    const z0 = HALF, z1 = -HALF, step = 2, HW = 7.0, y = -0.55;
    const cMid = C( '#3aa0d6' ), cEdge = C( '#a7eef0' ), tmp = new T.Color();
    let dist = 0, n = 0;
    for ( let z = z0; z >= z1; z -= step, n++ )
    {
      const cx = riverX( z ), sl = ( riverX( z - 1 ) - riverX( z + 1 ) ) / 2;       // dx per unit -z… used for the side vector
      const len = Math.hypot( sl, 1 ), sx = 1 / len, sz = sl / len;            // unit vector across the channel
      if ( n > 0 ) dist += step;
      for ( let k = 0; k < 5; k++ )
      {
        const u = k / 4, off = ( u - 0.5 ) * 2 * HW;
        pos.push( cx + sx * off, y, z + sz * off ); nor.push( 0, 1, 0 ); uv.push( u, dist / 8 );
        tmp.copy( cEdge ).lerp( cMid, smoothstep( 0.0, 0.35, Math.min( u, 1 - u ) ) );
        col.push( tmp.r, tmp.g, tmp.b );
      }
      if ( n > 0 ) for ( let k = 0; k < 4; k++ )
      {
        const a = ( n - 1 ) * 5 + k, b = n * 5 + k;
        idx.push( a, a + 1, b, a + 1, b + 1, b );
      }
    }
    const g = new T.BufferGeometry();
    g.setIndex( idx );
    g.setAttribute( 'position', new T.Float32BufferAttribute( pos, 3 ) );
    g.setAttribute( 'normal', new T.Float32BufferAttribute( nor, 3 ) );
    g.setAttribute( 'uv', new T.Float32BufferAttribute( uv, 2 ) );
    g.setAttribute( 'color', new T.Float32BufferAttribute( col, 3 ) );
    const m = new T.Mesh( g, new T.MeshStandardMaterial( { vertexColors: true, map: waterTex, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.72, side: T.DoubleSide } ) );
    m.receiveShadow = true; m.renderOrder = 1; scene.add( m );
  } )();

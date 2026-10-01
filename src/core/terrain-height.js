  /* =====================================================================
   *  2. TERRAIN HEIGHT FIELD
   *  Gentle meadow around the grove, ridged-noise mountain range rising
   *  with distance (tallest behind the trees, toward -Z).
   * ===================================================================== */
  // River: a meandering channel running from the cathedral hills toward the viewer.
  function riverX ( z ) { return 10 * Math.sin( z * 0.04 + 1.0 ) + 4 * Math.sin( z * 0.11 ) + 40 * Math.sin( z * 0.005 + 0.7 ) * smoothstep( 150, 420, Math.abs( z ) ); }
  function riverDist ( x, z )
  {
    const sl = ( riverX( z + 1 ) - riverX( z - 1 ) ) / 2;
    return Math.abs( x - riverX( z ) ) / Math.sqrt( 1 + sl * sl );
  }
  function riverMask ( x, z ) { return 1; }   // river now spans the entire map, top edge to bottom edge
  // Which of the four domains a point belongs to (matches the reference map layout)
  function biomeAt ( x, z )
  {
    if ( Math.hypot( x - 22, z + 16 ) < 13 ) return 'sakura';     // small blossom grove on the far bank
    const left = x < riverX( z ), back = z < -14;
    return left ? ( back ? 'oak' : 'sakura' ) : ( back ? 'pine' : 'oak' );
  }
  const CATH = { x: 0, z: -2000 };
  const CASTLE = { x: -64, z: -42, yaw: 1.13 }, FV = { x: 40, z: 8 };
  const bridgeX = riverX( -12 ), stoneX = riverX( 62 );
  const HILLS = [ { x: -100, z: 30, r: 30, h: 10 }, { x: 104, z: -30, r: 30, h: 10 }, { x: 58, z: -82, r: 30, h: 9 } ];
  const HAMLETS = [ { x: -86, z: 76 }, { x: 96, z: 68 } ];
  let _cathH = null;
  function rawHeight ( x, z )
  {
    const r = Math.hypot( x, z );
    let h = ( fbm2( x * 0.018 + 10, z * 0.018 + 10, 4 ) - 0.5 ) * 4.0 + ( noise2( x * 0.09, z * 0.09 ) - 0.5 ) * 0.5;
    const calm = 0.25 + 0.75 * smoothstep( 60, 240, r );        // settlements sit on gentler ground
    h += calm * ( ( fbm2( x * 0.006 + 70, z * 0.006 + 30, 4 ) - 0.5 ) * 64 + ( fbm2( x * 0.02 + 5, z * 0.02 + 90, 3 ) - 0.5 ) * 9 );   // hills & valleys
    const pm = smoothstep( 0.52, 0.66, fbm2( x * 0.004 + 300, z * 0.004 + 120, 3 ) );                                              // plateau mask
    if ( pm > 0 ) { const tt = h / 9, fl = Math.floor( tt ); h = lerp( h, ( fl + smoothstep( 0.3, 0.7, tt - fl ) ) * 9, pm * calm ); }  // terraces = plateaus + slopes
    h *= 1 - 0.65 * ( 1 - smoothstep( 0, 40, r ) );            // calmer ground under the grove
    const ring = smoothstep( 330, 760, r );
    if ( ring > 0 )
    {
      const back = clamp( 0.45 + 0.55 * ( -z / ( r + 1e-3 ) ), 0.3, 1.0 );
      let m = 0, amp = 1, f = 0.0042, sum = 0;
      for ( let i = 0; i < 5; i++ )
      {
        const n = noise2( x * f + 50, z * f + 50 );
        const rg = 1 - Math.abs( 2 * n - 1 );
        m += rg * rg * amp; sum += amp; amp *= 0.5; f *= 2.1;
      }
      m /= sum;
      h += ring * back * ( m * 120 + base2( x, z ) * 30 );
    }
    const dk = Math.hypot( x - CASTLE.x, z - CASTLE.z );
    if ( dk < 75 ) { h = lerp( h, 20, 1 - smoothstep( 38, 64, dk ) ); h += 5 * ( 1 - smoothstep( 13, 24, dk ) ); }
    for ( const hl of HILLS ) { const d = Math.hypot( x - hl.x, z - hl.z ); if ( d < hl.r * 1.7 ) h += hl.h * ( 1 - smoothstep( hl.r * 0.25, hl.r * 1.7, d ) ); }
    const rm = riverMask( x, z );
    if ( rm > 0 )
    {
      const d = riverDist( x, z );
      h = lerp( 0.35, h, smoothstep( 6, 55 + 90 * ring, d ) );   // wide river valley cuts through hills/mountains
      h = lerp( h, 0.35, ( 1 - smoothstep( 5, 26, d ) ) * 0.8 * rm );     // level banks
      h = lerp( h, -1.6, ( 1 - smoothstep( 4.0, 9.5, d ) ) * rm );        // carve the channel
    }
    return h;
  }
  function base2 ( x, z ) { return fbm2( x * 0.004, z * 0.004, 3 ); }
  function terrainHeight ( x, z )
  {
    let h = rawHeight( x, z );
    const dc = Math.hypot( x - CATH.x, ( z - CATH.z ) * 0.8 );
    if ( dc < 52 )
    {                                          // level plateau for the cathedral
      if ( _cathH === null ) _cathH = rawHeight( CATH.x, CATH.z );
      h = lerp( _cathH + 0.2, h, smoothstep( 26, 52, dc ) );
    }
    return h;
  }

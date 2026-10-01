
  /* ---- Landmarks: storybook castle + gothic cathedral (merged, vertex-coloured) ---- */
  function buildCastle ()
  {
    const m = new Mesher( 6 ), wall = C( '#d8ccb4' ), roof = C( '#b5413a' ), dark = C( '#3b2a22' );
    const cyl = new T.CylinderGeometry( 1, 1, 1, 10, 1 ), cone = new T.ConeGeometry( 1, 1, 10, 1 ), box = new T.BoxGeometry( 1, 1, 1 );
    const o = ( c ) => ( { color: c, sway: 0, grad: 0.25 } );
    m.add( box, M( 0, 0.9, 0, 3.4, 1.8, 3.0 ), o( wall ) );
    [ [ -1.7, -1.5 ], [ 1.7, -1.5 ], [ -1.7, 1.5 ], [ 1.7, 1.5 ] ].forEach( ( [ x, z ] ) =>
    {
      m.add( cyl, M( x, 1.6, z, 0.62, 3.2, 0.62 ), o( wall ) );
      m.add( cone, M( x, 3.9, z, 0.85, 1.4, 0.85 ), o( roof ) );
    } );
    m.add( cyl, M( 0, 2.4, 0, 0.9, 4.8, 0.9 ), o( wall ) );
    m.add( cone, M( 0, 5.7, 0, 1.2, 1.8, 1.2 ), o( roof ) );
    m.add( box, M( 0, 0.55, 1.52, 0.7, 1.1, 0.12 ), o( dark ) );
    return m.build();
  }
  function buildCathedral ()
  {
    const m = new Mesher( 60 ), w = new Mesher( 60 );
    const stone = C( '#c4c1b8' ), stoneD = C( '#a9a69e' ), slate = C( '#66778b' ), dark = C( '#3a332c' ), glass = C( '#6f9bd0' );
    const box = new T.BoxGeometry( 1, 1, 1 ), cone4 = new T.ConeGeometry( 1, 1, 4, 1 ), cyl = new T.CylinderGeometry( 1, 1, 1, 24, 1 );
    const o = ( c ) => ( { color: c, sway: 0, grad: 0.3 } );
    m.add( box, M( 0, 9, 0, 16, 18, 44 ), o( stone ) );                              // nave
    m.add( box, M( 0, 18, 0, 11.3, 11.3, 44, 0, 0, Math.PI / 4 ), o( slate ) );      // nave roof ridge
    m.add( box, M( 0, 8, -2, 38, 16, 12 ), o( stone ) );                             // transept
    m.add( box, M( 0, 16, -2, 8.5, 8.5, 38.5, 0, 0, 0 ), o( slate ) );
    m.add( box, M( 0, 16, -2, 38.5, 8.5, 8.5, Math.PI / 4, 0, 0 ), o( slate ) );     // transept roof ridge
    [ -6.5, 6.5 ].forEach( x =>
    {                                                 // twin west towers
      m.add( box, M( x, 17, 20, 8, 34, 8 ), o( stoneD ) );
      m.add( cone4, M( x, 43, 20, 5.7, 18, 5.7, 0, Math.PI / 4, 0 ), o( slate ) );
      w.add( box, M( x, 26, 24.05, 1.4, 6, 0.3 ), { color: glass, sway: 0, grad: 0 } );
    } );
    m.add( box, M( 0, 24, -2, 7, 12, 7 ), o( stoneD ) );                             // crossing tower + spire
    m.add( cone4, M( 0, 43, -2, 5, 26, 5, 0, Math.PI / 4, 0 ), o( slate ) );
    for ( let i = 0; i < 7; i++ ) [ -1, 1 ].forEach( sd =>
    {                        // buttresses + side windows
      const z = -18 + i * 6;
      m.add( box, M( sd * 8.7, 6.5, z, 1.4, 13, 2 ), o( stoneD ) );
      if ( i < 6 ) w.add( box, M( sd * 8.05, 11, z + 3, 0.3, 7, 1.5 ), { color: glass, sway: 0, grad: 0 } );
    } );
    m.add( box, M( 0, 5, 22.2, 6, 10, 0.6 ), o( dark ) );                            // portal
    w.add( cyl, M( 0, 19, 22.2, 3.2, 0.5, 3.2, Math.PI / 2, 0, 0 ), { color: glass, sway: 0, grad: 0 } );  // rose window
    return { body: m.build(), windows: w.build() };
  }

  /* ---- Low-poly clouds that drift with the wind ---------------------------- */
  const cloudMat = new T.MeshStandardMaterial( { color: 0xffffff, roughness: 1, flatShading: true } );
  const clouds = new T.Group(); scene.add( clouds );
  ( function makeClouds ()
  {
    const rnd = mulberry32( 2024 ), geo = new T.SphereGeometry( 1, 9, 6 );
    for ( let i = 0; i < 16; i++ )
    {
      const cl = new T.Group(), n = 5 + Math.floor( rnd() * 4 ), s = 14 + rnd() * 14;
      for ( let j = 0; j < n; j++ )
      {
        const m = new T.Mesh( geo, cloudMat ), r = s * ( 0.45 + rnd() * 0.45 );
        m.position.set( ( j - n / 2 ) * s * 0.55 + ( rnd() - 0.5 ) * s * 0.4, rnd() * s * 0.25, ( rnd() - 0.5 ) * s * 0.7 );
        m.scale.set( r, r * 0.5, r * 0.8 ); cl.add( m );
      }
      const a = rnd() * 6.28, d = 140 + rnd() * 700;
      cl.position.set( Math.cos( a ) * d, 120 + rnd() * 70, Math.sin( a ) * d );
      clouds.add( cl );
    }
  } )();

  /* ---- Weather & ambient particles ------------------------------------------ */
  const particleGroup = new T.Group(); scene.add( particleGroup );
  const sakuraHero = heroes.find( h => h.type === 'sakura' );
  const petalsTree = makePoints( { count: 800, box: [ 70, 22, 60 ], center: new T.Vector3( -20, sakuraHero.y + 9, 4 ), size: 0.2, color: C( '#ffa9c4' ), shape: 1, opacity: 0.0, fall: 0.9, driftBase: 0.25, driftMul: 0.45, swirl: 0.9 } );
  const petalsNear = makePoints( { count: 260, box: [ 90, 22, 90 ], followY: 9, size: 0.22, color: C( '#ffb3cb' ), shape: 1, opacity: 0.9, fall: 0.8, driftBase: 0.3, driftMul: 0.5, swirl: 0.8, follow: true } );
  const dust = makePoints( { count: 1400, box: [ 130, 22, 130 ], followY: 8, size: 0.09, color: C( '#fff3cf' ), shape: 0, opacity: 0.6, fall: -0.02, driftBase: 0.2, driftMul: 0.6, swirl: 0.6, follow: true } );
  const mist = makePoints( { count: 170, box: [ 240, 14, 240 ], size: 16, color: C( '#c9d4d8' ), shape: 0, opacity: 0.0, fall: 0, driftBase: 0.1, driftMul: 0.25, swirl: 1.5, follow: true, followY: 4 } );
  mist.u.uFade.value.set( 70, 190 );
  const flies = makePoints( { count: 240, box: [ 150, 9, 150 ], center: new T.Vector3( 0, 3.5, -10 ), size: 0.22, color: new T.Color( 2.2, 2.0, 0.5 ), shape: 0, opacity: 0.0, fall: 0, driftBase: 0.05, driftMul: 0.05, swirl: 2.2, blink: 1, additive: true } );
  const rain = makeRain( isMobile ? 8000 : 15000, [ 170, 40, 170 ] );
  [ petalsTree, petalsNear, dust, mist, flies ].forEach( s => particleGroup.add( s.points ) );
  particleGroup.add( rain.points );
  const driftVec = new T.Vector2(), rainVel = new T.Vector3();

    /* ---------- catalog thumbnails: the real asset, real materials, rendered once and cached ---------- */
    const previewCache = {};
    function makePreview ( type )
    {
      if ( previewCache[ type ] ) return previewCache[ type ];
      const W = 360, H = 240, r = makePreview.r || ( makePreview.r = new T.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } ) );
      r.setPixelRatio( 1 ); r.setSize( W, H, false ); r.setClearColor( 0x17251e, 1 ); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      const sc = new T.Scene(), cam = new T.PerspectiveCamera( 30, W / H, .1, 4000 );
      sc.add( new T.HemisphereLight( 0xcfe3ff, 0x6b5a3c, 1.0 ) ); const sunL = new T.DirectionalLight( 0xfff0dd, 3 ); sunL.position.set( 5, 9, 6 ); sc.add( sunL );
      const asset = getAssetPrototype( type ); sc.add( asset ); asset.updateMatrixWorld( true );
      const box = new T.Box3().setFromObject( asset ), c = box.getCenter( new T.Vector3() ), rad = Math.max( box.getSize( new T.Vector3() ).length() * .5, 1 ), dist = rad / Math.sin( cam.fov * Math.PI / 360 ) * 1.04;
      cam.position.copy( c ).add( new T.Vector3( .9, .55, 1 ).normalize().multiplyScalar( dist ) ); cam.lookAt( c ); cam.near = Math.max( dist - rad * 2, .1 ); cam.far = dist + rad * 4; cam.updateProjectionMatrix();
      r.render( sc, cam ); const url = r.domElement.toDataURL( 'image/png' );
      sc.remove( asset ); return ( previewCache[ type ] = url );
    }
    let thumbRaf = 0;
    function queueThumbs ()      // one thumbnail per frame, so opening the catalog never freezes the page
    {
      const todo = [ ...$( 'devGrid' ).querySelectorAll( 'img[data-type]' ) ].filter( i => !i.getAttribute( 'src' ) ); cancelAnimationFrame( thumbRaf );
      const step = () => { const im = todo.shift(); if ( !im ) return; if ( im.isConnected ) im.src = makePreview( im.dataset.type ); thumbRaf = requestAnimationFrame( step ); }; thumbRaf = requestAnimationFrame( step );
    }
    function warmAssetPrototypes ()
    {
      const todo = Object.keys( CATALOG_TYPES ); let i = 0;
      const schedule = run => window.requestIdleCallback ? requestIdleCallback( run, { timeout: 1800 } ) : setTimeout( () => run( { didTimeout: true, timeRemaining: () => 0 } ), 140 );
      const step = deadline =>
      {
        if ( i >= todo.length ) return;
        if ( sess || modalOpen || menuOpen || ( !deadline.didTimeout && deadline.timeRemaining() < 5 ) ) { schedule( step ); return; }
        const type = todo[ i++ ]; getAssetPrototype( type ); if ( !previewCache[ type ] ) makePreview( type ); schedule( step );
      };
      schedule( step );
    }

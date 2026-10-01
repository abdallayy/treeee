  /* =====================================================================
   *  13. QUALITY SWITCH (Low / Mid) - applied live to renderer, composer, shadows, camera; no reload
   * ===================================================================== */
  function syncQualityUI ()
  {
    const seg = $( 'qualSeg' ); if ( seg && seg.children ) [ ...seg.children ].forEach( b => b.classList.toggle( 'on', b.dataset.q === Q.key ) );
    const btn = $( 'qualBtn' ); if ( btn ) btn.textContent = 'Graphics: ' + Q.label;
    document.body.classList.toggle( 'q-low', Q.key === 'low' );
  }
  function applyQuality ( key )
  {
    if ( !QUALITY[ key ] ) return;
    qualityKey = key; Q = QUALITY[ key ];
    try { localStorage.setItem( 'realmQuality', key ); } catch ( e ) {}

    // 1. resolution: new pixel-ratio ceiling, adaptive resolution restarts from 100 % of it
    PR = Q.pr(); setResStep( 0 );

    // 2. shadows: rebuild the shadow map at the new size / window (the old GPU texture is released, not leaked)
    const sh = sun.shadow;
    if ( sh.mapSize.x !== Q.shadowMap )
    {
      sh.mapSize.set( Q.shadowMap, Q.shadowMap );
      if ( sh.map ) { sh.map.dispose(); sh.map = null; }
      if ( sh.mapPass ) { sh.mapPass.dispose(); sh.mapPass = null; }
    }
    const H = Q.shadowHalf; Object.assign( sh.camera, { left: -H, right: H, top: H, bottom: -H } ); sh.camera.updateProjectionMatrix();
    perf.shadowKey = ''; renderer.shadowMap.needsUpdate = true;

    // 3. anti-aliasing of the HDR target (WebGL2): change samples, dispose so three re-creates the buffers with the new count
    if ( isGL2 && 'samples' in rt ) [ ...new Set( [ rt, composer.renderTarget1, composer.renderTarget2 ] ) ].forEach( t => { if ( t && t.samples !== Q.msaa ) { t.samples = Q.msaa; t.dispose(); } } );

    // 4. draw distance: camera far plane (the sky dome ignores it); fog density + grass / stone distance are read from Q every frame
    camera.far = Q.far; camera.updateProjectionMatrix();
    updateMeadow();

    // 5. depth-of-field is skipped in Low by loop.js (Q.dof); adaptive resolution follows the preset
    perf.adaptive = Q.adaptive; perf.lock = 0; savePerf(); syncPerfUI();
    syncQualityUI();
  }
  if ( $( 'qualSeg' ).addEventListener ) $( 'qualSeg' ).addEventListener( 'click', ev => { const b = ev.target.closest( 'button' ); if ( b && b.dataset.q !== Q.key ) applyQuality( b.dataset.q ); } );
  if ( $( 'qualBtn' ).addEventListener ) $( 'qualBtn' ).addEventListener( 'click', () => applyQuality( Q.key === 'low' ? 'mid' : 'low' ) );
  syncQualityUI();

  /* ---- Touch behaviour (both qualities) ---- */
  // iOS Safari ignores touch-action for pinch: block its page-zoom gesture events (OrbitControls pinch uses touch events, unaffected)
  [ 'gesturestart', 'gesturechange', 'gestureend' ].forEach( ev => document.addEventListener( ev, e => e.preventDefault(), { passive: false } ) );
  if ( !DEV ) canvas.addEventListener( 'contextmenu', e => e.preventDefault() );      // no long-press callout over the 3D view

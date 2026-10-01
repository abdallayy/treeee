  const _camKey = new Array( 9 ).fill( NaN ); let camMoved = true, labelsWere = true;
  function tickWorld ( dt )
  {
    camera.updateMatrixWorld();
    { const p = camera.position, q = camera.quaternion, k = _camKey; camMoved = DEV || k[ 0 ] !== p.x || k[ 1 ] !== p.y || k[ 2 ] !== p.z || k[ 3 ] !== q.x || k[ 4 ] !== q.y || k[ 5 ] !== q.z || k[ 6 ] !== q.w || k[ 7 ] !== camera.aspect || k[ 8 ] !== window.innerWidth;
      if ( camMoved ) { k[ 0 ] = p.x; k[ 1 ] = p.y; k[ 2 ] = p.z; k[ 3 ] = q.x; k[ 4 ] = q.y; k[ 5 ] = q.z; k[ 6 ] = q.w; k[ 7 ] = camera.aspect; k[ 8 ] = window.innerWidth; updateMeadow(); } }      // grass chunk culling only when the camera moved
    shadowCenter.set( Math.round( controls.target.x / 16 ) * 16, 0, Math.round( controls.target.z / 16 ) * 16 ); sun.target.position.copy( shadowCenter );
    const now = performance.now();
    for ( let i = growing.length - 1; i >= 0; i-- )
    {
      const g = growing[ i ], k = clamp( ( now - g.t0 ) / 1400, 0, 1 ), e = 1 + 2.7 * Math.pow( k - 1, 3 ) + 1.7 * Math.pow( k - 1, 2 );   // ease-out-back
      g.ms.forEach( m => m.scale.setScalar( g.s * Math.max( 0.05, e ) ) ); if ( k >= 1 ) growing.splice( i, 1 );
    }
    if ( DEV ) marker.visible = false;      // editor: no idle ring at all - rings only appear on hover / selection / an active edit session
    else if ( hover && ( ++hoverN % 3 ) === 0 )
    {
      const p = pickGround( hover.x, hover.y );
      if ( p ) { marker.visible = true; marker.position.set( p.x, hGrid( p.x, p.z ) + 0.2, p.z ); marker.quaternion.setFromUnitVectors( _up, groundNormal( p.x, p.z ) ); marker.material.color.copy( C( DEV || debugFreePlanting || studyPoints > 0 ? '#7fd19a' : '#c9a24a' ) ); } else marker.visible = false;
    } else if ( !hover || ( DEV && devBusy() ) ) marker.visible = false;
    if ( DEV ) devTick( now );
    if ( now - hudT > 250 )
    {
      hudT = now; const ready = debugFreePlanting || studyPoints > 0;
      $( 'plLabel' ).textContent = 'Study time toward next point';
      if ( now - msgT > 4000 ) $( 'plMsg' ).textContent = ready ? 'Tap the ground to plant (1 point)' : 'Study for 4 hours to earn a planting point';
    }
  }

  const clock = new T.Clock();
  let fpsT = 0, fpsN = 0;

  /* ---- Performance: frame-rate target, adaptive resolution, throttled shadows ---- */
  const perf = { fps: 60, adaptive: Q.adaptive, lastT: 0, rafT: 0, minRaf: 1000 / 30, shadowT: 0, shadowKey: '', ft: 0, ftN: 0, okT: 0, lock: 0, scale: 1, cool: 0 };
  try { const sv = JSON.parse( localStorage.getItem( 'realmPerf' ) || '{}' ); if ( sv.fps >= 10 && sv.fps <= 500 ) perf.fps = sv.fps; if ( sv.fps === 0 ) perf.fps = 0; if ( typeof sv.adaptive === 'boolean' ) perf.adaptive = sv.adaptive; } catch ( e ) {}
  const RES_STEPS = [ 1, 0.88, 0.77, 0.67 ];      // adaptive resolution never goes below 67 % and only drops while the target FPS is being missed
  let resStep = 0;
  function savePerf () { try { localStorage.setItem( 'realmPerf', JSON.stringify( { fps: perf.fps, adaptive: perf.adaptive } ) ); } catch ( e ) {} }
  function setResStep ( i )
  {
    resStep = i; applyPR( Math.max( 0.75, PR * RES_STEPS[ i ] ) );
    perf.ft = 0; perf.ftN = 0; perf.okT = 0;
  }
  function syncPerfUI ()
  {
    const inp = $( 'fpsInput' ); if ( inp ) inp.value = perf.fps || '';
    const seg = $( 'fpsSeg' ); if ( seg && seg.children ) [ ...seg.children ].forEach( b => b.classList.toggle( 'on', +b.dataset.f === perf.fps ) );
    const ad = $( 'cAdaptive' ); if ( ad ) ad.checked = perf.adaptive;
  }
  function setFps ( v ) { perf.fps = v > 0 ? Math.max( 10, Math.min( 500, Math.round( v ) ) ) : 0; perf.ft = 0; perf.ftN = 0; savePerf(); syncPerfUI(); }
  if ( $( 'fpsSeg' ).addEventListener ) $( 'fpsSeg' ).addEventListener( 'click', ev => { const b = ev.target.closest( 'button' ); if ( b ) setFps( +b.dataset.f ); } );
  $( 'fpsInput' ).addEventListener( 'change', ev => { const v = parseFloat( ev.target.value ); setFps( isFinite( v ) && v > 0 ? v : 0 ); } );
  $( 'cAdaptive' ).addEventListener( 'change', ev => { perf.adaptive = ev.target.checked; if ( !perf.adaptive && resStep ) setResStep( 0 ); perf.lock = 0; savePerf(); } );
  syncPerfUI();

  function frame ( tNow )
  {
    requestAnimationFrame( frame );
    const now0 = tNow || performance.now(), interval = perf.fps > 0 ? 1000 / perf.fps : 0;      // 0 = as fast as the screen refreshes
    { const d = now0 - perf.rafT; perf.rafT = now0; if ( d > 4 && d < perf.minRaf ) perf.minRaf = d; }      // shortest vsync interval seen = the screen's real refresh period
    if ( interval && now0 - perf.lastT < interval - 1.5 ) return;      // too early for the chosen FPS: skip this vsync, do no work at all
    perf.lastT = interval ? Math.max( now0 - ( ( now0 - perf.lastT ) % interval ), now0 - interval ) : now0;
    const dt = Math.min( clock.getDelta(), 0.05 ), time = clock.elapsedTime;

    if ( state.lapse ) { state.hour = ( state.hour + dt * 0.4 ) % 24; $( 'tHour' ).value = state.hour; $( 'oHour' ).textContent = fmtHour( state.hour ); }
    WU.uWindTime.value += dt * ( 0.6 + state.windSpeed * 0.08 );
    waterTex.offset.y += dt * 0.1;
    sailMeshes.forEach( ( s, i ) => { s.rotation.z -= dt * ( 0.12 + state.windSpeed * 0.045 ) * ( 1 + i * 0.1 ); } );
    wheelMeshes.forEach( wm => { wm.rotation.x -= dt * 0.55; } );

    controls.update();
    tickWorld( dt );
    const gy = terrainHeight( camera.position.x, camera.position.z ) + 1.0;
    if ( camera.position.y < gy ) camera.position.y = gy;

    updateEnvironment( dt );
    sky.position.copy( camera.position );

    // particles
    const horiz = state.windSpeed;
    pointSystems.forEach( s =>
    {
      s.u.uTime.value = time;
      s.u.uFall.value += dt * s.fall;
      s.u.uDrift.value.addScaledVector( driftVec, dt * ( s.driftBase + horiz * s.driftMul ) );
      if ( s.follow ) { s.u.uCenter.value.copy( camera.position ); if ( s.followY !== undefined ) s.u.uCenter.value.y = s.followY; }
    } );
    rain.u.uFall.value += dt * 22;
    rainVel.set( driftVec.x * ( 0.4 + horiz * 0.35 ), -22, driftVec.y * ( 0.4 + horiz * 0.35 ) );
    rain.u.uDrift.value.x += rainVel.x * dt; rain.u.uDrift.value.y += rainVel.z * dt;
    rain.u.uVel.value.copy( rainVel );
    rain.u.uCenter.value.set( camera.position.x, 12, camera.position.z );

    // clouds drift with the wind and wrap around
    clouds.children.forEach( c =>
    {
      c.position.x += driftVec.x * ( 1.2 + horiz * 0.6 ) * dt; c.position.z += driftVec.y * ( 1.2 + horiz * 0.6 ) * dt;
      const d = Math.hypot( c.position.x, c.position.z );
      if ( d > 900 ) { c.position.x *= -0.92; c.position.z *= -0.92; }
    } );

    // depth of field: autofocus on the orbit target. The pass re-renders the whole scene for depth, so it is skipped
    // while its biggest possible blur is under ~0.75 px of the render buffer (invisible) - raise the slider and it comes back.
    const maxBlurPx = 0.007 * state.dof * renderer.domElement.width;
    bokeh.enabled = state.dof > 0.01 && ( DEV || ( Q.dof && maxBlurPx >= 0.75 ) );      // Low: the extra depth pass is never run
    if ( bokeh.enabled )
    {
      bokeh.uniforms[ 'focus' ].value = camera.position.distanceTo( controls.target );
      bokeh.uniforms[ 'aperture' ].value = 0.0003 * state.dof;
      bokeh.uniforms[ 'maxblur' ].value = 0.007 * state.dof;
    }

    // shadow map: re-rendered at ~30 Hz (wind sway is slow), immediately when the sun / shadow window actually moves
    if ( !DEV )
    {
      const key = shadowCenter.x + ',' + shadowCenter.z + ',' + state.hour.toFixed( 3 ) + ',' + state.shadows + ',' + state.weather;
      if ( key !== perf.shadowKey || now0 - perf.shadowT >= Q.shadowMs ) { perf.shadowKey = key; perf.shadowT = now0; renderer.shadowMap.needsUpdate = true; }
    }

    composer.render( dt );
    if ( camMoved || state.labels !== labelsWere ) { labelsWere = state.labels; updateLabels(); }      // DOM labels only when the view changed

    const realDt = Math.max( 0.0001, now0 - ( perf._p || now0 ) ) / 1000; perf._p = now0;
    fpsT += realDt; fpsN++;
    if ( fpsT > 0.5 ) { $( 'hud' ).textContent = Math.round( fpsN / fpsT ) + ' fps' + ( resStep ? ' · ' + Math.round( curPR / PR * 100 ) + '%' : '' ); fpsT = 0; fpsN = 0; }

    // adaptive resolution: only reacts when the chosen FPS is being missed (target = display limit when "Max")
    if ( perf.adaptive && !DEV )
    {
      const budget = Math.max( perf.fps > 0 ? 1000 / perf.fps : 0, perf.minRaf );      // can't ask more than the screen can show
      perf.ft += realDt * 1000; perf.ftN++;
      if ( perf.ftN >= 30 )
      {
        const avg = perf.ft / perf.ftN; perf.ft = 0; perf.ftN = 0;
        if ( avg > budget * 1.18 && resStep < RES_STEPS.length - 1 ) { perf.okT = 0; perf.lock++; setResStep( resStep + 1 ); }
        else if ( avg < budget * 1.05 && resStep > 0 ) { perf.okT++; if ( perf.okT >= 6 + perf.lock * 4 ) setResStep( resStep - 1 ); }
        else perf.okT = 0;
      }
    }
  }

  // Reveal once the first frames are compiled
  frame();
  setTimeout( () => $( 'loading' ).classList.add( 'done' ), 500 );

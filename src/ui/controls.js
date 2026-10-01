  /* =====================================================================
   *  12. UI WIRING
   * ===================================================================== */
  const _stubEls = {};      // optional HUD nodes (study timer etc.) may be absent from a page: hand back a detached stub instead of null
  const $ = id => document.getElementById( id ) || _stubEls[ id ] || ( _stubEls[ id ] = ( () => { const p = document.createElement( 'div' ), e = document.createElement( 'div' ); p.appendChild( e ); return e; } )() );
  const fmtHour = h => { const hh = Math.floor( h ) % 24, mm = Math.floor( ( h % 1 ) * 60 ); return String( hh ).padStart( 2, '0' ) + ':' + String( mm ).padStart( 2, '0' ); };
  function updateWindFromState ()
  {
    const a = state.windAngle * Math.PI / 180;
    WU.uWindDir.value.set( Math.sin( a ), -Math.cos( a ) );            // 0° = blowing toward -Z (away from camera), clockwise
    WU.uWindSpeed.value = state.windSpeed; WU.uWindGust.value = state.gust;
    driftVec.copy( WU.uWindDir.value );
    $( 'compassNeedle' ).style.transform = 'rotate(' + state.windAngle + 'deg)';
  }
  function bindRange ( id, outId, key, fmt, cb )
  {
    const el = $( id ), out = $( outId );
    const apply = () => { state[ key ] = parseFloat( el.value ); out.textContent = fmt( state[ key ] ); if ( cb ) cb(); };
    el.addEventListener( 'input', apply ); apply();
  }
  bindRange( 'wSpeed', 'oSpeed', 'windSpeed', v => v + ' m/s', updateWindFromState );
  bindRange( 'wDir', 'oDir', 'windAngle', v => v + '°', updateWindFromState );
  bindRange( 'wGust', 'oGust', 'gust', v => v.toFixed( 1 ), updateWindFromState );
  bindRange( 'tHour', 'oHour', 'hour', fmtHour );
  bindRange( 'rDof', 'oDof', 'dof', v => v.toFixed( 1 ) );
  bindRange( 'rExp', 'oExp', 'exposure', v => v.toFixed( 2 ) );
  [ [ 'cLapse', 'lapse' ], [ 'cPetals', 'petals' ], [ 'cOrbit', 'orbit' ], [ 'cLabels', 'labels' ], [ 'cShadow', 'shadows' ] ].forEach( ( [ id, key ] ) =>
  {
    const el = $( id ); el.addEventListener( 'change', () => { state[ key ] = el.checked; if ( key === 'orbit' ) controls.autoRotate = el.checked; if ( key === 'labels' ) labelEls.forEach( l => l.style.display = el.checked ? '' : 'none' ); } );
  } );
  $( 'weatherSeg' ).addEventListener( 'click', ev =>
  {
    const b = ev.target.closest( 'button' ); if ( !b ) return;
    state.weather = b.dataset.w;
    [ ...$( 'weatherSeg' ).children ].forEach( x => x.classList.toggle( 'on', x === b ) );
  } );
  $( 'collapse' ).addEventListener( 'click', () =>
  {
    const p = $( 'panel' ), c = p.classList.toggle( 'collapsed' );
    $( 'collapse' ).textContent = DEV ? ( c ? 'Scene settings' : 'Hide settings' ) : ( c ? 'Show' : 'Hide' ); $( 'collapse' ).setAttribute( 'aria-expanded', String( !c ) );
  } );
  if ( window.innerWidth < 560 ) $( 'collapse' ).click();

  const labelTargets = [
    { name: 'Highcrown Castle', x: CASTLE.x, z: CASTLE.z, H: 62 }, { name: 'Stonebrook Lower City', x: CASTLE.x + 4, z: CASTLE.z + 32, H: 16 },
    { name: 'Whispering Grove', x: FV.x, z: FV.z, H: 30 }, { name: 'Riverbank Village', x: 12, z: 62, H: 14 }, { name: 'Elderwood Enclave', x: 104, z: -74, H: 34 },
    { name: 'Windmill Hill', x: HILLS[ 0 ].x, z: HILLS[ 0 ].z, H: 26 }, { name: 'Millbrook Farms', x: HAMLETS[ 1 ].x, z: HAMLETS[ 1 ].z, H: 14 }, { name: 'Old Mill', x: 12.6, z: 40, H: 16 }
  ].map( t => Object.assign( t, { y: terrainHeight( t.x, t.z ) } ) );
  const labelEls = labelTargets.map( h => { const d = document.createElement( 'div' ); d.className = 'label'; d.textContent = h.name; document.body.appendChild( d ); return d; } );
  const tmpV = new T.Vector3();
  const VIEWS = { all: [ 0, 4, -6, 150, 121, 146 ], castle: [ CASTLE.x + 10, 16, CASTLE.z + 8, 44, 36, 44 ], bridge: [ stoneX, 3, 62, 34, 22, 34 ], forest: [ FV.x + 2, 8, FV.z - 4, 38, 30, 36 ], mill: [ HILLS[ 0 ].x, HILLS[ 0 ].z > 0 ? 14 : 14, HILLS[ 0 ].z, 40, 22, 40 ], farm: [ HAMLETS[ 1 ].x, 3, HAMLETS[ 1 ].z, 46, 34, 46 ] };
  $( 'viewSeg' ).addEventListener( 'click', ( e ) => { const v = VIEWS[ e.target.dataset.v ]; if ( !v ) return; controls.target.set( v[ 0 ], v[ 1 ], v[ 2 ] ); camera.position.set( v[ 0 ] + v[ 3 ], v[ 1 ] + v[ 4 ], v[ 2 ] + v[ 5 ] ); controls.update(); } );
  function updateLabels ()
  {
    if ( !state.labels ) return;
    const w = window.innerWidth, hgt = window.innerHeight;
    labelTargets.forEach( ( h, i ) =>
    {
      tmpV.set( h.x, h.y + h.H, h.z ).project( camera );
      const vis = tmpV.z < 1 && tmpV.z > -1;
      labelEls[ i ].style.opacity = vis ? '1' : '0';
      labelEls[ i ].style.transform = `translate(${ ( tmpV.x * 0.5 + 0.5 ) * w }px, ${ ( -tmpV.y * 0.5 + 0.5 ) * hgt }px) translate(-50%,-50%)`;
    } );
  }

  function applyPR ( pr )      // (re)size canvas + post-processing for a pixel ratio
  {
    curPR = pr;
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio( pr );
    renderer.setSize( w, h, false );
    composer.setPixelRatio( pr );
    composer.setSize( w, h );
    camera.aspect = w / h; camera.updateProjectionMatrix();
    bokeh.uniforms[ 'aspect' ].value = camera.aspect;
    const scale = renderer.domElement.height / ( 2 * Math.tan( camera.fov * Math.PI / 360 ) );
    pointSystems.forEach( s => { s.u.uScale.value = scale; } );
  }
  function resize () { applyPR( curPR ); }
  window.addEventListener( 'resize', resize );
  resize();

  // Depth pre-pass for the bokeh must ignore sky + particles (they'd pollute the depth buffer)
  const bokehRender = bokeh.render.bind( bokeh );
  bokeh.render = function ()
  {
    particleGroup.visible = false; sky.visible = false;
    bokehRender.apply( null, arguments );
    particleGroup.visible = true; sky.visible = true;
  };


  const ptrs = new Set();
  canvas.addEventListener( 'pointerdown', e => { ptrs.add( e.pointerId ); if ( ptrs.size > 1 ) multi = true; down = { x: e.clientX, y: e.clientY, t: performance.now(), b: e.button }; } );
  canvas.addEventListener( 'pointercancel', e => { ptrs.delete( e.pointerId ); if ( !ptrs.size ) multi = false; down = null; } );
  canvas.addEventListener( 'pointerup', e =>
  {
    ptrs.delete( e.pointerId ); const wasMulti = multi; if ( !ptrs.size ) multi = false;
    const d = down; down = null; if ( !d || d.b !== 0 || wasMulti ) return;
    if ( Math.hypot( e.clientX - d.x, e.clientY - d.y ) > 6 || performance.now() - d.t > 500 ) return;      // drags orbit, taps plant
    tryPlant( e.clientX, e.clientY );
  } );
  canvas.addEventListener( 'pointermove', e => { hover = e.pointerType === 'mouse' && !e.buttons ? { x: e.clientX, y: e.clientY } : null; } );
  canvas.addEventListener( 'pointerleave', () => { hover = null; } );
  const marker = new T.Mesh( new T.RingGeometry( 1.1, 1.5, 40 ).rotateX( -Math.PI / 2 ), new T.MeshBasicMaterial( { color: C( '#7fd19a' ), transparent: true, opacity: 0.9, depthWrite: false, fog: false, side: T.DoubleSide } ) );
  marker.visible = false; marker.renderOrder = 8; scene.add( marker );
  $( 'speciesSeg' ).addEventListener( 'click', ev => { const b = ev.target.closest( 'button' ); if ( !b ) return; species = b.dataset.s;[ ...$( 'speciesSeg' ).children ].forEach( x => x.classList.toggle( 'on', x === b ) ); } );
  const debugControl = $( 'cDebug' );
  if ( debugControl ) debugControl.addEventListener( 'change', ev => { debugFreePlanting = ev.target.checked; renderStudyTimer(); say( debugFreePlanting ? 'Dev mode: free planting' : 'Planting points required' ); } );

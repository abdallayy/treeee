    function pulse ( x, z, r ) { pulseT = performance.now(); pulseX = x; pulseZ = z; pulseR = r; pulseRing.color( 0x6cf2c2 ); }
    function tickPulse ( now ) { if ( !pulseT ) return; const k = ( now - pulseT ) / 480; if ( k >= 1 ) { pulseT = 0; pulseRing.show( false ); return; } pulseRing.set( pulseX, pulseZ, pulseR * ( 0.7 + 0.9 * k ) ); pulseRing.mesh.material.opacity = 0.9 * ( 1 - k ); pulseRing.show( true ); }
    function resolveSel ()
    {
      const m = new Map(); liveCatalog().forEach( e => m.set( e.id, e ) ); selEntries = []; selIds.forEach( id => { const e = m.get( id ); if ( e ) selEntries.push( e ); } );
      selected = selEntries.length === 1 ? selEntries[ 0 ] : null;
      if ( selEntries.length )
      {
        let cx = 0, cz = 0; selEntries.forEach( e => { cx += e.x; cz += e.z; } ); cx /= selEntries.length; cz /= selEntries.length;
        let r = 0; selEntries.forEach( e => { r = Math.max( r, Math.hypot( e.x - cx, e.z - cz ) + e.r ); } ); selAnchor = { x: cx, z: cz, r };
      }
    }
    function refreshSelUI ()
    {
      resolveSel(); const n = selEntries.length, c = $( 'devChip' );
      if ( n === 1 ) highlight( selected ); else selRing.show( false ); $( 'devChipEdit' ).style.display = n === 1 ? '' : 'none';
      for ( let i = 0; i < selPool.length || i < n; i++ )
      {
        if ( n < 2 || i >= n || i >= 160 ) { if ( selPool[ i ] ) selPool[ i ].show( false ); continue; }
        const r = selPool[ i ] || ( selPool[ i ] = new TerrainRing( 0xffd66b, 0.8 ) ); r.color( 0xffd66b ); r.set( selEntries[ i ].x, selEntries[ i ].z, selEntries[ i ].r ); r.show( true );
      }
      if ( !n ) { c.hidden = true; return; }
      $( 'devChipName' ).textContent = n === 1 ? labelOf( selected.type ) : n + ' objects'; c.hidden = false;
    }
    function select ( it ) { selIds.clear(); if ( it ) selIds.add( it.id ); refreshSelUI(); }
    function setSel ( ids ) { selIds.clear(); ids.forEach( id => selIds.add( id ) ); refreshSelUI(); }
    function toggleSel ( it ) { if ( selIds.has( it.id ) ) selIds.delete( it.id ); else selIds.add( it.id ); refreshSelUI(); }
    function pruneSel () { const ok = new Set( MAPD.added.map( o => o.id ) ); wg.catalog.forEach( e => { if ( !e.added && mergedVis.get( e.id ) !== false ) ok.add( e.id ); } ); selIds.forEach( id => { if ( !ok.has( id ) ) selIds.delete( id ); } ); }
    function updateChip ()
    {
      if ( !selEntries.length ) return; const c = $( 'devChip' ), a = selEntries.length === 1 ? selEntries[ 0 ] : selAnchor;
      _v.set( a.x, hGrid( a.x, a.z ) + Math.min( 9 + a.r * 0.5, 40 ), a.z ).project( camera );
      if ( _v.z > 1 ) { c.style.opacity = 0; return; } c.style.opacity = 1; c.style.transform = 'translate(' + ( ( _v.x * 0.5 + 0.5 ) * innerWidth ).toFixed( 1 ) + 'px,' + ( ( -_v.y * 0.5 + 0.5 ) * innerHeight ).toFixed( 1 ) + 'px) translate(-50%,-115%)';
    }
    function highlight ( it ) { if ( it ) { selRing.set( it.x, it.z, it.r ); selRing.show( true ); } else selRing.show( false ); }

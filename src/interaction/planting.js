  const say = t => { $( 'plMsg' ).textContent = t; msgT = performance.now(); };
  const growing = [], ray = new T.Raycaster(), ndc = new T.Vector2(), _up = new T.Vector3( 0, 1, 0 ), _groundPickPoint = new T.Vector3();
  const groundPickCache = { valid: false, x: NaN, y: NaN, width: 0, height: 0, position: new T.Vector3(), quaternion: new T.Quaternion(), hit: null };
  let saved = []; try { saved = JSON.parse( store.get( LS_TREES ) || '[]' ); } catch ( e ) { }
  saved = ( Array.isArray( saved ) ? saved : [] ).filter( r => SPECIES[ r.t ] && isFinite( r.x ) && isFinite( r.z ) && Math.abs( r.x ) < HALF && Math.abs( r.z ) < HALF ).slice( -800 );
  if ( DEV ) saved = [];      // dev never loads / touches user trees
  else
  {       // trees standing inside the hitbox of a NEW building are removed and the point goes back to the user
    const nb = wg.catalog.filter( o => o.added ); let refund = 0;
    saved = saved.filter( r => { const hit = nb.some( o => Math.hypot( r.x - o.x, r.z - o.z ) < o.r + 1.5 ); if ( hit ) refund++; return !hit; } );
    if ( refund ) { studyPoints += refund; saveStudyProgress(); store.set( LS_TREES, JSON.stringify( saved ) ); say( refund + ' tree(s) removed for a new building - point refunded' ); }
  }

  function pickGround ( cx, cy )        // ray-march the same height field the terrain mesh is built from
  {
    camera.updateMatrixWorld( true );
    const c = groundPickCache, width = window.innerWidth, height = window.innerHeight;
    if ( c.valid && c.x === cx && c.y === cy && c.width === width && c.height === height && c.position.equals( camera.position ) && c.quaternion.equals( camera.quaternion ) ) return c.hit;
    c.valid = true; c.x = cx; c.y = cy; c.width = width; c.height = height; c.position.copy( camera.position ); c.quaternion.copy( camera.quaternion );
    ndc.set( cx / width * 2 - 1, -( cy / height ) * 2 + 1 ); ray.setFromCamera( ndc, camera );
    const o = ray.ray.origin, d = ray.ray.direction; let enter = 0, exit = 4000;
    for ( const axis of [ [ o.x, d.x ], [ o.z, d.z ] ] )
    {
      if ( Math.abs( axis[ 1 ] ) < 1e-9 ) { if ( axis[ 0 ] < -HALF || axis[ 0 ] > HALF ) { c.hit = null; return null; } continue; }
      let a = ( -HALF - axis[ 0 ] ) / axis[ 1 ], b = ( HALF - axis[ 0 ] ) / axis[ 1 ]; if ( a > b ) [ a, b ] = [ b, a ];
      enter = Math.max( enter, a ); exit = Math.min( exit, b ); if ( enter > exit ) { c.hit = null; return null; }
    }
    if ( exit < 0 ) { c.hit = null; return null; }
    let t = Math.max( 0, enter ), prev = t;
    for ( let i = 0; i < 4000 && t <= exit; i++ )
    {
      const p = _groundPickPoint.copy( o ).addScaledVector( d, t );
      if ( Math.abs( p.x ) <= HALF && Math.abs( p.z ) <= HALF )
      {
        const h = hGrid( p.x, p.z );
        if ( p.y < h )
        {
          let lo = prev, hi = t;
          for ( let k = 0; k < 12; k++ ) { const m = ( lo + hi ) / 2; p.copy( o ).addScaledVector( d, m ); if ( p.y < hGrid( p.x, p.z ) ) hi = m; else lo = m; }
          c.hit = p.copy( o ).addScaledVector( d, hi ); return c.hit;
        }
        prev = t; t += Math.max( 0.6, ( p.y - h ) * 0.35 );
      }
      else { prev = t; t += 8; }
    }
    c.hit = null; return null;
  }
  function spawnTree ( r, anim )        // trees follow terrain height + slope: base on surface, trunk leans 40% toward the normal
  {
    const y = hGrid( r.x, r.z ), up = _up.clone().lerp( groundNormal( r.x, r.z ), 0.4 ).normalize();
    const q = new T.Quaternion().setFromUnitVectors( Y_AXIS, up ).multiply( new T.Quaternion().setFromAxisAngle( Y_AXIS, r.ry ) );
    const t = plant( r.t, r.x, r.z, anim ? r.s * 0.05 : r.s, r.v, { q, y: y - 0.15 * r.s } );
    if ( anim ) growing.push( { ms: t.meshes, s: r.s, t0: performance.now() } );
  }
  function tryPlant ( cx, cy )
  {
    if ( DEV ) { devClick( cx, cy ); return; }
    if ( !debugFreePlanting && studyPoints < 1 ) { say( 'Study for 4 hours to earn a planting point' ); return; }
    const p = pickGround( cx, cy ); if ( !p ) { say( 'Tap the ground to plant' ); return; }
    if ( riverDist( p.x, p.z ) < 8.5 ) { say( "Can't plant in the river" ); return; }
    if ( wg.catalog.some( o => o.added && Math.hypot( p.x - o.x, p.z - o.z ) < o.r + 1.5 ) ) { say( "Can't plant on a building" ); return; }
    const rec = { t: species, x: +p.x.toFixed( 2 ), z: +p.z.toFixed( 2 ), s: +( 1.15 + Math.random() * 0.5 ).toFixed( 2 ), v: Math.floor( Math.random() * 3 ), ry: +( Math.random() * 6.28 ).toFixed( 2 ) };
    spawnTree( rec, true ); saved.push( rec ); store.set( LS_TREES, JSON.stringify( saved ) );
    if ( !debugFreePlanting ) { studyPoints--; saveStudyProgress(); }
    say( species[ 0 ].toUpperCase() + species.slice( 1 ) + ' planted' );
  }
  saved.forEach( r => spawnTree( r, false ) );

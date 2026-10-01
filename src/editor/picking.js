    /* ---------- picking: real meshes first, then footprint circles ---------- */
    function containing ( list, p, k, margin )
    {
      let best = null; list.forEach( o => { if ( o.type === 'wall' && o.r > 30 ) return; const d = Math.hypot( o.x - p.x, o.z - p.z ); if ( d <= o.r * k + margin && ( !best || o.r < best.r ) ) best = o; } ); return best;
    }
    const HEIGHT = { tudor: 10, cabin: 7, treehouse: 26, castle: 46, windmill: 22, woodenBridge: 5, stoneBridge: 8, watermill: 13, farm: 2.5, farmWheat: 2.5, farmPumpkin: 2.5, farmBerry: 2.5, farmLivestock: 4, wall: 14 };
    function rayCyl ( o, d, cx, cz, R, y0, y1 )      // ray vs. vertical cylinder: O(1) per item, no triangle tests
    {
      const ox = o.x - cx, oz = o.z - cz, a = d.x * d.x + d.z * d.z; if ( a < 1e-9 ) return Infinity;
      const b = ox * d.x + oz * d.z, c = ox * ox + oz * oz - R * R, disc = b * b - a * c; if ( disc < 0 ) return Infinity;
      const q = Math.sqrt( disc ), t1 = ( -b - q ) / a, t2 = ( -b + q ) / a; if ( t2 < 0 ) return Infinity;
      const tin = Math.max( t1, 0 ), yin = o.y + d.y * tin;
      if ( yin >= y0 && yin <= y1 ) return tin;
      if ( yin > y1 && d.y < 0 ) { const tt = ( y1 - o.y ) / d.y; if ( tt >= tin && tt <= t2 ) return tt; }
      if ( yin < y0 && d.y > 0 ) { const tt = ( y0 - o.y ) / d.y; if ( tt >= tin && tt <= t2 ) return tt; }
      return Infinity;
    }
    function pickAt ( cx, cy )
    {
      const ground = pickGround( cx, cy ), live = liveCatalog(), o = ray.ray.origin, d = ray.ray.direction, gd = ground ? ground.distanceTo( o ) : Infinity; let item = null, bt = Infinity;
      for ( const it of live )
      {
        if ( it.type === 'wall' && it.r > 30 ) { if ( ground && Math.abs( Math.hypot( ground.x - it.x, ground.z - it.z ) - 39.5 ) < 3.2 && gd < bt ) { item = it; bt = gd; } continue; }
        const tree = TREE_DEFS[ it.type ], R = Math.max( 1.1, it.r * ( tree ? 0.55 : 0.72 ) ), H = tree ? it.r * 5.6 : ( HEIGHT[ it.type ] || 10 ) * clamp( it.r / ( FOOT[ it.type ] || it.r ), 0.25, 6 );
        const gy = hGrid( it.x, it.z ) + ( it.dy || 0 ), t = rayCyl( o, d, it.x, it.z, R, gy - 3, gy + H );
        if ( t <= gd + R && ( t < bt - 0.01 || ( Math.abs( t - bt ) <= 0.01 && item && it.r < item.r ) ) ) { item = it; bt = t; }
      }
      if ( !item && ground ) item = containing( live, ground, 0.55, 0 );
      return { ground, item };
    }
    function openContextAt ( x, y )
    {
      if ( sess ) { toast( 'Finish the current placement first: Enter to confirm, Esc to cancel.' ); return; }
      if ( gs ) { toast( 'Place or cancel the group move first (Enter / Esc).' ); return; }
      if ( modalOpen ) return; const p = pickAt( x, y ); if ( selEntries.length > 1 && p.item && selIds.has( p.item.id ) ) p.multi = true; openMenu( x, y, p );
    }

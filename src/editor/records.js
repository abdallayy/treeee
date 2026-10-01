    const FOOT = { tudor: 4.3, cabin: 5, treehouse: 7, castle: 22, windmill: 8, woodenBridge: 14, stoneBridge: 15, watermill: 9, farm: 13.8, farmWheat: 13.8, farmPumpkin: 13.8, farmBerry: 13.8, farmLivestock: 13.8, wall: 6 };
    const footR = ( type, sc ) => TREE_DEFS[ type ] ? ( TREE_DEFS[ type ].sp === 'pine' ? 2.6 : TREE_DEFS[ type ].sp === 'fantasy' ? 2.2 : 2.0 ) * TREE_DEFS[ type ].s * sc : ( FOOT[ type ] || 5 ) * sc;

    /* ---------- the record a session describes == the record the map stores ----------
     *  Ghost, thumbnail and placed object are all produced by buildAsset() from this same record: no proxies, no stand-ins. */
    const RIGID = { castle: 1, wall: 1, windmill: 1, watermill: 1, woodenBridge: 1, stoneBridge: 1 };      // static colours + rigid: built once per session, then moved with a transform
    const newId = () => 'n' + Date.now().toString( 36 ) + Math.random().toString( 36 ).slice( 2, 5 );
    const sessItem = s =>
    {
      const it = { id: s.id, type: s.type, x: rd( s.x, 2 ), z: rd( s.z, 2 ), yaw: rd( s.yaw, 2 ), scale: rd( s.scale, 2 ), rx: rd( s.rx, 4 ), ry: rd( s.ry, 4 ), rz: rd( s.rz, 4 ), sx: rd( s.sx, 3 ), sy: rd( s.sy, 3 ), sz: rd( s.sz, 3 ), v: s.v || 0 };
      [ 'wd', 'dp', 'h', 'kind' ].forEach( k => { if ( s[ k ] !== undefined ) it[ k ] = s[ k ]; } ); if ( s.dy ) it.dy = rd( s.dy, 2 ); if ( s.from ) it.from = s.from; return it;
    };

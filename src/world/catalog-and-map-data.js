  /* ---- Map data: base map is code, edits come from map-data.js (written by dev.html) ---- */
  const DEV = window.DEV_MODE === true, DRAFT_KEY = 'twoRealms.dev.draft';
  // To add a new placeable model: add an entry here + a builder in `build` inside buildWorld().
  // Placeable trees: standard / large / giant versions of every species (scale is relative to the species' native size)
  const TREE_DEFS = {};
  [ [ 'oak', 'Oak' ], [ 'pine', 'Pine' ], [ 'sakura', 'Sakura' ], [ 'fantasy', 'Fantasy' ] ].forEach( ( [ sp, nm ] ) =>
    [ [ 'Tree', 1.5, nm + ' tree', false ], [ 'Large', 3, 'Large ' + nm.toLowerCase(), true ], [ 'Giant', 5, 'Giant ' + nm.toLowerCase(), true ] ].forEach( ( [ k, sc, label, big ] ) => { TREE_DEFS[ sp + k ] = { sp, s: sc, label, big }; } ) );
  const CATALOG_TYPES = { tudor: 'House', cabin: 'Cabin', treehouse: 'Treehouse', castle: 'Castle', windmill: 'Windmill', woodenBridge: 'Wooden bridge', stoneBridge: 'Stone bridge', watermill: 'Watermill', farm: 'Farm plot', wall: 'Castle wall' };
  const TYPE_LABEL = { tudor: 'Tudor house', cabin: 'Log cabin', treehouse: 'Treehouse', castle: 'Castle', windmill: 'Windmill', woodenBridge: 'Wooden bridge', stoneBridge: 'Stone bridge', watermill: 'Watermill', farm: 'Farm plot', wall: 'Castle wall' };
  const TYPE_CATEGORIES = { tudor: 'homes', cabin: 'homes', treehouse: 'homes', castle: 'castles', wall: 'walls', woodenBridge: 'bridges', stoneBridge: 'bridges', windmill: 'mills', watermill: 'mills', farm: 'farms' };
  // Farm variants: every one is a single assembly (ground + fence + crops/cattle + scarecrow/decor) built by buildFarm() from one record
  const FARM_CROPS = { farmWheat: 'wheat', farmPumpkin: 'pumpkin', farmBerry: 'berry', farmLivestock: 'livestock' };   // 'farm' itself = vegetable rows (carrot / leafy)
  [ [ 'farm', 'Vegetable farm' ], [ 'farmWheat', 'Wheat farm' ], [ 'farmPumpkin', 'Pumpkin & squash patch' ], [ 'farmBerry', 'Berry garden' ], [ 'farmLivestock', 'Cattle pen' ] ]
    .forEach( ( [ k, label ] ) => { CATALOG_TYPES[ k ] = TYPE_LABEL[ k ] = label; TYPE_CATEGORIES[ k ] = 'farms'; } );
  Object.keys( TREE_DEFS ).forEach( k => { CATALOG_TYPES[ k ] = TYPE_LABEL[ k ] = TREE_DEFS[ k ].label; TYPE_CATEGORIES[ k ] = 'trees'; } );
  let MAPD = window.MAP_DATA || {};
  if ( DEV ) { try { const d = JSON.parse( localStorage.getItem( DRAFT_KEY ) ); if ( d && d.added ) MAPD = d; } catch ( e ) { } }
  MAPD = { version: MAPD.version || 0, removed: [ ...( MAPD.removed || [] ) ].filter( id => typeof id === 'string' ).map( id => { const p = id.match( /^(.+)@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/ ); return p ? p[ 1 ] + '@' + Number( p[ 2 ] ).toFixed( 2 ) + ',' + Number( p[ 3 ] ).toFixed( 2 ) : id; } ), added: ( MAPD.added || [] ).map( o => ( { ...o } ) ) };

    const GRID = 1, ABS_Y = { woodenBridge: true };         // woodenBridge is built at absolute y = 0 (water level)
    const CATEGORY_TABS = [ [ 'all', 'All' ], [ 'homes', 'Houses' ], [ 'castles', 'Castles' ], [ 'walls', 'Walls' ], [ 'bridges', 'Bridges' ], [ 'mills', 'Mills' ], [ 'farms', 'Farms' ], [ 'trees', 'Trees' ] ];
    const rd = ( v, n ) => +v.toFixed( n );
    const esc = s => String( s ).replace( /[&<>"']/g, c => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ] ) );
    const labelOf = type => TYPE_LABEL[ type ] || type;
    const baseY = ( type, x, z ) => ABS_Y[ type ] ? 0 : terrainHeight( x, z ) + ( /^farm/.test( type ) ? 0.12 : 0 );
    const liveCatalog = () => { const out = []; wg.catalog.forEach( e => { if ( mergedVis.get( e.id ) !== false ) out.push( e ); } ); standalone.forEach( v => out.push( v.entry ) ); return out; };
    const mergedVis = new Map(), loadJSON = new Map(), standalone = new Map(), pending = new Map(), hiddenBase = new Map(), dirtyAttr = new Map(), undoS = [], redoS = [], _v = new T.Vector3();
    MAPD.added.forEach( o => loadJSON.set( o.id, JSON.stringify( o ) ) );
    const selIds = new Set(); let selEntries = [], selAnchor = { x: 0, z: 0, r: 4 }, selTool = false, lastMod = false, gs = null, mq = null; const buildQ = [], queued = new Set(), selPool = [];
    let selected = null, pulseT = 0, pulseR = 0, pulseX = 0, pulseZ = 0, saveT = 0, camKey = 0;
    let sess = null, lastPtr = 'mouse', devTickN = 0, menuOpen = false, modalOpen = false, ctxGround = null, toastT = 0;

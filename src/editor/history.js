    const snap = () => JSON.stringify( { a: MAPD.added, r: MAPD.removed } );
    const loadSnap = t => { const d = JSON.parse( t ); MAPD.added = d.a; MAPD.removed = d.r; };
    const pushUndo = t => { undoS.push( t ); if ( undoS.length > 100 ) undoS.shift(); redoS.length = 0; };
    function doUndo () { if ( sess || gs || !undoS.length ) return; redoS.push( snap() ); loadSnap( undoS.pop() ); devApply(); toast( 'Undone' ); }
    function doRedo () { if ( sess || gs || !redoS.length ) return; undoS.push( snap() ); loadSnap( redoS.pop() ); devApply(); toast( 'Redone' ); }

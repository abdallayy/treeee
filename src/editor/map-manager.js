    /* ---------- map manager drawer (placed items, restore, reset, export) ---------- */
    const contents = $( 'devContents' );
    function renderPlaced ()
    {
      const q = $( 'devFilter' ).value.trim().toLocaleLowerCase();
      const items = liveCatalog().filter( it => labelOf( it.type ).toLocaleLowerCase().includes( q ) );
      contents.innerHTML = items.map( it => '<div class="dev-existing-row"><span class="dev-existing-name">' + esc( labelOf( it.type ) ) + ' · ' + it.x.toFixed( 1 ) + ', ' + it.z.toFixed( 1 ) + ( it.added ? ' <em>new</em>' : '' ) + '</span>'
        + '<span class="dev-row-btns"><button type="button" data-locate="' + encodeURIComponent( it.id ) + '">Go to</button><button type="button" data-rmove="' + encodeURIComponent( it.id ) + '">Move</button><button type="button" data-remove="' + encodeURIComponent( it.id ) + '">Delete</button></span></div>' ).join( '' )
        || '<p class="dev-empty">No matching items</p>';
    }
    contents.onclick = e =>
    {
      const b = e.target.closest( '[data-locate],[data-rmove],[data-remove]' ); if ( !b ) return;
      const id = decodeURIComponent( b.dataset.locate || b.dataset.rmove || b.dataset.remove ), it = liveCatalog().find( o => o.id === id ); if ( !it ) return;
      if ( b.dataset.locate ) { focusItem( it ); highlight( it ); setTimeout( () => { if ( !menuOpen ) highlight( null ); }, 1800 ); }
      else if ( b.dataset.rmove ) { $( 'devLibrary' ).classList.remove( 'open' ); focusOn( it.x, it.z, it.r ); beginMove( it ); }
      else deleteItem( it );
    };
    $( 'devOpen' ).onclick = () => { $( 'devLibrary' ).classList.toggle( 'open' ); devStatus(); renderPlaced(); };
    $( 'devClose' ).onclick = () => $( 'devLibrary' ).classList.remove( 'open' );
    $( 'devFilter' ).oninput = renderPlaced;
    $( 'devRestore' ).onclick = () => { pushUndo( snap() ); const moved = new Set( MAPD.added.map( o => o.from ).filter( Boolean ) ); MAPD.removed = MAPD.removed.filter( id => moved.has( id ) ); devApply(); };
    $( 'devReset' ).onclick = () => { try { localStorage.removeItem( DRAFT_KEY ); } catch ( e ) { } location.reload(); };
    $( 'devExp' ).onclick = devExport;

    /* ---------- add modal ---------- */
    let activeCat = 'all';
    function renderGrid ()
    {
      const q = $( 'devSearch' ).value.trim().toLocaleLowerCase();
      const types = Object.keys( CATALOG_TYPES ).filter( t => ( activeCat === 'all' || TYPE_CATEGORIES[ t ] === activeCat ) && labelOf( t ).toLocaleLowerCase().includes( q ) );
      $( 'devGrid' ).innerHTML = types.map( t => '<button type="button" class="dev-item" data-type="' + t + '"><img alt="" width="360" height="240" data-type="' + t + '"' + ( previewCache[ t ] ? ' src="' + previewCache[ t ] + '"' : '' ) + '><span class="dev-item-name">' + esc( labelOf( t ) ) + '</span>'
        + ( TREE_DEFS[ t ] && TREE_DEFS[ t ].big ? '<span class="dev-badge">' + ( TREE_DEFS[ t ].s >= 5 ? 'Giant' : 'Large' ) + '</span>' : '' ) + '</button>' ).join( '' ) || '<p class="dev-empty">Nothing matches your search.</p>'; queueThumbs();
    }
    function openModal () { modalOpen = true; $( 'devModal' ).hidden = false; $( 'devSearch' ).value = ''; renderGrid(); $( 'devSearch' ).focus(); }
    function closeModal () { if ( !modalOpen ) return; modalOpen = false; $( 'devModal' ).hidden = true; }
    $( 'devModalClose' ).onclick = closeModal;
    $( 'devModal' ).addEventListener( 'pointerdown', e => { if ( e.target === $( 'devModal' ) ) closeModal(); } );
    $( 'devSearch' ).oninput = renderGrid;
    $( 'devCats' ).onclick = e => { const b = e.target.closest( '[data-cat]' ); if ( !b ) return; activeCat = b.dataset.cat; $( 'devCats' ).querySelectorAll( 'button' ).forEach( x => x.setAttribute( 'aria-pressed', String( x === b ) ) ); renderGrid(); };
    $( 'devGrid' ).onclick = e =>
    {
      const b = e.target.closest( '[data-type]' ); if ( !b ) return; const at = ctxGround || { x: controls.target.x, z: controls.target.z };
      closeModal(); beginPlace( b.dataset.type, at );
    };

    /* ---------- context menu ---------- */
    function closeMenu () { if ( !menuOpen ) return; menuOpen = false; $( 'devCtx' ).hidden = true; highlight( selected ); }
    function openMenu ( x, y, pick )
    {
      closeMenu(); const m = $( 'devCtx' );
      if ( pick.multi ) m.innerHTML = '<div class="dev-ctx-head">' + selEntries.length + ' objects</div><button type="button" role="menuitem" data-act="focus">' + ICON.focus + 'Focus<kbd>F</kbd></button><button type="button" role="menuitem" data-act="move">' + ICON.move + 'Move together<kbd>M</kbd></button><button type="button" role="menuitem" data-act="delete" class="danger">' + ICON.del + 'Delete all<kbd>Del</kbd></button>';
      else if ( pick.item ) m.innerHTML = '<div class="dev-ctx-head">' + esc( labelOf( pick.item.type ) ) + '</div><button type="button" role="menuitem" data-act="focus">' + ICON.focus + 'Focus<kbd>F</kbd></button><button type="button" role="menuitem" data-act="move">' + ICON.move + 'Move<kbd>M</kbd></button><button type="button" role="menuitem" data-act="edit">' + ICON.move + 'Edit…<kbd>E</kbd></button><button type="button" role="menuitem" data-act="delete" class="danger">' + ICON.del + 'Delete<kbd>Del</kbd></button>';
      else if ( pick.ground ) m.innerHTML = '<button type="button" role="menuitem" data-act="add">' + ICON.add + 'Add…</button><button type="button" role="menuitem" data-act="focusg">' + ICON.focus + 'Focus here<kbd>F</kbd></button>';
      else return;
      ctxPick = { item: pick.item, multi: !!pick.multi, ground: pick.ground ? pick.ground.clone() : null }; ctxGround = ctxPick.ground; highlight( pick.multi ? null : pick.item );
      m.hidden = false; menuOpen = true; const r = m.getBoundingClientRect();
      m.style.left = Math.max( 8, Math.min( x, window.innerWidth - r.width - 8 ) ) + 'px'; m.style.top = Math.max( 8, Math.min( y, window.innerHeight - r.height - 8 ) ) + 'px';
      const first = m.querySelector( 'button' ); if ( first ) first.focus( { preventScroll: true } );
    }
    let ctxPick = null;
    $( 'devCtx' ).addEventListener( 'click', e =>
    {
      const b = e.target.closest( '[data-act]' ); if ( !b || !ctxPick ) return; const pick = ctxPick; closeMenu();
      if ( pick.multi ) { if ( b.dataset.act === 'focus' ) focusSelection(); else if ( b.dataset.act === 'move' ) beginMoveSel(); else if ( b.dataset.act === 'delete' ) deleteSel(); return; }
      if ( b.dataset.act === 'add' ) openModal(); else if ( b.dataset.act === 'focus' ) focusItem( pick.item ); else if ( b.dataset.act === 'focusg' ) focusOn( pick.ground.x, pick.ground.z, 0 ); else if ( b.dataset.act === 'move' ) beginMoveSel( [ pick.item ] ); else if ( b.dataset.act === 'edit' ) beginMove( pick.item ); else if ( b.dataset.act === 'delete' ) deleteItem( pick.item );
    } );
    $( 'devCtx' ).addEventListener( 'keydown', e =>
    {
      if ( e.key !== 'ArrowDown' && e.key !== 'ArrowUp' ) return; e.preventDefault();
      const btns = [ ...$( 'devCtx' ).querySelectorAll( 'button' ) ], i = btns.indexOf( document.activeElement ); btns[ ( i + ( e.key === 'ArrowDown' ? 1 : -1 ) + btns.length ) % btns.length ].focus();
    } );

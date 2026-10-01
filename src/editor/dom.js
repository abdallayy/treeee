    /* ---------- DOM ---------- */
    const ICON = {
      move: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>',
      del: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
      add: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
      rotate: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/></svg>',
      scale: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M4 4l6 6M20 4l-6 6M20 20l-6-6M4 20l6-6"/></svg>',
      focus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
      reset: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/></svg>'
    };
    const fieldHTML = ( field, label, min, max, step ) => '<div class="dev-axis-row"><label for="devNumber-' + field + '">' + label + '</label><input id="devRange-' + field + '" data-transform="' + field + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '"><input id="devNumber-' + field + '" data-transform="' + field + '" type="number" min="' + min + '" max="' + max + '" step="' + step + '"></div>';
    const panelHTML = ( mode, fields ) => '<div class="dev-transform-panel" data-panel="' + mode + '"' + ( mode === 'move' ? '' : ' hidden' ) + '>' + fields.join( '' ) + '</div>';
    /* editor CSS: see editor.css (injected by the loader) */
    const editor = document.createElement( 'div' );
    editor.innerHTML =
      '<div id="devToolbar"><span class="dev-tip">Click select · Shift+drag box · F focus · M move · E edit</span><button id="devSelect" type="button" aria-pressed="false" title="Box select (S) - or hold Shift and drag">Select</button><button id="devUndo" type="button" title="Undo (Ctrl+Z)" aria-label="Undo">↶</button><button id="devRedo" type="button" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">↷</button><button id="devOpen" type="button">Map manager</button></div>'
      + '<div id="devHoverTip" hidden></div><div id="devMarquee" hidden style="position:fixed;left:0;top:0;z-index:44;pointer-events:none;border:2px dashed #6cf2c2;background:rgba(108,242,194,.16);border-radius:4px"></div>'
      + '<div id="devGroupBar" hidden><b id="devGroupTitle"></b><span class="dev-gb-hint">Drag the X / Y / Z arrows · R rotate · Arrows nudge · Esc cancel</span><button id="devGroupRot" type="button" title="Rotate 15° (R)">⟳</button><button id="devGroupCancel" type="button">Cancel</button><button id="devGroupOk" type="button" class="primary">Place <kbd>Enter</kbd></button></div>'
      + '<div id="devChip" hidden><b id="devChipName"></b><button id="devChipFocus" type="button">Focus <kbd>F</kbd></button><button id="devChipMove" type="button">Move <kbd>M</kbd></button><button id="devChipEdit" type="button">Edit <kbd>E</kbd></button><button id="devChipDel" type="button" class="danger">Delete <kbd>Del</kbd></button></div>'
      + '<div id="devCtx" class="dev-ctx" role="menu" hidden></div>'
      + '<div id="devModal" class="dev-modal" hidden><div class="dev-modal-card" role="dialog" aria-modal="true" aria-labelledby="devModalTitle">'
      + '<header class="dev-modal-head"><div><h2 id="devModalTitle">Add to the map</h2><p>Choose what to build, then aim the hologram and click to place it.</p></div><button id="devModalClose" type="button" aria-label="Close">×</button></header>'
      + '<div class="dev-modal-tools"><input id="devSearch" type="search" placeholder="Search buildings, bridges, trees…" aria-label="Search catalog" autocomplete="off"></div>'
      + '<nav id="devCats" class="dev-cats" aria-label="Categories">' + CATEGORY_TABS.map( ( c, i ) => '<button type="button" data-cat="' + c[ 0 ] + '" aria-pressed="' + ( i === 0 ) + '">' + c[ 1 ] + '</button>' ).join( '' ) + '</nav>'
      + '<div id="devGrid" class="dev-grid"></div></div></div>'
      + '<div id="devBar" class="dev-bar" role="region" aria-label="Placement controls" hidden>'
      + '<div class="dev-bar-top"><strong id="devBarTitle"></strong><span id="devBarHint"></span></div>'
      + '<div class="dev-dock-main"><div id="devTools" class="dev-seg" role="tablist" aria-label="Transform mode"><button type="button" data-tool="move" aria-pressed="true">' + ICON.move + 'Move</button><button type="button" data-tool="rotate" aria-pressed="false">' + ICON.rotate + 'Rotate</button><button type="button" data-tool="scale" aria-pressed="false">' + ICON.scale + 'Scale</button></div>'
      + '<div class="dev-axis-controls">' + panelHTML( 'move', [ fieldHTML( 'x', 'X', -800, 800, 0.1 ), fieldHTML( 'worldY', 'Y', -40, 180, 0.1 ), fieldHTML( 'z', 'Z', -800, 800, 0.1 ) ] )
      + panelHTML( 'rotate', [ fieldHTML( 'rx', 'X°', -180, 180, 0.5 ), fieldHTML( 'ry', 'Y°', -180, 180, 0.5 ), fieldHTML( 'rz', 'Z°', -180, 180, 0.5 ) ] )
      + panelHTML( 'scale', [ fieldHTML( 'sx', 'X', 0.25, 4, 0.01 ), fieldHTML( 'sy', 'Y', 0.25, 4, 0.01 ), fieldHTML( 'sz', 'Z', 0.25, 4, 0.01 ) ] )
      + '<label class="dev-uniform"><input id="devUniform" type="checkbox"> Uniform scale</label></div></div>'
      + '<div class="dev-bar-foot"><label><input id="devSnap" type="checkbox" checked> Snap</label><span><button id="devResetTransforms" type="button" title="Reset transforms">' + ICON.reset + 'Reset</button><button id="devDelete" type="button" title="Delete object">' + ICON.del + 'Delete</button><button id="devCancel" type="button">Cancel</button><button id="devConfirm" type="button" class="primary">Confirm</button></span></div></div>'
      + '<aside id="devLibrary" aria-label="Map manager"><header class="dev-lib-head"><div class="dev-lib-title"><h2>Map manager</h2><button id="devClose" type="button" aria-label="Close">×</button></div>'
      + '<div class="dev-lib-tools"><input id="devFilter" type="search" placeholder="Filter placed items" aria-label="Filter placed items"></div>'
      + '<div id="devSt"></div></header>'
      + '<main id="devContents"></main><footer class="dev-footer"><button id="devRestore" type="button">Restore deleted</button><button id="devReset" type="button">Reset draft</button><button id="devExp" type="button" class="primary" style="grid-column:1/-1">Export map-data.js</button></footer></aside>'
      + '<div id="devToast" role="status" aria-live="polite" hidden></div>';
    document.body.appendChild( editor );
    $( 'devUndo' ).onclick = doUndo; $( 'devRedo' ).onclick = doRedo; $( 'devChipFocus' ).onclick = () => selEntries.length && focusSelection(); $( 'devChipMove' ).onclick = () => beginMoveSel(); $( 'devChipEdit' ).onclick = () => selected && beginMove( selected ); $( 'devChipDel' ).onclick = () => { if ( selEntries.length > 1 ) deleteSel(); else if ( selected ) deleteItem( selected ); };
    $( 'devSelect' ).onclick = () => setSelTool( !selTool ); $( 'devGroupCancel' ).onclick = () => cancelGroup(); $( 'devGroupRot' ).onclick = () => { if ( gs ) { gs.rot += Math.PI / 12; placeGroup(); } }; $( 'devGroupOk' ).onclick = () => confirmGroup();
    $( 'plant' ).style.display = 'none';
    if ( !$( 'panel' ).classList.contains( 'collapsed' ) ) $( 'collapse' ).click();

    function toast ( text, undo ) { const t = $( 'devToast' ); t.textContent = ''; const sp = document.createElement( 'span' ); sp.textContent = text; t.appendChild( sp ); if ( undo ) { const b = document.createElement( 'button' ); b.type = 'button'; b.textContent = 'Undo'; b.onclick = () => { doUndo(); }; t.appendChild( b ); } t.hidden = false; clearTimeout( toastT ); toastT = setTimeout( () => { t.hidden = true; }, undo ? 4200 : 2400 ); }

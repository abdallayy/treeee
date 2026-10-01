/* =============================================================================
 *  src/loader.js - loads the split source files and runs them as ONE program.
 *
 *  Why not <script> per file?  The 3D world, the trees, the buildings and the editor all share one private scope
 *  (terrain functions, scene, camera, selection state...). Plain scripts cannot share a private scope, so this loader
 *  fetches the files listed in manifest.json, in that order, joins them into one function and runs it - exactly the
 *  program world-3d.js used to be, but you edit small files. No build step is needed: edit a file, refresh the page.
 *
 *  - Needs the page to be served over http (e.g. `python -m http.server`, VS Code Live Server); file:// blocks fetching.
 *  - Errors / breakpoints in DevTools point at the real file and line (a source map is generated on the fly).
 *  - `node build.js` writes the same program as a single ../world-3d.js, for pages that still use one <script>.
 * ============================================================================= */
( function ( root )
{
  'use strict';

  /** Join the manifest's parts into one program. read(path) -> text.  withMap adds a source map (browser only). */
  function assemble ( read, manifest, base, withMap )
  {
    const out = [], sections = []; let line = 0;
    const push = ( text, file ) =>
    {
      if ( !text.endsWith( '\n' ) ) text += '\n';
      const n = text.split( '\n' ).length - 1;
      if ( file ) sections.push( { offset: { line, column: 0 }, map: { version: 3, sources: [ base + file ], names: [], mappings: 'AAAA' + ';AACA'.repeat( n - 1 ) } } );
      out.push( text ); line += n;
    };
    push( "window.DEV_MODE = document.body.dataset.devMode === 'true';\n\n( function ()\n{\n" );
    manifest.parts.forEach( p =>
    {
      if ( p === '#dev-begin' )
      {
        push( '  if ( DEV )\n  {\n' );
        push( "    { const st = document.createElement( 'style' ); st.id = 'devStyleV2'; st.textContent = " + JSON.stringify( read( manifest.css ) ) + "; document.head.appendChild( st ); }\n" );
      }
      else if ( p === '#dev-end' ) push( '  }\n\n' );
      else push( read( p ), p );
    } );
    push( '} )();\n' );
    let code = out.join( '' );
    if ( withMap ) code += '//# sourceURL=' + base + 'world-3d.bundle.js\n//# sourceMappingURL=data:application/json;base64,' + btoa( unescape( encodeURIComponent( JSON.stringify( { version: 3, file: 'world-3d.bundle.js', sections } ) ) ) ) + '\n';
    return code;
  }

  if ( typeof module !== 'undefined' && module.exports ) { module.exports = { assemble }; return; }

  // ---- browser ----
  const me = document.currentScript, base = me ? me.src.replace( /[^\/?#]*([?#].*)?$/, '' ) : 'src/', bust = '?v=' + Date.now();
  const read = p =>      // synchronous on purpose: the program must start exactly where the old <script src="world-3d.js"> did
  {
    const x = new XMLHttpRequest(); x.open( 'GET', base + p + bust, false ); x.send();
    if ( x.status !== 200 && x.status !== 0 ) throw new Error( x.status + ' ' + p );
    return x.responseText;
  };
  try
  {
    const code = assemble( read, JSON.parse( read( 'manifest.json' ) ), base, true ), s = document.createElement( 'script' );
    s.text = code; document.head.appendChild( s ); s.remove();
  }
  catch ( err )
  {
    console.error( '[loader] could not load the source files:', err );
    document.body.insertAdjacentHTML( 'beforeend', '<pre style="position:fixed;inset:auto 12px 12px 12px;z-index:99999;margin:0;padding:14px;border-radius:10px;background:#2b0f0f;color:#ffd0c8;font:13px/1.5 monospace;white-space:pre-wrap">Could not load src/ files (' + String( err.message ).replace( /</g, '&lt;' ) + ').\nServe this folder over http (python -m http.server), or use the single-file build: node build.js, then load world-3d.js.</pre>' );
  }
} )( this );

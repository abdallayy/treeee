  /* =====================================================================
   *  8b. GRAPHICS QUALITY PRESETS  (Low / Mid)  -  switchable live, see ui/quality-ui.js
   *
   *  Mid  = the full-quality look (default): native devicePixelRatio, full shadow map, full draw distance, DoF, 4x MSAA.
   *  Low  = performance: pixel ratio <= 1.25, 1024 shadow map over a smaller shadow window, slower shadow refresh,
   *         denser fog + shorter camera / grass distance, no depth-of-field pass, 2x MSAA, adaptive resolution on.
   *  Everything that reads a preset reads the live `Q` binding, so switching never needs a reload.
   * ===================================================================== */
  const isMobile = /Android|iPhone|iPad|Mobi/i.test( navigator.userAgent );
  const MID_PR_CAP = Infinity;      // Mid = full window.devicePixelRatio. On very dense phones (3x+) you may set e.g. 2 here.
  const QUALITY = {
    mid: {
      key: 'mid', label: 'Mid', pr: () => Math.min( window.devicePixelRatio || 1, MID_PR_CAP ),
      shadowMap: isMobile ? 2048 : 4096, shadowHalf: 230, shadowMs: 30,      // same values the game always used
      msaa: 4, dof: true, fogMul: 1, far: 6000, grassDist: 430, adaptive: false
    },
    low: {
      key: 'low', label: 'Low', pr: () => Math.min( window.devicePixelRatio || 1, 1.25 ),
      shadowMap: 1024, shadowHalf: 150, shadowMs: 66,
      msaa: 2, dof: false, fogMul: 1.8, far: 2200, grassDist: 260, adaptive: true
    }
  };
  let qualityKey = 'mid';
  try { const s = localStorage.getItem( 'realmQuality' ); if ( QUALITY[ s ] ) qualityKey = s; } catch ( e ) {}
  let Q = QUALITY[ qualityKey ];      // the live preset

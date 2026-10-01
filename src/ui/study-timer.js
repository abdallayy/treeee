  /* =====================================================================
   *  13. MAIN LOOP
   * ===================================================================== */
  /* ---- Study timer and manual tree planting ---- */
  const STUDY_CYCLE_MS = 4 * 60 * 60 * 1000, LS_STUDY = 'twoRealms.studyTimer', LS_TREES = 'twoRealms.trees';
  const store = { get: k => { try { return localStorage.getItem( k ); } catch ( e ) { return null; } }, set: ( k, v ) => { if ( DEV ) return; try { localStorage.setItem( k, v ); } catch ( e ) { } } };
  let studyRunning = false, studyStartedAt = 0, studyElapsedMs = 0, studyPoints = 0, studyInterval = null;
  let debugFreePlanting = false, species = 'oak', hover = null, down = null, multi = false, msgT = 0, hudT = 0, hoverN = 0;
  const getStudyElapsedMs = now => studyElapsedMs + ( studyRunning ? Math.max( 0, now - studyStartedAt ) : 0 );
  function advanceStudyTimer ( now )
  {
    const elapsedMs = getStudyElapsedMs( now ), earned = Math.floor( elapsedMs / STUDY_CYCLE_MS );
    if ( earned > 0 )
    {
      studyPoints += earned;
      studyElapsedMs = elapsedMs % STUDY_CYCLE_MS;
      if ( studyRunning ) studyStartedAt = now;
    }
    return getStudyElapsedMs( now );
  }
  function persistStudyProgress ( now )
  {
    const elapsedMs = advanceStudyTimer( now );
    studyElapsedMs = elapsedMs;
    if ( studyRunning ) studyStartedAt = now;
    store.set( LS_STUDY, JSON.stringify( { elapsedMs, isRunning: studyRunning, lastSavedAt: now, points: studyPoints } ) );
  }
  function renderStudyTimer ( now = Date.now() )
  {
    const oldPoints = studyPoints, elapsedMs = advanceStudyTimer( now ), totalSec = Math.floor( elapsedMs / 1000 );
    const clock = [ Math.floor( totalSec / 3600 ), Math.floor( totalSec / 60 ) % 60, totalSec % 60 ];
    const progress = Math.min( 100, elapsedMs / STUDY_CYCLE_MS * 100 );
    $( 'plTime' ).textContent = clock.map( v => String( v ).padStart( 2, '0' ) ).join( ':' );
    $( 'plBar' ).style.width = progress + '%';
    $( 'plBar' ).parentElement.setAttribute( 'aria-valuenow', String( Math.floor( progress ) ) );
    $( 'pointsStat' ).textContent = studyPoints;
    $( 'studyToggle' ).textContent = studyRunning ? 'Pause' : 'Start Studying';
    $( 'studyToggle' ).setAttribute( 'aria-pressed', String( studyRunning ) );
    $( 'plant' ).classList.toggle( 'ready', debugFreePlanting || studyPoints > 0 );
    if ( studyPoints !== oldPoints ) persistStudyProgress( now );
  }
  function saveStudyProgress ( now = Date.now() )
  {
    persistStudyProgress( now );
    renderStudyTimer( now );
  }
  function loadStudyProgress ()
  {
    let data = {};
    try { data = JSON.parse( store.get( LS_STUDY ) || '{}' ); } catch ( e ) { }
    const now = Date.now(), savedElapsed = Number( data.elapsedMs ), savedPoints = Number( data.points );
    studyElapsedMs = Number.isFinite( savedElapsed ) ? Math.max( 0, savedElapsed ) : 0;
    studyPoints = Number.isFinite( savedPoints ) ? Math.max( 0, Math.floor( savedPoints ) ) : 0;
    studyRunning = data.isRunning === true;
    if ( studyRunning )
    {
      const lastSavedAt = Number( data.lastSavedAt );
      if ( Number.isFinite( lastSavedAt ) && lastSavedAt > 0 ) studyElapsedMs += Math.max( 0, now - lastSavedAt );
      studyStartedAt = now;
      studyInterval = setInterval( () => renderStudyTimer(), 1000 );
    }
    saveStudyProgress( now );
  }
  function toggleStudyTimer ()
  {
    const now = Date.now();
    advanceStudyTimer( now );
    if ( studyRunning )
    {
      studyElapsedMs = getStudyElapsedMs( now );
      studyRunning = false; studyStartedAt = 0;
      clearInterval( studyInterval ); studyInterval = null;
    } else
    {
      studyRunning = true; studyStartedAt = now;
      studyInterval = setInterval( () => renderStudyTimer(), 1000 );
    }
    saveStudyProgress( now );
  }
  $( 'studyToggle' ).addEventListener( 'click', toggleStudyTimer );
  document.addEventListener( 'visibilitychange', () => saveStudyProgress() );
  window.addEventListener( 'beforeunload', () => saveStudyProgress() );
  loadStudyProgress();

  /* =====================================================================
   *  8. APP STATE
   * ===================================================================== */
  const state = {
    windSpeed: 7, windAngle: 35, gust: 0.7, hour: 16.5, weather: 'clear',
    lapse: false, petals: true, dof: 0.12, exposure: 1.1, orbit: false, labels: true, shadows: true
  };
  const WEATHER = {      // target values per weather preset
    clear: { oc: 0.0, rain: 0, mist: 0, dust: 1.0 },
    rain: { oc: 0.85, rain: 1, mist: 0.15, dust: 0.0 },
    mist: { oc: 0.45, rain: 0, mist: 1, dust: 0.35 }
  };
  const W = { oc: 0, rain: 0, mist: 0, dust: 1 };

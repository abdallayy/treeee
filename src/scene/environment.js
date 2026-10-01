  /* =====================================================================
   *  11. ENVIRONMENT UPDATE (time of day, weather, fog, lights, sky)
   * ===================================================================== */
  const pal = {
    zenDay: C( '#2f6fcf' ), horDay: C( '#bcd8ee' ), zenDusk: C( '#3a4a86' ), horDusk: C( '#ff9a5a' ), zenNight: C( '#050a1c' ), horNight: C( '#10182e' ),
    greyZD: C( '#7e8c9a' ), greyHD: C( '#a9b4bd' ), greyN: C( '#0c1018' ),
    sunLow: C( '#ffa866' ), sunHigh: C( '#fff4e6' ), moon: C( '#9db4ff' ),
    hemiSkyD: C( '#9cc4ff' ), hemiGrD: C( '#6b5a3c' ), hemiSkyN: C( '#1c2a55' ), hemiGrN: C( '#10141e' ),
    cloudDay: C( '#ffffff' ), cloudNight: C( '#1a2236' ), cloudGrey: C( '#8d97a1' )
  };
  const sunDir = new T.Vector3(), lightDir = new T.Vector3(), zen = new T.Color(), hor = new T.Color(), tmpC = new T.Color();
  function updateEnvironment ( dt )
  {
    const tgt = WEATHER[ state.weather ], k = 1 - Math.exp( -dt * 0.8 );
    for ( const key in W ) W[ key ] += ( tgt[ key ] - W[ key ] ) * k;

    const ang = ( state.hour - 6 ) / 12 * Math.PI;
    sunDir.set( Math.cos( ang ), Math.sin( ang ), 0.3 ).normalize();
    const e = sunDir.y;
    const dayF = smoothstep( 0.02, 0.35, e ), duskF = Math.exp( -Math.pow( e / 0.16, 2 ) ) * ( 1 - dayF * 0.3 ), night = 1 - smoothstep( -0.18, 0.05, e );
    zen.copy( pal.zenNight ).lerp( pal.zenDay, dayF ).lerp( pal.zenDusk, duskF * 0.8 );
    hor.copy( pal.horNight ).lerp( pal.horDay, dayF ).lerp( pal.horDusk, duskF * 0.85 );
    const oc = W.oc * 0.9;
    tmpC.copy( pal.greyN ).lerp( pal.greyZD, dayF ); zen.lerp( tmpC, oc );
    tmpC.copy( pal.greyN ).lerp( pal.greyHD, dayF ); hor.lerp( tmpC, oc );
    hor.lerp( tmpC.copy( pal.greyHD ).multiplyScalar( 0.35 + 0.65 * dayF ), W.mist * 0.55 );
    skyUniforms.uZenith.value.copy( zen ); skyUniforms.uHorizon.value.copy( hor );
    skyUniforms.uSunDir.value.copy( sunDir ); skyUniforms.uNight.value = night; skyUniforms.uOvercast.value = W.oc;
    skyUniforms.uSunColor.value.copy( pal.sunLow ).lerp( pal.sunHigh, smoothstep( 0.02, 0.5, e ) );

    scene.fog.color.copy( hor );
    scene.fog.density = 0.0013 + W.rain * 0.0045 + W.mist * 0.017 + W.oc * 0.001;

    const sunI = 3.0 * smoothstep( -0.04, 0.3, e ) * ( 1 - 0.8 * W.oc ), moonI = 0.5 * ( 1 - smoothstep( -0.3, -0.04, e ) ) * ( 1 - 0.5 * W.oc );
    if ( e > -0.05 ) { lightDir.copy( sunDir ); sun.intensity = sunI; sun.color.copy( skyUniforms.uSunColor.value ); }
    else { lightDir.set( -sunDir.x, -sunDir.y, sunDir.z ); sun.intensity = moonI; sun.color.copy( pal.moon ); }
    sun.position.copy( shadowCenter ).addScaledVector( lightDir, 320 );
    sun.castShadow = state.shadows;

    hemi.color.copy( pal.hemiSkyN ).lerp( pal.hemiSkyD, dayF );
    hemi.groundColor.copy( pal.hemiGrN ).lerp( pal.hemiGrD, dayF );
    hemi.intensity = lerp( 0.3, 0.65, dayF ) + W.oc * 0.25;

    cloudMat.color.copy( pal.cloudNight ).lerp( pal.cloudDay, dayF ).lerp( tmpC.copy( pal.cloudGrey ).multiplyScalar( 0.4 + 0.6 * dayF ), W.oc );
    cloudMat.emissive.copy( cloudMat.color ).multiplyScalar( 0.3 );

    terrainMat.roughness = lerp( 0.95, 0.6, W.rain );
    finalPass.uniforms.exposure.value = state.exposure * ( 1 + 0.5 * night );
    winMat.emissiveIntensity = 2.2 * night * ( 0.6 + 0.4 * W.oc );

    // particle strengths
    const clearF = 1 - W.rain;
    dust.u.uOpacity.value = dust.baseOpacity * W.dust * dayF * clearF;
    mist.u.uOpacity.value = 0.09 * W.mist;
    flies.u.uOpacity.value = 0.9 * night * clearF * ( 1 - W.mist * 0.5 );
    const pf = state.petals ? 1 : 0;
    petalsTree.u.uOpacity.value = petalsTree.baseOpacity * pf * ( 1 - W.rain * 0.8 ) * ( 0.25 + 0.75 * dayF + 0.2 * night );
    petalsNear.u.uOpacity.value = petalsNear.baseOpacity * pf * ( 1 - W.rain * 0.8 ) * ( 0.25 + 0.75 * dayF + 0.2 * night );
    rain.u.uOpacity.value = W.rain * ( 0.4 + 0.6 * dayF );
    rain.points.visible = W.rain > 0.02;
    mist.points.visible = W.mist > 0.02;
    rain.u.uColor.value.copy( hor ).multiplyScalar( 0.9 ).lerp( tmpC.setRGB( 0.6, 0.66, 0.75 ), 0.4 );
  }

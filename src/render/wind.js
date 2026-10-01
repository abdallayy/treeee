  /* =====================================================================
   *  6. WIND – shared uniforms + shader injection
   *  Vertex deformation: every material is patched (onBeforeCompile) so that
   *  vertices are pushed along the wind direction by
   *     – a travelling gust wave (sampled at world position),
   *     – a height-weighted lean (aWind.x, baked per vertex),
   *     – a fast per-leaf flutter (aWind.z) with per-part phase (aWind.y).
   *  The same code is injected into the shadow depth material so shadows sway.
   * ===================================================================== */
  const WU = {
    uWindTime: { value: 0 },
    uWindDir: { value: new T.Vector2( 1, 0 ) },
    uWindSpeed: { value: 7 },
    uWindGust: { value: 0.7 },
    uClear: { value: Array.from( { length: 32 }, () => new T.Vector4() ) },
    uClearN: { value: 0 }
  };
  const WIND_PARS = `
  uniform float uWindTime; uniform vec2 uWindDir; uniform float uWindSpeed; uniform float uWindGust; uniform vec4 uClear[32]; uniform int uClearN;
  float windGust(vec2 p, float ph){
    vec2 perp = vec2(-uWindDir.y, uWindDir.x);
    float g = sin(dot(p, uWindDir) * 0.07 - uWindTime * 1.2) * 0.6
            + sin(dot(p, perp) * 0.11 - uWindTime * 1.9 + ph * 0.1) * 0.4;      // -1..1
    return mix(1.0, 0.35 + 1.3 * (g * 0.5 + 0.5), uWindGust);
  }`;
  function addWind ( material, kind )
  {
    material.onBeforeCompile = ( shader ) =>
    {
      Object.keys( WU ).forEach( k => { shader.uniforms[ k ] = WU[ k ]; } );
      let pars = WIND_PARS, body;
      if ( kind === 'tree' )
      {
        pars = 'attribute vec3 aWind;\n' + pars;
        body = `
        vec4 wpos = modelMatrix * vec4(transformed, 1.0);
        float ph = aWind.y;
        float A = (0.06 + uWindSpeed * 0.035) * windGust(wpos.xz, ph);
        vec2 perp = vec2(-uWindDir.y, uWindDir.x);
        vec2 sway = uWindDir * A * aWind.x + perp * sin(uWindTime * 1.7 + ph + wpos.x * 0.2) * A * 0.25 * aWind.x;
        float fl = (0.05 + uWindSpeed * 0.012) * aWind.z;
        vec3 flutter = vec3(sin(uWindTime*4.3 + ph + wpos.x*1.1), sin(uWindTime*3.1 + ph*1.7)*0.5, cos(uWindTime*3.7 + ph*1.3 + wpos.z*1.1)) * fl;
        transformed.xz += sway;
        transformed += flutter;`;
      } else
      {                      // instanced grass tufts (instances carry translation + uniform scale only)
        body = `
        float hh = clamp(position.y / 0.8, 0.0, 1.0);
        vec4 wpos = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        for(int i=0;i<32;i++){ if(i>=uClearN) break; vec4 cc = uClear[i]; vec2 dd = wpos.xz - cc.xy; if(cc.z > 0.0 && dot(dd,dd) < cc.z*cc.z) transformed *= 0.0; }
        float A = (0.04 + uWindSpeed * 0.03) * windGust(wpos.xz, 0.0);
        vec2 perp = vec2(-uWindDir.y, uWindDir.x);
        transformed.xz += (uWindDir * A * 0.9 + perp * sin(uWindTime * 3.0 + wpos.x * 0.8 + wpos.z * 0.6) * A * 0.35) * hh * hh;`;
      }
      shader.vertexShader = shader.vertexShader
        .replace( '#include <common>', '#include <common>\n' + pars )
        .replace( '#include <begin_vertex>', '#include <begin_vertex>\n' + body );
    };
    material.customProgramCacheKey = () => 'wind-' + kind;
  }

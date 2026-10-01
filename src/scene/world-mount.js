  /* ---- Landmarks: small castles in each domain, cathedral on the far plateau ---- */
  const landmarkMat = new T.MeshStandardMaterial( { vertexColors: true, roughness: 0.9, flatShading: true, side: T.DoubleSide } );
  landmarkMat.onBeforeCompile = ( sh ) =>
  {
    Object.keys( WU ).forEach( k => { sh.uniforms[ k ] = WU[ k ]; } );
    sh.vertexShader = sh.vertexShader
      .replace( '#include <common>', '#include <common>\n' + WIND_PARS + '\nattribute vec3 aWind; varying vec3 vWP; varying vec3 vWN; varying float vId;' )
      .replace( '#include <begin_vertex>', `#include <begin_vertex>
        vWP = position; vWN = normal; vId = aWind.z;
        if (aWind.z > 3.5) {
          float wg = 1.0 - uv.y, A = (0.25 + uWindSpeed * 0.05) * windGust(position.xz, 0.0);
          transformed += normal * sin(uWindTime * 3.1 + position.y * 1.4 + position.x * 0.6) * 0.32 * wg * (0.5 + A);
          transformed.xz += uWindDir * A * 0.9 * wg;
        }` );
    sh.fragmentShader = sh.fragmentShader
      .replace( '#include <common>', `#include <common>
        varying vec3 vWP; varying vec3 vWN; varying float vId; float gH;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
        float fb(vec2 p){ return vn(p)*0.5 + vn(p*2.1)*0.25 + vn(p*4.3)*0.125 + vn(p*8.7)*0.0625; }
        vec3 matPattern(vec3 wp, vec3 n, float id){
          vec3 a = abs(n); vec2 uv = a.y > max(a.x, a.z) ? wp.xz : (a.x > a.z ? wp.zy : wp.xy);
          float wear = fb(uv * 3.0); gH = 0.5; vec3 c = vec3(1.0);
          if (id < 0.5) { gH = fb(uv * 14.0) * 0.4; c = vec3(0.86 + 0.28 * fb(uv * 5.0)); }
          else if (id < 1.5) {
            float bh = 0.62, bw = 1.3, row = floor(uv.y / bh);
            float u = uv.x / bw + row * 0.37 + h21(vec2(row, 3.0)) * 0.6;
            vec2 cell = vec2(floor(u), row), f = vec2(fract(u), fract(uv.y / bh));
            float e = min(min(f.x, 1.0 - f.x) * bw, min(f.y, 1.0 - f.y) * bh) + (fb(uv * 7.0) - 0.5) * 0.06;
            float mo = smoothstep(0.02, 0.085, e), tone = 0.7 + 0.55 * h21(cell);
            c = vec3(mix(0.32, tone * (0.78 + 0.5 * fb(uv * 8.0)), mo));
            c *= mix(vec3(1.0), vec3(0.62, 0.78, 0.45), smoothstep(0.62, 0.8, wear) * 0.7);
            gH = mo * (0.55 + 0.4 * fb(uv * 12.0));
          } else if (id < 2.5) {
            float u = uv.x / 0.3 + floor(uv.y / 3.0) * 0.5, pl = floor(u), g = fb(vec2(uv.x * 2.5, uv.y * 0.3 + pl * 7.3));
            float gr = smoothstep(0.0, 0.06, min(fract(u), 1.0 - fract(u)));
            c = vec3((0.6 + 0.65 * g) * mix(0.35, 1.0, gr)); gH = gr * 0.4 + g * 0.3;
          } else if (id < 3.5) {
            float th = 0.4, row = floor(uv.y / th), u = uv.x / 0.42 + row * 0.5; vec2 cell = vec2(floor(u), row);
            float fy = fract(uv.y / th), sc = fy + 0.18 * abs(fract(u) - 0.5);
            c = vec3((0.62 + 0.6 * h21(cell)) * (0.55 + 0.6 * smoothstep(0.0, 0.5, sc)) * (0.85 + 0.3 * fb(uv * 6.0)));
            gH = smoothstep(0.0, 1.0, sc);
          } else {
            float wv = sin(uv.x * 110.0) * sin(uv.y * 110.0), fold = sin(uv.x * 5.0 + fb(uv * 2.0) * 4.0);
            c = vec3(0.82 + 0.1 * wv + 0.13 * fold); gH = 0.5 + 0.1 * wv + 0.15 * fold;
          }
          return c;
        }` )
      .replace( '#include <map_fragment>', '#include <map_fragment>\n        diffuseColor.rgb *= matPattern(vWP, normalize(vWN), vId);' )
      .replace( '#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 q0 = dFdx(-vViewPosition), q1 = dFdy(-vViewPosition), R1 = cross(q1, normal), R2 = cross(normal, q0);
          float fDet = dot(q0, R1), dHx = dFdx(gH), dHy = dFdy(gH);
          normal = normalize(abs(fDet) * normal - sign(fDet) * (dHx * R1 + dHy * R2) * 0.05); }` );
  };
  landmarkMat.customProgramCacheKey = () => 'landmark-proc';
  const winMat = new T.MeshStandardMaterial( { vertexColors: true, roughness: 0.3, emissive: C( '#ffc266' ), emissiveIntensity: 0 } );
  let wg = buildWorld(); const worldObjs = [], sailMeshes = [], wheelMeshes = [];
  function mountWorld ()
  {
    const add = o => { scene.add( o ); worldObjs.push( o ); return o; };
    [ new T.Mesh( wg.body, landmarkMat ), new T.Mesh( wg.windows, winMat ) ].forEach( mm => { mm.castShadow = mm.receiveShadow = true; add( mm ); } );
    wg.sails.forEach( sl => { const g = new T.Group(); g.userData.itemId = sl.id; g.position.copy( sl.p ); g.rotation.set( ...( sl.rot || [ 0, sl.yaw, 0 ] ) ); g.scale.set( sl.sx || sl.s || 1, sl.sy || sl.s || 1, sl.sz || sl.s || 1 ); const mesh = new T.Mesh( wg.sailGeo, landmarkMat ); mesh.castShadow = true; g.add( mesh ); add( g ); sailMeshes.push( mesh ); } );
    wg.wheels.forEach( wl => { const mesh = new T.Mesh( wg.wheelGeo, landmarkMat ); mesh.userData.itemId = wl.id; mesh.rotation.order = 'XYZ'; mesh.rotation.set( ...( wl.rot || [ 0, wl.yaw || 0, 0 ] ) ); mesh.position.set( wl.x, wl.y, wl.z ); mesh.scale.set( wl.sx || wl.s || 1, wl.sy || wl.s || 1, wl.sz || wl.s || 1 ); mesh.castShadow = true; add( mesh ); wheelMeshes.push( mesh ); } );
  }
  function rebuildWorld ()      // used by dev.html after every add / delete
  {
    worldObjs.forEach( o => { scene.remove( o ); o.traverse( n => n.geometry && n.geometry.dispose() ); } ); worldObjs.length = 0;
    wg.treeMeshes.forEach( t => { treeGroup.remove( t ); } );
    wg.treeAsm.forEach( g => { treeGroup.remove( g ); g.traverse( n => { if ( n.userData.ownGeo ) n.geometry.dispose(); } ); } ); unmountFarms();
    for ( let i = placed.length - 1; i >= 0; i-- ) if ( placed[ i ].world ) placed.splice( i, 1 ); sailMeshes.length = 0; wheelMeshes.length = 0;
    wg = buildWorld(); mountWorld(); mountFarms();
  }
  mountWorld();
  ( function villageTrees () { return; const r = mulberry32( 55 ); for ( let i = 0, n = 0; i < 400 && n < 10; i++ ) { const a = r() * 6.28, d = 25 + r() * 12, x = CASTLE.x + Math.cos( a ) * d, z = CASTLE.z + Math.sin( a ) * d; if ( pathDist( x, z ) < 4 || placed.some( p => Math.hypot( p.x - x, p.z - z ) < 6 ) ) continue; plant( 'sakura', x, z, 0.8 + r() * 0.3, n ); n++; } } )();

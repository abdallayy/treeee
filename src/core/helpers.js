  'use strict';
  const T = THREE;
  const MAP = 1600, HALF = MAP / 2;   // expanded world size

  /* =====================================================================
   *  COLOUR NOTE
   *  The whole pipeline is linear: every colour below is converted from
   *  sRGB hex to linear, the scene renders into a half-float target, and a
   *  final pass applies ACES tone-mapping + sRGB encoding.
   * ===================================================================== */
  const C = ( hex ) => new T.Color( hex ).convertSRGBToLinear();

  /* =====================================================================
   *  1. MATH / NOISE UTILITIES
   * ===================================================================== */
  const clamp = ( x, a, b ) => Math.min( b, Math.max( a, x ) );
  const lerp = ( a, b, t ) => a + ( b - a ) * t;
  const smoothstep = ( a, b, x ) => { const t = clamp( ( x - a ) / ( b - a ), 0, 1 ); return t * t * ( 3 - 2 * t ); };

  // Small, fast seeded RNG so every rebuild gives the same forest.
  function mulberry32 ( a )
  {
    return function ()
    {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul( a ^ a >>> 15, 1 | a );
      t = t + Math.imul( t ^ t >>> 7, 61 | t ) ^ t;
      return ( ( t ^ t >>> 14 ) >>> 0 ) / 4294967296;
    };
  }
  let R = mulberry32( 1 );      // "current" RNG; each builder reseeds it

  function hash2 ( x, y ) { const h = Math.sin( x * 127.1 + y * 311.7 ) * 43758.5453; return h - Math.floor( h ); }
  function hash3 ( x, y, z ) { const h = Math.sin( x * 127.1 + y * 311.7 + z * 74.7 ) * 43758.5453123; return h - Math.floor( h ); }
  function noise2 ( x, y )
  {
    const xi = Math.floor( x ), yi = Math.floor( y ), xf = x - xi, yf = y - yi;
    const u = xf * xf * ( 3 - 2 * xf ), v = yf * yf * ( 3 - 2 * yf );
    const a = hash2( xi, yi ), b = hash2( xi + 1, yi ), c = hash2( xi, yi + 1 ), d = hash2( xi + 1, yi + 1 );
    return a + ( b - a ) * u + ( c - a ) * v + ( a - b - c + d ) * u * v;
  }
  function noise3 ( x, y, z )
  {
    const xi = Math.floor( x ), yi = Math.floor( y ), zi = Math.floor( z );
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * ( 3 - 2 * xf ), v = yf * yf * ( 3 - 2 * yf ), w = zf * zf * ( 3 - 2 * zf );
    const h = ( a, b, c ) => hash3( xi + a, yi + b, zi + c );
    return lerp(
      lerp( lerp( h( 0, 0, 0 ), h( 1, 0, 0 ), u ), lerp( h( 0, 1, 0 ), h( 1, 1, 0 ), u ), v ),
      lerp( lerp( h( 0, 0, 1 ), h( 1, 0, 1 ), u ), lerp( h( 0, 1, 1 ), h( 1, 1, 1 ), u ), v ), w );
  }
  function fbm2 ( x, y, oct )
  {
    let s = 0, a = 0.5, f = 1, n = 0;
    for ( let i = 0; i < oct; i++ ) { s += a * noise2( x * f, y * f ); n += a; a *= 0.5; f *= 2.03; }
    return s / n;
  }

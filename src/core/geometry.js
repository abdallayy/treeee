  /* =====================================================================
   *  3. GEOMETRY HELPERS
   * ===================================================================== */
  const Y_AXIS = new T.Vector3( 0, 1, 0 );
  const _q = new T.Quaternion(), _e = new T.Euler();
  const ID = new T.Matrix4();
  let currentItemTransform = null, curTag = null, currentItemK = 1;
  function itemTransform ( item, flat )
  {
    const origin = new T.Vector3( item.x, ( flat ? 0 : terrainHeight( item.x, item.z ) ) + ( item.dy || 0 ), item.z );
    const rotation = new T.Quaternion().setFromEuler( new T.Euler( item.rx || 0, item.ry || 0, item.rz || 0, 'XYZ' ) );
    const scale = new T.Vector3( item.sx || 1, item.sy || 1, item.sz || 1 );
    return new T.Matrix4().makeTranslation( origin.x, origin.y, origin.z )
      .multiply( new T.Matrix4().compose( new T.Vector3(), rotation, scale ) )
      .multiply( new T.Matrix4().makeTranslation( -origin.x, -origin.y, -origin.z ) );
  }
  function transformParts ( parts, start, matrix )
  {
    const rot = new T.Quaternion(), pos = new T.Vector3(), partScale = new T.Vector3(), offset = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3();
    matrix.decompose( offset, q, s );
    for ( let i = start; i < parts.length; i++ )
    {
      const part = parts[ i ], p = part.p || ( part.p = new T.Vector3( part.x, part.y, part.z ) );
      p.applyMatrix4( matrix );
      rot.setFromEuler( new T.Euler( ...( part.rot || [ 0, part.yaw || 0, 0 ] ) ) ).premultiply( q );
      const e = new T.Euler().setFromQuaternion( rot, 'XYZ' ); part.rot = [ e.x, e.y, e.z ]; part.yaw = e.y;
      part.sx = ( part.sx || part.s || 1 ) * s.x; part.sy = ( part.sy || part.s || 1 ) * s.y; part.sz = ( part.sz || part.s || 1 ) * s.z;
      if ( part.x !== undefined ) { part.x = p.x; part.y = p.y; part.z = p.z; }
    }
  }
  function M ( px, py, pz, sx, sy, sz, rx, ry, rz )
  {
    sx = sx === undefined ? 1 : sx; sy = sy === undefined ? sx : sy; sz = sz === undefined ? sx : sz;
    _e.set( rx || 0, ry || 0, rz || 0 ); _q.setFromEuler( _e );
    return new T.Matrix4().compose( new T.Vector3( px, py, pz ), _q, new T.Vector3( sx, sy, sz ) );
  }
  // Matrix that points local +Y along `dir` (used for branches, needles…)
  function MD ( pos, dir, sx, sy, sz )
  {
    const q = new T.Quaternion().setFromUnitVectors( Y_AXIS, dir.clone().normalize() );
    return new T.Matrix4().compose( pos, q, new T.Vector3( sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz ) );
  }
  function MQ ( pos, q, s ) { return new T.Matrix4().compose( pos, q, s ); }

  /**
   * Mesher – merges many primitives into ONE BufferGeometry, baking per-vertex:
   *   colour (with a stylised top-light / bottom-dark gradient + tiny noise),
   *   and the wind attribute aWind = (sway weight, phase, flutter weight).
   * Merging keeps the draw-call count tiny (2 per tree: bark + foliage).
   */
  class Mesher
  {
    constructor ( H ) { this.H = H; this.p = []; this.n = []; this.c = []; this.u = []; this.w = []; this.ranges = {}; }
    add ( geo, matrix, o )
    {
      o = o || {};
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      g.applyMatrix4( matrix );
      if ( currentItemTransform ) g.applyMatrix4( currentItemTransform );
      const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
      const col = o.color || new T.Color( 1, 1, 1 );
      const grad = o.grad !== undefined ? o.grad : 0.3;
      const sway = o.sway !== undefined ? o.sway : 1;
      const fl = o.flutter || 0;
      const ph = o.phase !== undefined ? o.phase : R() * 6.28;
      const jit = 0.93 + R() * 0.14, v0 = this.p.length / 3, kk = currentItemTransform ? currentItemK : 1;
      for ( let i = 0; i < P.count; i++ )
      {
        const x = P.getX( i ), y = P.getY( i ), z = P.getZ( i );
        this.p.push( x, y, z );
        const ny = N.getY( i );
        this.n.push( N.getX( i ), ny, N.getZ( i ) );
        const top = ny * 0.5 + 0.5;
        const f = lerp( 1 - grad, 1 + grad * 0.35, top ) * jit * ( 0.94 + 0.12 * hash3( x * 6.3, y * 6.3, z * 6.3 ) );
        this.c.push( col.r * f, col.g * f, col.b * f );
        this.u.push( U ? U.getX( i ) : 0, U ? U.getY( i ) : 0 );
        const hy = clamp( y / ( this.H * kk ), 0, 1 );      // giant items: weight relative to the scaled height, amplitude capped (no shearing)
        this.w.push( sway * Math.pow( hy, 1.7 ) * this.H * 0.25 * Math.min( kk, 2.5 ), ph, fl );
      }
      if ( curTag ) { const r = this.ranges[ curTag ] || ( this.ranges[ curTag ] = [] ), n = this.p.length / 3 - v0, l = r[ r.length - 1 ]; if ( l && l[ 0 ] + l[ 1 ] === v0 ) l[ 1 ] += n; else r.push( [ v0, n ] ); }
      g.dispose();
    }
    build ()
    {
      const g = new T.BufferGeometry();
      g.setAttribute( 'position', new T.Float32BufferAttribute( this.p, 3 ) );
      g.setAttribute( 'normal', new T.Float32BufferAttribute( this.n, 3 ) );
      g.setAttribute( 'color', new T.Float32BufferAttribute( this.c, 3 ) );
      g.setAttribute( 'uv', new T.Float32BufferAttribute( this.u, 2 ) );
      g.setAttribute( 'aWind', new T.Float32BufferAttribute( this.w, 3 ) );
      g.computeBoundingSphere(); g.computeBoundingBox(); g.userData.ranges = this.ranges;
      return g;
    }
  }

  /** Tapered, curved tube (trunks, branches, roots). radiusFn(t) with t∈[0,1]. */
  function tube ( points, radiusFn, radial, segs, bump )
  {
    const curve = new T.CatmullRomCurve3( points, false, 'catmullrom', 0.5 );
    const len = curve.getLength();
    const fr = curve.computeFrenetFrames( segs, false );
    const pos = [], nor = [], uv = [], idx = [];
    for ( let i = 0; i <= segs; i++ )
    {
      const t = i / segs, P = curve.getPointAt( t ), Nn = fr.normals[ i ], B = fr.binormals[ i ], r0 = radiusFn( t );
      for ( let j = 0; j <= radial; j++ )
      {
        const a = j / radial * Math.PI * 2, cx = -Math.cos( a ), sy = Math.sin( a );
        const rr = r0 * ( 1 + ( bump || 0 ) * ( noise2( ( j % radial ) * 1.7, i * 0.45 ) - 0.5 ) * 2 );
        const nx = cx * Nn.x + sy * B.x, ny = cx * Nn.y + sy * B.y, nz = cx * Nn.z + sy * B.z;
        pos.push( P.x + rr * nx, P.y + rr * ny, P.z + rr * nz );
        nor.push( nx, ny, nz );
        uv.push( j / radial * 3, t * len / 2.5 );
      }
    }
    for ( let j = 1; j <= segs; j++ ) for ( let i = 1; i <= radial; i++ )
    {
      const a = ( radial + 1 ) * ( j - 1 ) + ( i - 1 ), b = ( radial + 1 ) * j + ( i - 1 ), c = ( radial + 1 ) * j + i, d = ( radial + 1 ) * ( j - 1 ) + i;
      idx.push( a, b, d, b, c, d );
    }
    const g = new T.BufferGeometry();
    g.setIndex( idx );
    g.setAttribute( 'position', new T.Float32BufferAttribute( pos, 3 ) );
    g.setAttribute( 'normal', new T.Float32BufferAttribute( nor, 3 ) );
    g.setAttribute( 'uv', new T.Float32BufferAttribute( uv, 2 ) );
    g.userData.curve = curve;
    return g;
  }

  /** Lumpy icosphere used for oak / blossom tufts. `smooth` = spherical normals. */
  function makeBlob ( detail, amp, freq, seed, smooth )
  {
    const g = new T.IcosahedronGeometry( 1, detail );
    const p = g.attributes.position, nrm = [];
    for ( let i = 0; i < p.count; i++ )
    {
      const x = p.getX( i ), y = p.getY( i ), z = p.getZ( i ), l = Math.hypot( x, y, z ) || 1;
      const ux = x / l, uy = y / l, uz = z / l;
      const s = 1 + amp * ( noise3( ux * freq + seed, uy * freq + seed * 0.7, uz * freq + seed * 1.3 ) - 0.5 ) * 2;
      p.setXYZ( i, ux * s, uy * s, uz * s );
      nrm.push( ux, uy, uz );
    }
    if ( smooth ) g.setAttribute( 'normal', new T.Float32BufferAttribute( nrm, 3 ) ); else g.computeVertexNormals();
    return g;
  }

  /** Pine tier: cone whose rim is jagged & drooping, like a cluster of needle boughs. */
  function jaggedCone ( r, h, seg, jag )
  {
    const g = new T.ConeGeometry( r, h, seg, 1, false );
    const p = g.attributes.position;
    for ( let i = 0; i < p.count; i++ )
    {
      const y = p.getY( i );
      if ( y < -h / 2 + 1e-4 )
      {
        const x = p.getX( i ), z = p.getZ( i );
        if ( Math.hypot( x, z ) > 1e-4 )
        {
          const hv = hash2( Math.round( x * 50 ), Math.round( z * 50 ) );
          const k = 1 + jag * ( hv - 0.5 ) * 2;
          p.setX( i, x * k ); p.setZ( i, z * k ); p.setY( i, y - jag * 0.9 * hv );
        }
      }
    }
    g.computeVertexNormals();
    return g;
  }

  /* Shared prototypes (created once, reused by every tree variant) */
  const BLOBS_FLAT = [ 0, 1, 2, 3 ].map( s => makeBlob( 2, 0.24, 1.7, s * 3.1 + 1, false ) );
  const BLOBS_FLAT_S = [ 0, 1, 2 ].map( s => makeBlob( 1, 0.2, 1.5, s * 2.3 + 7, false ) );
  const BLOBS_SOFT = [ 0, 1, 2, 3 ].map( s => makeBlob( 2, 0.17, 1.4, s * 2.7 + 3, true ) );
  const BLOBS_SOFT_S = [ 0, 1, 2 ].map( s => makeBlob( 1, 0.2, 1.6, s * 1.9 + 11, true ) );
  const SPHERE = new T.SphereGeometry( 1, 22, 16 );

  const OAK = [ '#2f6a26', '#3f7d2c', '#4e9436', '#62a843', '#78bb50' ].map( C );
  const PINE = [ '#173f2b', '#1d4f34', '#246040', '#2b7049', '#35835a' ].map( C );
  const SAKURA = [ '#ef93b2', '#f7a8c0', '#ffb7cd', '#ffc8d9', '#ffdce8', '#fff0f5' ].map( C );
  const FANTASY = [ '#3fa533', '#4db33a', '#64c83f', '#7ddb4e', '#9ae960' ].map( C );
  function pick ( pal, bias )
  {          // bias 0 = darkest … 1 = lightest
    const i = clamp( Math.floor( ( bias * 0.65 + R() * 0.55 ) * pal.length ), 0, pal.length - 1 );
    return pal[ i ].clone().offsetHSL( ( R() - 0.5 ) * 0.015, ( R() - 0.5 ) * 0.06, ( R() - 0.5 ) * 0.05 );
  }
  function randUnit ()
  {
    const u = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt( 1 - u * u );
    return new T.Vector3( s * Math.cos( a ), u, s * Math.sin( a ) );
  }
  function addLobe ( mesher, blobs, c, r, col, o )
  {
    o = o || {};
    const g = blobs[ Math.floor( R() * blobs.length ) ];
    mesher.add( g, M( c.x, c.y, c.z, r, r * ( o.squash || 0.85 ), r, 0, R() * 6.28, 0 ),
      { color: col, grad: o.grad !== undefined ? o.grad : 0.4, sway: 1, flutter: o.flutter !== undefined ? o.flutter : 1 } );
  }
  function addRoots ( bark, col, n, baseR, len )
  {
    const a0 = R() * 6.28;
    for ( let i = 0; i < n; i++ )
    {
      const a = a0 + i / n * Math.PI * 2 + ( R() - 0.5 ) * 0.5, L = len * ( 0.8 + R() * 0.5 );
      const pts = [ new T.Vector3( Math.cos( a ) * baseR * 0.4, 0.9, Math.sin( a ) * baseR * 0.4 ),
      new T.Vector3( Math.cos( a ) * ( baseR + L * 0.5 ), 0.25, Math.sin( a ) * ( baseR + L * 0.5 ) ),
      new T.Vector3( Math.cos( a ) * ( baseR + L ), -0.25, Math.sin( a ) * ( baseR + L ) ) ];
      bark.add( tube( pts, t => baseR * 0.55 * ( 1 - t ) + 0.08, 7, 6, 0.1 ), ID, { color: col, grad: 0.15, sway: 0 } );
    }
  }

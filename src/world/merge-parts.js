  /* Merge several non-indexed geometries into ONE BufferGeometry (one draw group per part, missing attributes zero-filled).
   * Used to fuse tree + soil disc and farm ground + fence + crops + scarecrow into a single mesh. */
  function mergeParts ( geos )
  {
    const spec = { position: 3, normal: 3, color: 3, uv: 2, aWind: 3 }, out = {}, g = new T.BufferGeometry(); let start = 0;
    Object.keys( spec ).forEach( k => { out[ k ] = []; } );
    geos.forEach( ( p, gi ) =>
    {
      const n = p.attributes.position.count;
      Object.keys( spec ).forEach( k => { const a = p.attributes[ k ], sz = spec[ k ]; for ( let i = 0; i < n; i++ ) for ( let c = 0; c < sz; c++ ) out[ k ].push( a ? a.array[ i * sz + c ] : ( k === 'color' ? 1 : 0 ) ); } );
      g.addGroup( start, n, gi ); start += n;
    } );
    Object.keys( spec ).forEach( k => g.setAttribute( k, new T.Float32BufferAttribute( out[ k ], spec[ k ] ) ) );
    g.computeBoundingSphere(); g.computeBoundingBox(); return g;
  }
  const TERRAIN_H = terrainHeight;

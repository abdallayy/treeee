    /* ---------- terrain-conforming rings (hidden unless hovered / selected / being edited) ---------- */
    const RING_SEG_MAX = 256, RING_LIFT = 0.22;
    class TerrainRing
    {
      constructor ( color, opacity )
      {
        const g = new T.BufferGeometry(), idx = [];
        this.pos = new Float32Array( ( RING_SEG_MAX + 1 ) * 2 * 3 ); g.setAttribute( 'position', new T.BufferAttribute( this.pos, 3 ).setUsage( T.DynamicDrawUsage ) );
        for ( let i = 0; i < RING_SEG_MAX; i++ ) { const a = i * 2; idx.push( a, a + 1, a + 2, a + 1, a + 3, a + 2 ); } g.setIndex( idx );
        this.mesh = new T.Mesh( g, new T.MeshBasicMaterial( { color, transparent: true, opacity, side: T.DoubleSide, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 } ) );
        this.mesh.frustumCulled = false; this.mesh.renderOrder = 9; this.mesh.visible = false; scene.add( this.mesh ); this.x = this.z = this.r = NaN;
      }
      set ( x, z, r )        // every vertex samples the terrain height at its own x/z, so the ribbon drapes over slopes instead of floating as a flat disc
      {
        if ( x === this.x && z === this.z && r === this.r ) return; this.x = x; this.z = z; this.r = r;
        const seg = clamp( Math.ceil( 6.2832 * r / 1.2 ), 48, RING_SEG_MAX ), w = clamp( r * 0.035, 0.22, 0.7 ), P = this.pos;
        for ( let i = 0; i <= seg; i++ )
        {
          const a = i / seg * 6.2832, c = Math.cos( a ), s = Math.sin( a );
          for ( let k = 0; k < 2; k++ )
          {
            const rr = k ? r : r - w, px = x + c * rr, pz = z + s * rr, o = ( i * 2 + k ) * 3;
            P[ o ] = px; P[ o + 1 ] = hGrid( px, pz ) + RING_LIFT; P[ o + 2 ] = pz;
          }
        }
        this.mesh.geometry.setDrawRange( 0, seg * 6 ); this.mesh.geometry.attributes.position.needsUpdate = true;
      }
      show ( v ) { this.mesh.visible = !!v; }
      color ( c ) { this.mesh.material.color.set( c ); }
    }
    const hoverRing = new TerrainRing( 0xdff6e2, 0.7 ), selRing = new TerrainRing( 0xffd66b, 0.95 ), sessRing = new TerrainRing( 0x6cf2c2, 0.95 ), cursorRing = new TerrainRing( 0xffffff, 0.85 ), pulseRing = new TerrainRing( 0x6cf2c2, 0.9 );

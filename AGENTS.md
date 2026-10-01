# Project Guide

## What this is
A static browser-based Three.js world: a castle, forests, villages, farms, rivers, and a map editor. No package manager or build step is required.

## Files
- `index.html`: Main experience, UI, styles, and third-party Three.js r128 scripts.
- `dev.html`: Development/editor experience and editor-specific styles.
- `index.js`: Sets `window.DEV_MODE = false` for the main page.
- `dev.js`: Sets `window.DEV_MODE = true` for the editor page.
- `world-3d.js`: Shared application and 3D implementation: terrain, procedural trees/buildings, rendering, controls, persistence, and dev editor. This is the primary behavior file.
- `map-data.js`: Serialized placed/removed map items. The editor can export a replacement file.

## Runtime contract
Both HTML pages load Three.js libraries first, then `map-data.js`, the page mode script, and finally `world-3d.js`. Preserve this order. `world-3d.js` reads `document.body.dataset.devMode`; keep `data-dev-mode="false"` on `index.html` and `data-dev-mode="true"` on `dev.html`.

Scripts are classic browser scripts, not ES modules. Three.js is exposed globally as `THREE`. Keep shared 3D logic in `world-3d.js`; avoid duplicating scene/model code in the page mode files.

## Checks
- Syntax: `node --check world-3d.js; node --check index.js; node --check dev.js`
- Smoke test both `index.html` and `dev.html` in a browser; verify the loading overlay clears and the FPS display updates.
- No automated test suite or build command is currently configured.

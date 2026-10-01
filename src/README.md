# Two Realms - source layout

Edit any file, refresh the page: no build step. `src/loader.js` runs the files in the order of `manifest.json`
as one program (they share one scope, like the old single `world-3d.js`). Serve the folder over http
(`python -m http.server`) - `file://` can't fetch the parts. Errors in DevTools show the real file + line.

| Folder | Files | What lives there |
|---|---|---|
| `core/` | helpers, terrain-height, geometry | noise, terrain height field, `Mesher` and tube / blob / cone helpers |
| `world/` | trees, buildings, catalog-and-map-data, merge-parts, world-layout | the 4 tree species, castle + cathedral, placeable catalog (`TREE_DEFS`, `CATALOG_TYPES`), the village / farms / bridges layout (`buildWorld`) |
| `render/` | textures, wind, particles, app-state, renderer-scene | canvas textures, wind shader patch, rain / petals, renderer + post-processing + sky + lights |
| `scene/` | terrain, trees, world-mount, water, ground-details, farms, asset-factory, meadow, sky-fx, environment | building the scene from the pieces above, farms, `buildAsset`, grass, clouds, day / weather update |
| `ui/` | controls, study-timer | Realm Atlas panel wiring, study timer |
| `interaction/` | planting, pointer | ground picking, tree planting, tap / hover tracking |
| `editor/` | see below | developer map editor (dev.html only) |
| `main/` | loop | `tickWorld` + frame loop |

## editor/ (add / edit / move / delete)
`state` shared flags - `rings` terrain rings - `incremental-world` hide / show / mount without rebuilding - `history` undo / redo -
`selection` select, chip, pulse - `hover` - `records` item records (`sessItem`) - `thumbnails` catalog previews - `ghost` hologram ghost -
`gizmo` X / Y / Z handles - `group-move` **M** (move selection) - `box-select` Shift-drag / Select tool - `session` **E** edit panel, add, delete -
`focus` **F** - `persistence` save / export - `dom` editor HTML - `context-menu` - `picking` - `add-modal` - `session-bar` - `map-manager` - `input` keys + clicks - `editor.css` styles.

## Single-file build
`node build.js` writes `world-3d.js` (same program, one file) for pages that load a single script.
Add a new file: create it, then list it in `src/manifest.json` at the right position.

## Performance notes (mobile)
- `main/loop.js` - FPS cap (30/60/90/120/Max/custom, saved in localStorage), adaptive resolution (only drops sharpness while the chosen FPS is missed),
  shadow map refreshed ~30 Hz, depth-of-field pass skipped while its blur is under 0.75 px, grass culling + labels only when the camera moves.
- `render/wind.js` - `uClearN`: the grass shader only loops over the clear-zones that exist (was always 32 iterations per vertex).

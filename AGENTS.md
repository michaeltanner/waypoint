# Waypoint agent guide

Waypoint is a zero-dependency, air-gapped project and portfolio app. It runs as one compiled HTML file in the browser. There is no package manager, no framework, and no backend.

## Edit the source, then compile

- Change files under `src/` only. `build/waypoint.html` and a root `waypoint.html` are generated and gitignored. Do not hand-edit them.
- Compile with `node build.js`. `node build.js --watch` rebuilds on save. `.\build.ps1` is the Node-free Windows build and must list the same CSS and JS files in the same order as `build.js`. A file missing from either bundler is missing from that build.
- Preview with `node server.js` at `http://localhost:8080/`. The server only serves `build/waypoint.html`.
- `src/js/core/converter.js` must stay in both bundlers. Schema v1 files upgrade through it on open.

## How the page is put together

- `build.js` concatenates `src/css/*.css` and `src/js/**/*.js` into the placeholders in `src/index.html`.
- The result is one classic script, not modules. Inline `onclick` handlers call top-level functions. New click actions should follow that pattern, or assign `window.someName` the way `storage.js` does.
- Workspace data lives in the global `state` object in `src/js/core/schema.js`. After a mutation, call `saveToCache()` and `renderAll()`.
- Do not add network calls, CDNs, web fonts, icon packs, or npm dependencies. The compiled file must open from disk with no internet.
- Style with the tokens in `src/css/tokens.css`. Match the existing glass panels, buttons, and modals.

## Keyboard shortcuts

- The catalog and the key listener both live in `src/js/core/shortcuts.js`. The header `?` button and the `?` key open a modal rendered from `SHORTCUT_CATALOG`.
- Add a global shortcut in the catalog and in the `keydown` listener together, then update the table in `README.md`.
- `?` does nothing while focus is in an input, textarea, select, or contenteditable field. `Escape` still closes the topmost layer: shortcut list, personnel dialog, workspace menu, Kanban filter, then the inspector. Only the top layer closes.
- `Ctrl+S` and `Ctrl+Shift+S` (Command on macOS) save the workspace. The listener must `preventDefault` so the browser does not save the HTML page. With no workspace open, those chords do nothing and do not alert.
- Bold, italic, and underline are native commands inside the notes editor. List them in the catalog and do not rebind them on `window`.

## Checking UI changes

- Rebuild, open `http://localhost:8080/`, and use the change the way a user would. Cover the empty launcher and a workspace opened with **Load Built-in Example**.
- For this shortcut list, confirm `?`, the header button, `Escape`, overlay click, and the close button. Confirm `?` does not fire while typing in the personnel form or the notes editor, and that `Ctrl+S` does not open the browser save-page dialog.
- After header or layout edits, check a viewport under 768px. The header wraps and the shortcut button stays on the tab row.
- Schema or file-load changes need both `schemas/examples/waypoint-v1.example.json` and `schemas/examples/waypoint-v2.example.json` opened through the UI.

## Mandatory schema evolution

Whenever a new `schemaVersion` (v3, v4, and so on) is introduced:

1. **Never break legacy files.** Waypoint must keep opening every previous workspace file.
2. **Implement translators.** Add `convertV2toV3(data)` (or the matching pair) in both `src/js/core/converter.js` and `scripts/convert-schema.js`. `convertSchema(data, targetVersion)` must chain upgrades one version at a time (`v1 -> v2 -> v3`).
3. **Auto-upgrade in the browser.** In `src/js/core/storage.js`, `loadWorkspaceFromObject` must detect `schemaVersion < SCHEMA_VERSION`, upgrade in memory, set `isWorkspaceDirty = true`, and show the auto-upgrade toast.
4. **Publish schema artifacts.** Save `schemas/schema-vX.json`, save `schemas/examples/waypoint-vX.example.json`, and update `schemas/README.md` with the changelog and field differences.
5. **Bump the constant and rebuild.** Set `SCHEMA_VERSION` in `src/js/core/schema.js`, run `node build.js`, and treat `build/waypoint.html` as the compiled output.

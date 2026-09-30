# Agent & Developer Guidelines: Waypoint

## ⚠️ Mandatory Schema Evolution & Translator Rule

Whenever a new `schemaVersion` (e.g. v3, v4, etc.) is introduced to Waypoint:
1. **Never Break Legacy Files**: Waypoint must remain 100% backwards-compatible with all previous workspace files.
2. **Implement Translators**:
   - Write a migration function (e.g., `convertV2toV3(data)`) in both [`src/js/core/converter.js`](file:///c:/Users/micha/Documents/dev/waypoint/src/js/core/converter.js) (browser runtime) and [`scripts/convert-schema.js`](file:///c:/Users/micha/Documents/dev/waypoint/scripts/convert-schema.js) (standalone CLI).
   - Ensure the universal `convertSchema(data, targetVersion)` chains upgrades step-by-step (`v1 -> v2 -> v3`).
3. **In-Browser Auto-Upgrade**:
   - In [`src/js/core/storage.js`](file:///c:/Users/micha/Documents/dev/waypoint/src/js/core/storage.js), `loadWorkspaceFromObject` must automatically detect any older `schemaVersion < SCHEMA_VERSION`, upgrade the workspace in memory, set `isWorkspaceDirty = true`, and display an auto-upgrade notification toast.
4. **Schema Artifacts**:
   - Save the formal JSON Schema specification in `schemas/schema-vX.json`.
   - Save a concrete example workspace in `schemas/examples/waypoint-vX.example.json`.
   - Update `schemas/README.md` with the changelog and field differences.
5. **Update Constants & Build**:
   - Bump `SCHEMA_VERSION` in [`src/js/core/schema.js`](file:///c:/Users/micha/Documents/dev/waypoint/src/js/core/schema.js).
   - Compile via `node build.js` and sync to root `waypoint.html`.

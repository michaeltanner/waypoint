# Rule: Backwards-Compatible Schema Evolution

Whenever modifying the Waypoint workspace schema or incrementing `schemaVersion`:

1. **Maintain Backwards Compatibility**:
   - Existing workspaces must open without errors.
   - Implement `convertV(N-1)toVN()` in both `src/js/core/converter.js` and `scripts/convert-schema.js`.
2. **Auto-Upgrade on Load**:
   - Ensure `loadWorkspaceFromObject()` in `src/js/core/storage.js` auto-migrates older versions in memory and alerts the user with an upgrade toast.
3. **Persist Schemas and Examples**:
   - Add `schemas/schema-vN.json` (JSON Schema Draft-07).
   - Add `schemas/examples/waypoint-vN.example.json`.
   - Update `schemas/README.md`.
4. **Compile & Sync**:
   - Run `node build.js` to update `build/waypoint.html` and sync to root `waypoint.html`.

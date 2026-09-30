# Waypoint Workspace JSON Schema History & Reference

This directory contains the formal JSON Schema definitions and reference examples for all versions of the Waypoint workspace format.

## Version Comparison

| Feature | Schema v1 (Initial Release) | Schema v2 (Current Release) |
| :--- | :--- | :--- |
| **`schemaVersion`** | `1` | `2` |
| **ID Architecture** | Simple sequential strings (`t-001`, `tm-101`) | Hybrid identity: immutable RFC 4122 v4 `uuid` + semantic `displayId` (`PRJ-001`, `TM-001`) |
| **Team Roster** | Embedded inside root task: `tasks[0].teamMembers` | Centralized root-level array: `teamRoster` |
| **Team Member Tags** | None | Multi-select `tags` (e.g. `primary`, `support`, `inactive`) with root `memberFlags` |
| **Hierarchy Levels** | Hardcoded types | Configurable root `hierarchy` array defining level, type, label, and emoji icon |
| **Completion Status** | `Done` | `Completed` (standardized across Kanban and filters) |
| **Task Flags** | Explicit `blocked: boolean`, `estimatedDuration` | Simplified: `status: "Blocked"` handles blockage directly; dates drive timeline |

---

## Directory Contents

- **`schema-v1.json`**: Formal [JSON Schema Draft-07](https://json-schema.org/) definition for Schema v1.
- **`schema-v2.json`**: Formal [JSON Schema Draft-07](https://json-schema.org/) definition for Schema v2.
- **`examples/waypoint-v1.example.json`**: Complete, authentic Schema v1 reference dataset (*Operation Sentinel Dawn*).
- **`examples/waypoint-v2.example.json`**: Complete, authentic Schema v2 reference dataset with hybrid IDs, centralized roster, and configurable hierarchy.

---

## Key Schema Changes (v1 to v2)

### 1. Centralized Team Roster (`teamRoster`)
In v1, team members were defined inside `tasks[0].teamMembers`. In v2, team members belong to the portfolio as a whole in `state.teamRoster`, allowing tasks and milestones at any level to reference members via `leadId` or `assigneeId`.

### 2. Hybrid UUID + Semantic Display ID Engine
To support robust data synchronization, drag-and-drop tree re-parenting, and offline air-gap safety without ID collisions:
- Every task and team member receives a globally unique, immutable RFC 4122 v4 `uuid`.
- Human-facing views use semantic `displayId`s (`OBJ-001`, `TSK-004`, `TM-002`) for easy verbal reference and briefing slides.

### 3. Configurable Multi-Tier Hierarchy (`hierarchy`)
Workspaces can customize level tiers, display labels, and icons:
```json
"hierarchy": [
  { "level": 0, "type": "project", "label": "Project", "icon": "📁" },
  { "level": 1, "type": "objective", "label": "Objective", "icon": "🎯" },
  { "level": 2, "type": "key_result", "label": "Key Result", "icon": "📊" },
  { "level": 3, "type": "task", "label": "Task", "icon": "📋" }
]
```

### 4. Status Enum Normalization
The legacy `"Done"` status value in v1 was unified to `"Completed"` to match standard DoD portfolio reporting and avoid ambiguity with `"Not Started"` or `"In Progress"`.

---

## ⚠️ Mandatory Schema Evolution & Translator Protocol

> [!IMPORTANT]
> **RULE FOR DEVELOPERS & AI ASSISTANTS**: Whenever a new `schemaVersion` (e.g., v3, v4, ...) is introduced to Waypoint, you **MUST** implement backwards-compatible translators immediately as part of the change. Never break existing workspace files.

### Checklist for Introducing Schema Version `N`:
1. **Schema Definition**: Create `schemas/schema-vN.json` (JSON Schema Draft-07 specification).
2. **Example File**: Add `schemas/examples/waypoint-vN.example.json` with a complete, valid sample dataset.
3. **Translator Implementation**:
   - Add `convertV(N-1)toVN(data)` to both [`src/js/core/converter.js`](file:///c:/Users/micha/Documents/dev/waypoint/src/js/core/converter.js) (browser engine) and [`scripts/convert-schema.js`](file:///c:/Users/micha/Documents/dev/waypoint/scripts/convert-schema.js) (standalone CLI).
   - Chain step-wise migration in `convertSchema(data, targetVersion)` (e.g. `v1 -> v2 -> v3`).
4. **Auto-Upgrade on File Open**:
   - Ensure [`src/js/core/storage.js`](file:///c:/Users/micha/Documents/dev/waypoint/src/js/core/storage.js) `loadWorkspaceFromObject()` detects any legacy version (`schemaVersion < N`), automatically converts it in memory, sets `isWorkspaceDirty = true`, and displays an auto-upgrade toast (`⚡ Auto-upgraded ... to Schema vN!`).
5. **Update Constants**:
   - Update `SCHEMA_VERSION = N` in `src/js/core/schema.js`.
6. **Documentation**:
   - Add the new version and its migration diff to this `schemas/README.md`.


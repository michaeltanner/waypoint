# Waypoint — Standalone Project & Portfolio Engine

Waypoint is a single-file, zero-dependency project and portfolio management application designed for air-gapped, offline, and restricted network environments.

## Overview

Waypoint runs entirely inside the browser as a standalone HTML5 application. It requires no backend server, database, node runtime, build pipeline, or internet connection. All data persistence relies on local browser storage (`localStorage`) and standard JSON file import/export.

## Key Features

### 1. Portfolio Hierarchy
Multi-level nested workstream tree supporting Objectives, Projects, Key Results, Tasks, and Milestones. Includes automatic completion percentage rollups, single-root project enforcement, accordion toggles, and filterable blocker indicators.

### 2. Interactive Timeline & Gantt Chart
Visual schedule display with scale switching across Day, Week, Month, and Year modes. Features interactive drag-and-drop bar rescheduling and side handles for duration adjustments.

### 3. Kanban Board
Drag-and-drop operational board organized into Not Started, In Progress, Blocked, and Done columns. Includes swimlane matrix views grouped by Parent Workstream (LOE), Assigned Lead, or Item Type.

### 4. Dedicated Team Roster
Separate tab view for workspace personnel management. Tracks team leads, engineering roles, email contacts, and phone numbers with assignment capabilities and cascading team inheritance down task branches.

### 5. Slide-Out Inspector Drawer
Detailed item inspection with in-line editing, 85vw expanded reading mode, rich text notes editor (supporting bold, italic, sub-lists, highlights, blockquotes), end-state vision tracking, and tactical Definition of Done (DoD) criteria.

### 6. Security Banners & Briefing Export
Top and bottom security classification banners (UNCLASSIFIED, CUI, or custom). High-contrast briefing layout optimized for 1-page browser print and PDF export.

## Deployment & Usage

1. Compile the standalone distribution artifact using `node build.js` or `.\build.ps1` (or download the precompiled `build/waypoint.html` release).
2. Save `build/waypoint.html` to any local directory or offline media drive.
3. Open `build/waypoint.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).
4. The application starts cleanly without preloading any default JSON content, presenting the **Workspace Launcher Hub**:
   * **🚀 Built-in Example**: One-click interactive load of the canonical demonstration dataset (*Operation Sentinel Dawn*).
   * **📥 Open JSON Workspace**: Seamless drag-and-drop anywhere onto the page (or click to browse local storage) to immediately load any existing `.json` portfolio file.
   * **➕ Create Blank Workspace**: Start fresh with an empty project, customizable OKR ladder, DoD criteria, and clean team directory.
   * **🕒 Recent Workspaces**: Quickly resume recent workspaces with 1-click open buttons, showing workstream counts, personnel counts, and last modified timestamps.
5. Use the **📂 Workspace ▾** header menu at any time to open new files, save, save as, switch recent workspaces, or close the active session to return to the launcher.
6. Use **💾 Save** (`Ctrl+S`) to save directly back to the active file handle or prompt Save As, **Save As...** (`Ctrl+Shift+S`) to write to a chosen file destination (or download offline JSON), and **✕ Close** to close the session with an interactive confirmation modal offering **Save & Close**, **Save As & Close**, **Discard & Close**, or **Cancel** whenever unsaved changes are present.

## Development & Build Workflow

Waypoint follows **COA #2 (Source Separation with a Zero-Dependency Micro-Bundler)** for developer ergonomics and modular code maintenance:

### Directory Structure

```text
/waypoint
├── build.js                 # Zero-dependency Node.js compiler (~12ms compile time)
├── build.ps1                # Zero-dependency native Windows PowerShell compiler
├── build/                   # Compiled distribution directory (gitignored)
│   └── waypoint.html        # Compiled single-file air-gapped release artifact
├── waypoint.json            # Canonical reference data schema
└── src/                     # Modular source code
    ├── index.html           # Skeleton template & security classification banners
    ├── css/                 # Discrete stylesheets
    │   ├── tokens.css       # Design tokens, variables & typography
    │   ├── layout.css       # Main shell, header & responsive container
    │   ├── tree.css         # Tree hierarchy view & rollup indicators
    │   ├── gantt.css        # Timeline & Gantt chart styling
    │   ├── kanban.css       # Kanban board & drag-and-drop swimlanes
    │   ├── inspector.css    # Slide-out inspector drawer & header actions
    │   ├── modals.css       # Dialog modals, confirmation boxes & forms
    │   ├── print.css        # Briefing layout & 1-page print media rules
    │   └── launcher.css     # Workspace launcher hub styling
    └── js/
        ├── core/            # Foundation logic (schema, data, hierarchy, storage, navigation)
        ├── views/           # View modules (launcher, tree, gantt, kanban, roster)
        └── components/      # Reusable components (inspector drawer, rich-text editor)
```

### Compiling Changes

To compile edits made in `/src/` into the standalone `build/waypoint.html` distribution file:

* **Using Node.js (cross-platform)**:
  ```bash
  node build.js          # One-shot build -> outputs to build/waypoint.html
  node build.js --watch  # Watch mode: auto-recompiles on any file edit
  ```
* **Using PowerShell (native Windows, no Node required)**:
  ```powershell
  .\build.ps1            # Outputs to build/waypoint.html
  ```

> **Air-Gapped Standalone Guarantee**: The compiled artifact `build/waypoint.html` is generated on demand, excluded from git version control, and remains a completely standalone, zero-dependency HTML5 application ready for drag-and-drop deployment onto secure, offline, air-gapped systems.

## Data Schema Specification

Waypoint uses a single-root nested JSON structure (`schemaVersion: 2`) with a hybrid identity model (immutable machine `uuid` and human-readable semantic `displayId`).

```json
{
  "schemaVersion": 2,
  "lastUpdated": "2026-09-29T21:00:00Z",
  "classification": "UNCLASSIFIED",
  "enums": {
    "type": ["project", "objective", "key_result", "task", "milestone"],
    "status": ["Not Started", "In Progress", "Blocked", "Completed"],
    "health": ["Green", "Yellow", "Red"]
  },
  "hierarchy": [
    { "level": 0, "type": "project", "label": "Project", "icon": "📁" },
    { "level": 1, "type": "objective", "label": "Objective", "icon": "🎯" },
    { "level": 2, "type": "key_result", "label": "Key Result", "icon": "📊" },
    { "level": 3, "type": "task", "label": "Task", "icon": "📋" }
  ],
  "memberFlags": ["primary", "support", "inactive"],
  "teamRoster": [
    {
      "id": "TM-001",
      "displayId": "TM-001",
      "uuid": "b8d362b8-bb59-4c03-84bf-afde1ad14dfe",
      "name": "Marcus White",
      "role": "Executive Sponsor / VP of Technology",
      "email": "marcus.white@example.com",
      "officePhone": "555-0100",
      "cellPhone": "555-111-2222",
      "flags": ["primary"],
      "notes": "Portfolio executive sponsor; quarterly briefings required."
    }
  ],
  "tasks": [
    {
      "id": "PRJ-001",
      "displayId": "PRJ-001",
      "uuid": "c9e473a1-772b-4e89-9a1f-0b2e4f6d8a9c",
      "type": "project",
      "title": "Operation Sentinel Dawn — Cyber Modernization Portfolio",
      "status": "In Progress",
      "health": "Yellow",
      "progress": 68,
      "leadId": "TM-001",
      "endStateVision": "Establish fully resilient, zero-trust digital networks across operational units.",
      "definitionOfDone": "All command nodes functional on zero-trust architecture with ATO sign-off.",
      "startDate": "2026-09-01",
      "dueDate": "2027-09-30",
      "notes": "Primary strategic initiative modernizing enterprise infrastructure.",
      "subTasks": []
    }
  ]
}
```

## Feature Backlog & Roadmap

### 1. Meetings & Meeting Minutes System
An integrated offline meeting and operational minutes management suite linked directly to portfolio workstreams and team personnel:
* **Meeting Records & Scheduling**: Track title, date, time duration, location/VTC bridge, organizer (`TM-XXX`), and attendance roster (Present / Excused / Absent).
* **Workstream Cross-Referencing**: Bi-directionally link meetings to specific projects, objectives, or tasks (`PRJ-001`, `OBJ-002`), displaying meeting history and decisions inside the Inspector Drawer.
* **Structured Agenda & Rich Text Minutes**: In-browser rich text capture for agenda items, operational briefing notes, and formal decisions reached.
* **Action Items & 1-Click Task Promotion**: Track action items with assigned leads and due dates, featuring 1-click conversion from meeting action items into formal workspace tasks.
* **Executive Distribution Exporter**: 1-click formatted clipboard export (Markdown / Email format categorized with To/Cc based on attendee role) and printable briefing summary.

### 2. Risk Register & 5x5 Risk Matrix
Heatmap visualization for logging risk impact, likelihood, and mitigation strategies tied to workstream nodes.

### 3. CSV Data Exporter & Tabular Reporting
Tabular export for tasks, schedules, team assignments, and blocker logs.

### 4. Change Audit Tracker
Historical change log tracking property revisions, timestamped edits, and workspace evolution over time.

## Architecture Analysis & Refactoring COAs (Future Maintenance)

### Executive Assessment & Technical Debt
* **Current Footprint**: `waypoint.html` is ~5,200 lines (1,780 lines of CSS, 290 lines of HTML, 3,100 lines of JavaScript) in a single standalone file. It delivers 100% zero-dependency, air-gapped, offline execution.
* **Maintenance Friction**:
  1. **Monolithic DOM Thrashing**: State changes call `renderAll()`, which tears down and repaints large swaths of the DOM via `innerHTML = ""`. This resets scroll positions, triggers layout thrashing, and risks scale bottlenecks as data grows.
  2. **Recursive Traversal Overhead**: Lookups, reparenting, metric rollups, and property resolutions perform $O(N)$ recursive tree scans (`findTaskRecursive`, `findParent`, `getTaskDepth`, `countPrefix`).
  3. **String Concatenation UI**: Mixing template literals, raw HTML strings, and inline event handlers (`onclick="..."`) makes UI components fragile to syntax errors and state bugs.
  4. **Developer Ergonomics**: Navigating a 5,200-line single file to coordinate styles, markup, and event handlers creates high cognitive load and merge conflicts.

---

### Courses of Action (COAs)

#### COA 1: In-Place Modularization & Normalized Index (Zero-Build, Pure Single-File)
Preserve the single-file distribution with zero build tooling, but re-architect internal JavaScript into discrete IIFE namespaces and maintain an in-memory normalized index.
* **Architecture**:
  * Organize code into namespaces: `Waypoint.State`, `Waypoint.Store`, `Waypoint.Views.Tree`, `Waypoint.Views.Kanban`, `Waypoint.Views.Gantt`, `Waypoint.Views.Roster`, `Waypoint.UI.Inspector`, `Waypoint.UI.Modals`.
  * Maintain an in-memory **Entity Map** (`idMap = new Map()`, `parentMap = new Map()`) alongside the tree so lookups and depth calculations are $O(1)$ instead of $O(N)$.
  * Introduce an Event Bus (`Waypoint.bus.emit('TASK_CHANGED', id)`) allowing views to update only their own DOM branch instead of full-screen `renderAll()`.
* **Pros**: Maintains strict zero-build single-file deployment; significant performance gains on lookups and updates; clean internal boundaries.
* **Cons**: The file remains ~5,000+ lines in the editor.

#### COA 2: Source Separation with a Zero-Dependency Micro-Bundler (Recommended)
Split the codebase into a clean `/src` directory structure during development, and use a lightweight 30-line Node or PowerShell script (`build.js` / `build.ps1`) to compile into the release `waypoint.html`.
* **Architecture**:
  ```text
  /waypoint
  ├── build.js (or build.ps1 - zero npm packages, native fs concatenation)
  ├── build/
  │   └── waypoint.html (generated standalone release artifact, gitignored)
  ├── waypoint.json
  └── src/
      ├── index.html (skeleton layout and banners)
      ├── css/ (tokens.css, layout.css, kanban.css, gantt.css, inspector.css)
      └── js/
          ├── core/ (schema.js, state.js, id-generator.js, migration.js)
          ├── views/ (tree.js, kanban.js, gantt.js, roster.js, meetings.js)
          └── components/ (inspector.js, modals.js, rich-text.js)
  ```
* **Pros**: Superior developer ergonomics (files are 150–400 lines); isolated feature development; zero merge friction; preserves 100% offline air-gapped deployment; zero external npm dependencies.
* **Cons**: Requires executing a build script before testing changes; risk of source divergence if someone edits `waypoint.html` directly.

#### COA 3: Reactive Proxy Store with Granular DOM Patching
Modernize the data layer using native browser APIs (`Proxy`, `<template>` fragments, and `CustomEvent`).
* **Architecture**:
  * Wrap `state` in an ES6 `Proxy`. Mutating a property (e.g. `task.status = "Completed"`) automatically marks the workspace dirty, saves to `localStorage`, and emits targeted change events.
  * Views observe specific entity paths. For example, moving a card in Kanban directly updates the card element's CSS class and moves the DOM node into the target column without rebuilding the entire Kanban grid.
  * Store normalized tables in memory (`{ tasksById: {}, rootId: "..." }`) and denormalize back to the hierarchical tree on JSON Export.
* **Pros**: Zero DOM thrashing; preserves scroll offsets, cursor focus, and drag states; robust foundation for high-frequency interactive features.
* **Cons**: Highest architectural refactoring effort; requires rewriting DOM rendering logic across all views.

#### COA 4: Surgical Incremental Refactor (Low-Risk "Spring Cleaning")
Preserve the existing codebase structure and monolithic file, but surgically address high-friction pain points without altering paradigms.
* **Architecture**:
  * **Unified Tree Utility**: Consolidate repetitive recursive searches, removals, and depth calculations into one robust `TreeEngine` helper object (`TreeEngine.find`, `TreeEngine.remove`, `TreeEngine.traverse`).
  * **Granular View Switching**: Change `switchView(viewName)` so it only executes the render function of the active tab.
  * **CSS Section Collapsing**: Reorganize styles with clear visual comment dividers and consolidate duplicate utility classes.
* **Pros**: Lowest risk; minimal code churn; immediate payoff on code cleanliness; zero new tooling.
* **Cons**: Does not solve the maintainability ceiling of a 5,000+ line single file; recursive tree scans remain $O(N)$.

---

### Comparative Evaluation Matrix

| Metric | COA 1 (In-Place Namespaces) | COA 2 (Source Split + Bundler) | COA 3 (Reactive Proxy) | COA 4 (Surgical Clean-up) |
| :--- | :---: | :---: | :---: | :---: |
| **Maintainability** | High | **Superior** | High | Medium |
| **Air-Gap / Offline Integrity** | **100% Native** | **100% Native** | **100% Native** | **100% Native** |
| **Developer Ergonomics** | Moderate | **Superior** | Moderate | Low-Moderate |
| **Refactoring Risk** | Medium | Low-Medium | High | **Very Low** |
| **Runtime Performance** | High | Medium | **Superior** | Moderate |
| **Tooling Footprint** | None | Minimal (1 build script) | None | None |

---

### Recommended Phased Roadmap
1. **Phase 1 (Completed)**: Implemented **COA 2** by separating CSS, HTML, and JS into `/src/` with zero-dependency native scripts (`build.js` / `build.ps1`).
2. **Phase 2**: Implement the normalized in-memory index from **COA 1** to make task and member lookups $O(1)$.
3. **Phase 3**: Build upcoming backlog features (Meetings & Minutes, Risk Register, Audit Logs) inside isolated modular files.

## License

Apache License 2.0. See [LICENSE](LICENSE) for full details.

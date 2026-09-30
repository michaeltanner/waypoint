# Waypoint — Standalone Project & Portfolio Engine

> **Zero Dependencies** • **100% Air-Gapped & Offline Native** • **Build Time: ~12ms** • **Target: Modern Browsers (Chromium, Edge, Firefox, Safari)**

Waypoint is a single-file, zero-dependency project and portfolio management application engineered specifically for air-gapped, offline, and restricted network defense and enterprise environments.

## Overview

Waypoint runs entirely inside the client browser as a standalone HTML5 application. It requires no backend server, database, node runtime, build pipeline, or internet connection. All data persistence relies on local browser storage (`localStorage`) and standard JSON file import/export.

### 🛡️ Air-Gap & Privacy Assurance
* **Zero Outbound Telemetry / Zero CDNs**: All styling, SVG icons, fonts, and scripts are embedded natively. The application never initiates external network requests (`fetch`/`XHR` are only used for local client-side blob generation).
* **Client-Only Persistence**: All data stays within browser memory and local user-selected files. No telemetry, third-party analytics, or cloud sync backdoors exist.
* **Direct File System Access**: Uses the modern HTML5 File System Access API (`window.showSaveFilePicker`) for native disk saving when supported, with seamless automatic fallback to client-side blob download in restricted environments.

---

## Key Features

### 1. Portfolio Hierarchy
Multi-level nested workstream tree supporting Objectives, Projects, Key Results, Tasks, and Milestones. Includes automatic completion percentage rollups, single-root project enforcement, accordion toggles, and filterable blocker indicators. Includes user-configurable hierarchy levels, labels, and icons.

### 2. Interactive Timeline & Gantt Chart
Visual schedule display with scale switching across Day, Week, Month, and Year modes. Features interactive drag-and-drop bar rescheduling and side handles for duration adjustments.

### 3. Kanban Board
Drag-and-drop operational board organized into Not Started, In Progress, Blocked, and Done columns. Includes swimlane matrix views grouped by Parent Workstream (LOE), Assigned Lead, or Item Type, with real-time type filtering.

### 4. Dedicated Team Roster
Separate tab view for workspace personnel management. Tracks team leads, engineering roles, email contacts, and phone numbers with assignment capabilities and cascading team inheritance down task branches.

### 5. Slide-Out Inspector Drawer
Detailed item inspection with in-line editing, 85vw expanded reading mode, rich text notes editor (supporting bold, italic, sub-lists, highlights, blockquotes), end-state vision tracking, and tactical Definition of Done (DoD) criteria. Features an anchored, two-row responsive action header.

### 6. Workspace Launcher Hub & Session Persistence
* **Clean State Launch**: Starts with a clean hub instead of preloading dummy data.
* **1-Click Built-in Example**: Instant interactive load of the canonical demonstration dataset (*Operation Sentinel Dawn*).
* **Drag-and-Drop Dropzone**: Drag any `.json` file anywhere onto the page to load immediately.
* **Recent Workspaces**: Local memory tracks recently opened portfolios with item counts and timestamps for fast switching.
* **Save / Save As Workflow**: Direct file overwrite via `Ctrl+S`, `Save As...` via `Ctrl+Shift+S`, and visual dirty-state indicators (`*`).
* **Unsaved Changes Guard**: Closing a workspace triggers an interactive confirmation modal offering **Save & Close**, **Save As & Close**, **Discard & Close**, or **Cancel**.

### 7. Security Banners & Briefing Export
Top and bottom security classification banners (UNCLASSIFIED, CUI, or custom). High-contrast briefing layout optimized for 1-page browser print and PDF export.

---

## Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl + S` | **Save Workspace** (direct overwrite or save-as prompt) | Global |
| `Ctrl + Shift + S` | **Save Workspace As...** (prompt file destination) | Global |
| `Escape` | Dismiss active modal dialog or close slide-out inspector | Global |
| `Ctrl + B` | **Bold** selected text | Rich Text Inspector Editor |
| `Ctrl + I` | *Italic* selected text | Rich Text Inspector Editor |
| `Ctrl + U` | <u>Underline</u> selected text | Rich Text Inspector Editor |

---

## Deployment & Usage

Waypoint requires no server setup or installation. To deploy in an air-gapped or restricted environment:

1. Copy the standalone artifact `build/waypoint.html` to any local directory, workstation, or secure offline media drive.
2. Double-click `build/waypoint.html` to open directly in any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari).
3. The application starts cleanly in the **Workspace Launcher Hub**:
   * **🚀 Built-in Example**: Click to load the *Operation Sentinel Dawn* demo portfolio.
   * **📥 Open JSON Workspace**: Drag-and-drop a `.json` file or click to select from disk.
   * **➕ Create Blank Workspace**: Start fresh with an empty project, customizable OKR ladder, DoD criteria, and clean team directory.
   * **🕒 Recent Workspaces**: Quickly resume previous sessions.
4. Use the **📂 Workspace ▾** header menu at any time to open, save, save as, switch recent workspaces, or close the active session.

---

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

---

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

---

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

---

## License

Apache License 2.0. See [LICENSE](LICENSE) for full details.

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

1. Save `waypoint.html` and `waypoint.json` to any local directory.
2. Open `waypoint.html` in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).
3. Click **Import JSON** in the header to load `waypoint.json` or begin creating workstreams directly in the interface.
4. Click **Export JSON** at any time to save an authoritative snapshot of your workspace.

## Data Schema Specification

Waypoint uses a single-root nested JSON structure (`schemaVersion: 1`).

```json
{
  "schemaVersion": 1,
  "lastUpdated": "2026-09-28T21:00:00Z",
  "classification": "UNCLASSIFIED",
  "enums": {
    "type": ["objective", "key_result", "project", "task", "milestone"],
    "status": ["Not Started", "In Progress", "Blocked", "Done"],
    "health": ["Green", "Yellow", "Red"]
  },
  "teamRoster": [
    {
      "id": "tm-101",
      "name": "Marcus White",
      "role": "Executive Sponsor / VP of Technology",
      "email": "marcus.white@example.com",
      "officePhone": "555-0100",
      "cellPhone": "555-111-2222"
    }
  ],
  "tasks": [
    {
      "id": "t-001",
      "type": "objective",
      "title": "Operation Sentinel Dawn — Cyber Modernization Portfolio",
      "status": "In Progress",
      "health": "Yellow",
      "progress": 68,
      "leadId": "tm-101",
      "endStateVision": "Establish fully resilient, zero-trust digital networks across operational units.",
      "definitionOfDone": "All command nodes functional on zero-trust architecture with ATO sign-off.",
      "startDate": "2026-09-01",
      "dueDate": "2027-09-30",
      "subTasks": []
    }
  ]
}
```

## Upcoming Roadmap

* **Risk Register & 5x5 Risk Matrix**: Heatmap visualization for logging risk impact, likelihood, and mitigation strategies.
* **CSV Data Exporter**: Tabular export for tasks, schedules, and blocker logs.
* **Change Audit Tracker**: Historical log tracking workspace property edits over time.

## License

Apache License 2.0. See [LICENSE](LICENSE) for full details.

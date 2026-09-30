const SCHEMA_VERSION = 2;
    const CACHE_KEY = "WAYPOINT_WORKSPACE_CACHE_V11";
    const RECENT_HISTORY_KEY = "WAYPOINT_RECENT_WORKSPACES_V1";

    let state = {
      schemaVersion: SCHEMA_VERSION,
      lastUpdated: new Date().toISOString(),
      classification: "UNCLASSIFIED",
      enums: {
        type: ["project", "objective", "key_result", "task", "milestone"],
        status: ["Not Started", "In Progress", "Blocked", "Completed"],
        health: ["Green", "Yellow", "Red"]
      },
      hierarchy: [
        { level: 0, type: "project", label: "Project", icon: "📁" },
        { level: 1, type: "objective", label: "Objective", icon: "🎯" },
        { level: 2, type: "key_result", label: "Key Result", icon: "📊" },
        { level: 3, type: "task", label: "Task", icon: "📋" }
      ],
      memberFlags: ["primary", "support", "inactive"],
      teamRoster: [],
      tasks: []
    };

    let activeFilterId = null;
    let searchQuery = "";
    let showBlockedOnly = false;
    let isWorkspaceDirty = false;
    let currentTreeSort = "dueDate";
    let kanbanGroupBy = "project";
    let kanbanActiveTypeFilters = new Set(["objective", "key_result", "task", "milestone"]);
    let teamActiveTagFilter = "all";

    // --- HYBRID ID & UUID ENGINE ---
    function generateUUID() {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        try { return crypto.randomUUID(); } catch (e) { }
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    function generateDisplayId(type, existingTasks = state.tasks) {
      const prefixMap = {
        project: "PRJ",
        objective: "OBJ",
        key_result: "KR",
        task: "TSK",
        milestone: "MS"
      };
      const prefix = prefixMap[type] || (type ? type.substr(0, 3).toUpperCase() : "ITM");
      let count = 0;
      function countPrefix(tasks) {
        if (!Array.isArray(tasks)) return;
        tasks.forEach(t => {
          const dId = t.displayId || t.id || "";
          if (dId.startsWith(prefix)) count++;
          if (t.subTasks) countPrefix(t.subTasks);
        });
      }
      countPrefix(existingTasks);
      return `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
    }

    function generateMemberDisplayId(existingMembers = state.teamRoster) {
      const count = (Array.isArray(existingMembers) ? existingMembers.length : 0) + 1;
      return `TM-${count.toString().padStart(3, '0')}`;
    }

    function isTaskCompleted(st) {
      return st === "Completed" || st === "Done";
    }

    function toggleBlockedFilter() {
      showBlockedOnly = !showBlockedOnly;
      renderAll();
    }
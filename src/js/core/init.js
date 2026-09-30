// --- INITIALIZATION ---
    window.addEventListener("DOMContentLoaded", async () => {
      initGlobalDragAndDrop();
      await loadInitialData();
      setClassification(state.classification || "UNCLASSIFIED");
      updateKanbanGroupByOptions();
      renderAll();
    });

    async function loadInitialData() {
      // Purge legacy cache keys V1 through V11
      ["WAYPOINT_WORKSPACE_CACHE_V1", "WAYPOINT_WORKSPACE_CACHE_V2", "WAYPOINT_WORKSPACE_CACHE_V3", "WAYPOINT_WORKSPACE_CACHE_V4", "WAYPOINT_WORKSPACE_CACHE_V5", "WAYPOINT_WORKSPACE_CACHE_V6", "WAYPOINT_WORKSPACE_CACHE_V7", "WAYPOINT_WORKSPACE_CACHE_V8", "WAYPOINT_WORKSPACE_CACHE_V9", "WAYPOINT_WORKSPACE_CACHE_V10", "WAYPOINT_WORKSPACE_CACHE_V11"].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) { }
      });

      // Initialize clean empty state (NO default JSON content loaded on page load!)
      resetEmptyState();
    }

    function resetEmptyState() {
      state = {
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
    }
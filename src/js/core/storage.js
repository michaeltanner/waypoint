let currentFileHandle = null;
let lastSavedToDiskTime = null;
let workspaceOpenedTime = null;

// --- WORKSPACE & FILE MANAGEMENT ENGINE (LAUNCHER, RECENTS & GLOBAL DROP) ---
    function loadWorkspaceFromObject(parsed, sourceLabel = "Workspace File") {
      if (!validateWorkspaceSchema(parsed)) {
        alert(`INVALID FILE: Schema validation failed!\nEnsure schemaVersion is ${SCHEMA_VERSION} and root 'tasks' array contains EXACTLY ONE primary root-level workstream item.`);
        return false;
      }
      state = parsed;
      migrateState(state);
      isWorkspaceDirty = false;
      activeFilterId = null;
      saveToCache(false);
      saveToRecentWorkspaces(state, sourceLabel);
      setClassification(state.classification || "UNCLASSIFIED");
      updateKanbanGroupByOptions();
      switchView("tree");
      renderAll();
      showClipboardToast(`Loaded "${state.tasks[0]?.title || sourceLabel}"`);
      return true;
    }

    function loadJSONFile(file) {
      if (!file) return;
      if (!file.name.endsWith(".json") && file.type && !file.type.includes("json")) {
        alert("Please select or drop a valid .json file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const parsed = JSON.parse(e.target.result);
          loadWorkspaceFromObject(parsed, file.name);
        } catch (err) {
          alert("ERROR: Failed to parse JSON file!\n" + err.message);
        }
      };
      reader.readAsText(file);
    }

    function loadBuiltinExample() {
      const sample = getBuiltinSampleData();
      loadWorkspaceFromObject(sample, "Operation Sentinel Dawn (Built-In)");
    }

    function createBlankWorkspace() {
      const newUuid = generateUUID();
      const blankState = {
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
        teamRoster: [
          {
            id: "TM-001",
            displayId: "TM-001",
            uuid: generateUUID(),
            name: "Program Director",
            role: "Portfolio Lead",
            email: "director@example.com",
            officePhone: "",
            cellPhone: "",
            flags: ["primary"],
            notes: "Lead director for portfolio"
          }
        ],
        tasks: [
          {
            id: "PRJ-001",
            displayId: "PRJ-001",
            uuid: newUuid,
            type: "project",
            title: "New Strategic Portfolio",
            status: "In Progress",
            health: "Green",
            progress: 0,
            leadId: "TM-001",
            endStateVision: "",
            definitionOfDone: "",
            startDate: new Date().toISOString().split("T")[0],
            dueDate: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
            notes: "",
            subTasks: []
          }
        ]
      };
      loadWorkspaceFromObject(blankState, "New Strategic Portfolio");
      openInspector("PRJ-001", true);
    }

    function requestCloseWorkspace() {
      if (!state.tasks || state.tasks.length === 0) return;
      if (isWorkspaceDirty) {
        if (!confirm("You have unsaved changes in this workspace. Close anyway without saving? Any unsaved edits will be lost.")) {
          return;
        }
      }
      closeCurrentWorkspace();
    }

    function closeCurrentWorkspace() {
      resetEmptyState();
      try { localStorage.removeItem(CACHE_KEY); } catch (e) { }
      isWorkspaceDirty = false;
      currentFileHandle = null;
      lastSavedToDiskTime = null;
      workspaceOpenedTime = null;
      activeFilterId = null;
      closeInspector();
      setClassification(state.classification || "UNCLASSIFIED");
      switchView("launcher");
      renderAll();
      updateSaveStatusUI();
      showClipboardToast("Workspace closed. Welcome to Waypoint!");
    }

    function getRecentWorkspaces() {
      try {
        const raw = localStorage.getItem(RECENT_HISTORY_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      } catch (e) {
        return [];
      }
    }

    function countAllTasks(tasks) {
      let count = 0;
      function walk(list) {
        if (!Array.isArray(list)) return;
        list.forEach(t => { count++; if (t.subTasks) walk(t.subTasks); });
      }
      walk(tasks);
      return count;
    }

    function saveToRecentWorkspaces(workspaceData, sourceLabel = "Workspace") {
      if (!workspaceData || !Array.isArray(workspaceData.tasks) || workspaceData.tasks.length === 0) return;
      try {
        const title = workspaceData.tasks[0]?.title || "Untitled Workspace";
        const list = getRecentWorkspaces();
        const filtered = list.filter(item => item.title !== title);
        const entry = {
          id: generateUUID(),
          title: title,
          classification: workspaceData.classification || "UNCLASSIFIED",
          itemCount: countAllTasks(workspaceData.tasks),
          memberCount: Array.isArray(workspaceData.teamRoster) ? workspaceData.teamRoster.length : 0,
          updatedAt: new Date().toISOString(),
          sourceLabel: sourceLabel || "Workspace File",
          data: JSON.parse(JSON.stringify(workspaceData))
        };
        filtered.unshift(entry);
        const trimmed = filtered.slice(0, 8);
        localStorage.setItem(RECENT_HISTORY_KEY, JSON.stringify(trimmed));
        renderHeaderRecentList();
      } catch (e) {
        console.error("Failed to save to recent workspaces", e);
      }
    }

    function openRecentWorkspace(recentId) {
      const list = getRecentWorkspaces();
      const found = list.find(item => item.id === recentId);
      if (found && found.data) {
        loadWorkspaceFromObject(found.data, found.sourceLabel || found.title);
      } else {
        alert("Could not load recent workspace.");
      }
    }

    function removeRecentWorkspace(recentId, e) {
      if (e) e.stopPropagation();
      try {
        const list = getRecentWorkspaces().filter(item => item.id !== recentId);
        localStorage.setItem(RECENT_HISTORY_KEY, JSON.stringify(list));
        renderWorkspaceLauncher();
        renderHeaderRecentList();
        showClipboardToast("Removed from recent history.");
      } catch (err) { }
    }

    function clearRecentHistory() {
      if (confirm("Clear all recent workspace history?")) {
        try { localStorage.removeItem(RECENT_HISTORY_KEY); } catch (e) { }
        renderWorkspaceLauncher();
        renderHeaderRecentList();
        showClipboardToast("Recent history cleared.");
      }
    }

function validateWorkspaceSchema(data) {
      if (!data || typeof data !== "object") return false;
      if (data.schemaVersion !== SCHEMA_VERSION) return false;
      if (!Array.isArray(data.tasks)) return false;
      if (data.tasks.length !== 1) return false;
      return true;
    }

    function updateSaveStatusUI() {
      const statusEl = document.getElementById("saveStatusText");
      const saveTag = document.getElementById("bottomSaveTag") || document.querySelector(".save-tag");
      const titleEl = document.getElementById("bottomWorkspaceTitle");

      if (titleEl) {
        if (!state.tasks || state.tasks.length === 0) {
          titleEl.innerText = "No Workspace Loaded";
        } else {
          const rootTitle = state.tasks[0]?.title || "Active Workspace";
          titleEl.innerText = rootTitle + (isWorkspaceDirty ? " *" : "");
          titleEl.title = rootTitle;
        }
      }

      if (!statusEl) return;

      if (!state.tasks || state.tasks.length === 0) {
        statusEl.innerText = "No Workspace";
        if (saveTag) {
          saveTag.style.borderColor = "rgba(255,255,255,0.15)";
          saveTag.style.color = "rgba(255,255,255,0.6)";
          const dot = saveTag.querySelector(".pulse-dot");
          if (dot) {
            dot.style.background = "rgba(255,255,255,0.4)";
            dot.style.boxShadow = "none";
          }
        }
        return;
      }

      if (isWorkspaceDirty) {
        statusEl.innerText = "Unsaved Changes";
        if (saveTag) {
          saveTag.style.borderColor = "rgba(245, 158, 11, 0.6)";
          saveTag.style.color = "#fcd34d";
          const dot = saveTag.querySelector(".pulse-dot");
          if (dot) {
            dot.style.background = "#f59e0b";
            dot.style.boxShadow = "0 0 8px #f59e0b";
          }
        }
      } else if (lastSavedToDiskTime) {
        statusEl.innerText = "Saved " + lastSavedToDiskTime;
        if (saveTag) {
          saveTag.style.borderColor = "rgba(255,255,255,0.2)";
          saveTag.style.color = "rgba(255,255,255,0.85)";
          const dot = saveTag.querySelector(".pulse-dot");
          if (dot) {
            dot.style.background = "var(--status-done)";
            dot.style.boxShadow = "0 0 8px var(--status-done)";
          }
        }
      } else {
        statusEl.innerText = "Opened " + (workspaceOpenedTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        if (saveTag) {
          saveTag.style.borderColor = "rgba(255,255,255,0.2)";
          saveTag.style.color = "rgba(255,255,255,0.85)";
          const dot = saveTag.querySelector(".pulse-dot");
          if (dot) {
            dot.style.background = "var(--accent)";
            dot.style.boxShadow = "0 0 8px var(--accent)";
          }
        }
      }
    }

    function saveToCache(isUserMutation = true) {
      if (!state || !Array.isArray(state.tasks) || state.tasks.length === 0) return;
      state.lastUpdated = new Date().toISOString();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(state));
        saveToRecentWorkspaces(state, state.tasks[0]?.title || "Active Workspace");
        if (isUserMutation) {
          isWorkspaceDirty = true;
        }
        updateSaveStatusUI();
      } catch (e) { }
    }

    function resetSampleData() {
      if (confirm("Reset workspace to default sample dataset (Operation Sentinel Dawn)?")) {
        seedSampleData();
        isWorkspaceDirty = false;
        setClassification(state.classification || "UNCLASSIFIED");
        renderAll();
        updateSaveStatusUI();
      }
    }

    async function handleSaveWorkspace() {
      if (!state.tasks || state.tasks.length === 0) {
        alert("No active workspace to save.");
        return;
      }
      if (currentFileHandle) {
        try {
          const writable = await currentFileHandle.createWritable();
          await writable.write(JSON.stringify(state, null, 2));
          await writable.close();
          lastSavedToDiskTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          isWorkspaceDirty = false;
          saveToCache(false);
          updateSaveStatusUI();
          showClipboardToast(`Saved changes to "${currentFileHandle.name}"`);
          return;
        } catch (err) {
          console.warn("Direct save to file handle failed, prompting Save As", err);
        }
      }
      await handleSaveAsWorkspace();
    }

    async function handleSaveAsWorkspace() {
      if (!state.tasks || state.tasks.length === 0) {
        alert("No active workspace to save.");
        return;
      }
      const titleSlug = (state.tasks[0]?.title || "waypoint").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
      const defaultFilename = `${titleSlug}.json`;

      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: defaultFilename,
            types: [{
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(JSON.stringify(state, null, 2));
          await writable.close();
          currentFileHandle = handle;
          lastSavedToDiskTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          isWorkspaceDirty = false;
          saveToCache(false);
          saveToRecentWorkspaces(state, handle.name);
          updateSaveStatusUI();
          showClipboardToast(`Saved workspace as "${handle.name}"`);
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            // User cancelled OS save dialog. Do not save, do not toast.
            return;
          }
          console.warn("showSaveFilePicker failed or not allowed, using browser download", err);
        }
      }

      exportJSON();
    }

    // --- JSON IMPORT / EXPORT ---
    function exportJSON() {
      if (!state.tasks || state.tasks.length === 0) {
        alert("No active workspace to export.");
        return;
      }

      const titleSlug = (state.tasks[0]?.title || "waypoint").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
      const filename = `${titleSlug}.json`;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);

      // Trigger browser download dialog
      downloadAnchor.click();
      downloadAnchor.remove();

      // Defer updating saved state until after the user dismisses the OS Save dialog
      const markSaved = () => {
        lastSavedToDiskTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        isWorkspaceDirty = false;
        saveToCache(false);
        saveToRecentWorkspaces(state, filename);
        updateSaveStatusUI();
        showClipboardToast(`Saved to "${filename}"`);
      };

      let resolved = false;
      const onFocus = () => {
        window.removeEventListener("focus", onFocus);
        if (!resolved) {
          resolved = true;
          markSaved();
        }
      };

      // Listen for window regaining focus when modal file dialog finishes
      setTimeout(() => {
        window.addEventListener("focus", onFocus, { once: true });
        // Fallback timer in case browser did not blur
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            window.removeEventListener("focus", onFocus);
            markSaved();
          }
        }, 1200);
      }, 300);
    }

    function importJSON(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      loadJSONFile(file);
      event.target.value = "";
    }

    // Warn User Before Closing Tab/Browser with Unsaved Changes
    window.addEventListener("beforeunload", (event) => {
      if (isWorkspaceDirty) {
        event.preventDefault();
        event.returnValue = "You have unsaved changes in your workspace. Please export your JSON file before closing!";
        return event.returnValue;
      }
    });
window.requestCloseWorkspace = requestCloseWorkspace;
window.closeCurrentWorkspace = closeCurrentWorkspace;
window.handleSaveWorkspace = handleSaveWorkspace;
window.handleSaveAsWorkspace = handleSaveAsWorkspace;

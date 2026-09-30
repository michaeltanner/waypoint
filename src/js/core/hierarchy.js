// --- SORTING ENGINE ---
    function setTreeSort(val) {
      currentTreeSort = val;
      renderAll();
    }

    function sortTasks(tasks, sortBy = currentTreeSort) {
      if (!Array.isArray(tasks)) return [];
      const copy = [...tasks];
      copy.sort((a, b) => {
        if (sortBy === "dueDate") {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortBy === "status") {
          const statusOrder = { "Blocked": 0, "In Progress": 1, "Not Started": 2, "Completed": 3, "Done": 3 };
          return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
        }
        if (sortBy === "health") {
          const healthOrder = { "Red": 0, "Yellow": 1, "Green": 2 };
          return (healthOrder[a.health] ?? 99) - (healthOrder[b.health] ?? 99);
        }
        if (sortBy === "progress") {
          return (b.progress || 0) - (a.progress || 0);
        }
        return 0;
      });
      return copy;
    }

    // --- HIERARCHY ENGINE ---
    function getTaskDepth(taskId, tasks = state.tasks, currentDepth = 0) {
      if (!taskId || !Array.isArray(tasks)) return -1;
      for (const t of tasks) {
        if (t.id === taskId || t.uuid === taskId || t.displayId === taskId) return currentDepth;
        if (t.subTasks && t.subTasks.length > 0) {
          const res = getTaskDepth(taskId, t.subTasks, currentDepth + 1);
          if (res !== -1) return res;
        }
      }
      return -1;
    }

    function getHierarchyTypeForDepth(depth) {
      const hierarchy = (state.hierarchy && state.hierarchy.length > 0)
        ? state.hierarchy
        : [
            { level: 0, type: "project" },
            { level: 1, type: "objective" },
            { level: 2, type: "key_result" },
            { level: 3, type: "task" }
          ];

      if (depth < 0) return hierarchy[0].type;
      if (depth < hierarchy.length) return hierarchy[depth].type;
      return hierarchy[hierarchy.length - 1].type;
    }

    function updateKanbanGroupByOptions() {
      const sel = document.getElementById("kanbanGroupBySelect");
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = "";

      const icons = { project: "📁", objective: "🎯", key_result: "📊", task: "📋", milestone: "◆" };

      state.hierarchy.forEach(h => {
        const opt = document.createElement("option");
        opt.value = h.type;
        opt.innerText = `${icons[h.type] || '📁'} By ${h.label ? (h.label.charAt(0).toUpperCase() + h.label.slice(1)) : h.type}`;
        if (h.type === currentVal) opt.selected = true;
        sel.appendChild(opt);
      });

      const optLead = document.createElement("option");
      optLead.value = "lead";
      optLead.innerText = "👤 By Assigned Lead";
      if (currentVal === "lead") optLead.selected = true;
      sel.appendChild(optLead);

      const optType = document.createElement("option");
      optType.value = "type";
      optType.innerText = "🏷️ By Item Type";
      if (currentVal === "type") optType.selected = true;
      sel.appendChild(optType);

      const optFlat = document.createElement("option");
      optFlat.value = "flat";
      optFlat.innerText = "🌐 Flat Board";
      if (currentVal === "flat") optFlat.selected = true;
      sel.appendChild(optFlat);
    }

    function scrollToMilestone(milestoneId) {
      if (!milestoneId) return;

      switchView('tree');

      if (showBlockedOnly) {
        showBlockedOnly = false;
      }

      function expandPath(tasks, targetId) {
        for (const t of tasks) {
          if (t.id === targetId) {
            expandedNodeIds.add(t.id);
            return true;
          }
          if (t.subTasks && t.subTasks.length > 0) {
            if (expandPath(t.subTasks, targetId)) {
              expandedNodeIds.add(t.id);
              return true;
            }
          }
        }
        return false;
      }
      expandPath(state.tasks, milestoneId);
      renderAll();

      let targetEl = document.getElementById(`node-${milestoneId}`);
      if (!targetEl) {
        activeFilterId = null;
        renderAll();
        targetEl = document.getElementById(`node-${milestoneId}`);
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.add("highlight-pulse");
        setTimeout(() => targetEl.classList.remove("highlight-pulse"), 2500);

        const foundTask = findTaskRecursive(state.tasks, milestoneId);
        if (foundTask) {
          openInspector(resolveCascadingProps(foundTask, null));
        }
      }
    }

    function migrateState(s) {
      if (!s) return;
      if (!s.hierarchy || !Array.isArray(s.hierarchy) || s.hierarchy.length === 0) {
        s.hierarchy = [
          { level: 0, type: "project", label: "Project", icon: "📁" },
          { level: 1, type: "objective", label: "Objective", icon: "🎯" },
          { level: 2, type: "key_result", label: "Key Result", icon: "📊" },
          { level: 3, type: "task", label: "Task", icon: "📋" }
        ];
      }
      if (!s.memberFlags || !Array.isArray(s.memberFlags)) {
        s.memberFlags = ["primary", "support", "inactive"];
      }
      if (s.enums) {
        s.enums.status = ["Not Started", "In Progress", "Blocked", "Completed"];
      }

      if (!Array.isArray(s.teamRoster)) {
        s.teamRoster = [];
      }
      if (s.teamRoster.length === 0 && s.tasks && s.tasks[0] && Array.isArray(s.tasks[0].teamMembers)) {
        s.teamRoster = JSON.parse(JSON.stringify(s.tasks[0].teamMembers));
      }

      // Hybrid ID Migration for Team Members
      s.teamRoster.forEach((m, idx) => {
        if (!m.uuid) m.uuid = generateUUID();
        if (!m.displayId) m.displayId = m.id || `TM-${(idx + 1).toString().padStart(3, '0')}`;
        if (!m.id) m.id = m.displayId;
        if (!Array.isArray(m.flags)) {
          m.flags = idx < 2 ? ["primary"] : (idx === s.teamRoster.length - 1 ? ["inactive"] : ["support"]);
        }
        if (m.notes === undefined) {
          m.notes = "";
        }
      });

      // Hybrid ID Migration for Tasks
      let prefixCounters = { project: 0, objective: 0, key_result: 0, task: 0, milestone: 0 };
      const prefixMap = { project: "PRJ", objective: "OBJ", key_result: "KR", task: "TSK", milestone: "MS" };

      function walkHybrid(tasks) {
        if (!Array.isArray(tasks)) return;
        tasks.forEach(t => {
          if (!t.uuid) t.uuid = generateUUID();
          if (!t.displayId) {
            t.displayId = t.id || `${prefixMap[t.type] || 'ITM'}-${((prefixCounters[t.type] || 0) + 1).toString().padStart(3, '0')}`;
            prefixCounters[t.type] = (prefixCounters[t.type] || 0) + 1;
          }
          if (!t.id) t.id = t.displayId;

          if (t.status === "Done") {
            t.status = "Completed";
          }
          if (t.status === "Completed") {
            t.progress = 100;
          }
          if (t.subTasks) walkHybrid(t.subTasks);
        });
      }
      if (Array.isArray(s.tasks)) walkHybrid(s.tasks);
    }

// --- CASCADING PROPERTY RESOLVER ---
    function resolveCascadingProps(task, parentContext) {
      const parent = parentContext || {};
      const parentMembers = parent.effectiveTeamMembers || parent.teamMembers || [];
      const teamMembers = (task && task.teamMembers && task.teamMembers.length > 0)
        ? task.teamMembers
        : parentMembers;

      const endStateVision = (task && task.endStateVision) || parent.effectiveVision || parent.endStateVision || "";
      const rootLeadId = (task && task.leadId) || parent.effectiveLeadId || parent.leadId || "";

      return {
        ...task,
        effectiveTeamMembers: teamMembers,
        effectiveVision: endStateVision,
        effectiveLeadId: rootLeadId
      };
    }

    function findTeamMember(id, resolvedTask) {
      if (!id) return null;
      // 1. Search global state.teamRoster
      if (Array.isArray(state.teamRoster)) {
        const match = state.teamRoster.find(tm => tm && (tm.id === id || tm.uuid === id || tm.displayId === id));
        if (match) return match;
      }
      // 2. Search effective team members
      if (resolvedTask && Array.isArray(resolvedTask.effectiveTeamMembers)) {
        const match = resolvedTask.effectiveTeamMembers.find(tm => tm && (tm.id === id || tm.uuid === id || tm.displayId === id));
        if (match) return match;
      }
      // 3. Search root workspace team members
      const rootMembers = (state.tasks && state.tasks[0] && state.tasks[0].teamMembers) || [];
      const matchRoot = rootMembers.find(tm => tm && (tm.id === id || tm.uuid === id || tm.displayId === id));
      if (matchRoot) return matchRoot;

      // 4. Search all collected team members from across workspace
      const allMembers = collectAllTeamMembers();
      const matchAll = allMembers.find(tm => tm && (tm.id === id || tm.uuid === id || tm.displayId === id));
      if (matchAll) return matchAll;

      return null;
    }
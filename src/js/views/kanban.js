// --- KANBAN BOARD RENDERER (GROUP BY HIERARCHY SWITCHER, POPOVER FILTER & LOE SWIMLANES) ---
    let collapsedSwimlaneIds = new Set();

    function toggleKanbanFilterPopover(e) {
      if (e) e.stopPropagation();
      const pop = document.getElementById("kanbanFilterPopover");
      if (!pop) return;
      const isOpening = pop.style.display === "none" || !pop.style.display;
      pop.style.display = isOpening ? "block" : "none";
      if (isOpening) renderKanbanFilterCheckboxes();
    }

    function renderKanbanFilterCheckboxes() {
      const container = document.getElementById("kanbanFilterCheckboxes");
      if (!container) return;
      container.innerHTML = "";

      const availableTypes = state.hierarchy.map(h => ({
        type: h.type,
        label: h.label || (h.type.charAt(0).toUpperCase() + h.type.slice(1).replace('_', ' ')),
        icon: h.icon || "📋"
      }));
      availableTypes.push({ type: "milestone", label: "Milestone", icon: "◆" });

      availableTypes.forEach(({ type, label, icon }) => {
        const isChecked = kanbanActiveTypeFilters.has(type);
        const row = document.createElement("label");
        row.style.cssText = "display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer;";
        row.innerHTML = `
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleKanbanTypeFilter('${type}', this.checked)">
          <span>${icon} ${label}</span>
        `;
        container.appendChild(row);
      });

      const badge = document.getElementById("kanbanFilterBadge");
      if (badge) badge.innerText = kanbanActiveTypeFilters.size;
    }

    function toggleKanbanTypeFilter(type, checked) {
      if (checked) {
        kanbanActiveTypeFilters.add(type);
      } else {
        kanbanActiveTypeFilters.delete(type);
      }
      const badge = document.getElementById("kanbanFilterBadge");
      if (badge) badge.innerText = kanbanActiveTypeFilters.size;
      renderKanbanBoard();
    }

    function resetKanbanTypeFilter() {
      kanbanActiveTypeFilters = new Set(["objective", "key_result", "task", "milestone"]);
      renderKanbanFilterCheckboxes();
      renderKanbanBoard();
    }

    window.addEventListener("click", () => {
      const pop = document.getElementById("kanbanFilterPopover");
      if (pop && pop.style.display === "block") pop.style.display = "none";
    });

    function setKanbanGroupBy(mode) {
      kanbanGroupBy = mode;
      const sel = document.getElementById("kanbanGroupBySelect");
      if (sel && sel.value !== mode) sel.value = mode;

      // Automatically update the filter to only show items below that hierarchy level
      const hIdx = state.hierarchy.findIndex(h => h.type === mode);
      if (hIdx !== -1) {
        const typesBelow = new Set();
        for (let i = hIdx + 1; i < state.hierarchy.length; i++) {
          typesBelow.add(state.hierarchy[i].type);
        }
        typesBelow.add("milestone");
        kanbanActiveTypeFilters = typesBelow;
        const badge = document.getElementById("kanbanFilterBadge");
        if (badge) badge.innerText = kanbanActiveTypeFilters.size;
      }
      renderKanbanBoard();
    }

    function toggleSwimlane(groupId) {
      if (collapsedSwimlaneIds.has(groupId)) {
        collapsedSwimlaneIds.delete(groupId);
      } else {
        collapsedSwimlaneIds.add(groupId);
      }
      renderKanbanBoard();
    }

    function renderKanbanBoard() {
      const container = document.getElementById("kanbanBoardContainer");
      if (!container) return;
      container.innerHTML = "";

      const sel = document.getElementById("kanbanGroupBySelect");
      if (sel && sel.value !== kanbanGroupBy) sel.value = kanbanGroupBy;

      const badge = document.getElementById("kanbanFilterBadge");
      if (badge) badge.innerText = kanbanActiveTypeFilters.size;

      // 1. Gather all tasks with ancestor chain context
      const flatTasks = [];
      function collect(tasks, parentResolved = null, ancestorChain = []) {
        tasks.forEach(t => {
          const resolved = resolveCascadingProps(t, parentResolved);
          const parentTitle = parentResolved ? parentResolved.title : "Top-Level Portfolio Focus";
          const parentId = parentResolved ? parentResolved.id : "root";
          const currentChain = [...ancestorChain, { id: t.id, title: t.title, type: t.type }];

          // Only include cards whose type is allowed by the active filter
          if (kanbanActiveTypeFilters.has(resolved.type)) {
            flatTasks.push({ resolved, parentTitle, parentId, ancestorChain: currentChain });
          }

          if (t.subTasks && t.subTasks.length > 0) {
            collect(t.subTasks, resolved, currentChain);
          }
        });
      }
      collect(state.tasks);

      const columns = ["Not Started", "In Progress", "Blocked", "Completed"];

      // 2. Build Sticky Status Column Headers
      const stickyHeader = document.createElement("div");
      stickyHeader.className = "kanban-sticky-header";
      columns.forEach(colName => {
        const head = document.createElement("div");
        head.className = "kanban-status-head";

        let colorStyle = "var(--text-main)";
        if (colName === "Blocked") colorStyle = "var(--status-blocked)";
        else if (colName === "Completed") colorStyle = "var(--status-done)";
        else if (colName === "In Progress") colorStyle = "var(--status-inprogress)";

        head.innerHTML = `
          <span style="color:${colorStyle};">${colName.toUpperCase()}</span>
          <span class="kanban-count-badge" id="kanban-status-count-${colName.replace(/\s+/g, '')}">0</span>
        `;
        stickyHeader.appendChild(head);
      });
      container.appendChild(stickyHeader);

      const globalColCounts = { "Not Started": 0, "In Progress": 0, "Blocked": 0, "Completed": 0 };

      // 3. Group Tasks into Swimlane Categories
      const groupsMap = new Map();
      const isHierarchyLevel = state.hierarchy.some(h => h.type === kanbanGroupBy);

      flatTasks.forEach(item => {
        const { resolved, parentTitle, parentId, ancestorChain } = item;
        let groupKey = "default";
        let groupTitle = "All Workstreams";
        let groupIcon = "🌐";

        if (isHierarchyLevel) {
          // Find ancestor matching kanbanGroupBy (excluding self)
          const matchingAncestor = ancestorChain.slice(0, -1).reverse().find(a => a.type === kanbanGroupBy);
          if (matchingAncestor) {
            groupKey = matchingAncestor.id;
            groupTitle = `${matchingAncestor.title}`;
            const hMeta = state.hierarchy.find(h => h.type === kanbanGroupBy);
            groupIcon = hMeta ? (hMeta.icon || "📁") : "📁";
          } else {
            groupKey = `other-${kanbanGroupBy}`;
            const hMeta = state.hierarchy.find(h => h.type === kanbanGroupBy);
            const levelLabel = hMeta ? (hMeta.label || hMeta.type) : kanbanGroupBy;
            groupTitle = `Other Workstreams (Outside ${levelLabel})`;
            groupIcon = "📁";
          }
        } else if (kanbanGroupBy === "lead") {
          const leadMember = findTeamMember(resolved.assigneeId || resolved.effectiveLeadId, resolved);
          groupKey = leadMember ? leadMember.id : "unassigned";
          groupTitle = `Leader: ${leadMember ? leadMember.name + (leadMember.role ? ' (' + (leadMember.role.split('/')[0] || '').trim() + ')' : '') : 'Unassigned'}`;
          groupIcon = "👤";
        } else if (kanbanGroupBy === "type") {
          groupKey = resolved.type;
          const hMeta = state.hierarchy.find(h => h.type === resolved.type);
          groupTitle = `Workstream Type: ${(hMeta && hMeta.label ? hMeta.label : resolved.type).toUpperCase()}`;
          groupIcon = resolved.type === "milestone" ? "◆" : (hMeta ? (hMeta.icon || "📁") : "📋");
        } else {
          groupKey = "flat";
          groupTitle = "All Workspace Workstreams";
          groupIcon = "🌐";
        }

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, { id: groupKey, title: groupTitle, icon: groupIcon, items: [] });
        }
        groupsMap.get(groupKey).items.push(item);
      });

      // 4. Render Swimlane Rows
      groupsMap.forEach((group, groupId) => {
        const isCollapsed = collapsedSwimlaneIds.has(groupId);

        const groupCols = { "Not Started": [], "In Progress": [], "Blocked": [], "Completed": [] };
        group.items.forEach(it => {
          let st = it.resolved.blocked ? "Blocked" : (it.resolved.status || "Not Started");
          if (st === "Done") st = "Completed";
          if (!groupCols[st]) st = "Not Started";
          groupCols[st].push(it);

          if (globalColCounts[st] !== undefined) globalColCounts[st]++;
        });

        const totalCount = group.items.length;
        const doneCount = groupCols["Completed"].length;
        const blockedCount = groupCols["Blocked"].length;
        const progressPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

        const swimlane = document.createElement("div");
        swimlane.className = "kanban-swimlane";

        // Swimlane Header
        const head = document.createElement("div");
        head.className = "kanban-swimlane-head";
        head.onclick = () => toggleSwimlane(groupId);
        head.innerHTML = `
          <div class="kanban-swimlane-title">
            <button class="accordion-toggle-btn" style="pointer-events:none;">${isCollapsed ? '▶' : '▼'}</button>
            <span>${group.icon} ${group.title}</span>
          </div>
          <div style="display:flex; align-items:center; gap:16px; font-size:12px; color:var(--text-muted);">
            ${blockedCount > 0 ? `<span style="color:var(--status-blocked); font-weight:800;">⚠️ ${blockedCount} Blocked</span>` : ''}
            <span>${doneCount}/${totalCount} Completed (${progressPct}%)</span>
            <div class="progress-bar-track" style="width:60px; margin:0;">
              <div class="progress-bar-fill" style="width:${progressPct}%;"></div>
            </div>
          </div>
        `;
        swimlane.appendChild(head);

        // Swimlane 4-Column Grid
        if (!isCollapsed) {
          const grid = document.createElement("div");
          grid.className = "kanban-swimlane-grid";

          columns.forEach(colName => {
            const colEl = document.createElement("div");
            colEl.className = "kanban-col";
            colEl.setAttribute("data-status", colName);

            colEl.ondragover = (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              colEl.classList.add("drag-hover");
            };

            colEl.ondragleave = () => {
              colEl.classList.remove("drag-hover");
            };

            colEl.ondrop = (e) => {
              e.preventDefault();
              colEl.classList.remove("drag-hover");
              const taskId = e.dataTransfer.getData("text/plain");
              if (taskId) {
                moveTaskToStatus(taskId, colName);
              }
            };

            const colItems = groupCols[colName] || [];
            colEl.innerHTML = `
              <div class="kanban-col-head">
                <span style="font-size:10px; color:var(--text-muted);">${colName.toUpperCase()}</span>
                <span class="kanban-count-badge">${colItems.length}</span>
              </div>
            `;

            colItems.forEach(({ resolved, parentTitle }) => {
              const assigneeMember = findTeamMember(resolved.assigneeId || resolved.effectiveLeadId, resolved);
              const isCompleted = isTaskCompleted(resolved.status);

              const card = document.createElement("div");
              card.className = "kanban-card" + (isCompleted ? " is-completed" : "");
              card.setAttribute("draggable", "true");
              card.setAttribute("data-id", resolved.id);

              card.ondragstart = (e) => {
                e.stopPropagation();
                e.dataTransfer.setData("text/plain", resolved.id);
                e.dataTransfer.effectAllowed = "move";
                card.classList.add("dragging");
              };

              card.ondragend = () => {
                card.classList.remove("dragging");
              };

              card.onclick = (e) => { e.stopPropagation(); openInspector(resolved); };

              let dodHtml = resolved.definitionOfDone ? `
                <div style="font-size:10px; color:var(--status-done); font-weight:800;">☑️ DoD Defined</div>
              ` : "";

              card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span class="type-tag">${resolved.type}</span>
                    <span class="badge" style="font-size:9px; font-family:monospace; font-weight:700; color:var(--accent); background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.2);">${resolved.displayId || resolved.id}</span>
                  </div>
                  ${resolved.health ? `<span class="rag-dot rag-${resolved.health.toLowerCase()}"></span>` : ''}
                </div>
                ${kanbanGroupBy !== "project" ? `<div class="kanban-card-parent-tag" title="Parent: ${parentTitle}">📁 ${parentTitle}</div>` : ''}
                <div style="font-weight:700; font-size:13px; color:var(--text-main);">${resolved.title}</div>
                ${dodHtml}
                <div style="font-size:11px; color:var(--text-muted); display:flex; justify-content:space-between; margin-top:4px;">
                  <span>👤 ${assigneeMember ? assigneeMember.name : 'Unassigned'}</span>
                  <span>📅 ${resolved.dueDate || 'N/A'}</span>
                </div>
                <div class="progress-bar-track">
                  <div class="progress-bar-fill" style="width:${resolved.progress || 0}%;"></div>
                </div>
              `;
              colEl.appendChild(card);
            });

            grid.appendChild(colEl);
          });

          swimlane.appendChild(grid);
        }

        container.appendChild(swimlane);
      });

      // Update sticky column count badges
      columns.forEach(colName => {
        const badge = document.getElementById(`kanban-status-count-${colName.replace(/\s+/g, '')}`);
        if (badge) badge.innerText = globalColCounts[colName] || 0;
      });
    }

    function moveTaskToStatus(taskId, newStatus) {
      const task = findTaskRecursive(state.tasks, taskId);
      if (!task) return;

      if (newStatus === "Blocked") {
        task.status = "Blocked";
        task.blocked = true;
      } else if (newStatus === "Completed" || newStatus === "Done") {
        task.status = "Completed";
        task.blocked = false;
        task.progress = 100;
      } else if (newStatus === "In Progress") {
        task.status = "In Progress";
        task.blocked = false;
        if (task.progress >= 100) task.progress = 50;
      } else if (newStatus === "Not Started") {
        task.status = "Not Started";
        task.blocked = false;
        if (task.progress === undefined || task.progress === 100) task.progress = 0;
      }

      saveToCache();
      renderAll();

      saveToCache();
      renderAll();

      if (document.getElementById("detailDrawer").classList.contains("open")) {
        const updatedResolved = findTaskResolved(taskId);
        if (updatedResolved) openInspector(updatedResolved);
      }
    }

    let currentInspectorTaskId = null;
    let isDrawerInlineEdit = false;
    let isDrawerCreateMode = false;
    let drawerTargetParentId = "";
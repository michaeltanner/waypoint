// --- RENDER ALL VIEWS ---
    function renderAll() {
      updateLayoutForWorkspaceState();
      const isWorkspaceEmpty = !state.tasks || state.tasks.length === 0;
      if (isWorkspaceEmpty) {
        switchView("launcher");
        renderWorkspaceLauncher();
        return;
      }

      // If currently on launcher, switch to tree
      const activePane = document.querySelector(".view-pane.active");
      if (!activePane || activePane.id === "view-launcher") {
        switchView("tree");
      }

      renderSidebarTree();
      renderHeroObjective();
      renderProgressiveTree();
      renderGanttTimeline();
      renderKanbanBoard();
      renderTeamRadar();
    }

    // --- SIDEBAR TREE RENDERER ---
    function renderSidebarTree() {
      const container = document.getElementById("sidebarTreeContainer");
      container.innerHTML = "";

      const rootItem = document.createElement("div");
      rootItem.className = `sidebar-node ${activeFilterId === null ? 'active' : ''}`;
      rootItem.onclick = () => { activeFilterId = null; renderAll(); };
      rootItem.innerHTML = `<span>🌐 All Workspace Workstreams</span>`;
      container.appendChild(rootItem);

      state.tasks.forEach(t => container.appendChild(createSidebarTreeElement(t, 0)));
    }

    function createSidebarTreeElement(task, depth) {
      const wrapper = document.createElement("div");
      if (depth > 0) wrapper.className = "sidebar-indent";

      const item = document.createElement("div");
      item.className = `sidebar-node ${activeFilterId === task.id ? 'active' : ''}`;
      item.onclick = (e) => { e.stopPropagation(); activeFilterId = task.id; renderAll(); };

      const icon = (task.type === "objective" || task.type === "project") ? "📁" : (task.type === "milestone" ? "◆" : "📋");
      item.innerHTML = `<span>${icon} ${task.title}</span>`;
      wrapper.appendChild(item);

      if (task.subTasks && task.subTasks.length > 0) {
        task.subTasks.forEach(child => wrapper.appendChild(createSidebarTreeElement(child, depth + 1)));
      }

      return wrapper;
    }

    // --- PROMINENT HERO OBJECTIVE & ROLL-UP METRICS RENDERER ---
    function findTaskResolved(taskId) {
      if (!taskId) return null;
      const found = findTaskRecursive(state.tasks, taskId);
      if (!found) return null;

      function findParent(tasks, childId, parent = null) {
        for (const t of tasks) {
          if (t.id === childId) return parent;
          if (t.subTasks && t.subTasks.length > 0) {
            const res = findParent(t.subTasks, childId, t);
            if (res !== undefined) return res;
          }
        }
        return undefined;
      }
      const parentTask = findParent(state.tasks, taskId);
      const parentContext = parentTask ? resolveCascadingProps(parentTask, null) : null;
      return resolveCascadingProps(found, parentContext);
    }

    function renderHeroObjective() {
      const container = document.getElementById("heroObjectiveContainer");
      container.innerHTML = "";

      let targetTask = state.tasks[0];
      if (activeFilterId) {
        const found = findTaskRecursive(state.tasks, activeFilterId);
        if (found) targetTask = found;
      }

      if (!targetTask) return;

      const resolved = resolveCascadingProps(targetTask, null);
      const leadMember = findTeamMember(resolved.effectiveLeadId || resolved.leadId, resolved);

      // Compute operational metrics for target sub-tree
      let totalItems = 0;
      let doneItems = 0;
      let blockedCount = 0;
      let milestoneList = [];

      function walk(tasks) {
        tasks.forEach(t => {
          totalItems++;
          if (isTaskCompleted(t.status)) doneItems++;
          if (t.status === "Blocked" || t.blocked) blockedCount++;
          if (t.type === "milestone" && t.dueDate) milestoneList.push(t);
          if (t.subTasks) walk(t.subTasks);
        });
      }
      walk([targetTask]);

      milestoneList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      const nextMilestone = milestoneList.find(m => !isTaskCompleted(m.status)) || milestoneList[0];

      const completionPct = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

      const healthVal = resolved.health || "Green";
      const healthColor = healthVal === "Red" ? "var(--health-red)" : (healthVal === "Yellow" ? "var(--health-yellow)" : "var(--health-green)");
      const healthLabel = healthVal === "Red" ? "🔴 At Risk" : (healthVal === "Yellow" ? "🟡 Caution" : "🟢 On Track");

      // Build Team Members Roster Chips HTML
      const teamMembers = resolved.effectiveTeamMembers || [];
      let teamChipsHtml = "";
      if (teamMembers.length > 0) {
        teamChipsHtml = `
          <div class="team-chip-group" style="margin-top: 4px;">
            <span style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">ASSIGNED WORKSTREAM ROSTER (${teamMembers.length}):</span>
            ${teamMembers.map(tm => `<span class="team-chip" title="${tm.role} • ${tm.email}">👤 ${tm.name} <small style="opacity:0.75; font-size:10px;">(${tm.role.split('/')[0].trim()})</small></span>`).join('')}
          </div>
        `;
      }

      const card = document.createElement("div");
      card.className = "hero-objective-card" + (isTaskCompleted(resolved.status) ? " is-completed" : "");
      card.id = `node-${resolved.id}`;
      card.style.cursor = "pointer";
      card.onclick = () => openInspector(findTaskResolved(resolved.id));
      card.title = `Click to view full operational details for ${resolved.title} in Inspector Drawer`;

      card.innerHTML = `
        <div class="hero-title-group">
          <div>
            <div style="font-size:11px; font-weight:800; color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">
              PRIMARY WORKSTREAM FOCUS
            </div>
            <div class="hero-objective-title">
              <span>${resolved.title}</span>
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;" onclick="event.stopPropagation()">
            <span class="badge badge-${(resolved.status || 'notstarted').toLowerCase().replace(/\s+/g, '')}">${resolved.status}</span>
            <div class="row-add-slot">
              <button class="btn-subitem-chip" onclick="openCreateTaskDrawer('${resolved.id}')" title="Add sub-item under ${resolved.title}">➕ Add Sub-Item</button>
            </div>
          </div>
        </div>

        <div style="font-size:12px; color:var(--text-muted); display:flex; gap:16px; flex-wrap:wrap; align-items:center; margin-top:2px;">
          <span>👤 Lead: <strong>${leadMember ? leadMember.name : 'Unassigned'}</strong></span>
          <span>📅 Timeline: ${resolved.startDate || 'N/A'} → ${resolved.dueDate || 'N/A'}</span>
        </div>

        <div class="hero-metrics-grid" style="margin-top:12px;">
          <div class="stat-card" title="Overall completion percentage">
            <div class="stat-value" style="color:var(--accent);">${completionPct}%</div>
            <div class="stat-label">OVERALL COMPLETION</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${doneItems} of ${totalItems} Tasks Completed</div>
          </div>

          <div class="stat-card" title="Executive RAG status">
            <div class="stat-value" style="color:${healthColor}; font-size:20px;">${healthLabel}</div>
            <div class="stat-label">OPERATIONAL HEALTH</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Executive RAG Status</div>
          </div>

          <div class="stat-card ${showBlockedOnly ? 'active-filter' : ''}" onclick="event.stopPropagation(); toggleBlockedFilter();" title="Click to isolate blocked workstreams">
            <div class="stat-value" style="color:var(--status-blocked);">${blockedCount}</div>
            <div class="stat-label" style="display:flex; justify-content:space-between; align-items:center;">
              <span>BLOCKED ITEMS</span>
              <span style="font-size:10px; text-decoration:underline;">${showBlockedOnly ? '✕ CLEAR' : '🔍 FILTER'}</span>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
              ${showBlockedOnly ? 'Showing blocked items only' : 'Click to filter blocked items'}
            </div>
          </div>

          <div class="stat-card" onclick="event.stopPropagation(); scrollToMilestone('${nextMilestone ? nextMilestone.id : ''}');" title="Click to scroll to next milestone">
            <div class="stat-value" style="color:#f59e0b; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ◆ ${nextMilestone ? nextMilestone.dueDate : 'N/A'}
            </div>
            <div class="stat-label" style="display:flex; justify-content:space-between; align-items:center;">
              <span>NEXT MILESTONE</span>
              <span style="font-size:10px; text-decoration:underline;">📍 JUMP TO</span>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${nextMilestone ? nextMilestone.title : ''}">
              ${nextMilestone ? nextMilestone.title : 'No upcoming milestones'}
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    }

    // --- PROGRESSIVE DISCLOSURE TREE RENDERER (CLEAN 1-LINE NODES) ---
    let expandedNodeIds = new Set();

    function toggleAccordionNode(id, event) {
      if (event) event.stopPropagation();
      if (expandedNodeIds.has(id)) {
        expandedNodeIds.delete(id);
      } else {
        expandedNodeIds.add(id);
      }
      renderProgressiveTree();
    }

    function expandAllNodes() {
      function collect(tasks) {
        tasks.forEach(t => {
          expandedNodeIds.add(t.id);
          if (t.subTasks) collect(t.subTasks);
        });
      }
      collect(state.tasks);
      renderProgressiveTree();
    }

    function collapseAllNodes() {
      expandedNodeIds.clear();
      renderProgressiveTree();
    }

    function renderProgressiveTree() {
      const container = document.getElementById("progressiveTreeContainer");
      container.innerHTML = "";

      if (!state.tasks || state.tasks.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:40px 20px; background:var(--bg-glass); border:1px dashed var(--border-glow); border-radius:12px;">
            <div style="font-size:32px; margin-bottom:8px;">🚀</div>
            <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-bottom:4px;">No Workstream Items Found</div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">Your workspace is currently empty. Create your first top-level objective or project to get started.</div>
            <button class="btn btn-gradient" onclick="openCreateTaskDrawer('')" style="padding:8px 22px; font-size:13px; font-weight:700;">
              ➕ Add Workstream Item
            </button>
          </div>
        `;
        return;
      }

      let focusedTask = state.tasks[0];
      if (activeFilterId) {
        const found = findTaskRecursive(state.tasks, activeFilterId);
        if (found) focusedTask = found;
      }

      if (!focusedTask) return;

      const resolvedFocused = resolveCascadingProps(focusedTask, null);

      // Sub-items of the focused workstream ONLY (never duplicate focusedTask itself!)
      let targetItems = (focusedTask.subTasks && Array.isArray(focusedTask.subTasks)) ? focusedTask.subTasks : [];

      // Auto-expand nodes matching search query
      if (searchQuery && searchQuery.length > 0) {
        function autoExpandMatch(tasks) {
          tasks.forEach(t => {
            if (t.title.toLowerCase().includes(searchQuery)) {
              expandedNodeIds.add(t.id);
            }
            if (t.subTasks) autoExpandMatch(t.subTasks);
          });
        }
        autoExpandMatch(state.tasks);
      }

      // If blocked filter is active, filter items to show only blocked items
      if (showBlockedOnly) {
        function filterBlocked(items) {
          const res = [];
          items.forEach(it => {
            const isSelfBlocked = (it.status === "Blocked" || it.blocked);
            const subBlocked = it.subTasks ? filterBlocked(it.subTasks) : [];
            if (isSelfBlocked || subBlocked.length > 0) {
              expandedNodeIds.add(it.id);
              res.push({ ...it, subTasks: subBlocked });
            }
          });
          return res;
        }
        targetItems = filterBlocked(focusedTask.subTasks || []);

        const banner = document.createElement("div");
        banner.className = "vision-callout-box";
        banner.style.cssText = "border-color:var(--status-blocked); background:rgba(244,63,94,0.12); margin-bottom:12px;";
        banner.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div>
              <strong style="color:var(--status-blocked);">⚠️ FILTER ACTIVE:</strong> Displaying blocked workstreams requiring leadership intervention.
            </div>
            <button class="btn" onclick="toggleBlockedFilter()" style="font-size:11px; padding:3px 10px;">✕ Clear Filter</button>
          </div>
        `;
        container.appendChild(banner);
      }

      // Render Section Header with Sibling Sorting Selector
      const headerLabel = document.createElement("div");
      headerLabel.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;";
      headerLabel.innerHTML = `
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted);">
          Breakdown & Sub-Workstreams under "${focusedTask.title}"
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:5px;">
            <span style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Sort:</span>
            <select id="treeSortSelect" onchange="setTreeSort(this.value)" class="form-input" style="font-size:11px; padding:2px 8px; height:26px; width:auto; border-radius:6px;">
              <option value="dueDate" ${currentTreeSort === 'dueDate' ? 'selected' : ''}>📅 Due Date</option>
              <option value="title" ${currentTreeSort === 'title' ? 'selected' : ''}>🔤 Title (A-Z)</option>
              <option value="status" ${currentTreeSort === 'status' ? 'selected' : ''}>📊 Status</option>
              <option value="health" ${currentTreeSort === 'health' ? 'selected' : ''}>🚦 Health (RAG)</option>
              <option value="progress" ${currentTreeSort === 'progress' ? 'selected' : ''}>📈 Progress %</option>
            </select>
          </div>
          ${targetItems.length > 0 ? `
            <div style="display:flex; gap:6px; align-items:center;">
              <button class="btn" onclick="collapseAllNodes()" style="font-size:10px; padding:3px 10px;" title="Collapse all sub-element tree rows">▶ Collapse All</button>
              <button class="btn" onclick="expandAllNodes()" style="font-size:10px; padding:3px 10px;" title="Expand all sub-element tree rows">▼ Expand All</button>
            </div>
          ` : ''}
        </div>
      `;
      container.appendChild(headerLabel);

      const sortedTargetItems = sortTasks(targetItems);
      if (sortedTargetItems.length > 0) {
        sortedTargetItems.forEach(child => {
          container.appendChild(createProgressiveTreeNode(child, resolvedFocused));
        });

        // Inline Add Sub-Item button logically placed right under the child elements
        const addSubBtn = document.createElement("div");
        addSubBtn.style.cssText = "margin-top:8px; display:flex; justify-content:flex-start;";
        addSubBtn.innerHTML = `
          <button class="btn" onclick="openCreateTaskDrawer('${focusedTask.id}')" style="font-size:11px; color:var(--accent); border:1px dashed var(--border-glow); background:rgba(56,189,248,0.06); padding:5px 14px; border-radius:6px;" title="Add new sub-item under ${focusedTask.title}">
            ➕ Add Sub-Item under "${focusedTask.title}"
          </button>
        `;
        container.appendChild(addSubBtn);
      } else {
        // Empty children state: when focusedTask currently has no sub-elements
        const emptyBox = document.createElement("div");
        emptyBox.style.cssText = "padding:24px; text-align:center; background:var(--bg-glass); border:1px dashed var(--border-color); border-radius:8px; display:flex; flex-direction:column; align-items:center; gap:8px;";
        emptyBox.innerHTML = `
          <div style="font-size:12px; color:var(--text-muted);">No sub-items under <strong>${focusedTask.title}</strong> yet.</div>
          <button class="btn" onclick="openCreateTaskDrawer('${focusedTask.id}')" style="font-size:11px; color:var(--accent); border:1px dashed var(--border-glow); background:rgba(56,189,248,0.08); padding:6px 16px; border-radius:6px;" title="Add sub-item under ${focusedTask.title}">
            ➕ Add Sub-Item under "${focusedTask.title}"
          </button>
        `;
        container.appendChild(emptyBox);
      }
    }

    function createProgressiveTreeNode(task, parentContext) {
      const resolved = resolveCascadingProps(task, parentContext);
      const isContainer = (resolved.type === "objective" || resolved.type === "project" || resolved.type === "key_result");
      const hasSubtasks = resolved.subTasks && resolved.subTasks.length > 0;
      const isTreeExpanded = expandedNodeIds.has(resolved.id);
      const isCompleted = isTaskCompleted(resolved.status);

      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.gap = "8px";

      if (isContainer) {
        // Executive Container Card (Clean 1-Line Node)
        const card = document.createElement("div");
        card.id = `node-${resolved.id}`;
        card.className = "exec-card collapsed-card" + (isCompleted ? " is-completed" : "");
        card.onclick = (e) => { e.stopPropagation(); openInspector(resolved); };

        const leadMember = findTeamMember(resolved.effectiveLeadId || resolved.leadId, resolved);
        const healthClass = resolved.health ? `rag-${resolved.health.toLowerCase()}` : "rag-green";
        const statusClass = `badge-${(resolved.status || 'notstarted').toLowerCase().replace(/\s+/g, '')}`;

        card.innerHTML = `
          <div class="exec-card-top" style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:12px;">
            <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
              ${hasSubtasks ? `
                <button class="accordion-toggle-btn" onclick="toggleAccordionNode('${resolved.id}', event)" title="${isTreeExpanded ? 'Collapse sub-elements' : 'Expand sub-elements'}">
                  ${isTreeExpanded ? '▼' : '▶'}
                </button>
              ` : `<span style="width:22px; height:22px; display:inline-block;"></span>`}
              <span class="rag-dot ${healthClass}"></span>
              <span class="type-tag">${resolved.type}</span>
              <span class="badge" style="font-size:10px; font-family:monospace; font-weight:700; color:var(--accent); background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25);" title="Display Code: ${resolved.displayId || resolved.id}">${resolved.displayId || resolved.id}</span>
              <span style="font-size:15px; font-weight:800; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" onclick="openInspector(findTaskResolved('${resolved.id}'))" title="Click for Inspector Drawer">${resolved.title}</span>
            </div>

            <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
              <div style="font-size:11px; font-weight:700; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                <span>${resolved.progress || 0}%</span>
                <div class="progress-bar-track" style="width:45px; margin:0;">
                  <div class="progress-bar-fill" style="width:${resolved.progress || 0}%;"></div>
                </div>
              </div>
              <span style="font-size:12px; color:var(--text-muted);">👤 ${leadMember ? leadMember.name : 'Unassigned'}</span>
              <span class="badge ${statusClass}">${resolved.status}</span>
              <div class="row-add-slot">
                <button class="btn-subitem-chip" onclick="event.stopPropagation(); openCreateTaskDrawer('${resolved.id}')" title="Add sub-item under ${resolved.title}">➕ Add Sub-Item</button>
              </div>
            </div>
          </div>
        `;
        wrapper.appendChild(card);

        if (hasSubtasks) {
          const subContainer = document.createElement("div");
          subContainer.className = "subtree-container";
          subContainer.style.display = isTreeExpanded ? "flex" : "none";
          const sortedSub = sortTasks(resolved.subTasks);
          sortedSub.forEach(child => {
            subContainer.appendChild(createProgressiveTreeNode(child, resolved));
          });

          // Add inline button logically under existing tasks in this sub-tree
          const addSubBtn = document.createElement("div");
          addSubBtn.style.cssText = "margin-top:4px; padding-top:4px;";
          addSubBtn.innerHTML = `
            <button class="btn" onclick="event.stopPropagation(); openCreateTaskDrawer('${resolved.id}')" style="font-size:11px; color:var(--accent); border:1px dashed var(--border-glow); background:rgba(56,189,248,0.06); padding:4px 12px; border-radius:6px; cursor:pointer;" title="Add new sub-item under ${resolved.title}">
              ➕ Add Sub-Item under "${resolved.title}"
            </button>
          `;
          subContainer.appendChild(addSubBtn);

          wrapper.appendChild(subContainer);
        } else if (isTreeExpanded) {
          const emptySubContainer = document.createElement("div");
          emptySubContainer.className = "subtree-container";
          emptySubContainer.style.display = "flex";
          emptySubContainer.style.paddingLeft = "28px";
          emptySubContainer.innerHTML = `
            <button class="btn" onclick="event.stopPropagation(); openCreateTaskDrawer('${resolved.id}')" style="font-size:11px; color:var(--accent); border:1px dashed var(--border-glow); background:rgba(56,189,248,0.06); padding:4px 12px; border-radius:6px; cursor:pointer;" title="Add new sub-item under ${resolved.title}">
              ➕ Add Sub-Item under "${resolved.title}"
            </button>
          `;
          wrapper.appendChild(emptySubContainer);
        }

      } else {
        // Task / Milestone Action Row (Clean 1-Line Node)
        const row = document.createElement("div");
        row.id = `node-${resolved.id}`;
        row.className = "action-item-row" + (isCompleted ? " is-completed" : "");
        row.onclick = (e) => { e.stopPropagation(); openInspector(resolved); };

        const assigneeMember = findTeamMember(resolved.assigneeId, resolved);
        const statusClass = `badge-${(resolved.status || 'notstarted').toLowerCase().replace(/\s+/g, '')}`;
        const icon = resolved.type === "milestone" ? "◆" : "📋";
        const blockedBadge = resolved.blocked ? `<span class="badge badge-blocked">BLOCKED</span>` : "";

        row.innerHTML = `
          <div class="action-row-header">
            <div class="action-title-group" style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
              ${hasSubtasks ? `
                <button class="accordion-toggle-btn" onclick="toggleAccordionNode('${resolved.id}', event)" title="${isTreeExpanded ? 'Collapse sub-elements' : 'Expand sub-elements'}">
                  ${isTreeExpanded ? '▼' : '▶'}
                </button>
              ` : `<span style="width:22px; height:22px; display:inline-block;"></span>`}

              <span class="type-tag">${icon} ${resolved.type}</span>
              <span class="badge" style="font-size:10px; font-family:monospace; color:var(--text-muted); background:rgba(255,255,255,0.06); border:1px solid var(--border-color);" title="Display Code: ${resolved.displayId || resolved.id}">${resolved.displayId || resolved.id}</span>
              <span class="action-item-title">${resolved.title}</span>
              ${blockedBadge}
            </div>

            <div style="display:flex; align-items:center; gap:10px; font-size:12px; color:var(--text-muted); flex-shrink:0;">
              <span>👤 ${assigneeMember ? assigneeMember.name : 'Unassigned'}</span>
              <span>📅 Due: ${resolved.dueDate || 'N/A'}</span>
              <span class="badge ${statusClass}">${resolved.status}</span>
              <div class="row-add-slot">
                <button class="btn-subitem-chip" onclick="event.stopPropagation(); openCreateTaskDrawer('${resolved.id}')" title="Add sub-item under ${resolved.title}">➕ Add Sub-Item</button>
              </div>
            </div>
          </div>
        `;
        wrapper.appendChild(row);

        if (hasSubtasks) {
          const subContainer = document.createElement("div");
          subContainer.className = "subtree-container";
          subContainer.style.display = isTreeExpanded ? "flex" : "none";
          const sortedSub = sortTasks(resolved.subTasks);
          sortedSub.forEach(child => {
            subContainer.appendChild(createProgressiveTreeNode(child, resolved));
          });
          wrapper.appendChild(subContainer);
        }
      }

      return wrapper;
    }

    function findTaskRecursive(tasks, id) {
      if (!id || !Array.isArray(tasks)) return null;
      for (const t of tasks) {
        if (t.id === id || t.uuid === id || t.displayId === id) return t;
        if (t.subTasks && t.subTasks.length > 0) {
          const found = findTaskRecursive(t.subTasks, id);
          if (found) return found;
        }
      }
      return null;
    }
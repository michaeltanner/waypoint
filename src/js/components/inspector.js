// --- DETAIL INSPECTOR DRAWER (UNIFIED IN-LINE EDIT & VIEW ENGINE) ---
    function openInspector(resolvedTask, forceEditMode = false) {
      if (!resolvedTask) return;
      if (typeof resolvedTask === "string") {
        resolvedTask = findTaskResolved(resolvedTask);
      }
      if (!resolvedTask || !resolvedTask.id) return;

      currentInspectorTaskId = resolvedTask.id;
      isDrawerCreateMode = false;
      isDrawerInlineEdit = forceEditMode;

      const drawer = document.getElementById("detailDrawer");
      if (drawer) drawer.setAttribute("data-task-id", resolvedTask.id);

      renderDrawerContent();
      drawer.classList.add("open");
    }

    function openCreateTaskDrawer(parentId = "") {
      currentInspectorTaskId = null;
      if (!parentId && state.tasks && state.tasks.length >= 1) {
        parentId = state.tasks[0].id;
      }
      drawerTargetParentId = parentId;
      isDrawerCreateMode = true;
      isDrawerInlineEdit = true;

      const drawer = document.getElementById("detailDrawer");
      if (drawer) drawer.removeAttribute("data-task-id");

      renderDrawerContent();
      drawer.classList.add("open");
    }

    function toggleDrawerEditMode() {
      if (isDrawerCreateMode) {
        closeInspector();
        return;
      }
      isDrawerInlineEdit = !isDrawerInlineEdit;
      renderDrawerContent();
    }

    function renderDrawerContent() {
      const drawer = document.getElementById("detailDrawer");
      const title = document.getElementById("drawerTitle");
      const body = document.getElementById("drawerBody");
      const actions = document.getElementById("drawerHeaderActions");

      const isMaximized = drawer ? drawer.classList.contains("maximized") : false;

      if (isDrawerCreateMode) {
        title.innerText = "➕ Create Workstream Item";
        if (actions) {
          actions.innerHTML = `
            <button class="btn btn-gradient" onclick="submitDrawerInlineForm(event)" title="Save new item">💾 Create Item</button>
            <button class="btn" id="drawerMaximizeBtn" onclick="toggleInspectorMaximize()" title="Expand view">${isMaximized ? '🗗 Normal View' : '⤢ Expand View'}</button>
            <button class="btn" onclick="closeInspector()">✕ Close</button>
          `;
        }
        renderInlineDrawerForm(body, null, drawerTargetParentId);
        return;
      }

      const resolvedTask = findTaskResolved(currentInspectorTaskId);
      const rawTask = findTaskRecursive(state.tasks, currentInspectorTaskId) || resolvedTask;
      if (!resolvedTask || !rawTask) {
        closeInspector();
        return;
      }

      const itemType = (rawTask.type || resolvedTask.type || "").toUpperCase();
      const itemTitle = rawTask.title || resolvedTask.title;

      if (isDrawerInlineEdit) {
        title.innerText = `✏️ Edit: ${itemTitle}`;
        if (actions) {
          actions.innerHTML = `
            <button class="btn btn-gradient" onclick="submitDrawerInlineForm(event)" title="Save changes">💾 Save</button>
            <button class="btn" onclick="toggleDrawerEditMode()" title="Cancel editing">👁️ View Mode</button>
            <button class="btn" onclick="deleteCurrentInspectorItem()" style="color:var(--status-blocked); border-color:rgba(244,63,94,0.4);" title="Delete item">🗑️ Delete</button>
            <button class="btn" id="drawerMaximizeBtn" onclick="toggleInspectorMaximize()" title="Expand view">${isMaximized ? '🗗 Normal View' : '⤢ Expand View'}</button>
            <button class="btn" onclick="closeInspector()">✕ Close</button>
          `;
        }

        function findParentId(tasks, targetId, currP = "") {
          for (const t of tasks) {
            if (t.id === targetId) return currP;
            if (t.subTasks && t.subTasks.length > 0) {
              const res = findParentId(t.subTasks, targetId, t.id);
              if (res !== undefined) return res;
            }
          }
          return undefined;
        }
        const parentId = findParentId(state.tasks, rawTask.id) || "";

        renderInlineDrawerForm(body, rawTask, parentId);
      } else {
        title.innerText = `${itemType}: ${itemTitle}`;
        if (actions) {
          actions.innerHTML = `
            <button class="btn" onclick="toggleDrawerEditMode()" title="Edit item properties in-line">✏️ Edit In-Line</button>
            <button class="btn" onclick="deleteCurrentInspectorItem()" style="color:var(--status-blocked); border-color:rgba(244,63,94,0.4);" title="Delete item from workspace">🗑️ Delete</button>
            <button class="btn" id="drawerMaximizeBtn" onclick="toggleInspectorMaximize()" title="Expand view">${isMaximized ? '🗗 Normal View' : '⤢ Expand View'}</button>
            <button class="btn" onclick="closeInspector()">✕ Close</button>
          `;
        }

        renderInlineDrawerView(body, rawTask, resolvedTask);
      }
    }

    function renderInlineDrawerView(body, rawTask, resolvedTask) {
      // 0. Hybrid Identity (Display ID + Immutable GUID)
      const displayId = rawTask.displayId || rawTask.id || "N/A";
      const uuid = rawTask.uuid || "N/A";
      const hybridIdHtml = `
        <div class="inspector-section" style="padding:10px 12px; margin-bottom:12px; background:var(--bg-glass); border-radius:8px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">DISPLAY ID:</span>
            <span class="badge" style="font-size:11px; font-family:monospace; font-weight:700; color:var(--accent); background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25);">${displayId}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:10px; font-weight:800; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.5px;">UUID:</span>
            <span style="font-size:10px; font-family:monospace; color:var(--text-muted); background:var(--bg-input); padding:2px 6px; border-radius:4px; border:1px solid var(--border-color); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${uuid}">${uuid}</span>
            <button type="button" class="btn" onclick="navigator.clipboard.writeText('${uuid}'); showClipboardToast('Copied UUID to clipboard!');" style="font-size:10px; padding:2px 6px;" title="Copy UUID to clipboard">📋</button>
          </div>
        </div>
      `;

      // 1. Team Roster & Contacts (only display if explicitly defined on this task entity)
      let teamHtml = "";
      if (Array.isArray(rawTask.teamMembers) && rawTask.teamMembers.length > 0) {
        teamHtml = `
          <div class="inspector-section">
            <span class="inspector-section-label">Team Roster & Contacts</span>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${rawTask.teamMembers.map(tm => `
                <div class="contact-card-box">
                  <div style="font-weight:700; font-size:13px;">👤 ${tm.name}</div>
                  <div style="color:var(--text-muted); font-size:11px;">${tm.role}</div>
                  <div style="margin-top:4px;">📧 <a href="mailto:${tm.email}" style="color:var(--accent); font-weight:600;">${tm.email}</a></div>
                  <div>🏢 DSN: ${tm.officePhone || 'N/A'} | 📱 Cell: ${tm.cellPhone || 'N/A'}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      // 2. Strategic End-State Vision (only display if explicitly defined on this task entity)
      const explicitVision = rawTask.endStateVision || rawTask.vision;
      let visionHtml = "";
      if (explicitVision) {
        visionHtml = `
          <div class="inspector-section">
            <span class="inspector-section-label">Strategic End-State Vision</span>
            <div class="vision-callout-box">${explicitVision}</div>
          </div>
        `;
      }

      // 3. Tactical Definition of Done (DoD) (only display if explicitly defined on this task entity)
      let dodHtml = "";
      if (rawTask.definitionOfDone) {
        dodHtml = `
          <div class="inspector-section">
            <span class="inspector-section-label">Tactical Definition of Done (DoD)</span>
            <div class="dod-callout-box">${rawTask.definitionOfDone}</div>
          </div>
        `;
      }

      // 4. Lead / Assignee & Schedule (only display fields explicitly defined on this task entity)
      let explicitLeadId = rawTask.assigneeId || rawTask.leadId;
      let explicitLeadMember = explicitLeadId ? findTeamMember(explicitLeadId, resolvedTask) : null;

      let scheduleItems = [];
      if (explicitLeadMember) {
        scheduleItems.push(`<div>👤 Lead / Assignee: <strong>${explicitLeadMember.name}</strong></div>`);
      }
      if (rawTask.startDate) {
        scheduleItems.push(`<div>📅 Start Date: ${rawTask.startDate}</div>`);
      }
      if (rawTask.dueDate) {
        scheduleItems.push(`<div>📅 Target Due Date: ${rawTask.dueDate}</div>`);
      }
      if (rawTask.estimatedDuration) {
        scheduleItems.push(`<div>⏱️ Duration: ${rawTask.estimatedDuration}</div>`);
      }

      let scheduleHtml = "";
      if (scheduleItems.length > 0) {
        scheduleHtml = `
          <div class="inspector-section">
            <span class="inspector-section-label">Schedule & Lead</span>
            ${scheduleItems.join('')}
          </div>
        `;
      }

      // 5. Operational Status & Health
      const statusVal = rawTask.status || resolvedTask.status || "Not Started";
      const statusClass = statusVal.toLowerCase().replace(/\s+/g, '');
      let statusHtml = `
        <div class="inspector-section">
          <span class="inspector-section-label">Operational Status & Health</span>
          <div style="display:flex; gap:10px; align-items:center;">
            <span class="badge badge-${statusClass}">${statusVal}</span>
            ${rawTask.health ? `<span class="badge" style="background:rgba(255,255,255,0.08);">Health RAG: ${rawTask.health}</span>` : ''}
            ${rawTask.blocked ? `<span class="badge badge-blocked">BLOCKED</span>` : ''}
          </div>
        </div>
      `;

      // 6. Notes (only display if explicitly defined on this task entity)
      let notesHtml = "";
      if (rawTask.notes) {
        notesHtml = `
          <div class="inspector-section">
            <span class="inspector-section-label">Notes</span>
            <div class="contact-card-box rich-text-display">${rawTask.notes}</div>
          </div>
        `;
      }

      body.innerHTML = hybridIdHtml + statusHtml + visionHtml + dodHtml + scheduleHtml + teamHtml + notesHtml;
    }

    function handleDrawerStatusChange(status) {
      const progInput = document.getElementById("drawerFormProgress");
      const progVal = document.getElementById("drawerFormProgressVal");
      if (status === "Completed") {
        if (progInput) progInput.value = 100;
        if (progVal) progVal.innerText = "100%";
      } else if (status === "Not Started") {
        if (progInput && Number(progInput.value) === 100) {
          progInput.value = 0;
          if (progVal) progVal.innerText = "0%";
        }
      }
    }

    function handleDrawerProgressChange(val) {
      const num = Number(val);
      const progVal = document.getElementById("drawerFormProgressVal");
      if (progVal) progVal.innerText = num + "%";
      const statusSelect = document.getElementById("drawerFormStatus");
      if (statusSelect) {
        if (num === 100) {
          statusSelect.value = "Completed";
        } else if (statusSelect.value === "Completed" && num < 100) {
          statusSelect.value = "In Progress";
        }
      }
    }

    function renderInlineDrawerForm(container, task = null, defaultParentId = "") {
      const isNew = !task;
      const t = task || {};

      // Determine default type based on hierarchy depth ladder:
      // Depth 0 = Project, Depth 1 = Objective, Depth 2 = Key Result, Depth 3+ = Task
      const parentDepth = defaultParentId ? getTaskDepth(defaultParentId) : -1;
      const defaultTypeForNew = getHierarchyTypeForDepth(parentDepth + 1);
      const selectedType = isNew ? defaultTypeForNew : (t.type || 'task');

      let typeOptionsHtml = state.hierarchy.map(h => {
        const label = h.label || (h.type.charAt(0).toUpperCase() + h.type.slice(1).replace('_', ' '));
        return `<option value="${h.type}" ${selectedType === h.type ? 'selected' : ''}>${h.icon || '📋'} ${label}</option>`;
      }).join('');
      typeOptionsHtml += `<option value="milestone" ${selectedType === 'milestone' ? 'selected' : ''}>◆ Milestone (Target Event)</option>`;

      const displayId = t.displayId || t.id || "(Will be generated)";
      const uuid = t.uuid || "(Will be generated)";

      container.innerHTML = `
        <form id="drawerInlineForm" onsubmit="saveDrawerForm(event)" style="display:flex; flex-direction:column; gap:12px;">
          <input type="hidden" id="drawerFormId" value="${t.id || ''}">
          <input type="hidden" id="drawerFormUuid" value="${t.uuid || ''}">
          <input type="hidden" id="drawerFormDisplayId" value="${t.displayId || ''}">

          ${!isNew ? `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-glass); padding:6px 10px; border-radius:6px; border:1px solid var(--border-color); font-size:11px;">
              <div><strong style="color:var(--text-muted);">CODE:</strong> <span style="font-family:monospace; color:var(--accent); font-weight:700;">${displayId}</span></div>
              <div><strong style="color:var(--text-muted);">UUID:</strong> <span style="font-family:monospace; color:var(--text-dim);">${uuid.substr(0, 18)}...</span></div>
            </div>
          ` : ''}

          <div style="display:flex; gap:10px;">
            <div style="flex:1;">
              <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Item Type</label>
              <select id="drawerFormType" class="form-input" required style="width:100%; margin-top:4px;">
                ${typeOptionsHtml}
              </select>
            </div>
            <div style="flex:1;">
              <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Parent Workstream (LOE)</label>
              <select id="drawerFormParent" class="form-input" style="width:100%; margin-top:4px;" onchange="if(${isNew}) { const d = getTaskDepth(this.value); document.getElementById('drawerFormType').value = getHierarchyTypeForDepth(d + 1); }"></select>
            </div>
          </div>

          <div>
            <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Title / Name</label>
            <input type="text" id="drawerFormTitle" class="form-input" value="${t.title || ''}" placeholder="e.g. Identity Provider CAC/PKI Integration" required style="width:100%; margin-top:4px;">
          </div>

          <div style="display:flex; gap:10px;">
            <div style="flex:1;">
              <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Status</label>
              <select id="drawerFormStatus" class="form-input" style="width:100%; margin-top:4px;" onchange="handleDrawerStatusChange(this.value)">
                <option value="Not Started" ${(t.status === 'Not Started') ? 'selected' : ''}>Not Started</option>
                <option value="In Progress" ${(!t.status || t.status === 'In Progress') ? 'selected' : ''}>In Progress</option>
                <option value="Blocked" ${(t.status === 'Blocked') ? 'selected' : ''}>Blocked</option>
                <option value="Completed" ${(t.status === 'Completed' || t.status === 'Done') ? 'selected' : ''}>Completed</option>
              </select>
            </div>
            <div style="flex:1;">
              <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Health RAG</label>
              <select id="drawerFormHealth" class="form-input" style="width:100%; margin-top:4px;">
                <option value="Green" ${(!t.health || t.health === 'Green') ? 'selected' : ''}>🟢 Green</option>
                <option value="Yellow" ${(t.health === 'Yellow') ? 'selected' : ''}>🟡 Yellow</option>
                <option value="Red" ${(t.health === 'Red') ? 'selected' : ''}>🔴 Red</option>
              </select>
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Completion Progress</label>
              <span id="drawerFormProgressVal" style="font-weight:800; color:var(--accent); font-size:12px;">${t.progress || 0}%</span>
            </div>
            <input type="range" id="drawerFormProgress" min="0" max="100" value="${t.progress || 0}" class="form-input" style="width:100%; margin-top:4px;" oninput="handleDrawerProgressChange(this.value)">
          </div>

          <div style="display:flex; gap:10px;">
            <div style="flex:1;">
              <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Start Date</label>
              <input type="date" id="drawerFormStartDate" class="form-input" value="${t.startDate || ''}" style="width:100%; margin-top:4px;">
            </div>
            <div style="flex:1;">
              <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Target Due Date</label>
              <input type="date" id="drawerFormDueDate" class="form-input" value="${t.dueDate || ''}" style="width:100%; margin-top:4px;">
            </div>
          </div>

          <div>
            <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Lead / Assignee</label>
            <select id="drawerFormLead" class="form-input" style="width:100%; margin-top:4px;"></select>
          </div>

          <div>
            <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Tactical Definition of Done (DoD)</label>
            <textarea id="drawerFormDoD" class="form-input" rows="2" placeholder="Measurable completion criteria..." style="width:100%; margin-top:4px;">${t.definitionOfDone || ''}</textarea>
          </div>

          <div>
            <label class="form-label" style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Notes (Rich Text)</label>
            <div class="rich-text-wrapper" style="margin-top:4px;">
              <div class="rich-text-toolbar" onmousedown="event.preventDefault()">
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('bold')" title="Bold (Ctrl+B)"><b>B</b></button>
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('italic')" title="Italic (Ctrl+I)"><i>I</i></button>
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('underline')" title="Underline (Ctrl+U)"><u>U</u></button>
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('strikeThrough')" title="Strikethrough"><s>S</s></button>
                <span class="rt-divider"></span>
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('formatBlock', 'h3')" title="Heading"><b>H3</b></button>
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('insertUnorderedList')" title="Bullet List">• List</button>
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('insertOrderedList')" title="Numbered List">1. List</button>
                <span class="rt-divider"></span>
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('hiliteColor', 'rgba(56, 189, 248, 0.35)')" title="Highlight Text">🖍️ Highlight</button>
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('formatBlock', 'blockquote')" title="Blockquote">❝ Quote</button>
                <button type="button" class="rt-btn" onclick="window.execRichTextCommand('removeFormat')" title="Clear Formatting">🧹 Clear</button>
              </div>
              <div id="drawerFormNotesEditor" class="rich-text-editor" contenteditable="true" placeholder="Key operational context, briefing notes, lists, or requirements..." oninput="window.saveNotesSelection()" onmouseup="window.saveNotesSelection()" onkeyup="window.saveNotesSelection()">${t.notes || ''}</div>
            </div>
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:12px; padding-top:10px; border-top:1px solid var(--border-color);">
            <button type="button" class="btn" onclick="${isNew ? 'closeInspector()' : 'toggleDrawerEditMode()'}">Cancel</button>
            <button type="submit" class="btn btn-gradient">${isNew ? '➕ Create Workstream Item' : '💾 Save Changes'}</button>
          </div>
        </form>
      `;

      populateParentSelect(document.getElementById("drawerFormParent"), t.id || null, defaultParentId);
      populateLeadSelect(document.getElementById("drawerFormLead"), t.assigneeId || t.leadId || "");
    }

    function submitDrawerInlineForm(e) {
      if (e) e.preventDefault();
      const form = document.getElementById("drawerInlineForm");
      if (form) {
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        saveDrawerForm(e);
      }
    }

    function saveDrawerForm(e) {
      if (e) e.preventDefault();
      const id = document.getElementById("drawerFormId").value;
      const parentId = document.getElementById("drawerFormParent").value;
      const title = document.getElementById("drawerFormTitle").value.trim();
      const type = document.getElementById("drawerFormType").value;
      let status = document.getElementById("drawerFormStatus").value;
      const health = document.getElementById("drawerFormHealth").value;
      let progress = parseInt(document.getElementById("drawerFormProgress").value, 10) || 0;
      const startDate = document.getElementById("drawerFormStartDate").value;
      const dueDate = document.getElementById("drawerFormDueDate").value;
      const leadId = document.getElementById("drawerFormLead").value;
      const definitionOfDone = document.getElementById("drawerFormDoD").value.trim();

      const notesEditor = document.getElementById("drawerFormNotesEditor");
      const notes = notesEditor ? notesEditor.innerHTML.trim() : "";

      if (!title) return;

      // Status & Progress Coupling:
      if (status === "Completed" && progress < 100) {
        progress = 100;
      } else if (progress === 100 && status !== "Blocked") {
        status = "Completed";
      } else if (status === "Completed" && progress < 100) {
        status = "In Progress";
      }

      if (id) {
        // Update item
        const existing = findTaskRecursive(state.tasks, id);
        if (existing) {
          existing.title = title;
          existing.type = type;
          existing.status = status;
          existing.health = health;
          existing.progress = progress;
          existing.startDate = startDate;
          existing.dueDate = dueDate;
          existing.definitionOfDone = definitionOfDone;
          existing.notes = notes;

          if (!existing.uuid) existing.uuid = document.getElementById("drawerFormUuid")?.value || generateUUID();
          if (!existing.displayId) existing.displayId = document.getElementById("drawerFormDisplayId")?.value || existing.id || generateDisplayId(type);

          if (type === "task" || type === "milestone") {
            existing.assigneeId = leadId;
            delete existing.leadId;
          } else {
            existing.leadId = leadId;
            delete existing.assigneeId;
          }

          // Check if parent changed
          function removeChild(tasks, targetId) {
            for (let i = 0; i < tasks.length; i++) {
              if (tasks[i].id === targetId || tasks[i].uuid === targetId || tasks[i].displayId === targetId) return tasks.splice(i, 1)[0];
              if (tasks[i].subTasks && tasks[i].subTasks.length > 0) {
                const res = removeChild(tasks[i].subTasks, targetId);
                if (res) return res;
              }
            }
            return null;
          }

          function findCurrentParentId(tasks, targetId, currP = "") {
            for (const t of tasks) {
              if (t.id === targetId || t.uuid === targetId || t.displayId === targetId) return currP;
              if (t.subTasks && t.subTasks.length > 0) {
                const res = findCurrentParentId(t.subTasks, targetId, t.id);
                if (res !== undefined) return res;
              }
            }
            return undefined;
          }

          const currParentId = findCurrentParentId(state.tasks, id) || "";
          if (currParentId !== parentId) {
            const removed = removeChild(state.tasks, id);
            if (removed) {
              if (parentId) {
                const newParent = findTaskRecursive(state.tasks, parentId);
                if (newParent) {
                  if (!newParent.subTasks) newParent.subTasks = [];
                  newParent.subTasks.push(removed);
                } else {
                  state.tasks.push(removed);
                }
              } else {
                state.tasks.push(removed);
              }
            }
          }
        }

        saveToCache();
        renderAll();
        closeInspector();
        showClipboardToast(`Saved changes to "${title}"`, "💾");
      } else {
        // Create new item with Hybrid UUID & Display ID
        const newUuid = generateUUID();
        const newDisplayId = generateDisplayId(type);
        const newItem = {
          id: newDisplayId,
          uuid: newUuid,
          displayId: newDisplayId,
          type,
          title,
          status,
          health,
          progress,
          startDate,
          dueDate,
          definitionOfDone,
          notes,
          subTasks: []
        };

        if (type === "task" || type === "milestone") newItem.assigneeId = leadId;
        else newItem.leadId = leadId;

        if (parentId) {
          const parentObj = findTaskRecursive(state.tasks, parentId);
          if (parentObj) {
            if (!parentObj.subTasks) parentObj.subTasks = [];
            parentObj.subTasks.push(newItem);
            expandedNodeIds.add(parentId);
          } else {
            if (state.tasks.length === 0) {
              state.tasks.push(newItem);
            } else {
              if (!state.tasks[0].subTasks) state.tasks[0].subTasks = [];
              state.tasks[0].subTasks.push(newItem);
            }
          }
        } else {
          if (state.tasks.length === 0) {
            state.tasks.push(newItem);
          } else {
            if (!state.tasks[0].subTasks) state.tasks[0].subTasks = [];
            state.tasks[0].subTasks.push(newItem);
          }
        }

        saveToCache();
        renderAll();
        closeInspector();
        showClipboardToast(`Created "${title}"`, "➕");
      }
    }

    function closeInspector() {
      const drawer = document.getElementById("detailDrawer");
      drawer.classList.remove("open");
      drawer.classList.remove("maximized");
      isDrawerInlineEdit = false;
      isDrawerCreateMode = false;
      const btn = document.getElementById("drawerMaximizeBtn");
      if (btn) { btn.innerText = "⤢ Expand View"; btn.title = "Expand drawer to wide screen reading view"; }
    }

    // Keyboard Shortcut Listener: 'Esc' Key closes Inspector Drawer
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        const drawer = document.getElementById("detailDrawer");
        if (drawer && drawer.classList.contains("open")) {
          closeInspector();
        }
      }
    });

    // Outside Click Listener: Close Inspector Drawer when clicking outside of panel
    document.addEventListener("pointerdown", (e) => {
      const drawer = document.getElementById("detailDrawer");
      if (!drawer || !drawer.classList.contains("open")) return;

      // Do not close if clicking inside drawer
      if (drawer.contains(e.target)) {
        return;
      }

      // Do not close if clicking an element that opens inspector
      if (e.target.closest(".kanban-card, .exec-card, .action-item-row, .hero-objective-card, .frappe-gantt-bar-group, [onclick*='openInspector'], [onclick*='openCreateTaskDrawer']")) {
        return;
      }

      closeInspector();
    });

    function toggleInspectorMaximize() {
      const drawer = document.getElementById("detailDrawer");
      const btn = document.getElementById("drawerMaximizeBtn");
      drawer.classList.toggle("maximized");
      if (drawer.classList.contains("maximized")) {
        btn.innerText = "🗗 Normal View";
        btn.title = "Restore drawer to standard side panel size";
      } else {
        btn.innerText = "⤢ Expand View";
        btn.title = "Expand drawer to wide screen reading view";
      }
    }

    // --- WORKSTREAM ITEM CRUD HANDLERS ---
    function populateParentSelect(selectEl, currentTaskId = null, selectedParentId = "") {
      if (!selectEl) return;
      selectEl.innerHTML = "";

      const canBeRoot = (!state.tasks || state.tasks.length === 0) || (currentTaskId && state.tasks[0] && currentTaskId === state.tasks[0].id);

      if (canBeRoot) {
        const rootOpt = document.createElement("option");
        rootOpt.value = "";
        rootOpt.innerText = "(None - Primary Root Objective)";
        if (!selectedParentId) rootOpt.selected = true;
        selectEl.appendChild(rootOpt);
      }

      function walk(tasks, depth = 0) {
        tasks.forEach(t => {
          if (t.id === currentTaskId) return;
          const prefix = "— ".repeat(depth);
          const opt = document.createElement("option");
          opt.value = t.id;
          opt.innerText = `${prefix}${t.type.toUpperCase()}: ${t.title}`;
          if (t.id === selectedParentId) opt.selected = true;
          selectEl.appendChild(opt);
          if (t.subTasks) walk(t.subTasks, depth + 1);
        });
      }
      if (state.tasks) walk(state.tasks);
    }

    function populateLeadSelect(selectEl, selectedLeadId = "") {
      if (!selectEl) return;
      selectEl.innerHTML = `<option value="">Unassigned</option>`;

      const members = collectAllTeamMembers();
      members.forEach(tm => {
        const isInactive = Array.isArray(tm.flags) && tm.flags.includes("inactive");
        const opt = document.createElement("option");
        opt.value = tm.id;
        opt.innerText = `${tm.name} (${(tm.role || 'Member').split('/')[0].trim()})${isInactive ? ' [Inactive]' : ''}`;
        if (isInactive) opt.style.color = "var(--text-dim)";
        if (tm.id === selectedLeadId) opt.selected = true;
        selectEl.appendChild(opt);
      });
    }

    function editCurrentInspectorItem() {
      const drawer = document.getElementById("detailDrawer");
      const taskId = currentInspectorTaskId || (drawer ? drawer.getAttribute("data-task-id") : null);
      if (taskId) openInspector(taskId, true);
    }

    function deleteCurrentInspectorItem() {
      const drawer = document.getElementById("detailDrawer");
      const taskId = currentInspectorTaskId || (drawer ? drawer.getAttribute("data-task-id") : null);
      if (!taskId) return;
      deleteTaskRecursive(taskId);
    }

    function deleteTaskRecursive(taskId) {
      const task = findTaskRecursive(state.tasks, taskId);
      if (!task) return;

      const isRootTask = state.tasks[0] && state.tasks[0].id === taskId;
      const subCount = task.subTasks ? task.subTasks.length : 0;

      let msg = `Are you sure you want to delete "${task.title}"?`;
      if (isRootTask) {
        msg = `WARNING: "${task.title}" is the primary root objective. Deleting it will clear all ${subCount} sub-item(s) and reset the workspace. Are you sure?`;
      } else if (subCount > 0) {
        msg = `Are you sure you want to delete "${task.title}" and its ${subCount} sub-item(s)?`;
      }

      if (!confirm(msg)) return;

      if (isRootTask) {
        state.tasks = [];
      } else {
        function removeChild(tasks, targetId) {
          for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].id === targetId) {
              tasks.splice(i, 1);
              return true;
            }
            if (tasks[i].subTasks && tasks[i].subTasks.length > 0) {
              if (removeChild(tasks[i].subTasks, targetId)) return true;
            }
          }
          return false;
        }
        removeChild(state.tasks, taskId);
      }

      currentInspectorTaskId = null;
      saveToCache();
      closeInspector();
      renderAll();
    }
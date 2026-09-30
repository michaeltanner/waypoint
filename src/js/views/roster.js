// --- TEAM ROSTER RENDERER & PERSONNEL CRUD (TAGS, NOTES & EMAIL EXPORT) ---
    function collectAllTeamMembers() {
      const memberMap = new Map();
      if (state && Array.isArray(state.teamRoster)) {
        state.teamRoster.forEach(tm => {
          if (tm && tm.id) memberMap.set(tm.id, tm);
        });
      }
      function collect(tasks) {
        if (!Array.isArray(tasks)) return;
        tasks.forEach(t => {
          if (t.teamMembers) t.teamMembers.forEach(tm => {
            if (tm && tm.id && !memberMap.has(tm.id)) memberMap.set(tm.id, tm);
          });
          if (t.subTasks) collect(t.subTasks);
        });
      }
      if (state && Array.isArray(state.tasks)) collect(state.tasks);
      return Array.from(memberMap.values());
    }

    function setTeamTagFilter(tag) {
      teamActiveTagFilter = tag;
      renderTeamRadar();
    }

    function renderTeamTagFilterChips() {
      const container = document.getElementById("teamTagFilterChips");
      if (!container) return;
      container.innerHTML = "";

      const allFlags = ["all", ...(Array.isArray(state.memberFlags) ? state.memberFlags : ["primary", "support", "inactive"])];

      allFlags.forEach(flag => {
        const chip = document.createElement("button");
        chip.type = "button";
        const isActive = teamActiveTagFilter === flag;
        chip.style.cssText = `
          padding: 3px 12px;
          border-radius: 20px;
          font-size: 11px;
          cursor: pointer;
          font-weight: ${isActive ? '800' : '600'};
          background: ${isActive ? 'var(--accent)' : 'var(--bg-glass)'};
          color: ${isActive ? '#ffffff' : 'var(--text-muted)'};
          border: 1px solid ${isActive ? 'var(--accent)' : 'var(--border-color)'};
          transition: all 0.2s ease;
        `;
        chip.innerText = flag === "all" ? "🌐 ALL" : flag.toUpperCase();
        chip.onclick = () => setTeamTagFilter(flag);
        container.appendChild(chip);
      });
    }

    function renderTeamRadar() {
      const container = document.getElementById("teamRadarContainer") || document.getElementById("mainPageTeamRosterContainer");
      if (!container) return;
      container.innerHTML = "";

      renderTeamTagFilterChips();

      let members = collectAllTeamMembers();
      if (teamActiveTagFilter !== "all") {
        members = members.filter(m => Array.isArray(m.flags) && m.flags.includes(teamActiveTagFilter));
      }

      if (members.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); padding:10px 0; grid-column:1/-1;">No personnel matching the current filter. Click "Add Team Member" above or select another tag.</p>`;
        return;
      }

      members.forEach(tm => {
        const isInactive = Array.isArray(tm.flags) && tm.flags.includes("inactive");
        const card = document.createElement("div");
        card.className = "contact-card-box" + (isInactive ? " member-card-inactive" : "");
        card.style.cssText = "padding:14px; display:flex; flex-direction:column; justify-content:space-between; gap:10px;";

        let flagsHtml = "";
        if (Array.isArray(tm.flags) && tm.flags.length > 0) {
          flagsHtml = `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;">` +
            tm.flags.map(f => {
              const cls = f === "primary" ? "flag-primary" : (f === "support" ? "flag-support" : (f === "inactive" ? "flag-inactive" : ""));
              return `<span class="member-flag-badge ${cls}">${f.toUpperCase()}</span>`;
            }).join('') + `</div>`;
        }

        let notesHtml = tm.notes ? `
          <div class="member-notes-box">
            <span style="font-weight:700; color:var(--text-main);">📝 Notes:</span> ${tm.notes}
          </div>
        ` : "";

        card.innerHTML = `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div>
                <div style="font-size:14px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                  <span>👤 ${tm.name}</span>
                  <span class="badge" style="font-size:10px; font-family:monospace; font-weight:700; color:var(--accent); background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.25);" title="Display Code: ${tm.displayId || tm.id}">${tm.displayId || tm.id}</span>
                  ${isInactive ? `<span class="badge badge-blocked" style="font-size:9px; padding:1px 6px;">INACTIVE</span>` : ''}
                </div>
                <div style="font-size:11px; color:var(--accent); font-weight:700; margin-top:2px;">${tm.role}</div>
                ${flagsHtml}
              </div>
              <div style="display:flex; gap:4px; flex-shrink:0;">
                <button class="btn" onclick="event.stopPropagation(); openPersonnelModal('${tm.id}')" style="font-size:10px; padding:2px 6px;" title="Edit ${tm.name}">✏️</button>
                <button class="btn" onclick="event.stopPropagation(); deletePersonnel('${tm.id}')" style="font-size:10px; padding:2px 6px; color:var(--status-blocked); border-color:rgba(244,63,94,0.3);" title="Delete ${tm.name}">🗑️</button>
              </div>
            </div>
            <hr style="border:0; border-top:1px solid var(--border-color); margin:8px 0;">
            <div style="display:flex; flex-direction:column; gap:4px; font-size:11px; color:var(--text-muted);">
              <div>📧 <a href="mailto:${tm.email}" style="color:var(--accent); font-weight:600;">${tm.email || 'N/A'}</a></div>
              <div>🏢 DSN: ${tm.officePhone || 'N/A'}</div>
              <div>📱 Cell: ${tm.cellPhone || 'N/A'}</div>
            </div>
            ${notesHtml}
          </div>
        `;
        container.appendChild(card);
      });
    }

    function fallbackCopyText(text) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { }
      document.body.removeChild(ta);
    }

    function copyDisplayedTeamEmails() {
      let members = collectAllTeamMembers();
      if (teamActiveTagFilter !== "all") {
        members = members.filter(m => Array.isArray(m.flags) && m.flags.includes(teamActiveTagFilter));
      }
      const emails = members
        .filter(m => !(Array.isArray(m.flags) && m.flags.includes("inactive")))
        .map(m => m.email)
        .filter(e => e && e.includes("@"));

      if (emails.length === 0) {
        showClipboardToast("No valid active emails found in displayed list.");
        return;
      }

      const str = emails.join("; ");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(() => {
          showClipboardToast(`Copied ${emails.length} active email address(es) to clipboard!`);
        }).catch(() => {
          fallbackCopyText(str);
          showClipboardToast(`Copied ${emails.length} active email address(es) to clipboard!`);
        });
      } else {
        fallbackCopyText(str);
        showClipboardToast(`Copied ${emails.length} active email address(es) to clipboard!`);
      }
    }

    function copyFormattedTeamEmails() {
      let members = collectAllTeamMembers();
      if (teamActiveTagFilter !== "all") {
        members = members.filter(m => Array.isArray(m.flags) && m.flags.includes(teamActiveTagFilter));
      }
      const activeMembers = members.filter(m => !(Array.isArray(m.flags) && m.flags.includes("inactive")) && m.email && m.email.includes("@"));

      const toEmails = [];
      const ccEmails = [];

      activeMembers.forEach(m => {
        const flags = Array.isArray(m.flags) ? m.flags : [];
        if (flags.includes("support")) {
          ccEmails.push(m.email);
        } else {
          toEmails.push(m.email);
        }
      });

      if (toEmails.length === 0 && ccEmails.length === 0) {
        showClipboardToast("No valid active emails found in displayed list.");
        return;
      }

      const text = `To: ${toEmails.join("; ")}\nCc: ${ccEmails.join("; ")}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showClipboardToast(`Copied To (${toEmails.length}) & Cc (${ccEmails.length}) emails!`);
        }).catch(() => {
          fallbackCopyText(text);
          showClipboardToast(`Copied To (${toEmails.length}) & Cc (${ccEmails.length}) emails!`);
        });
      } else {
        fallbackCopyText(text);
        showClipboardToast(`Copied To (${toEmails.length}) & Cc (${ccEmails.length}) emails!`);
      }
    }

    function renderPersonnelFlagsCheckboxes(selectedFlags = []) {
      const container = document.getElementById("personnelFormFlagsContainer");
      if (!container) return;
      container.innerHTML = "";

      const flagsList = Array.isArray(state.memberFlags) ? state.memberFlags : ["primary", "support", "inactive"];

      flagsList.forEach(flag => {
        const isChecked = selectedFlags.includes(flag);
        const label = document.createElement("label");
        label.style.cssText = "display:flex; align-items:center; gap:6px; font-size:11px; cursor:pointer; background:var(--bg-glass); padding:4px 8px; border-radius:6px; border:1px solid var(--border-color);";
        const cls = flag === "primary" ? "flag-primary" : (flag === "support" ? "flag-support" : (flag === "inactive" ? "flag-inactive" : ""));
        label.innerHTML = `
          <input type="checkbox" name="personnelFlags" value="${flag}" ${isChecked ? 'checked' : ''}>
          <span class="member-flag-badge ${cls}">${flag.toUpperCase()}</span>
        `;
        container.appendChild(label);
      });
    }

    function addNewMemberFlag() {
      const input = document.getElementById("newFlagInput");
      if (!input) return;
      const val = input.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!val) return;
      if (!Array.isArray(state.memberFlags)) state.memberFlags = ["primary", "support", "inactive"];
      if (!state.memberFlags.includes(val)) {
        state.memberFlags.push(val);
        saveToCache();
      }
      input.value = "";
      const checkedBoxes = Array.from(document.querySelectorAll('input[name="personnelFlags"]:checked')).map(cb => cb.value);
      if (!checkedBoxes.includes(val)) checkedBoxes.push(val);
      renderPersonnelFlagsCheckboxes(checkedBoxes);
      renderTeamTagFilterChips();
    }

    function openPersonnelModal(memberId = null) {
      const modal = document.getElementById("personnelModal");
      const title = document.getElementById("personnelModalTitle");
      const formId = document.getElementById("personnelFormId");
      const nameInput = document.getElementById("personnelFormName");
      const roleInput = document.getElementById("personnelFormRole");
      const emailInput = document.getElementById("personnelFormEmail");
      const officeInput = document.getElementById("personnelFormOffice");
      const cellInput = document.getElementById("personnelFormCell");
      const notesInput = document.getElementById("personnelFormNotes");

      if (!modal) return;

      const hybridBanner = document.getElementById("personnelFormHybridIdBanner");
      const displayIdText = document.getElementById("personnelDisplayIdText");
      const uuidText = document.getElementById("personnelUuidText");

      if (memberId) {
        const members = collectAllTeamMembers();
        const found = members.find(m => m.id === memberId || m.uuid === memberId || m.displayId === memberId);
        if (found) {
          title.innerText = `✏️ Edit Team Member: ${found.name}`;
          formId.value = found.id;
          nameInput.value = found.name || "";
          roleInput.value = found.role || "";
          emailInput.value = found.email || "";
          officeInput.value = found.officePhone || "";
          cellInput.value = found.cellPhone || "";
          if (notesInput) notesInput.value = found.notes || "";
          renderPersonnelFlagsCheckboxes(found.flags || []);

          if (hybridBanner && displayIdText && uuidText) {
            displayIdText.innerText = found.displayId || found.id || "N/A";
            uuidText.innerText = found.uuid || "N/A";
            uuidText.title = found.uuid || "";
            hybridBanner.style.display = "flex";
          }
        }
      } else {
        title.innerText = "👤 Add New Team Member";
        formId.value = "";
        nameInput.value = "";
        roleInput.value = "";
        emailInput.value = "";
        officeInput.value = "";
        cellInput.value = "";
        if (notesInput) notesInput.value = "";
        renderPersonnelFlagsCheckboxes(["primary"]);
        if (hybridBanner) hybridBanner.style.display = "none";
      }

      modal.classList.add("open");
    }

    function closePersonnelModal() {
      const modal = document.getElementById("personnelModal");
      if (modal) modal.classList.remove("open");
    }

    function savePersonnelForm(e) {
      if (e) e.preventDefault();
      const id = document.getElementById("personnelFormId").value;
      const name = document.getElementById("personnelFormName").value.trim();
      const role = document.getElementById("personnelFormRole").value.trim();
      const email = document.getElementById("personnelFormEmail").value.trim();
      const officePhone = document.getElementById("personnelFormOffice").value.trim();
      const cellPhone = document.getElementById("personnelFormCell").value.trim();
      const notesInput = document.getElementById("personnelFormNotes");
      const notes = notesInput ? notesInput.value.trim() : "";
      const flags = Array.from(document.querySelectorAll('input[name="personnelFlags"]:checked')).map(cb => cb.value);

      if (!name) return;

      if (!Array.isArray(state.teamRoster)) {
        state.teamRoster = [];
      }

      if (id) {
        const existing = state.teamRoster.find(m => m.id === id || m.uuid === id || m.displayId === id);
        if (existing) {
          if (!existing.uuid) existing.uuid = generateUUID();
          if (!existing.displayId) existing.displayId = existing.id || generateMemberDisplayId(state.teamRoster);
          existing.name = name;
          existing.role = role;
          existing.email = email;
          existing.officePhone = officePhone;
          existing.cellPhone = cellPhone;
          existing.notes = notes;
          existing.flags = flags;
        } else {
          const uuid = generateUUID();
          const displayId = generateMemberDisplayId(state.teamRoster);
          state.teamRoster.push({ id: displayId, uuid, displayId, name, role, email, officePhone, cellPhone, notes, flags });
        }
      } else {
        const uuid = generateUUID();
        const displayId = generateMemberDisplayId(state.teamRoster);
        state.teamRoster.push({
          id: displayId,
          uuid,
          displayId,
          name,
          role,
          email,
          officePhone,
          cellPhone,
          notes,
          flags
        });
      }

      saveToCache();
      closePersonnelModal();
      renderAll();
    }

    function deletePersonnel(memberId) {
      if (!memberId) return;
      const members = collectAllTeamMembers();
      const target = members.find(m => m.id === memberId);
      if (!target) return;

      if (!confirm(`Are you sure you want to delete ${target.name} (${target.role}) from the team roster?`)) return;

      // 1. Remove from global state.teamRoster
      if (Array.isArray(state.teamRoster)) {
        const idx = state.teamRoster.findIndex(m => m.id === memberId);
        if (idx !== -1) state.teamRoster.splice(idx, 1);
      }

      // 2. Remove from embedded teamMembers arrays in task tree
      function removeMemberFromTasks(tasks) {
        if (!Array.isArray(tasks)) return;
        tasks.forEach(t => {
          if (Array.isArray(t.teamMembers)) {
            const tmIdx = t.teamMembers.findIndex(tm => tm.id === memberId);
            if (tmIdx !== -1) t.teamMembers.splice(tmIdx, 1);
          }
          if (t.leadId === memberId) delete t.leadId;
          if (t.assigneeId === memberId) delete t.assigneeId;
          if (t.subTasks) removeMemberFromTasks(t.subTasks);
        });
      }
      if (Array.isArray(state.tasks)) removeMemberFromTasks(state.tasks);

      saveToCache();
      renderAll();
    }

    function clearAllPersonnel() {
      const members = collectAllTeamMembers();
      if (members.length === 0) {
        alert("The personnel roster is already empty.");
        return;
      }

      if (!confirm(`Are you sure you want to delete ALL ${members.length} team members from the personnel roster? This action cannot be undone.`)) {
        return;
      }

      state.teamRoster = [];

      function clearTasksMembers(tasks) {
        if (!Array.isArray(tasks)) return;
        tasks.forEach(t => {
          if (t.teamMembers) t.teamMembers = [];
          if (t.subTasks) clearTasksMembers(t.subTasks);
        });
      }
      if (Array.isArray(state.tasks)) clearTasksMembers(state.tasks);

      saveToCache();
      renderAll();
    }
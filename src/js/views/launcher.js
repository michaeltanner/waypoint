function renderWorkspaceLauncher() {
      const wrapper = document.getElementById("launcherWrapper");
      if (!wrapper) return;
      const recents = getRecentWorkspaces();

      let recentsHtml = "";
      if (recents.length > 0) {
        recentsHtml = `
          <div class="launcher-recent-section">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3 style="font-size:15px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:8px;">
                <span>🕒</span> <span>Recent Workspaces</span>
              </h3>
              <button type="button" class="btn" onclick="clearRecentHistory()" style="font-size:11px; padding:3px 8px; color:var(--text-dim);">Clear History</button>
            </div>
            <div class="recent-cards-grid">
              ${recents.map(r => `
                <div class="recent-item-card" onclick="openRecentWorkspace('${r.id}')" style="cursor:pointer;" title="Click to open ${r.title}">
                  <div style="flex:1; min-width:240px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                      <span class="badge ${r.classification === 'CUI' ? 'badge-blocked' : 'badge-completed'}" style="font-size:9px; padding:1px 6px;">${r.classification}</span>
                      <span style="font-size:13px; font-weight:800; color:var(--text-main);">${r.title}</span>
                    </div>
                    <div style="font-size:11px; color:var(--text-muted); display:flex; gap:12px; flex-wrap:wrap;">
                      <span>📁 ${r.itemCount} Workstream Items</span>
                      <span>👥 ${r.memberCount} Personnel</span>
                      <span>🕒 ${new Date(r.updatedAt).toLocaleDateString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                    </div>
                  </div>
                  <div style="display:flex; gap:6px; align-items:center;" onclick="event.stopPropagation()">
                    <button type="button" class="btn btn-gradient" onclick="openRecentWorkspace('${r.id}')" style="font-size:11px; padding:4px 12px; font-weight:700;">▶ Open</button>
                    <button type="button" class="btn" onclick="removeRecentWorkspace('${r.id}', event)" style="font-size:11px; padding:4px 8px; color:var(--text-dim);" title="Remove from list">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        recentsHtml = `
          <div class="launcher-recent-section" style="text-align:center; padding:24px; color:var(--text-muted);">
            <div style="font-size:24px; margin-bottom:6px;">🕒</div>
            <div style="font-size:13px; font-weight:700;">No Recent Workspaces</div>
            <div style="font-size:11px; margin-top:2px;">Load the built-in example or open a JSON file to see your history here.</div>
          </div>
        `;
      }

      wrapper.innerHTML = `
        <div class="launcher-hero-card">
          <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:20px; padding:3px 12px; margin-bottom:12px;">
            <span style="font-size:10px; font-weight:800; color:var(--accent); letter-spacing:0.5px;">STANDALONE AIR-GAPPED PORTFOLIO INTELLIGENCE</span>
          </div>
          <h1 style="font-size:26px; font-weight:900; color:var(--text-main); letter-spacing:-0.5px; margin-bottom:8px;">
            Welcome to Waypoint
          </h1>
          <p style="font-size:13px; color:var(--text-muted); max-width:620px; margin:0 auto 6px auto; line-height:1.5;">
            Offline executive decision support, interactive Gantt scheduling, and portfolio hierarchy management. Load a workspace to begin.
          </p>
        </div>

        <div class="launcher-grid">
          <!-- Card 1: 1-Click Built-in Example -->
          <div class="launcher-action-card" style="border-top:3px solid var(--accent);">
            <div>
              <div style="font-size:32px; margin-bottom:10px;">🚀</div>
              <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-bottom:4px;">Built-in Example</div>
              <div class="badge badge-completed" style="font-size:9px; margin-bottom:8px; display:inline-block;">Operation Sentinel Dawn</div>
              <p style="font-size:12px; color:var(--text-muted); line-height:1.5;">
                One-click interactive demonstration with full OKR hierarchy, Gantt timeline, Kanban swimlanes, and personnel directory.
              </p>
            </div>
            <button type="button" class="btn btn-gradient" onclick="loadBuiltinExample()" style="width:100%; padding:10px; font-size:13px; font-weight:800;" title="Load built-in example dataset with 1 click">
              🚀 Load Built-in Example
            </button>
          </div>

          <!-- Card 2: Drag & Drop / File Picker -->
          <div class="launcher-action-card" style="border-top:3px solid #818cf8;">
            <div>
              <div style="font-size:32px; margin-bottom:10px;">📥</div>
              <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-bottom:4px;">Open JSON Workspace</div>
              <div class="badge" style="font-size:9px; margin-bottom:8px; display:inline-block; color:var(--accent); background:rgba(56,189,248,0.1);">Drag & Drop Supported</div>
              <div class="launcher-drop-zone" id="launcherDropZone" onclick="document.getElementById('launcherDropFileInput').click()">
                <div style="font-size:22px;">📂</div>
                <div style="font-weight:700; font-size:12px; color:var(--text-main);">Drag & Drop .JSON File Here</div>
                <div style="font-size:10px; color:var(--text-muted);">or click to browse local drive</div>
                <input type="file" id="launcherDropFileInput" accept=".json" style="display:none;" onchange="importJSON(event)">
              </div>
            </div>
            <button type="button" class="btn" onclick="document.getElementById('launcherDropFileInput').click()" style="width:100%; padding:9px; font-size:12px; font-weight:700;">
              Browse Local File...
            </button>
          </div>

          <!-- Card 3: Create Blank Portfolio -->
          <div class="launcher-action-card" style="border-top:3px solid #10b981;">
            <div>
              <div style="font-size:32px; margin-bottom:10px;">➕</div>
              <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-bottom:4px;">Create Blank Workspace</div>
              <div class="badge badge-completed" style="font-size:9px; margin-bottom:8px; display:inline-block;">Start Fresh</div>
              <p style="font-size:12px; color:var(--text-muted); line-height:1.5;">
                Start an empty project portfolio with custom OKR ladder, strategic vision, tactical DoD criteria, and clean team roster.
              </p>
            </div>
            <button type="button" class="btn" onclick="createBlankWorkspace()" style="width:100%; padding:10px; font-size:13px; font-weight:700; border-color:rgba(16,185,129,0.4); color:var(--status-done);">
              ➕ Create Blank Workspace
            </button>
          </div>
        </div>

        ${recentsHtml}
      `;

      const dropZone = document.getElementById("launcherDropZone");
      if (dropZone) {
        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add("drag-active"); };
        dropZone.ondragleave = () => { dropZone.classList.remove("drag-active"); };
        dropZone.ondrop = (e) => {
          e.preventDefault();
          dropZone.classList.remove("drag-active");
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            loadJSONFile(e.dataTransfer.files[0]);
          }
        };
      }
    }
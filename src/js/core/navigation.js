function renderHeaderRecentList() {
      const container = document.getElementById("headerRecentWorkspacesList");
      if (!container) return;
      const recents = getRecentWorkspaces();
      if (recents.length === 0) {
        container.innerHTML = `<span style="font-size:11px; color:var(--text-dim); padding:4px 8px;">No recent files</span>`;
        return;
      }
      container.innerHTML = recents.map(r => `
        <button type="button" class="workspace-menu-item" onclick="openRecentWorkspace('${r.id}'); closeWorkspaceMenu();" style="padding:4px 8px; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          <span style="font-size:12px;">📁</span>
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;" title="${r.title}">${r.title}</span>
        </button>
      `).join('');
    }

    function toggleWorkspaceMenu(e) {
      if (e) e.stopPropagation();
      const pop = document.getElementById("workspaceMenuPopover");
      if (!pop) return;
      const isOpening = pop.style.display === "none" || !pop.style.display;
      pop.style.display = isOpening ? "block" : "none";
      if (isOpening) renderHeaderRecentList();
    }

    function closeWorkspaceMenu() {
      const pop = document.getElementById("workspaceMenuPopover");
      if (pop) pop.style.display = "none";
    }

    function initGlobalDragAndDrop() {
      let dragCounter = 0;
      window.addEventListener("dragenter", (e) => {
        e.preventDefault();
        dragCounter++;
        const overlay = document.getElementById("globalDropOverlay");
        if (overlay) overlay.classList.add("active");
      });

      window.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
          dragCounter = 0;
          const overlay = document.getElementById("globalDropOverlay");
          if (overlay) overlay.classList.remove("active");
        }
      });

      window.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      window.addEventListener("drop", (e) => {
        e.preventDefault();
        dragCounter = 0;
        const overlay = document.getElementById("globalDropOverlay");
        if (overlay) overlay.classList.remove("active");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          loadJSONFile(e.dataTransfer.files[0]);
        }
      });

      window.addEventListener("click", () => {
        closeWorkspaceMenu();
      });
    }

// --- CLASSIFICATION TOGGLE ---
    function setClassification(val, isUserChange = false) {
      state.classification = val;
      const top = document.getElementById("topBanner");
      const bottom = document.getElementById("bottomBanner");
      const select = document.getElementById("classificationSelect");
      const bottomText = document.getElementById("bottomClassificationText");

      if (top) top.className = "classification-banner " + val.toLowerCase();
      if (bottom) bottom.className = "classification-banner " + val.toLowerCase();
      if (select) select.value = val;
      if (bottomText) bottomText.innerText = val;

      if (isUserChange) {
        saveToCache(true);
      }
    }

    function toggleTheme() {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      document.getElementById("themeBtn").innerText = next === "dark" ? "🌙" : "☀️";
    }

    function toggleSidebar() {
      const sidebar = document.getElementById("appSidebar");
      const expandBtn = document.getElementById("sidebarExpandBtn");
      sidebar.classList.toggle("collapsed");
      if (sidebar.classList.contains("collapsed")) {
        expandBtn.style.display = "inline-flex";
      } else {
        expandBtn.style.display = "none";
      }
    }

    function switchView(viewId) {
      document.querySelectorAll(".nav-tab").forEach(tab => tab.classList.remove("active"));
      document.querySelectorAll(".view-pane").forEach(pane => pane.classList.remove("active"));

      const activeTab = document.querySelector(`.nav-tab[data-view="${viewId}"]`);
      if (activeTab) activeTab.classList.add("active");

      const activePane = document.getElementById(`view-${viewId}`);
      if (activePane) activePane.classList.add("active");
    }

    function onSearchInput(val) {
      searchQuery = val.toLowerCase().trim();
      renderAll();
    }

    function updateLayoutForWorkspaceState() {
      const isWorkspaceEmpty = !state.tasks || state.tasks.length === 0;
      const sidebar = document.getElementById("appSidebar");
      const expandBtn = document.getElementById("sidebarExpandBtn");
      const newBtn = document.getElementById("headerNewWorkstreamBtn");
      const hierBtn = document.getElementById("headerHierarchyBtn");
      const expBtn = document.getElementById("headerExportBtn");
      const navTabs = document.getElementById("navTabs");
      const searchInput = document.getElementById("globalSearch");

      if (isWorkspaceEmpty) {
        if (sidebar) sidebar.style.display = "none";
        if (expandBtn) expandBtn.style.display = "none";
        if (newBtn) newBtn.style.display = "none";
        if (hierBtn) hierBtn.style.display = "none";
        if (expBtn) expBtn.style.display = "none";
        if (navTabs) {
          navTabs.style.pointerEvents = "none";
          navTabs.style.opacity = "0.35";
        }
        if (searchInput) {
          searchInput.disabled = true;
          searchInput.value = "";
          searchInput.placeholder = "Load a workspace to search...";
        }
      } else {
        if (sidebar) sidebar.style.display = "";
        if (sidebar && sidebar.classList.contains("collapsed")) {
          if (expandBtn) expandBtn.style.display = "inline-flex";
        } else {
          if (expandBtn) expandBtn.style.display = "none";
        }
        if (newBtn) newBtn.style.display = "inline-flex";
        if (hierBtn) hierBtn.style.display = "inline-flex";
        if (expBtn) expBtn.style.display = "inline-flex";
        if (navTabs) {
          navTabs.style.pointerEvents = "auto";
          navTabs.style.opacity = "1";
        }
        if (searchInput) {
          searchInput.disabled = false;
          searchInput.placeholder = "Search workspace...";
        }
      }
      updateSaveStatusUI();
    }
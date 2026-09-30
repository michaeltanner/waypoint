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
  if (bottom) bottom.className = "bottom-status-bar " + val.toLowerCase();
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

function switchView(viewId) {
  document.querySelectorAll(".nav-tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".view-pane").forEach(pane => pane.classList.remove("active"));

  const activeTab = document.querySelector(`.nav-tab[data-view="${viewId}"]`);
  if (activeTab) activeTab.classList.add("active");

  const activePane = document.getElementById(`view-${viewId}`);
  if (activePane) activePane.classList.add("active");
  if (viewId === "json" && typeof renderJsonSourceView === "function") {
    renderJsonSourceView();
  }
}

function onSearchInput(val) {
  searchQuery = val.toLowerCase().trim();
  renderAll();
}

function updateLayoutForWorkspaceState() {
  const isWorkspaceEmpty = !state.tasks || state.tasks.length === 0;
  const saveBtn = document.getElementById("headerSaveBtn");
  const saveAsBtn = document.getElementById("headerSaveAsBtn");
  const closeBtn = document.getElementById("headerCloseBtn");
  const navTabs = document.getElementById("navTabs");

  if (isWorkspaceEmpty) {
    if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = "0.35"; saveBtn.style.pointerEvents = "none"; }
    if (saveAsBtn) { saveAsBtn.disabled = true; saveAsBtn.style.opacity = "0.35"; saveAsBtn.style.pointerEvents = "none"; }
    if (closeBtn) { closeBtn.disabled = true; closeBtn.style.opacity = "0.35"; closeBtn.style.pointerEvents = "none"; }
    if (navTabs) {
      navTabs.style.pointerEvents = "none";
      navTabs.style.opacity = "0.35";
    }
  } else {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = "1"; saveBtn.style.pointerEvents = "auto"; }
    if (saveAsBtn) { saveAsBtn.disabled = false; saveAsBtn.style.opacity = "1"; saveAsBtn.style.pointerEvents = "auto"; }
    if (closeBtn) { closeBtn.disabled = false; closeBtn.style.opacity = "1"; closeBtn.style.pointerEvents = "auto"; }
    if (navTabs) {
      navTabs.style.pointerEvents = "auto";
      navTabs.style.opacity = "1";
    }
  }
  updateSaveStatusUI();
}
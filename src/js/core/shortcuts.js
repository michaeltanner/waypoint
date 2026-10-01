// Keyboard shortcut catalog and dispatcher.
// The help modal renders SHORTCUT_CATALOG. Global chords are handled in the
// listener below. Notes-editor rows are native contenteditable commands and
// are listed only so the help modal stays complete.

const SHORTCUT_CATALOG = [
  { id: "help", scope: "Global", keys: ["?"], description: "Show or hide keyboard shortcuts" },
  { id: "save", scope: "Global", keys: ["Ctrl", "S"], description: "Save the workspace" },
  { id: "save-as", scope: "Global", keys: ["Ctrl", "Shift", "S"], description: "Save the workspace as a new file" },
  { id: "dismiss", scope: "Global", keys: ["Escape"], description: "Close the shortcut list, dialog, menu, or inspector" },
  { id: "bold", scope: "Notes editor", keys: ["Ctrl", "B"], description: "Bold selected text" },
  { id: "italic", scope: "Notes editor", keys: ["Ctrl", "I"], description: "Italicize selected text" },
  { id: "underline", scope: "Notes editor", keys: ["Ctrl", "U"], description: "Underline selected text" }
];

let shortcutsReturnFocus = null;

function usesMacModifiers() {
  const platform = navigator.platform || "";
  const ua = navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS/.test(ua);
}

function displayKey(part) {
  if (part === "Escape") return "Esc";
  if (!usesMacModifiers()) return part;
  if (part === "Ctrl") return "⌘";
  if (part === "Shift") return "⇧";
  if (part === "Alt") return "⌥";
  return part;
}

function renderShortcutList() {
  const body = document.getElementById("shortcutsModalBody");
  if (!body) return;
  body.replaceChildren();

  const groups = [];
  SHORTCUT_CATALOG.forEach((item) => {
    let group = groups.find((entry) => entry.name === item.scope);
    if (!group) {
      group = { name: item.scope, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "shortcut-group";

    const heading = document.createElement("h4");
    heading.className = "shortcut-group-title";
    heading.textContent = group.name;
    section.appendChild(heading);

    group.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "shortcut-row";

      const desc = document.createElement("span");
      desc.className = "shortcut-desc";
      desc.textContent = item.description;

      const keys = document.createElement("span");
      keys.className = "shortcut-keys";
      item.keys.forEach((part, index) => {
        if (index > 0) {
          const plus = document.createElement("span");
          plus.className = "shortcut-plus";
          plus.textContent = "+";
          keys.appendChild(plus);
        }
        const kbd = document.createElement("kbd");
        kbd.textContent = displayKey(part);
        keys.appendChild(kbd);
      });

      row.append(desc, keys);
      section.appendChild(row);
    });

    body.appendChild(section);
  });

  const note = document.createElement("p");
  note.className = "shortcut-footnote";
  const saveLabel = usesMacModifiers() ? "⌘+S" : "Ctrl+S";
  note.textContent = `The ? key stays quiet while you are typing in a field. Esc still closes the topmost dialog, and ${saveLabel} still saves.`;
  body.appendChild(note);
}

function setShortcutsButtonExpanded(isOpen) {
  const button = document.getElementById("shortcutsHelpBtn");
  if (button) button.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function openShortcutsModal() {
  const modal = document.getElementById("shortcutsModal");
  if (!modal || modal.classList.contains("open")) return;
  shortcutsReturnFocus = document.activeElement;
  closeWorkspaceMenu();
  const kanbanFilter = document.getElementById("kanbanFilterPopover");
  if (kanbanFilter) kanbanFilter.style.display = "none";
  renderShortcutList();
  modal.classList.add("open");
  setShortcutsButtonExpanded(true);
  const dialog = modal.querySelector(".shortcuts-card");
  if (dialog) dialog.focus();
}

function closeShortcutsModal() {
  const modal = document.getElementById("shortcutsModal");
  if (!modal || !modal.classList.contains("open")) return;
  modal.classList.remove("open");
  setShortcutsButtonExpanded(false);
  const returnFocus = shortcutsReturnFocus;
  shortcutsReturnFocus = null;
  if (returnFocus && typeof returnFocus.focus === "function" && document.contains(returnFocus)) {
    returnFocus.focus();
  }
}

function toggleShortcutsModal() {
  const modal = document.getElementById("shortcutsModal");
  if (modal && modal.classList.contains("open")) closeShortcutsModal();
  else openShortcutsModal();
}

function isTypingTarget(target) {
  const element = target && target.nodeType === 1 ? target : target && target.parentElement;
  if (!element || !element.closest) return false;
  return !!element.closest("input, textarea, select, [contenteditable]");
}

function workspaceHasTasks() {
  return !!(state && Array.isArray(state.tasks) && state.tasks.length > 0);
}

function dismissTopLayer() {
  const shortcuts = document.getElementById("shortcutsModal");
  if (shortcuts && shortcuts.classList.contains("open")) {
    closeShortcutsModal();
    return true;
  }

  const personnel = document.getElementById("personnelModal");
  if (personnel && personnel.classList.contains("open")) {
    closePersonnelModal();
    return true;
  }

  const menu = document.getElementById("workspaceMenuPopover");
  if (menu && menu.style.display === "block") {
    closeWorkspaceMenu();
    return true;
  }

  const kanbanFilter = document.getElementById("kanbanFilterPopover");
  if (kanbanFilter && kanbanFilter.style.display === "block") {
    kanbanFilter.style.display = "none";
    return true;
  }

  const drawer = document.getElementById("detailDrawer");
  if (drawer && drawer.classList.contains("open")) {
    closeInspector();
    return true;
  }

  return false;
}

window.addEventListener("keydown", (event) => {
  if (event.isComposing || event.repeat) return;

  const key = event.key;
  const saveChord = (event.ctrlKey || event.metaKey) && !event.altKey && key.toLowerCase() === "s";
  if (saveChord) {
    event.preventDefault();
    if (!workspaceHasTasks()) return;
    if (event.shiftKey) handleSaveAsWorkspace();
    else handleSaveWorkspace();
    return;
  }

  if (key === "Escape" || key === "Esc") {
    if (dismissTopLayer()) event.preventDefault();
    return;
  }

  if (key === "?" && !event.ctrlKey && !event.metaKey && !event.altKey && !isTypingTarget(event.target)) {
    event.preventDefault();
    toggleShortcutsModal();
  }
});

window.openShortcutsModal = openShortcutsModal;
window.closeShortcutsModal = closeShortcutsModal;
window.toggleShortcutsModal = toggleShortcutsModal;

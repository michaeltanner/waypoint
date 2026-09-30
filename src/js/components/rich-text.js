// --- TOAST NOTIFICATIONS ---
    function showClipboardToast(msg, icon = '📋') {
      const existing = document.querySelector(".clipboard-toast");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.className = "clipboard-toast";
      toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
      document.body.appendChild(toast);
      setTimeout(() => { if (toast && toast.parentNode) toast.remove(); }, 2600);
    }

    // --- RICH TEXT EDITOR ENGINE (WINDOW-SCOPED) ---
    let savedNotesSelectionRange = null;

    window.saveNotesSelection = function() {
      const editor = document.getElementById("drawerFormNotesEditor");
      if (!editor) return;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
        savedNotesSelectionRange = sel.getRangeAt(0).cloneRange();
      }
    };

    window.restoreNotesSelection = function() {
      const editor = document.getElementById("drawerFormNotesEditor");
      if (!editor || !savedNotesSelectionRange) return;
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedNotesSelectionRange);
      }
    };

    window.execRichTextCommand = function(cmd, val = null) {
      const editor = document.getElementById("drawerFormNotesEditor");
      if (!editor) return;
      editor.focus();
      window.restoreNotesSelection();

      if (cmd === "hiliteColor" || cmd === "highlight") {
        const color = val || "rgba(56, 189, 248, 0.35)";
        let ok = false;
        try { ok = document.execCommand("hiliteColor", false, color); } catch (e) { }
        if (!ok) {
          try { document.execCommand("backColor", false, color); } catch (e) { }
        }
      } else if (cmd === "formatBlock") {
        const tag = (val || "P").replace(/[<>]/g, "").toUpperCase();
        try {
          document.execCommand("formatBlock", false, tag);
        } catch (e) {
          try { document.execCommand("formatBlock", false, `<${tag}>`); } catch (err) { }
        }
      } else {
        try {
          document.execCommand(cmd, false, val);
        } catch (e) { }
      }

      window.saveNotesSelection();
    };
// --- LIVE PROJECT JSON SOURCE VIEW ---
function syntaxHighlightJSON(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'json-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

function renderJsonSourceView() {
  const codeEl = document.getElementById("projectJsonCodeBlock");
  const gutterEl = document.getElementById("jsonGutter");
  const metaEl = document.getElementById("jsonMetadataInfo");
  const badgeEl = document.getElementById("jsonStatsBadge");
  const toggleEl = document.getElementById("jsonLineNumbersToggle");
  if (!codeEl) return;

  if (!state.tasks || state.tasks.length === 0) {
    codeEl.innerHTML = '<span style="color:var(--text-dim);">// No active workspace loaded.</span>';
    if (gutterEl) gutterEl.innerHTML = '';
    if (metaEl) metaEl.innerText = "No workspace loaded";
    if (badgeEl) badgeEl.innerText = "Empty";
    return;
  }

  const jsonStr = JSON.stringify(state, null, 2);
  codeEl.innerHTML = syntaxHighlightJSON(jsonStr);

  const lines = jsonStr.split('\n');
  const lineCount = lines.length;

  if (gutterEl) {
    const showLineNumbers = toggleEl ? toggleEl.checked : true;
    gutterEl.style.display = showLineNumbers ? 'block' : 'none';
    let nums = [];
    for (let i = 1; i <= lineCount; i++) {
      nums.push(i);
    }
    gutterEl.textContent = nums.join('\n');
  }

  const sizeKb = (new Blob([jsonStr]).size / 1024).toFixed(1);
  const totalTasks = countAllTasks(state.tasks);
  const totalMembers = Array.isArray(state.teamRoster) ? state.teamRoster.length : 0;
  const rootTitle = state.tasks[0]?.title || "waypoint";
  const filename = rootTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_") + ".json";

  if (metaEl) {
    metaEl.innerText = `${filename} • ${sizeKb} KB • ${lineCount} lines • ${totalTasks} total tasks • ${totalMembers} team members`;
  }
  if (badgeEl) {
    badgeEl.innerText = `${sizeKb} KB • ${lineCount} lines • Schema v${state.schemaVersion || "4.0"}`;
  }
}

function toggleJsonLineNumbers(enabled) {
  const gutterEl = document.getElementById("jsonGutter");
  if (gutterEl) {
    gutterEl.style.display = enabled ? 'block' : 'none';
  }
}

function copyProjectJsonToClipboard() {
  if (!state.tasks || state.tasks.length === 0) {
    alert("No active workspace to copy.");
    return;
  }
  const jsonStr = JSON.stringify(state, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      showClipboardToast("Copied full project JSON to clipboard!");
    }).catch(() => {
      fallbackCopyJson(jsonStr);
    });
  } else {
    fallbackCopyJson(jsonStr);
  }
}

function fallbackCopyJson(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
  showClipboardToast("Copied full project JSON to clipboard!");
}

window.renderJsonSourceView = renderJsonSourceView;
window.toggleJsonLineNumbers = toggleJsonLineNumbers;
window.copyProjectJsonToClipboard = copyProjectJsonToClipboard;
window.syntaxHighlightJSON = syntaxHighlightJSON;

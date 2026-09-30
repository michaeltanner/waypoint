// --- INTERACTIVE FRAPPE GANTT SCHEDULE ENGINE (COA #2) ---
    let ganttViewMode = "Week"; // Options: 'Day', 'Week', 'Month', 'Year'

    function setGanttViewMode(mode) {
      ganttViewMode = mode;
      ["Day", "Week", "Month", "Year"].forEach(m => {
        const btn = document.getElementById(`ganttScaleBtn-${m}`);
        if (btn) {
          if (m === mode) btn.classList.add("btn-gradient");
          else btn.classList.remove("btn-gradient");
        }
      });
      renderGanttTimeline();
    }

    function renderGanttTimeline() {
      const container = document.getElementById("ganttChartContainer");
      if (!container) return;
      container.innerHTML = "";

      // 1. Gather all tasks in tree sequence
      const flatList = [];
      function flatten(tasks, depth = 0) {
        tasks.forEach(t => {
          flatList.push({ task: t, depth });
          if (t.subTasks) flatten(t.subTasks, depth + 1);
        });
      }
      flatten(state.tasks);

      if (flatList.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); padding:20px;">No timeline data found in workspace.</p>`;
        return;
      }

      // Compute Timeline Min & Max Dates across all tasks
      let minTimestamp = Infinity;
      let maxTimestamp = -Infinity;

      flatList.forEach(({ task }) => {
        let s = task.startDate ? new Date(task.startDate).getTime() : new Date("2026-09-01").getTime();
        let d = task.dueDate ? new Date(task.dueDate).getTime() : s + (7 * 24 * 3600 * 1000);
        if (isNaN(s)) s = new Date("2026-09-01").getTime();
        if (isNaN(d)) d = s + (7 * 24 * 3600 * 1000);

        if (s < minTimestamp) minTimestamp = s;
        if (d > maxTimestamp) maxTimestamp = d;
      });

      // Add padding buffer around date bounds
      const minDate = new Date(minTimestamp - (5 * 24 * 3600 * 1000));
      const maxDate = new Date(maxTimestamp + (15 * 24 * 3600 * 1000));

      // Calculate time step parameters based on ganttViewMode
      let stepMs = 24 * 3600 * 1000; // 1 day default
      let colWidth = 38; // px per step

      if (ganttViewMode === "Day") {
        stepMs = 24 * 3600 * 1000;
        colWidth = 40;
      } else if (ganttViewMode === "Week") {
        stepMs = 7 * 24 * 3600 * 1000;
        colWidth = 70;
      } else if (ganttViewMode === "Month") {
        stepMs = 30 * 24 * 3600 * 1000;
        colWidth = 100;
      } else if (ganttViewMode === "Year") {
        stepMs = 90 * 24 * 3600 * 1000;
        colWidth = 130;
      }

      const totalSpanMs = maxDate.getTime() - minDate.getTime();
      const numCols = Math.max(10, Math.ceil(totalSpanMs / stepMs));
      const chartWidth = numCols * colWidth;
      const rowHeight = 44;
      const headerHeight = 44;
      const chartHeight = headerHeight + (flatList.length * rowHeight);

      // Create Gantt Outer Layout
      const ganttWrapper = document.createElement("div");
      ganttWrapper.className = "frappe-gantt-wrapper";

      // Left Column: Task Labels
      const labelCol = document.createElement("div");
      labelCol.className = "frappe-gantt-label-col";

      const labelHead = document.createElement("div");
      labelHead.className = "frappe-gantt-label-head";
      labelHead.innerText = "WORKSTREAM ITEM";
      labelCol.appendChild(labelHead);

      flatList.forEach(({ task, depth }) => {
        const resolved = resolveCascadingProps(task, null);
        const labelRow = document.createElement("div");
        labelRow.className = "frappe-gantt-label-row";
        labelRow.style.paddingLeft = `${12 + (depth * 14)}px`;
        labelRow.onclick = () => openInspector(resolved);

        const icon = task.type === "milestone" ? "◆" : (task.type === "objective" || task.type === "project" ? "📁" : "📋");
        labelRow.innerHTML = `
          <span class="type-tag" style="padding:1px 5px; font-size:9px;">${icon}</span>
          <span style="font-weight:700; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${task.title}">${task.title}</span>
        `;
        labelCol.appendChild(labelRow);
      });

      ganttWrapper.appendChild(labelCol);

      // Right Area: Scrollable SVG Chart Area
      const chartArea = document.createElement("div");
      chartArea.className = "frappe-gantt-chart-area";

      // Build SVG Element
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", chartWidth);
      svg.setAttribute("height", chartHeight);
      svg.setAttribute("class", "frappe-gantt-svg");

      // 1. Grid Background & Header
      let headerSvg = `<rect x="0" y="0" width="${chartWidth}" height="${headerHeight}" fill="rgba(15,23,42,0.6)" stroke="var(--border-color)"/>`;

      for (let i = 0; i < numCols; i++) {
        const x = i * colWidth;
        const colDate = new Date(minDate.getTime() + (i * stepMs));

        let labelText = "";
        if (ganttViewMode === "Day") {
          labelText = colDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else if (ganttViewMode === "Week") {
          labelText = `Wk ${colDate.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}`;
        } else if (ganttViewMode === "Month") {
          labelText = colDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        } else {
          const q = Math.floor(colDate.getMonth() / 3) + 1;
          labelText = `Q${q} '${colDate.getFullYear().toString().substr(2)}`;
        }

        headerSvg += `
          <line x1="${x}" y1="0" x2="${x}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2,2"/>
          <text x="${x + 6}" y="26" fill="var(--text-muted)" font-size="11" font-weight="700">${labelText}</text>
        `;
      }

      // Horizontal Row Lines
      let rowsSvg = "";
      flatList.forEach((_, idx) => {
        const y = headerHeight + (idx * rowHeight);
        const bgFill = idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)";
        rowsSvg += `
          <rect x="0" y="${y}" width="${chartWidth}" height="${rowHeight}" fill="${bgFill}"/>
          <line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="var(--border-color)" stroke-opacity="0.4"/>
        `;
      });

      // Today Indicator Line
      const todayMs = new Date("2026-09-28").getTime();
      const todayPct = (todayMs - minDate.getTime()) / totalSpanMs;
      const todayX = todayPct * chartWidth;
      let todaySvg = "";
      if (todayX >= 0 && todayX <= chartWidth) {
        todaySvg = `
          <line x1="${todayX}" y1="0" x2="${todayX}" y2="${chartHeight}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4,4"/>
          <circle cx="${todayX}" cy="12" r="5" fill="var(--accent)"/>
          <text x="${todayX + 8}" y="15" fill="var(--accent)" font-size="10" font-weight="900">TODAY</text>
        `;
      }

      svg.innerHTML = headerSvg + rowsSvg + todaySvg;

      // 2. Render Interactive Task Bars with Handles
      flatList.forEach(({ task }, idx) => {
        const resolved = resolveCascadingProps(task, null);
        const y = headerHeight + (idx * rowHeight) + 8;
        const barH = 28;

        let sMs = task.startDate ? new Date(task.startDate).getTime() : minTimestamp;
        let dMs = task.dueDate ? new Date(task.dueDate).getTime() : sMs + (7 * 24 * 3600 * 1000);
        if (isNaN(sMs)) sMs = minTimestamp;
        if (isNaN(dMs)) dMs = sMs + (7 * 24 * 3600 * 1000);

        const startX = Math.max(0, ((sMs - minDate.getTime()) / totalSpanMs) * chartWidth);
        const endX = Math.min(chartWidth, ((dMs - minDate.getTime()) / totalSpanMs) * chartWidth);
        const width = Math.max(24, endX - startX);

        const groupG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        groupG.setAttribute("class", "frappe-gantt-bar-group");
        groupG.setAttribute("data-id", task.id);

        if (task.type === "milestone") {
          // Milestone Diamond Symbol
          const cx = startX;
          const cy = y + (barH / 2);
          groupG.innerHTML = `
            <polygon points="${cx},${cy - 10} ${cx + 10},${cy} ${cx},${cy + 10} ${cx - 10},${cy}" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" class="gantt-milestone-marker"/>
            <text x="${cx + 16}" y="${cy + 4}" fill="var(--text-main)" font-size="11" font-weight="800">${task.title}</text>
          `;
          groupG.onclick = () => openInspector(resolved);
        } else {
          // Task Gantt Bar
          const progress = task.progress || 0;
          const progressW = (width * progress) / 100;
          const healthVal = task.health || "Green";
          const barColor = healthVal === "Red" ? "var(--health-red)" : (healthVal === "Yellow" ? "var(--health-yellow)" : "var(--accent-hover)");

          groupG.innerHTML = `
            <!-- Main Bar Background -->
            <rect x="${startX}" y="${y}" width="${width}" height="${barH}" rx="6" ry="6" fill="${barColor}" stroke="var(--border-color)" class="gantt-bar-rect"/>
            <!-- Progress Fill Overlay -->
            <rect x="${startX}" y="${y}" width="${progressW}" height="${barH}" rx="6" ry="6" fill="var(--accent)" opacity="0.8" pointer-events="none"/>
            <!-- Bar Title Label -->
            <text x="${startX + 10}" y="${y + 18}" fill="#ffffff" font-size="11" font-weight="800" pointer-events="none" style="text-shadow:0 1px 2px rgba(0,0,0,0.8);">${task.title} (${progress}%)</text>
            
            <!-- Interactive Resize Drag Handles -->
            <rect x="${startX + width - 8}" y="${y + 4}" width="6" height="${barH - 8}" rx="2" fill="#ffffff" class="gantt-handle gantt-handle-right" data-id="${task.id}" data-mode="resize-right" title="Drag to adjust due date"/>
            <rect x="${startX + 2}" y="${y + 4}" width="6" height="${barH - 8}" rx="2" fill="#ffffff" class="gantt-handle gantt-handle-left" data-id="${task.id}" data-mode="resize-left" title="Drag to adjust start date"/>
          `;

          // Setup Drag Listeners on Bar
          setupGanttBarDrag(groupG, task, startX, width, chartWidth, minDate, totalSpanMs);
        }

        svg.appendChild(groupG);
      });

      chartArea.appendChild(svg);
      ganttWrapper.appendChild(chartArea);
      container.appendChild(ganttWrapper);
    }

    // --- FRAPPE GANTT DRAG-TO-RESCHEDULE EVENT HANDLER ---
    function setupGanttBarDrag(groupG, task, initialX, initialW, chartWidth, minDate, totalSpanMs) {
      let isDragging = false;
      let dragMode = "move"; // 'move', 'resize-left', 'resize-right'
      let startMouseX = 0;

      const rect = groupG.querySelector(".gantt-bar-rect");
      const handleRight = groupG.querySelector(".gantt-handle-right");
      const handleLeft = groupG.querySelector(".gantt-handle-left");

      const onMouseDown = (e, mode) => {
        e.stopPropagation();
        isDragging = true;
        dragMode = mode;
        startMouseX = e.clientX;
        document.body.style.cursor = mode === "move" ? "grabbing" : "ew-resize";

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      };

      if (rect) rect.onmousedown = (e) => onMouseDown(e, "move");
      if (handleRight) handleRight.onmousedown = (e) => onMouseDown(e, "resize-right");
      if (handleLeft) handleLeft.onmousedown = (e) => onMouseDown(e, "resize-left");

      const onMouseMove = (e) => {
        if (!isDragging) return;
        // Drag active feedback
      };

      const onMouseUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.cursor = "default";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        const dx = e.clientX - startMouseX;
        if (Math.abs(dx) < 3) {
          // Click event -> open inspector
          openInspector(resolveCascadingProps(task, null));
          return;
        }

        const msPerPx = totalSpanMs / chartWidth;
        const deltaMs = Math.round((dx * msPerPx) / (24 * 3600 * 1000)) * (24 * 3600 * 1000);

        let origStart = new Date(task.startDate || "2026-09-01").getTime();
        let origDue = new Date(task.dueDate || "2026-10-01").getTime();

        if (dragMode === "move") {
          origStart += deltaMs;
          origDue += deltaMs;
        } else if (dragMode === "resize-right") {
          origDue = Math.max(origStart + (24 * 3600 * 1000), origDue + deltaMs);
        } else if (dragMode === "resize-left") {
          origStart = Math.min(origDue - (24 * 3600 * 1000), origStart + deltaMs);
        }

        // Update task object in state
        const targetInState = findTaskRecursive(state.tasks, task.id);
        if (targetInState) {
          targetInState.startDate = new Date(origStart).toISOString().split("T")[0];
          targetInState.dueDate = new Date(origDue).toISOString().split("T")[0];
          saveToCache();
          renderGanttTimeline();
          if (document.getElementById("detailDrawer").classList.contains("open")) {
            openInspector(resolveCascadingProps(targetInState, null));
          }
        }
      };
    }
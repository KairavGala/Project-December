window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

PD.Pages.RevisionCalendar = (function () {
  var selectedDateStr = null;
  var viewYear = 2026;
  var viewMonth = 6; // 0-indexed: July = 6
  var cachedPlannerForecast = null;

  function render(container) {
    var chapters = PD.Store.getChapters();
    var wrap = PD.Utils.createEl("div", { class: "page revision-calendar-page" });

    // Pre-fetch Planner Forecast for 150 days (covers July through December 2026)
    if (window.PD && window.PD.Services && window.PD.Services.Planner) {
      cachedPlannerForecast = window.PD.Services.Planner.getForecast(chapters, 150);
    }

    // Header Area
    var header = PD.Utils.createEl("div", { class: "page-header-row" });
    var titleArea = PD.Utils.createEl("div");
    titleArea.appendChild(PD.Utils.createEl("h1", { class: "page-title", text: "Revision & Schedule Calendar" }));
    titleArea.appendChild(PD.Utils.createEl("p", { 
      class: "page-subtitle", 
      text: "Interactive calendar combining logged revisions, upcoming spaced reviews, and master planner targets through MHT-CET (15th Dec)." 
    }));
    header.appendChild(titleArea);
    wrap.appendChild(header);

    // Grid Columns: Left Month Calendar, Right Details Sidebar
    var cols = PD.Utils.createEl("div", { class: "calendar-layout-row" });
    
    // Left Calendar
    var calCol = PD.Utils.createEl("div", { class: "calendar-main-column" });
    buildMonthCalendar(calCol, chapters, cols);
    cols.appendChild(calCol);

    // Right Details Pane
    var detailsCol = PD.Utils.createEl("div", { class: "calendar-details-column" });
    buildDetailsPane(detailsCol, chapters);
    cols.appendChild(detailsCol);

    wrap.appendChild(cols);
    container.appendChild(wrap);
  }

  function buildMonthCalendar(parent, chapters, cols) {
    var monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Calendar Controls & Month Header
    var header = PD.Utils.createEl("div", { class: "calendar-month-header", style: "display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;" });
    
    var title = PD.Utils.createEl("h2", { text: monthNames[viewMonth] + " " + viewYear, style: "font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0;" });
    header.appendChild(title);

    var navControls = PD.Utils.createEl("div", { class: "calendar-nav-controls", style: "display: flex; align-items: center; gap: 8px;" });

    // Month Dropdown
    var select = PD.Utils.createEl("select", { class: "form-input", style: "padding: 6px 10px; font-size: 13px; font-weight: 600; width: auto;" });
    for (var m = 0; m < 12; m++) {
      var opt = PD.Utils.createEl("option", { value: m, text: monthNames[m] + " " + viewYear });
      if (m === viewMonth) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("change", function (e) {
      viewMonth = parseInt(e.target.value, 10);
      refreshCalendar(parent, chapters, cols);
    });
    navControls.appendChild(select);

    // Prev Month Button
    var prevBtn = PD.Utils.createEl("button", { class: "data-btn", style: "padding: 6px 12px; font-size: 13px;", text: "◄ Prev" });
    prevBtn.addEventListener("click", function () {
      if (viewMonth === 0) {
        viewMonth = 11;
        viewYear--;
      } else {
        viewMonth--;
      }
      refreshCalendar(parent, chapters, cols);
    });
    navControls.appendChild(prevBtn);

    // Today Button
    var todayBtn = PD.Utils.createEl("button", { class: "data-btn", style: "padding: 6px 12px; font-size: 13px; background: rgba(59,130,246,0.15); color: #60a5fa;", text: "Today" });
    todayBtn.addEventListener("click", function () {
      var now = new Date();
      viewYear = now.getFullYear();
      viewMonth = now.getMonth();
      selectedDateStr = now.toISOString().split("T")[0];
      refreshCalendar(parent, chapters, cols);
    });
    navControls.appendChild(todayBtn);

    // Next Month Button
    var nextBtn = PD.Utils.createEl("button", { class: "data-btn", style: "padding: 6px 12px; font-size: 13px;", text: "Next ►" });
    nextBtn.addEventListener("click", function () {
      if (viewMonth === 11) {
        viewMonth = 0;
        viewYear++;
      } else {
        viewMonth++;
      }
      refreshCalendar(parent, chapters, cols);
    });
    navControls.appendChild(nextBtn);

    header.appendChild(navControls);
    parent.appendChild(header);

    // Grid header: Weekday names
    var grid = PD.Utils.createEl("div", { class: "calendar-grid" });
    var daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    daysOfWeek.forEach(function (d) {
      grid.appendChild(PD.Utils.createEl("div", { class: "calendar-grid-header-cell", text: d }));
    });

    // Dates calculations
    var firstDay = new Date(viewYear, viewMonth, 1);
    var startDayIndex = firstDay.getDay(); // 0 is Sunday, 1 is Monday...
    var daysOffset = startDayIndex === 0 ? 6 : startDayIndex - 1; // Align to Mon-Sun

    var totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Past month days fillers
    for (var i = 0; i < daysOffset; i++) {
      grid.appendChild(PD.Utils.createEl("div", { class: "calendar-cell empty" }));
    }

    // Active month days
    for (var dateNum = 1; dateNum <= totalDays; dateNum++) {
      var cellDateStr = viewYear + "-" + String(viewMonth + 1).padStart(2, "0") + "-" + String(dateNum).padStart(2, "0");
      grid.appendChild(buildDateCell(dateNum, cellDateStr, chapters, cols));
    }

    parent.appendChild(grid);
  }

  function refreshCalendar(parent, chapters, cols) {
    parent.innerHTML = "";
    buildMonthCalendar(parent, chapters, cols);

    var rightPane = cols.querySelector(".calendar-details-column");
    if (rightPane) {
      rightPane.innerHTML = "";
      buildDetailsPane(rightPane, chapters);
    }
  }

  function buildDateCell(dateNum, dateStr, chapters, cols) {
    var cell = PD.Utils.createEl("div", { class: "calendar-cell active" });
    var todayStr = new Date().toISOString().split("T")[0];
    if (dateStr === todayStr) cell.classList.add("is-today");
    if (selectedDateStr === dateStr) cell.classList.add("is-selected");

    var dateLabel = PD.Utils.createEl("span", { class: "cell-date-num", text: dateNum });
    cell.appendChild(dateLabel);

    // Compute revisions and tasks scheduled on this dateStr
    var events = getRevisionsForDate(dateStr, chapters);

    if (events.length > 0) {
      var indicators = PD.Utils.createEl("div", { class: "cell-indicators" });
      events.slice(0, 3).forEach(function (ev) {
        var dot = PD.Utils.createEl("span", { class: "cell-dot dot-" + ev.status });
        dot.title = ev.chapter + " (" + ev.status + ")";
        indicators.appendChild(dot);
      });
      if (events.length > 3) {
        indicators.appendChild(PD.Utils.createEl("span", { class: "cell-dot-more", text: "+" + (events.length - 3) }));
      }
      cell.appendChild(indicators);
    }

    // Click to select date
    cell.addEventListener("click", function () {
      selectedDateStr = dateStr;
      
      // Update cell selection in DOM
      var prev = cell.parentNode.querySelector(".calendar-cell.is-selected");
      if (prev) prev.classList.remove("is-selected");
      cell.classList.add("is-selected");

      // Re-render the details side pane
      var rightPane = cols.querySelector(".calendar-details-column");
      if (rightPane) {
        rightPane.innerHTML = "";
        buildDetailsPane(rightPane, chapters);
      }
    });

    return cell;
  }

  function getRevisionsForDate(dateStr, chapters) {
    var events = [];
    var seen = {};

    // 1. Logged Revisions in History
    chapters.forEach(function (c) {
      if (c.lastRevision && c.lastRevision.split("T")[0] === dateStr) {
        var key = "logged_" + c.id;
        seen[key] = true;
        events.push({ chapter: c.chapter, subject: c.subject, status: "completed", label: "Completed Revision" });
      }
      
      // 2. Specific Due Dates
      if (c.revisionDue && c.revisionDue === dateStr) {
        var status = "upcoming";
        var today = new Date().toISOString().split("T")[0];
        if (dateStr < today) {
          status = "overdue";
        } else if (dateStr === today) {
          status = "due-today";
        }
        var key = "due_" + c.id;
        seen[key] = true;
        events.push({ chapter: c.chapter, subject: c.subject, status: status, label: "Revision Due" });
      }
    });

    // 3. Planner Forecast Tasks for Date
    if (cachedPlannerForecast) {
      var fDay = cachedPlannerForecast.find(function (f) { return f.dateStr === dateStr; });
      if (fDay && fDay.mission) {
        fDay.mission.forEach(function (m) {
          var key = "planner_" + (m.chapter ? m.chapter.id : "gen");
          if (!seen[key]) {
            seen[key] = true;
            var isRev = m.action && m.action.kind === "revision";
            events.push({
              chapter: m.chapter ? m.chapter.chapter : "General",
              subject: m.chapter ? m.chapter.subject : "General",
              status: isRev ? "upcoming" : "planner-task",
              label: m.action ? m.action.label : m.reason
            });
          }
        });
      }
    }

    // 4. Custom July Schedule Direct Tasks
    if (window.PD && window.PD.Services && window.PD.Services.JulySchedule) {
      var customSched = window.PD.Services.JulySchedule.getScheduleForDate(dateStr, chapters);
      if (customSched && customSched.mission) {
        customSched.mission.forEach(function (m) {
          var key = "july_" + (m.action ? m.action.label : (m.chapter ? m.chapter.chapter : m.reason));
          if (!seen[key]) {
            seen[key] = true;
            events.push({
              chapter: m.chapter ? m.chapter.chapter : "General",
              subject: m.chapter ? m.chapter.subject : "General",
              status: "planner-task",
              label: m.action ? m.action.label : m.reason
            });
          }
        });
      }
    }

    return events;
  }

  function buildDetailsPane(parent, chapters) {
    var todayStr = new Date().toISOString().split("T")[0];
    var activeDate = selectedDateStr || todayStr;

    parent.appendChild(PD.Utils.createEl("h3", { text: "Schedule Details: " + PD.Utils.formatDate(new Date(activeDate + "T00:00:00")) }));

    // Check for July Schedule metadata
    if (window.PD && window.PD.Services && window.PD.Services.JulySchedule) {
      var customSched = window.PD.Services.JulySchedule.getScheduleForDate(activeDate, chapters);
      if (customSched) {
        var goalCard = PD.Utils.createEl("div", {
          style: "background: rgba(30,41,59,0.7); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 10px; margin-bottom: 14px;"
        });
        goalCard.innerHTML = `
          <div style="font-size: 11px; font-weight: 700; color: #60a5fa; text-transform: uppercase; tracking: 0.5px;">${customSched.type} • ${customSched.dayName}</div>
          <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-top: 2px;">🎯 Goal: ${customSched.goal}</div>
        `;
        parent.appendChild(goalCard);
      }
    }

    var events = getRevisionsForDate(activeDate, chapters);

    if (events.length === 0) {
      parent.appendChild(PD.Utils.createEl("p", { class: "empty-pane-text", text: "No revisions or planner targets scheduled on this date." }));
    } else {
      var list = PD.Utils.createEl("div", { class: "details-events-list" });
      events.forEach(function (ev) {
        var item = PD.Utils.createEl("div", { class: "detail-event-item" });
        
        var subBadge = PD.Utils.createEl("span", { class: "event-subject-badge subject-" + ev.subject.toLowerCase(), text: ev.subject });
        item.appendChild(subBadge);

        var info = PD.Utils.createEl("div", { class: "event-info" });
        info.appendChild(PD.Utils.createEl("div", { class: "event-title", text: ev.chapter }));
        
        var tagClass = ev.status === "planner-task" ? "tag-due-today" : "tag-" + ev.status;
        var statusLabel = PD.Utils.createEl("span", { class: "event-status-tag " + tagClass, text: ev.label });
        info.appendChild(statusLabel);
        item.appendChild(info);

        list.appendChild(item);
      });
      parent.appendChild(list);
    }
  }

  return { render: render };
})();

window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

PD.Pages.Planner = (function () {
  var SUBJECT_ORDER = ["Chemistry", "Physics", "Mathematics"];
  var activeTab = "today"; // "today" or "roadmap"

  function render(container) {
    var chapters = PD.Store.getChapters();
    var plannerState = syncPlannerState(chapters);

    var wrap = PD.Utils.createEl("div", { class: "page planner-page" });

    // Header Title
    wrap.appendChild(PD.Utils.createEl("h1", { class: "page-title", text: "Today's Study Plan" }));

    // Start date and progress row
    var startDate = PD.Store.getPlanStartDate();
    var dayNumber = PD.Services.Planner.getDayNumber(startDate);

    var dayRow = buildDayRow(startDate, dayNumber, function () {
      container.innerHTML = "";
      render(container);
    });
    wrap.appendChild(dayRow.el);

    // July 22-31 Master Strategy & Rules Banner
    var julyStrategyCard = buildJulyStrategyCard();
    if (julyStrategyCard) {
      wrap.appendChild(julyStrategyCard);
    }

    if (dayNumber < 1) {
      var daysAway = 1 - dayNumber;
      wrap.appendChild(
        PD.Utils.createEl("p", {
          class: "dash-empty-line",
          text:
            "Your plan starts " +
            formatDate(startDate) +
            " — " +
            daysAway +
            " day" +
            (daysAway === 1 ? "" : "s") +
            " from now. Today's mission will appear once it begins."
        })
      );
      container.appendChild(wrap);
      return;
    }

    // SECTION 1: ACCOUNTABILITY GATE (Unresolved Backlog)
    var backlogWrapper = PD.Utils.createEl("div", { class: "planner-backlog-wrapper" });
    renderBacklog(backlogWrapper, plannerState, function () {
      container.innerHTML = "";
      render(container);
    });
    wrap.appendChild(backlogWrapper);

    // SECTION 2: TABS BAR (Today's Mission vs 7-Day Roadmap)
    var tabsBar = buildTabsBar(function (tab) {
      activeTab = tab;
      container.innerHTML = "";
      render(container);
    });
    wrap.appendChild(tabsBar);

    // SECTION 3: TAB CONTENT AREA
    var contentArea = PD.Utils.createEl("div", { class: "planner-content-area" });
    if (activeTab === "today") {
      renderTodayMission(contentArea, plannerState, function () {
        container.innerHTML = "";
        render(container);
      });
    } else {
      render7DayRoadmap(contentArea, chapters);
    }
    wrap.appendChild(contentArea);

    container.appendChild(wrap);
  }

  function syncPlannerState(chapters) {
    var plannerState = PD.Store.getPlannerState();
    var todayStr = new Date().toISOString().split("T")[0];

    // If date changed, move incomplete todayMission items into backlog
    if (plannerState.lastActiveDate && plannerState.lastActiveDate !== todayStr) {
      if (plannerState.todayMission && plannerState.todayMission.length > 0) {
        var uncompleted = plannerState.todayMission.filter(function (item) {
          return !item.done;
        });

        uncompleted.forEach(function (item) {
          var alreadyInBacklog = plannerState.backlog.some(function (b) {
            return b.chapter.id === item.chapter.id && b.action.label === item.action.label;
          });
          if (!alreadyInBacklog) {
            plannerState.backlog.push({
              chapter: item.chapter,
              action: item.action,
              reason: item.reason,
              dateAdded: plannerState.lastActiveDate,
              done: false
            });
          }
        });
      }
      plannerState.todayMission = [];
    }

    // Always keep completed tasks from today
    var completedToday = (plannerState.todayMission || []).filter(function (item) {
      return item.done;
    });

    // Generate fresh recommendations
    var freshMission = PD.Services.Planner.getDailyMission(chapters);

    // Map fresh recommendations to planner mission items
    var newIncomplete = freshMission
      .filter(function (item) {
        // Do not add if already completed today
        return !completedToday.some(function (c) {
          return c.chapter.id === item.chapter.id;
        });
      })
      .map(function (item) {
        return {
          chapter: { id: item.chapter.id, chapter: item.chapter.chapter, subject: item.chapter.subject },
          reason: item.reason,
          action: item.action,
          done: false
        };
      });

    // Combine completed and new incomplete
    plannerState.todayMission = completedToday.concat(newIncomplete);
    plannerState.lastActiveDate = todayStr;
    PD.Store.setPlannerState(plannerState);

    return plannerState;
  }

  function buildDayRow(startDate, dayNumber, onDateChange) {
    var el = PD.Utils.createEl("div", { class: "planner-day-row" });
    
    var left = PD.Utils.createEl("div", { class: "planner-day-left" });
    var badge = PD.Utils.createEl("span", { 
      class: "planner-day-badge planner-day-label", 
      text: dayNumber < 1 ? "Not started yet" : "Day " + dayNumber + " of your plan" 
    });
    var label = PD.Utils.createEl("span", { 
      class: "planner-day-text", 
      text: dayNumber < 1 ? "Syllabus Plan scheduled to begin shortly" : "on your active study sprint (Target start: " + formatDate(startDate) + ")" 
    });
    left.appendChild(badge);
    left.appendChild(label);

    var right = PD.Utils.createEl("div", { class: "planner-day-right" });
    var inputLabel = PD.Utils.createEl("label", { class: "planner-input-label", text: "Change Start Date:" });
    var dateInput = PD.Utils.createEl("input", {
      type: "date",
      class: "planner-start-input",
      "aria-label": "Plan start date"
    });
    dateInput.value = startDate;

    dateInput.addEventListener("change", function () {
      if (!dateInput.value) return;
      PD.Store.setPlanStartDate(dateInput.value);
      // Reset the planner state when start date is manually changed so it re-seeds
      var state = PD.Store.getPlannerState();
      state.lastActiveDate = "";
      state.todayMission = [];
      state.backlog = [];
      PD.Store.setPlannerState(state);
      onDateChange();
    });

    right.appendChild(inputLabel);
    right.appendChild(dateInput);

    el.appendChild(left);
    el.appendChild(right);
    return { el: el };
  }

  function buildTabsBar(onTabChange) {
    var bar = PD.Utils.createEl("div", { class: "planner-tabs-bar" });
    
    var btnToday = PD.Utils.createEl("button", {
      class: "planner-tab-btn" + (activeTab === "today" ? " is-active" : ""),
      text: "Today's Focus"
    });
    var btnRoadmap = PD.Utils.createEl("button", {
      class: "planner-tab-btn" + (activeTab === "roadmap" ? " is-active" : ""),
      text: "7-Day Syllabus Journey"
    });

    btnToday.addEventListener("click", function () {
      if (activeTab === "today") return;
      onTabChange("today");
    });

    btnRoadmap.addEventListener("click", function () {
      if (activeTab === "roadmap") return;
      onTabChange("roadmap");
    });

    bar.appendChild(btnToday);
    bar.appendChild(btnRoadmap);
    return bar;
  }

  function renderBacklog(container, state, onRefresh) {
    container.innerHTML = "";
    var incompleteBacklog = (state.backlog || []).filter(function (b) { return !b.done; });
    if (incompleteBacklog.length === 0) return;

    var card = PD.Utils.createEl("div", { class: "backlog-card" });
    
    var header = PD.Utils.createEl("div", { class: "backlog-header" });
    var title = PD.Utils.createEl("h3", { class: "backlog-title", text: "⚠️ Unresolved Backlog (" + incompleteBacklog.length + " Overdue Tasks)" });
    var subtitle = PD.Utils.createEl("p", { 
      class: "backlog-subtitle", 
      text: "Accountability Gate Active: Complete previous tasks below to restore full schedule balance and lower your syllabus congestion score." 
    });
    
    header.appendChild(title);
    header.appendChild(subtitle);
    card.appendChild(header);

    var list = PD.Utils.createEl("div", { class: "backlog-list" });
    incompleteBacklog.forEach(function (item, index) {
      var row = PD.Utils.createEl("div", { class: "backlog-item" });
      
      var left = PD.Utils.createEl("div", { class: "backlog-item-left" });
      var subjBadge = PD.Utils.createEl("span", { class: "backlog-subj-badge subj-" + item.chapter.subject.toLowerCase(), text: item.chapter.subject });
      var chapName = PD.Utils.createEl("div", { class: "backlog-chap-name", text: item.chapter.chapter });
      var taskName = PD.Utils.createEl("div", { class: "backlog-task-name", text: item.action.label });
      var reason = PD.Utils.createEl("div", { class: "backlog-reason", text: "Overdue since " + formatDate(item.dateAdded) + " — " + item.reason });

      left.appendChild(subjBadge);
      left.appendChild(chapName);
      left.appendChild(taskName);
      left.appendChild(reason);

      var right = PD.Utils.createEl("div", { class: "backlog-item-right" });
      var actionBtn = buildTaskActionBtn(item, function () {
        // Mark backlog item as done
        item.done = true;
        // Filter out completed ones immediately to persist clean backlog
        state.backlog = state.backlog.filter(function (b) { return !b.done; });
        PD.Store.setPlannerState(state);
        onRefresh();
      });
      right.appendChild(actionBtn);

      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    });

    card.appendChild(list);
    container.appendChild(card);
  }

  function renderTodayMission(container, state, onRefresh) {
    container.innerHTML = "";
    
    var incompleteToday = (state.todayMission || []).filter(function (m) { return !m.done; });
    var completedToday = (state.todayMission || []).filter(function (m) { return m.done; });

    if (incompleteToday.length === 0 && completedToday.length === 0) {
      container.appendChild(
        PD.Utils.createEl("p", {
          class: "dash-empty-line",
          text: "No active mission tasks today. Complete any unstarted syllabus chapters in the Tracker to prompt new schedules."
        })
      );
      return;
    }

    // Display Subject Work Allocation Cards
    var mainGrid = PD.Utils.createEl("div", { class: "planner-today-grid planner-mission" });

    // 1. Incomplete Section
    if (incompleteToday.length > 0) {
      var sectionIncomplete = PD.Utils.createEl("div", { class: "today-section" });
      sectionIncomplete.appendChild(PD.Utils.createEl("h3", { class: "section-header-text", text: "Today's Core Targets" }));

      incompleteToday.forEach(function (item) {
        var card = buildMissionItemCard(item, false, function () {
          item.done = true;
          PD.Store.setPlannerState(state);
          onRefresh();
        });
        sectionIncomplete.appendChild(card);
      });
      mainGrid.appendChild(sectionIncomplete);
    }

    // 2. Completed Section
    if (completedToday.length > 0) {
      var sectionCompleted = PD.Utils.createEl("div", { class: "today-section today-section-completed" });
      sectionCompleted.appendChild(PD.Utils.createEl("h3", { class: "section-header-text", text: "Completed Today" }));

      completedToday.forEach(function (item) {
        var card = buildMissionItemCard(item, true, null);
        sectionCompleted.appendChild(card);
      });
      mainGrid.appendChild(sectionCompleted);
    }

    container.appendChild(mainGrid);
  }

  var forecastWindow = 7; // 7, 30, or 146 (Dec 15)

  function render7DayRoadmap(container, chapters) {
    container.innerHTML = "";

    var cetTarget = new Date("2026-12-15T00:00:00");
    var today = new Date();
    var daysToCET = Math.max(1, Math.round((cetTarget.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));

    var actualWindow = forecastWindow === 146 ? daysToCET : forecastWindow;
    var forecast = PD.Services.Planner.getForecast(chapters, actualWindow);

    var header = PD.Utils.createEl("div", { class: "roadmap-header", style: "display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;" });
    
    var topRow = PD.Utils.createEl("div", { style: "display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;" });
    var title = PD.Utils.createEl("h3", { class: "roadmap-title", text: "🔮 Dynamic Adaptive Master Plan (Target: MHT-CET Dec 15, 2026)" });
    
    var windowSwitcher = PD.Utils.createEl("div", { class: "ws-chip-group" });
    [
      { label: "7-Day Sprint", value: 7 },
      { label: "30-Day Horizon", value: 30 },
      { label: "Master Plan (Till Dec 15)", value: 146 }
    ].forEach(function (opt) {
      var chip = PD.Utils.createEl("button", {
        class: "ws-chip" + (forecastWindow === opt.value ? " active" : ""),
        text: opt.label
      });
      chip.addEventListener("click", function () {
        forecastWindow = opt.value;
        render7DayRoadmap(container, chapters);
      });
      windowSwitcher.appendChild(chip);
    });
    topRow.appendChild(title);
    topRow.appendChild(windowSwitcher);
    header.appendChild(topRow);

    var desc = PD.Utils.createEl("p", { 
      class: "roadmap-desc", 
      text: "Complete multi-month roadmap projecting daily targets across all 99 Physics, Chemistry, and Mathematics chapters to ensure full syllabus coverage, practice, and spaced revisions before 15th December 2026." 
    });
    header.appendChild(desc);

    // MHT-CET Strategy Milestone Banner
    var strategyBanner = PD.Utils.createEl("div", { 
      style: "background: rgba(30,41,59,0.7); border: 1px solid var(--border-subtle); padding: 16px; rounded: 16px; margin-bottom: 20px; border-radius: 12px;" 
    });
    strategyBanner.innerHTML = `
      <div style="font-weight: 800; font-size: 14px; color: #60a5fa; margin-bottom: 8px;">🎯 Master MHT-CET Exam Strategy Milestones (${daysToCET} Days Left)</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 12px; color: var(--text-secondary);">
        <div style="background: rgba(15,23,42,0.6); padding: 10px; border-radius: 8px; border-left: 3px solid #3b82f6;">
          <strong style="color: #93c5fd; display: block; margin-bottom: 2px;">Phase 1: Syllabus Sprint</strong>
          July 22 – Oct 15 • Primary theory, NCERT/Coaching modules & basic practice across all 99 chapters.
        </div>
        <div style="background: rgba(15,23,42,0.6); padding: 10px; border-radius: 8px; border-left: 3px solid #f59e0b;">
          <strong style="color: #fde68a; display: block; margin-bottom: 2px;">Phase 2: PYQ & Weak Drills</strong>
          Oct 16 – Nov 20 • Intensive past paper solving, timed chapter tests & confidence boost.
        </div>
        <div style="background: rgba(15,23,42,0.6); padding: 10px; border-radius: 8px; border-left: 3px solid #10b981;">
          <strong style="color: #a7f3d0; display: block; margin-bottom: 2px;">Phase 3: Final Mocks & Formula Refresher</strong>
          Nov 21 – Dec 14 • MHT-CET Full Length Mocks, speed optimization & final rapid revisions.
        </div>
      </div>
    `;
    header.appendChild(strategyBanner);

    container.appendChild(header);

    var timeline = PD.Utils.createEl("div", { class: "roadmap-timeline" });

    // Limit displayed cards if 146 days to avoid DOM lag, with a pagination/scroll
    var displayForecast = forecast.slice(0, forecastWindow === 146 ? 60 : forecastWindow);

    displayForecast.forEach(function (day) {
      var dayCard = PD.Utils.createEl("div", { class: "roadmap-day-card" });
      
      var dayHeader = PD.Utils.createEl("div", { class: "roadmap-day-header" });
      var dayTitle = PD.Utils.createEl("span", { class: "roadmap-day-title", text: "Day " + (day.dayOffset + 1) });
      var dayDate = PD.Utils.createEl("span", { class: "roadmap-day-date", text: formatDate(day.dateStr) });
      dayHeader.appendChild(dayTitle);
      dayHeader.appendChild(dayDate);
      dayCard.appendChild(dayHeader);

      var tasksList = PD.Utils.createEl("div", { class: "roadmap-day-tasks" });
      if (day.mission.length === 0) {
        var empty = PD.Utils.createEl("div", { class: "roadmap-task-empty", text: "Rest/Self-study Day — Backlog cleared" });
        tasksList.appendChild(empty);
      } else {
        day.mission.forEach(function (item) {
          var taskRow = PD.Utils.createEl("div", { class: "roadmap-task-row" });
          
          var left = PD.Utils.createEl("div", { class: "roadmap-task-left" });
          var subjDot = PD.Utils.createEl("span", { class: "roadmap-task-subj-dot subj-" + item.chapter.subject.toLowerCase() });
          var details = PD.Utils.createEl("div", { class: "roadmap-task-details" });
          var mainLabel = PD.Utils.createEl("span", { class: "roadmap-task-main", text: item.chapter.chapter + " → " + item.action.label });
          var reason = PD.Utils.createEl("span", { class: "roadmap-task-reason", text: item.reason });
          
          details.appendChild(mainLabel);
          details.appendChild(reason);
          left.appendChild(subjDot);
          left.appendChild(details);
          
          taskRow.appendChild(left);
          tasksList.appendChild(taskRow);
        });
      }
      
      dayCard.appendChild(tasksList);
      timeline.appendChild(dayCard);
    });

    if (forecastWindow === 146 && forecast.length > 60) {
      var note = PD.Utils.createEl("div", { 
        style: "text-align: center; padding: 16px; color: var(--text-tertiary); font-size: 13px;", 
        text: `Showing first 60 days of the Master Plan. Complete daily missions to adaptively project through Dec 15th!` 
      });
      timeline.appendChild(note);
    }

    container.appendChild(timeline);
  }

  function buildMissionItemCard(item, isDone, onCheck) {
    var card = PD.Utils.createEl("div", { class: "mission-card planner-subject-group" + (isDone ? " is-done" : "") });
    
    var body = PD.Utils.createEl("div", { class: "mission-card-body" });
    
    var titleRow = PD.Utils.createEl("div", { class: "mission-card-title-row" });
    var subjectBadge = PD.Utils.createEl("span", { 
      class: "mission-subj-badge planner-subject-name subj-" + item.chapter.subject.toLowerCase(), 
      text: item.chapter.subject 
    });
    var reasonLabel = PD.Utils.createEl("span", { class: "mission-card-reason", text: item.reason });
    titleRow.appendChild(subjectBadge);
    titleRow.appendChild(reasonLabel);
    body.appendChild(titleRow);

    var chapName = PD.Utils.createEl("h4", { class: "mission-card-chapter mission-chapter-name", text: item.chapter.chapter });
    var taskLabel = PD.Utils.createEl("p", { class: "mission-card-task mission-task-label", text: item.action.label });
    body.appendChild(chapName);
    body.appendChild(taskLabel);

    card.appendChild(body);

    var footer = PD.Utils.createEl("div", { class: "mission-card-footer" });
    var actionBtn;
    if (isDone) {
      actionBtn = PD.Utils.createEl("button", {
        class: "mission-action-button mission-checkbox is-checked",
        disabled: true,
        text: "✓ Completed"
      });
    } else {
      actionBtn = buildTaskActionBtn(item, onCheck);
    }
    footer.appendChild(actionBtn);
    card.appendChild(footer);

    return card;
  }

  function buildTaskActionBtn(item, onDone) {
    if (item.action.kind === "resource") {
      var btn = PD.Utils.createEl("button", {
        class: "mission-action-button resource-complete-btn mission-checkbox",
        type: "button",
        text: "Check Off Task"
      });
      btn.addEventListener("click", function () {
        // Complete the resource in storage
        var chapter = PD.Store.getChapter(item.chapter.id);
        if (chapter && item.action.resource) {
          var updated = (chapter.resources || []).map(function (r) {
            return r.id === item.action.resource.id ? Object.assign({}, r, { status: "done" }) : r;
          });
          PD.Store.updateChapter(chapter.id, { resources: updated, lastStudied: new Date().toISOString() });
        }
        btn.disabled = true;
        btn.textContent = "Done";
        onDone();
      });
      return btn;
    }

    if (item.action.kind === "revision") {
      var btn = PD.Utils.createEl("button", {
        class: "mission-action-button revision-complete-btn mission-action-btn",
        type: "button",
        text: "Log Revision"
      });
      btn.addEventListener("click", function () {
        var chapter = PD.Store.getChapter(item.chapter.id);
        if (chapter) {
          var patch = PD.Services.Revision.logRevision(chapter);
          PD.Store.updateChapter(chapter.id, patch);
        }
        btn.disabled = true;
        btn.textContent = "Logged";
        onDone();
      });
      return btn;
    }

    // Otherwise, generic open/progress button
    var btn = PD.Utils.createEl("button", {
      class: "mission-action-button action-btn-quiet mission-action-btn-quiet",
      type: "button",
      text: "Quick Finish in Tracker"
    });
    btn.addEventListener("click", function () {
      PD.Router.focusChapter(item.chapter.id);
    });
    return btn;
  }

  function buildJulyStrategyCard() {
    var rules = window.PD && window.PD.Services && window.PD.Services.JulySchedule ? window.PD.Services.JulySchedule.WEEKLY_RULES : null;
    if (!rules) return null;

    var card = PD.Utils.createEl("div", { 
      style: "background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" 
    });

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">📌</span>
            <h3 style="font-size: 16px; font-weight: 800; color: #60a5fa; margin: 0;">July 22–31 Default Master Roadmap: Weekly Test & Coaching Blueprint</h3>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0 0;">70% Coaching Focus • 30% Backlog Reduction • Sunday Test + Analysis</p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span style="background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px;">Coaching 70%</span>
          <span style="background: rgba(245,158,11,0.15); color: #fde68a; border: 1px solid rgba(245,158,11,0.3); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px;">Backlog 30%</span>
          <span style="background: rgba(16,185,129,0.15); color: #a7f3d0; border: 1px solid rgba(16,185,129,0.3); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px;">Deep Work: Tue & Sat</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; font-size: 12px; margin-bottom: 14px;">
        <!-- Coaching Priority Box -->
        <div style="background: rgba(15,23,42,0.6); padding: 14px; border-radius: 12px; border: 1px solid rgba(59,130,246,0.25);">
          <strong style="color: #60a5fa; font-weight: 800; display: block; margin-bottom: 8px; font-size: 13px;">🔥 Current Coaching Priority (Highest - 70%)</strong>
          <div style="display: flex; flex-direction: column; gap: 6px; color: var(--text-primary); line-height: 1.5;">
            <div><strong style="color: #93c5fd;">Physics:</strong> Current Electricity</div>
            <div><strong style="color: #93c5fd;">Chemistry:</strong> Liquid Solutions, Hydrocarbons</div>
            <div><strong style="color: #93c5fd;">Maths:</strong> Methods of Differentiation, Applications of Derivatives</div>
          </div>
        </div>

        <!-- Backlog Priority Box -->
        <div style="background: rgba(15,23,42,0.6); padding: 14px; border-radius: 12px; border: 1px solid rgba(245,158,11,0.25);">
          <strong style="color: #f59e0b; font-weight: 800; display: block; margin-bottom: 8px; font-size: 13px;">🎯 Current Backlog (Gradually Cover - 30%)</strong>
          <div style="display: flex; flex-direction: column; gap: 6px; color: var(--text-primary); line-height: 1.5;">
            <div><strong style="color: #fde68a;">Physics:</strong> Electrostatics, Capacitors, Calorimetry, Thermal Expansion</div>
            <div><strong style="color: #fde68a;">Chemistry:</strong> Thermodynamics, Thermochemistry, Chemical Equilibrium, Ionic Equilibrium, GOC</div>
            <div><strong style="color: #fde68a;">Maths:</strong> Quadratic, Complex Numbers, Sequence & Series, Binomial</div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; font-size: 12px;">
        <div style="background: rgba(15,23,42,0.4); padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
          <strong style="color: #93c5fd; font-weight: 700; display: block; margin-bottom: 4px;">⚡ Weekly Priority Rules</strong>
          <div style="color: var(--text-secondary); line-height: 1.5;">1. Coaching Lectures &nbsp; 2. Homework &nbsp; 3. Module &nbsp; 4. Backlog &nbsp; 5. Revision</div>
        </div>

        <div style="background: rgba(15,23,42,0.4); padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
          <strong style="color: #a7f3d0; font-weight: 700; display: block; margin-bottom: 4px;">📋 Daily Non-Negotiable Checklist</strong>
          <div style="color: var(--text-secondary); line-height: 1.5;">• Update Error Notebook &nbsp; • Formula Sheet 20m &nbsp; • Carry backlog forward</div>
        </div>
      </div>
    `;

    return card;
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return { render: render };
})();

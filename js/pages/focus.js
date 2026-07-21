window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

PD.Pages.Focus = (function () {
  function render(container) {
    var state = PD.Services.Focus.getFocusState();
    var chapters = PD.Store.getChapters();
    var wrap = PD.Utils.createEl("div", { class: "page focus-page" });

    // Header
    renderHeader(wrap);

    // Grid row 1: Focus Score Gauge & Stats Cards
    var topGrid = PD.Utils.createEl("div", { class: "focus-top-grid" });
    topGrid.appendChild(buildFocusGaugeCard());
    topGrid.appendChild(buildFocusStatsCards(state));
    wrap.appendChild(topGrid);

    // Hero Section: Smart Start & Action Launcher
    wrap.appendChild(buildSmartStartHero(chapters, state));

    // Section 2: Procrastination Diagnostics & Warning Engine
    wrap.appendChild(buildProcrastinationDiagnostics(chapters));

    // Section 3: Rescue Mode & Recovery Plan
    wrap.appendChild(buildRescueModeSection(chapters, state, wrap));

    // Section 4: Interactive Micro-Task Generator
    wrap.appendChild(buildMicroTaskGenerator(chapters));

    // Section 5: Gentle Accountability & Momentum
    wrap.appendChild(buildAccountabilityCard());

    container.appendChild(wrap);
  }

  function renderHeader(wrap) {
    var header = PD.Utils.createEl("div", { class: "focus-page-header" });

    var titleBox = PD.Utils.createEl("div");
    titleBox.appendChild(PD.Utils.createEl("h1", { class: "page-title", text: "⚡ Focus & Anti-Procrastination Engine" }));
    titleBox.appendChild(PD.Utils.createEl("p", {
      class: "page-subtitle",
      text: "Science-backed tools to defeat friction, maintain study momentum, and recover from procrastination."
    }));
    header.appendChild(titleBox);

    var badge = PD.Utils.createEl("div", { class: "focus-header-badge" });
    badge.innerHTML = `<span>🧠 Momentum Status:</span> <strong>Active Study OS</strong>`;
    header.appendChild(badge);

    wrap.appendChild(header);
  }

  /* ==========================================================================
     FOCUS SCORE GAUGE CARD
     ========================================================================== */

  function buildFocusGaugeCard() {
    var score = PD.Services.Focus.getFocusScore();
    var card = PD.Utils.createEl("div", { class: "focus-gauge-card" });

    var title = PD.Utils.createEl("h3", { class: "focus-card-title", text: "🎯 Focus Score" });
    card.appendChild(title);

    // SVG Circular Gauge
    var gaugeWrap = PD.Utils.createEl("div", { class: "focus-svg-gauge-wrap" });

    var circumference = 2 * Math.PI * 42; // r = 42
    var strokeDashoffset = circumference - (score / 100) * circumference;

    gaugeWrap.innerHTML = `
      <svg class="focus-gauge-svg" viewBox="0 0 100 100">
        <circle class="focus-gauge-bg" cx="50" cy="50" r="42" />
        <circle class="focus-gauge-fill" cx="50" cy="50" r="42" 
                style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset};" />
      </svg>
      <div class="focus-gauge-center">
        <span class="focus-score-val">${score}</span>
        <span class="focus-score-label">/100</span>
      </div>
    `;

    card.appendChild(gaugeWrap);

    var levelLabel = score >= 80 ? "🔥 Peak Momentum" : score >= 50 ? "⚡ Steady Progress" : "🌱 Activation Needed";
    card.appendChild(PD.Utils.createEl("div", { class: "focus-gauge-subtext", text: levelLabel }));

    return card;
  }

  /* ==========================================================================
     STATISTICS OVERVIEW CARDS
     ========================================================================== */

  function buildFocusStatsCards(state) {
    var grid = PD.Utils.createEl("div", { class: "focus-stats-grid" });

    var completed = PD.Services.Focus.getTodayCompletedHours();
    var target = state.dailyTargetHours || 6.0;
    var streak = PD.Services.StudySession ? PD.Services.StudySession.getStreak() : 0;

    // Card 1: Today's Hours
    var c1 = PD.Utils.createEl("div", { class: "focus-stat-card" });
    c1.innerHTML = `
      <div class="fstat-icon">⏳</div>
      <div class="fstat-meta">
        <span class="fstat-label">Today's Focus</span>
        <span class="fstat-value">${completed} <small>/ ${target} hrs</small></span>
        <div class="fstat-progress-bar">
          <div class="fstat-progress-fill" style="width: ${Math.min(100, Math.round((completed / target) * 100))}%;"></div>
        </div>
      </div>
    `;
    grid.appendChild(c1);

    // Card 2: Streak
    var c2 = PD.Utils.createEl("div", { class: "focus-stat-card" });
    c2.innerHTML = `
      <div class="fstat-icon">🔥</div>
      <div class="fstat-meta">
        <span class="fstat-label">Current Streak</span>
        <span class="fstat-value">${streak} <small>Days</small></span>
        <span class="fstat-sub">Keep momentum alive today!</span>
      </div>
    `;
    grid.appendChild(c2);

    // Card 3: Est. Finish Time
    var remHours = Math.max(0, target - completed);
    var now = new Date();
    var estFinish = new Date(now.getTime() + remHours * 60 * 60 * 1000);
    var timeStr = remHours > 0 ? estFinish.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Target Reached!";

    var c3 = PD.Utils.createEl("div", { class: "focus-stat-card" });
    c3.innerHTML = `
      <div class="fstat-icon">🏁</div>
      <div class="fstat-meta">
        <span class="fstat-label">Est. Finish Time</span>
        <span class="fstat-value">${timeStr}</span>
        <span class="fstat-sub">${remHours > 0 ? remHours.toFixed(1) + " hrs remaining today" : "Goal completed!"}</span>
      </div>
    `;
    grid.appendChild(c3);

    // Card 4: Daily Goal Selector Quick Controls
    var c4 = PD.Utils.createEl("div", { class: "focus-stat-card focus-card-interactive" });
    var c4Header = PD.Utils.createEl("div", { class: "fstat-label", text: "🎯 Adjust Daily Target" });
    var c4Chips = PD.Utils.createEl("div", { class: "ws-chip-group", style: "margin-top: 6px;" });

    [4, 6, 8, 10].forEach(function (h) {
      var chip = PD.Utils.createEl("button", {
        type: "button",
        class: "ws-chip " + (state.dailyTargetHours === h ? "active" : ""),
        text: h + " Hrs"
      });
      chip.addEventListener("click", function () {
        PD.Services.Focus.updateFocusState({ dailyTargetHours: h });
        var mainSlot = document.querySelector("#main-slot");
        if (mainSlot) { mainSlot.innerHTML = ""; render(mainSlot); }
      });
      c4Chips.appendChild(chip);
    });

    c4.appendChild(c4Header);
    c4.appendChild(c4Chips);
    grid.appendChild(c4);

    return grid;
  }

  /* ==========================================================================
     SMART START HERO CARD
     ========================================================================== */

  function buildSmartStartHero(chapters, state) {
    var hero = PD.Utils.createEl("div", { class: "focus-hero-card" });

    // Find top priority chapter
    var priorityCh = null;
    var taskLabel = "📖 Theory Reading & Concept Practice";

    if (window.PD.Services.Planner) {
      var mission = window.PD.Services.Planner.getDailyMission(chapters);
      if (mission && mission.length > 0) {
        priorityCh = mission[0].chapter;
        taskLabel = (mission[0].action ? mission[0].action.label : mission[0].reason) || taskLabel;
      }
    }

    if (!priorityCh && chapters.length > 0) priorityCh = chapters[0];

    var chTitle = priorityCh ? priorityCh.chapter : "Kinematics";
    var subj = priorityCh ? priorityCh.subject : "Physics";

    hero.innerHTML = `
      <div class="focus-hero-content">
        <div class="focus-hero-badge">🚀 Instant Activation</div>
        <h2 class="focus-hero-title">Start Studying in 1 Click</h2>
        <p class="focus-hero-desc">
          Remove friction and overthinking. Smart Start automatically picks your highest priority chapter and launches your focus timer.
        </p>
        <div class="focus-hero-target-box">
          <span class="task-subject-badge subject-${subj.toLowerCase()}">${subj}</span>
          <span class="focus-hero-target-name">${chTitle}</span>
          <span class="focus-hero-target-task">• ${taskLabel}</span>
        </div>
      </div>
    `;

    var launchBtn = PD.Utils.createEl("button", { class: "focus-hero-launch-btn", text: "⚡ Launch Focus Session (45m)" });
    launchBtn.addEventListener("click", function () {
      PD.Services.Focus.smartStart({
        chapterId: priorityCh ? priorityCh.id : null,
        taskLabel: taskLabel,
        durationMinutes: state.sessionDuration || 45
      });
    });

    hero.appendChild(launchBtn);
    return hero;
  }

  /* ==========================================================================
     PROCRASTINATION DIAGNOSTICS SECTION
     ========================================================================== */

  function buildProcrastinationDiagnostics(chapters) {
    var section = PD.Utils.createEl("section", { class: "focus-section" });
    section.appendChild(PD.Utils.createEl("h2", { class: "focus-section-title", text: "🩺 Procrastination Diagnostics Engine" }));

    var warnings = PD.Services.Focus.detectProcrastination(chapters);
    var list = PD.Utils.createEl("div", { class: "focus-diag-grid" });

    warnings.forEach(function (warn) {
      var item = PD.Utils.createEl("div", { class: "focus-diag-card diag-severity-" + warn.severity });

      item.innerHTML = `
        <div class="diag-header">
          <span class="diag-icon">${warn.icon}</span>
          <div>
            <h4 class="diag-title">${warn.title}</h4>
            <p class="diag-msg">${warn.message}</p>
          </div>
        </div>
        <div class="diag-suggestion">
          <strong>💡 Action Tip:</strong> ${warn.suggestion}
        </div>
      `;

      if (warn.actionText) {
        var btn = PD.Utils.createEl("button", { class: "ws-chip active", style: "margin-top: 10px;", text: warn.actionText });
        btn.addEventListener("click", function () {
          if (warn.id === "late_start" || warn.id === "fresh_start") {
            PD.Services.Focus.smartStart({ durationMinutes: 15, taskLabel: "⚡ 15-min Warm-Up" });
          } else if (warn.id === "abandoned_trend") {
            PD.Services.Focus.updateFocusState({ sessionDuration: 20 });
            alert("Session duration set to 20 minutes for low friction!");
          }
        });
        item.appendChild(btn);
      }

      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
  }

  /* ==========================================================================
     RESCUE MODE & RECOVERY PLAN
     ========================================================================== */

  function buildRescueModeSection(chapters, state, wrap) {
    var section = PD.Utils.createEl("section", { class: "focus-section focus-rescue-section" });

    var header = PD.Utils.createEl("div", { class: "focus-section-header" });
    header.appendChild(PD.Utils.createEl("h2", { class: "focus-section-title", text: "🛟 Rescue Mode & Micro Recovery Plan" }));

    var toggleBtn = PD.Utils.createEl("button", {
      class: "ws-launch-btn " + (state.rescueModeActive ? "is-rescue-active" : ""),
      style: "width: auto; padding: 8px 16px; font-size: 13px;",
      text: state.rescueModeActive ? "✓ Rescue Mode Active (Click to Turn Off)" : "🛟 Activate Rescue Mode"
    });

    toggleBtn.addEventListener("click", function () {
      var nextState = !state.rescueModeActive;
      PD.Services.Focus.updateFocusState({ rescueModeActive: nextState });
      var mainSlot = document.querySelector("#main-slot");
      if (mainSlot) { mainSlot.innerHTML = ""; render(mainSlot); }
    });

    header.appendChild(toggleBtn);
    section.appendChild(header);

    var desc = PD.Utils.createEl("p", {
      class: "focus-section-desc",
      text: "Feeling stuck, overwhelmed, or behind schedule? Rescue Mode condenses your study plan into 3 micro steps so you can regain momentum without cognitive overload."
    });
    section.appendChild(desc);

    var rescuePlan = PD.Services.Focus.getRescuePlan(chapters);
    var planGrid = PD.Utils.createEl("div", { class: "rescue-plan-grid" });

    rescuePlan.forEach(function (plan) {
      var item = PD.Utils.createEl("div", { class: "rescue-plan-card" });

      item.innerHTML = `
        <div class="rescue-step-num">Step ${plan.step}</div>
        <div class="rescue-card-main">
          <span class="task-subject-badge subject-${plan.subject.toLowerCase()}">${plan.subject}</span>
          <h4 class="rescue-card-title">${plan.chapter}</h4>
          <p class="rescue-card-task">${plan.taskLabel}</p>
          <p class="rescue-card-desc">${plan.desc}</p>
        </div>
      `;

      var launchBtn = PD.Utils.createEl("button", { class: "ws-chip active", style: "margin-top: 10px;", text: "🚀 Start Step " + plan.step + " (" + plan.durationMinutes + "m)" });
      launchBtn.addEventListener("click", function () {
        PD.Services.Focus.smartStart({
          chapterId: plan.chapterId,
          taskLabel: plan.taskLabel,
          durationMinutes: plan.durationMinutes
        });
      });

      item.appendChild(launchBtn);
      planGrid.appendChild(item);
    });

    section.appendChild(planGrid);
    return section;
  }

  /* ==========================================================================
     MICRO TASK GENERATOR
     ========================================================================== */

  function buildMicroTaskGenerator(chapters) {
    var section = PD.Utils.createEl("section", { class: "focus-section" });
    section.appendChild(PD.Utils.createEl("h2", { class: "focus-section-title", text: "🧩 Micro-Task Generator" }));
    section.appendChild(PD.Utils.createEl("p", {
      class: "focus-section-desc",
      text: "Decompose any complex chapter into bite-sized 10-20 minute actionable study chunks."
    }));

    var container = PD.Utils.createEl("div", { class: "micro-generator-card" });

    // Selector
    var selectGroup = PD.Utils.createEl("div", { class: "ws-form-group" });
    selectGroup.appendChild(PD.Utils.createEl("label", { class: "ws-form-label", text: "Select Chapter to Decompose" }));

    var select = PD.Utils.createEl("select", { class: "ws-select", id: "micro-chapter-select" });
    chapters.forEach(function (ch) {
      select.appendChild(PD.Utils.createEl("option", { value: ch.id, text: "[" + ch.subject + "] " + ch.chapter }));
    });
    selectGroup.appendChild(select);
    container.appendChild(selectGroup);

    var tasksSlot = PD.Utils.createEl("div", { class: "micro-tasks-slot", style: "margin-top: 15px;" });
    container.appendChild(tasksSlot);

    function renderTasks() {
      tasksSlot.innerHTML = "";
      var selectedId = select.value || (chapters[0] ? chapters[0].id : null);
      if (!selectedId) return;

      var ch = PD.Store.getChapter(selectedId);
      var microTasks = PD.Services.Focus.getMicroTasksForChapter(ch);

      var grid = PD.Utils.createEl("div", { class: "micro-task-grid" });

      microTasks.forEach(function (m) {
        var item = PD.Utils.createEl("div", { class: "micro-task-card" });

        item.innerHTML = `
          <div class="micro-task-header">
            <strong>${m.label}</strong>
            <span class="micro-task-time">${m.durationMinutes}m</span>
          </div>
          <p class="micro-task-desc">${m.desc}</p>
        `;

        var btn = PD.Utils.createEl("button", { class: "ws-chip active", style: "margin-top: 8px;", text: "▶ Do This Micro-Task Now" });
        btn.addEventListener("click", function () {
          PD.Services.Focus.smartStart({
            chapterId: ch.id,
            taskLabel: m.label,
            durationMinutes: m.durationMinutes
          });
        });

        item.appendChild(btn);
        grid.appendChild(item);
      });

      tasksSlot.appendChild(grid);
    }

    select.addEventListener("change", renderTasks);
    setTimeout(renderTasks, 0);

    section.appendChild(container);
    return section;
  }

  /* ==========================================================================
     GENTLE ACCOUNTABILITY & MOMENTUM
     ========================================================================== */

  function buildAccountabilityCard() {
    var card = PD.Utils.createEl("section", { class: "focus-accountability-card" });
    var msg = PD.Services.Focus.getGentleAccountabilityMessage();

    card.innerHTML = `
      <div class="accountability-badge">${msg.badge}</div>
      <h3 class="accountability-quote">"${msg.quote}"</h3>
      <p class="accountability-sub">${msg.sub}</p>
    `;

    return card;
  }

  return { render: render };
})();

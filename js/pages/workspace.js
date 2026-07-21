window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

PD.Pages.Workspace = (function () {
  var timerInterval = null;
  var stopwatchInterval = null;

  var timerSecondsLeft = 0;
  var timerIsRunning = false;
  
  var stopwatchSeconds = 0;
  var stopwatchIsRunning = false;

  var activeTab = "scratchpad"; // "scratchpad" | "errors" | "metrics"
  var currentTimerMode = "countdown"; // "countdown" | "stopwatch"

  function render(container) {
    var session = PD.Services.StudySession.getActiveSession();
    var wrap = PD.Utils.createEl("div", { class: "page workspace-page" });

    // Header
    renderHeader(wrap, session);

    if (!session) {
      renderSetupView(wrap, container);
    } else {
      renderActiveSessionView(wrap, session, container);
    }

    container.appendChild(wrap);
  }

  function renderHeader(wrap, session) {
    var header = PD.Utils.createEl("div", { class: "workspace-page-header" });

    var titleBox = PD.Utils.createEl("div");
    titleBox.appendChild(PD.Utils.createEl("h1", { class: "workspace-page-title", text: "Focus Workspace" }));
    titleBox.appendChild(PD.Utils.createEl("p", {
      class: "workspace-page-subtitle",
      text: "Distraction-free study cockpit with real-time timers, chapter resource checklist, and live notes."
    }));
    header.appendChild(titleBox);

    var badgeText = session 
      ? "🟢 Live Focus: " + session.subject + " • " + session.chapter 
      : "⏱ Ready to Initialize Session";

    var badge = PD.Utils.createEl("span", {
      class: "workspace-status-badge " + (session ? "is-active" : ""),
      text: badgeText
    });
    header.appendChild(badge);

    wrap.appendChild(header);
  }

  /* ==========================================================================
     SETUP VIEW
     ========================================================================== */

  function renderSetupView(wrap, container) {
    var grid = PD.Utils.createEl("div", { class: "workspace-setup-grid" });

    // LEFT CARD: Session Configuration
    var setupCard = PD.Utils.createEl("div", { class: "workspace-card" });

    var cardHeader = PD.Utils.createEl("div", { class: "workspace-card-header" });
    cardHeader.appendChild(PD.Utils.createEl("h2", { class: "workspace-card-title", text: "⚙️ Configure Study Session" }));
    setupCard.appendChild(cardHeader);

    // Form
    var form = PD.Utils.createEl("div");

    // 1. Chapter Selection
    var chapGroup = PD.Utils.createEl("div", { class: "ws-form-group" });
    chapGroup.appendChild(PD.Utils.createEl("label", { class: "ws-form-label", text: "Select Chapter" }));
    
    var chapSelect = PD.Utils.createEl("select", { class: "ws-select", id: "setup-chapter-select" });
    chapSelect.appendChild(PD.Utils.createEl("option", { value: "", text: "-- Choose Chapter from Master Tracker --" }));
    
    var chapters = PD.Store.getChapters();
    chapters.forEach(function (c) {
      chapSelect.appendChild(PD.Utils.createEl("option", {
        value: c.id,
        text: "[" + c.subject + "] " + c.chapter + " (Health: " + (c.healthScore || c.health || 0) + "%)"
      }));
    });
    chapGroup.appendChild(chapSelect);
    form.appendChild(chapGroup);

    // 2. Task Details / Presets
    var taskGroup = PD.Utils.createEl("div", { class: "ws-form-group" });
    taskGroup.appendChild(PD.Utils.createEl("label", { class: "ws-form-label", text: "Task Type & Quick Presets" }));

    var taskInput = PD.Utils.createEl("input", {
      type: "text",
      class: "ws-input",
      id: "setup-label-input",
      placeholder: "e.g., Coaching Theory Reading or Solving PYQs"
    });

    var taskChips = PD.Utils.createEl("div", { class: "ws-chip-group" });
    var taskPresets = ["📖 Theory Reading", "✍️ PYQs Practice", "🧠 Mind Map & Notes", "🔁 Chapter Revision", "⚡ Mock Test"];
    taskPresets.forEach(function (preset) {
      var chip = PD.Utils.createEl("button", { type: "button", class: "ws-chip", text: preset });
      chip.addEventListener("click", function () {
        taskInput.value = preset;
        PD.Utils.qsa(".task-preset-chip", taskChips).forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
      });
      chip.classList.add("task-preset-chip");
      taskChips.appendChild(chip);
    });

    taskGroup.appendChild(taskInput);
    taskGroup.appendChild(taskChips);
    form.appendChild(taskGroup);

    // Auto-update task description when chapter changes
    chapSelect.addEventListener("change", function () {
      var selectedId = chapSelect.value;
      if (selectedId) {
        var ch = PD.Store.getChapter(selectedId);
        if (ch && !taskInput.value) {
          // Check for pending resource
          var pending = (ch.resources || []).find(function (r) { return r.status !== "done"; });
          if (pending) {
            taskInput.value = pending.label;
          } else {
            taskInput.value = "General Chapter Practice";
          }
        }
      }
    });

    // 3. Duration Presets
    var durGroup = PD.Utils.createEl("div", { class: "ws-form-group" });
    durGroup.appendChild(PD.Utils.createEl("label", { class: "ws-form-label", text: "Target Duration (Minutes)" }));

    var durInput = PD.Utils.createEl("input", {
      type: "number",
      class: "ws-input",
      id: "setup-duration-input",
      value: "45",
      min: "5",
      max: "300"
    });

    var durChips = PD.Utils.createEl("div", { class: "ws-chip-group" });
    var durPresets = [
      { label: "15m Review", val: 15 },
      { label: "25m Pomodoro", val: 25 },
      { label: "45m Standard", val: 45 },
      { label: "60m Deep Work", val: 60 },
      { label: "90m Marathon", val: 90 }
    ];

    durPresets.forEach(function (preset) {
      var chip = PD.Utils.createEl("button", {
        type: "button",
        class: "ws-chip " + (preset.val === 45 ? "active" : ""),
        text: preset.label
      });
      chip.addEventListener("click", function () {
        durInput.value = preset.val.toString();
        PD.Utils.qsa(".dur-preset-chip", durChips).forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
      });
      chip.classList.add("dur-preset-chip");
      durChips.appendChild(chip);
    });

    durGroup.appendChild(durInput);
    durGroup.appendChild(durChips);
    form.appendChild(durGroup);

    // Start Button
    var startBtn = PD.Utils.createEl("button", { class: "ws-launch-btn", text: "🚀 Enter Study Workspace" });
    startBtn.addEventListener("click", function () {
      var chapId = chapSelect.value;
      var label = taskInput.value.trim();
      var duration = parseInt(durInput.value, 10) || 45;

      if (!chapId) {
        alert("Please select a chapter from Master Tracker!");
        return;
      }
      if (!label) {
        label = "General Focus Review";
      }

      var chapter = PD.Store.getChapter(chapId);
      PD.Services.StudySession.setActiveSession({
        chapterId: chapId,
        chapter: chapter.chapter,
        subject: chapter.subject,
        taskLabel: label,
        durationMinutes: duration,
        isRevision: label.toLowerCase().indexOf("revise") !== -1,
        startTime: new Date().toISOString(),
        notes: ""
      });

      // Re-render Workspace
      var mainSlot = document.querySelector("#main-slot");
      mainSlot.innerHTML = "";
      render(mainSlot);
    });

    form.appendChild(startBtn);
    setupCard.appendChild(form);
    grid.appendChild(setupCard);

    // RIGHT CARD: Quick Launch Recommendations
    var recCard = PD.Utils.createEl("div", { class: "workspace-card" });

    var recHeader = PD.Utils.createEl("div", { class: "workspace-card-header" });
    recHeader.appendChild(PD.Utils.createEl("h2", { class: "workspace-card-title", text: "🎯 Recommended Sessions" }));
    recCard.appendChild(recHeader);

    var recList = PD.Utils.createEl("div", { class: "quick-launch-list" });

    // Pick top 3 urgent chapters (overdue revision or lowest health score)
    var sortedChapters = chapters.slice().sort(function (a, b) {
      var hA = a.healthScore !== undefined ? a.healthScore : (a.health || 0);
      var hB = b.healthScore !== undefined ? b.healthScore : (b.health || 0);
      return hA - hB;
    }).slice(0, 4);

    sortedChapters.forEach(function (ch) {
      var pendingRes = (ch.resources || []).find(function (r) { return r.status !== "done"; });
      var actionText = pendingRes ? pendingRes.label : "Chapter Revision";

      var item = PD.Utils.createEl("div", { class: "quick-launch-item" });

      var info = PD.Utils.createEl("div", { class: "quick-item-info" });
      var tag = PD.Utils.createEl("span", {
        class: "task-subject-badge subject-" + ch.subject.toLowerCase(),
        text: ch.subject
      });
      info.appendChild(tag);
      info.appendChild(PD.Utils.createEl("div", { class: "quick-item-title", text: ch.chapter }));
      info.appendChild(PD.Utils.createEl("div", { class: "quick-item-desc", text: actionText }));

      item.appendChild(info);

      var launchBtn = PD.Utils.createEl("button", { class: "quick-launch-btn", text: "Start 45m" });
      launchBtn.addEventListener("click", function () {
        PD.Services.StudySession.setActiveSession({
          chapterId: ch.id,
          chapter: ch.chapter,
          subject: ch.subject,
          taskLabel: actionText,
          durationMinutes: 45,
          isRevision: actionText.toLowerCase().indexOf("revise") !== -1,
          startTime: new Date().toISOString(),
          notes: ""
        });

        var mainSlot = document.querySelector("#main-slot");
        mainSlot.innerHTML = "";
        render(mainSlot);
      });

      item.appendChild(launchBtn);
      recList.appendChild(item);
    });

    recCard.appendChild(recList);
    grid.appendChild(recCard);

    wrap.appendChild(grid);
  }

  /* ==========================================================================
     ACTIVE SESSION COCKPIT VIEW
     ========================================================================== */

  function renderActiveSessionView(wrap, session, container) {
    // 1. Top Cockpit Banner
    var banner = PD.Utils.createEl("div", { class: "ws-active-banner" });

    var mainInfo = PD.Utils.createEl("div", { class: "ws-banner-main" });
    var subjectTag = PD.Utils.createEl("span", {
      class: "task-subject-badge subject-" + session.subject.toLowerCase(),
      text: session.subject
    });
    mainInfo.appendChild(subjectTag);

    var textContent = PD.Utils.createEl("div");
    textContent.appendChild(PD.Utils.createEl("h2", { class: "ws-banner-title", text: session.chapter }));
    textContent.appendChild(PD.Utils.createEl("p", { class: "ws-banner-task", text: "Objective: " + session.taskLabel }));
    mainInfo.appendChild(textContent);

    banner.appendChild(mainInfo);

    // Live Progress
    var progressBox = PD.Utils.createEl("div", { class: "ws-banner-progress-wrap" });
    var pBar = PD.Utils.createEl("div", { class: "ws-banner-progress-bar" });
    var pFill = PD.Utils.createEl("div", { class: "ws-banner-progress-fill", id: "session-banner-pfill" });
    pBar.appendChild(pFill);
    progressBox.appendChild(pBar);

    var pLabel = PD.Utils.createEl("span", {
      id: "session-banner-plabel",
      style: "font-size: var(--text-xs); font-weight: 700; color: var(--text-secondary);",
      text: "Target: " + session.durationMinutes + "m"
    });
    progressBox.appendChild(pLabel);

    banner.appendChild(progressBox);
    wrap.appendChild(banner);

    // 2. Main Grid: Left Cockpit & Timer | Right Tools & Scratchpad
    var grid = PD.Utils.createEl("div", { class: "ws-active-grid" });

    // LEFT COLUMN: Focus Timer & Chapter Toolkit
    var leftCol = PD.Utils.createEl("div");

    // Timer Card
    var timerCard = PD.Utils.createEl("div", { class: "timer-unit-card" });

    // Mode Switcher Tabs
    var switcher = PD.Utils.createEl("div", { class: "timer-mode-switcher" });
    var cdTab = PD.Utils.createEl("button", {
      class: "timer-mode-btn " + (currentTimerMode === "countdown" ? "active" : ""),
      text: "⏱ Countdown"
    });
    var swTab = PD.Utils.createEl("button", {
      class: "timer-mode-btn " + (currentTimerMode === "stopwatch" ? "active" : ""),
      text: "⏳ Stopwatch"
    });

    switcher.appendChild(cdTab);
    switcher.appendChild(swTab);
    timerCard.appendChild(switcher);

    // Display Digits
    var digitsDisplay = PD.Utils.createEl("div", {
      class: "timer-digits-display",
      id: "ws-timer-digits",
      text: currentTimerMode === "countdown" 
        ? formatTime(timerSecondsLeft || (session.durationMinutes * 60))
        : formatTime(stopwatchSeconds)
    });
    timerCard.appendChild(digitsDisplay);

    // Controls Row
    var controlsRow = PD.Utils.createEl("div", { class: "timer-controls-row" });

    var primaryBtn = PD.Utils.createEl("button", {
      class: "timer-btn-primary",
      id: "ws-timer-primary-btn",
      text: (currentTimerMode === "countdown" ? timerIsRunning : stopwatchIsRunning) ? "⏸ Pause" : "▶ Start Focus"
    });

    primaryBtn.addEventListener("click", function () {
      if (currentTimerMode === "countdown") {
        if (timerIsRunning) {
          pauseCountdown();
          primaryBtn.textContent = "▶ Resume Focus";
          digitsDisplay.classList.remove("is-running");
        } else {
          if (timerSecondsLeft <= 0) {
            timerSecondsLeft = session.durationMinutes * 60;
          }
          startCountdown(digitsDisplay, primaryBtn, session);
          primaryBtn.textContent = "⏸ Pause";
          digitsDisplay.classList.add("is-running");
        }
      } else {
        if (stopwatchIsRunning) {
          pauseStopwatch();
          primaryBtn.textContent = "▶ Resume Focus";
          digitsDisplay.classList.remove("is-running");
        } else {
          startStopwatch(digitsDisplay, primaryBtn);
          primaryBtn.textContent = "⏸ Pause";
          digitsDisplay.classList.add("is-running");
        }
      }
    });

    var resetBtn = PD.Utils.createEl("button", { class: "timer-btn-secondary", text: "↺ Reset" });
    resetBtn.addEventListener("click", function () {
      pauseCountdown();
      pauseStopwatch();
      timerSecondsLeft = session.durationMinutes * 60;
      stopwatchSeconds = 0;
      digitsDisplay.textContent = currentTimerMode === "countdown" ? formatTime(timerSecondsLeft) : formatTime(0);
      digitsDisplay.classList.remove("is-running");
      primaryBtn.textContent = "▶ Start Focus";
      updateBannerProgress(session);
    });

    var add5Btn = PD.Utils.createEl("button", { class: "timer-btn-secondary", text: "+5 Min" });
    add5Btn.addEventListener("click", function () {
      if (currentTimerMode === "countdown") {
        timerSecondsLeft += 300;
        digitsDisplay.textContent = formatTime(timerSecondsLeft);
        updateBannerProgress(session);
      } else {
        stopwatchSeconds += 300;
        digitsDisplay.textContent = formatTime(stopwatchSeconds);
      }
    });

    controlsRow.appendChild(primaryBtn);
    controlsRow.appendChild(resetBtn);
    controlsRow.appendChild(add5Btn);
    timerCard.appendChild(controlsRow);

    // Switcher Click Handlers
    cdTab.addEventListener("click", function () {
      currentTimerMode = "countdown";
      cdTab.classList.add("active");
      swTab.classList.remove("active");
      digitsDisplay.textContent = formatTime(timerSecondsLeft || (session.durationMinutes * 60));
      primaryBtn.textContent = timerIsRunning ? "⏸ Pause" : "▶ Start Focus";
      if (timerIsRunning) digitsDisplay.classList.add("is-running");
      else digitsDisplay.classList.remove("is-running");
    });

    swTab.addEventListener("click", function () {
      currentTimerMode = "stopwatch";
      swTab.classList.add("active");
      cdTab.classList.remove("active");
      digitsDisplay.textContent = formatTime(stopwatchSeconds);
      primaryBtn.textContent = stopwatchIsRunning ? "⏸ Pause" : "▶ Start Focus";
      if (stopwatchIsRunning) digitsDisplay.classList.add("is-running");
      else digitsDisplay.classList.remove("is-running");
    });

    leftCol.appendChild(timerCard);

    // Active Chapter Resources Checklist Card
    var chapter = PD.Store.getChapter(session.chapterId);
    if (chapter) {
      var resCard = PD.Utils.createEl("div", { class: "chapter-resources-card" });
      resCard.appendChild(PD.Utils.createEl("h3", {
        class: "workspace-card-title",
        style: "margin-bottom: var(--space-4);",
        text: "📚 Active Chapter Resources"
      }));

      var resList = PD.Utils.createEl("div", { class: "chapter-res-list" });
      var resources = chapter.resources || [];

      if (resources.length === 0) {
        resList.appendChild(PD.Utils.createEl("p", {
          style: "font-size: var(--text-xs); color: var(--text-tertiary); font-style: italic;",
          text: "No individual resources listed for this chapter yet. You can add them in the Master Tracker!"
        }));
      } else {
        resources.forEach(function (res, index) {
          var row = PD.Utils.createEl("div", {
            class: "resource-item-row " + (res.status === "done" ? "is-done" : "")
          });

          var labelWrap = PD.Utils.createEl("label", {
            style: "display: flex; align-items: center; gap: var(--space-3); cursor: pointer; flex-grow: 1;"
          });

          var checkbox = PD.Utils.createEl("input", {
            type: "checkbox",
            checked: res.status === "done"
          });

          checkbox.addEventListener("change", function () {
            var newStatus = checkbox.checked ? "done" : "not-started";
            resources[index].status = newStatus;
            
            // Save patch to store
            PD.Store.updateChapter(session.chapterId, {
              resources: resources,
              lastStudied: new Date().toISOString().split("T")[0]
            });

            row.classList.toggle("is-done", checkbox.checked);
          });

          labelWrap.appendChild(checkbox);
          labelWrap.appendChild(PD.Utils.createEl("span", { class: "resource-title", text: res.label }));
          row.appendChild(labelWrap);

          var typeBadge = PD.Utils.createEl("span", {
            class: "task-type-badge badge-due",
            text: res.type || "resource"
          });
          row.appendChild(typeBadge);

          resList.appendChild(row);
        });
      }

      resCard.appendChild(resList);
      leftCol.appendChild(resCard);
    }

    grid.appendChild(leftCol);

    // RIGHT COLUMN: Tools Panel (Scratchpad Notes / Quick Error Log / Live Metrics)
    var toolsCard = PD.Utils.createEl("div", { class: "ws-tools-card" });

    // Tab Header
    var tabHeader = PD.Utils.createEl("div", { class: "ws-tools-tabs" });
    var tabNotes = PD.Utils.createEl("button", { class: "ws-tab-btn active", text: "📝 Scratchpad Notes" });
    var tabErrors = PD.Utils.createEl("button", { class: "ws-tab-btn", text: "⚠️ Quick Error Log" });
    var tabMetrics = PD.Utils.createEl("button", { class: "ws-tab-btn", text: "📊 Session Metrics" });

    tabHeader.appendChild(tabNotes);
    tabHeader.appendChild(tabErrors);
    tabHeader.appendChild(tabMetrics);
    toolsCard.appendChild(tabHeader);

    // Tab Content Containers
    var notesView = PD.Utils.createEl("div", { class: "scratchpad-view", id: "ws-tab-notes" });
    var errorsView = PD.Utils.createEl("div", { class: "quick-error-view", id: "ws-tab-errors", style: "display:none;" });
    var metricsView = PD.Utils.createEl("div", { class: "live-metrics-view", id: "ws-tab-metrics", style: "display:none;" });

    // TAB 1: Scratchpad
    var textarea = PD.Utils.createEl("textarea", {
      class: "scratchpad-textarea",
      placeholder: "Write down formulas, key takeaways, solved step-by-step points, or reminders here during your study session...",
      id: "session-scratchpad-area"
    });
    textarea.value = session.notes || "";

    var scratchFooter = PD.Utils.createEl("div", { class: "scratchpad-footer" });
    var wordCounter = PD.Utils.createEl("span", { text: "0 words • Auto-saved" });
    
    function updateWordCount() {
      var txt = textarea.value.trim();
      var words = txt ? txt.split(/\s+/).length : 0;
      wordCounter.textContent = words + " words • Auto-saved to session";
      // Auto-save to session object
      session.notes = txt;
      PD.Services.StudySession.setActiveSession(session);
    }

    textarea.addEventListener("input", updateWordCount);

    var copyBtn = PD.Utils.createEl("button", { class: "task-action-btn", text: "📋 Copy Notes" });
    copyBtn.addEventListener("click", function () {
      if (!textarea.value) return;
      navigator.clipboard.writeText(textarea.value);
      copyBtn.textContent = "✓ Copied!";
      setTimeout(function () { copyBtn.textContent = "📋 Copy Notes"; }, 2000);
    });

    scratchFooter.appendChild(wordCounter);
    scratchFooter.appendChild(copyBtn);

    notesView.appendChild(textarea);
    notesView.appendChild(scratchFooter);
    toolsCard.appendChild(notesView);

    // TAB 2: Quick Error Log
    var toastBox = PD.Utils.createEl("div", { id: "ws-error-toast", style: "display:none;" });
    errorsView.appendChild(toastBox);

    var errForm = PD.Utils.createEl("div");
    
    errForm.appendChild(PD.Utils.createEl("label", { class: "ws-form-label", text: "Topic / Question Name" }));
    var errTopic = PD.Utils.createEl("input", { type: "text", class: "ws-input", id: "ws-err-topic", placeholder: "e.g., Question #14 Calculation error" });
    errForm.appendChild(errTopic);

    errForm.appendChild(PD.Utils.createEl("label", { class: "ws-form-label", style: "margin-top: var(--space-3);", text: "Mistake Classification" }));
    var errTypeSelect = PD.Utils.createEl("select", { class: "ws-select", id: "ws-err-type" });
    ["Conceptual", "Calculation", "Silly Mistake", "Time Pressure", "Question Misread"].forEach(function (t) {
      errTypeSelect.appendChild(PD.Utils.createEl("option", { value: t, text: t }));
    });
    errForm.appendChild(errTypeSelect);

    errForm.appendChild(PD.Utils.createEl("label", { class: "ws-form-label", style: "margin-top: var(--space-3);", text: "What went wrong?" }));
    var errReason = PD.Utils.createEl("textarea", { class: "ws-input", style: "height: 60px;", id: "ws-err-reason", placeholder: "Describe the mistake..." });
    errForm.appendChild(errReason);

    errForm.appendChild(PD.Utils.createEl("label", { class: "ws-form-label", style: "margin-top: var(--space-3);", text: "Correct Method / Solution Takeaway" }));
    var errCorrect = PD.Utils.createEl("textarea", { class: "ws-input", style: "height: 60px;", id: "ws-err-correct", placeholder: "How to avoid this next time..." });
    errForm.appendChild(errCorrect);

    var logErrBtn = PD.Utils.createEl("button", {
      class: "ws-launch-btn",
      style: "margin-top: var(--space-4); padding: var(--space-3); font-size: var(--text-sm);",
      text: "⚡ Log Mistake to Error Notebook"
    });

    logErrBtn.addEventListener("click", function () {
      var topic = errTopic.value.trim() || "General Practice";
      var type = errTypeSelect.value;
      var reason = errReason.value.trim();
      var correct = errCorrect.value.trim();

      if (!reason && !correct) {
        alert("Please describe what went wrong or how to resolve it.");
        return;
      }

      PD.Services.ErrorNotebook.addMistake({
        subject: session.subject,
        chapter: session.chapter,
        topic: topic,
        mistakeType: type,
        reason: reason,
        correctMethod: correct,
        personalNotes: "Logged live during study session: " + (textarea.value || "")
      });

      // Clear form
      errTopic.value = "";
      errReason.value = "";
      errCorrect.value = "";

      toastBox.className = "toast-msg";
      toastBox.textContent = "✓ Mistake logged successfully to Error Notebook!";
      toastBox.style.display = "block";
      setTimeout(function () { toastBox.style.display = "none"; }, 3000);
    });

    errForm.appendChild(logErrBtn);
    errorsView.appendChild(errForm);
    toolsCard.appendChild(errorsView);

    // TAB 3: Session Metrics
    var metricsList = PD.Utils.createEl("div", { class: "mission-stats-grid", style: "grid-template-columns: 1fr 1fr; margin-top: var(--space-2);" });

    var m1 = PD.Utils.createEl("div", { class: "mission-stat-card" });
    m1.appendChild(PD.Utils.createEl("div", { class: "stat-label", text: "Target Duration" }));
    m1.appendChild(PD.Utils.createEl("div", { class: "stat-value", text: session.durationMinutes + " Mins" }));
    metricsList.appendChild(m1);

    var m2 = PD.Utils.createEl("div", { class: "mission-stat-card" });
    m2.appendChild(PD.Utils.createEl("div", { class: "stat-label", text: "Subject Category" }));
    m2.appendChild(PD.Utils.createEl("div", { class: "stat-value", text: session.subject }));
    metricsList.appendChild(m2);

    var chScore = chapter ? (chapter.healthScore !== undefined ? chapter.healthScore : chapter.health || 0) : 0;
    var m3 = PD.Utils.createEl("div", { class: "mission-stat-card" });
    m3.appendChild(PD.Utils.createEl("div", { class: "stat-label", text: "Chapter Health" }));
    m3.appendChild(PD.Utils.createEl("div", { class: "stat-value", text: chScore + "%" }));
    metricsList.appendChild(m3);

    var m4 = PD.Utils.createEl("div", { class: "mission-stat-card" });
    m4.appendChild(PD.Utils.createEl("div", { class: "stat-label", text: "Session Mode" }));
    m4.appendChild(PD.Utils.createEl("div", { class: "stat-value", text: session.isRevision ? "Revision" : "Learning" }));
    metricsList.appendChild(m4);

    metricsView.appendChild(metricsList);
    toolsCard.appendChild(metricsView);

    // Tab Event Handlers
    tabNotes.addEventListener("click", function () {
      tabNotes.classList.add("active");
      tabErrors.classList.remove("active");
      tabMetrics.classList.remove("active");
      notesView.style.display = "flex";
      errorsView.style.display = "none";
      metricsView.style.display = "none";
    });

    tabErrors.addEventListener("click", function () {
      tabErrors.classList.add("active");
      tabNotes.classList.remove("active");
      tabMetrics.classList.remove("active");
      errorsView.style.display = "flex";
      notesView.style.display = "none";
      metricsView.style.display = "none";
    });

    tabMetrics.addEventListener("click", function () {
      tabMetrics.classList.add("active");
      tabNotes.classList.remove("active");
      tabErrors.classList.remove("active");
      metricsView.style.display = "block";
      notesView.style.display = "none";
      errorsView.style.display = "none";
    });

    grid.appendChild(toolsCard);
    wrap.appendChild(grid);

    // 3. Bottom Action Dock
    var dock = PD.Utils.createEl("div", { class: "ws-bottom-dock" });

    var endBtn = PD.Utils.createEl("button", { class: "end-session-primary-btn", text: "🏁 End Session & Log Outcomes" });
    endBtn.addEventListener("click", function () {
      pauseCountdown();
      pauseStopwatch();

      var modal = wrap.querySelector(".end-session-modal-overlay");
      if (modal) {
        modal.classList.add("is-visible");

        var elapsedMin = Math.max(1, Math.round(stopwatchSeconds / 60));
        var inputMin = modal.querySelector("#log-minutes-input");
        if (inputMin) inputMin.value = elapsedMin > 1 ? elapsedMin.toString() : session.durationMinutes.toString();
      }
    });

    var abortBtn = PD.Utils.createEl("button", { class: "abort-session-btn", text: "🚨 Abort Session" });
    abortBtn.addEventListener("click", function () {
      if (confirm("Are you sure you want to abort this session? Unsaved time will not be logged.")) {
        clearTimerIntervals();
        PD.Services.StudySession.setActiveSession(null);

        var mainSlot = document.querySelector("#main-slot");
        mainSlot.innerHTML = "";
        render(mainSlot);
      }
    });

    dock.appendChild(endBtn);
    dock.appendChild(abortBtn);
    wrap.appendChild(dock);

    // Modal
    wrap.appendChild(buildEndSessionModal(session, wrap));
  }

  /* ==========================================================================
     TIMER HELPERS
     ========================================================================== */

  function formatTime(totalSec) {
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function updateBannerProgress(session) {
    var totalSec = session.durationMinutes * 60;
    var elapsedSec = totalSec - timerSecondsLeft;
    var pct = Math.min(100, Math.max(0, Math.round((elapsedSec / totalSec) * 100)));

    var fill = document.querySelector("#session-banner-pfill");
    if (fill) fill.style.width = pct + "%";

    var label = document.querySelector("#session-banner-plabel");
    if (label) label.textContent = pct + "% Elapsed (" + Math.round(elapsedSec / 60) + "/" + session.durationMinutes + "m)";
  }

  function startCountdown(displayEl, primaryBtn, session) {
    if (timerIsRunning) return;
    timerIsRunning = true;

    timerInterval = setInterval(function () {
      if (timerSecondsLeft <= 0) {
        clearInterval(timerInterval);
        timerIsRunning = false;
        primaryBtn.textContent = "▶ Start Focus";
        displayEl.classList.remove("is-running");
        alert("🎉 Countdown Complete! Outstanding focus session.");
        return;
      }
      timerSecondsLeft--;
      displayEl.textContent = formatTime(timerSecondsLeft);
      updateBannerProgress(session);
    }, 1000);
  }

  function pauseCountdown() {
    clearInterval(timerInterval);
    timerIsRunning = false;
  }

  function startStopwatch(displayEl, primaryBtn) {
    if (stopwatchIsRunning) return;
    stopwatchIsRunning = true;

    stopwatchInterval = setInterval(function () {
      stopwatchSeconds++;
      displayEl.textContent = formatTime(stopwatchSeconds);
    }, 1000);
  }

  function pauseStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchIsRunning = false;
  }

  function clearTimerIntervals() {
    clearInterval(timerInterval);
    clearInterval(stopwatchInterval);
    timerInterval = null;
    stopwatchInterval = null;
    timerSecondsLeft = 0;
    timerIsRunning = false;
    stopwatchSeconds = 0;
    stopwatchIsRunning = false;
  }

  /* ==========================================================================
     END SESSION MODAL
     ========================================================================== */

  function buildEndSessionModal(session, wrap) {
    var overlay = PD.Utils.createEl("div", { class: "end-session-modal-overlay" });
    var card = PD.Utils.createEl("div", { class: "end-session-modal-card" });

    card.appendChild(PD.Utils.createEl("h2", { class: "modal-header-title", text: "🎉 Complete Study Session" }));
    card.appendChild(PD.Utils.createEl("p", {
      class: "modal-header-sub",
      text: "Persist logged hours to Master Tracker, update chapter health, and reflect on outcomes."
    }));

    // Form
    var body = PD.Utils.createEl("div");

    body.appendChild(PD.Utils.createEl("label", { class: "ws-form-label", text: "Minutes Studied to Log" }));
    var minInput = PD.Utils.createEl("input", {
      type: "number",
      class: "ws-input",
      id: "log-minutes-input",
      value: session.durationMinutes.toString(),
      min: "1"
    });
    body.appendChild(minInput);

    // Quick Duration Adjusters
    var adjChips = PD.Utils.createEl("div", { class: "ws-chip-group", style: "margin-bottom: var(--space-4);" });
    [15, 30, 45, 60, 90].forEach(function (m) {
      var chip = PD.Utils.createEl("button", { type: "button", class: "ws-chip", text: m + "m" });
      chip.addEventListener("click", function () {
        minInput.value = m.toString();
      });
      adjChips.appendChild(chip);
    });
    body.appendChild(adjChips);

    // Mark task completed checkbox
    var completeRow = PD.Utils.createEl("div", { class: "modal-checkbox-row", style: "margin-bottom: var(--space-3);" });
    var completeCheck = PD.Utils.createEl("input", { type: "checkbox", id: "complete-task-check", checked: true });
    completeRow.appendChild(completeCheck);
    completeRow.appendChild(PD.Utils.createEl("label", {
      for: "complete-task-check",
      style: "font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); cursor: pointer;",
      text: "Mark task/resource as completed in Master Tracker"
    }));
    body.appendChild(completeRow);

    // Footer buttons
    var actions = PD.Utils.createEl("div", { class: "modal-footer-actions" });

    var cancelBtn = PD.Utils.createEl("button", { class: "timer-btn-secondary", text: "Back to Timer" });
    cancelBtn.addEventListener("click", function () {
      overlay.classList.remove("is-visible");
    });

    var saveBtn = PD.Utils.createEl("button", { class: "ws-launch-btn", style: "width: auto;", text: "Save & Log Outcomes" });
    saveBtn.addEventListener("click", function () {
      var finalMin = parseInt(minInput.value, 10) || session.durationMinutes || 1;
      var scratchArea = wrap.querySelector("#session-scratchpad-area");
      var notes = scratchArea ? scratchArea.value.trim() : "";

      // Log Session Hours
      PD.Services.StudySession.logSession({
        chapterId: session.chapterId,
        chapter: session.chapter,
        subject: session.subject,
        taskLabel: session.taskLabel,
        durationMinutes: finalMin,
        isRevision: session.isRevision,
        notes: notes
      });

      // Update task completion in Tracker
      if (completeCheck.checked) {
        var chapter = PD.Store.getChapter(session.chapterId);
        if (chapter) {
          var patch = { lastStudied: new Date().toISOString().split("T")[0] };

          if (session.isRevision) {
            patch.revisionCount = (chapter.revisionCount || 0) + 1;
            patch.lastRevision = patch.lastStudied;
            var dueDays = chapter.confidence === 5 ? 14 : chapter.confidence === 4 ? 7 : 4;
            var due = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000);
            patch.revisionDue = due.toISOString().split("T")[0];
          } else {
            var resources = (chapter.resources || []).map(function (res) {
              if (session.taskLabel.indexOf(res.label) !== -1 || res.status === "in-progress") {
                return Object.assign({}, res, { status: "done" });
              }
              return res;
            });
            patch.resources = resources;
          }
          PD.Store.updateChapter(session.chapterId, patch);
        }
      }

      // Reset
      clearTimerIntervals();
      PD.Services.StudySession.setActiveSession(null);

      overlay.classList.remove("is-visible");
      alert("Session logged successfully! Streak updated.");

      window.location.hash = "#/dashboard";
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    body.appendChild(actions);

    card.appendChild(body);
    overlay.appendChild(card);
    return overlay;
  }

  return { render: render };
})();

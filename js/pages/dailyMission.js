window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

PD.Pages.DailyMission = (function () {
  function getDailyActions() {
    var todayStr = new Date().toISOString().split("T")[0];
    try {
      var raw = localStorage.getItem("projectDecember.dailyMissionActions.v1");
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.date === todayStr) {
        return parsed;
      }
    } catch (e) {}
    return { date: todayStr, skipped: [], postponed: [] };
  }

  function saveDailyActions(actions) {
    try {
      localStorage.setItem("projectDecember.dailyMissionActions.v1", JSON.stringify(actions));
    } catch (e) {}
  }

  function render(container) {
    var chapters = PD.Store.getChapters();
    var wrap = PD.Utils.createEl("div", { class: "page daily-mission-page" });

    // Header
    var header = PD.Utils.createEl("div", { class: "page-header-row" });
    var titleArea = PD.Utils.createEl("div");
    titleArea.appendChild(PD.Utils.createEl("h1", { class: "page-title", text: "Daily Mission Control" }));
    titleArea.appendChild(PD.Utils.createEl("p", { class: "page-subtitle", text: "Targeted focus tasks for today's high-yield study." }));
    header.appendChild(titleArea);
    wrap.appendChild(header);

    // Generate tasks on the fly
    var tasks = getTodayTasks(chapters);

    if (tasks.length === 0) {
      var empty = PD.Utils.createEl("div", { class: "empty-state-card" });
      empty.appendChild(PD.Utils.createEl("span", { class: "empty-icon", text: "🎯" }));
      empty.appendChild(PD.Utils.createEl("h2", { text: "Mission Accomplished!" }));
      empty.appendChild(PD.Utils.createEl("p", { text: "No urgent revisions, weak chapters, or pending resources left to study today. Outstanding work!" }));
      wrap.appendChild(empty);
    } else {
      // Stats Section
      wrap.appendChild(buildStatsRow(tasks));

      // Task List
      var taskList = PD.Utils.createEl("div", { class: "mission-tasks-list" });
      tasks.forEach(function (task) {
        taskList.appendChild(buildTaskRow(task, container));
      });
      wrap.appendChild(taskList);
    }

    container.appendChild(wrap);
  }

  function getTodayTasks(chapters) {
    var todayStr = new Date().toISOString().split("T")[0];
    if (todayStr < "2026-07-22") {
      todayStr = "2026-07-22";
    }

    var mission = [];
    if (window.PD && window.PD.Services && window.PD.Services.Planner) {
      mission = window.PD.Services.Planner.getDailyMission(chapters, todayStr);
    }

    var actions = getDailyActions();
    var tasks = (mission || []).map(function (m, idx) {
      var ch = m.chapter || { id: "gen_" + idx, subject: "General", chapter: "General" };
      if (actions.skipped.indexOf(ch.id) !== -1 || actions.postponed.indexOf(ch.id) !== -1) {
        return null;
      }
      var isBacklog = m.reason && m.reason.indexOf("Backlog") >= 0;
      var isCoaching = m.reason && m.reason.indexOf("Coaching") >= 0;
      var isTest = m.reason && m.reason.indexOf("Test") >= 0;

      var typeLabel = isCoaching ? "Coaching (70%)" : (isBacklog ? "Backlog (30%)" : (isTest ? "Weekly Test & Analysis" : "Daily Revision"));
      var badgeClass = isCoaching ? "badge-due" : (isBacklog ? "badge-weak" : (isTest ? "badge-overdue" : "badge-due"));

      return {
        id: "dm_task_" + (ch.id || idx) + "_" + idx,
        chapter: ch,
        type: isCoaching ? "coaching" : (isBacklog ? "backlog" : "focus"),
        typeLabel: typeLabel,
        badgeClass: badgeClass,
        label: m.action ? m.action.label : m.reason,
        duration: isTest ? 180 : (isCoaching ? 90 : 60),
        action: m.action || { kind: "resource", label: m.reason }
      };
    }).filter(Boolean);

    return tasks;
  }

  function buildStatsRow(tasks) {
    var row = PD.Utils.createEl("div", { class: "mission-stats-grid" });

    // Total Estimated Time
    var totalMin = tasks.reduce(function (acc, t) { return acc + t.duration; }, 0);
    var hr = Math.floor(totalMin / 60);
    var min = totalMin % 60;
    var timeStr = (hr > 0 ? hr + "h " : "") + min + "m";

    var cardTime = PD.Utils.createEl("div", { class: "mission-stat-card" });
    cardTime.appendChild(PD.Utils.createEl("div", { class: "stat-label", text: "Estimated Effort" }));
    cardTime.appendChild(PD.Utils.createEl("div", { class: "stat-value", text: timeStr }));
    row.appendChild(cardTime);

    // Subject Balance
    var counts = { Chemistry: 0, Physics: 0, Mathematics: 0 };
    tasks.forEach(function (t) {
      if (t.chapter && t.chapter.subject) {
        counts[t.chapter.subject] = (counts[t.chapter.subject] || 0) + 1;
      }
    });
    var balanceStr = "C: " + (counts.Chemistry || 0) + " | P: " + (counts.Physics || 0) + " | M: " + (counts.Mathematics || 0);

    var cardBalance = PD.Utils.createEl("div", { class: "mission-stat-card" });
    cardBalance.appendChild(PD.Utils.createEl("div", { class: "stat-label", text: "Subject Balance" }));
    cardBalance.appendChild(PD.Utils.createEl("div", { class: "stat-value", text: balanceStr }));
    row.appendChild(cardBalance);

    // Tasks Count
    var cardCount = PD.Utils.createEl("div", { class: "mission-stat-card" });
    cardCount.appendChild(PD.Utils.createEl("div", { class: "stat-label", text: "Total Targets" }));
    cardCount.appendChild(PD.Utils.createEl("div", { class: "stat-value", text: tasks.length + " Focus Tasks" }));
    row.appendChild(cardCount);

    return row;
  }

  function buildTaskRow(task, container) {
    var row = PD.Utils.createEl("div", { class: "mission-task-row", id: task.id });

    // Left info
    var info = PD.Utils.createEl("div", { class: "task-row-info" });
    var subjectBadge = PD.Utils.createEl("span", {
      class: "task-subject-badge subject-" + task.chapter.subject.toLowerCase(),
      text: task.chapter.subject
    });
    info.appendChild(subjectBadge);

    var main = PD.Utils.createEl("div");
    var title = PD.Utils.createEl("div", { class: "task-row-title", text: task.label });
    var details = PD.Utils.createEl("div", { class: "task-row-details" });
    
    var typeBadge = PD.Utils.createEl("span", { class: "task-type-badge " + task.badgeClass, text: task.typeLabel });
    details.appendChild(typeBadge);
    details.appendChild(PD.Utils.createEl("span", { text: " • Est. " + task.duration + " min" }));

    main.appendChild(title);
    main.appendChild(details);
    info.appendChild(main);
    row.appendChild(info);

    // Right actions
    var actions = PD.Utils.createEl("div", { class: "task-row-actions" });

    // Start Session Button
    var startBtn = PD.Utils.createEl("button", { class: "task-action-btn start-btn", text: "Start Session" });
    startBtn.addEventListener("click", function () {
      // Save active study session in StudySession service
      PD.Services.StudySession.setActiveSession({
        chapterId: task.chapter.id,
        chapter: task.chapter.chapter,
        subject: task.chapter.subject,
        taskLabel: task.label,
        durationMinutes: task.duration,
        isRevision: task.type === "overdue" || task.type === "today"
      });
      // Redirect to Workspace
      window.location.hash = "#/workspace";
    });
    actions.appendChild(startBtn);

    // Complete Button
    var completeBtn = PD.Utils.createEl("button", { class: "task-action-btn complete-btn", text: "✓" });
    completeBtn.title = "Mark Completed";
    completeBtn.addEventListener("click", function () {
      completeTask(task);
      row.style.opacity = "0.4";
      row.style.pointerEvents = "none";
      // Auto re-render after short delay to feel smooth
      setTimeout(function () {
        render(container);
      }, 500);
    });
    actions.appendChild(completeBtn);

    // Postpone Button
    var postponeBtn = PD.Utils.createEl("button", { class: "task-action-btn postpone-btn", text: "⏰" });
    postponeBtn.title = "Postpone to Tomorrow";
    postponeBtn.addEventListener("click", function () {
      var dailyActions = getDailyActions();
      dailyActions.postponed.push(task.chapter.id);
      saveDailyActions(dailyActions);

      if (task.type === "overdue" || task.type === "today") {
        var chapter = PD.Store.getChapter(task.chapter.id);
        if (chapter) {
          var tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          PD.Store.updateChapter(task.chapter.id, { revisionDue: tomorrowStr });
        }
      }

      row.style.opacity = "0.4";
      row.style.pointerEvents = "none";
      setTimeout(function () {
        render(container);
      }, 500);
    });
    actions.appendChild(postponeBtn);

    // Skip Button
    var skipBtn = PD.Utils.createEl("button", { class: "task-action-btn skip-btn", text: "⏭️" });
    skipBtn.title = "Skip Task for Today";
    skipBtn.addEventListener("click", function () {
      var dailyActions = getDailyActions();
      dailyActions.skipped.push(task.chapter.id);
      saveDailyActions(dailyActions);

      row.style.opacity = "0.4";
      row.style.pointerEvents = "none";
      setTimeout(function () {
        render(container);
      }, 500);
    });
    actions.appendChild(skipBtn);

    row.appendChild(actions);
    return row;
  }

  function completeTask(task) {
    var chapter = PD.Store.getChapter(task.chapter.id);
    if (!chapter) return;

    var todayStr = new Date().toISOString().split("T")[0];
    var patch = { lastStudied: todayStr };

    if (task.action.kind === "revision") {
      patch.revisionCount = (chapter.revisionCount || 0) + 1;
      patch.lastRevision = todayStr;
      var intervalDays = chapter.confidence === 5 ? 14 : chapter.confidence === 4 ? 7 : 4;
      var due = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
      patch.revisionDue = due.toISOString().split("T")[0];
    } else if (task.action.resource) {
      var resources = (chapter.resources || []).map(function (r) {
        if (r.id === task.action.resource.id) {
          return Object.assign({}, r, { status: "done" });
        }
        return r;
      });
      patch.resources = resources;
    } else {
      patch.completed = true;
    }

    PD.Store.updateChapter(task.chapter.id, patch);

    // Log a simulated study session in history
    PD.Services.StudySession.logSession({
      chapterId: task.chapter.id,
      chapter: task.chapter.chapter,
      subject: task.chapter.subject,
      taskLabel: task.label,
      durationMinutes: task.duration,
      isRevision: task.type === "overdue" || task.type === "today"
    });
  }

  return { render: render };
})();

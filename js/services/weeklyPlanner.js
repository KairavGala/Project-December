window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

PD.Services.WeeklyPlanner = (function () {
  var STORAGE_KEY = "projectDecember.weeklyPlan.v5";
  var planState = { weekStartDate: "", days: {} };

  var DAYS_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  function getYYYYMMDD(d) {
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return year + "-" + month + "-" + day;
  }

  function getMondayDate(d) {
    var date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    var diff = date.getDate() - day + (day === 0 ? -6 : 1);
    var mon = new Date(date.getFullYear(), date.getMonth(), diff);
    return getYYYYMMDD(mon);
  }

  function getLocalDateStr(baseMonStr, offsetDays) {
    var parts = baseMonStr.split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    var day = parseInt(parts[2], 10);
    var d = new Date(year, month, day + offsetDays);
    return getYYYYMMDD(d);
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        planState = JSON.parse(raw);
      } else {
        planState = { weekStartDate: "", days: {} };
      }
    } catch (e) {
      planState = { weekStartDate: "", days: {} };
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(planState));
    } catch (e) {
      console.error("PD.Services.WeeklyPlanner: failed to save weekly plan", e);
    }
  }

  function initializeWeek() {
    load();
    var currentMon = getMondayDate(new Date());

    // If it's a new week, or not initialized, create a fresh plan from Planner Forecast
    if (planState.weekStartDate !== currentMon || !planState.days || Object.keys(planState.days).length === 0) {
      planState.weekStartDate = currentMon;
      planState.days = {};

      var chapters = PD.Store.getChapters();

      DAYS_LIST.forEach(function (day, idx) {
        var dayDate = getLocalDateStr(currentMon, idx);
        var missionForDay = PD.Services.Planner.getDailyMission(chapters, dayDate);
        
        var dayTasks = missionForDay.map(function (m) {
          var isBacklog = m.action && m.action.kind === "backlog";
          var isTest = m.action && m.action.kind === "test";
          return {
            id: "task_" + Math.random().toString(36).substr(2, 9),
            chapterId: m.chapter ? m.chapter.id : null,
            subject: m.chapter ? m.chapter.subject : "General",
            chapterTitle: m.chapter ? m.chapter.chapter : "General",
            type: m.action && m.action.kind === "revision" ? "revision" : (isBacklog ? "backlog" : (isTest ? "test" : "resource")),
            label: m.action ? m.action.label : m.reason,
            reason: m.reason,
            duration: isTest ? 180 : (m.action && m.action.kind === "revision" ? 45 : 90),
            completed: false,
            postponed: false,
            skipped: false,
            action: m.action
          };
        });

        planState.days[day] = {
          date: dayDate,
          tasks: dayTasks
        };
      });

      save();
    }
  }

  function carryForwardUnfinishedTasks() {
    // If there were previous days in this week that are in the past and had unfinished tasks,
    // carry them forward to "today"!
    var todayStr = new Date().toISOString().split("T")[0];
    var todayDayName = getDayNameFromDate(todayStr);

    if (!todayDayName) return;

    var accumulatedBacklog = [];

    DAYS_LIST.forEach(function (dayName) {
      // Find past days before today
      if (DAYS_LIST.indexOf(dayName) < DAYS_LIST.indexOf(todayDayName)) {
        var dayData = planState.days[dayName];
        if (dayData && dayData.tasks) {
          dayData.tasks.forEach(function (task) {
            if (!task.completed && !task.skipped && !task.postponed) {
              // It's unfinished! Mark it postponed and copy it to backlog
              task.postponed = true;
              accumulatedBacklog.push(Object.assign({}, task, {
                id: "backlog_" + Math.random().toString(36).substr(2, 9),
                completed: false,
                postponed: false,
                skipped: false,
                label: "[Carry Forward] " + task.label
              }));
            }
          });
        }
      }
    });

    if (accumulatedBacklog.length > 0) {
      var todayData = planState.days[todayDayName];
      if (todayData) {
        todayData.tasks = todayData.tasks.concat(accumulatedBacklog);
      }
      save();
    }
  }

  function getDayNameFromDate(dateStr) {
    var date = new Date(dateStr + "T00:00:00");
    var dayNum = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    var map = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return map[dayNum];
  }

  function getWeeklyPlan() {
    initializeWeek();
    return planState;
  }

  function addTaskToDay(dayName, task) {
    getWeeklyPlan(); // ensure loaded
    if (!planState.days[dayName]) return;

    var newTask = Object.assign({
      id: "task_" + Math.random().toString(36).substr(2, 9),
      completed: false,
      postponed: false,
      skipped: false
    }, task);

    planState.days[dayName].tasks.push(newTask);
    save();
    return newTask;
  }

  function updateTaskInDay(dayName, taskId, patch) {
    getWeeklyPlan();
    var dayData = planState.days[dayName];
    if (!dayData) return null;

    var task = dayData.tasks.find(function (t) { return t.id === taskId; });
    if (!task) return null;

    Object.assign(task, patch);

    // If marked completed, propagate completion to master store if it's connected
    if (patch.completed) {
      propagateTaskCompletion(task);
    }

    save();
    return task;
  }

  function propagateTaskCompletion(task) {
    if (!task.chapterId) return;
    var chapter = PD.Store.getChapter(task.chapterId);
    if (!chapter) return;

    var patch = { lastStudied: new Date().toISOString().split("T")[0] };

    if (task.type === "revision") {
      patch.revisionCount = (chapter.revisionCount || 0) + 1;
      patch.lastRevision = patch.lastStudied;
      var intervalDays = chapter.confidence === 5 ? 14 : chapter.confidence === 4 ? 7 : 4;
      var due = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
      patch.revisionDue = due.toISOString().split("T")[0];
    } else if (task.action && task.action.resource) {
      // Find matching resource and mark it done
      var resources = (chapter.resources || []).map(function (r) {
        if (r.id === task.action.resource.id) {
          return Object.assign({}, r, { status: "done" });
        }
        return r;
      });
      patch.resources = resources;
    }

    PD.Store.updateChapter(task.chapterId, patch);
  }

  function removeTaskFromDay(dayName, taskId) {
    getWeeklyPlan();
    var dayData = planState.days[dayName];
    if (!dayData) return;

    dayData.tasks = dayData.tasks.filter(function (t) { return t.id !== taskId; });
    save();
  }

  return {
    getWeeklyPlan: getWeeklyPlan,
    addTaskToDay: addTaskToDay,
    updateTaskInDay: updateTaskInDay,
    removeTaskFromDay: removeTaskFromDay,
    carryForwardUnfinishedTasks: carryForwardUnfinishedTasks,
    DAYS_LIST: DAYS_LIST
  };
})();

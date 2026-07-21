window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

PD.Services.StudySession = (function () {
  var SESSION_LOGS_KEY = "projectDecember.sessionLogs.v1";
  var ACTIVE_SESSION_KEY = "projectDecember.activeSession.v1";
  var logs = [];

  function loadLogs() {
    try {
      var raw = localStorage.getItem(SESSION_LOGS_KEY);
      logs = raw ? JSON.parse(raw) : [];
    } catch (e) {
      logs = [];
    }
  }

  function saveLogs() {
    try {
      localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {}
  }

  function getLogs() {
    if (logs.length === 0) loadLogs();
    return logs;
  }

  function logSession(session) {
    var logsList = getLogs();
    var logItem = {
      id: "log_" + Math.random().toString(36).substr(2, 9),
      subject: session.subject,
      chapter: session.chapter,
      chapterId: session.chapterId,
      taskLabel: session.taskLabel,
      durationMinutes: session.durationMinutes,
      date: new Date().toISOString().split("T")[0],
      notes: session.notes || ""
    };
    logsList.push(logItem);
    saveLogs();

    // Dynamically update the chapter's study progress!
    var chapter = PD.Store.getChapter(session.chapterId);
    if (chapter) {
      var patch = {
        lastStudied: logItem.date,
        notes: (chapter.notes ? chapter.notes + "\n" : "") + (session.notes ? "[" + logItem.date + "] " + session.notes : "")
      };
      
      // If it's a revision task, increment revision count and update revision due date
      if (session.isRevision) {
        patch.revisionCount = (chapter.revisionCount || 0) + 1;
        patch.lastRevision = logItem.date;
        var intervalDays = chapter.confidence === 5 ? 14 : chapter.confidence === 4 ? 7 : 4;
        var due = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
        patch.revisionDue = due.toISOString().split("T")[0];
      }

      PD.Store.updateChapter(session.chapterId, patch);
    }

    return logItem;
  }

  function getActiveSession() {
    try {
      var raw = localStorage.getItem(ACTIVE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setActiveSession(session) {
    try {
      if (session === null) {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      } else {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
      }
    } catch (e) {}
  }

  // Self-correcting streak calculation based on actual work timestamps
  function getStreak() {
    var chapters = PD.Store.getChapters();
    var sessionLogs = getLogs();
    var dates = {};

    // 1. Chapters studied / revised dates
    chapters.forEach(function (c) {
      if (c.lastStudied) dates[c.lastStudied] = true;
      if (c.lastRevision) dates[c.lastRevision] = true;
    });

    // 2. Logs dates
    sessionLogs.forEach(function (l) {
      if (l.date) dates[l.date] = true;
    });

    var sortedDates = Object.keys(dates).sort(function (a, b) {
      return new Date(b) - new Date(a);
    });

    if (sortedDates.length === 0) return 0;

    var streak = 0;
    var now = new Date();
    var todayStr = now.toISOString().split("T")[0];
    
    var yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    var yesterdayStr = yesterday.toISOString().split("T")[0];

    // If they studied today or yesterday, streak is active
    if (dates[todayStr] || dates[yesterdayStr]) {
      var currentCheck = dates[todayStr] ? now : yesterday;
      while (true) {
        var checkStr = currentCheck.toISOString().split("T")[0];
        if (dates[checkStr]) {
          streak++;
          currentCheck.setTime(currentCheck.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
    }

    return streak;
  }

  // Hours studied in the current calendar week (Monday to Sunday)
  function getWeeklyStudyHours() {
    var sessionLogs = getLogs();
    var now = new Date();
    var dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    var diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    var monday = new Date(now.getTime() + diffToMon * 24 * 60 * 60 * 1000);
    monday.setHours(0, 0, 0, 0);

    var totalMinutes = 0;
    sessionLogs.forEach(function (l) {
      var logDate = new Date(l.date + "T00:00:00");
      if (logDate >= monday) {
        totalMinutes += (l.durationMinutes || 0);
      }
    });

    return Math.round((totalMinutes / 60) * 10) / 10;
  }

  // Tasks completed in the current week (Monday to Sunday)
  function getWeeklyTasksCompleted() {
    var sessionLogs = getLogs();
    var now = new Date();
    var dayOfWeek = now.getDay();
    var diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    var monday = new Date(now.getTime() + diffToMon * 24 * 60 * 60 * 1000);
    monday.setHours(0, 0, 0, 0);

    var completedCount = 0;
    sessionLogs.forEach(function (l) {
      var logDate = new Date(l.date + "T00:00:00");
      if (logDate >= monday) {
        completedCount++;
      }
    });

    return completedCount;
  }

  // Daily subject breakdowns for the last 7 days for Recharts visualization
  function getWeeklyConsistencyData() {
    var sessionLogs = getLogs();
    var days = [];
    var daysMap = {};
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    var now = new Date();
    // Build array for last 7 days (6 days ago to today)
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      var dateStr = d.toISOString().split("T")[0];
      var dayName = dayNames[d.getDay()];
      var dateNum = d.getDate();
      var label = i === 0 ? "Today" : dayName + " " + dateNum;

      var obj = {
        date: dateStr,
        dayLabel: label,
        dayName: dayName,
        Physics: 0,
        Chemistry: 0,
        Maths: 0,
        Total: 0,
        Target: 4.0 // 4 hours daily study target
      };

      days.push(obj);
      daysMap[dateStr] = obj;
    }

    // Overlay actual user logged sessions
    sessionLogs.forEach(function (l) {
      if (l.date && daysMap[l.date]) {
        var subj = l.subject || "Physics";
        // Normalize Maths vs Mathematics
        if (subj === "Mathematics") subj = "Maths";
        var hrs = Math.round(((l.durationMinutes || 0) / 60) * 10) / 10;
        if (daysMap[l.date][subj] !== undefined) {
          daysMap[l.date][subj] = Math.round((daysMap[l.date][subj] + hrs) * 10) / 10;
        }
      }
    });

    // Compute total
    days.forEach(function (d) {
      d.Total = Math.round((d.Physics + d.Chemistry + d.Maths) * 10) / 10;
    });

    return days;
  }

  return {
    getLogs: getLogs,
    logSession: logSession,
    getActiveSession: getActiveSession,
    setActiveSession: setActiveSession,
    getStreak: getStreak,
    getWeeklyStudyHours: getWeeklyStudyHours,
    getWeeklyTasksCompleted: getWeeklyTasksCompleted,
    getWeeklyConsistencyData: getWeeklyConsistencyData
  };
})();

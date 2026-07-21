window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

PD.Services.Focus = (function () {
  var FOCUS_STATE_KEY = "projectDecember.focusState.v1";
  var FOCUS_SESSIONS_KEY = "projectDecember.focusSessions.v1";

  var defaultState = {
    dailyTargetHours: 6.0,
    rescueModeActive: false,
    rescueSensitivity: "standard", // "low" | "standard" | "high"
    sessionDuration: 45,
    breakDuration: 15,
    motivationFreq: "moderate",
    abandonedCount: 0,
    postponedCount: 0
  };

  function getFocusState() {
    try {
      var raw = localStorage.getItem(FOCUS_STATE_KEY);
      if (!raw) return Object.assign({}, defaultState);
      return Object.assign({}, defaultState, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, defaultState);
    }
  }

  function saveFocusState(state) {
    try {
      localStorage.setItem(FOCUS_STATE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function updateFocusState(patch) {
    var state = getFocusState();
    var updated = Object.assign({}, state, patch);
    saveFocusState(updated);
    if (window.PD && window.PD.Store && typeof window.PD.Store.notify === "function") {
      window.PD.Store.notify();
    }
    return updated;
  }

  function getFocusSessions() {
    try {
      var raw = localStorage.getItem(FOCUS_SESSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function logFocusSession(session) {
    var sessions = getFocusSessions();
    var item = {
      id: "focus_" + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      durationMinutes: session.durationMinutes || 45,
      subject: session.subject || "General",
      chapter: session.chapter || "General",
      chapterId: session.chapterId || "",
      taskLabel: session.taskLabel || "Focus Study",
      interrupted: !!session.interrupted,
      completed: !session.interrupted
    };
    sessions.push(item);
    try {
      localStorage.setItem(FOCUS_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {}

    // Also sync to main StudySession logs if finished
    if (!session.interrupted && window.PD.Services.StudySession) {
      window.PD.Services.StudySession.logSession(session);
    }

    return item;
  }

  // --- Statistics Calculations -----------------------------------------

  function getTodayCompletedHours() {
    var todayStr = new Date().toISOString().split("T")[0];
    var sessionLogs = window.PD.Services.StudySession ? window.PD.Services.StudySession.getLogs() : [];
    var totalMin = 0;

    sessionLogs.forEach(function (l) {
      if (l.date === todayStr) {
        totalMin += (l.durationMinutes || 0);
      }
    });

    return Math.round((totalMin / 60) * 10) / 10;
  }

  function getFocusScore() {
    var state = getFocusState();
    var target = state.dailyTargetHours || 6.0;
    var completed = getTodayCompletedHours();

    // 1. Target Progress Component (40 pts max)
    var targetRatio = Math.min(1, completed / target);
    var targetScore = Math.round(targetRatio * 40);

    // 2. Streak & Consistency Component (30 pts max)
    var streak = window.PD.Services.StudySession ? window.PD.Services.StudySession.getStreak() : 0;
    var streakScore = Math.min(30, streak * 6);

    // 3. Execution Efficiency (30 pts max - minus penalties for abandoned sessions)
    var abandoned = state.abandonedCount || 0;
    var efficiencyScore = Math.max(0, 30 - (abandoned * 10));

    var total = targetScore + streakScore + efficiencyScore;
    return Math.min(100, Math.max(0, total));
  }

  // --- Diagnostics & Procrastination Engine ----------------------------

  function detectProcrastination(chapters) {
    var warnings = [];
    var state = getFocusState();
    var todayHours = getTodayCompletedHours();
    var currentHour = new Date().getHours();

    // Diagnostic 1: Late Start Alert
    if (todayHours === 0 && currentHour >= 16) {
      warnings.push({
        id: "late_start",
        severity: "high",
        icon: "⏰",
        title: "Late Start Warning",
        message: "You haven't logged any study hours yet today. High activation energy detected!",
        suggestion: "Use Smart Start to launch a 15-minute quick warm-up session right now.",
        actionText: "🚀 Quick 15m Warm-Up"
      });
    }

    // Diagnostic 2: Abandoned Sessions Trend
    if (state.abandonedCount >= 2) {
      warnings.push({
        id: "abandoned_trend",
        severity: "medium",
        icon: "⚡",
        title: "Session Interruption Pattern",
        message: "You have stopped or aborted multiple timer sessions early today.",
        suggestion: "Lower session duration to 20–25 minutes to make focusing effortless.",
        actionText: "⚙️ Switch to 20m Pomodoro"
      });
    }

    // Diagnostic 3: Overwhelmed Backlog
    if (state.rescueModeActive) {
      warnings.push({
        id: "rescue_active",
        severity: "info",
        icon: "🛟",
        title: "Rescue Mode Enabled",
        message: "Rescue Mode is active to keep you moving forward with reduced pressure.",
        suggestion: "Focus on 1 micro-task at a time. Ignore the full syllabus list for now.",
        actionText: "📋 View Recovery Plan"
      });
    }

    // Diagnostic 4: Clean Start Encouragement
    if (warnings.length === 0 && todayHours === 0) {
      warnings.push({
        id: "fresh_start",
        severity: "info",
        icon: "🌟",
        title: "Ready to Conquer Today",
        message: "Your schedule is ready for July 22nd. Choose your first focus chapter!",
        suggestion: "Consistent daily momentum beats last-minute marathon cramming.",
        actionText: "🚀 Launch First Task"
      });
    }

    return warnings;
  }

  // --- Rescue Mode & Recovery Plan ------------------------------------

  function getRescuePlan(chapters) {
    var chaps = chapters || (window.PD.Store ? window.PD.Store.getChapters() : []);
    
    // Pick 3 low-friction tasks:
    // 1. Weakest chapter
    var sorted = chaps.slice().sort(function (a, b) {
      var hA = a.healthScore !== undefined ? a.healthScore : (a.health || 0);
      var hB = b.healthScore !== undefined ? b.healthScore : (b.health || 0);
      return hA - hB;
    });

    var weakCh = sorted[0] || chaps[0];
    var physicsCh = chaps.find(function (c) { return c.subject === "Physics"; }) || chaps[1];
    var chemistryCh = chaps.find(function (c) { return c.subject === "Chemistry"; }) || chaps[2];

    return [
      {
        step: 1,
        title: "Micro Step 1 (Physics)",
        chapter: physicsCh ? physicsCh.chapter : "Kinematics",
        subject: physicsCh ? physicsCh.subject : "Physics",
        chapterId: physicsCh ? physicsCh.id : "",
        durationMinutes: 20,
        taskLabel: "📖 20-min Formula Review & Key Diagrams",
        desc: "Read key formulas and basic definitions. No heavy calculations."
      },
      {
        step: 2,
        title: "Micro Step 2 (Chemistry)",
        chapter: chemistryCh ? chemistryCh.chapter : "Atomic Structure",
        subject: chemistryCh ? chemistryCh.subject : "Chemistry",
        chapterId: chemistryCh ? chemistryCh.id : "",
        durationMinutes: 20,
        taskLabel: "✍️ Solve 5 Basic PYQs",
        desc: "Target standard direct formulas or NCERT exercise questions."
      },
      {
        step: 3,
        title: "Micro Step 3 (Weakest Chapter)",
        chapter: weakCh ? weakCh.chapter : "Calculus",
        subject: weakCh ? weakCh.subject : "Mathematics",
        chapterId: weakCh ? weakCh.id : "",
        durationMinutes: 25,
        taskLabel: "🧠 Error Notebook Review & 3 Practice Solved Problems",
        desc: "Revisit 2 past mistakes and re-solve them step by step."
      }
    ];
  }

  // --- Micro Task Breakdown Generator --------------------------------

  function getMicroTasksForChapter(chapterObj) {
    if (!chapterObj) return [];

    var name = chapterObj.chapter || "Chapter";
    var subj = chapterObj.subject || "Physics";

    return [
      {
        id: "m1",
        label: "📖 15-Min Concept Sprint",
        desc: "Read core definitions, formulas, and key boundary conditions for " + name,
        durationMinutes: 15,
        type: "theory"
      },
      {
        id: "m2",
        label: "✍️ 20-Min 5-Problem Drill",
        desc: "Solve 5 essential PYQ / coaching exercise questions in " + name,
        durationMinutes: 20,
        type: "practice"
      },
      {
        id: "m3",
        label: "📝 10-Min Formula & Trap Summary",
        desc: "Write down 5 crucial formulas & error traps for " + name + " from memory",
        durationMinutes: 10,
        type: "notes"
      }
    ];
  }

  // --- Gentle Accountability Messages -------------------------------

  function getGentleAccountabilityMessage() {
    var hours = getTodayCompletedHours();
    var streak = window.PD.Services.StudySession ? window.PD.Services.StudySession.getStreak() : 0;

    if (hours >= 5.0) {
      return {
        type: "celebration",
        badge: "🏆 Outstanding Effort",
        quote: "Phenomenal focus today! You've logged " + hours + " hours toward your JEE goal.",
        sub: "Rest well tonight to consolidate memory for long-term retention."
      };
    } else if (hours >= 2.0) {
      return {
        type: "momentum",
        badge: "⚡ Solid Momentum",
        quote: "You've built " + hours + " hours of high-quality study time today.",
        sub: "One more 45-minute focus block will bring you close to your daily target!"
      };
    } else if (streak > 0) {
      return {
        type: "encouragement",
        badge: "🔥 Streak Guard Active",
        quote: "You have a " + streak + "-day study streak going strong!",
        sub: "Complete a quick 20-minute session now to protect your momentum."
      };
    } else {
      return {
        type: "gentle_push",
        badge: "🌱 Fresh Focus Start",
        quote: "Action breeds motivation, not the other way around.",
        sub: "Start with just 15 minutes. Once you get into the flow, progress happens naturally."
      };
    }
  }

  // --- Smart Start Launcher --------------------------------------------

  function smartStart(options) {
    var state = getFocusState();
    var chapters = window.PD.Store ? window.PD.Store.getChapters() : [];

    var targetChapter = null;
    var taskLabel = "📖 Theory Reading & Practice Drill";
    var duration = state.sessionDuration || 45;

    if (options && options.chapterId) {
      targetChapter = window.PD.Store.getChapter(options.chapterId);
      if (options.taskLabel) taskLabel = options.taskLabel;
      if (options.durationMinutes) duration = options.durationMinutes;
    }

    if (!targetChapter) {
      // Pick top daily mission or weakest chapter
      if (window.PD.Services.Planner) {
        var mission = window.PD.Services.Planner.getDailyMission(chapters);
        if (mission && mission.length > 0) {
          targetChapter = mission[0].chapter;
          taskLabel = (mission[0].action ? mission[0].action.label : mission[0].reason) || taskLabel;
        }
      }
    }

    if (!targetChapter && chapters.length > 0) {
      targetChapter = chapters[0];
    }

    if (!targetChapter) {
      alert("No chapters available in Master Tracker.");
      return;
    }

    // Set Active Study Session
    if (window.PD.Services.StudySession) {
      window.PD.Services.StudySession.setActiveSession({
        chapterId: targetChapter.id,
        chapter: targetChapter.chapter,
        subject: targetChapter.subject,
        taskLabel: taskLabel,
        durationMinutes: duration,
        isRevision: taskLabel.toLowerCase().indexOf("revise") !== -1,
        startTime: new Date().toISOString(),
        notes: ""
      });
    }

    // Navigate to Workspace page
    window.location.hash = "#/workspace";
  }

  return {
    getFocusState: getFocusState,
    updateFocusState: updateFocusState,
    getFocusSessions: getFocusSessions,
    logFocusSession: logFocusSession,
    getTodayCompletedHours: getTodayCompletedHours,
    getFocusScore: getFocusScore,
    detectProcrastination: detectProcrastination,
    getRescuePlan: getRescuePlan,
    getMicroTasksForChapter: getMicroTasksForChapter,
    getGentleAccountabilityMessage: getGentleAccountabilityMessage,
    smartStart: smartStart
  };
})();

window.PD = window.PD || {};

// Single source of truth for chapter data. Every page reads from here and
// writes through updateChapter() — nothing keeps its own copy of state.
PD.Store = (function () {
  var STORAGE_KEY = "projectDecember.chapters.v1";
  var THEME_KEY = "projectDecember.theme.v1";
  var TRACKER_FILTERS_KEY = "projectDecember.trackerFilters.v1";
  var PLAN_START_KEY = "projectDecember.planStartDate.v1";
  var PLANNER_STATE_KEY = "projectDecember.plannerState.v2";
  var VERSION_KEY = "projectDecember.syllabusVersion.v1";
  var CURRENT_VERSION = 2; // Incremented for 99 chapters
  var DEFAULT_PLAN_START = "2026-07-22"; // Fresh plan start date requested by student
  var state = { chapters: [] };
  var listeners = [];

  function notify() {
    listeners.forEach(function (fn) {
      fn(state);
    });
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.chapters));
    } catch (err) {
      console.error("PD.Store: failed to persist state", err);
    }
  }

  function init() {
    var raw = null;
    var rawVersion = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
      rawVersion = localStorage.getItem(VERSION_KEY);
    } catch (err) {
      console.error("PD.Store: localStorage unavailable", err);
    }

    var parsedVersion = rawVersion ? parseInt(rawVersion, 10) : 1;
    var freshChapters = PD.ChapterState.seed();
    var expectedCount = freshChapters.length;

    if (raw) {
      try {
        var chapters = JSON.parse(raw);
        // If version is outdated or chapter list length is not matching the latest syllabus, run automatic migration
        if (parsedVersion < CURRENT_VERSION || !chapters || chapters.length !== expectedCount) {
          // Merge existing user progress for matching subject/chapter titles
          state.chapters = freshChapters.map(function (fresh) {
            var existing = (chapters && Array.isArray(chapters)) ? chapters.find(function (ext) {
              return ext.subject === fresh.subject && ext.chapter === fresh.chapter;
            }) : null;
            if (existing) {
              return Object.assign({}, fresh, {
                id: existing.id,
                completed: existing.completed,
                confidence: existing.confidence,
                revisionCount: existing.revisionCount,
                revisionDue: existing.revisionDue,
                accuracy: existing.accuracy,
                notes: existing.notes || "",
                estimatedHours: existing.estimatedHours,
                completedTasks: existing.completedTasks || 0,
                remainingTasks: existing.remainingTasks || 0,
                health: existing.health,
                lastStudied: existing.lastStudied,
                lastRevision: existing.lastRevision,
                bookmarks: existing.bookmarks || [],
                customTags: existing.customTags || [],
                resources: existing.resources || []
              });
            }
            return fresh;
          });

          // Set current version and persist the migrated state
          try {
            localStorage.setItem(VERSION_KEY, CURRENT_VERSION.toString());
          } catch (e) {}
          persist();
        } else {
          state.chapters = chapters;
        }

        // Sanitize: If uncompleted chapter has lastStudied/lastRevision from before 2026-07-21, clean it
        state.chapters.forEach(function (ch) {
          if (!ch.completed && (ch.lastStudied || ch.lastRevision)) {
            var dateToCheck = ch.lastRevision || ch.lastStudied;
            if (new Date(dateToCheck).getTime() < new Date("2026-07-21").getTime()) {
              ch.lastStudied = null;
              ch.lastRevision = null;
              ch.revisionDue = null;
            }
          }
        });
        persist();
      } catch (err) {
        console.error("PD.Store: corrupted storage, re-seeding", err);
        state.chapters = freshChapters;
        try {
          localStorage.setItem(VERSION_KEY, CURRENT_VERSION.toString());
        } catch (e) {}
        persist();
      }
    } else {
      state.chapters = freshChapters;
      try {
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION.toString());
      } catch (e) {}
      persist();
    }
  }

  function getChapters() {
    return state.chapters;
  }

  function getChapter(id) {
    return (
      state.chapters.find(function (c) {
        return c.id === id;
      }) || null
    );
  }

  function updateChapter(id, patch) {
    var chapter = getChapter(id);
    if (!chapter) return null;
    Object.assign(chapter, patch);
    persist();
    notify();
    return chapter;
  }

  function subscribe(fn) {
    listeners.push(fn);
    return function unsubscribe() {
      listeners = listeners.filter(function (l) {
        return l !== fn;
      });
    };
  }

  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "dark";
    } catch (err) {
      return "dark";
    }
  }

  function setTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (err) {
      console.error("PD.Store: failed to persist theme", err);
    }
  }

  // Subject/status/sort are durable view preferences worth remembering —
  // the search box is not (it's a one-off lookup, not a standing
  // preference), so it's deliberately excluded from what gets persisted.
  function getTrackerFilters() {
    try {
      var raw = localStorage.getItem(TRACKER_FILTERS_KEY);
      return raw ? JSON.parse(raw) : { subject: "All", status: "All", sort: "subject" };
    } catch (err) {
      return { subject: "All", status: "All", sort: "subject" };
    }
  }

  function setTrackerFilters(filters) {
    try {
      localStorage.setItem(TRACKER_FILTERS_KEY, JSON.stringify(filters));
    } catch (err) {
      console.error("PD.Store: failed to persist tracker filters", err);
    }
  }

  // The Planner's start date - real and editable, per the brief. Defaults
  // to 20 July as stated, not "today," since that's a deliberate choice,
  // not a computed one.
  function getPlanStartDate() {
    try {
      return localStorage.getItem(PLAN_START_KEY) || DEFAULT_PLAN_START;
    } catch (err) {
      return DEFAULT_PLAN_START;
    }
  }

  function setPlanStartDate(dateStr) {
    try {
      localStorage.setItem(PLAN_START_KEY, dateStr);
      // Clean up stale pre-populated study dates for fresh kickoff
      state.chapters.forEach(function (ch) {
        if (!ch.completed) {
          ch.lastStudied = null;
          ch.lastRevision = null;
          ch.revisionDue = null;
        }
      });
      persist();
      localStorage.removeItem("projectDecember.weeklyPlan.v1");
      notify();
    } catch (err) {
      console.error("PD.Store: failed to persist plan start date", err);
    }
  }

  function getPlannerState() {
    try {
      var raw = localStorage.getItem(PLANNER_STATE_KEY);
      return raw ? JSON.parse(raw) : { lastActiveDate: "", todayMission: [], backlog: [] };
    } catch (err) {
      return { lastActiveDate: "", todayMission: [], backlog: [] };
    }
  }

  function setPlannerState(plannerState) {
    try {
      localStorage.setItem(PLANNER_STATE_KEY, JSON.stringify(plannerState));
    } catch (err) {
      console.error("PD.Store: failed to persist planner state", err);
    }
  }

  var SETTINGS_KEY = "projectDecember.settings.v1";
  var DEFAULT_SETTINGS = {
    appearance: {
      theme: "dark",
      accentColor: "#3b82f6",
      fontScale: 1.0
    },
    studyPreferences: {
      dailyStudyTargetHours: 6,
      weeklyGoalHours: 42,
      plannerCapacityTasksPerDay: 5,
      sessionLengthMinutes: 45,
      breakDurationMinutes: 15,
      targetExamDate: "2027-01-20"
    },
    revisionPreferences: {
      defaultRevisionIntervalDays: 3,
      confidenceThreshold: 3,
      healthDecayRate: "standard"
    },
    notifications: {
      reminderEnabled: true,
      revisionAlerts: true,
      dailyGoalReminder: true,
      reminderTime: "20:00"
    }
  };

  function getSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_SETTINGS, parsed, {
        appearance: Object.assign({}, DEFAULT_SETTINGS.appearance, parsed.appearance || {}),
        studyPreferences: Object.assign({}, DEFAULT_SETTINGS.studyPreferences, parsed.studyPreferences || {}),
        revisionPreferences: Object.assign({}, DEFAULT_SETTINGS.revisionPreferences, parsed.revisionPreferences || {}),
        notifications: Object.assign({}, DEFAULT_SETTINGS.notifications, parsed.notifications || {})
      });
    } catch (err) {
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  function setSettings(newSettings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      if (newSettings && newSettings.appearance && newSettings.appearance.theme) {
        setTheme(newSettings.appearance.theme);
      }
      notify();
    } catch (err) {
      console.error("PD.Store: failed to persist settings", err);
    }
  }

  function updateSettings(patch) {
    var current = getSettings();
    var updated = Object.assign({}, current, patch);
    setSettings(updated);
    return updated;
  }

  function exportAllData() {
    var rawMistakes = localStorage.getItem("projectDecember.mistakes.v1") || localStorage.getItem("projectDecember.errorNotebook.v1");
    var exportPayload = {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      chapters: state.chapters,
      trackerFilters: getTrackerFilters(),
      planStartDate: getPlanStartDate(),
      plannerState: getPlannerState(),
      settings: getSettings(),
      sessionLogs: localStorage.getItem("projectDecember.sessionLogs.v1") ? JSON.parse(localStorage.getItem("projectDecember.sessionLogs.v1")) : [],
      errorNotebook: rawMistakes ? JSON.parse(rawMistakes) : []
    };
    return JSON.stringify(exportPayload, null, 2);
  }

  function importAllData(jsonStr) {
    try {
      var data = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
      if (!data || !Array.isArray(data.chapters)) {
        throw new Error("Invalid import format: missing 'chapters' array.");
      }

      state.chapters = data.chapters.map(function (ch) {
        return PD.ChapterState.create(ch);
      });
      persist();

      if (data.trackerFilters) setTrackerFilters(data.trackerFilters);
      if (data.planStartDate) setPlanStartDate(data.planStartDate);
      if (data.plannerState) setPlannerState(data.plannerState);
      if (data.settings) setSettings(data.settings);

      if (data.sessionLogs && Array.isArray(data.sessionLogs)) {
        localStorage.setItem("projectDecember.sessionLogs.v1", JSON.stringify(data.sessionLogs));
      }
      var mistakesData = data.errorNotebook || data.mistakes;
      if (mistakesData && Array.isArray(mistakesData)) {
        localStorage.setItem("projectDecember.mistakes.v1", JSON.stringify(mistakesData));
        localStorage.setItem("projectDecember.errorNotebook.v1", JSON.stringify(mistakesData));
      }

      notify();
      return { success: true, count: state.chapters.length };
    } catch (err) {
      console.error("PD.Store: failed to import data", err);
      return { success: false, error: err.message };
    }
  }

  function pumpDownHealth() {
    state.chapters.forEach(function (ch) {
      ch.completed = false;
      ch.confidence = Math.min(ch.confidence || 1, 2);
      ch.health = Math.min(ch.health || 0, 30);
      ch.lastStudied = null;
      ch.lastRevision = null;
      ch.revisionDue = null;
      ch.revisionCount = 0;
      if (ch.resources) {
        ch.resources.forEach(function (r) { r.status = "not-started"; });
      }
    });
    persist();
    notify();
  }

  function resetPlanner() {
    localStorage.removeItem(PLANNER_STATE_KEY);
    localStorage.removeItem(PLAN_START_KEY);
    notify();
  }

  function resetAnalytics() {
    localStorage.removeItem("projectDecember.sessionLogs.v1");
    localStorage.removeItem("projectDecember.focusSessions.v1");
    localStorage.removeItem("projectDecember.mistakes.v1");
    localStorage.removeItem("projectDecember.errorNotebook.v1");
    notify();
  }

  function resetProject() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRACKER_FILTERS_KEY);
    localStorage.removeItem(PLAN_START_KEY);
    localStorage.removeItem(PLANNER_STATE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem("projectDecember.sessionLogs.v1");
    localStorage.removeItem("projectDecember.focusSessions.v1");
    localStorage.removeItem("projectDecember.focusState.v1");
    localStorage.removeItem("projectDecember.mistakes.v1");
    localStorage.removeItem("projectDecember.errorNotebook.v1");
    init();
    notify();
  }

  return {
    init: init,
    getChapters: getChapters,
    getChapter: getChapter,
    updateChapter: updateChapter,
    pumpDownHealth: pumpDownHealth,
    subscribe: subscribe,
    getTheme: getTheme,
    setTheme: setTheme,
    getTrackerFilters: getTrackerFilters,
    setTrackerFilters: setTrackerFilters,
    getPlanStartDate: getPlanStartDate,
    setPlanStartDate: setPlanStartDate,
    getPlannerState: getPlannerState,
    setPlannerState: setPlannerState,
    getSettings: getSettings,
    setSettings: setSettings,
    updateSettings: updateSettings,
    exportAllData: exportAllData,
    importAllData: importAllData,
    resetPlanner: resetPlanner,
    resetAnalytics: resetAnalytics,
    resetProject: resetProject
  };
})();

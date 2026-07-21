window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

// Every Dashboard section is a pure function of the chapters already in
// PD.Store - no separate "dashboard data," nothing that can drift out of
// sync with Tracker. If a chapter's health or revision status changes in
// Tracker, the next Dashboard render reflects it automatically.
PD.Services.Dashboard = (function () {
  var SUBJECT_ORDER = ["Chemistry", "Physics", "Mathematics"];
  var MISSION_LIMIT = 4;
  var WEAKEST_LIMIT = 5;
  var CONTINUE_LIMIT = 5;
  var UPCOMING_WINDOW_DAYS = 7;

  function annotate(chapters) {
    return chapters.map(function (chapter) {
      return {
        chapter: chapter,
        health: PD.Services.Health.compute(chapter),
        revision: PD.Services.Revision.getStatus(chapter)
      };
    });
  }

  // Tiered, not a single sort: overdue revisions come first (forgetting is
  // actively happening), then due-today/tomorrow, then - since on a fresh
  // tracker nothing will be scheduled yet - the weakest chapters fill any
  // remaining slots. Capped at 4 so it stays a 10-second read, not a list.
  function getMission(chapters) {
    var today = new Date();
    var todayStr = today.toISOString().split("T")[0];
    if (todayStr < "2026-07-22") {
      todayStr = "2026-07-22";
    }

    if (window.PD && window.PD.Services && window.PD.Services.JulySchedule) {
      var customSched = window.PD.Services.JulySchedule.getScheduleForDate(todayStr, chapters);
      if (customSched && customSched.mission && customSched.mission.length > 0) {
        return customSched.mission.map(function (m) {
          return {
            chapter: m.chapter,
            reason: m.action ? m.action.label : m.reason
          };
        });
      }
    }

    var annotated = annotate(chapters);
    var mission = [];
    var used = {};

    function take(list, reasonFn) {
      list.forEach(function (item) {
        if (mission.length >= MISSION_LIMIT || used[item.chapter.id]) return;
        mission.push({ chapter: item.chapter, reason: reasonFn(item) });
        used[item.chapter.id] = true;
      });
    }

    var overdue = annotated
      .filter(function (a) {
        return a.revision.status === "overdue";
      })
      .sort(function (a, b) {
        return a.revision.daysUntil - b.revision.daysUntil; // most negative (most overdue) first
      });
    take(overdue, function (a) {
      return a.revision.label;
    });

    var dueSoon = annotated
      .filter(function (a) {
        return a.revision.status === "due-soon";
      })
      .sort(function (a, b) {
        return a.revision.daysUntil - b.revision.daysUntil;
      });
    take(dueSoon, function (a) {
      return a.revision.label;
    });

    if (mission.length < MISSION_LIMIT) {
      var weakest = annotated
        .filter(function (a) {
          return a.health.band !== "strong";
        })
        .sort(function (a, b) {
          return a.health.score - b.health.score;
        });
      take(weakest, function (a) {
        return "Health " + a.health.score + " — needs attention";
      });
    }

    return mission;
  }

  function getRevisionQueue(chapters) {
    var annotated = annotate(chapters);

    var overdue = annotated
      .filter(function (a) {
        return a.revision.status === "overdue";
      })
      .sort(function (a, b) {
        return a.revision.daysUntil - b.revision.daysUntil;
      });
    var dueToday = annotated.filter(function (a) {
      return a.revision.status === "due-soon" && a.revision.daysUntil === 0;
    });
    var dueTomorrow = annotated.filter(function (a) {
      return a.revision.status === "due-soon" && a.revision.daysUntil === 1;
    });

    return {
      overdue: overdue.map(withReason(function (a) {
        return a.revision.label;
      })),
      dueToday: dueToday.map(withReason(function () {
        return "Due today";
      })),
      dueTomorrow: dueTomorrow.map(withReason(function () {
        return "Due tomorrow";
      }))
    };
  }

  function getWeakestChapters(chapters, limit) {
    return annotate(chapters)
      .sort(function (a, b) {
        return a.health.score - b.health.score;
      })
      .slice(0, limit || WEAKEST_LIMIT)
      .map(function (a) {
        return { chapter: a.chapter, reason: "Health " + a.health.score };
      });
  }

  function getContinueStudying(chapters, limit) {
    return chapters
      .filter(function (c) {
        return !c.completed && (c.lastStudied || c.lastRevision);
      })
      .map(function (c) {
        var lastTouch = Math.max(
          c.lastStudied ? new Date(c.lastStudied).getTime() : 0,
          c.lastRevision ? new Date(c.lastRevision).getTime() : 0
        );
        return { chapter: c, lastTouch: lastTouch };
      })
      .sort(function (a, b) {
        return b.lastTouch - a.lastTouch;
      })
      .slice(0, limit || CONTINUE_LIMIT)
      .map(function (item) {
        return { chapter: item.chapter, reason: "Last touched " + relativeDays(item.lastTouch) };
      });
  }

  function getOverallProgress(chapters) {
    var bySubject = {};
    SUBJECT_ORDER.forEach(function (subject) {
      var subjectChapters = chapters.filter(function (c) {
        return c.subject === subject;
      });
      var completed = subjectChapters.filter(function (c) {
        return c.completed;
      }).length;
      bySubject[subject] = { completed: completed, total: subjectChapters.length };
    });

    var totalCompleted = chapters.filter(function (c) {
      return c.completed;
    }).length;

    return { bySubject: bySubject, overall: { completed: totalCompleted, total: chapters.length } };
  }

  // Deliberately not scheduling - just a passive read of revision dates
  // that are already computed, grouped into "in N days." No time
  // allocation, no calendar, nothing the future Planner should own instead.
  function getUpcomingWork(chapters, windowDays) {
    var span = windowDays || UPCOMING_WINDOW_DAYS;
    return annotate(chapters)
      .filter(function (a) {
        return a.revision.status === "ok" && a.revision.daysUntil <= span;
      })
      .sort(function (a, b) {
        return a.revision.daysUntil - b.revision.daysUntil;
      })
      .map(function (a) {
        return { chapter: a.chapter, reason: "In " + a.revision.daysUntil + " days" };
      });
  }

  function withReason(reasonFn) {
    return function (a) {
      return { chapter: a.chapter, reason: reasonFn(a) };
    };
  }

  function relativeDays(timestampMs) {
    var days = Math.floor((Date.now() - timestampMs) / (24 * 60 * 60 * 1000));
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    return days + " days ago";
  }

  return {
    getMission: getMission,
    getRevisionQueue: getRevisionQueue,
    getWeakestChapters: getWeakestChapters,
    getContinueStudying: getContinueStudying,
    getOverallProgress: getOverallProgress,
    getUpcomingWork: getUpcomingWork
  };
})();

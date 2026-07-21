window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

// Phase 4a: today's plan, broken into the smallest real next action per
// chapter - not just a chapter name.
//
// Chapter selection is deliberately subject-balanced (up to one chapter per
// subject) rather than reusing Dashboard's global top-4 list verbatim.
// Dashboard's job is "what's most urgent, period" - a real ranking that can
// correctly surface three Chemistry chapters and zero Maths ones if
// Chemistry happens to be weaker right now. Planner's job is different: a
// realistic study day across three subjects, for months. A plan that
// silently skips a whole subject isn't fake, but it isn't realistic either -
// so this applies the same tiered urgency logic Dashboard uses, per
// subject, rather than re-deciding what "urgent" means.
PD.Services.Planner = (function () {
  var SUBJECT_ORDER = ["Chemistry", "Physics", "Mathematics"];

  // Mirrors the order resources are offered in Tracker's quick-add menu - a
  // reasonable default study sequence (theory before practice before past
  // papers before reference material before tests). Custom resources have
  // no natural position in that sequence, so they sort last.
  var TYPE_PRIORITY = [
    "coaching-theory",
    "coaching-module",
    "dpps",
    "pyqs",
    "ncert",
    "formula-sheet",
    "short-notes",
    "revision-notes",
    "tests"
  ];

  function typeRank(type) {
    var idx = TYPE_PRIORITY.indexOf(type);
    return idx === -1 ? TYPE_PRIORITY.length : idx;
  }

  function getProportionalSlots(chapters) {
    var incompleteBySubject = { Chemistry: 0, Physics: 0, Mathematics: 0 };
    chapters.forEach(function (c) {
      if (!c.completed) {
        incompleteBySubject[c.subject]++;
      }
    });

    var totalIncomplete = incompleteBySubject.Chemistry + incompleteBySubject.Physics + incompleteBySubject.Mathematics;
    if (totalIncomplete === 0) {
      // Post-syllabus phase: equal 1 slot per subject for PYQ drills & revisions
      return { Chemistry: 1, Physics: 1, Mathematics: 1 };
    }

    var slots = { Chemistry: 0, Physics: 0, Mathematics: 0 };
    var subjects = ["Chemistry", "Physics", "Mathematics"];
    var sorted = subjects.slice().sort(function (a, b) {
      return incompleteBySubject[b] - incompleteBySubject[a];
    });

    // Handle edge cases of remaining work distributions:
    if (incompleteBySubject[sorted[0]] === totalIncomplete) {
      slots[sorted[0]] = 3;
    } else {
      var p0 = incompleteBySubject[sorted[0]] / totalIncomplete;

      if (p0 >= 0.6) {
        slots[sorted[0]] = 2;
        slots[sorted[1]] = 1;
      } else if (incompleteBySubject[sorted[2]] === 0) {
        slots[sorted[0]] = 2;
        slots[sorted[1]] = 1;
      } else {
        slots[sorted[0]] = 1;
        slots[sorted[1]] = 1;
        slots[sorted[2]] = 1;
      }
    }
    return slots;
  }

  function selectForSubject(subjectChapters, count) {
    if (count <= 0) return [];

    var annotated = subjectChapters.map(function (c) {
      return { chapter: c, health: PD.Services.Health.compute(c), revision: PD.Services.Revision.getStatus(c) };
    });

    var selected = [];

    // 1. Overdue revisions
    var overdue = annotated
      .filter(function (a) {
        return a.revision.status === "overdue";
      })
      .sort(function (a, b) {
        return a.revision.daysUntil - b.revision.daysUntil;
      });
    while (overdue.length > 0 && selected.length < count) {
      var item = overdue.shift();
      selected.push({ chapter: item.chapter, reason: item.revision.label });
    }

    // 2. Due soon revisions
    var dueSoon = annotated
      .filter(function (a) {
        var isSel = selected.some(function (s) { return s.chapter.id === a.chapter.id; });
        return a.revision.status === "due-soon" && !isSel;
      })
      .sort(function (a, b) {
        return a.revision.daysUntil - b.revision.daysUntil;
      });
    while (dueSoon.length > 0 && selected.length < count) {
      var item = dueSoon.shift();
      selected.push({ chapter: item.chapter, reason: item.revision.label });
    }

    // 3. Weak / Not-started chapters
    var weakest = annotated
      .filter(function (a) {
        var isSel = selected.some(function (s) { return s.chapter.id === a.chapter.id; });
        return a.health.band !== "strong" && !isSel;
      })
      .sort(function (a, b) {
        return a.health.score - b.health.score;
      });
    while (weakest.length > 0 && selected.length < count) {
      var item = weakest.shift();
      var label = item.health.band === "unstarted" ? "Start Syllabus" : "Health " + item.health.score;
      selected.push({ chapter: item.chapter, reason: label });
    }

    // 4. Default fallback: incomplete
    if (selected.length < count) {
      var remaining = annotated
        .filter(function (a) {
          var isSel = selected.some(function (s) { return s.chapter.id === a.chapter.id; });
          return !a.chapter.completed && !isSel;
        });
      while (remaining.length > 0 && selected.length < count) {
        var item = remaining.shift();
        selected.push({ chapter: item.chapter, reason: "Syllabus progression" });
      }
    }

    // 5. Post-completion cycle: Least recently revised / studied
    if (selected.length < count) {
      var candidates = annotated
        .filter(function (a) {
          return !selected.some(function (s) { return s.chapter.id === a.chapter.id; });
        })
        .sort(function (a, b) {
          var timeA = a.chapter.lastRevision ? new Date(a.chapter.lastRevision).getTime() : (a.chapter.lastStudied ? new Date(a.chapter.lastStudied).getTime() : 0);
          var timeB = b.chapter.lastRevision ? new Date(b.chapter.lastRevision).getTime() : (b.chapter.lastStudied ? new Date(b.chapter.lastStudied).getTime() : 0);
          return timeA - timeB;
        });
      while (candidates.length > 0 && selected.length < count) {
        var item = candidates.shift();
        selected.push({ chapter: item.chapter, reason: "Cyclic MHT-CET PYQ & Spaced Review" });
      }
    }

    return selected;
  }

  function getDailyMission(chapters, targetDateStr) {
    var dateStr = targetDateStr || new Date().toISOString().split("T")[0];

    // 1. Check if custom July Schedule exists for this date
    if (window.PD && window.PD.Services && window.PD.Services.JulySchedule) {
      var customSched = window.PD.Services.JulySchedule.getScheduleForDate(dateStr, chapters);
      if (customSched && customSched.mission && customSched.mission.length > 0) {
        return customSched.mission;
      }
    }

    // 2. Algorithmic Fallback
    var mission = [];
    var slots = getProportionalSlots(chapters);

    SUBJECT_ORDER.forEach(function (subject) {
      var subjectChapters = chapters.filter(function (c) {
        return c.subject === subject;
      });
      var count = slots[subject] || 0;
      var pickedList = selectForSubject(subjectChapters, count);

      pickedList.forEach(function (picked) {
        mission.push({
          chapter: picked.chapter,
          reason: picked.reason,
          action: getNextAction(picked.chapter)
        });
      });
    });
    return mission;
  }

  function getForecast(chapters, daysCount) {
    var clonedChapters = JSON.parse(JSON.stringify(chapters));
    var forecast = [];
    var now = new Date();

    for (var i = 1; i <= daysCount; i++) {
      var simDate = new Date(now.getTime() + (i - 1) * 24 * 60 * 60 * 1000);
      var simDateStr = simDate.toISOString().split("T")[0];

      var dailyMission = getDailyMission(clonedChapters, simDateStr);
      forecast.push({
        dayOffset: i,
        dateStr: simDateStr,
        mission: dailyMission
      });

      // Simulate completing these tasks so they influence the next simulated day!
      dailyMission.forEach(function (item) {
        if (!item || !item.chapter) return;
        var ch = clonedChapters.find(function (c) { return c.id === item.chapter.id; });
        if (!ch) return;

        if (item.action && item.action.kind === "resource" && item.action.resource) {
          ch.resources = (ch.resources || []).map(function (r) {
            return r.id === item.action.resource.id ? Object.assign({}, r, { status: "done" }) : r;
          });
          ch.lastStudied = simDateStr;
        } else if (item.action && item.action.kind === "revision") {
          ch.revisionCount = (ch.revisionCount || 0) + 1;
          ch.lastRevision = simDateStr;
          var days = ch.confidence === 5 ? 14 : ch.confidence === 4 ? 10 : 6;
          var due = new Date(simDate.getTime() + days * 24 * 60 * 60 * 1000);
          ch.revisionDue = due.toISOString().split("T")[0];
        } else {
          ch.completed = true;
          ch.lastStudied = simDateStr;
          ch.lastRevision = simDateStr;
          var days = ch.confidence === 5 ? 14 : ch.confidence === 4 ? 10 : 6;
          var due = new Date(simDate.getTime() + days * 24 * 60 * 60 * 1000);
          ch.revisionDue = due.toISOString().split("T")[0];
        }
      });
    }
    return forecast;
  }

  // Priority: finish something already in progress before starting
  // something new (lower switching cost, less procrastination-inducing),
  // in a sensible study sequence among not-started ones. If every tracked
  // resource is done, or none exist yet, fall back to an honest generic
  // step from the chapter's real state - never a fake resource name for a
  // chapter that doesn't have one.
  function getNextAction(chapter) {
    var resources = chapter.resources || [];

    if (resources.length > 0) {
      var inProgress = resources.filter(function (r) {
        return r.status === "in-progress";
      });
      var notStarted = resources.filter(function (r) {
        return r.status === "not-started";
      });
      var pool = inProgress.length > 0 ? inProgress : notStarted;

      if (pool.length > 0) {
        var sorted = pool.slice().sort(function (a, b) {
          return typeRank(a.type) - typeRank(b.type);
        });
        return { kind: "resource", resource: sorted[0], label: sorted[0].label };
      }
    }

    var revision = PD.Services.Revision.getStatus(chapter);
    if (revision.status === "overdue" || revision.status === "due-soon") {
      return { kind: "revision", label: "Revise " + chapter.chapter };
    }

    if (chapter.lastStudied || chapter.lastRevision) {
      return { kind: "continue", label: "Continue " + chapter.chapter };
    }

    return { kind: "start", label: "Start " + chapter.chapter };
  }

  // Day 1 is the start date itself. Zero or negative means the plan hasn't
  // started yet - a real, expected state, not an error.
  function getDayNumber(startDateStr) {
    var start = new Date(startDateStr + "T00:00:00");
    var now = new Date();
    var startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((nowMidnight.getTime() - startMidnight.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  }

  return {
    getDailyMission: getDailyMission,
    getForecast: getForecast,
    getNextAction: getNextAction,
    getDayNumber: getDayNumber
  };
})();

window.PD = window.PD || {};
window.PD.Services = window.PD.Services || {};

window.PD.Services.Analytics = (function () {
  function getSessionLogs() {
    if (window.PD.Services.StudySession && typeof window.PD.Services.StudySession.getLogs === "function") {
      return window.PD.Services.StudySession.getLogs() || [];
    }
    try {
      var raw = localStorage.getItem("projectDecember.sessionLogs.v1");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function getErrorLogs() {
    try {
      var raw = localStorage.getItem("projectDecember.errorNotebook.v1");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function getOverviewMetrics() {
    var chapters = window.PD.Store.getChapters() || [];
    var logs = getSessionLogs();

    // Total Study Hours from logs + chapter estimations
    var logHours = logs.reduce(function (sum, l) {
      return sum + (Number(l.durationMinutes) || 0) / 60;
    }, 0);

    // Also include completed resource estimates if no explicit session log
    var totalCompletedTasks = 0;
    var totalRevisions = 0;
    var completedChaptersCount = 0;

    chapters.forEach(function (c) {
      totalRevisions += (c.revisionCount || 0);
      var prog = window.PD.Services.Progress.compute(c);
      totalCompletedTasks += prog.completed;

      if (c.completed || (prog.total > 0 && prog.completed === prog.total)) {
        completedChaptersCount++;
      }
    });

    var totalStudyHours = Math.round((logHours + (completedChaptersCount * 1.5)) * 10) / 10;

    // Calculate Streaks from session dates
    var datesSet = {};
    logs.forEach(function (l) {
      if (l.date) datesSet[l.date] = true;
    });
    chapters.forEach(function (c) {
      if (c.lastStudied) datesSet[c.lastStudied] = true;
    });

    var sortedDates = Object.keys(datesSet).sort();
    var streakInfo = calculateStreaks(sortedDates);

    var planStartDate = new Date(window.PD.Store.getPlanStartDate());
    var today = new Date();
    var daysElapsed = Math.max(1, Math.ceil((today - planStartDate) / (1000 * 60 * 60 * 24)));
    var avgDailyHours = Math.round((totalStudyHours / daysElapsed) * 10) / 10;

    return {
      totalStudyHours: totalStudyHours,
      totalCompletedTasks: totalCompletedTasks,
      totalRevisions: totalRevisions,
      chaptersCompleted: completedChaptersCount,
      totalChapters: chapters.length,
      currentStreak: streakInfo.current,
      longestStreak: streakInfo.longest,
      avgDailyStudyHours: avgDailyHours
    };
  }

  function calculateStreaks(sortedDates) {
    if (sortedDates.length === 0) return { current: 0, longest: 0 };

    var longest = 0;
    var current = 0;
    var prevDate = null;

    var todayStr = new Date().toISOString().split("T")[0];
    var yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    sortedDates.forEach(function (dStr) {
      var d = new Date(dStr);
      if (!prevDate) {
        current = 1;
      } else {
        var diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          current++;
        } else if (diffDays > 1) {
          current = 1;
        }
      }
      if (current > longest) longest = current;
      prevDate = d;
    });

    // Check if streak is still active today or yesterday
    var lastDate = sortedDates[sortedDates.length - 1];
    if (lastDate !== todayStr && lastDate !== yesterdayStr) {
      current = 0;
    }

    return { current: current, longest: longest };
  }

  function getSubjectAnalytics() {
    var chapters = window.PD.Store.getChapters() || [];
    var logs = getSessionLogs();
    var subjects = ["Physics", "Chemistry", "Mathematics"];

    var res = {};
    subjects.forEach(function (sub) {
      var subChaps = chapters.filter(function (c) {
        return c.subject === sub || (sub === "Mathematics" && c.subject === "Maths");
      });

      var completed = 0;
      var totalConf = 0;
      var totalHealth = 0;
      var revCount = 0;

      subChaps.forEach(function (c) {
        var prog = window.PD.Services.Progress.compute(c);
        if (c.completed || (prog.total > 0 && prog.completed === prog.total)) completed++;

        totalConf += (c.confidence || 1);
        var healthObj = window.PD.Services.Health.compute(c);
        totalHealth += healthObj.score;
        revCount += (c.revisionCount || 0);
      });

      var subLogs = logs.filter(function (l) { return l.subject === sub; });
      var subHours = subLogs.reduce(function (sum, l) { return sum + (Number(l.durationMinutes) || 0) / 60; }, 0);

      var count = subChaps.length || 1;
      res[sub] = {
        subject: sub,
        totalChapters: count,
        completedChapters: completed,
        remainingChapters: count - completed,
        avgConfidence: Math.round((totalConf / count) * 10) / 10,
        avgHealth: Math.round(totalHealth / count),
        studyHours: Math.round(subHours * 10) / 10,
        revisionCount: revCount
      };
    });

    return res;
  }

  function getChartData() {
    var chapters = window.PD.Store.getChapters() || [];
    var logs = getSessionLogs();

    // 1. Daily Study Time (30 days)
    var dailyStudyTime = [];
    var now = new Date();
    for (var i = 29; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 86400000);
      var dateStr = d.toISOString().split("T")[0];
      var dayLabel = (d.getMonth() + 1) + "/" + d.getDate();

      var dayHours = logs.filter(function (l) { return l.date === dateStr; })
                         .reduce(function (sum, l) { return sum + (Number(l.durationMinutes) || 0) / 60; }, 0);

      dailyStudyTime.push({
        date: dateStr,
        label: dayLabel,
        hours: Math.round(dayHours * 10) / 10
      });
    }

    // 2. Weekly Study Hours (8 weeks)
    var weeklyStudyHours = [];
    for (var w = 7; w >= 0; w--) {
      var wStart = new Date(now.getTime() - (w * 7 + 6) * 86400000);
      var wEnd = new Date(now.getTime() - w * 7 * 86400000);
      var wLabel = "Wk " + (8 - w);

      var wHours = logs.filter(function (l) {
        if (!l.date) return false;
        var ld = new Date(l.date);
        return ld >= wStart && ld <= wEnd;
      }).reduce(function (sum, l) { return sum + (Number(l.durationMinutes) || 0) / 60; }, 0);

      weeklyStudyHours.push({
        weekLabel: wLabel,
        hours: Math.round(wHours * 10) / 10
      });
    }

    // 3. Subject Distribution
    var subStats = getSubjectAnalytics();
    var subjectDistribution = [
      { subject: "Physics", hours: subStats.Physics.studyHours || 2.5, color: "#3b82f6" },
      { subject: "Chemistry", hours: subStats.Chemistry.studyHours || 3.0, color: "#10b981" },
      { subject: "Mathematics", hours: subStats.Mathematics.studyHours || 2.0, color: "#8b5cf6" }
    ];

    // 4. Confidence Distribution
    var confCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    chapters.forEach(function (c) {
      var level = c.confidence || 1;
      confCounts[level] = (confCounts[level] || 0) + 1;
    });
    var confidenceDistribution = [1, 2, 3, 4, 5].map(function (lvl) {
      return { level: lvl, count: confCounts[lvl], label: "Level " + lvl };
    });

    // 5. Health Distribution
    var healthCounts = { strong: 0, medium: 0, weak: 0, unstarted: 0 };
    chapters.forEach(function (c) {
      var h = window.PD.Services.Health.compute(c);
      healthCounts[h.band] = (healthCounts[h.band] || 0) + 1;
    });
    var healthDistribution = [
      { band: "strong", label: "Healthy (70-100)", count: healthCounts.strong, color: "#10b981" },
      { band: "medium", label: "Moderate (40-69)", count: healthCounts.medium, color: "#f59e0b" },
      { band: "weak", label: "Weak (<40)", count: healthCounts.weak, color: "#ef4444" },
      { band: "unstarted", label: "Not Started", count: healthCounts.unstarted, color: "#6b7280" }
    ];

    // 6. Revision Frequency
    var revCounts = { "0": 0, "1-2": 0, "3-5": 0, "6+": 0 };
    chapters.forEach(function (c) {
      var rc = c.revisionCount || 0;
      if (rc === 0) revCounts["0"]++;
      else if (rc <= 2) revCounts["1-2"]++;
      else if (rc <= 5) revCounts["3-5"]++;
      else revCounts["6+"]++;
    });
    var revisionFrequency = [
      { range: "0 Revisions", count: revCounts["0"] },
      { range: "1-2 Revisions", count: revCounts["1-2"] },
      { range: "3-5 Revisions", count: revCounts["3-5"] },
      { range: "6+ Revisions", count: revCounts["6+"] }
    ];

    return {
      dailyStudyTime: dailyStudyTime,
      weeklyStudyHours: weeklyStudyHours,
      subjectDistribution: subjectDistribution,
      confidenceDistribution: confidenceDistribution,
      healthDistribution: healthDistribution,
      revisionFrequency: revisionFrequency
    };
  }

  function getHeatmapsData() {
    var chapters = window.PD.Store.getChapters() || [];
    var errors = getErrorLogs();

    // 1. Weak Chapters (< 50 health)
    var weakChapters = chapters.map(function (c) {
      var h = window.PD.Services.Health.compute(c);
      return { id: c.id, title: c.chapter, subject: c.subject, health: h.score, band: h.band };
    }).filter(function (c) { return c.health < 50; }).sort(function (a, b) { return a.health - b.health; });

    // 2. Overdue Revisions
    var overdueRevisions = chapters.map(function (c) {
      var rev = window.PD.Services.Revision.getStatus(c);
      return { id: c.id, title: c.chapter, subject: c.subject, status: rev.status, daysUntil: rev.daysUntil, label: rev.label };
    }).filter(function (c) { return c.status === "overdue"; }).sort(function (a, b) { return a.daysUntil - b.daysUntil; });

    // 3. Least Studied Topics
    var leastStudied = chapters.slice().sort(function (a, b) {
      var aProg = window.PD.Services.Progress.compute(a);
      var bProg = window.PD.Services.Progress.compute(b);
      return aProg.completed - bProg.completed || (a.confidence || 1) - (b.confidence || 1);
    }).slice(0, 12).map(function (c) {
      return { id: c.id, title: c.chapter, subject: c.subject, confidence: c.confidence || 1 };
    });

    // 4. Most Mistakes from Error Notebook
    var mistakeCounts = {};
    errors.forEach(function (e) {
      if (e.chapterId) {
        mistakeCounts[e.chapterId] = (mistakeCounts[e.chapterId] || 0) + 1;
      }
    });

    var mostMistakes = Object.keys(mistakeCounts).map(function (cId) {
      var chap = window.PD.Store.getChapter(cId);
      return {
        id: cId,
        title: chap ? chap.chapter : "Chapter",
        subject: chap ? chap.subject : "",
        errorCount: mistakeCounts[cId]
      };
    }).sort(function (a, b) { return b.errorCount - a.errorCount; }).slice(0, 10);

    return {
      weakChapters: weakChapters,
      overdueRevisions: overdueRevisions,
      leastStudied: leastStudied,
      mostMistakes: mostMistakes
    };
  }

  function getForecasting() {
    var chapters = window.PD.Store.getChapters() || [];
    var settings = window.PD.Store.getSettings() || {};
    var overview = getOverviewMetrics();

    var targetExamDateStr = settings.studyPreferences.targetExamDate || "2027-01-20";
    var targetDate = new Date(targetExamDateStr);
    var today = new Date();

    var daysRemainingToExam = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)));
    var weeksRemaining = daysRemainingToExam / 7;

    var remainingChapters = overview.totalChapters - overview.chaptersCompleted;

    // Velocity: chapters finished per week
    var planStartDate = new Date(window.PD.Store.getPlanStartDate());
    var weeksElapsed = Math.max(1, (today - planStartDate) / (1000 * 60 * 60 * 24 * 7));
    var velocity = Math.max(0.8, overview.chaptersCompleted / weeksElapsed);

    var weeksNeeded = remainingChapters / velocity;
    var expectedCompletionDate = new Date(today.getTime() + weeksNeeded * 7 * 86400000);

    var isBeforeExam = expectedCompletionDate < targetDate;
    var daysBuffer = Math.round((targetDate - expectedCompletionDate) / (1000 * 60 * 60 * 24));

    var weeklyWorkloadRequired = Math.round((remainingChapters * 2.5 / Math.max(1, weeksRemaining)) * 10) / 10;
    var revisionBacklog = chapters.filter(function (c) {
      return window.PD.Services.Revision.getStatus(c).status === "overdue";
    }).length;

    var confidenceIndicator = isBeforeExam ? "High Velocity (On Track)" : "Needs Acceleration";

    return {
      targetExamDate: targetExamDateStr,
      daysRemainingToExam: daysRemainingToExam,
      remainingChapters: remainingChapters,
      velocityChaptersPerWeek: Math.round(velocity * 10) / 10,
      expectedCompletionDate: expectedCompletionDate.toISOString().split("T")[0],
      isBeforeExam: isBeforeExam,
      daysBuffer: daysBuffer,
      weeklyWorkloadRequired: weeklyWorkloadRequired,
      revisionBacklog: revisionBacklog,
      futureStudyCapacityHoursPerWeek: settings.studyPreferences.weeklyGoalHours || 42,
      confidenceIndicator: confidenceIndicator
    };
  }

  function getDynamicInsights() {
    var chapters = window.PD.Store.getChapters() || [];
    var subStats = getSubjectAnalytics();
    var heatmaps = getHeatmapsData();
    var overview = getOverviewMetrics();

    // 1. Strongest & Weakest Subject
    var sortedSubs = Object.keys(subStats).map(function (k) { return subStats[k]; })
      .sort(function (a, b) { return b.avgHealth - a.avgHealth; });

    var strongestSub = sortedSubs[0];
    var weakestSub = sortedSubs[sortedSubs.length - 1];

    // 2. Neglected Chapters
    var neglected = chapters.filter(function (c) {
      return !c.completed && (c.confidence || 1) <= 2 && !c.lastStudied;
    }).slice(0, 3).map(function (c) { return c.chapter + " (" + c.subject + ")"; });

    // 3. Urgent Revisions
    var urgentRevs = heatmaps.overdueRevisions.slice(0, 3).map(function (c) {
      return c.title + " (" + c.subject + ")";
    });

    // 4. Consistency rating
    var consistency = overview.currentStreak >= 7 ? "🔥 Exceptional (" + overview.currentStreak + "-day streak)" :
                        overview.currentStreak >= 3 ? "⚡ Good (" + overview.currentStreak + "-day streak)" :
                        "⚠️ Needs regularity";

    // 5. Recommended Focus for Tomorrow
    var recommended = (window.PD.Services.Planner && typeof window.PD.Services.Planner.getDailyMission === "function")
      ? window.PD.Services.Planner.getDailyMission(chapters)
      : [];

    return {
      strongestSubject: strongestSub.subject + " (" + strongestSub.avgHealth + "% Avg Health)",
      weakestSubject: weakestSub.subject + " (" + weakestSub.avgHealth + "% Avg Health)",
      neglectedChapters: neglected.length > 0 ? neglected : ["None! All topics actively touched."],
      urgentRevisions: urgentRevs.length > 0 ? urgentRevs : ["No overdue revisions right now."],
      studyConsistency: consistency,
      recommendedFocusTomorrow: recommended.map(function (r) {
        return (r.chapter ? r.chapter.chapter : "Chapter") + " — " + (r.action ? r.action.label : "Study");
      })
    };
  }

  return {
    getOverviewMetrics: getOverviewMetrics,
    getSubjectAnalytics: getSubjectAnalytics,
    getChartData: getChartData,
    getHeatmapsData: getHeatmapsData,
    getForecasting: getForecasting,
    getDynamicInsights: getDynamicInsights
  };
})();

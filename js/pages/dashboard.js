window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

PD.Pages.Dashboard = (function () {
  function render(container) {
    var chapters = PD.Store.getChapters();
    var wrap = PD.Utils.createEl("div", { class: "page dashboard-page" });

    wrap.appendChild(PD.Utils.createEl("h1", { class: "page-title", text: "Good " + timeOfDay() + ", Avi" }));
    wrap.appendChild(PD.Utils.createEl("p", { class: "page-subtitle", text: PD.Utils.formatDate(new Date()) }));

    wrap.appendChild(buildExamCockpitBanner(chapters));

    // Weekly Study Consistency Chart
    var chartSection = PD.Utils.createEl("section", { class: "dash-section dash-chart-section" });
    var chartSlot = PD.Utils.createEl("div", { id: "dash-consistency-chart-slot" });
    chartSection.appendChild(chartSlot);
    wrap.appendChild(chartSection);

    setTimeout(function () {
      if (PD.Components && PD.Components.StudyConsistencyChart && typeof PD.Components.StudyConsistencyChart.render === "function") {
        PD.Components.StudyConsistencyChart.render(chartSlot);
      }
    }, 50);

    wrap.appendChild(buildMissionSection(chapters));
    wrap.appendChild(buildRevisionQueueSection(chapters));

    var secondaryRow = PD.Utils.createEl("div", { class: "dash-secondary-row" });
    secondaryRow.appendChild(buildWeakestSection(chapters));
    secondaryRow.appendChild(buildContinueSection(chapters));
    wrap.appendChild(secondaryRow);

    wrap.appendChild(buildProgressSection(chapters));
    wrap.appendChild(buildUpcomingSection(chapters));

    container.appendChild(wrap);
  }

  function timeOfDay() {
    var hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  }

  function buildExamCockpitBanner(chapters) {
    var banner = PD.Utils.createEl("div", { class: "exam-cockpit-banner" });

    // JEE countdown
    var jeeDays = getDaysUntil("2027-01-20");
    var cJEE = PD.Utils.createEl("div", { class: "cockpit-card" });
    cJEE.appendChild(PD.Utils.createEl("span", { class: "cockpit-label", text: "JEE Main" }));
    cJEE.appendChild(PD.Utils.createEl("span", { class: "cockpit-val", text: jeeDays + " Days" }));
    banner.appendChild(cJEE);

    // BITSAT countdown
    var bitsDays = getDaysUntil("2027-05-18");
    var cBITS = PD.Utils.createEl("div", { class: "cockpit-card" });
    cBITS.appendChild(PD.Utils.createEl("span", { class: "cockpit-label", text: "BITSAT" }));
    cBITS.appendChild(PD.Utils.createEl("span", { class: "cockpit-val", text: bitsDays + " Days" }));
    banner.appendChild(cBITS);

    // MHT-CET countdown (Exam Date: 15th Dec 2026)
    var cetDays = getDaysUntil("2026-12-15");
    var cCET = PD.Utils.createEl("div", { class: "cockpit-card cockpit-card-interactive" });
    cCET.appendChild(PD.Utils.createEl("span", { class: "cockpit-label", text: "MHT-CET (15 Dec)" }));
    cCET.appendChild(PD.Utils.createEl("span", { class: "cockpit-val emphasis", text: (cetDays > 0 ? cetDays : 0) + " Days" }));
    banner.appendChild(cCET);

    // Streak
    var streak = PD.Services.StudySession.getStreak();
    var cStreak = PD.Utils.createEl("div", { class: "cockpit-card" });
    cStreak.appendChild(PD.Utils.createEl("span", { class: "cockpit-label", text: "Study Streak" }));
    cStreak.appendChild(PD.Utils.createEl("span", { class: "cockpit-val emphasis", text: streak + " Days 🔥" }));
    banner.appendChild(cStreak);

    // Focus Score
    var focusScore = PD.Services.Focus ? PD.Services.Focus.getFocusScore() : 100;
    var cFocus = PD.Utils.createEl("div", { class: "cockpit-card cockpit-card-interactive" });
    cFocus.appendChild(PD.Utils.createEl("span", { class: "cockpit-label", text: "Focus Score" }));
    cFocus.appendChild(PD.Utils.createEl("span", { class: "cockpit-val emphasis", text: focusScore + "/100 ⚡" }));
    cFocus.style.cursor = "pointer";
    cFocus.addEventListener("click", function () {
      window.location.hash = "#/focus";
    });
    banner.appendChild(cFocus);

    // Completed syllabus chapters
    var completedCount = chapters.filter(function (c) { return c.completed; }).length;
    var cSyllabus = PD.Utils.createEl("div", { class: "cockpit-card" });
    cSyllabus.appendChild(PD.Utils.createEl("span", { class: "cockpit-label", text: "Syllabus Complete" }));
    cSyllabus.appendChild(PD.Utils.createEl("span", { class: "cockpit-val", text: completedCount + "/99 Chapters" }));
    banner.appendChild(cSyllabus);

    return banner;
  }

  function getDaysUntil(targetDateStr) {
    var target = new Date(targetDateStr + "T00:00:00");
    var today = new Date();
    today.setHours(0,0,0,0);
    var diffTime = target.getTime() - today.getTime();
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // --- Sections -------------------------------------------------------

  function buildMissionSection(chapters) {
    var mission = PD.Services.Dashboard.getMission(chapters);
    var section = PD.Utils.createEl("section", { class: "dash-section dash-mission" });
    
    var header = sectionHeader("Today's Mission (Starting 22nd July)", "July 22 Start");
    section.appendChild(header);

    if (mission.length === 0) {
      section.appendChild(emptyLine("Nothing urgent right now — every tracked chapter is in good shape."));
    } else {
      mission.forEach(function (item) {
        var row = buildChapterRow(item.chapter, item.reason);
        // Add quick start button
        var startBtn = PD.Utils.createEl("button", {
          class: "ws-chip active",
          style: "margin-left: auto; white-space: nowrap;",
          text: "⚡ Start 45m"
        });
        startBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          PD.Services.Focus.smartStart({
            chapterId: item.chapter.id,
            taskLabel: item.reason,
            durationMinutes: 45
          });
        });
        row.appendChild(startBtn);
        section.appendChild(row);
      });
    }
    return section;
  }

  function buildRevisionQueueSection(chapters) {
    var queue = PD.Services.Dashboard.getRevisionQueue(chapters);
    var section = PD.Utils.createEl("section", { class: "dash-section" });
    section.appendChild(sectionHeader("Revision Queue", null));

    var rows = []
      .concat(queue.overdue.map(function (item) {
        return { item: item, tag: { text: "Overdue", className: "overdue" } };
      }))
      .concat(queue.dueToday.map(function (item) {
        return { item: item, tag: { text: "Today", className: "today" } };
      }))
      .concat(queue.dueTomorrow.map(function (item) {
        return { item: item, tag: { text: "Tomorrow", className: "tomorrow" } };
      }));

    if (rows.length === 0) {
      section.appendChild(emptyLine("Nothing due today or tomorrow — log a revision in Tracker to start the clock on a chapter."));
    } else {
      rows.forEach(function (row) {
        section.appendChild(buildChapterRow(row.item.chapter, row.item.reason, row.tag));
      });
    }
    return section;
  }

  function buildWeakestSection(chapters) {
    var weakest = PD.Services.Dashboard.getWeakestChapters(chapters);
    var section = PD.Utils.createEl("section", { class: "dash-section" });
    section.appendChild(sectionHeader("Weakest Chapters", null));

    if (weakest.length === 0) {
      section.appendChild(emptyLine("No chapters tracked yet."));
    } else {
      weakest.forEach(function (item) {
        section.appendChild(buildChapterRow(item.chapter, item.reason));
      });
    }
    return section;
  }

  function buildContinueSection(chapters) {
    var continuing = PD.Services.Dashboard.getContinueStudying(chapters);
    var section = PD.Utils.createEl("section", { class: "dash-section" });
    section.appendChild(sectionHeader("Continue Studying", null));

    if (continuing.length === 0) {
      section.appendChild(emptyLine("Nothing in progress yet — chapters you study or revise show up here."));
    } else {
      continuing.forEach(function (item) {
        section.appendChild(buildChapterRow(item.chapter, item.reason));
      });
    }
    return section;
  }

  function buildProgressSection(chapters) {
    var progress = PD.Services.Dashboard.getOverallProgress(chapters);
    var section = PD.Utils.createEl("section", { class: "dash-section dash-progress" });
    section.appendChild(sectionHeader("Overall Progress", null));

    var bars = PD.Utils.createEl("div", { class: "progress-bars" });
    Object.keys(progress.bySubject).forEach(function (subject) {
      var s = progress.bySubject[subject];
      bars.appendChild(buildProgressRow(subject, s.completed, s.total));
    });
    section.appendChild(bars);

    var overall = progress.overall;
    var pct = overall.total ? Math.round((overall.completed / overall.total) * 100) : 0;
    section.appendChild(
      PD.Utils.createEl("p", {
        class: "progress-overall-line",
        text: overall.completed + " of " + overall.total + " chapters complete (" + pct + "%)"
      })
    );

    return section;
  }

  function buildUpcomingSection(chapters) {
    var upcoming = PD.Services.Dashboard.getUpcomingWork(chapters);
    var section = PD.Utils.createEl("section", { class: "dash-section dash-upcoming" });
    section.appendChild(sectionHeader("Upcoming", null));

    if (upcoming.length === 0) {
      section.appendChild(
        PD.Utils.createEl("p", {
          class: "dash-upcoming-line",
          text: "Nothing on the horizon yet — this fills in as revision dates get scheduled."
        })
      );
    } else {
      var text = upcoming
        .slice(0, 6)
        .map(function (item) {
          return item.chapter.chapter + " (" + item.reason.toLowerCase() + ")";
        })
        .join(", ");
      section.appendChild(PD.Utils.createEl("p", { class: "dash-upcoming-line", text: text }));
    }

    return section;
  }

  // --- Shared row/section builders ------------------------------------

  function sectionHeader(title, badge) {
    var header = PD.Utils.createEl("div", { class: "dash-section-header" });
    header.appendChild(PD.Utils.createEl("h2", { class: "dash-section-title", text: title }));
    if (badge) {
      header.appendChild(PD.Utils.createEl("span", { class: "dash-section-badge", text: badge }));
    }
    return header;
  }

  function emptyLine(text) {
    return PD.Utils.createEl("p", { class: "dash-empty-line", text: text });
  }

  function buildChapterRow(chapter, reason, tag) {
    var row = PD.Utils.createEl("button", { class: "dash-row", type: "button" });

    var main = PD.Utils.createEl("div", { class: "dash-row-main" });
    main.appendChild(PD.Utils.createEl("span", { class: "dash-row-subject", text: chapter.subject }));
    main.appendChild(PD.Utils.createEl("span", { class: "dash-row-title", text: chapter.chapter }));
    row.appendChild(main);

    var meta = PD.Utils.createEl("div", { class: "dash-row-meta" });
    if (tag) {
      meta.appendChild(
        PD.Utils.createEl("span", { class: "dash-row-tag dash-row-tag-" + tag.className, text: tag.text })
      );
    }
    meta.appendChild(PD.Utils.createEl("span", { class: "dash-row-reason", text: reason }));
    row.appendChild(meta);

    row.addEventListener("click", function () {
      PD.Router.focusChapter(chapter.id);
    });

    return row;
  }

  function buildProgressRow(subject, completed, total) {
    var row = PD.Utils.createEl("div", { class: "progress-row" });
    row.appendChild(PD.Utils.createEl("span", { class: "progress-label", text: subject }));

    var track = PD.Utils.createEl("div", { class: "progress-track" });
    var fill = PD.Utils.createEl("div", { class: "progress-fill" });
    var pct = total ? Math.round((completed / total) * 100) : 0;
    fill.style.width = pct + "%";
    track.appendChild(fill);
    row.appendChild(track);

    row.appendChild(PD.Utils.createEl("span", { class: "progress-count", text: completed + "/" + total }));
    return row;
  }

  return { render: render };
})();

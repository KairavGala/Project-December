window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

PD.Pages.Tracker = (function () {
  var SUBJECT_ORDER = ["Chemistry", "Physics", "Mathematics"];
  var ANIMATION_STAGGER_MS = 15;
  var ANIMATION_STAGGER_CAP_MS = 240;

  function render(container) {
    var chapters = PD.Store.getChapters();
    var wrap = PD.Utils.createEl("div", { class: "page tracker-page" });

    wrap.appendChild(PD.Utils.createEl("h1", { class: "page-title", text: "Tracker" }));
    var subtitle = PD.Utils.createEl("p", { class: "page-subtitle" });
    wrap.appendChild(subtitle);

    var savedFilters = PD.Store.getTrackerFilters();
    var toolbar = PD.Components.TrackerToolbar.create(
      Object.assign({ search: "" }, savedFilters),
      handleStateChange
    );
    wrap.appendChild(toolbar.el);

    var listEl = PD.Utils.createEl("div", { class: "card-list" });
    wrap.appendChild(listEl);

    var emptyState = buildEmptyState(function () {
      toolbar.setState({ search: "", subject: "All", status: "All" });
      applyFilters(toolbar.getState());
    });
    wrap.appendChild(emptyState.el);

    container.appendChild(wrap);

    // Every card is built exactly once. Filtering/sorting/searching only
    // ever shows, hides, or reorders these existing nodes afterward — never
    // recreates them — so instant search stays instant at any chapter count.
    var cardsById = {};
    chapters.forEach(function (chapter) {
      cardsById[chapter.id] = PD.Components.ChapterCard.create(chapter, function () {
        applyFilters(toolbar.getState());
      });
    });

    var previouslyVisible = {};
    var lastSignature = "";

    function handleStateChange(state) {
      PD.Store.setTrackerFilters({ subject: state.subject, status: state.status, sort: state.sort });
      applyFilters(state);
    }

    function applyFilters(state) {
      var currentChapters = PD.Store.getChapters();
      
      // Dynamic fallback to ensure cards exist for ALL chapters currently in store
      currentChapters.forEach(function (chapter) {
        if (!cardsById[chapter.id]) {
          cardsById[chapter.id] = PD.Components.ChapterCard.create(chapter, function () {
            applyFilters(toolbar.getState());
          });
        }
      });

      var result = computeVisible(currentChapters, state);

      var signatureParts = [result.mode];
      result.chapters.forEach(function (chapter) {
        signatureParts.push(chapter.id);
      });
      var currentSignature = signatureParts.join(",");

      subtitle.textContent = result.chapters.length + " of " + currentChapters.length + " chapters";

      if (currentSignature === lastSignature) {
        // No change in filtered list or order - skip redundant DOM updates
        return;
      }
      lastSignature = currentSignature;

      if (result.chapters.length === 0) {
        listEl.innerHTML = "";
        emptyState.show(state);
        previouslyVisible = {};
        return;
      }
      emptyState.hide();
      listEl.innerHTML = "";

      if (result.mode === "grouped") {
        SUBJECT_ORDER.forEach(function (subject) {
          var group = result.chapters.filter(function (c) {
            return c.subject === subject;
          });
          if (group.length === 0) return;
          listEl.appendChild(buildSubjectHeader(subject, group.length));
          group.forEach(function (chapter) {
            cardsById[chapter.id].el.classList.remove("show-subject-tag");
            listEl.appendChild(cardsById[chapter.id].el);
          });
        });
      } else {
        result.chapters.forEach(function (chapter) {
          cardsById[chapter.id].el.classList.add("show-subject-tag");
          listEl.appendChild(cardsById[chapter.id].el);
        });
      }

      animateNewlyVisible(result.chapters, cardsById, previouslyVisible);

      previouslyVisible = {};
      result.chapters.forEach(function (chapter) {
        previouslyVisible[chapter.id] = true;
      });
    }

    applyFilters(toolbar.getState());

    // A Dashboard row may have asked to land here on a specific chapter.
    // Override the view (not the saved filters - this shouldn't silently
    // overwrite a deliberate saved preference) so it's guaranteed visible,
    // even if a persisted subject/status filter would otherwise hide it.
    var pendingFocusId = PD.Router.consumePendingFocus();
    if (pendingFocusId && cardsById[pendingFocusId]) {
      toolbar.setState({ subject: "All", status: "All" });
      applyFilters(toolbar.getState());

      var target = cardsById[pendingFocusId].el;
      target.classList.add("is-expanded");
      target.classList.add("is-focused");
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setTimeout(function () {
        target.classList.remove("is-focused");
      }, 1300);
    }
  }

  function animateNewlyVisible(visibleChapters, cardsById, previouslyVisible) {
    var delay = 0;
    visibleChapters.forEach(function (chapter) {
      var el = cardsById[chapter.id].el;
      el.classList.remove("card-enter");
      if (!previouslyVisible[chapter.id]) {
        void el.offsetWidth; // force reflow so a repeated animation actually restarts
        el.style.animationDelay = Math.min(delay, ANIMATION_STAGGER_CAP_MS) + "ms";
        el.classList.add("card-enter");
        delay += ANIMATION_STAGGER_MS;
      }
    });
  }

  function buildSubjectHeader(subject, count) {
    var header = PD.Utils.createEl("div", { class: "subject-header" });
    header.appendChild(PD.Utils.createEl("h2", { class: "subject-name", text: subject }));
    header.appendChild(
      PD.Utils.createEl("span", { class: "subject-count", text: count + " chapter" + (count === 1 ? "" : "s") })
    );
    return header;
  }

  function computeVisible(chapters, state) {
    var query = (state.search || "").trim().toLowerCase();

    var filtered = chapters.filter(function (chapter) {
      if (state.subject !== "All" && chapter.subject !== state.subject) return false;
      if (query && chapter.chapter.toLowerCase().indexOf(query) === -1) return false;
      if (state.status !== "All" && !matchesStatus(chapter, state.status)) return false;
      return true;
    });

    if (state.sort === "subject") {
      return { mode: "grouped", chapters: filtered };
    }

    var sorted = filtered.slice();
    if (state.sort === "confidence") {
      sorted.sort(function (a, b) {
        return a.confidence - b.confidence; // weakest first — that's what needs attention
      });
    } else if (state.sort === "health") {
      sorted.sort(function (a, b) {
        return PD.Services.Health.compute(a).score - PD.Services.Health.compute(b).score;
      });
    } else if (state.sort === "recent") {
      sorted.sort(function (a, b) {
        var at = a.lastStudied ? new Date(a.lastStudied).getTime() : -Infinity;
        var bt = b.lastStudied ? new Date(b.lastStudied).getTime() : -Infinity;
        return bt - at; // most recently studied first
      });
    } else if (state.sort === "alpha") {
      sorted.sort(function (a, b) {
        return a.chapter.localeCompare(b.chapter);
      });
    }

    return { mode: "flat", chapters: sorted };
  }

  function matchesStatus(chapter, status) {
    if (status === "Completed") return !!chapter.completed;

    if (status === "Not Started") {
      return !chapter.completed && !(chapter.completedTasks > 0) && !chapter.lastStudied;
    }

    if (status === "In Progress") {
      return !chapter.completed && (chapter.completedTasks > 0 || !!chapter.lastStudied);
    }

    if (status === "Revision Due") {
      var revision = PD.Services.Revision.getStatus(chapter);
      return revision.status === "overdue" || revision.status === "due-soon";
    }

    return true;
  }

  function buildEmptyState(onClear) {
    var el = PD.Utils.createEl("div", { class: "tracker-empty-state is-hidden" });
    el.appendChild(PD.Utils.createEl("div", { class: "empty-icon", text: "◌" }));
    el.appendChild(PD.Utils.createEl("p", { class: "empty-title", text: "Nothing matches that." }));
    var reason = PD.Utils.createEl("p", { class: "empty-subtitle" });
    el.appendChild(reason);

    var clearBtn = PD.Utils.createEl("button", {
      class: "action-btn",
      type: "button",
      text: "Clear search & filters"
    });
    clearBtn.addEventListener("click", onClear);
    el.appendChild(clearBtn);

    function show(state) {
      reason.textContent = describeState(state);
      el.classList.remove("is-hidden");
    }

    function hide() {
      el.classList.add("is-hidden");
    }

    function describeState(state) {
      var parts = [];
      if (state.search) parts.push('search "' + state.search + '"');
      if (state.subject !== "All") parts.push(state.subject);
      if (state.status !== "All") parts.push(state.status.toLowerCase());
      if (parts.length === 0) return "Try a different combination.";
      return "No chapters match " + parts.join(" + ") + ".";
    }

    return { el: el, show: show, hide: hide };
  }

  return { render: render };
})();

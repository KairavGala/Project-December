window.PD = window.PD || {};
PD.Components = window.PD.Components || {};

PD.Components.ChapterCard = (function () {
  function create(chapter, onStateChange) {
    var expanded = false;
    var root = PD.Utils.createEl("article", { class: "chapter-card", "data-id": chapter.id });

    var header = buildHeader();
    var progress = buildProgressTrack();
    var healthTrack = buildHealthTrack();
    var bodyWrapper = PD.Utils.createEl("div", { class: "card-body-wrapper" });
    var body = buildBody(chapter, refreshDerived);

    bodyWrapper.appendChild(body.el);
    root.appendChild(header.el);
    root.appendChild(progress.el);
    root.appendChild(healthTrack.el);
    root.appendChild(bodyWrapper);

    header.toggleBtn.addEventListener("click", function () {
      expanded = !expanded;
      root.classList.toggle("is-expanded", expanded);
    });

    function refreshDerived(skipNotify) {
      header.update(chapter);
      progress.update(chapter);
      healthTrack.update(chapter);
      body.updateBreakdown(chapter);
      if (onStateChange && !skipNotify) {
        onStateChange();
      }
    }

    refreshDerived(true);

    root.update = function () {
      refreshDerived(true);
    };

    return {
      el: root,
      collapse: function () {
        expanded = false;
        root.classList.remove("is-expanded");
      }
    };
  }

  function buildHeader() {
    var el = PD.Utils.createEl("button", { class: "card-header", type: "button" });
    var chevron = PD.Utils.createEl("span", { class: "card-chevron", text: "›" });
    var title = PD.Utils.createEl("span", { class: "card-title" });
    var subjectTag = PD.Utils.createEl("span", { class: "card-subject-tag" });
    var stars = PD.Utils.createEl("span", { class: "card-stars" });
    var healthBadge = PD.Utils.createEl("span", { class: "health-badge" });
    var revisionBadge = PD.Utils.createEl("span", { class: "revision-badge" });

    el.appendChild(chevron);
    el.appendChild(title);
    el.appendChild(subjectTag);
    el.appendChild(stars);
    el.appendChild(healthBadge);
    el.appendChild(revisionBadge);

    function update(chapter) {
      title.textContent = chapter.chapter;
      subjectTag.textContent = chapter.subject;
      stars.textContent = starString(chapter.confidence);

      var health = PD.Services.Health.compute(chapter);
      healthBadge.textContent = "Health " + health.score;
      healthBadge.className = "health-badge health-" + health.band;

      var revision = PD.Services.Revision.getStatus(chapter);
      revisionBadge.textContent = revision.label;
      revisionBadge.className = "revision-badge revision-" + revision.status;
    }

    return { el: el, toggleBtn: el, update: update };
  }

  function buildProgressTrack() {
    var el = PD.Utils.createEl("div", { class: "card-progress-track" });
    var fill = PD.Utils.createEl("div", { class: "card-progress-fill" });
    el.appendChild(fill);

    function update(chapter) {
      var progress = PD.Services.Progress.compute(chapter);
      if (progress.total === 0) {
        el.classList.add("is-empty");
        fill.style.width = "0%";
      } else {
        el.classList.remove("is-empty");
        fill.style.width = Math.round((progress.completed / progress.total) * 100) + "%";
      }
    }

    return { el: el, update: update };
  }

  function getStudyStatus(chapter) {
    var progress = PD.Services.Progress.compute(chapter);
    var hasResources = (chapter.resources && chapter.resources.length > 0);
    var completionRatio = progress.total > 0 ? (progress.completed / progress.total) : 0;

    var anyStarted = false;
    if (hasResources) {
      anyStarted = chapter.resources.some(function (r) {
        return r.status === "in-progress" || r.status === "done";
      });
    } else {
      anyStarted = (chapter.completedTasks > 0);
    }

    if (chapter.confidence <= 1 && !anyStarted && !chapter.lastStudied && !chapter.completed) {
      return {
        status: "not-started",
        color: "grey",
        label: "Not Started",
        class: "study-not-started"
      };
    }

    if (chapter.completed || (chapter.confidence >= 4 && (!hasResources || completionRatio >= 0.75))) {
      return {
        status: "done-nicely",
        color: "green",
        label: "Done Nicely",
        class: "study-done-nicely"
      };
    }

    if (chapter.confidence >= 3 || completionRatio > 0 || anyStarted || chapter.lastStudied) {
      return {
        status: "somewhat-done",
        color: "yellow",
        label: "Somewhat Done",
        class: "study-somewhat-done"
      };
    }

    return {
      status: "not-done",
      color: "red",
      label: "Not Done",
      class: "study-not-done"
    };
  }

  function buildHealthTrack() {
    var el = PD.Utils.createEl("div", { class: "card-health-track" });
    var fill = PD.Utils.createEl("div", { class: "card-health-fill" });
    el.appendChild(fill);

    function update(chapter) {
      var health = PD.Services.Health.compute(chapter);
      var studyStatus = getStudyStatus(chapter);

      el.title = "Study Status: " + studyStatus.label + " (Health: " + health.score + "%)";

      if (studyStatus.status === "not-started") {
        el.classList.add("is-empty");
        fill.style.width = "0%";
        fill.className = "card-health-fill health-unstarted " + studyStatus.class;
      } else {
        el.classList.remove("is-empty");
        fill.style.width = health.score + "%";
        fill.className = "card-health-fill health-" + health.band + " " + studyStatus.class;
      }
    }

    return { el: el, update: update };
  }

  function buildBody(chapter, onDerivedChange) {
    var el = PD.Utils.createEl("div", { class: "card-body" });
    var breakdown = PD.Utils.createEl("p", { class: "health-breakdown" });

    el.appendChild(buildStarSelector(chapter, onDerivedChange));
    el.appendChild(buildHoursField(chapter));
    el.appendChild(buildResourcesField(chapter, onDerivedChange));
    el.appendChild(buildNotes(chapter));
    el.appendChild(buildActions(chapter, onDerivedChange));
    el.appendChild(breakdown);

    function updateBreakdown(chapter) {
      var health = PD.Services.Health.compute(chapter);
      var revision = PD.Services.Revision.getStatus(chapter);
      var studyStatus = getStudyStatus(chapter);
      breakdown.textContent =
        "Status: " + studyStatus.label + " | Health " + health.score + " — " + health.reasons.join(", ") + ". " + revision.label + ".";
    }

    updateBreakdown(chapter);
    return { el: el, updateBreakdown: updateBreakdown };
  }

  function buildStarSelector(chapter, onChange) {
    var wrap = PD.Utils.createEl("div", { class: "field confidence-field" });
    wrap.appendChild(PD.Utils.createEl("label", { class: "field-label", text: "Confidence" }));
    var row = PD.Utils.createEl("div", { class: "star-selector" });

    var buttons = [];
    for (var i = 1; i <= 5; i++) {
      buttons.push(makeStarButton(i));
    }

    function makeStarButton(value) {
      var btn = PD.Utils.createEl("button", {
        class: "star-btn",
        type: "button",
        "aria-label": value + " star"
      });
      btn.addEventListener("click", function () {
        PD.Store.updateChapter(chapter.id, { confidence: value });
        chapter.confidence = value;
        paint();
        onChange();
      });
      row.appendChild(btn);
      return btn;
    }

    function paint() {
      buttons.forEach(function (btn, idx) {
        var filled = idx + 1 <= chapter.confidence;
        btn.textContent = filled ? "★" : "☆";
        btn.classList.toggle("is-filled", filled);
      });
    }

    paint();
    wrap.appendChild(row);
    return wrap;
  }

  function buildHoursField(chapter) {
    var field = PD.Utils.createEl("div", { class: "field" });
    field.appendChild(PD.Utils.createEl("label", { class: "field-label", text: "Est. hours remaining" }));
    var input = PD.Utils.createEl("input", { type: "number", min: "0", step: "0.5", class: "hours-input" });
    input.value = chapter.estimatedHours === null || chapter.estimatedHours === undefined ? "" : chapter.estimatedHours;
    input.placeholder = "—";
    input.addEventListener("change", function () {
      var val = input.value === "" ? null : Number(input.value);
      PD.Store.updateChapter(chapter.id, { estimatedHours: val });
      chapter.estimatedHours = val;
    });
    field.appendChild(input);
    return field;
  }

  // Resources supersede the old manual "N done / M remaining" counter once
  // any exist (see js/services/progress.js) — this is now the only place
  // task-level progress is edited for a chapter.
  function buildResourcesField(chapter, onChange) {
    var field = PD.Utils.createEl("div", { class: "field resources-field" });
    field.appendChild(PD.Utils.createEl("label", { class: "field-label", text: "Resources" }));
    var resourceList = PD.Components.ResourceList.create(chapter, onChange);
    field.appendChild(resourceList.el);
    return field;
  }

  function buildNotes(chapter) {
    var wrap = PD.Utils.createEl("div", { class: "field notes-field" });
    wrap.appendChild(PD.Utils.createEl("label", { class: "field-label", text: "Notes" }));
    var textarea = PD.Utils.createEl("textarea", {
      class: "notes-input",
      rows: "3",
      placeholder: "Quick notes for this chapter..."
    });
    textarea.value = chapter.notes || "";

    var persist = PD.Utils.debounce(function () {
      chapter.notes = textarea.value;
      PD.Store.updateChapter(chapter.id, { notes: textarea.value });
    }, 400);

    textarea.addEventListener("input", persist);
    wrap.appendChild(textarea);
    return wrap;
  }

  function buildActions(chapter, onChange) {
    var row = PD.Utils.createEl("div", { class: "actions-row" });

    var completeLabel = PD.Utils.createEl("label", { class: "complete-toggle" });
    var checkbox = PD.Utils.createEl("input", { type: "checkbox" });
    checkbox.checked = !!chapter.completed;
    checkbox.addEventListener("change", function () {
      chapter.completed = checkbox.checked;
      PD.Store.updateChapter(chapter.id, { completed: checkbox.checked });
      onChange();
    });
    completeLabel.appendChild(checkbox);
    completeLabel.appendChild(PD.Utils.createEl("span", { text: "Mark complete" }));
    row.appendChild(completeLabel);

    var revisionBtn = PD.Utils.createEl("button", {
      class: "action-btn",
      type: "button",
      text: "Log revision today"
    });
    revisionBtn.addEventListener("click", function () {
      var patch = PD.Services.Revision.logRevision(chapter);
      Object.assign(chapter, patch);
      PD.Store.updateChapter(chapter.id, patch);
      onChange();
    });
    row.appendChild(revisionBtn);

    var studyBtn = PD.Utils.createEl("button", {
      class: "action-btn action-btn-quiet",
      type: "button",
      text: "Log study session"
    });
    studyBtn.addEventListener("click", function () {
      var patch = PD.Services.Revision.logStudySession();
      Object.assign(chapter, patch);
      PD.Store.updateChapter(chapter.id, patch);
      onChange();
    });
    row.appendChild(studyBtn);

    return row;
  }

  function starString(confidence) {
    return "★★★★★".slice(0, confidence) + "☆☆☆☆☆".slice(confidence);
  }

  return { create: create };
})();

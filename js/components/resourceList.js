window.PD = window.PD || {};
PD.Components = window.PD.Components || {};

// Adding a new standard resource type later means adding one entry to
// STANDARD_TYPES below — nothing else in this file branches on resource
// type. Rendering, status-cycling, and removal are all generic over
// {id, type, label, status}, whether the resource is a standard type or
// a custom one the user typed in.
PD.Components.ResourceList = (function () {
  var STATUS_ORDER = ["not-started", "in-progress", "done"];
  var STANDARD_TYPES = [
    { type: "coaching-theory", label: "Coaching Theory" },
    { type: "coaching-module", label: "Coaching Module" },
    { type: "dpps", label: "DPPs" },
    { type: "pyqs", label: "PYQs" },
    { type: "ncert", label: "NCERT" },
    { type: "formula-sheet", label: "Formula Sheet" },
    { type: "short-notes", label: "Short Notes" },
    { type: "revision-notes", label: "Revision Notes" },
    { type: "tests", label: "Tests/Assignments" }
  ];

  function create(chapter, onChange) {
    var root = PD.Utils.createEl("div", { class: "resource-list" });
    var itemsEl = PD.Utils.createEl("div", { class: "resource-items" });
    root.appendChild(itemsEl);

    var addUI = buildAddUI(chapter, handleChange);
    root.appendChild(addUI.el);

    // Paints the current resources with no side effects — safe to call
    // during construction, before the owning card has finished building.
    function renderItems() {
      itemsEl.innerHTML = "";
      (chapter.resources || []).forEach(function (resource) {
        itemsEl.appendChild(buildResourceRow(chapter, resource, handleChange));
      });
      addUI.refreshAvailableTypes();
    }

    // Used by every mutation (add/remove/cycle) *after* construction — the
    // owning card exists by then, so it's safe to notify it via onChange.
    function handleChange() {
      renderItems();
      onChange();
    }

    renderItems();
    return { el: root, refresh: handleChange };
  }

  function buildResourceRow(chapter, resource, refresh) {
    var row = PD.Utils.createEl("div", { class: "resource-row" });

    var statusDot = PD.Utils.createEl("button", {
      class: "resource-status-dot status-" + resource.status,
      type: "button",
      "aria-label": "Cycle status for " + resource.label + " (currently " + resource.status + ")"
    });
    statusDot.addEventListener("click", function () {
      var nextIndex = (STATUS_ORDER.indexOf(resource.status) + 1) % STATUS_ORDER.length;
      resource.status = STATUS_ORDER[nextIndex];
      persist(chapter);
      refresh();
    });

    var label = PD.Utils.createEl("span", { class: "resource-label", text: resource.label });

    var removeBtn = PD.Utils.createEl("button", {
      class: "resource-remove",
      type: "button",
      "aria-label": "Remove " + resource.label,
      text: "×"
    });
    removeBtn.addEventListener("click", function () {
      chapter.resources = chapter.resources.filter(function (r) {
        return r.id !== resource.id;
      });
      persist(chapter);
      refresh();
    });

    row.appendChild(statusDot);
    row.appendChild(label);
    row.appendChild(removeBtn);
    return row;
  }

  function buildAddUI(chapter, refresh) {
    var wrap = PD.Utils.createEl("div", { class: "resource-add" });
    var toggleBtn = PD.Utils.createEl("button", {
      class: "resource-add-toggle",
      type: "button",
      text: "+ Add resource"
    });
    var menu = PD.Utils.createEl("div", { class: "resource-add-menu is-hidden" });

    toggleBtn.addEventListener("click", function () {
      menu.classList.toggle("is-hidden");
    });

    var typeButtons = PD.Utils.createEl("div", { class: "resource-type-buttons" });

    var customInput = PD.Utils.createEl("input", {
      type: "text",
      class: "resource-custom-input",
      placeholder: "Custom resource name..."
    });
    var customAddBtn = PD.Utils.createEl("button", {
      class: "resource-custom-add",
      type: "button",
      text: "Add"
    });

    function addAndClose(type, label) {
      addResource(chapter, type, label);
      menu.classList.add("is-hidden");
      refresh();
    }

    customAddBtn.addEventListener("click", function () {
      var label = customInput.value.trim();
      if (!label) return;
      addAndClose("custom", label);
      customInput.value = "";
    });
    customInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        customAddBtn.click();
      }
    });

    var customRow = PD.Utils.createEl("div", { class: "resource-custom-row" });
    customRow.appendChild(customInput);
    customRow.appendChild(customAddBtn);

    menu.appendChild(typeButtons);
    menu.appendChild(customRow);
    wrap.appendChild(toggleBtn);
    wrap.appendChild(menu);

    function refreshAvailableTypes() {
      typeButtons.innerHTML = "";
      var existingTypes = (chapter.resources || []).map(function (r) {
        return r.type;
      });
      var available = STANDARD_TYPES.filter(function (t) {
        return existingTypes.indexOf(t.type) === -1;
      });

      if (available.length === 0) {
        typeButtons.appendChild(
          PD.Utils.createEl("p", { class: "resource-type-empty", text: "All standard resources added." })
        );
        return;
      }

      available.forEach(function (type) {
        var btn = PD.Utils.createEl("button", { class: "resource-type-btn", type: "button", text: type.label });
        btn.addEventListener("click", function () {
          addAndClose(type.type, type.label);
        });
        typeButtons.appendChild(btn);
      });
    }

    return { el: wrap, refreshAvailableTypes: refreshAvailableTypes };
  }

  function addResource(chapter, type, label) {
    chapter.resources = chapter.resources || [];
    chapter.resources.push({
      id: "res_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1000),
      type: type,
      label: label,
      status: "not-started",
      createdAt: new Date().toISOString()
    });
    persist(chapter);
  }

  // Interacting with a chapter's resources - adding one, removing one,
  // cycling its status - is real engagement with that chapter, so it
  // updates lastStudied the same way "Log study session" does. Without
  // this, marking two resources done in one sitting wouldn't count as
  // "recently studied" unless you separately remembered to log it too.
  function persist(chapter) {
    chapter.lastStudied = new Date().toISOString();
    PD.Store.updateChapter(chapter.id, { resources: chapter.resources, lastStudied: chapter.lastStudied });
  }

  return { create: create };
})();

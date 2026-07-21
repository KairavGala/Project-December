window.PD = window.PD || {};
PD.Components = window.PD.Components || {};

PD.Components.TrackerToolbar = (function () {
  var SUBJECTS = ["All", "Chemistry", "Physics", "Mathematics"];
  var STATUSES = ["All", "Completed", "In Progress", "Not Started", "Revision Due"];
  var SORTS = [
    { value: "subject", label: "Subject" },
    { value: "confidence", label: "Confidence" },
    { value: "health", label: "Health" },
    { value: "recent", label: "Recently studied" },
    { value: "alpha", label: "A–Z" }
  ];

  function create(initialState, onChange) {
    var state = Object.assign({ search: "", subject: "All", status: "All", sort: "subject" }, initialState);
    var root = PD.Utils.createEl("div", { class: "tracker-toolbar" });

    var search = buildSearch(state, function (value) {
      state.search = value;
      onChange(state);
    });
    root.appendChild(search.el);

    var filterRow = PD.Utils.createEl("div", { class: "filter-row" });
    var subjectGroup = buildChipGroup(toItems(SUBJECTS), state.subject, function (value) {
      state.subject = value;
      onChange(state);
    });
    var statusGroup = buildChipGroup(toItems(STATUSES), state.status, function (value) {
      state.status = value;
      onChange(state);
    });
    filterRow.appendChild(subjectGroup.el);
    filterRow.appendChild(statusGroup.el);
    root.appendChild(filterRow);

    var sortRow = PD.Utils.createEl("div", { class: "sort-row" });
    sortRow.appendChild(PD.Utils.createEl("span", { class: "sort-label", text: "Sort" }));
    var sortGroup = buildChipGroup(SORTS, state.sort, function (value) {
      state.sort = value;
      onChange(state);
    });
    sortRow.appendChild(sortGroup.el);
    root.appendChild(sortRow);

    function setState(patch) {
      Object.assign(state, patch);
      search.setValue(state.search);
      subjectGroup.setActive(state.subject);
      statusGroup.setActive(state.status);
      sortGroup.setActive(state.sort);
    }

    function getState() {
      return Object.assign({}, state);
    }

    return { el: root, setState: setState, getState: getState };
  }

  function buildSearch(state, onInput) {
    var wrap = PD.Utils.createEl("div", { class: "search-wrap" });
    var input = PD.Utils.createEl("input", {
      type: "text",
      class: "search-input",
      placeholder: "Search chapters...",
      "aria-label": "Search chapters"
    });
    input.value = state.search;

    var clearBtn = PD.Utils.createEl("button", {
      class: "search-clear",
      type: "button",
      "aria-label": "Clear search",
      text: "×"
    });
    clearBtn.classList.toggle("is-visible", state.search.length > 0);

    input.addEventListener("input", function () {
      clearBtn.classList.toggle("is-visible", input.value.length > 0);
      onInput(input.value);
    });
    clearBtn.addEventListener("click", function () {
      input.value = "";
      clearBtn.classList.remove("is-visible");
      input.focus();
      onInput("");
    });

    wrap.appendChild(input);
    wrap.appendChild(clearBtn);

    function setValue(value) {
      input.value = value;
      clearBtn.classList.toggle("is-visible", value.length > 0);
    }

    return { el: wrap, setValue: setValue, input: input };
  }

  // Shared by subject, status, and sort — one chip-group implementation
  // instead of three near-identical ones.
  function buildChipGroup(items, activeValue, onSelect) {
    var wrap = PD.Utils.createEl("div", { class: "chips" });
    var buttons = {};

    items.forEach(function (item) {
      var btn = PD.Utils.createEl("button", { class: "chip", type: "button", text: item.label });
      btn.classList.toggle("is-active", item.value === activeValue);
      btn.addEventListener("click", function () {
        setActive(item.value);
        onSelect(item.value);
      });
      buttons[item.value] = btn;
      wrap.appendChild(btn);
    });

    function setActive(value) {
      Object.keys(buttons).forEach(function (key) {
        buttons[key].classList.toggle("is-active", key === value);
      });
    }

    return { el: wrap, setActive: setActive };
  }

  function toItems(values) {
    return values.map(function (v) {
      return { value: v, label: v };
    });
  }

  return { create: create };
})();

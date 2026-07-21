window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

PD.Pages.ErrorNotebook = (function () {
  var activeFilters = { subject: "All", type: "All", status: "All", query: "", sort: "date-desc" };
  var expandedMistakeId = null;

  function render(container) {
    var wrap = PD.Utils.createEl("div", { class: "page error-notebook-page" });

    // Header Area
    var header = PD.Utils.createEl("div", { class: "page-header-row" });
    var titleArea = PD.Utils.createEl("div");
    titleArea.appendChild(PD.Utils.createEl("h1", { class: "page-title", text: "Error Notebook" }));
    titleArea.appendChild(PD.Utils.createEl("p", { class: "page-subtitle", text: "Log, analyze, and review academic mistakes to plug curriculum conceptual gaps." }));
    header.appendChild(titleArea);

    var btnArea = PD.Utils.createEl("div", { class: "header-actions" });
    var addBtn = PD.Utils.createEl("button", { class: "action-btn primary-btn", text: "✏️ Log Mistake" });
    addBtn.addEventListener("click", function () {
      var modal = document.querySelector(".log-mistake-modal-wrap");
      if (modal) {
        modal.classList.add("is-visible");
        // Populating chapters selection dropdown dynamically
        var select = modal.querySelector("#mistake-chapter-select");
        if (select) {
          select.innerHTML = '<option value="">-- Select Chapter --</option>';
          PD.Store.getChapters().forEach(function (c) {
            select.appendChild(PD.Utils.createEl("option", { value: c.chapter, text: "[" + c.subject + "] " + c.chapter }));
          });
        }
      }
    });
    btnArea.appendChild(addBtn);
    header.appendChild(btnArea);
    wrap.appendChild(header);

    // Filter toolbar
    wrap.appendChild(buildFilterToolbar(container));

    // Mistakes List container
    var listContainer = PD.Utils.createEl("div", { class: "mistakes-list" });
    renderMistakesList(listContainer);
    wrap.appendChild(listContainer);

    // Modal
    wrap.appendChild(buildLogMistakeModal(container));

    container.appendChild(wrap);
  }

  function buildFilterToolbar(container) {
    var toolbar = PD.Utils.createEl("div", { class: "notebook-toolbar" });

    // Search input
    var searchContainer = PD.Utils.createEl("div", { class: "toolbar-search" });
    var input = PD.Utils.createEl("input", {
      type: "text",
      placeholder: "Search chapter, topic, or reason...",
      value: activeFilters.query
    });
    input.addEventListener("input", function (e) {
      activeFilters.query = e.target.value.toLowerCase().trim();
      triggerFilterRefresh();
    });
    searchContainer.appendChild(input);
    toolbar.appendChild(searchContainer);

    // Subject Filter Dropdown
    var subContainer = PD.Utils.createEl("div", { class: "toolbar-select-group" });
    subContainer.appendChild(PD.Utils.createEl("span", { text: "Subject:" }));
    var subSelect = PD.Utils.createEl("select");
    ["All", "Chemistry", "Physics", "Mathematics"].forEach(function (opt) {
      subSelect.appendChild(PD.Utils.createEl("option", { value: opt, text: opt, selected: activeFilters.subject === opt }));
    });
    subSelect.addEventListener("change", function (e) {
      activeFilters.subject = e.target.value;
      triggerFilterRefresh();
    });
    subContainer.appendChild(subSelect);
    toolbar.appendChild(subContainer);

    // Type Filter Dropdown
    var typeContainer = PD.Utils.createEl("div", { class: "toolbar-select-group" });
    typeContainer.appendChild(PD.Utils.createEl("span", { text: "Type:" }));
    var typeSelect = PD.Utils.createEl("select");
    ["All", "Conceptual", "Calculation", "Silly Mistake", "Time Pressure", "Question Misread"].forEach(function (opt) {
      typeSelect.appendChild(PD.Utils.createEl("option", { value: opt, text: opt, selected: activeFilters.type === opt }));
    });
    typeSelect.addEventListener("change", function (e) {
      activeFilters.type = e.target.value;
      triggerFilterRefresh();
    });
    typeContainer.appendChild(typeSelect);
    toolbar.appendChild(typeContainer);

    // Status Filter Dropdown
    var statusContainer = PD.Utils.createEl("div", { class: "toolbar-select-group" });
    statusContainer.appendChild(PD.Utils.createEl("span", { text: "Status:" }));
    var statSelect = PD.Utils.createEl("select");
    ["All", "Needs Review", "Reviewed"].forEach(function (opt) {
      statSelect.appendChild(PD.Utils.createEl("option", { value: opt, text: opt, selected: activeFilters.status === opt }));
    });
    statSelect.addEventListener("change", function (e) {
      activeFilters.status = e.target.value;
      triggerFilterRefresh();
    });
    statusContainer.appendChild(statSelect);
    toolbar.appendChild(statusContainer);

    // Sort Dropdown
    var sortContainer = PD.Utils.createEl("div", { class: "toolbar-select-group" });
    sortContainer.appendChild(PD.Utils.createEl("span", { text: "Sort:" }));
    var sortSelect = PD.Utils.createEl("select");
    [
      { value: "date-desc", text: "Newest First" },
      { value: "date-asc", text: "Oldest First" },
      { value: "chapter", text: "Chapter Name" }
    ].forEach(function (opt) {
      sortSelect.appendChild(PD.Utils.createEl("option", { value: opt.value, text: opt.text, selected: activeFilters.sort === opt.value }));
    });
    sortSelect.addEventListener("change", function (e) {
      activeFilters.sort = e.target.value;
      triggerFilterRefresh();
    });
    sortContainer.appendChild(sortSelect);
    toolbar.appendChild(sortContainer);

    return toolbar;
  }

  function triggerFilterRefresh() {
    var list = document.querySelector(".mistakes-list");
    if (list) {
      list.innerHTML = "";
      renderMistakesList(list);
    }
  }

  function renderMistakesList(listContainer) {
    var rawList = PD.Services.ErrorNotebook.getMistakes();

    // Apply Filter & Search
    var filtered = rawList.filter(function (m) {
      if (activeFilters.subject !== "All" && m.subject !== activeFilters.subject) return false;
      if (activeFilters.type !== "All" && m.mistakeType !== activeFilters.type) return false;
      if (activeFilters.status !== "All" && m.reviewStatus !== activeFilters.status) return false;

      if (activeFilters.query) {
        var q = activeFilters.query;
        var chap = (m.chapter || "").toLowerCase();
        var top = (m.topic || "").toLowerCase();
        var reas = (m.reason || "").toLowerCase();
        if (chap.indexOf(q) === -1 && top.indexOf(q) === -1 && reas.indexOf(q) === -1) {
          return false;
        }
      }
      return true;
    });

    // Apply Sorting
    filtered.sort(function (a, b) {
      if (activeFilters.sort === "date-desc") return new Date(b.reviewDate) - new Date(a.reviewDate);
      if (activeFilters.sort === "date-asc") return new Date(a.reviewDate) - new Date(b.reviewDate);
      if (activeFilters.sort === "chapter") return (a.chapter || "").localeCompare(b.chapter || "");
      return 0;
    });

    if (filtered.length === 0) {
      var empty = PD.Utils.createEl("div", { class: "notebook-empty-card" });
      empty.appendChild(PD.Utils.createEl("p", { text: "No mistakes match your active filters. Log your first mistake above!" }));
      listContainer.appendChild(empty);
      return;
    }

    filtered.forEach(function (m) {
      listContainer.appendChild(buildMistakeRow(m, listContainer));
    });
  }

  function buildMistakeRow(m, listContainer) {
    var row = PD.Utils.createEl("div", { class: "mistake-row-card", "data-id": m.id });
    if (m.id === expandedMistakeId) row.classList.add("is-expanded");

    // Header segment
    var summary = PD.Utils.createEl("div", { class: "mistake-card-summary" });
    
    var subBadge = PD.Utils.createEl("span", { class: "mistake-sub-badge subject-" + m.subject.toLowerCase(), text: m.subject });
    summary.appendChild(subBadge);

    var mainInfo = PD.Utils.createEl("div", { class: "mistake-main-info" });
    var title = PD.Utils.createEl("h4", { class: "mistake-title", text: m.chapter + " • " + m.topic });
    var meta = PD.Utils.createEl("div", { class: "mistake-meta" });
    meta.appendChild(PD.Utils.createEl("span", { class: "type-tag", text: m.mistakeType }));
    meta.appendChild(PD.Utils.createEl("span", { text: " • Logged: " + m.reviewDate }));
    mainInfo.appendChild(title);
    mainInfo.appendChild(meta);
    summary.appendChild(mainInfo);

    // Status Area
    var statusWrap = PD.Utils.createEl("div", { class: "mistake-card-status" });
    var statusBtn = PD.Utils.createEl("button", {
      class: "status-toggle-btn " + (m.reviewStatus === "Reviewed" ? "reviewed" : "needs-review"),
      text: m.reviewStatus === "Reviewed" ? "Reviewed" : "Needs Review"
    });
    statusBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var nextStatus = m.reviewStatus === "Reviewed" ? "Needs Review" : "Reviewed";
      PD.Services.ErrorNotebook.updateMistake(m.id, { reviewStatus: nextStatus });
      statusBtn.textContent = nextStatus;
      statusBtn.className = "status-toggle-btn " + (nextStatus === "Reviewed" ? "reviewed" : "needs-review");
    });
    statusWrap.appendChild(statusBtn);

    // Delete Button
    var delBtn = PD.Utils.createEl("button", { class: "mistake-delete-btn", text: "🗑" });
    delBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this logged mistake?")) {
        PD.Services.ErrorNotebook.deleteMistake(m.id);
        triggerFilterRefresh();
      }
    });
    statusWrap.appendChild(delBtn);

    summary.appendChild(statusWrap);
    row.appendChild(summary);

    // Details Drawer
    var details = PD.Utils.createEl("div", { class: "mistake-card-details" });
    
    // Reason Block
    var reasonBlock = PD.Utils.createEl("div", { class: "detail-section" });
    reasonBlock.appendChild(PD.Utils.createEl("h5", { text: "What went wrong / Description:" }));
    reasonBlock.appendChild(PD.Utils.createEl("p", { text: m.reason || "No description provided." }));
    details.appendChild(reasonBlock);

    // Correct Method Block
    var correctBlock = PD.Utils.createEl("div", { class: "detail-section" });
    correctBlock.appendChild(PD.Utils.createEl("h5", { text: "Correct Method & Concept:" }));
    correctBlock.appendChild(PD.Utils.createEl("p", { text: m.correctMethod || "No description provided." }));
    details.appendChild(correctBlock);

    // Personal Notes
    if (m.personalNotes) {
      var noteBlock = PD.Utils.createEl("div", { class: "detail-section" });
      noteBlock.appendChild(PD.Utils.createEl("h5", { text: "Personal Key Takeaways:" }));
      noteBlock.appendChild(PD.Utils.createEl("p", { text: m.personalNotes }));
      details.appendChild(noteBlock);
    }

    row.appendChild(details);

    // Clicking summary expands/collapses the mistake card
    summary.addEventListener("click", function () {
      if (expandedMistakeId === m.id) {
        expandedMistakeId = null;
        row.classList.remove("is-expanded");
      } else {
        var prev = listContainer.querySelector('.mistake-row-card.is-expanded');
        if (prev) prev.classList.remove("is-expanded");
        expandedMistakeId = m.id;
        row.classList.add("is-expanded");
      }
    });

    return row;
  }

  function buildLogMistakeModal(container) {
    var wrap = PD.Utils.createEl("div", { class: "log-mistake-modal-wrap" });

    var content = PD.Utils.createEl("div", { class: "modal-content-card" });
    content.appendChild(PD.Utils.createEl("h3", { text: "Log Study Mistake" }));

    // Subject
    content.appendChild(PD.Utils.createEl("label", { text: "Subject" }));
    var subSelect = PD.Utils.createEl("select", { id: "mistake-subject-select" });
    ["Chemistry", "Physics", "Mathematics"].forEach(function (sub) {
      subSelect.appendChild(PD.Utils.createEl("option", { value: sub, text: sub }));
    });
    content.appendChild(subSelect);

    // Chapter
    content.appendChild(PD.Utils.createEl("label", { text: "Chapter Name" }));
    var chapSelect = PD.Utils.createEl("select", { id: "mistake-chapter-select" });
    content.appendChild(chapSelect);

    // Topic string
    content.appendChild(PD.Utils.createEl("label", { text: "Specific Topic / Question Ref" }));
    var topicInput = PD.Utils.createEl("input", { type: "text", id: "mistake-topic-input", placeholder: "e.g., Problem 24, integration by parts" });
    content.appendChild(topicInput);

    // Mistake Type
    content.appendChild(PD.Utils.createEl("label", { text: "Mistake Classification" }));
    var typeSelect = PD.Utils.createEl("select", { id: "mistake-type-select" });
    ["Conceptual", "Calculation", "Silly Mistake", "Time Pressure", "Question Misread"].forEach(function (type) {
      typeSelect.appendChild(PD.Utils.createEl("option", { value: type, text: type }));
    });
    content.appendChild(typeSelect);

    // Reason Textarea
    content.appendChild(PD.Utils.createEl("label", { text: "Describe your mistake (What did you do?):" }));
    var reasonTxt = PD.Utils.createEl("textarea", { id: "mistake-reason-txt", placeholder: "Explain what triggered the error..." });
    content.appendChild(reasonTxt);

    // Correct Method Textarea
    content.appendChild(PD.Utils.createEl("label", { text: "Describe correct method or conceptual gap solution:" }));
    var correctTxt = PD.Utils.createEl("textarea", { id: "mistake-correct-txt", placeholder: "Explain the proper mathematical or physical derivation..." });
    content.appendChild(correctTxt);

    // Personal Notes Textarea
    content.appendChild(PD.Utils.createEl("label", { text: "Personal Key takeaways (Optional):" }));
    var personalTxt = PD.Utils.createEl("textarea", { id: "mistake-personal-txt", placeholder: "Any memory tags to avoid doing this again..." });
    content.appendChild(personalTxt);

    // Button row
    var btnRow = PD.Utils.createEl("div", { class: "modal-button-row" });
    var cancelBtn = PD.Utils.createEl("button", { class: "cancel-btn", text: "Cancel" });
    cancelBtn.addEventListener("click", function () {
      wrap.classList.remove("is-visible");
    });
    btnRow.appendChild(cancelBtn);

    var saveBtn = PD.Utils.createEl("button", { class: "save-btn", text: "Log Mistake" });
    saveBtn.addEventListener("click", function () {
      var subject = subSelect.value;
      var chapter = chapSelect.value;
      var topic = topicInput.value.trim();
      var mistakeType = typeSelect.value;
      var reason = reasonTxt.value.trim();
      var correctMethod = correctTxt.value.trim();
      var personalNotes = personalTxt.value.trim();

      if (!chapter) {
        alert("Please select a valid chapter!");
        return;
      }
      if (!topic) {
        topic = "General";
      }

      PD.Services.ErrorNotebook.addMistake({
        subject: subject,
        chapter: chapter,
        topic: topic,
        mistakeType: mistakeType,
        reason: reason,
        correctMethod: correctMethod,
        personalNotes: personalNotes
      });

      wrap.classList.remove("is-visible");
      
      // Reset fields
      topicInput.value = "";
      reasonTxt.value = "";
      correctTxt.value = "";
      personalTxt.value = "";

      triggerFilterRefresh();
    });
    btnRow.appendChild(saveBtn);
    content.appendChild(btnRow);

    wrap.appendChild(content);
    return wrap;
  }

  return { render: render };
})();

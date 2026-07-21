window.PD = window.PD || {};
PD.Pages = window.PD.Pages || {};

PD.Pages.WeeklyPlanner = (function () {
  var selectedDayForAdd = null;

  function render(container) {
    var planState = PD.Services.WeeklyPlanner.getWeeklyPlan();
    var wrap = PD.Utils.createEl("div", { class: "page weekly-planner-page" });

    // Header Area
    var header = PD.Utils.createEl("div", { class: "page-header-row" });
    var titleArea = PD.Utils.createEl("div");
    titleArea.appendChild(PD.Utils.createEl("h1", { class: "page-title", text: "Weekly Planner" }));
    titleArea.appendChild(PD.Utils.createEl("p", { class: "page-subtitle", text: "Week starting: " + PD.Utils.formatDate(new Date(planState.weekStartDate + "T00:00:00")) }));
    header.appendChild(titleArea);

    // Carry forward button
    var actionArea = PD.Utils.createEl("div", { class: "header-actions" });
    var carryBtn = PD.Utils.createEl("button", { class: "action-btn carry-btn", text: "🔄 Carry Forward" });
    carryBtn.addEventListener("click", function () {
      PD.Services.WeeklyPlanner.carryForwardUnfinishedTasks();
      alert("Unfinished tasks from past days carried forward to today!");
      render(container);
    });
    actionArea.appendChild(carryBtn);
    header.appendChild(actionArea);
    wrap.appendChild(header);

    // Grid Container
    var grid = PD.Utils.createEl("div", { class: "weekly-planner-grid" });

    PD.Services.WeeklyPlanner.DAYS_LIST.forEach(function (dayName) {
      grid.appendChild(buildDayCard(dayName, planState.days[dayName], container));
    });

    wrap.appendChild(grid);

    // Add Task Dialog/Form Modal
    wrap.appendChild(buildAddTaskModal(container));

    container.appendChild(wrap);
  }

  function buildDayCard(dayName, dayData, container) {
    var card = PD.Utils.createEl("div", { class: "day-card" });
    
    // Day Header
    var header = PD.Utils.createEl("div", { class: "day-header" });
    var dayTitle = PD.Utils.createEl("div", { class: "day-title-row" });
    dayTitle.appendChild(PD.Utils.createEl("h3", { class: "day-name", text: dayName }));
    dayTitle.appendChild(PD.Utils.createEl("span", { class: "day-date", text: dayData ? dayData.date : "" }));
    header.appendChild(dayTitle);

    // Day stats
    var tasks = dayData ? dayData.tasks : [];
    var totalMin = tasks.reduce(function (acc, t) { return acc + (t.completed ? 0 : t.duration || 0); }, 0);
    var hrs = Math.round((totalMin / 60) * 10) / 10;
    
    var statsRow = PD.Utils.createEl("div", { class: "day-stats" });
    statsRow.appendChild(PD.Utils.createEl("span", { text: tasks.length + " tasks" }));
    
    var timeBadge = PD.Utils.createEl("span", { class: "time-badge", text: hrs + " hrs left" });
    if (hrs > 4.5) {
      timeBadge.classList.add("overload");
      timeBadge.title = "Prevent Overload! High daily workload detected.";
    }
    statsRow.appendChild(timeBadge);
    header.appendChild(statsRow);
    card.appendChild(header);

    // Task List
    var list = PD.Utils.createEl("div", { class: "day-tasks-list" });
    if (tasks.length === 0) {
      list.appendChild(PD.Utils.createEl("p", { class: "empty-day-text", text: "No study tasks scheduled" }));
    } else {
      tasks.forEach(function (task) {
        list.appendChild(buildTaskElement(dayName, task, container));
      });
    }
    card.appendChild(list);

    // Add Custom Task Button
    var addBtn = PD.Utils.createEl("button", { class: "add-task-btn", text: "+ Add Task" });
    addBtn.addEventListener("click", function () {
      selectedDayForAdd = dayName;
      var modal = document.querySelector(".add-task-modal-wrap");
      if (modal) {
        modal.classList.add("is-visible");
        // Populating chapters selection dropdown dynamically
        var select = modal.querySelector("#task-chapter-select");
        if (select) {
          select.innerHTML = '<option value="">-- Optional Chapter --</option>';
          PD.Store.getChapters().forEach(function (c) {
            select.appendChild(PD.Utils.createEl("option", { value: c.id, text: "[" + c.subject + "] " + c.chapter }));
          });
        }
      }
    });
    card.appendChild(addBtn);

    return card;
  }

  function buildTaskElement(dayName, task, container) {
    var item = PD.Utils.createEl("div", { class: "weekly-task-item" });
    if (task.completed) item.classList.add("completed");
    if (task.skipped) item.classList.add("skipped");
    if (task.postponed) item.classList.add("postponed");

    var checkbox = PD.Utils.createEl("button", { class: "task-check-btn" });
    if (task.completed) checkbox.innerHTML = "✓";
    checkbox.addEventListener("click", function () {
      PD.Services.WeeklyPlanner.updateTaskInDay(dayName, task.id, { completed: !task.completed });
      render(container);
    });
    item.appendChild(checkbox);

    // Content
    var content = PD.Utils.createEl("div", { class: "task-item-content" });
    var title = PD.Utils.createEl("div", { class: "task-item-title", text: task.label });
    var sub = PD.Utils.createEl("div", { class: "task-item-sub", text: task.subject + " • " + task.duration + "m" });
    content.appendChild(title);
    content.appendChild(sub);
    item.appendChild(content);

    // Actions
    var actions = PD.Utils.createEl("div", { class: "task-item-actions" });
    
    var delBtn = PD.Utils.createEl("button", { class: "task-delete-btn", text: "×" });
    delBtn.title = "Remove task";
    delBtn.addEventListener("click", function () {
      PD.Services.WeeklyPlanner.removeTaskFromDay(dayName, task.id);
      render(container);
    });
    actions.appendChild(delBtn);

    item.appendChild(actions);
    return item;
  }

  function buildAddTaskModal(container) {
    var wrap = PD.Utils.createEl("div", { class: "add-task-modal-wrap" });

    var content = PD.Utils.createEl("div", { class: "modal-content-card" });
    content.appendChild(PD.Utils.createEl("h3", { text: "Add Custom Task" }));

    // Label Input
    content.appendChild(PD.Utils.createEl("label", { text: "Task Description" }));
    var labelInput = PD.Utils.createEl("input", { type: "text", id: "task-label-input", placeholder: "e.g., Complete 30 MCQs in kinematics" });
    content.appendChild(labelInput);

    // Subject selection
    content.appendChild(PD.Utils.createEl("label", { text: "Subject" }));
    var subjSelect = PD.Utils.createEl("select", { id: "task-subject-select" });
    subjSelect.appendChild(PD.Utils.createEl("option", { value: "Chemistry", text: "Chemistry" }));
    subjSelect.appendChild(PD.Utils.createEl("option", { value: "Physics", text: "Physics" }));
    subjSelect.appendChild(PD.Utils.createEl("option", { value: "Mathematics", text: "Mathematics" }));
    content.appendChild(subjSelect);

    // Chapter selection
    content.appendChild(PD.Utils.createEl("label", { text: "Related Chapter (Optional)" }));
    var chapSelect = PD.Utils.createEl("select", { id: "task-chapter-select" });
    content.appendChild(chapSelect);

    // Duration Input
    content.appendChild(PD.Utils.createEl("label", { text: "Estimated Duration (minutes)" }));
    var durInput = PD.Utils.createEl("input", { type: "number", id: "task-duration-input", value: "60", min: "10" });
    content.appendChild(durInput);

    // Button Row
    var row = PD.Utils.createEl("div", { class: "modal-button-row" });
    var cancelBtn = PD.Utils.createEl("button", { class: "cancel-btn", text: "Cancel" });
    cancelBtn.addEventListener("click", function () {
      wrap.classList.remove("is-visible");
    });
    row.appendChild(cancelBtn);

    var saveBtn = PD.Utils.createEl("button", { class: "save-btn", text: "Save Task" });
    saveBtn.addEventListener("click", function () {
      var label = labelInput.value.trim();
      if (!label) {
        alert("Please enter a task description!");
        return;
      }
      var subject = subjSelect.value;
      var chapId = chapSelect.value;
      var duration = parseInt(durInput.value, 10) || 60;

      var chapter = chapId ? PD.Store.getChapter(chapId) : null;

      PD.Services.WeeklyPlanner.addTaskToDay(selectedDayForAdd, {
        chapterId: chapId || null,
        subject: subject,
        chapterTitle: chapter ? chapter.chapter : "",
        type: "custom",
        label: label,
        duration: duration
      });

      wrap.classList.remove("is-visible");
      // Reset inputs
      labelInput.value = "";
      durInput.value = "60";
      render(container);
    });
    row.appendChild(saveBtn);
    content.appendChild(row);

    wrap.appendChild(content);
    return wrap;
  }

  return { render: render };
})();

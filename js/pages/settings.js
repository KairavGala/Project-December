window.PD = window.PD || {};
window.PD.Pages = window.PD.Pages || {};

window.PD.Pages.Settings = (function () {
  function render(container) {
    container.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.className = "page settings-page";

    var settings = window.PD.Store.getSettings();

    // 1. Header
    var header = document.createElement("div");
    header.className = "settings-header";
    header.innerHTML = `
      <div>
        <h1><span>⚙️</span> <span>Application Settings & Data Control</span></h1>
        <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">Customize study goals, appearance, revision algorithms & backup/restore data</p>
      </div>
    `;
    wrap.appendChild(header);

    // 2. Appearance Card
    wrap.appendChild(buildAppearanceCard(settings));

    // 3. Study Preferences Card
    wrap.appendChild(buildStudyPreferencesCard(settings));

    // 4. Revision Preferences Card
    wrap.appendChild(buildRevisionPreferencesCard(settings));

    // 5. Offline Notifications Card
    wrap.appendChild(buildNotificationsCard(settings));

    // 6. Data Management & Reset Card
    wrap.appendChild(buildDataManagementCard());

    container.appendChild(wrap);
  }

  function buildAppearanceCard(settings) {
    var card = document.createElement("div");
    card.className = "settings-card";

    card.innerHTML = `
      <div class="settings-card-title"><span>🎨</span> <span>Appearance & Visual Theme</span></div>
      <div class="settings-form-grid">
        <div class="settings-field">
          <label class="settings-label">Color Theme</label>
          <select class="settings-select theme-select">
            <option value="dark" ${settings.appearance.theme === "dark" ? "selected" : ""}>Dark Mode ☾</option>
            <option value="light" ${settings.appearance.theme === "light" ? "selected" : ""}>Light Mode ☀</option>
            <option value="system" ${settings.appearance.theme === "system" ? "selected" : ""}>System Preference</option>
          </select>
        </div>

        <div class="settings-field">
          <label class="settings-label">Accent Color</label>
          <div class="accent-color-options">
            <button class="color-swatch ${settings.appearance.accentColor === "#3b82f6" ? "is-selected" : ""}" data-color="#3b82f6" style="background:#3b82f6;" type="button" title="Blue"></button>
            <button class="color-swatch ${settings.appearance.accentColor === "#10b981" ? "is-selected" : ""}" data-color="#10b981" style="background:#10b981;" type="button" title="Emerald"></button>
            <button class="color-swatch ${settings.appearance.accentColor === "#8b5cf6" ? "is-selected" : ""}" data-color="#8b5cf6" style="background:#8b5cf6;" type="button" title="Purple"></button>
            <button class="color-swatch ${settings.appearance.accentColor === "#f59e0b" ? "is-selected" : ""}" data-color="#f59e0b" style="background:#f59e0b;" type="button" title="Amber"></button>
            <button class="color-swatch ${settings.appearance.accentColor === "#ef4444" ? "is-selected" : ""}" data-color="#ef4444" style="background:#ef4444;" type="button" title="Crimson"></button>
          </div>
        </div>

        <div class="settings-field">
          <label class="settings-label">Font Scale</label>
          <select class="settings-select font-scale-select">
            <option value="0.9" ${settings.appearance.fontScale === 0.9 ? "selected" : ""}>Compact (90%)</option>
            <option value="1.0" ${settings.appearance.fontScale === 1.0 ? "selected" : ""}>Standard (100%)</option>
            <option value="1.1" ${settings.appearance.fontScale === 1.1 ? "selected" : ""}>Comfortable (110%)</option>
            <option value="1.2" ${settings.appearance.fontScale === 1.2 ? "selected" : ""}>Large (120%)</option>
          </select>
        </div>
      </div>
    `;

    card.querySelector(".theme-select").addEventListener("change", function (e) {
      var val = e.target.value;
      document.documentElement.setAttribute("data-theme", val);
      window.PD.Store.setTheme(val);
      window.PD.Store.updateSettings({ appearance: Object.assign({}, settings.appearance, { theme: val }) });
    });

    card.querySelectorAll(".color-swatch").forEach(function (btn) {
      btn.addEventListener("click", function () {
        card.querySelectorAll(".color-swatch").forEach(function (s) { s.classList.remove("is-selected"); });
        btn.classList.add("is-selected");
        var col = btn.getAttribute("data-color");
        document.documentElement.style.setProperty("--accent-primary", col);
        window.PD.Store.updateSettings({ appearance: Object.assign({}, settings.appearance, { accentColor: col }) });
      });
    });

    card.querySelector(".font-scale-select").addEventListener("change", function (e) {
      var scale = parseFloat(e.target.value);
      document.documentElement.style.fontSize = (scale * 100) + "%";
      window.PD.Store.updateSettings({ appearance: Object.assign({}, settings.appearance, { fontScale: scale }) });
    });

    return card;
  }

  function buildStudyPreferencesCard(settings) {
    var card = document.createElement("div");
    card.className = "settings-card";

    card.innerHTML = `
      <div class="settings-card-title"><span>🎯</span> <span>Study Target Preferences</span></div>
      <div class="settings-form-grid">
        <div class="settings-field">
          <label class="settings-label">Daily Study Target (Hours)</label>
          <input type="number" class="settings-input daily-target-input" min="1" max="16" value="${settings.studyPreferences.dailyStudyTargetHours}" />
        </div>

        <div class="settings-field">
          <label class="settings-label">Weekly Goal (Hours)</label>
          <input type="number" class="settings-input weekly-goal-input" min="7" max="100" value="${settings.studyPreferences.weeklyGoalHours}" />
        </div>

        <div class="settings-field">
          <label class="settings-label">Daily Planner Task Capacity</label>
          <input type="number" class="settings-input planner-capacity-input" min="1" max="12" value="${settings.studyPreferences.plannerCapacityTasksPerDay}" />
        </div>

        <div class="settings-field">
          <label class="settings-label">Focus Session Length (Minutes)</label>
          <input type="number" class="settings-input session-length-input" min="15" max="180" step="5" value="${settings.studyPreferences.sessionLengthMinutes}" />
        </div>

        <div class="settings-field">
          <label class="settings-label">Short Break Duration (Minutes)</label>
          <input type="number" class="settings-input break-length-input" min="3" max="60" step="1" value="${settings.studyPreferences.breakDurationMinutes}" />
        </div>

        <div class="settings-field">
          <label class="settings-label">Target JEE Exam Date</label>
          <input type="date" class="settings-input exam-date-input" value="${settings.studyPreferences.targetExamDate}" />
        </div>
      </div>
    `;

    function saveStudyPrefs() {
      var prefs = {
        dailyStudyTargetHours: parseInt(card.querySelector(".daily-target-input").value, 10) || 6,
        weeklyGoalHours: parseInt(card.querySelector(".weekly-goal-input").value, 10) || 42,
        plannerCapacityTasksPerDay: parseInt(card.querySelector(".planner-capacity-input").value, 10) || 5,
        sessionLengthMinutes: parseInt(card.querySelector(".session-length-input").value, 10) || 45,
        breakDurationMinutes: parseInt(card.querySelector(".break-length-input").value, 10) || 15,
        targetExamDate: card.querySelector(".exam-date-input").value || "2027-01-20"
      };
      window.PD.Store.updateSettings({ studyPreferences: prefs });
    }

    card.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("change", saveStudyPrefs);
    });

    return card;
  }

  function buildRevisionPreferencesCard(settings) {
    var card = document.createElement("div");
    card.className = "settings-card";

    card.innerHTML = `
      <div class="settings-card-title"><span>🔄</span> <span>Spaced Repetition & Health Algorithms</span></div>
      <div class="settings-form-grid">
        <div class="settings-field">
          <label class="settings-label">Default Revision Interval (Days)</label>
          <input type="number" class="settings-input interval-input" min="1" max="30" value="${settings.revisionPreferences.defaultRevisionIntervalDays}" />
          <span class="settings-sublabel">Base days before a topic requires its next revision cycle</span>
        </div>

        <div class="settings-field">
          <label class="settings-label">Weak Confidence Flag Threshold</label>
          <select class="settings-select conf-thresh-select">
            <option value="2" ${settings.revisionPreferences.confidenceThreshold === 2 ? "selected" : ""}>Confidence <= 2 (Strict)</option>
            <option value="3" ${settings.revisionPreferences.confidenceThreshold === 3 ? "selected" : ""}>Confidence <= 3 (Standard)</option>
            <option value="4" ${settings.revisionPreferences.confidenceThreshold === 4 ? "selected" : ""}>Confidence <= 4 (Aggressive)</option>
          </select>
        </div>

        <div class="settings-field">
          <label class="settings-label">Health Score Decay Rate</label>
          <select class="settings-select decay-select">
            <option value="slow" ${settings.revisionPreferences.healthDecayRate === "slow" ? "selected" : ""}>Slow Decay (Longer retention assumption)</option>
            <option value="standard" ${settings.revisionPreferences.healthDecayRate === "standard" ? "selected" : ""}>Standard JEE Decay</option>
            <option value="fast" ${settings.revisionPreferences.healthDecayRate === "fast" ? "selected" : ""}>Fast Decay (High repetition requirement)</option>
          </select>
        </div>
      </div>
    `;

    function saveRevPrefs() {
      var prefs = {
        defaultRevisionIntervalDays: parseInt(card.querySelector(".interval-input").value, 10) || 3,
        confidenceThreshold: parseInt(card.querySelector(".conf-thresh-select").value, 10) || 3,
        healthDecayRate: card.querySelector(".decay-select").value || "standard"
      };
      window.PD.Store.updateSettings({ revisionPreferences: prefs });
    }

    card.querySelectorAll("input, select").forEach(function (el) {
      el.addEventListener("change", saveRevPrefs);
    });

    return card;
  }

  function buildNotificationsCard(settings) {
    var card = document.createElement("div");
    card.className = "settings-card";

    card.innerHTML = `
      <div class="settings-card-title"><span>🔔</span> <span>Local Study Reminders (Offline)</span></div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="settings-toggle-row">
          <div>
            <div class="settings-label">Enable Study Session Reminders</div>
            <div class="settings-sublabel">In-app reminder banners when study session target is due</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" class="toggle-reminders" ${settings.notifications.reminderEnabled ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="settings-toggle-row">
          <div>
            <div class="settings-label">Overdue Revision Alerts</div>
            <div class="settings-sublabel">Highlight overdue chapters in Daily Mission & Navigation</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" class="toggle-revision-alerts" ${settings.notifications.revisionAlerts ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="settings-toggle-row">
          <div>
            <div class="settings-label">Daily Target Reminder</div>
            <div class="settings-sublabel">Daily goal check at specified evening time</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" class="toggle-daily-goal" ${settings.notifications.dailyGoalReminder ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="settings-field" style="max-width: 220px; margin-top: 6px;">
          <label class="settings-label">Preferred Reminder Time</label>
          <input type="time" class="settings-input reminder-time-input" value="${settings.notifications.reminderTime || "20:00"}" />
        </div>
      </div>
    `;

    function saveNotifPrefs() {
      var notifs = {
        reminderEnabled: card.querySelector(".toggle-reminders").checked,
        revisionAlerts: card.querySelector(".toggle-revision-alerts").checked,
        dailyGoalReminder: card.querySelector(".toggle-daily-goal").checked,
        reminderTime: card.querySelector(".reminder-time-input").value || "20:00"
      };
      window.PD.Store.updateSettings({ notifications: notifs });
    }

    card.querySelectorAll("input").forEach(function (el) {
      el.addEventListener("change", saveNotifPrefs);
    });

    return card;
  }

  function buildDataManagementCard() {
    var card = document.createElement("div");
    card.className = "settings-card";

    card.innerHTML = `
      <div class="settings-card-title"><span>💾</span> <span>Data Management, Backup & Reset</span></div>
      <p style="font-size:12px; color:var(--text-secondary); margin-bottom:6px;">Export your complete study data, import previous backups, or perform selective resets.</p>
      
      <div class="data-actions-grid">
        <button class="data-btn set-july22-btn" type="button" style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa;">
          <span>📅</span> <span>Set Start Date to July 22</span>
        </button>

        <button class="data-btn pump-health-btn" type="button" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399;">
          <span>💉</span> <span>Pump Down Health Scores</span>
        </button>

        <button class="data-btn export-json-btn" type="button">
          <span>📥</span> <span>Export Data (JSON)</span>
        </button>

        <button class="data-btn import-json-btn" type="button">
          <span>📤</span> <span>Import Backup JSON</span>
        </button>

        <button class="data-btn reset-planner-btn" type="button">
          <span>🧹</span> <span>Reset Planner</span>
        </button>

        <button class="data-btn reset-analytics-btn" type="button">
          <span>📊</span> <span>Reset Analytics</span>
        </button>

        <button class="data-btn data-btn-danger reset-project-btn" type="button">
          <span>⚠️</span> <span>Reset Entire Project</span>
        </button>
      </div>

      <input type="file" class="hidden-file-input" accept=".json" style="display:none;" />
    `;

    var fileInput = card.querySelector(".hidden-file-input");

    // Set Start Date to July 22, 2026
    card.querySelector(".set-july22-btn").addEventListener("click", function () {
      window.PD.Store.setPlanStartDate("2026-07-22");
      alert("Plan start date set to July 22, 2026! Planner & Daily Missions updated.");
    });

    // Pump Down Health
    card.querySelector(".pump-health-btn").addEventListener("click", function () {
      if (confirm("Reset confidence and pump down chapter health scores to reflect unpracticed state?")) {
        window.PD.Store.pumpDownHealth();
        alert("Chapter health scores pumped down!");
      }
    });

    // Export JSON
    card.querySelector(".export-json-btn").addEventListener("click", function () {
      var dataStr = window.PD.Store.exportAllData();
      var blob = new Blob([dataStr], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "project-december-full-backup-" + new Date().toISOString().split("T")[0] + ".json";
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import JSON trigger file picker
    card.querySelector(".import-json-btn").addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function (evt) {
        var content = evt.target.result;
        var res = window.PD.Store.importAllData(content);
        if (res.success) {
          alert("Backup imported successfully! " + res.count + " chapters updated.");
          window.location.reload();
        } else {
          alert("Import failed: " + (res.error || "Invalid file format."));
        }
      };
      reader.readAsText(file);
    });

    // Reset Planner Modal
    card.querySelector(".reset-planner-btn").addEventListener("click", function () {
      showModal("Reset Planner", "Are you sure you want to reset your daily and weekly planner schedules?", function () {
        window.PD.Store.resetPlanner();
        alert("Planner schedules reset.");
      });
    });

    // Reset Analytics Modal
    card.querySelector(".reset-analytics-btn").addEventListener("click", function () {
      showModal("Reset Analytics", "Are you sure you want to clear study session logs and error notebook entries?", function () {
        window.PD.Store.resetAnalytics();
        alert("Analytics logs cleared.");
      });
    });

    // Reset Entire Project Modal (Strict confirmation)
    card.querySelector(".reset-project-btn").addEventListener("click", function () {
      showStrictResetModal();
    });

    return card;
  }

  function showModal(title, text, onConfirm) {
    var backdrop = document.createElement("div");
    backdrop.className = "settings-modal-backdrop";

    backdrop.innerHTML = `
      <div class="settings-modal">
        <h3 class="settings-modal-title">${title}</h3>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.5;">${text}</p>
        <div class="settings-modal-actions">
          <button class="btn btn-secondary cancel-btn" type="button">Cancel</button>
          <button class="btn btn-primary confirm-btn" type="button" style="background:#ef4444; border-color:#ef4444;">Confirm Reset</button>
        </div>
      </div>
    `;

    backdrop.querySelector(".cancel-btn").addEventListener("click", function () {
      document.body.removeChild(backdrop);
    });

    backdrop.querySelector(".confirm-btn").addEventListener("click", function () {
      document.body.removeChild(backdrop);
      onConfirm();
    });

    document.body.appendChild(backdrop);
  }

  function showStrictResetModal() {
    var backdrop = document.createElement("div");
    backdrop.className = "settings-modal-backdrop";

    backdrop.innerHTML = `
      <div class="settings-modal">
        <h3 class="settings-modal-title" style="color:#ef4444;">⚠️ Reset Entire Project</h3>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.5;">This action will permanently delete all chapter progress, revisions, session logs, notes, and custom settings, restoring the 99-chapter syllabus to a fresh default state.</p>
        <p style="font-size:12px; font-weight:700; color:var(--text-primary); margin-top:8px;">Type <strong>RESET</strong> below to confirm:</p>
        <input type="text" class="settings-input reset-confirm-input" placeholder="Type RESET" style="margin-top:4px;" />
        <div class="settings-modal-actions">
          <button class="btn btn-secondary cancel-btn" type="button">Cancel</button>
          <button class="btn btn-primary confirm-btn" type="button" disabled style="background:#ef4444; border-color:#ef4444; opacity:0.5;">Reset Everything</button>
        </div>
      </div>
    `;

    var input = backdrop.querySelector(".reset-confirm-input");
    var confirmBtn = backdrop.querySelector(".confirm-btn");

    input.addEventListener("input", function () {
      if (input.value.trim() === "RESET") {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
      } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
      }
    });

    backdrop.querySelector(".cancel-btn").addEventListener("click", function () {
      document.body.removeChild(backdrop);
    });

    confirmBtn.addEventListener("click", function () {
      document.body.removeChild(backdrop);
      window.PD.Store.resetProject();
      alert("Project December has been reset to default initial state.");
      window.location.reload();
    });

    document.body.appendChild(backdrop);
  }

  return { render: render };
})();

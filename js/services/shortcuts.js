window.PD = window.PD || {};
window.PD.Services = window.PD.Services || {};

window.PD.Services.Shortcuts = (function () {
  var toastTimeout = null;

  function init() {
    document.addEventListener("keydown", handleGlobalKeyDown);
    renderShortcutsHelpModal();
  }

  function isUserTyping(el) {
    if (!el) return false;
    var tag = el.tagName ? el.tagName.toUpperCase() : "";
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  }

  function handleGlobalKeyDown(event) {
    var active = document.activeElement;
    var typing = isUserTyping(active);

    // Escape closes modals or expanded cards (always active)
    if (event.key === "Escape") {
      var modal = document.querySelector(".shortcuts-modal-overlay.is-visible");
      if (modal) {
        modal.classList.remove("is-visible");
        return;
      }
      var expandedCards = document.querySelectorAll(".chapter-card.is-expanded");
      if (expandedCards.length > 0) {
        expandedCards.forEach(function (c) { c.classList.remove("is-expanded"); });
      }
      return;
    }

    // Shift + ? shows shortcuts help modal (only when not typing)
    if ((event.key === "?" || (event.shiftKey && event.key === "/")) && !typing) {
      event.preventDefault();
      toggleHelpModal();
      return;
    }

    // Focus Search bar with '/' when not typing
    if (event.key === "/" && !typing) {
      var searchInput = document.querySelector(".search-input, .toolbar-search input");
      if (searchInput) {
        event.preventDefault();
        searchInput.focus();
      }
      return;
    }

    // Global Shortcuts using Alt key or direct keys (when not typing)
    var isAlt = event.altKey;
    var code = event.code;
    var key = event.key.toLowerCase();

    // 1. OPEN WORKSPACE: Alt + W or (W when not typing)
    if ((isAlt && key === "w") || (!typing && !isAlt && !event.ctrlKey && !event.metaKey && key === "w")) {
      event.preventDefault();
      openWorkspace();
      return;
    }

    // 2. SWITCH SUBJECT: Physics (Alt + 1 or Alt + P or P when not typing)
    if ((isAlt && (key === "1" || key === "p")) || (!typing && !isAlt && !event.ctrlKey && !event.metaKey && key === "p")) {
      event.preventDefault();
      switchSubject("Physics", "Physics ⚛️");
      return;
    }

    // 3. SWITCH SUBJECT: Chemistry (Alt + 2 or Alt + C or C when not typing)
    if ((isAlt && (key === "2" || key === "c")) || (!typing && !isAlt && !event.ctrlKey && !event.metaKey && key === "c")) {
      event.preventDefault();
      switchSubject("Chemistry", "Chemistry 🧪");
      return;
    }

    // 4. SWITCH SUBJECT: Maths / Mathematics (Alt + 3 or Alt + M or M when not typing)
    if ((isAlt && (key === "3" || key === "m")) || (!typing && !isAlt && !event.ctrlKey && !event.metaKey && key === "m")) {
      event.preventDefault();
      switchSubject("Mathematics", "Mathematics 📐");
      return;
    }

    // 5. SWITCH SUBJECT: All Subjects (Alt + 0 or Alt + A or A when not typing)
    if ((isAlt && (key === "0" || key === "a")) || (!typing && !isAlt && !event.ctrlKey && !event.metaKey && key === "a")) {
      event.preventDefault();
      switchSubject("All", "All Subjects 📚");
      return;
    }
  }

  function openWorkspace() {
    showToast("🚀 Opening Focus Workspace...");
    if (window.PD && window.PD.Router && typeof window.PD.Router.navigate === "function") {
      window.PD.Router.navigate("workspace");
    } else {
      window.location.hash = "#/workspace";
    }
  }

  function switchSubject(subjectName, displayLabel) {
    // 1. Update store
    if (window.PD && window.PD.Store) {
      var currentFilters = window.PD.Store.getTrackerFilters() || {};
      window.PD.Store.setTrackerFilters(Object.assign({}, currentFilters, { subject: subjectName }));
    }

    // 2. Update current page DOM elements if on Tracker or notebook
    var currentHash = window.location.hash || "#/dashboard";

    // If on Tracker page, update toolbar select or state
    var trackerSelect = document.querySelector(".tracker-toolbar select, #setup-chapter-select");
    if (trackerSelect) {
      // Find matching option
      for (var i = 0; i < trackerSelect.options.length; i++) {
        var opt = trackerSelect.options[i];
        if (opt.value.toLowerCase() === subjectName.toLowerCase() ||
           (subjectName === "Mathematics" && opt.value.toLowerCase() === "maths")) {
          trackerSelect.selectedIndex = i;
          trackerSelect.dispatchEvent(new Event("change"));
          break;
        }
      }
    }

    // Trigger filter update if tracker buttons exist
    var subjectButtons = document.querySelectorAll(".subject-filter-btn, .ws-tab-btn, .notebook-toolbar .chip");
    if (subjectButtons.length > 0) {
      subjectButtons.forEach(function (btn) {
        var txt = btn.textContent.trim().toLowerCase();
        if (txt.indexOf(subjectName.toLowerCase()) !== -1 || (subjectName === "All" && txt.indexOf("all") !== -1)) {
          btn.click();
        }
      });
    }

    // If on Dashboard, Recharts chart re-renders with new subject
    var chartSlot = document.querySelector("#dash-consistency-chart-slot, #sunday-consistency-chart-slot");
    if (chartSlot && window.PD.Components.StudyConsistencyChart) {
      window.PD.Components.StudyConsistencyChart.render(chartSlot, { subject: subjectName });
    }

    showToast("⚡ Switched subject to " + displayLabel);
  }

  function showToast(message) {
    var toast = document.getElementById("pd-global-shortcut-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pd-global-shortcut-toast";
      toast.className = "pd-shortcut-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function toggleHelpModal() {
    var overlay = document.querySelector(".shortcuts-modal-overlay");
    if (overlay) {
      overlay.classList.toggle("is-visible");
    }
  }

  function renderShortcutsHelpModal() {
    if (document.querySelector(".shortcuts-modal-overlay")) return;

    var overlay = document.createElement("div");
    overlay.className = "shortcuts-modal-overlay";

    var card = document.createElement("div");
    card.className = "shortcuts-modal-card";

    card.innerHTML = `
      <div class="shortcuts-modal-header">
        <div>
          <h2 class="shortcuts-modal-title">⌨️ Keyboard Shortcuts Cheat Sheet</h2>
          <p class="shortcuts-modal-sub">Fast keyboard triggers to switch study subjects and launch Focus Workspace</p>
        </div>
        <button class="shortcuts-close-btn" type="button">✕</button>
      </div>
      <div class="shortcuts-grid">
        <div class="shortcut-row" data-action="workspace">
          <span class="shortcut-label">Open Focus Workspace</span>
          <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>W</kbd> or <kbd>W</kbd></div>
        </div>
        <div class="shortcut-row" data-action="physics">
          <span class="shortcut-label">Switch to Physics</span>
          <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>1</kbd> or <kbd>P</kbd></div>
        </div>
        <div class="shortcut-row" data-action="chemistry">
          <span class="shortcut-label">Switch to Chemistry</span>
          <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>2</kbd> or <kbd>C</kbd></div>
        </div>
        <div class="shortcut-row" data-action="maths">
          <span class="shortcut-label">Switch to Mathematics</span>
          <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>3</kbd> or <kbd>M</kbd></div>
        </div>
        <div class="shortcut-row" data-action="all">
          <span class="shortcut-label">Switch to All Subjects</span>
          <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>0</kbd> or <kbd>A</kbd></div>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-label">Focus Search Input</span>
          <div class="shortcut-keys"><kbd>/</kbd></div>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-label">Open Shortcuts Cheat Sheet</span>
          <div class="shortcut-keys"><kbd>Shift</kbd> + <kbd>?</kbd></div>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-label">Close Modals / Collapse Cards</span>
          <div class="shortcut-keys"><kbd>Esc</kbd></div>
        </div>
      </div>
      <div class="shortcuts-modal-footer">
        <p>Tip: Click any row above to trigger that shortcut immediately!</p>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Event listeners
    overlay.querySelector(".shortcuts-close-btn").addEventListener("click", function () {
      overlay.classList.remove("is-visible");
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.classList.remove("is-visible");
    });

    // Row clicks
    card.querySelectorAll(".shortcut-row[data-action]").forEach(function (row) {
      row.addEventListener("click", function () {
        var act = row.getAttribute("data-action");
        overlay.classList.remove("is-visible");
        if (act === "workspace") openWorkspace();
        else if (act === "physics") switchSubject("Physics", "Physics ⚛️");
        else if (act === "chemistry") switchSubject("Chemistry", "Chemistry 🧪");
        else if (act === "maths") switchSubject("Mathematics", "Mathematics 📐");
        else if (act === "all") switchSubject("All", "All Subjects 📚");
      });
    });
  }

  return {
    init: init,
    openWorkspace: openWorkspace,
    switchSubject: switchSubject,
    toggleHelpModal: toggleHelpModal
  };
})();

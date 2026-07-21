window.PD = window.PD || {};
PD.Components = window.PD.Components || {};

PD.Components.Navigation = (function () {
  var NAV_ITEMS = [
    { path: "dashboard", label: "Dashboard", icon: "◆" },
    { path: "focus", label: "Focus & Anti-Procr", icon: "⚡" },
    { path: "daily-mission", label: "Daily Mission", icon: "🎯" },
    { path: "tracker", label: "Tracker", icon: "▣" },
    { path: "planner", label: "Planner", icon: "▤" },
    { path: "weekly-planner", label: "Weekly Planner", icon: "📅" },
    { path: "sunday-review", label: "Sunday Review", icon: "📊" },
    { path: "error-notebook", label: "Error Notebook", icon: "📔" },
    { path: "revision-calendar", label: "Revision Calendar", icon: "📆" },
    { path: "workspace", label: "Workspace", icon: "⏱" },
    { path: "analytics", label: "Analytics", icon: "▥" },
    { path: "settings", label: "Settings", icon: "⚙" }
  ];

  var navEl = null;

  function render(container) {
    container.innerHTML = "";
    navEl = PD.Utils.createEl("nav", { class: "sidebar" });

    var brand = PD.Utils.createEl("div", { class: "sidebar-brand" });
    brand.appendChild(PD.Utils.createEl("span", { class: "brand-mark", text: "December" }));
    navEl.appendChild(brand);

    var list = PD.Utils.createEl("ul", { class: "nav-list" });
    NAV_ITEMS.forEach(function (item) {
      var li = PD.Utils.createEl("li", { class: "nav-item" });
      var link = PD.Utils.createEl("a", {
        href: "#/" + item.path,
        class: "nav-link",
        "data-path": item.path
      });
      link.appendChild(PD.Utils.createEl("span", { class: "nav-icon", text: item.icon }));
      link.appendChild(PD.Utils.createEl("span", { class: "nav-label", text: item.label }));
      li.appendChild(link);
      list.appendChild(li);
    });
    navEl.appendChild(list);

    var footer = PD.Utils.createEl("div", { class: "sidebar-footer" });
    
    var themeToggle = PD.Utils.createEl("button", { class: "theme-toggle", type: "button" });
    themeToggle.textContent = PD.Store.getTheme() === "dark" ? "☾ Dark" : "☀ Light";
    themeToggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      PD.Store.setTheme(next);
      themeToggle.textContent = next === "dark" ? "☾ Dark" : "☀ Light";
    });

    var aiChatBtn = PD.Utils.createEl("button", {
      class: "theme-toggle ai-chat-nav-btn",
      type: "button",
      style: "margin-top: 6px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-weight: 600; border: 1px solid rgba(59, 130, 246, 0.3);",
      text: "🤖 Ask JEE AI"
    });
    aiChatBtn.addEventListener("click", function () {
      if (PD.Components && PD.Components.AIChatSidebar) {
        PD.Components.AIChatSidebar.toggle();
      }
    });

    var shortcutBtn = PD.Utils.createEl("button", {
      class: "theme-toggle shortcut-help-btn",
      type: "button",
      style: "margin-top: 6px;",
      text: "⌨ Shortcuts"
    });
    shortcutBtn.addEventListener("click", function () {
      if (PD.Services && PD.Services.Shortcuts) {
        PD.Services.Shortcuts.toggleHelpModal();
      }
    });

    footer.appendChild(themeToggle);
    footer.appendChild(aiChatBtn);
    footer.appendChild(shortcutBtn);
    navEl.appendChild(footer);

    container.appendChild(navEl);
  }

  function setActive(path) {
    if (!navEl) return;
    PD.Utils.qsa(".nav-link", navEl).forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-path") === path);
    });
  }

  return { render: render, setActive: setActive };
})();

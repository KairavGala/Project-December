(function () {
  function registerRoutes() {
    PD.Router.register("dashboard", function (el) { PD.Pages.Dashboard.render(el); });

    PD.Router.register("focus", function (el) {
      if (PD.Pages.Focus) {
        PD.Pages.Focus.render(el);
      } else {
        console.error("PD.Pages.Focus is not loaded yet.");
      }
    });

    PD.Router.register("daily-mission", function (el) { PD.Pages.DailyMission.render(el); });

    PD.Router.register("tracker", function (el) { PD.Pages.Tracker.render(el); });

    PD.Router.register("planner", function (el) { PD.Pages.Planner.render(el); });

    PD.Router.register("weekly-planner", function (el) { PD.Pages.WeeklyPlanner.render(el); });

    PD.Router.register("sunday-review", function (el) { PD.Pages.SundayReview.render(el); });

    PD.Router.register("error-notebook", function (el) {
      if (PD.Pages.ErrorNotebook) {
        PD.Pages.ErrorNotebook.render(el);
      } else {
        console.error("PD.Pages.ErrorNotebook is not loaded yet.");
      }
    });

    PD.Router.register("revision-calendar", function (el) { PD.Pages.RevisionCalendar.render(el); });

    PD.Router.register("analytics", function (el) { PD.Pages.Analytics.render(el); });

    PD.Router.register("workspace", function (el) { PD.Pages.Workspace.render(el); });

    PD.Router.register("settings", function (el) { PD.Pages.Settings.render(el); });
  }

  function boot() {
    document.documentElement.setAttribute("data-theme", PD.Store.getTheme());
    PD.Store.init();

    var shell = PD.Utils.qs("#app-shell");
    var sidebarSlot = PD.Utils.qs("#sidebar-slot", shell);
    var mainSlot = PD.Utils.qs("#main-slot", shell);

    PD.Components.Navigation.render(sidebarSlot);
    registerRoutes();
    PD.Router.init(mainSlot);

    if (PD.Services && PD.Services.Shortcuts && typeof PD.Services.Shortcuts.init === "function") {
      PD.Services.Shortcuts.init();
    }

    if (PD.Components && PD.Components.AIChatSidebar && typeof PD.Components.AIChatSidebar.init === "function") {
      PD.Components.AIChatSidebar.init();
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        PD.Utils.qsa(".chapter-card.is-expanded").forEach(function (card) {
          card.classList.remove("is-expanded");
        });
      }

      if (event.key === "/") {
        var active = document.activeElement;
        var isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
        if (!isTyping) {
          var searchInput = PD.Utils.qs(".search-input");
          if (searchInput) {
            event.preventDefault();
            searchInput.focus();
          }
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();

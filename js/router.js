window.PD = window.PD || {};

// Minimal hash router. No dependency on any page — pages register themselves.
PD.Router = (function () {
  var routes = {};
  var defaultRoute = "dashboard";
  var mountEl = null;
  var pendingFocusChapterId = null;

  function register(path, renderFn) {
    routes[path] = renderFn;
  }

  function currentPath() {
    var hash = window.location.hash.replace(/^#\/?/, "");
    return hash || defaultRoute;
  }

  function render() {
    var path = currentPath();
    var renderFn = routes[path];
    if (!mountEl) return;

    mountEl.classList.remove("route-fade-enter-active");
    mountEl.classList.add("route-fade-enter");
    mountEl.innerHTML = "";

    if (renderFn) {
      renderFn(mountEl);
    } else {
      mountEl.appendChild(
        PD.Utils.createEl("div", { class: "empty-state", text: "Route not found." })
      );
    }

    if (PD.Components && PD.Components.Navigation) {
      PD.Components.Navigation.setActive(path);
    }

    requestAnimationFrame(function () {
      mountEl.classList.remove("route-fade-enter");
      mountEl.classList.add("route-fade-enter-active");
    });
  }

  function init(el) {
    mountEl = el;
    window.addEventListener("hashchange", render);
    render();
  }

  // Dashboard calls this before navigating so Tracker knows which chapter
  // to expand and scroll to. Deliberately not a route parameter (e.g.
  // "#/tracker/<id>") - the hash stays exactly "#/tracker" and this is a
  // one-shot, consumed-once handoff, which is all that's needed here.
  function focusChapter(chapterId) {
    pendingFocusChapterId = chapterId;
    window.location.hash = "#/tracker";
  }

  function consumePendingFocus() {
    var id = pendingFocusChapterId;
    pendingFocusChapterId = null;
    return id;
  }

  return {
    register: register,
    init: init,
    render: render,
    refresh: render,
    focusChapter: focusChapter,
    consumePendingFocus: consumePendingFocus
  };
})();

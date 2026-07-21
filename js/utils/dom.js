window.PD = window.PD || {};

PD.Utils = (function () {
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.from((scope || document).querySelectorAll(selector));
  }

  function createEl(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "class") el.className = attrs[key];
        else if (key === "text") el.textContent = attrs[key];
        else el.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      el.appendChild(child);
    });
    return el;
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  return {
    qs: qs,
    qsa: qsa,
    createEl: createEl,
    formatDate: formatDate,
    debounce: debounce
  };
})();

window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

// Single source of truth for "how much of this chapter is done," expressed
// as completed/total. Both the progress bar and the health score read from
// here instead of each computing their own answer.
//
// Once a chapter has resources, they ARE the tasks — completion is
// (done resources / total resources). The old manual completedTasks/
// remainingTasks counters only apply to chapters that haven't added any
// resources yet. Running both systems at once would mean two different
// answers to the same question; resources are strictly more informative
// (typed, labeled, individually trackable) than an anonymous number, so
// they supersede the counter rather than coexisting with it.
PD.Services.Progress = (function () {
  function compute(chapter) {
    var resources = chapter.resources || [];

    if (resources.length > 0) {
      var done = resources.filter(function (r) {
        return r.status === "done";
      }).length;
      return { completed: done, total: resources.length, source: "resources" };
    }

    var completed = chapter.completedTasks || 0;
    var total = completed + (chapter.remainingTasks || 0);
    return { completed: completed, total: total, source: "manual" };
  }

  return { compute: compute };
})();

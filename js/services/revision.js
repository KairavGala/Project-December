window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

// Confidence-driven revision scheduling (spec section 31: conf 5 -> 14 days,
// 4 -> 7, 3 -> 4, 2 -> 2, 1 -> tomorrow).
//
// Deliberate architecture call: this never reads or writes a stored
// `revisionDue` field. It computes the due date fresh, every time, from
// confidence + lastRevision/lastStudied. A stored derived field can drift
// out of sync with the inputs that produced it (change the confidence and
// forget to recompute); a pure function can't.
PD.Services.Revision = (function () {
  var INTERVAL_DAYS = { 5: 14, 4: 7, 3: 4, 2: 2, 1: 1 };
  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  function intervalFor(confidence) {
    return INTERVAL_DAYS[confidence] || INTERVAL_DAYS[3];
  }

  function getStatus(chapter) {
    var anchor = chapter.lastRevision || chapter.lastStudied;
    if (!anchor) {
      return { status: "untracked", label: "Not revised yet", dueDate: null, daysUntil: null };
    }

    var anchorDate = new Date(anchor);
    var dueDate = new Date(anchorDate.getTime() + intervalFor(chapter.confidence) * MS_PER_DAY);
    var now = new Date();
    var daysUntil = Math.floor((dueDate.getTime() - now.getTime()) / MS_PER_DAY);

    if (daysUntil < 0) {
      var overdueBy = Math.abs(daysUntil);
      return {
        status: "overdue",
        label: "Overdue by " + overdueBy + " day" + (overdueBy === 1 ? "" : "s"),
        dueDate: dueDate,
        daysUntil: daysUntil
      };
    }
    if (daysUntil <= 1) {
      return {
        status: "due-soon",
        label: daysUntil === 0 ? "Due today" : "Due tomorrow",
        dueDate: dueDate,
        daysUntil: daysUntil
      };
    }
    return { status: "ok", label: "Due in " + daysUntil + " days", dueDate: dueDate, daysUntil: daysUntil };
  }

  function logRevision(chapter) {
    return {
      lastRevision: new Date().toISOString(),
      revisionCount: (chapter.revisionCount || 0) + 1
    };
  }

  function logStudySession() {
    return { lastStudied: new Date().toISOString() };
  }

  return {
    getStatus: getStatus,
    logRevision: logRevision,
    logStudySession: logStudySession,
    intervalFor: intervalFor
  };
})();

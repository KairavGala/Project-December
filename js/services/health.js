window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

// Health scoring — v1. Deliberately transparent: every point gained or lost
// has a stated reason (see `reasons`), because an opaque score defeats the
// point of an app whose whole job is decision support. Tunable; documented
// in docs/CHANGELOG.md as a first cut, not a final formula.
//
// Same architecture call as Revision: computed fresh from confidence,
// completion, task ratio, and revision status — never read from or written
// to a stored `health` field, so it can't go stale.
PD.Services.Health = (function () {
  function compute(chapter) {
    var progress = PD.Services.Progress.compute(chapter);

    // If it's a grey / unstarted chapter (confidence 1, not completed, no progress, not studied)
    if (chapter.confidence === 1 && !chapter.completed && progress.completed === 0 && !chapter.lastStudied) {
      return { score: 0, band: "unstarted", reasons: ["not started yet"] };
    }

    // Base score on confidence
    var score = chapter.confidence * 20; // 1->20, 2->40, 3->60, 4->80, 5->100
    var reasons = ["confidence " + chapter.confidence + "/5"];

    if (!chapter.completed) {
      score -= 10;
      reasons.push("not yet marked complete");
    }

    var revision = PD.Services.Revision.getStatus(chapter);
    if (revision.status === "overdue") {
      var penalty = Math.min(30, Math.abs(revision.daysUntil) * 5);
      score -= penalty;
      reasons.push(revision.label.toLowerCase());
    } else if (revision.status === "due-soon") {
      score -= 5;
      reasons.push("revision due soon");
    } else if (revision.status === "untracked") {
      if (chapter.confidence > 1) {
        score -= 5;
        reasons.push("no revision logged yet");
      }
    } else {
      score += 5;
      reasons.push("revision on schedule");
    }

    if (progress.total > 0) {
      var ratio = progress.completed / progress.total;
      score += Math.round((ratio - 0.5) * 10);
      reasons.push(progress.completed + "/" + progress.total + " resources done");
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    
    // Thresholds:
    // Strong (Green): >= 70
    // Medium (Yellow): >= 40
    // Weak (Red): < 40
    var band = score >= 70 ? "strong" : score >= 40 ? "medium" : "weak";

    return { score: score, band: band, reasons: reasons };
  }

  return { compute: compute };
})();

window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

PD.Services.ErrorNotebook = (function () {
  var STORAGE_KEY = "projectDecember.mistakes.v1";
  var mistakes = [];

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      mistakes = raw ? JSON.parse(raw) : [];
    } catch (e) {
      mistakes = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
    } catch (e) {
      console.error("PD.Services.ErrorNotebook: failed to save mistakes", e);
    }
  }

  function getMistakes() {
    if (mistakes.length === 0) load();
    return mistakes;
  }

  function addMistake(mistake) {
    var newMistake = Object.assign({
      id: "mistake_" + Math.random().toString(36).substr(2, 9),
      subject: "Chemistry",
      chapter: "",
      topic: "",
      mistakeType: "Conceptual", // Conceptual, Calculation, Silly, Time Pressure, Misread
      reason: "",
      correctMethod: "",
      personalNotes: "",
      reviewStatus: "Needs Review", // Needs Review, Reviewed
      reviewDate: new Date().toISOString().split("T")[0]
    }, mistake);

    mistakes.push(newMistake);
    save();
    return newMistake;
  }

  function updateMistake(id, patch) {
    var m = mistakes.find(function (item) { return item.id === id; });
    if (!m) return null;
    Object.assign(m, patch);
    save();
    return m;
  }

  function deleteMistake(id) {
    mistakes = mistakes.filter(function (item) { return item.id !== id; });
    save();
  }

  // Planner integration: Get mistakes that "Need Review"
  function getMistakesNeedingReview() {
    return getMistakes().filter(function (m) {
      return m.reviewStatus === "Needs Review";
    });
  }

  return {
    getMistakes: getMistakes,
    addMistake: addMistake,
    updateMistake: updateMistake,
    deleteMistake: deleteMistake,
    getMistakesNeedingReview: getMistakesNeedingReview
  };
})();

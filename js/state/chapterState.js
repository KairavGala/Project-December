window.PD = window.PD || {};

// The canonical ChapterState model. Every screen (Dashboard, Tracker, Planner,
// Analytics) reads from objects shaped like this — nothing duplicates or
// re-derives its own copy of chapter data.
PD.ChapterState = (function () {
  var idCounter = 0;

  function create(overrides) {
    idCounter += 1;
    var base = {
      id: "ch_" + Date.now().toString(36) + "_" + idCounter,
      subject: "",
      chapter: "",
      completed: false,
      confidence: 3, // 1 (weak) – 5 (strong)
      mastery: 0, // calculated later (Phase 2/3) — not user-edited
      revisionCount: 0,
      revisionDue: null,
      accuracy: null,
      notes: "",
      estimatedHours: null,
      completedTasks: 0,
      remainingTasks: 0,
      health: 100, // placeholder at seed time — real decay engine arrives with Tracker
      lastStudied: null,
      lastRevision: null,
      bookmarks: [],
      customTags: [],
      resources: []
    };
    return Object.assign(base, overrides || {});
  }

  function healthForConfidence(confidence) {
    if (confidence >= 4) return 90;
    if (confidence === 3) return 70;
    return 45;
  }

  // Real status as reported for Phase 1 kickoff (July 2026). Confidence here
  // is seeded from the strong/medium/weak ratings in the brief; anything
  // completed but unrated defaults to 3. Update freely once Tracker (Phase 2)
  // ships — this is a starting point, not a locked-in judgment.
  function seed() {
    var chapters = [];

    var syllabus = [
      // PHYSICS
      { subject: "Physics", chapter: "Units & Dimensions", status: "green" },
      { subject: "Physics", chapter: "Kinematics", status: "green" },
      { subject: "Physics", chapter: "Laws of Motion", status: "green" },
      { subject: "Physics", chapter: "Friction", status: "green" },
      { subject: "Physics", chapter: "Circular Motion", status: "green" },
      { subject: "Physics", chapter: "Work, Energy & Power", status: "yellow" },
      { subject: "Physics", chapter: "Centre of Mass", status: "yellow" },
      { subject: "Physics", chapter: "Linear Momentum & Collisions", status: "yellow" },
      { subject: "Physics", chapter: "Rotational Motion", status: "yellow" },
      { subject: "Physics", chapter: "Gravitation", status: "yellow" },
      { subject: "Physics", chapter: "Elasticity", status: "yellow" },
      { subject: "Physics", chapter: "Fluid Mechanics", status: "yellow" },
      { subject: "Physics", chapter: "Calorimetry", status: "yellow" },
      { subject: "Physics", chapter: "Thermal Expansion", status: "yellow" },
      { subject: "Physics", chapter: "Kinetic Theory of Gases", status: "yellow" },
      { subject: "Physics", chapter: "Thermodynamics", status: "yellow" },
      { subject: "Physics", chapter: "Simple Harmonic Motion", status: "yellow" },
      { subject: "Physics", chapter: "Waves", status: "grey" },
      { subject: "Physics", chapter: "Electrostatics", status: "red" },
      { subject: "Physics", chapter: "Capacitors", status: "red" },
      { subject: "Physics", chapter: "Current Electricity", status: "red" },
      { subject: "Physics", chapter: "Magnetic Effects of Current", status: "grey" },
      { subject: "Physics", chapter: "Magnetism & Matter", status: "grey" },
      { subject: "Physics", chapter: "EMI", status: "grey" },
      { subject: "Physics", chapter: "Alternating Current", status: "grey" },
      { subject: "Physics", chapter: "Ray Optics", status: "yellow" },
      { subject: "Physics", chapter: "Wave Optics", status: "grey" },
      { subject: "Physics", chapter: "Dual Nature", status: "grey" },
      { subject: "Physics", chapter: "Atoms", status: "grey" },
      { subject: "Physics", chapter: "Nuclei", status: "grey" },
      { subject: "Physics", chapter: "Semiconductors", status: "grey" },

      // CHEMISTRY
      { subject: "Chemistry", chapter: "Mole Concept", status: "green" },
      { subject: "Chemistry", chapter: "Atomic Structure", status: "green" },
      { subject: "Chemistry", chapter: "Periodic Table", status: "green" },
      { subject: "Chemistry", chapter: "Chemical Bonding", status: "green" },
      { subject: "Chemistry", chapter: "States of Matter (Gaseous)", status: "green" },
      { subject: "Chemistry", chapter: "Thermodynamics", status: "red" },
      { subject: "Chemistry", chapter: "Thermochemistry", status: "red" },
      { subject: "Chemistry", chapter: "Chemical Equilibrium", status: "yellow" },
      { subject: "Chemistry", chapter: "Ionic Equilibrium", status: "yellow" },
      { subject: "Chemistry", chapter: "Redox Reactions", status: "grey" },
      { subject: "Chemistry", chapter: "IUPAC Nomenclature", status: "green" },
      { subject: "Chemistry", chapter: "General Organic Chemistry (GOC)", status: "yellow" },
      { subject: "Chemistry", chapter: "Isomerism", status: "yellow" },
      { subject: "Chemistry", chapter: "Reaction Mechanism", status: "red" },
      { subject: "Chemistry", chapter: "Hydrocarbons", status: "red" },
      { subject: "Chemistry", chapter: "Hydrogen", status: "grey" },
      { subject: "Chemistry", chapter: "s-Block", status: "grey" },
      { subject: "Chemistry", chapter: "p-Block (11th)", status: "grey" },
      { subject: "Chemistry", chapter: "Solid State", status: "grey" },
      { subject: "Chemistry", chapter: "Solutions", status: "red" },
      { subject: "Chemistry", chapter: "Electrochemistry", status: "grey" },
      { subject: "Chemistry", chapter: "Chemical Kinetics", status: "yellow" },
      { subject: "Chemistry", chapter: "Surface Chemistry", status: "grey" },
      { subject: "Chemistry", chapter: "Metallurgy", status: "grey" },
      { subject: "Chemistry", chapter: "d- & f-Block", status: "grey" },
      { subject: "Chemistry", chapter: "Coordination Compounds", status: "yellow" },
      { subject: "Chemistry", chapter: "p-Block (12th)", status: "grey" },
      { subject: "Chemistry", chapter: "Haloalkanes & Haloarenes", status: "grey" },
      { subject: "Chemistry", chapter: "Alcohols, Phenols & Ethers", status: "grey" },
      { subject: "Chemistry", chapter: "Aldehydes & Ketones", status: "grey" },
      { subject: "Chemistry", chapter: "Carboxylic Acids", status: "grey" },
      { subject: "Chemistry", chapter: "Amines", status: "grey" },
      { subject: "Chemistry", chapter: "Biomolecules", status: "grey" },
      { subject: "Chemistry", chapter: "Polymers", status: "grey" },
      { subject: "Chemistry", chapter: "Chemistry in Everyday Life", status: "grey" },
      { subject: "Chemistry", chapter: "Practical Organic Chemistry", status: "grey" },

      // MATHEMATICS
      { subject: "Mathematics", chapter: "Sets", status: "green" },
      { subject: "Mathematics", chapter: "Relations & Functions", status: "green" },
      { subject: "Mathematics", chapter: "Complex Numbers", status: "red" },
      { subject: "Mathematics", chapter: "Quadratic Equations", status: "green" },
      { subject: "Mathematics", chapter: "Sequences & Series", status: "red" },
      { subject: "Mathematics", chapter: "Permutation & Combination", status: "red" },
      { subject: "Mathematics", chapter: "Binomial Theorem", status: "red" },
      { subject: "Mathematics", chapter: "Mathematical Induction", status: "red" },
      { subject: "Mathematics", chapter: "Logarithms", status: "green" },
      { subject: "Mathematics", chapter: "Trigonometric Ratios & Identities", status: "green" },
      { subject: "Mathematics", chapter: "Trigonometric Equations", status: "green" },
      { subject: "Mathematics", chapter: "Straight Lines", status: "green" },
      { subject: "Mathematics", chapter: "Pair of Straight Lines", status: "yellow" },
      { subject: "Mathematics", chapter: "Circle", status: "yellow" },
      { subject: "Mathematics", chapter: "Parabola", status: "yellow" },
      { subject: "Mathematics", chapter: "Ellipse", status: "yellow" },
      { subject: "Mathematics", chapter: "Hyperbola", status: "yellow" },
      { subject: "Mathematics", chapter: "Functions", status: "yellow" },
      { subject: "Mathematics", chapter: "Limits", status: "yellow" },
      { subject: "Mathematics", chapter: "Continuity", status: "yellow" },
      { subject: "Mathematics", chapter: "Differentiability", status: "yellow" },
      { subject: "Mathematics", chapter: "Application of Derivatives", status: "yellow" },
      { subject: "Mathematics", chapter: "Indefinite Integration", status: "grey" },
      { subject: "Mathematics", chapter: "Definite Integration", status: "grey" },
      { subject: "Mathematics", chapter: "Area Under Curves", status: "grey" },
      { subject: "Mathematics", chapter: "Differential Equations", status: "grey" },
      { subject: "Mathematics", chapter: "Vectors", status: "grey" },
      { subject: "Mathematics", chapter: "Three-Dimensional Geometry", status: "grey" },
      { subject: "Mathematics", chapter: "Matrices", status: "green" },
      { subject: "Mathematics", chapter: "Determinants", status: "green" },
      { subject: "Mathematics", chapter: "Statistics", status: "grey" },
      { subject: "Mathematics", chapter: "Probability", status: "grey" }
    ];

    syllabus.forEach(function (item) {
      // Clean starting state for 22nd July start:
      // Practice hasn't happened yet for any chapter; no past study dates pre-set.
      var confidence = item.status === "green" ? 2 : item.status === "yellow" ? 2 : 1;

      chapters.push(
        create({
          subject: item.subject,
          chapter: item.chapter,
          completed: false,
          confidence: confidence,
          lastStudied: null,
          lastRevision: null,
          revisionDue: null,
          revisionCount: 0,
          health: 0 // Computed fresh by Health service (will be 0–30)
        })
      );
    });

    return chapters;
  }

  return { create: create, seed: seed };
})();

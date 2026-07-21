window.PD = window.PD || {};
PD.Services = window.PD.Services || {};

PD.Services.JulySchedule = (function () {
  var JULY_SCHEDULE = {
    "2026-07-20": {
      dayName: "Monday",
      type: "Coaching Prep Day",
      goal: "Prepare for July 22–31 Master Plan kick-off.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Lecture & Notes Revision", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Solutions", label: "Liquid Solutions Lecture", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Differentiation", label: "Methods of Differentiation Practice", category: "Coaching (70%)" },
        { subject: "Physics", chapterName: "Electrostatics", label: "Electrostatics Formula Revision (45 min)", category: "Backlog (30%)" }
      ]
    },
    "2026-07-21": {
      dayName: "Tuesday",
      type: "Coaching Prep Day",
      goal: "Final prep before Wednesday Coaching.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Practice Numericals", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Hydrocarbons", label: "Hydrocarbons Introductory Reading", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Differentiation", label: "Methods of Differentiation Module", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Thermodynamics", label: "Thermodynamics Short Notes", category: "Backlog (30%)" },
        { subject: "General", chapterName: "Formula Sheet", label: "Formula Sheet Revision (20 min)", category: "Daily Revision" }
      ]
    },
    "2026-07-22": {
      dayName: "Wednesday",
      type: "Coaching Day",
      goal: "Stay fully caught up with coaching.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Lecture & Coaching Notes Revision", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Solutions", label: "Liquid Solutions Lecture", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Differentiation", label: "Methods of Differentiation Lecture", category: "Coaching (70%)" },
        { subject: "Physics", chapterName: "Electrostatics", label: "Electrostatics Formula Revision (45 min)", category: "Backlog (30%)" }
      ]
    },
    "2026-07-23": {
      dayName: "Thursday",
      type: "College + Light Study",
      goal: "Complete Violet before Friday.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Violet", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Solutions", label: "Liquid Solutions Violet", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Differentiation", label: "Methods of Differentiation Practice", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Thermodynamics", label: "Thermodynamics Short Notes", category: "Backlog (30%)" },
        { subject: "General", chapterName: "Formula Sheet", label: "Formula Sheet Revision (20 min)", category: "Daily Revision" }
      ]
    },
    "2026-07-24": {
      dayName: "Friday",
      type: "Coaching Day",
      goal: "No pending coaching lectures.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Lecture", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Hydrocarbons", label: "Hydrocarbons Lecture", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Applications of Derivatives", label: "Applications of Derivatives Introduction", category: "Coaching (70%)" },
        { subject: "Physics", chapterName: "Electrostatics", label: "Electrostatics Examples", category: "Backlog (30%)" }
      ]
    },
    "2026-07-25": {
      dayName: "Saturday",
      type: "Deep Work Day",
      goal: "Finish this week's coaching syllabus.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Module & Selected PYQs", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Solutions", label: "Liquid Solutions Module", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Differentiation", label: "Methods of Differentiation Module", category: "Coaching (70%)" },
        { subject: "Physics", chapterName: "Electrostatics", label: "Electrostatics Violet (1 hr)", category: "Backlog (30%)" },
        { subject: "Chemistry", chapterName: "Thermodynamics", label: "Thermodynamics Violet (1 hr)", category: "Backlog (30%)" }
      ]
    },
    "2026-07-26": {
      dayName: "Sunday",
      type: "Weekly Test & Analysis",
      goal: "Convert mistakes into revision tasks.",
      tasks: [
        { subject: "General", chapterName: "Coaching Test", label: "Morning Coaching Test (Full Length / Topic Test)", category: "Test" },
        { subject: "General", chapterName: "Test Analysis", label: "Afternoon Complete Test Analysis", category: "Analysis" },
        { subject: "Physics", chapterName: "Error Notebook", label: "Evening Physics Error Notebook Update", category: "Error Notebook" },
        { subject: "Chemistry", chapterName: "Error Notebook", label: "Evening Chemistry Error Notebook Update", category: "Error Notebook" },
        { subject: "Mathematics", chapterName: "Error Notebook", label: "Evening Mathematics Error Notebook Update", category: "Error Notebook" },
        { subject: "General", chapterName: "Weakest Topic", label: "Backlog: Weakest Topic Revision", category: "Backlog (30%)" }
      ]
    },
    "2026-07-27": {
      dayName: "Monday",
      type: "Coaching Day",
      goal: "Stay caught up with zero lag.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Numericals", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Hydrocarbons", label: "Hydrocarbons Lecture 2", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Applications of Derivatives", label: "Applications of Derivatives Lecture", category: "Coaching (70%)" },
        { subject: "Physics", chapterName: "Electrostatic Potential and Capacitance", label: "Capacitors Lecture", category: "Backlog (30%)" }
      ]
    },
    "2026-07-28": {
      dayName: "Tuesday",
      type: "Heavy Self Study (Deep Work)",
      goal: "Complete all coaching work before backlog.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Module Complete", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Hydrocarbons", label: "Hydrocarbons Module", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Applications of Derivatives", label: "Applications of Derivatives Module", category: "Coaching (70%)" },
        { subject: "Physics", chapterName: "Electrostatic Potential and Capacitance", label: "Capacitors Violet", category: "Backlog (30%)" },
        { subject: "Chemistry", chapterName: "Chemical Thermodynamics", label: "Thermochemistry Lecture", category: "Backlog (30%)" },
        { subject: "Mathematics", chapterName: "Quadratic Equations", label: "Quadratic Revision", category: "Backlog (30%)" }
      ]
    },
    "2026-07-29": {
      dayName: "Wednesday",
      type: "Coaching Day",
      goal: "No pending coaching work.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Numericals", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Solutions", label: "Liquid Solutions Numericals", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Differentiation", label: "Methods of Differentiation Advanced Questions", category: "Coaching (70%)" },
        { subject: "Physics", chapterName: "Electrostatics", label: "Electrostatics Indigo Practice", category: "Backlog (30%)" }
      ]
    },
    "2026-07-30": {
      dayName: "Thursday",
      type: "College + Light Study",
      goal: "Recovery + Consolidation Day.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Formula Revision", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Hydrocarbons", label: "Hydrocarbon NCERT Reading", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Applications of Derivatives", label: "Applications Revision", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Equilibrium", label: "Chemical Equilibrium Notes", category: "Backlog (30%)" },
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Formula Sheet (20 min)", category: "Daily Revision" }
      ]
    },
    "2026-07-31": {
      dayName: "Friday",
      type: "Coaching Day",
      goal: "Finish July with zero pending coaching work and measurable backlog reduction.",
      tasks: [
        { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Mixed Questions", category: "Coaching (70%)" },
        { subject: "Chemistry", chapterName: "Solutions", label: "Liquid Solutions Mixed Questions", category: "Coaching (70%)" },
        { subject: "Mathematics", chapterName: "Applications of Derivatives", label: "Methods + Applications Mixed Problems", category: "Coaching (70%)" },
        { subject: "Physics", chapterName: "Dual Nature of Radiation and Matter", label: "Modern Physics Introduction", category: "Backlog (30%)" },
        { subject: "Chemistry", chapterName: "Organic Chemistry - Basic Principles", label: "GOC Formula Revision", category: "Backlog (30%)" },
        { subject: "Mathematics", chapterName: "Complex Numbers and Quadratic Equations", label: "Complex Numbers Formula Revision", category: "Backlog (30%)" }
      ]
    }
  };

  var WEEKLY_RULES = {
    priorityOrder: [
      "1. Coaching Lectures",
      "2. Coaching Homework",
      "3. Module",
      "4. Backlog",
      "5. Revision"
    ],
    dailyChecklist: [
      "Update Error Notebook",
      "Revise Formula Sheet (20 min)",
      "Mark completed tasks",
      "Carry unfinished backlog forward, never unfinished coaching work"
    ],
    coachingTopics: {
      Physics: ["Current Electricity"],
      Chemistry: ["Liquid Solutions", "Hydrocarbons"],
      Mathematics: ["Methods of Differentiation", "Applications of Derivatives"]
    },
    backlogTopics: {
      Physics: ["Electrostatics", "Capacitors", "Calorimetry", "Thermal Expansion"],
      Chemistry: ["Thermodynamics", "Thermochemistry", "Chemical Equilibrium", "Ionic Equilibrium", "GOC"],
      Mathematics: ["Quadratic", "Complex Numbers", "Sequence & Series", "Binomial"]
    }
  };

  function findMatchingChapter(chapters, subject, name) {
    if (!chapters || !Array.isArray(chapters)) return { id: "gen_" + name, subject: subject, chapter: name };
    var normName = name.toLowerCase();
    
    var found = chapters.find(function (c) {
      if (subject !== "General" && c.subject.toLowerCase() !== subject.toLowerCase()) return false;
      var cNorm = c.chapter.toLowerCase();
      return cNorm.includes(normName) || normName.includes(cNorm);
    });

    if (found) return found;

    found = chapters.find(function (c) {
      var cNorm = c.chapter.toLowerCase();
      return cNorm.includes(normName) || normName.includes(cNorm);
    });

    return found || { id: "custom_" + subject + "_" + name, subject: subject, chapter: name };
  }

  function getScheduleForDate(dateStr, chapters) {
    var dayInfo = JULY_SCHEDULE[dateStr];
    
    // Fallback generator strictly constrained to July syllabus scope
    if (!dayInfo) {
      dayInfo = {
        dayName: "July Roadmap Day",
        type: "Coaching & Backlog Focus",
        goal: "Maintain 70% Coaching & 30% Backlog balance.",
        tasks: [
          { subject: "Physics", chapterName: "Current Electricity", label: "Current Electricity Numerical Practice & Coaching Notes", category: "Coaching (70%)" },
          { subject: "Chemistry", chapterName: "Solutions", label: "Liquid Solutions & Hydrocarbons Practice", category: "Coaching (70%)" },
          { subject: "Mathematics", chapterName: "Differentiation", label: "Methods of Differentiation & AOD Practice", category: "Coaching (70%)" },
          { subject: "Physics", chapterName: "Electrostatics", label: "Electrostatics & Thermodynamics Backlog Review", category: "Backlog (30%)" }
        ]
      };
    }

    var formattedMissions = dayInfo.tasks.map(function (task) {
      var chapterObj = findMatchingChapter(chapters, task.subject, task.chapterName);
      return {
        chapter: chapterObj,
        reason: task.category + " • Day Goal: " + dayInfo.goal,
        action: {
          kind: task.category.indexOf("Backlog") >= 0 ? "backlog" : (task.category.indexOf("Test") >= 0 ? "test" : "resource"),
          label: task.label
        }
      };
    });

    return {
      dateStr: dateStr,
      dayName: dayInfo.dayName,
      type: dayInfo.type,
      goal: dayInfo.goal,
      mission: formattedMissions
    };
  }

  return {
    JULY_SCHEDULE: JULY_SCHEDULE,
    WEEKLY_RULES: WEEKLY_RULES,
    getScheduleForDate: getScheduleForDate
  };
})();

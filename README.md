# Project December

A personal, offline-first cockpit and operating system for JEE preparation — built for Avi.

Not a simple to-do app. Not a generic notes app. This is a highly integrated JEE cockpit: open it, and it immediately tells you what to study, what to revise, and what is slipping, backed by a real-time, non-destructive state engine.

## Running the Application

Open `index.html` directly in any web browser. No compilation, no backend server, no local installers, and no active internet connection required. Data is stored and persists securely in `localStorage` on the machine you open it on.

---

## Architecture Overview

Project December is built as a highly structured, full-featured client-side single-page application using vanilla ES5/ES6 JavaScript and Tailwind CSS. The architecture is deliberately designed to run on a standard local filesystem (via `file://` protocol) without needing an HTTP server. It follows an **offline-first, model-store-controller** philosophy.

```
                  ┌──────────────────────┐
                  │      index.html      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │       app.js         │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │      router.js       │
                  └──────┬────────┬──────┘
                         │        │
           ┌─────────────┘        └─────────────┐
           ▼                                    ▼
┌──────────────────────┐             ┌──────────────────────┐
│     Pages (UI)       │             │     Components       │
│  (Dashboard,         │ ──────────> │   (Navigation,       │
│   Tracker, Planner)  │ <────────── │    ChapterCard,      │
└──────────────────────┘             │    ResourceList)     │
           │                         └──────────────────────┘
           │                                    │
           │       ┌──────────────────────┐     │
           └─────> │    Services (Logic)  │ <───┘
                   │ (Health, Progress,   │
                   │  Revision, Planner)  │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │    State & Store     │
                   │  (chapterState.js,   │
                   │      store.js)       │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │     localStorage     │
                   └──────────────────────┘
```

1. **State Store (`PD.Store`)**: The single source of truth for the application. It handles state initialization, automatic schema version checking and migration, change subscription, and syncing to `localStorage`.
2. **Syllabus Layer (`PD.ChapterState`)**: Establishes the core 99-chapter JEE syllabus across Chemistry, Physics, and Mathematics with baseline confidence ratings, task configurations, and starting health scores.
3. **Core Services (`PD.Services.*`)**:
   - **Health**: Computes real-time chapter health scores (0-100%) by factoring in study confidence, elapsed time since last study/revision, and completed study resources.
   - **Revision**: Determines active and future spaced-repetition schedules, computing precise dates, interval scaling, and overdue/due-today status.
   - **Progress**: Measures task completion and resource coverage metrics for each chapter.
   - **Planner**: Generates structured, high-yield action plans prioritizing overdue work and suggesting logical step-by-step next study actions.
   - **StudySession**: Tracks active study sessions, live Pomodoro timer state, and study logs.
   - **WeeklyPlanner**: Manages time-blocked weekly schedules and capacity limits.
   - **ErrorNotebook**: Captures, tags, and tracks mistakes and question errors by chapter and concept.
   - **Shortcuts**: Handles global keyboard shortcuts (`t`, `p`, `a`, `w`, `m`, `r`, `e`, `s`, `?`).
   - **Analytics**: Calculates aggregate performance metrics, SVG chart data, heatmaps, and JEE completion forecasting.
4. **Router (`PD.Router`)**: A minimal, hash-based client router that supports clean route changes, entry transitions, and deep linking handoffs between pages.
5. **Pages & Components (`PD.Pages.*`, `PD.Components.*`)**: Purely declarative render functions. The Tracker Page operates on a non-destructive DOM preservation system, ensuring fast, interactive search and filtering with zero DOM layout lag.

---

## Folder Structure

```
project-december/
├── index.html            # Main entry point; loads all scripts in dependency order
├── metadata.json         # Platform configuration & metadata declarations
├── package.json          # Development and build tooling configuration
├── smoke-test.js         # Complete automated integration & UI smoke test suite
├── css/
│   ├── animations/       # CSS transitions (route fades, dialogs)
│   ├── components/       # Styles for reusable layout, cards, and toolbars
│   ├── pages/            # Styles specific to Dashboard, Tracker, Planner, and Placeholders
│   ├── themes/           # Configurable theme definitions (dark.css and light.css)
│   └── utilities/        # Core variables and reset rules
├── js/
│   ├── app.js            # Bootstraps the app, handles keybinds, and mounts elements
│   ├── router.js         # Client-side hash-based router with deep-link consumption
│   ├── store.js          # Persistent store with automatic database migration
│   ├── state/
│   │   └── chapterState.js # Canonical 99-chapter syllabus seed and data model
│   ├── services/
│   │   ├── dashboard.js  # Pure selectors deriving data for Dashboard sections
│   │   ├── health.js     # Health score calculation rules
│   │   ├── planner.js    # Subject-balanced daily mission logic
│   │   ├── progress.js   # Resource and task completion metrics
│   │   └── revision.js   # Spaced repetition scheduling engine
│   ├── components/
│   │   ├── chapterCard.js  # Card element controller with interactive detail panels
│   │   ├── navigation.js   # Main layout sidebar
│   │   ├── resourceList.js # Interactive sub-resource checklist (PYQs, Coaching, etc.)
│   │   └── trackerToolbar.js # Search, sort, and filtering controls
│   ├── pages/
│   │   ├── dashboard.js  # Unified visual dashboard cockpit
│   │   ├── planner.js    # Personalized study-path scheduler
│   │   ├── tracker.js    # Dynamic 99-chapter board with live state updates
│   │   └── placeholder.js# Honest placeholder rendering for upcoming phases
│   └── utils/
│       └── dom.js        # DOM creation, selection, and query helpers
└── docs/
    └── CHANGELOG.md      # Historical log of features, fixes, and design tradeoffs
```

---

## Major Features & Current Capabilities

* **Full 99-Chapter Syllabus**: Includes the complete JEE syllabus across Chemistry, Physics, and Mathematics mapped onto structural cards.
* **Instant Filtering & Preserved DOM Sorting**: Flat lists are highly searchable. Filtering and sorting (by Health, Alphabetical, Subject, Confidence, and Recency) happen in-place without destroying DOM nodes, maintaining perfect input focus and click responsiveness.
* **Dynamic Study Status & Health Trackers**:
  - **Color-Coded Status Bar**: Displays real-time status visual indicators (Grey: Not Started, Red: Not Done, Yellow: Somewhat Done, Green: Done Nicely).
  - **Health Score (0-100%)**: Driven by confidence, revision intervals, decay rate, and completed resources.
* **Dynamic Resource Checklists**: Chapters support adding and removing study resource trackers across 9 standard types (NCERT, PYQs, Coaching Theory, Mind Map, etc.) with progressive completion cycles (Not Started, In-Progress, Done) that feed directly back into chapter health and progress.
* **Space-Repetition Revision Tracking**: Allows logging study and revision actions, instantly updating next-revision dates and tracking consecutive revision streaks.
* **Intelligent Subject-Balanced Planner**: Generates actionable, daily study missions based on start date. Recommends resource-level next actions rather than abstract titles, prioritizing weak and overdue work. Includes a 7-day completion and planning forecast.
* **Dashboard Cockpit**: Displays Today's Mission, an urgent Revision Queue, Continue Studying, Weakest Chapters, Recharts Study Consistency graph, and Overall progress widgets with deep links directly opening and expanding targeted cards in the Tracker.
* **Interactive Focus Workspace**: Implements a dedicated Focus Workspace (`#/workspace`) with integrated Pomodoro Timer, customizable ambient sounds, chapter switcher, notes editor, and live Gemini AI Study Assistant sidebar.
* **Error Notebook & Mistake Vault**: Dedicated error tracker (`#/error-notebook`) for capturing questions, mistake types (conceptual, calculation, misread), resolution status, and review frequency.
* **Interactive Analytics & Diagnostic Engine**: Pure SVG interactive charts (`#/analytics`), 30-day trends, weekly hours distribution, subject donut breakdown, weak chapter heatmaps, and JEE completion date forecasting.
* **Settings & Data Backup**: Full settings controls (`#/settings`), appearance toggles, custom goals, spaced-repetition tuning, JSON export/import backups, and modal-confirmed resets.
* **Global Keyboard Shortcuts**: Quick navigation across views (`g d`, `g t`, `g p`, `g w`, `g a`, `g s`) and quick actions (`/` to search, `?` for shortcuts overlay, `Alt+C` for AI Chat).

---

## Technical Highlights

1. **Zero External Dependencies**: Beyond standard UI styling utilities, the entire operating system runs on pure vanilla JS without framework runtime overhead.
2. **Offline-First & Local Storage**: Data is saved instantly to `localStorage` with versioned schema migrations (`projectDecember.schema.v1` -> `v2`).
3. **Responsive SVG Visualizations**: All analytics charts are native inline SVG graphics with hover tooltips and interactive heatmap chips.

---

## Instructions for Future Development (Phase 5+)

When proceeding with development for subsequent phases (such as Phase 5: Analytics and Phase 6: Settings):
1. **Maintain Pure Functions**: Keep logic decoupled from the rendering layer. All dashboard, calendar, and planning metrics must remain pure projections of the core `PD.Store` dataset.
2. **Preserve DOM Instances**: For high-density pages (like the 99-card Tracker), avoid full component destruction during search/filter operations. Keep the DOM nodes static and toggle class names or re-order elements within their layout containers.
3. **Extend the Migration Engine**: If additional state variables or model fields are introduced, increment the `CURRENT_VERSION` in `js/store.js` and add a corresponding parser mapping block to migrate prior structures elegantly.

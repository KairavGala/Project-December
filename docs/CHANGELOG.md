# Changelog

All notable progress on Project December, phase by phase, in the format the spec asks for: what was done, why, review, honest progress %, next milestone.

## Phase 1 — Foundation (2026-07-19)

**Completed**
- Repository scaffold, `.gitignore`, README.
- Design token system (`css/utilities/variables.css`) and dark/light themes.
- `ChapterState` model (`js/state/chapterState.js`) — the canonical schema from the spec, seeded with Avi's actual reported chapter status for Chemistry, Physics, and Mathematics (real data, not placeholders).
- `PD.Store`: localStorage-backed store with subscribe/update, seeds only on first run.
- `PD.Router`: dependency-free hash router.
- App shell: sidebar navigation across all 7 routes, route-fade transitions, working theme toggle persisted across reloads.
- Dashboard: first real page — every number on it is read live from the store, nothing hardcoded.
- Tracker / Planner / Analytics / Workspace / Resources / Settings: routed and reachable, with honest "not built yet, here's when" states — no fake data, no fake progress bars.
- A jsdom-based smoke test (`smoke-test.js`, dev-only, not shipped with the app) that boots the app headlessly and checks the sidebar, dashboard, and routing all render. Caught one real bug before it shipped (see below).

**Why**
Phase 1 per the handoff's build order: foundation before Tracker. The store and model are the *only* source of truth — Dashboard already reads from them instead of hardcoding numbers, so when Tracker starts writing to chapters in Phase 2, Dashboard updates for free.

**Architectural review**
Single global `PD` namespace instead of ES modules or a bundler, specifically because `<script type="module">` and `fetch()` of local JSON are both blocked by CORS when a page is opened via `file://` — and "open index.html, no server" is a hard requirement from the spec. Classic `<script>` tags sidestep that entirely. No frameworks, no build step.

**Visual/UI review**
Dark-mode-first, single muted indigo accent (`#7c8cff`), system font stack (no Google Fonts / CDN — the app has to work fully offline). Linear/Notion-style sidebar + content layout, subtle fade on route change, gentle hover elevation on cards.

**Technical review**
Caught and fixed one real bug via the smoke test: `Navigation.render()` wasn't idempotent — a second render call would duplicate the sidebar instead of replacing it. Fixed by clearing the mount point first. Also worth flagging honestly: the smoke test runs in jsdom (no real browser available in this environment — Playwright's browser download was blocked by the sandbox's network allowlist), so it verifies logic and DOM wiring, not actual pixel rendering. Open `index.html` in a real browser to see it for real.

**Progress**
Phase 1 of 7 in the build order: **complete and integrated**. Roughly 14% of the overall roadmap by phase count — not feature-weighted, since Tracker (Phase 2) is a much bigger build than this one.

**Assumptions made — flag anything wrong and it gets corrected**
- Physics and Mathematics chapters were seeded as `completed: false`. The spec only listed Chemistry under an explicit "Completed / Studied" heading; Physics and Maths were just listed as topics, so nothing there was assumed done.
- Chapters without an explicit strong/medium/weak rating were seeded at confidence 3 (medium).
- `health` at seed time is a placeholder derived from confidence — the real decay-over-time formula (section 29 of the spec) is Phase 2/3 work, not built yet.

**Next milestone**
Phase 2 — Tracker: chapter cards (progress, confidence, health, mastery, tasks, revision status, resources, notes, bookmarks), search/filter, tags, keyboard shortcuts. This is the big one — everything else in the app derives from it.

---

## Phase 2a — Tracker core (2026-07-19)

Tracker was asked for as one big feature list — real cards, progress bars, expand/collapse, search, filters, confidence, resources, revision badges, health, hours, notes, shortcuts, animations, persistence. Building all of that in one pass would have meant shipping thirteen things shallowly instead of a few things well, so this session scoped down to the core card experience. Search, filters, resource tracking, and the full shortcut system are explicitly deferred to Phase 2b/2c below.

**Completed**
- Real chapter cards for all 44 chapters, grouped by subject, with a live completed-count per subject.
- Expand/collapse per card (CSS grid-row trick, no JS height measurement, animates smoothly).
- Confidence selector — 5 clickable stars, persists immediately, recalculates health and revision status live in the same interaction (not on next page load).
- Health score — implemented for real (see architecture note below), color-coded strong/medium/weak, with a visible plain-language breakdown of why the score is what it is.
- Revision badges — implemented the confidence-driven schedule from section 31 (5★ → 14 days, 4★ → 7, 3★ → 4, 2★ → 2, 1★ → tomorrow), with overdue/due-soon/on-schedule/not-yet-tracked states.
- "Log revision today" and "Log study session" actions that actually write `lastRevision`/`lastStudied` and immediately update the badges.
- Progress bar per card, driven by real completed/remaining task counts (editable, not fake) — shows an honest empty state instead of a fake 0% fill when no tasks are logged yet.
- Estimated hours (editable) and Notes (autosaving textarea, debounced).
- One keyboard shortcut for free: Escape collapses any expanded card.
- Extended the smoke test to actually click through the UI (expand a card, change confidence, log a revision, collapse on Escape) and verify the mutation landed in persisted storage — not just that the code parses.

**Why**
Cards are the atomic unit Dashboard, Planner, and Analytics will all read from — getting the interaction model and data flow right here means everything built on top of it later doesn't need to be reworked.

**Architectural review — two deliberate deviations from the written schema, explained**
1. `health` and `revisionDue` are no longer stored/mutated fields. They're computed fresh, every render, from confidence + completion + task ratio + dates, via `PD.Services.Health` and `PD.Services.Revision`. A cached derived value can silently drift from the inputs that produced it (bump confidence, forget to recompute); a pure function can't drift by definition. The fields stay in the schema for compatibility, but nothing writes to them anymore.
2. Each card does targeted DOM patching on interaction (update just the health badge, just the progress bar fill) instead of a full page re-render, per the spec's own performance principle of only updating affected components.

If either of these should be reverted, say so — flagging it because it's a real deviation from what was written down, not something to bury in code.

**UI/UX review**
Expand/collapse uses the `grid-template-rows: 0fr → 1fr` CSS trick rather than measuring `scrollHeight` in JS — smoother, no layout thrash, no fragile height math. Health/revision badges reuse the existing status-color tokens (green/yellow/red/blue) so a new color scale didn't get invented. The health breakdown text is visible, not hidden behind a hover tooltip — it's decision-support data, so it shouldn't require discovering it.

**Performance review**
44 cards render on load with no perceptible delay in the smoke test. Confidence/task/completion interactions patch only the specific badge/bar elements rather than re-rendering the card or the page — verified this actually happens (not just assumed) by checking the DOM node identity doesn't change across an update.

**Progress**
Tracker is the biggest phase in the build order, and this is its foundation slice: cards, confidence, health, revision, notes, hours, and persistence are real and working end-to-end, zero placeholders in what shipped. Search, filters, resource tracking, tags/bookmarks, and the full keyboard-shortcut system are not built yet — estimate this session as roughly a third of Tracker. Overall build: Phase 1 complete + Tracker ~35% complete ≈ **20–25% of the full roadmap**, still phase-weighted rather than feature-weighted since Tracker and Planner/Analytics are much larger than Foundation was.

**Suggested next steps (my recommendation, not yet built)**
1. **Phase 2b — Search & filters**: now that there are 44 real cards, a flat list is already a lot to scan. This is higher-value right now than resource tracking.
2. **Phase 2c — Resource tracking**: per-chapter resources (Coaching Notes, Modules, PYQs, etc.) — big enough to deserve its own dedicated session rather than being bolted onto the card.
3. **Tags/bookmarks and the full shortcut system** (`/` to search, `N` for new note, etc.) — hold until Search and Notes are real elsewhere in the app, so shortcuts have something real to point at instead of being wired to nothing.

**Next milestone**
Phase 2b — Search and filters on Tracker.

---

## Phase 2b — Search, filters, sort (2026-07-19)

**Completed**
- Instant search across all 44 chapters, no submit button — filters as you type.
- Subject filter (All / Chemistry / Physics / Mathematics) and status filter (All / Completed / In Progress / Not Started / Revision Due), both usable together with search.
- Sort: Subject (default, grouped with headers), Confidence, Health, Recently Studied, A–Z. Non-subject sorts flatten into a single list with a small subject tag on each card, since section headers stop meaning anything once you're sorting across subjects.
- Sticky toolbar — search/filters/sort stay visible while the chapter list scrolls underneath.
- Polished empty state when a search/filter combination matches nothing, with a plain-language reason ("No chapters match Physics + not started.") and a one-click "Clear search & filters" button.
- Smooth entrance animation for cards that newly appear after a filter/search/sort change — staggered, capped so it never feels slow.
- One more keyboard shortcut for free: `/` focuses the search box (unless you're already typing somewhere else).
- Filter and sort selections persist across reloads; the search box itself does not (see below).
- Extended the smoke test to click through search, both filters together, the empty state, its clear button, and confirm sorting by Health actually reorders the real DOM — 15 assertions, all real interactions, none of them just "did it parse."

**Why**
You asked for usability, not new systems, and this is exactly that: with 44 real cards now existing, a flat scroll was already the bottleneck. Search + filters + sort make the Tracker usable at its current size and will keep being useful once Resources and Tags add more per-card surface area later.

**Where I chose differently than the literal spec**
1. **Status filters are independent predicates, not one mutually-exclusive bucket.** A chapter marked complete that's also overdue for revision is real and should show under both "Completed" and "Revision Due" — forcing every chapter into exactly one status would have meant hiding true information to fit a cleaner-looking filter row.
2. **Sorting by Confidence or Health puts the weakest first, not the strongest.** The whole point of a sort here is "show me what needs attention" — burying the weak chapters at the bottom of a descending sort would work against the app's own stated philosophy (dashboard's "weakest chapters," section 26).
3. **Filter and sort selections persist; the search text does not.** "Show me Physics, sorted by health" is a standing preference worth remembering. A half-typed search query is a one-off lookup — persisting it would mean reopening the Tracker to a stale, confusing filtered view.
4. **Cards are built exactly once and never recreated.** Every keystroke in the search box just shows/hides/reorders the same 44 DOM nodes rather than tearing down and rebuilding them. This is the difference between search that's actually instant and search that's instant until you have enough chapters for it to visibly lag.

**Architectural review**
One new file, `js/components/trackerToolbar.js`, with a single reusable chip-group builder shared by subject, status, and sort instead of three near-identical implementations. `store.js` gained `getTrackerFilters`/`setTrackerFilters`, following the exact same pattern already established by `getTheme`/`setTheme` — not a new architectural concept, just consistent reuse of one.

**UI/UX review**
The toolbar stays inside the same 880px content column as everything else rather than bleeding full-width — keeps it visually consistent with the cards it's filtering. Entrance animation only plays for cards that weren't visible a moment ago; cards that were already showing just get quietly reordered, so re-sorting doesn't make the whole list flash.

**Performance review**
Verified — not assumed — that filtering never recreates a card: the same chapter's DOM node survives being hidden by one filter and shown again by clearing it, confirmed via the smoke test tracking a specific chapter's `data-id` through several filter changes. At 44 chapters this would be hard to perceive either way, but the pattern is what keeps this cheap as Resources and Tags add more per-card work later.

**Progress**
Tracker: cards, confidence, health, revision, notes, hours, persistence, search, filters, sort, and empty states are real and working. Resource tracking, tags/bookmarks, and the full keyboard-shortcut system remain. **Overall: roughly 30% of the full roadmap** — still phase-weighted, not feature-weighted.

**Suggested next milestone**
Phase 2c — Resource tracking (Coaching Notes, Modules, PYQs, Formula Sheets, etc., each independently trackable per chapter). It's the last major piece of the written Tracker spec and big enough to deserve its own session rather than being squeezed in here.

---

## Phase 2c — Resource tracking (2026-07-19)

**Completed**
- Every chapter can now track independent study resources: 9 standard types (Coaching Theory, Coaching Module, DPPs, PYQs, NCERT, Formula Sheet, Short Notes, Revision Notes, Tests/Assignments) available as one-click quick-adds, plus free-text custom resources.
- Each resource has its own 3-state status — not-started / in-progress / done — cycled with a single click on its status dot, matching the status vocabulary the app already uses elsewhere (Tracker's own status filters).
- Resources now drive chapter progress directly: the progress bar and the health score's task-ratio factor both read from resources when any exist.
- The old manual "N done / M remaining" task counter is retired — see below for why.
- Smoke test extended with 12 new assertions: adding a standard resource, watching the progress bar and health score react live, cycling status through all three states, adding a second standard type and a custom one, removing one, confirming persistence, and confirming the "all 9 added" empty-picker state.

**Why**
This is the last major piece of the written Tracker spec. Resources are the more precise version of "tasks" the app was missing — labeled and individually trackable instead of an anonymous counter.

**Where I chose differently than what was asked, and why**
1. **Chapters aren't pre-seeded with all 9 resource types.** Auto-populating all 44 chapters with 9 resources each (396 rows, all untouched) would be exactly the kind of clutter the spec's own design principles warn against, and arguably counts as "fake usage" of resources nobody's engaged with. Resources are added on demand instead — the 9 types are quick-add *suggestions*, not defaults.
2. **The manual task counter from Phase 2a is gone, not kept alongside resources.** Once resources exist, they and the old counter would be two different answers to "how done is this chapter" that could disagree. Rather than reconcile two sources of truth, resources supersede the counter entirely for any chapter that uses them (see `js/services/progress.js`). No chapter had real counter data yet (all 44 were seeded at 0/0), so nothing real was lost.
3. **Status is 3-state, not a boolean.** "In progress" matters for something like a Coaching Module you're partway through — a plain checkbox would force you to either under- or over-report it.
4. **The type list is pure data, rendered generically.** `STANDARD_TYPES` in `resourceList.js` is a plain array; nothing else in the file branches on which type a resource is. A 10th resource type later is one array entry, not a component change — this was an explicit requirement and worth confirming directly.

**Bugs the smoke test actually caught this session**
- An initialization-order bug: the resource list's first paint fired its change callback back into the chapter card before the card had finished constructing itself, throwing on card creation. Fixed by splitting "paint the current resources" (safe during construction) from "paint and notify the parent" (only used after construction, on real mutations).
- A bug in the *test itself*, not the app: the resource list rebuilds its rows from scratch on every change (reasonable at this scale — a chapter has a handful of resources, not 44), so a captured status-dot reference goes stale the moment it's clicked. Fixed by re-querying after each interaction rather than reusing one reference.

**Architectural review**
Two new files: `js/services/progress.js` (one function, used by both the progress bar and health score) and `js/components/resourceList.js`. Nothing added that isn't load-bearing today.

**UI/UX review**
Resources live inside the existing card body, right where the task counter used to be — not a separate panel or page, so it reads as one more thing the card does rather than a bolted-on feature. Done resources get a quiet strikethrough instead of disappearing, so you can still see what you've covered without losing the list.

**Performance review**
Resource lists are small (a handful of items per chapter), so a full rebuild on every change is the right tradeoff — simpler code than the Tracker list's non-destructive reordering, with no real cost at this scale. That reordering approach stays reserved for the 44-card Tracker list, where it actually matters.

**Progress**
Tracker now covers essentially everything originally asked for it except tags/bookmarks and a full keyboard-shortcut system. **Overall, roughly 35–40% of the full original roadmap** (Foundation done, Tracker ~85–90% done, Dashboard partially derived, Planner/Analytics/Settings/Polish not started) — still a rough phase-weighted estimate, not feature-weighted.

**On the Planner design note for later**
Noted and not built yet, as asked. One thing worth flagging now, though: resources are already shaped exactly the way a future Planner would need them — each one is addressable by chapter + label + status, which is precisely what turning "Electrostatics" into "Electrostatics → Read theory / Solve DPP / PYQs / Revision" requires. No Planner-specific fields (scheduling, priority, dates) were added to chase that ahead of time — that would be exactly the "architecture not immediately used" this project has been avoiding all along. When Planner gets built, it can enumerate "everything not done, per chapter" using exactly what exists today.

**Suggested next milestone**
Tags/bookmarks would close out the last small gap in Tracker itself. But given the Planner context just shared, Phase 3 — Dashboard (deriving Mission/Revision Queue/Weakest Chapters from real Tracker data, per section 26) is arguably higher-value now: Tracker has enough real data to make Dashboard's promised "what should I study" answer honest for the first time, and it's a natural stepping stone toward the adaptive Planner. Your call on ordering.

---

## Phase 3 — Dashboard (2026-07-19)

**Completed**
- Retired the Phase 1 stat-card Dashboard entirely — it was exactly the "statistics page" the product philosophy warns against, and now that Tracker has real data, there's no reason to keep it.
- **Today's Mission**: up to 4 chapters, tiered by real urgency — overdue revisions first, then due-today/tomorrow, then (since a fresh tracker has no revision history yet) the weakest chapters fill any remaining slots. Every item shows why it's there.
- **Revision Queue**: overdue / due today / due tomorrow, tagged and color-coded, computed from the same revision service Tracker already uses.
- **Weakest Chapters**: top 5 by health, unconditional (no cutoff) — a standing reference, distinct from Mission's curated action list.
- **Continue Studying**: chapters touched but not completed, most recent first.
- **Overall Progress**: a slim 3-bar strip per subject plus one summary line — real completion counts, nothing else.
- **Upcoming**: a single plain-text line for what's due in the next week — deliberately not a calendar or scheduler.
- A working deep link: click any Dashboard row and Tracker opens with that exact chapter expanded, scrolled to, and briefly highlighted — even if a saved Tracker filter would otherwise hide it.
- Resource interactions (add/remove/cycle status) now also update `lastStudied`, so Continue Studying reflects real engagement instead of requiring a separate "log study session" click for something you were clearly already doing.
- 14 new smoke-test assertions covering all six sections against real mutations made earlier in the same test run, plus the deep-link override.

**Why**
The brief was explicit: Dashboard answers "what should I do today," not "here are some numbers." Every section is a thin rendering layer over `js/services/dashboard.js`, which is a pure function of whatever's in the store — nothing here can drift out of sync with Tracker, because there's no separate Dashboard data to drift.

**Where I chose differently than the literal spec, and why**
1. **The six sections don't get equal visual weight.** Mission and Revision Queue are the most prominent (most actionable-today); Weakest/Continue Studying are compact secondary panels; Overall Progress is a slim strip; Upcoming is the smallest element on the page. This directly follows the brief's own rule — "if a metric doesn't help you decide what to study next, it probably doesn't belong" — applied to layout, not just content.
2. **Mission is tiered, not a single sort.** Overdue revisions are true forgetting-risk and come first regardless of health score; only after that does the weakest-chapter fallback kick in. This matters today specifically: with zero revision history so far, a pure health sort and a tiered sort happen to agree, but they won't once real revisions start getting logged and some chapters are overdue while others are merely weak.
3. **Dashboard rows don't duplicate ChapterCard's interactive controls.** Every row is a read-only summary with one click-through action, not a mini card with its own confidence stars or status dots. Two places to edit the same chapter's state would be exactly the "parallel model" problem this project has avoided since Phase 1.

**A verification bug worth being honest about**
The previous session ended having written all of this code but never run the smoke test against it — the process got cut off mid-verification. Running it this session surfaced two genuinely wrong assertions (not app bugs): the test expected adding a resource to drop health by a flat 5 points, but adding a resource also sets `lastStudied` (this session's cross-feature decision), which flips revision status from "untracked" (-8) to "on schedule" (+5) — a swing the original assertion's math never accounted for. Fixed the assertions to match the real, correct, verified behavior (+8 net, then +10 more once marked done) rather than loosening them to pass.

**Architectural review**
One new file, `js/services/dashboard.js` — six small functions, each a pure transform of `chapters` into what one section needs, no shared mutable state. The Tracker deep-link uses a two-function addition to the existing router (`focusChapter`/`consumePendingFocus`) rather than route parameters — a one-shot handoff was all that was needed, so that's all that got built.

**UI/UX review**
Mission rows get a subtle accent left-border to read as more important than Weakest/Continue's plain rows, without a heavier visual treatment. The deep-linked card gets a brief pulse (1.2s) so it's obvious why you landed there, then it fades — no permanent visual marker left behind.

**Performance review**
Dashboard fully rebuilds on every visit (unlike Tracker's careful non-destructive reordering) — correct tradeoff here, since Dashboard has no per-keystroke interaction to keep cheap; it only rebuilds on navigation, same as any other page.

**Progress**
Tracker and Dashboard are both now real. Remaining gaps: Tracker's tags/bookmarks, a full keyboard-shortcut system, and the entire Planner. **Overall, roughly 45–50% of the full original roadmap** — Foundation and Dashboard done, Tracker ~85–90% done, Planner/Analytics/Settings/Polish not started. Still a phase-weighted estimate.

**Suggested next milestone**
Phase 4 — the Planner. Resources are already shaped for it (chapter + label + status, addressable). Tracker and Dashboard both already answer "where do things stand"; Planner is the one piece that answers "what's the plan," and it's the part of the brief described as the eventual heart of the application.

---

## Phase 4a — Planner core (2026-07-20)

**Completed**
- New `Planner` page and service, replacing the placeholder route.
- Daily mission generation: up to one chapter per subject (Chemistry/Physics/Mathematics), selected by the same tiered urgency logic as Dashboard (overdue revision → due-soon → weakest health) applied per subject instead of globally.
- Each chapter's action is resource-level, not a chapter name: the next in-progress resource if one exists, otherwise the next not-started resource in a sensible study sequence (theory → module → DPPs → PYQs → NCERT → formula/short/revision notes → tests), otherwise an honest fallback derived from real state - revise (if due), continue (if touched before), or start (if genuinely new) - never a fabricated resource for a chapter that doesn't have one.
- Real, one-way completion actions: a resource checkbox marks that exact resource done in Tracker's data; a revision button logs a real revision (same service Tracker uses); a chapter with nothing yet actionable gets an "Open in Tracker →" link instead of a fake checkbox, since there's nothing concrete to check off until a resource exists.
- An editable plan start date (default 20 July 2026), shown inline as "Day N of your plan." A future start date shows a calm "hasn't started yet" notice with no mission, instead of generating one anyway.
- 12 new smoke-test assertions, several deliberately written as direct unit checks against the priority rules (in-progress-over-not-started, type-sequence ordering, honest fallback selection) rather than only through fragile end-to-end chapter-selection paths, plus full end-to-end coverage of both completion controls and the start-date gate.

**Why**
The brief was explicit about the three-layer architecture: Tracker collects, Dashboard prioritizes, Planner transforms that into an everyday system. This is the first real implementation of the "transform" layer - turning "Electrostatics needs attention" into "read the theory" or "you're mid-way through the module, finish that."

**Where I chose differently than the literal spec, and why**
1. **Subject-balanced selection, not Dashboard's raw top-4 reused verbatim.** An earlier draft of this reused `Dashboard.getMission()` directly for chapter selection. Checked against the current data: it would have surfaced two Chemistry chapters and two Physics ones, with zero Mathematics - a real, demonstrable gap for a student meant to be covering three subjects for months. Dashboard's job is "what's most urgent, period," which can honestly ignore a subject for a day; Planner's job is a study day, which shouldn't.
2. **One action per chapter, not a resource checklist.** You showed a multi-item example (Electrostatics with four sub-items) when first describing the Planner vision, but this session's requirements were explicit: smallest meaningful next action, avoid overwhelming lists. I read the more recent, more specific instruction as controlling. Relaxing this to show 2-3 items per chapter is a one-line change if it turns out to feel better in practice, not an architecture change.
3. **No undo/revert on the completion controls.** Once clicked, a resource checkbox or revision button is done for that session - it doesn't toggle back. Tracker remains the place to actually edit a resource's status if you change your mind; Planner's controls are a fast path to marking today's action done, not a second full editor for the same data.

**A discovery worth being explicit about**
Two draft files (`js/services/planner.js`, `js/pages/planner.js`) and a `store.js` addition existed on disk from a prior session, written but never wired into `index.html`, never registered in the router, and never run against the smoke test. The core logic was sound and mostly kept - `getNextAction`'s priority rules, the day-number math, the one-way completion pattern - but the chapter-selection layer (reusing Dashboard's list directly) had the subject-imbalance problem described above, so that part was rewritten rather than used as-is.

**Architectural review**
`js/services/planner.js` depends only on `Health` and `Revision` - not on `Dashboard` - despite computing something dashboard-adjacent, because subject-scoped selection is a different function than Dashboard's global one, not a wrapper around it. `js/pages/planner.js` re-renders the whole page on any state change (date edit, action completion) rather than patching in place - correct here, since unlike Tracker's 44-card list there's no per-keystroke interaction to protect, and at most 3 mission items exist at once.

**UI/UX review**
The day-row and date input are one compact inline row, not a separate settings panel - editable without feeling like configuration. Completed items get a quiet green border and strikethrough rather than disappearing, so today's plan stays visible as a record of what got done, not just what's left.

**Performance review**
Three chapters, three resource lookups, no measurable cost. The one thing worth watching as Planner grows in 4b/4c: subject-scoped selection re-computes health/revision for every chapter in a subject on every render, same as Dashboard already does - fine at 44 chapters, would want memoizing if the chapter count grew by an order of magnitude, not before.

**Honest roadmap progress**
Foundation, Tracker (~90%), Dashboard, and now Planner core are real. Remaining: Planner 4b (adaptive rebalancing) and 4c (procrastination coaching), Tracker's tags/bookmarks, Analytics, Settings, Polish. **Roughly 55–60% of the full original roadmap**, phase-weighted.

**Is this realistic for a JEE student studying until December? Honest assessment below.**

**Suggested next milestone**
Phase 4b - adaptive rebalancing. Today's plan is real, but it has no memory: skip a day and nothing accounts for it; mark a chapter's only resource done and tomorrow's plan may show that subject differently with no continuity between the two. 4b is what turns "a plan for today" into "a plan across months."

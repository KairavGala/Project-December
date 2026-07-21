# Project December v1.0 — Release Notes

**Project December** is a desktop-grade, offline-first study operating system tailored for Joint Entrance Examination (JEE Main & Advanced) preparation. It provides a complete, local-first workflow for 99 official syllabus chapters across Physics, Chemistry, and Mathematics.

---

## 🚀 Key Features in v1.0

### 1. Dashboard & Today's Mission Cockpit (`#/dashboard`)
- **Today's Mission**: Dynamic daily study mission algorithm recommending high-priority tasks based on decay, overdue revisions, and resource status.
- **Revision Queue**: Auto-populated queue of chapters requiring immediate spaced repetition.
- **Continue Studying**: Picks up directly from where you last worked.
- **Weakest Chapters**: Ranks chapters needing immediate attention based on Health scores (< 50).
- **Overall Syllabus Progress**: Visual completion percentage tracking across all 99 chapters.

### 2. Full 99-Chapter Syllabus Tracker (`#/tracker`)
- **Official Syllabus**: 31 Physics, 33 Chemistry, and 35 Mathematics chapters.
- **Interactive Resource Trackers**: Support for 9 standard resource types (NCERT Reading, PYQs, Coaching Theory, Class Notes, Revision Notes, Formulas & Sheets, Video Lectures, Mock Tests, Mind Maps).
- **Chapter Health Engine**: Dynamic 0–100 health score computed using confidence, resource completion ratios, and spaced repetition decay.
- **Surgical Search & Filters**: Live search with zero layout shift, subject filters, completion status filters, and sorting (by Subject, Name, Health, Confidence, Revisions).
- **Deep Linking**: Seamlessly navigate to and auto-expand any chapter from other views.

### 3. Subject-Balanced Daily Planner (`#/planner`)
- **Daily Mission Engine**: Generates subject-balanced study plans based on plan start date.
- **Resource-Level Actions**: Directly points to specific uncompleted resources (e.g. "Complete PYQs") rather than abstract chapter titles.
- **Interactive Checkboxes**: Complete resource tasks directly from the Planner with instant synchronization to the Tracker.

### 4. Interactive Focus Workspace (`#/workspace`)
- **Pomodoro Timer**: Customizable focus and break timers with play, pause, reset, and audio chime options.
- **Ambient Sound Synthesizer**: Built-in Web Audio API generator providing White Noise, Rain, Cafe, and Forest ambient sounds.
- **Chapter Notes & Quick Switcher**: Integrated markdown-friendly notes scratchpad for the active chapter.
- **Gemini AI Study Assistant**: Full-stack API proxy integration providing instant conceptual help and problem hints without exposing API keys.

### 5. Error Notebook & Mistake Vault (`#/error-notebook`)
- **Mistake Logger**: Categorize errors by subject, chapter, topic, mistake type (Conceptual, Calculation, Silly Error, Time Pressure, Misread), and review status.
- **Filterable Mistake Grid**: Filter mistakes by subject, mistake type, or search keywords.

### 6. Analytics & Diagnostic Dashboard (`#/analytics`)
- **Overview Metrics**: Live counters for total study hours, tasks completed, revision cycles, and streak tracking.
- **Subject Performance Matrix**: Detailed breakdowns for Physics, Chemistry, and Maths.
- **6 Zero-Dependency Interactive SVG Charts**:
  1. 30-Day Daily Study Time Line Graph with SVG area gradients.
  2. Weekly Study Hours Bar Chart.
  3. Subject Hours Distribution Donut Chart.
  4. Confidence Level Distribution Histogram.
  5. Health Band Distribution Bar Chart.
  6. Revision Cycles Frequency Histogram.
- **Diagnostic Heatmaps**: Clickable badges highlighting weak chapters (<50 Health), overdue revisions, and cold topics.
- **JEE Target & Forecasting Engine**: Velocity calculations and projected completion dates.

### 7. Settings, Theme Customization & Data Backup (`#/settings`)
- **Visual Appearance**: Dark Mode, Light Mode, and System theme toggles; 5 live accent colors; custom font scaling.
- **Study Targets**: Configurable daily target hours, weekly goals, planner capacities, session lengths, and JEE exam target date.
- **Spaced Repetition Tuning**: Default revision interval, confidence flag thresholds, and health decay speed parameters.
- **Offline Data Backup & Restore**: Download single-file JSON backups, restore from JSON backups, or perform selective/full resets.

### 8. Global Keyboard Shortcuts
- Navigation: `g d` (Dashboard), `g t` (Tracker), `g p` (Planner), `g w` (Workspace), `g a` (Analytics), `g e` (Error Notebook), `g s` (Settings).
- Quick Search: `/` to focus search.
- Shortcuts Help: `?` overlay modal.

---

## 🏗️ Architecture & Technical Specs

- **Pure Vanilla Architecture**: Zero framework dependencies (React, Vue, etc.) for lightweight, instant-loading execution.
- **Single Source of Truth**: `PD.Store` handles state management, change notifications, and durable persistence in browser `localStorage`.
- **Zero-Shift DOM Rendering**: Non-destructive element reuse in lists to maintain performance across 99 chapters.
- **Offline First**: All study data, timers, ambient audio, and analytics run entirely client-side without external dependencies.
- **Full-Stack Gemini API Proxy**: Secure Express backend proxies AI Study Assistant queries via server-side `@google/genai` integration.

---

## 📌 Known Limitations

1. **Local Browser Storage**: Data persists in browser `localStorage`. For cross-device sync, use the JSON Backup & Restore feature in Settings.
2. **Audio Autoplay Rules**: Ambient audio synthesizers require user interaction on the page before playing audio, adhering to browser autoplay policies.

---

## 🔮 Future Roadmap (v2.0 Intentions)

- **Cloud Synchronization**: Optional Firebase/Firestore cloud backup for multi-device sync.
- **Full Mock Test Analytics**: Detailed score logging for full 300-mark JEE Mains and 180-mark Advanced test papers.
- **Custom Spaced Repetition Algorithms**: Anki-style SuperMemo SM-2 algorithm customization for granular card-by-card interval control.

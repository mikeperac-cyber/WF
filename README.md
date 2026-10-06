# Workflow Studio PRO — Next-Gen Curriculum & Productivity Flow Engine

An ultra-modern, high-performance visual workflow editor engineered specifically for **ESL language learning**, **IELTS preparation**, **Digital SAT acceleration**, **Elite College Admissions & Applications**, and **Ultra-Productivity Deep-Work Systems**.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Zustand**. **100% Pure Client-Side** with zero backend requirements, instantaneous reactivity, local serialization, and full offline support.

---

## 🌟 Key Upgrades & Architectural Enhancements

### 1. Light & Dark Theme Modes ☀️ 🌙
- **Seamless Theme Switcher**: Instant toggle between sleek dark cyber mode and high-contrast clean light mode in the top navigation bar.
- **Glassmorphic Tokens**: Dynamic backdrop blur, high-contrast light borders (`rgba(226, 232, 240, 0.9)`), and dark glow accents (`rgba(15, 23, 42, 0.78)`).
- **Adaptive Canvas Grids**: Dots, Orthogonal lines, and Crosshair patterns adapt automatically to light and dark backgrounds.
- **Persistent State**: Theme preference is automatically saved in `localStorage`.

### 2. BYOK (Bring Your Own Key) AI Integration ⚡ 🤖
- **Universal Multi-Provider Support**: Connect your own **Google Gemini**, **OpenAI**, **Anthropic Claude**, or **OpenRouter** API key.
- **Live Educational Inference**: Executes real AI evaluations for IELTS Task 2 essays, SAT problem breakdowns, ESL pronunciation/grammar clinics, and College personal statement story arcs.
- **Single-Node Sandbox Runner**: Test isolated nodes with real LLM diagnostics and see latency benchmarks directly in the inspector drawer.
- **Client-Side Privacy Guarantee**: API keys are saved exclusively in your browser's `localStorage` and called directly via HTTPS without any proxy or intermediary server.

### 3. Enhanced Connection Quality & High-Fidelity Edges
- **Multi-Color Gradient Connectors**: Dynamic SVG linear gradients harmonizing source and target node domain colors.
- **Multiple Routing Modes**: Switch seamlessly between **Smooth Cubic Bezier**, **Smart Orthogonal (Filleted Corner Manhattan Routing)**, and **High-Tension Curved** line styles.
- **Particle Energy Pulse Flow**: High-performance animated dashed particle pulses running along edges during active live workflow simulations.
- **Magnetic Port Snapping**: Real-time distance-based magnetic snapping indicator when dragging connection wires between node ports.
- **Interactive Midpoint Badges**: Display condition labels (e.g. `Band >= 8.0`, `Hard Module 2`, `Score >= 75%`, `Early Action / ED`), inline delete controls, and selection halos.
- **Multi-Port Support**: Top input port and distributed multi-branch output ports (`Pass`, `Fail`, `True`, `False`, `High`, `Low`, `Out`).

### 4. Five Pre-Loaded Domain Blueprints
1. **ESL CEFR Language Mastery Roadmap**:
   - Diagnostic placement from CEFR A1 through C2.
   - Spaced repetition vocabulary drills (Oxford 3000 & Academic Wordlist).
   - Advanced grammar syntax labs (clause inversion, subjunctive mood).
   - AI speech & pronunciation clinic with phoneme feedback.
   - Lexile adaptive reading checkpoints & C1 certification gate.
2. **IELTS 8.5+ Strategic Preparation Engine**:
   - 4-skill diagnostic baseline (Listening, Reading, Writing, Speaking).
   - Section 1-4 listening simulations with multi-accent distractors (UK, AUS, US).
   - Academic reading passages with True/False/Not Given and paragraph heading strategies.
   - AI Writing Task 1 & 2 essay grader (TR, CC, LR, GRA rubrics).
   - Speaking Part 1-3 examiner simulator.
   - Composite Band 8.5 score predictor & remedial feedback loop.
3. **Digital SAT 1550+ Master Accelerator**:
   - Full 1600-scale baseline diagnostic (Math 200-800, Reading/Writing 200-800).
   - Multistage adaptive routing gate (Hard vs Standard Module 2 simulation).
   - Advanced Math & Desmos graphing shortcut clinic.
   - Reading/Writing rhetorical synthesis, inference, and grammar rules.
   - Timed Bluebook full mock exam & root-cause error taxonomy logger.
4. **Elite College Application & Admissions Roadmap**:
   - Reach, Target, Safety university balance matrix (12-15 schools).
   - Common App 650-word personal statement iterative drafting.
   - 3x Letter of recommendation tracker (Counselor + 2 Teachers).
   - FAFSA & CSS Profile financial aid pipeline.
   - Nov 1 Early Decision (ED/EA) vs Jan 1 Regular Decision (RD) branching gate.
   - Alumni mock interview clinic & portal status sync.
5. **Ultra-Productivity & Deep Work Operating System**:
   - GTD Inbox capture and task triage dispatcher.
   - Eisenhower matrix priority quadrant classifier (Q1-Q4).
   - 90-minute ultradian deep work focus session with distraction shields.
   - Daily habit streak tracker (28-day chain).
   - Sunday weekly retrospective & calibration.

### 5. Live Simulation & Debugging Engine
- **Interactive Playback**: Play, Pause, Single-Step, and Reset simulation execution.
- **Speed Control**: Toggle execution speeds (`1.0x`, `2.0x`, `3.0x`).
- **Live Variables State Watcher**: Real-time table inspecting scores, CEFR levels, draft statuses, and habit streaks with inline editing.
- **Telemetry Console**: Searchable and filterable real-time event logs (Info, Success, Warning, Error) with timestamps.
- **Celebration Feedback**: Confetti burst upon successful workflow completion.

### 6. Saved Plans, Real Rules & Import (Build 1)
- **My plans library**: click the plan name in the top bar to create, open, rename, duplicate or delete plans. Everything auto-saves on this device (IndexedDB → localStorage → memory fallback); the ✓ next to the name shows save status.
- **Real branching rules**: each step's **Rules** tab lets you route by variables (e.g. `writingScore >= 7` → Pass), choose a fallback port, see a live preview of which way it will go, and set outputs that change variables (e.g. `mockCount + 1`).
- **Honest simulation**: runs follow those rules, loops are capped, the taken path is highlighted and skipped branches are dimmed. **Step** runs one node at a time; **Reset** restores starting variables.
- **Safe import**: imported JSON is validated and repaired, and always opens as a new plan.

### 7. Plan → Calendar + "Today" Execution Engine (Build 2)
- **Today Action View (`TodayView`)**:
  - **Milestone Countdown**: Tracks days remaining until your target exam (IELTS, SAT, etc.) or college admissions deadline.
  - **Daily Momentum & Streak**: Tracks consecutive study days with celebration confetti upon daily target completion.
  - **Integrated Deep Work Focus Timer**: Built-in 25m Pomodoro, 50m Deep Work, and 90m Ultradian timers linked directly to study tasks with auto-completion.
  - **"Never Miss Twice" Protection**: Detects missed or overdue tasks and smoothly rebalances them across the week without cramming.
- **Paced Study Calendar (`CalendarView`)**:
  - **Interactive Week & Month Views**: Visualizes workload by domain track (ESL = emerald, IELTS = sky, SAT = purple, College = amber, Productivity = rose).
  - **Automatic DAG Pacing**: Walks the node graph order, allocates tasks by daily study target (e.g. 60 min/day), and respects rest days (e.g. Sundays).
  - **Seamless View Switching**: Instant switching across **Today**, **Calendar**, and **Plan Graph** (canvas editor).

---

## 🚀 Getting Started

### One click (no terminal)
Double-click **`Workflow Studio (Offline).html`** on the Desktop, or **`Launch.bat`** in this folder.

### Developer commands
```bash
cd "C:\Users\mike\OneDrive\Desktop\WF"
npm install
npm run dev               # dev server
npm test                  # engine, storage & template-layout tests
npm run lint              # oxlint
npm run build             # production build → dist/
npm run build:standalone  # single offline HTML → dist-standalone/index.html
```

---

## 🔒 Zero Backend Architecture
This application is completely self-contained. All state management, DAG graph traversal, execution simulations, BYOK AI completions, and file imports/exports execute client-side in the browser.

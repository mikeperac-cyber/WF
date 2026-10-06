import type { ActionKind, DomainCategory, PortDefinition } from "@/types/workflow";

export type ActionDefinition = {
  kind: ActionKind;
  category: DomainCategory;
  label: string;
  badge: string;
  accent: string;
  borderGlow: string;
  icon: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultPorts: PortDefinition[];
  defaultData?: Record<string, any>;
};

export const ACTION_DEFINITIONS: Record<ActionKind, ActionDefinition> = {
  // ================= CORE & LOGIC =================
  trigger: {
    kind: "trigger",
    category: "logic",
    label: "Workflow Trigger",
    badge: "START",
    accent: "#6366F1",
    borderGlow: "rgba(99, 102, 241, 0.4)",
    icon: "Play",
    defaultTitle: "Diagnostic Trigger",
    defaultDescription: "Starts the personalized study or application roadmap automatically",
    defaultPorts: [
      { id: "out", label: "Triggered", type: "output", color: "#6366F1", tooltip: "Continuous forward execution" }
    ],
    defaultData: { triggerType: "event", frequency: "once" }
  },
  action: {
    kind: "action",
    category: "logic",
    label: "Generic Action",
    badge: "TASK",
    accent: "#3B82F6",
    borderGlow: "rgba(59, 130, 246, 0.4)",
    icon: "Zap",
    defaultTitle: "Execute Step",
    defaultDescription: "Runs an automated calculation or status transformation",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Next", type: "output", color: "#3B82F6" }
    ],
  },
  branch: {
    kind: "branch",
    category: "logic",
    label: "Conditional Branch",
    badge: "DECISION",
    accent: "#14B8A6",
    borderGlow: "rgba(20, 184, 166, 0.4)",
    icon: "GitFork",
    defaultTitle: "Score / Condition Evaluation",
    defaultDescription: "Routes student based on score threshold or task completion",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "true", label: "Passed / Yes", type: "output", color: "#10B981", tooltip: "When condition evaluates to TRUE" },
      { id: "false", label: "Needs Review / No", type: "output", color: "#EF4444", tooltip: "When condition evaluates to FALSE" }
    ],
    defaultData: { conditionField: "score", threshold: 80 }
  },
  delay: {
    kind: "delay",
    category: "logic",
    label: "Time Delay",
    badge: "PAUSE",
    accent: "#F97316",
    borderGlow: "rgba(249, 115, 22, 0.4)",
    icon: "Clock",
    defaultTitle: "Spaced Repetition Interval",
    defaultDescription: "Wait 24-48 hours before review to optimize memory retention",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "After Delay", type: "output", color: "#F97316" }
    ],
    defaultData: { delayHours: 24, reason: "Memory consolidation window" }
  },
  "wait-until": {
    kind: "wait-until",
    category: "logic",
    label: "Wait Until Date/Time",
    badge: "SCHEDULE",
    accent: "#D946EF",
    borderGlow: "rgba(217, 70, 239, 0.4)",
    icon: "Calendar",
    defaultTitle: "Target Milestone Date",
    defaultDescription: "Holds execution until specific exam registration or deadline",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "On Time", type: "output", color: "#D946EF" }
    ],
  },
  webhook: {
    kind: "webhook",
    category: "utility",
    label: "Webhook / Sync",
    badge: "INTEGRATION",
    accent: "#06B6D4",
    borderGlow: "rgba(6, 182, 212, 0.4)",
    icon: "Share2",
    defaultTitle: "Sync to Notion / Calendar",
    defaultDescription: "Sends progress logs and study metrics to external dashboards",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Synced", type: "output", color: "#06B6D4" }
    ],
  },
  notification: {
    kind: "notification",
    category: "utility",
    label: "Notification Alert",
    badge: "ALERT",
    accent: "#EAB308",
    borderGlow: "rgba(234, 179, 8, 0.4)",
    icon: "Bell",
    defaultTitle: "Milestone Reminder",
    defaultDescription: "Dispatches SMS/Push alert for upcoming mock test or deadline",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Delivered", type: "output", color: "#EAB308" }
    ],
  },
  ai_agent: {
    kind: "ai_agent",
    category: "logic",
    label: "AI Mentor & Evaluator",
    badge: "GEN-AI",
    accent: "#A855F7",
    borderGlow: "rgba(168, 85, 247, 0.4)",
    icon: "Sparkles",
    defaultTitle: "LLM Essay & Speaking Feedback",
    defaultDescription: "Deep semantic analysis of writing coherence and grammar accuracy",
    defaultPorts: [
      { id: "in", label: "Input Prompt", type: "input", color: "#94A3B8" },
      { id: "out", label: "Evaluation", type: "output", color: "#A855F7" }
    ],
    defaultData: { model: "gemini-1.5-pro", temperature: 0.2 }
  },
  note: {
    kind: "note",
    category: "utility",
    label: "Sticky Note / Guide",
    badge: "NOTE",
    accent: "#FBBF24",
    borderGlow: "rgba(251, 191, 36, 0.3)",
    icon: "StickyNote",
    defaultTitle: "Study Strategy Memo",
    defaultDescription: "Important notes on rubric scoring and exam day strategies",
    defaultPorts: [],
    defaultData: { text: "Focus on grammatical range and coherence markers in Paragraph 2." }
  },

  // ================= ESL FLOW NODES =================
  esl_placement: {
    kind: "esl_placement",
    category: "esl",
    label: "ESL CEFR Diagnostic",
    badge: "DIAGNOSTIC",
    accent: "#10B981",
    borderGlow: "rgba(16, 185, 129, 0.45)",
    icon: "GraduationCap",
    defaultTitle: "CEFR Placement Assessment",
    defaultDescription: "Evaluates vocabulary breadth, syntax, and listening to determine A1-C2 level",
    defaultPorts: [
      { id: "in", label: "Enroll", type: "input", color: "#94A3B8" },
      { id: "pass", label: "B2+ Advanced", type: "output", color: "#10B981", tooltip: "Routes to advanced nuance labs" },
      { id: "fail", label: "A1-B1 Foundation", type: "output", color: "#F59E0B", tooltip: "Routes to foundation grammar & phonics" }
    ],
    defaultData: { targetLevel: "B2", currentScore: 78 }
  },
  esl_vocab_drill: {
    kind: "esl_vocab_drill",
    category: "esl",
    label: "Spaced Vocab Drill",
    badge: "VOCABULARY",
    accent: "#059669",
    borderGlow: "rgba(5, 150, 105, 0.4)",
    icon: "BookOpen",
    defaultTitle: "Oxford 3000 & Academic Wordlist",
    defaultDescription: "Active recall flashcards with collocations, audio phonetics, and contextual usage",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Mastered", type: "output", color: "#10B981" }
    ],
    defaultData: { wordsCount: 50, retentionRate: 0.92 }
  },
  esl_grammar_lab: {
    kind: "esl_grammar_lab",
    category: "esl",
    label: "Grammar & Syntax Lab",
    badge: "GRAMMAR",
    accent: "#34D399",
    borderGlow: "rgba(52, 211, 153, 0.4)",
    icon: "FileCode",
    defaultTitle: "Conditionals & Subjunctive Mastery",
    defaultDescription: "Interactive sentence transformation, error correction, and clause structures",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "pass", label: "Accuracy >= 85%", type: "output", color: "#34D399" },
      { id: "fail", label: "Remedial Drills", type: "output", color: "#EF4444" }
    ],
  },
  esl_speaking_ai: {
    kind: "esl_speaking_ai",
    category: "esl",
    label: "AI Speech & Fluency Lab",
    badge: "SPEAKING",
    accent: "#6EE7B7",
    borderGlow: "rgba(110, 231, 183, 0.4)",
    icon: "Mic",
    defaultTitle: "Pronunciation & Intonation Clinic",
    defaultDescription: "Speech recognition evaluating phoneme clarity, linking words, and syllable stress",
    defaultPorts: [
      { id: "in", label: "Audio In", type: "input", color: "#94A3B8" },
      { id: "out", label: "Feedback Ready", type: "output", color: "#6EE7B7" }
    ],
  },
  esl_reading_pass: {
    kind: "esl_reading_pass",
    category: "esl",
    label: "Lexile Adaptive Reading",
    badge: "READING",
    accent: "#10B981",
    borderGlow: "rgba(16, 185, 129, 0.4)",
    icon: "BookMarked",
    defaultTitle: "Long-form Article Analysis",
    defaultDescription: "Adaptive text reading with instant vocabulary lookups and comprehension checkpoints",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Completed", type: "output", color: "#10B981" }
    ],
  },
  esl_cefr_gate: {
    kind: "esl_cefr_gate",
    category: "esl",
    label: "CEFR Milestone Gate",
    badge: "GATE",
    accent: "#047857",
    borderGlow: "rgba(4, 120, 87, 0.5)",
    icon: "Award",
    defaultTitle: "B2 Upper-Intermediate Certification",
    defaultDescription: "Validates all core competencies before transitioning to IELTS/SAT academic track",
    defaultPorts: [
      { id: "in", label: "Evaluation", type: "input", color: "#94A3B8" },
      { id: "pass", label: "Certified B2/C1", type: "output", color: "#10B981" },
      { id: "fail", label: "Retain & Review", type: "output", color: "#F59E0B" }
    ],
  },

  // ================= IELTS PREPARATION NODES =================
  ielts_diagnostic: {
    kind: "ielts_diagnostic",
    category: "ielts",
    label: "IELTS 4-Skills Diagnostic",
    badge: "BAND SCORE",
    accent: "#06B6D4",
    borderGlow: "rgba(6, 182, 212, 0.45)",
    icon: "Activity",
    defaultTitle: "Full IELTS Mock Diagnostic",
    defaultDescription: "Assesses baseline Band Scores (Listening, Reading, Writing, Speaking 0-9.0 scale)",
    defaultPorts: [
      { id: "in", label: "Start Test", type: "input", color: "#94A3B8" },
      { id: "high", label: "Band >= 7.5", type: "output", color: "#06B6D4", tooltip: "High proficiency fast-track" },
      { id: "low", label: "Band < 7.5", type: "output", color: "#F59E0B", tooltip: "Intensive targeted skill builder" }
    ],
    defaultData: { targetBand: 8.0, currentOverall: 6.5 }
  },
  ielts_listening_sim: {
    kind: "ielts_listening_sim",
    category: "ielts",
    label: "Section 1-4 Listening Sim",
    badge: "LISTENING",
    accent: "#0EA5E9",
    borderGlow: "rgba(14, 165, 233, 0.4)",
    icon: "Headphones",
    defaultTitle: "Section 4 Academic Lecture Drill",
    defaultDescription: "One-play audio with distractor traps, note completion, and accent variations (UK/AUS/US)",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Section Score", type: "output", color: "#0EA5E9" }
    ],
    defaultData: { accuracy: "36/40 (Band 8.0)" }
  },
  ielts_reading_acad: {
    kind: "ielts_reading_acad",
    category: "ielts",
    label: "Academic Reading Strategy",
    badge: "READING",
    accent: "#38BDF8",
    borderGlow: "rgba(56, 189, 248, 0.4)",
    icon: "FileText",
    defaultTitle: "True / False / Not Given & Headings",
    defaultDescription: "Speed skimming techniques, keyword synonym mapping, and paragraph matching under 20-min limit",
    defaultPorts: [
      { id: "in", label: "Passage In", type: "input", color: "#94A3B8" },
      { id: "out", label: "Results", type: "output", color: "#38BDF8" }
    ],
  },
  ielts_writing_eval: {
    kind: "ielts_writing_eval",
    category: "ielts",
    label: "Task 1 & 2 Essay AI Grader",
    badge: "WRITING",
    accent: "#0284C7",
    borderGlow: "rgba(2, 132, 199, 0.45)",
    icon: "PenTool",
    defaultTitle: "Task 2 Discursive Argument Evaluator",
    defaultDescription: "Automated scoring across TR (Task Response), CC (Coherence), LR (Lexical), and GRA (Grammar)",
    defaultPorts: [
      { id: "in", label: "Draft Essay", type: "input", color: "#94A3B8" },
      { id: "pass", label: "Band 7.5+ Qualified", type: "output", color: "#22C55E" },
      { id: "fail", label: "Revise & Redraft", type: "output", color: "#F97316" }
    ],
    defaultData: { wordCount: 285, lexicalScore: 8.0, grammarScore: 7.5 }
  },
  ielts_speaking_mock: {
    kind: "ielts_speaking_mock",
    category: "ielts",
    label: "Speaking Part 1-3 Examiner",
    badge: "SPEAKING",
    accent: "#22D3EE",
    borderGlow: "rgba(34, 211, 238, 0.4)",
    icon: "Radio",
    defaultTitle: "Part 2 Cue Card & Follow-up Part 3",
    defaultDescription: "2-minute uninterrupted speech analysis followed by abstract analytical questions",
    defaultPorts: [
      { id: "in", label: "Mock Start", type: "input", color: "#94A3B8" },
      { id: "out", label: "Examiner Report", type: "output", color: "#22D3EE" }
    ],
  },
  ielts_band_predictor: {
    kind: "ielts_band_predictor",
    category: "ielts",
    label: "Overall Band Score Predictor",
    badge: "FINAL BAND",
    accent: "#0891B2",
    borderGlow: "rgba(8, 145, 178, 0.5)",
    icon: "CheckCircle",
    defaultTitle: "Target Band 8.5 Verification",
    defaultDescription: "Calculates weighted composite band score with official rounding rules",
    defaultPorts: [
      { id: "in", label: "All 4 Bands", type: "input", color: "#94A3B8" },
      { id: "pass", label: "Target Achieved (>= 8.0)", type: "output", color: "#10B981" },
      { id: "fail", label: "Target Not Met", type: "output", color: "#EF4444" }
    ],
    defaultData: { projectedBand: 8.0, listening: 8.5, reading: 8.5, writing: 7.5, speaking: 7.5 }
  },

  // ================= SAT PREPARATION NODES =================
  sat_baseline: {
    kind: "sat_baseline",
    category: "sat",
    label: "Digital SAT Diagnostic",
    badge: "1600 SCALE",
    accent: "#8B5CF6",
    borderGlow: "rgba(139, 92, 246, 0.45)",
    icon: "Gauge",
    defaultTitle: "Digital SAT Full Baseline",
    defaultDescription: "Measures starting score out of 1600 (Reading/Writing 200-800, Math 200-800)",
    defaultPorts: [
      { id: "in", label: "Start", type: "input", color: "#94A3B8" },
      { id: "out", label: "Baseline Score", type: "output", color: "#8B5CF6" }
    ],
    defaultData: { baselineScore: 1380, targetScore: 1550 }
  },
  sat_adaptive_module: {
    kind: "sat_adaptive_module",
    category: "sat",
    label: "Adaptive Routing Gate",
    badge: "MULTI-STAGE",
    accent: "#A855F7",
    borderGlow: "rgba(168, 85, 247, 0.4)",
    icon: "GitPullRequest",
    defaultTitle: "Module 1 Performance Check",
    defaultDescription: "Simulates College Board multistage adaptive routing: routes to Hard or Standard Module 2",
    defaultPorts: [
      { id: "in", label: "Module 1 Results", type: "input", color: "#94A3B8" },
      { id: "high", label: "Hard Module 2 (Max 800)", type: "output", color: "#10B981" },
      { id: "low", label: "Standard Module 2 (Max 620)", type: "output", color: "#F59E0B" }
    ],
    defaultData: { module1Correct: "22/27" }
  },
  sat_math_desmos: {
    kind: "sat_math_desmos",
    category: "sat",
    label: "Advanced Math & Desmos",
    badge: "MATH 800",
    accent: "#C084FC",
    borderGlow: "rgba(192, 132, 252, 0.4)",
    icon: "Binary",
    defaultTitle: "Nonlinear Equations & Graphing",
    defaultDescription: "Mastery of quadratic discriminant shortcuts, system intersections via Desmos, and circle theorems",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Mastered", type: "output", color: "#C084FC" }
    ],
    defaultData: { mathSubscore: 790, desmosSpeedSec: 18 }
  },
  sat_rw_synthesis: {
    kind: "sat_rw_synthesis",
    category: "sat",
    label: "Reading/Writing Craft & Synthesis",
    badge: "R&W 800",
    accent: "#9333EA",
    borderGlow: "rgba(147, 51, 234, 0.4)",
    icon: "BookOpenCheck",
    defaultTitle: "Rhetorical Synthesis & Inference",
    defaultDescription: "Bullet-point prompt goal matching, punctuation boundaries, and transitional logic questions",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Drill Score", type: "output", color: "#9333EA" }
    ],
  },
  sat_mock_exam: {
    kind: "sat_mock_exam",
    category: "sat",
    label: "Bluebook Timed Mock Test",
    badge: "EXAM SIM",
    accent: "#7E22CE",
    borderGlow: "rgba(126, 34, 206, 0.5)",
    icon: "Timer",
    defaultTitle: "Full Official Test #6 Simulation",
    defaultDescription: "Full 2 hour 14 minute test with exact timing, calculator restrictions, and pacing pressure",
    defaultPorts: [
      { id: "in", label: "Begin Exam", type: "input", color: "#94A3B8" },
      { id: "pass", label: "Score >= 1520", type: "output", color: "#10B981" },
      { id: "fail", label: "Score < 1520", type: "output", color: "#EF4444" }
    ],
    defaultData: { totalScore: 1540, math: 790, rw: 750 }
  },
  sat_error_taxonomy: {
    kind: "sat_error_taxonomy",
    category: "sat",
    label: "Error Log & Weak-Spot Patch",
    badge: "ERROR LOG",
    accent: "#D8B4FE",
    borderGlow: "rgba(216, 180, 254, 0.4)",
    icon: "SearchCode",
    defaultTitle: "Root Cause Question Analysis",
    defaultDescription: "Categorizes missed questions into conceptual gap, rushing/misread, or calculation error",
    defaultPorts: [
      { id: "in", label: "Missed Items", type: "input", color: "#94A3B8" },
      { id: "out", label: "Remedial Plan", type: "output", color: "#D8B4FE" }
    ],
  },

  // ================= COLLEGE APPLICATION NODES =================
  college_profile_match: {
    kind: "college_profile_match",
    category: "college",
    label: "University School List",
    badge: "ADMISSIONS",
    accent: "#F59E0B",
    borderGlow: "rgba(245, 158, 11, 0.45)",
    icon: "Landmark",
    defaultTitle: "Reach, Target, Safety Balancing",
    defaultDescription: "Categorizes 12-15 universities based on GPA, SAT/ACT, major selectivity, and financial fit",
    defaultPorts: [
      { id: "in", label: "Profile In", type: "input", color: "#94A3B8" },
      { id: "out", label: "Balanced List", type: "output", color: "#F59E0B" }
    ],
    defaultData: { reachCount: 4, targetCount: 5, safetyCount: 3 }
  },
  college_essay_story: {
    kind: "college_essay_story",
    category: "college",
    label: "Common App Essay Arc",
    badge: "PERSONAL ESSAY",
    accent: "#D97706",
    borderGlow: "rgba(217, 119, 6, 0.4)",
    icon: "Feather",
    defaultTitle: "650-Word Personal Narrative",
    defaultDescription: "Iterative brainstorming, vulnerability hook, intellectual curiosity reveal, and voice polishing",
    defaultPorts: [
      { id: "in", label: "Outline", type: "input", color: "#94A3B8" },
      { id: "pass", label: "Approved by Counselor", type: "output", color: "#10B981" },
      { id: "fail", label: "Needs Polish / Rewrite", type: "output", color: "#F97316" }
    ],
    defaultData: { wordCount: 648, draftNumber: 4 }
  },
  college_rec_tracker: {
    kind: "college_rec_tracker",
    category: "college",
    label: "Letters of Recommendation",
    badge: "LOR TRACKER",
    accent: "#FBBF24",
    borderGlow: "rgba(251, 191, 36, 0.4)",
    icon: "Users",
    defaultTitle: "Counselor & Teacher 1/2 Packets",
    defaultDescription: "Tracks brag sheet distribution, gentle follow-up pings, and portal submission status",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "All 3 Submitted", type: "output", color: "#FBBF24" }
    ],
    defaultData: { teacher1: "Submitted", teacher2: "Submitted", counselor: "Submitted" }
  },
  college_fafsa_css: {
    kind: "college_fafsa_css",
    category: "college",
    label: "FAFSA & CSS Profile Aid",
    badge: "FINANCIAL AID",
    accent: "#B45309",
    borderGlow: "rgba(180, 83, 9, 0.45)",
    icon: "DollarSign",
    defaultTitle: "Financial Aid & Merit Pipeline",
    defaultDescription: "Submits federal FAFSA, institutional CSS Profile, and non-custodial parent documentation",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Aid Verified", type: "output", color: "#B45309" }
    ],
  },
  college_decision_portal: {
    kind: "college_decision_portal",
    category: "college",
    label: "ED/EA vs RD Decision Gate",
    badge: "SUBMISSION",
    accent: "#F59E0B",
    borderGlow: "rgba(245, 158, 11, 0.5)",
    icon: "Send",
    defaultTitle: "Nov 1 Early vs Jan 1 Regular",
    defaultDescription: "Routes binding Early Decision commitment or multiple Early Action / Regular Decision applications",
    defaultPorts: [
      { id: "in", label: "Ready to Submit", type: "input", color: "#94A3B8" },
      { id: "true", label: "Early Decision / EA", type: "output", color: "#10B981" },
      { id: "false", label: "Regular Decision", type: "output", color: "#06B6D4" }
    ],
  },
  college_interview_prep: {
    kind: "college_interview_prep",
    category: "college",
    label: "Alumni Interview Clinic",
    badge: "INTERVIEW",
    accent: "#FDE68A",
    borderGlow: "rgba(253, 230, 138, 0.4)",
    icon: "UserCheck",
    defaultTitle: "Why Us & Intellectual Vitality",
    defaultDescription: "Mock interview simulator preparing questions for alumni interviewer and storytelling frameworks",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Interview Complete", type: "output", color: "#FDE68A" }
    ],
  },

  // ================= PRODUCTIVITY FLOW NODES =================
  prod_inbox_triage: {
    kind: "prod_inbox_triage",
    category: "productivity",
    label: "Inbox & Task Dispatcher",
    badge: "GTD INBOX",
    accent: "#EC4899",
    borderGlow: "rgba(236, 72, 153, 0.45)",
    icon: "Inbox",
    defaultTitle: "Capture Everything to Zero",
    defaultDescription: "Instant collection of ideas, assignments, essays, and reading items into centralized inbox",
    defaultPorts: [
      { id: "in", label: "Incoming Idea", type: "input", color: "#94A3B8" },
      { id: "out", label: "Triaged", type: "output", color: "#EC4899" }
    ],
    defaultData: { dailyItemsCaptured: 14 }
  },
  prod_eisenhower: {
    kind: "prod_eisenhower",
    category: "productivity",
    label: "Eisenhower Matrix Triage",
    badge: "PRIORITY",
    accent: "#DB2777",
    borderGlow: "rgba(219, 39, 119, 0.4)",
    icon: "LayoutGrid",
    defaultTitle: "Urgent vs Important Quadrant",
    defaultDescription: "Separates Q1 (Do First: SAT Deadlines) from Q2 (Schedule: Deep Study) and Q4 (Eliminate: Distractions)",
    defaultPorts: [
      { id: "in", label: "Task In", type: "input", color: "#94A3B8" },
      { id: "high", label: "Q1 / Q2 Deep Work", type: "output", color: "#10B981" },
      { id: "low", label: "Q3 / Q4 Delegate & Drop", type: "output", color: "#64748B" }
    ],
  },
  prod_pomodoro_block: {
    kind: "prod_pomodoro_block",
    category: "productivity",
    label: "Deep Work 90-Min Block",
    badge: "FLOW STATE",
    accent: "#F472B6",
    borderGlow: "rgba(244, 114, 182, 0.4)",
    icon: "Zap",
    defaultTitle: "Ultradian Rhythm Focus Session",
    defaultDescription: "90 minutes of zero-context-switching immersion followed by 20-minute restorative break",
    defaultPorts: [
      { id: "in", label: "Start Session", type: "input", color: "#94A3B8" },
      { id: "out", label: "Session Complete", type: "output", color: "#F472B6" }
    ],
    defaultData: { durationMin: 90, breakMin: 20 }
  },
  prod_distraction_guard: {
    kind: "prod_distraction_guard",
    category: "productivity",
    label: "Distraction & Shield Lock",
    badge: "SHIELD",
    accent: "#BE185D",
    borderGlow: "rgba(190, 24, 93, 0.45)",
    icon: "ShieldAlert",
    defaultTitle: "Focus Mode & App Blocker",
    defaultDescription: "Disables notifications, blacklists social feeds, and sets ambient binaural soundscapes",
    defaultPorts: [
      { id: "in", label: "Input", type: "input", color: "#94A3B8" },
      { id: "out", label: "Shield Active", type: "output", color: "#BE185D" }
    ],
  },
  prod_habit_streak: {
    kind: "prod_habit_streak",
    category: "productivity",
    label: "Daily Habit Streak Tracker",
    badge: "STREAK",
    accent: "#FB7185",
    borderGlow: "rgba(251, 113, 133, 0.4)",
    icon: "Flame",
    defaultTitle: "Never Miss Twice Rule",
    defaultDescription: "Logs consecutive days of 50-word vocab drills, 1 math section, and 30-min reading",
    defaultPorts: [
      { id: "in", label: "Daily Check", type: "input", color: "#94A3B8" },
      { id: "pass", label: "Streak Kept (28 Days)", type: "output", color: "#10B981" },
      { id: "fail", label: "Recovery Day Protocol", type: "output", color: "#EF4444" }
    ],
    defaultData: { currentStreak: 28, bestStreak: 45 }
  },
  prod_weekly_retro: {
    kind: "prod_weekly_retro",
    category: "productivity",
    label: "Sunday Review & Planning",
    badge: "RETROSPECTIVE",
    accent: "#9D174D",
    borderGlow: "rgba(157, 23, 77, 0.5)",
    icon: "CalendarCheck",
    defaultTitle: "Weekly Calibration & Goal Setting",
    defaultDescription: "Reviews hours logged, accuracy trajectories, adjust study pacing, and clears cognitive debt",
    defaultPorts: [
      { id: "in", label: "Sunday 6 PM", type: "input", color: "#94A3B8" },
      { id: "out", label: "New Week Planned", type: "output", color: "#9D174D" }
    ],
  }
};

export const DOMAIN_GROUPS: {
  category: DomainCategory;
  name: string;
  description: string;
  accent: string;
  icon: string;
  kinds: ActionKind[];
}[] = [
  {
    category: "esl",
    name: "ESL Language Mastery",
    description: "CEFR A1-C2 curriculum, vocabulary spacing, speech clinic & grammar labs",
    accent: "#10B981",
    icon: "Languages",
    kinds: ["esl_placement", "esl_vocab_drill", "esl_grammar_lab", "esl_speaking_ai", "esl_reading_pass", "esl_cefr_gate"]
  },
  {
    category: "ielts",
    name: "IELTS Preparation (Target 8.5+)",
    description: "Listening audio drills, academic reading, Task 1/2 essay grader, and speaking mock tests",
    accent: "#06B6D4",
    icon: "Target",
    kinds: ["ielts_diagnostic", "ielts_listening_sim", "ielts_reading_acad", "ielts_writing_eval", "ielts_speaking_mock", "ielts_band_predictor"]
  },
  {
    category: "sat",
    name: "Digital SAT Prep (Target 1550+)",
    description: "Multistage adaptive routing, Desmos math mastery, rhetorical synthesis, and Bluebook mocks",
    accent: "#8B5CF6",
    icon: "Zap",
    kinds: ["sat_baseline", "sat_adaptive_module", "sat_math_desmos", "sat_rw_synthesis", "sat_mock_exam", "sat_error_taxonomy"]
  },
  {
    category: "college",
    name: "College Admissions & Applications",
    description: "Balanced school list, Common App 650-word story arc, letters of rec, and FAFSA/CSS financial aid",
    accent: "#F59E0B",
    icon: "GraduationCap",
    kinds: ["college_profile_match", "college_essay_story", "college_rec_tracker", "college_fafsa_css", "college_decision_portal", "college_interview_prep"]
  },
  {
    category: "productivity",
    name: "Productivity & Deep Work Flow",
    description: "Eisenhower triage, 90-min Pomodoro cycles, distraction blockers, habit streaks, and weekly retros",
    accent: "#EC4899",
    icon: "Flame",
    kinds: ["prod_inbox_triage", "prod_eisenhower", "prod_pomodoro_block", "prod_distraction_guard", "prod_habit_streak", "prod_weekly_retro"]
  },
  {
    category: "logic",
    name: "Logic & Workflow Automation",
    description: "Triggers, conditional branching, time delays, AI mentors, webhooks, and sticky notes",
    accent: "#6366F1",
    icon: "GitBranch",
    kinds: ["trigger", "action", "branch", "delay", "wait-until", "ai_agent", "webhook", "notification", "note"]
  }
];

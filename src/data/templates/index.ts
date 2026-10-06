import type {
  AutomationTemplate,
  NodeOutput,
  PortId,
  Rule,
  WorkflowEdge,
  WorkflowNode,
} from "@/types/workflow";

// Helper to create IDs
const id = (prefix: string, name: string) => `${prefix}-${name}`;

type NodeLogic = {
  groups?: [port: PortId, mode: "all" | "any", rules: Rule[]][];
  fallback?: PortId;
  outputs?: NodeOutput[];
};

/** Attaches routing rules and variable outputs to template nodes by id. */
function applyLogic(nodes: WorkflowNode[], logic: Record<string, NodeLogic>) {
  for (const node of nodes) {
    const l = logic[node.id];
    if (!l) continue;
    node.ruleGroups = l.groups?.map(([port, mode, rules], i) => ({
      id: `${node.id}-g${i + 1}`,
      mode,
      rules,
      port,
    }));
    node.fallbackPort = l.fallback;
    node.outputs = l.outputs;
  }
  spreadLayout(nodes);
}

/**
 * Template coordinates were authored for ~120px cards on a 160–180px row
 * pitch. Cards are now 136–164px tall and 340px wide, so scale positions
 * to leave clear gutters between rows/columns for edges and labels.
 */
const SPREAD_X = 1.5;
const SPREAD_Y = 1.45;
function spreadLayout(nodes: WorkflowNode[]) {
  for (const node of nodes) {
    node.x = Math.round(node.x * SPREAD_X);
    node.y = Math.round(node.y * SPREAD_Y);
  }
}

// ================= 1. ESL LEARNING ROADMAP =================
function createEslTemplate(): AutomationTemplate {
  const p = "esl";
  const nodes: WorkflowNode[] = [
    {
      id: id(p, "trigger"),
      kind: "trigger",
      x: 350,
      y: 40,
      title: "Student Enrollment & Onboarding",
      description: "Triggered when a learner starts the English Fluency roadmap",
      category: "esl",
      status: "idle",
      data: { studentName: "Alex Rivera", startingLevel: "B1 Intermediate" }
    },
    {
      id: id(p, "placement"),
      kind: "esl_placement",
      x: 350,
      y: 200,
      title: "Oxford CEFR Diagnostic Assessment",
      description: "60-minute adaptive test covering grammar, listening, and lexical breadth",
      category: "esl",
      status: "idle",
      data: { grammarScore: 82, vocabScore: 74, listeningScore: 79 }
    },
    {
      id: id(p, "vocab"),
      kind: "esl_vocab_drill",
      x: 600,
      y: 380,
      title: "Academic Wordlist & Collocations",
      description: "Daily active recall with 50 high-frequency academic vocabulary words",
      category: "esl",
      status: "idle",
      data: { targetWords: 500, currentMastered: 320 }
    },
    {
      id: id(p, "grammar"),
      kind: "esl_grammar_lab",
      x: 100,
      y: 380,
      title: "Advanced Sentence Inversion & Clauses",
      description: "Interactive clause analysis and subjunctive mood error correction",
      category: "esl",
      status: "idle",
      data: { accuracy: "88%" }
    },
    {
      id: id(p, "delay-spacing"),
      kind: "delay",
      x: 600,
      y: 560,
      title: "48-Hour Memory Consolidation",
      description: "Optimized Leitner spacing interval before active speaking challenge",
      category: "logic",
      status: "idle",
      data: { hours: 48 }
    },
    {
      id: id(p, "speaking-ai"),
      kind: "esl_speaking_ai",
      x: 350,
      y: 720,
      title: "AI Speech & Fluency Clinic",
      description: "Live microphone dialogue simulation with instant pronunciation phoneme feedback",
      category: "esl",
      status: "idle",
      data: { fluencyScore: 84, pronunciationPurity: "89%" }
    },
    {
      id: id(p, "reading-pass"),
      kind: "esl_reading_pass",
      x: 350,
      y: 900,
      title: "Scientific American Lexile 1250+ Pass",
      description: "Speed comprehension passage with inference and author tone questions",
      category: "esl",
      status: "idle",
      data: { wordsPerMinute: 240, comprehension: "90%" }
    },
    {
      id: id(p, "cefr-gate"),
      kind: "esl_cefr_gate",
      x: 350,
      y: 1080,
      title: "C1 Advanced Fluency Certification",
      description: "Comprehensive benchmark certifying readiness for IELTS Academic track",
      category: "esl",
      status: "idle",
      data: { result: "Certified C1 - Advanced Fluency" }
    },
    {
      id: id(p, "note"),
      kind: "note",
      x: -180,
      y: 600,
      title: "ESL Pedagogy Tip",
      description: "Focus on transitional collocations: 'Moreover', 'In contrast', 'Notwithstanding'.",
      category: "utility",
      status: "idle",
      noteText: "Focus on transitional collocations: 'Moreover', 'In contrast', 'Notwithstanding'."
    }
  ];

  applyLogic(nodes, {
    [id(p, "placement")]: { groups: [["pass", "all", [{ variable: "grammarAccuracy", op: ">=", value: 75 }]]], fallback: "fail" },
    [id(p, "grammar")]: { groups: [["pass", "all", [{ variable: "grammarAccuracy", op: ">=", value: 85 }]]], fallback: "fail" },
    [id(p, "vocab")]: { outputs: [{ variable: "vocabMastered", op: "add", value: 50 }] },
    [id(p, "speaking-ai")]: { outputs: [{ variable: "fluencyScore", op: "add", value: 2 }] },
    [id(p, "cefr-gate")]: { groups: [["pass", "all", [{ variable: "fluencyScore", op: ">=", value: 80 }]]] },
  });

  const edges: WorkflowEdge[] = [
    { id: "e1", source: id(p, "trigger"), port: "out", target: id(p, "placement"), style: "smooth", animated: true },
    { id: "e2", source: id(p, "placement"), port: "pass", target: id(p, "grammar"), style: "smooth", label: "Score >= 75%" },
    { id: "e3", source: id(p, "placement"), port: "fail", target: id(p, "vocab"), style: "smooth", label: "Foundation Review" },
    { id: "e4", source: id(p, "vocab"), port: "out", target: id(p, "delay-spacing"), style: "smooth" },
    { id: "e5", source: id(p, "delay-spacing"), port: "out", target: id(p, "speaking-ai"), style: "smooth" },
    { id: "e6", source: id(p, "grammar"), port: "pass", target: id(p, "speaking-ai"), style: "smooth" },
    { id: "e7", source: id(p, "speaking-ai"), port: "out", target: id(p, "reading-pass"), style: "smooth" },
    { id: "e8", source: id(p, "reading-pass"), port: "out", target: id(p, "cefr-gate"), style: "smooth" }
  ];

  return {
    id: "esl-mastery",
    title: "ESL CEFR Language Mastery Roadmap",
    subtitle: "From B1 Intermediate to C1 Advanced Academic Fluency",
    description: "Full-spectrum English proficiency pipeline combining spaced vocabulary drills, grammar syntax labs, AI-driven speaking dialogue simulator, and adaptive reading checkpoints.",
    category: "esl",
    badge: "CEFR A1-C1",
    iconName: "Languages",
    accentColor: "#10B981",
    nodes,
    edges,
    defaultVariables: {
      studentName: "Alex Rivera",
      currentCEFR: "B2",
      vocabMastered: 385,
      grammarAccuracy: 88,
      fluencyScore: 84
    },
    stats: {
      estimatedTime: "8-12 Weeks",
      targetScoreOrGoal: "C1 Advanced Certificate",
      nodeCount: nodes.length,
      difficulty: "Intermediate"
    }
  };
}

// ================= 2. IELTS PREPARATION PIPELINE =================
function createIeltsTemplate(): AutomationTemplate {
  const p = "ielts";
  const nodes: WorkflowNode[] = [
    {
      id: id(p, "trigger"),
      kind: "trigger",
      x: 400,
      y: 40,
      title: "IELTS 8.5+ Kickoff Diagnostic",
      description: "Initiates full 4-skill diagnostic exam under timed conditions",
      category: "ielts",
      status: "idle",
      data: { targetBand: 8.5, examDate: "Nov 25, 2026" }
    },
    {
      id: id(p, "diagnostic"),
      kind: "ielts_diagnostic",
      x: 400,
      y: 200,
      title: "Official 4-Skills Diagnostic Baseline",
      description: "Evaluates individual baseline Band scores for Listening, Reading, Writing, Speaking",
      category: "ielts",
      status: "idle",
      data: { listening: 7.5, reading: 7.0, writing: 6.5, speaking: 7.0, overall: 7.0 }
    },
    {
      id: id(p, "listening"),
      kind: "ielts_listening_sim",
      x: 120,
      y: 380,
      title: "Section 4 Academic Lecture Sim",
      description: "Note completion, diagram labelling, and multi-accent distractors (UK/Aus/NZ)",
      category: "ielts",
      status: "idle",
      data: { score: "37/40 (Band 8.5)" }
    },
    {
      id: id(p, "reading"),
      kind: "ielts_reading_acad",
      x: 680,
      y: 380,
      title: "Academic Passage 3: T/F/NG & Headings",
      description: "20-minute rapid skimming strategy, synonym tracking, and inference verification",
      category: "ielts",
      status: "idle",
      data: { score: "36/40 (Band 8.5)" }
    },
    {
      id: id(p, "writing-eval"),
      kind: "ielts_writing_eval",
      x: 120,
      y: 580,
      title: "Task 2 Essay AI Grader (TR, CC, LR, GRA)",
      description: "Automated analysis of 250+ word discursive essay with band scoring and lexical suggestions",
      category: "ielts",
      status: "idle",
      data: { band: 8.0, taskResponse: 8.5, coherence: 8.0, lexicalResource: 8.0, grammar: 7.5 }
    },
    {
      id: id(p, "speaking-mock"),
      kind: "ielts_speaking_mock",
      x: 680,
      y: 580,
      title: "Part 2 Cue Card & Part 3 Discussion",
      description: "Simulated IELTS examiner interaction assessing fluency, coherence, and idiomatic speech",
      category: "ielts",
      status: "idle",
      data: { band: 8.0, fluency: 8.5, lexicalVariety: 8.0 }
    },
    {
      id: id(p, "branch-eval"),
      kind: "branch",
      x: 400,
      y: 760,
      title: "Composite Band >= 8.0 Evaluation",
      description: "Validates if all individual section bands satisfy the minimum requirement of 7.5+",
      category: "logic",
      status: "idle",
      data: { minSectionThreshold: 7.5 }
    },
    {
      id: id(p, "predictor"),
      kind: "ielts_band_predictor",
      x: 180,
      y: 960,
      title: "Official IELTS Band 8.5 Projected Score",
      description: "Certified readiness report ready for Oxbridge & Ivy League university submission",
      category: "ielts",
      status: "idle",
      data: { projectedOverall: 8.5, percentile: "Top 2%" }
    },
    {
      id: id(p, "remedial-delay"),
      kind: "delay",
      x: 620,
      y: 960,
      title: "7-Day Targeted Weak-Spot Cycle",
      description: "Intensive 1-week focus on Task 2 writing coherence and complex syntax drills",
      category: "logic",
      status: "idle",
      data: { focusArea: "Task 2 Cohesion & Paragraph Transitions" }
    }
  ];

  applyLogic(nodes, {
    [id(p, "diagnostic")]: { groups: [["high", "all", [{ variable: "overallMockScore", op: ">=", value: 7.5 }]]], fallback: "low" },
    [id(p, "writing-eval")]: { groups: [["pass", "all", [{ variable: "writingScore", op: ">=", value: 7.5 }]]], fallback: "fail" },
    [id(p, "branch-eval")]: { groups: [["true", "all", [{ variable: "overallMockScore", op: ">=", value: 8 }]]], fallback: "false" },
    [id(p, "remedial-delay")]: {
      outputs: [
        { variable: "writingScore", op: "add", value: 0.5 },
        { variable: "overallMockScore", op: "add", value: 0.25 },
      ],
    },
    [id(p, "predictor")]: { groups: [["pass", "all", [{ variable: "overallMockScore", op: ">=", value: 8 }]]] },
  });

  const edges: WorkflowEdge[] = [
    { id: "ie1", source: id(p, "trigger"), port: "out", target: id(p, "diagnostic"), style: "smooth", animated: true },
    { id: "ie2", source: id(p, "diagnostic"), port: "high", target: id(p, "listening"), style: "smooth", label: "L/R Track" },
    { id: "ie3", source: id(p, "diagnostic"), port: "low", target: id(p, "reading"), style: "smooth", label: "W/S Track" },
    { id: "ie4", source: id(p, "listening"), port: "out", target: id(p, "writing-eval"), style: "smooth" },
    { id: "ie5", source: id(p, "reading"), port: "out", target: id(p, "speaking-mock"), style: "smooth" },
    { id: "ie6", source: id(p, "writing-eval"), port: "pass", target: id(p, "branch-eval"), style: "smooth" },
    { id: "ie7", source: id(p, "speaking-mock"), port: "out", target: id(p, "branch-eval"), style: "smooth" },
    { id: "ie8", source: id(p, "branch-eval"), port: "true", target: id(p, "predictor"), style: "smooth", label: "Band >= 8.0" },
    { id: "ie9", source: id(p, "branch-eval"), port: "false", target: id(p, "remedial-delay"), style: "smooth", label: "Band < 8.0" },
    { id: "ie10", source: id(p, "remedial-delay"), port: "out", target: id(p, "writing-eval"), style: "smooth", label: "Re-evaluate" },
    { id: "ie11", source: id(p, "writing-eval"), port: "fail", target: id(p, "remedial-delay"), style: "smooth", label: "Band < 7.5" }
  ];

  return {
    id: "ielts-prep",
    title: "IELTS 8.5+ Strategic Preparation Engine",
    subtitle: "Complete 4-Skill Mastery with AI Writing & Speaking Examiner",
    description: "Designed for international applicants aiming for top tier academic cutoffs (Oxford, Cambridge, Harvard, MIT) with specialized AI evaluators for Task 1/2 essays and Part 2/3 speaking.",
    category: "ielts",
    badge: "Target Band 8.5",
    iconName: "Target",
    accentColor: "#06B6D4",
    nodes,
    edges,
    defaultVariables: {
      targetBand: 8.5,
      overallMockScore: 7.5,
      listeningScore: 8.5,
      readingScore: 8.5,
      writingScore: 6.5,
      speakingScore: 8.0
    },
    stats: {
      estimatedTime: "6-8 Weeks",
      targetScoreOrGoal: "Band 8.5 Overall",
      nodeCount: nodes.length,
      difficulty: "Advanced"
    }
  };
}

// ================= 3. DIGITAL SAT 1550+ ACCELERATOR =================
function createSatTemplate(): AutomationTemplate {
  const p = "sat";
  const nodes: WorkflowNode[] = [
    {
      id: id(p, "trigger"),
      kind: "trigger",
      x: 400,
      y: 40,
      title: "Digital SAT Diagnostic Registration",
      description: "Registers student for adaptive testing simulation",
      category: "sat",
      status: "idle",
      data: { targetScore: 1550, testDate: "Dec 5, 2026" }
    },
    {
      id: id(p, "baseline"),
      kind: "sat_baseline",
      x: 400,
      y: 200,
      title: "1600-Scale Diagnostic Baseline",
      description: "College Board calibrated baseline test (Math 200-800, Reading/Writing 200-800)",
      category: "sat",
      status: "idle",
      data: { mathBaseline: 720, rwBaseline: 690, totalBaseline: 1410 }
    },
    {
      id: id(p, "adaptive-gate"),
      kind: "sat_adaptive_module",
      x: 400,
      y: 380,
      title: "Multi-Stage Adaptive Module 1 Gate",
      description: "Simulates digital test routing algorithm based on Module 1 difficulty accuracy",
      category: "sat",
      status: "idle",
      data: { module1Accuracy: "24/27 (92%)" }
    },
    {
      id: id(p, "math-desmos"),
      kind: "sat_math_desmos",
      x: 140,
      y: 560,
      title: "Advanced Math & Desmos Mastery (800 Target)",
      description: "Quadratic discriminant shortcuts, circle theorems, and system solutions via graphing calculator",
      category: "sat",
      status: "idle",
      data: { score: "790/800", speed: "18s / question" }
    },
    {
      id: id(p, "rw-synthesis"),
      kind: "sat_rw_synthesis",
      x: 660,
      y: 560,
      title: "R&W Rhetorical Synthesis & Grammar (760 Target)",
      description: "Inference passages, vocabulary-in-context, and strict punctuation boundary rules",
      category: "sat",
      status: "idle",
      data: { score: "760/800" }
    },
    {
      id: id(p, "bluebook-mock"),
      kind: "sat_mock_exam",
      x: 400,
      y: 740,
      title: "Full-Length Bluebook Timed Mock Test",
      description: "2 hr 14 min full practice exam under official test pressure and timer constraints",
      category: "sat",
      status: "idle",
      data: { compositeScore: 1550, math: 800, rw: 750 }
    },
    {
      id: id(p, "error-log"),
      kind: "sat_error_taxonomy",
      x: 700,
      y: 920,
      title: "Error Taxonomy & Root Cause Patch",
      description: "Categorizes misses: Misread Prompt (40%), Calculation (20%), Concept Gap (40%)",
      category: "sat",
      status: "idle",
      data: { errorsLogged: 4, reviewCompleted: true }
    },
    {
      id: id(p, "ai-mentor"),
      kind: "ai_agent",
      x: 140,
      y: 920,
      title: "AI SAT Problem Solver & Strategy Coach",
      description: "Generates 5 alternative solving angles and back-solving tricks for hard questions",
      category: "logic",
      status: "idle",
      data: { model: "gemini-1.5-pro", explanationAccuracy: "99%" }
    },
    {
      id: id(p, "score-notification"),
      kind: "notification",
      x: 400,
      y: 1100,
      title: "1550+ Score Goal Reached Alert",
      description: "Sends summary report to counselor and parents with breakdown graphs",
      category: "utility",
      status: "idle",
      data: { channel: "email & portal", status: "Ready" }
    }
  ];

  applyLogic(nodes, {
    [id(p, "adaptive-gate")]: { groups: [["high", "all", [{ variable: "module1Correct", op: ">=", value: 20 }]]], fallback: "low" },
    [id(p, "bluebook-mock")]: { groups: [["pass", "all", [{ variable: "currentMockScore", op: ">=", value: 1520 }]]], fallback: "fail" },
    [id(p, "ai-mentor")]: { outputs: [{ variable: "currentMockScore", op: "add", value: 30 }] },
  });

  const edges: WorkflowEdge[] = [
    { id: "se1", source: id(p, "trigger"), port: "out", target: id(p, "baseline"), style: "smooth", animated: true },
    { id: "se2", source: id(p, "baseline"), port: "out", target: id(p, "adaptive-gate"), style: "smooth" },
    { id: "se3", source: id(p, "adaptive-gate"), port: "high", target: id(p, "math-desmos"), style: "smooth", label: "Hard Module 2" },
    { id: "se4", source: id(p, "adaptive-gate"), port: "high", target: id(p, "rw-synthesis"), style: "smooth", label: "Hard Module 2" },
    { id: "se5", source: id(p, "math-desmos"), port: "out", target: id(p, "bluebook-mock"), style: "smooth" },
    { id: "se6", source: id(p, "rw-synthesis"), port: "out", target: id(p, "bluebook-mock"), style: "smooth" },
    { id: "se7", source: id(p, "bluebook-mock"), port: "pass", target: id(p, "score-notification"), style: "smooth", label: "Score >= 1520" },
    { id: "se8", source: id(p, "bluebook-mock"), port: "fail", target: id(p, "error-log"), style: "smooth", label: "Score < 1520" },
    { id: "se9", source: id(p, "error-log"), port: "out", target: id(p, "ai-mentor"), style: "smooth" },
    { id: "se10", source: id(p, "ai-mentor"), port: "out", target: id(p, "bluebook-mock"), style: "smooth", label: "Retake Mock" }
  ];

  return {
    id: "sat-accelerator",
    title: "Digital SAT 1550+ Master Accelerator",
    subtitle: "Multistage Adaptive Routing, Desmos Speed Shortcuts & Error Taxonomy",
    description: "Engineered specifically for the Digital SAT with automated multistage routing simulation, Desmos solver modules, reading rhetorical synthesis drills, and root-cause error logging.",
    category: "sat",
    badge: "Target 1550+",
    iconName: "Zap",
    accentColor: "#8B5CF6",
    nodes,
    edges,
    defaultVariables: {
      targetSAT: 1550,
      currentMockScore: 1480,
      module1Correct: 24,
      mathSubscore: 790,
      rwSubscore: 750,
      hardModuleUnlocked: true
    },
    stats: {
      estimatedTime: "10 Weeks",
      targetScoreOrGoal: "1550+ (Top 1% Global)",
      nodeCount: nodes.length,
      difficulty: "Advanced"
    }
  };
}

// ================= 4. COLLEGE ADMISSIONS & APPLICATION PIPELINE =================
function createCollegeTemplate(): AutomationTemplate {
  const p = "college";
  const nodes: WorkflowNode[] = [
    {
      id: id(p, "trigger"),
      kind: "trigger",
      x: 380,
      y: 40,
      title: "Admissions Season Kickoff (Aug 1)",
      description: "Common App portal opens; loads student GPA, test scores, and extracurricular profile",
      category: "college",
      status: "idle",
      data: { unweightedGPA: 3.96, satScore: 1550, apCourses: 9 }
    },
    {
      id: id(p, "profile-match"),
      kind: "college_profile_match",
      x: 380,
      y: 200,
      title: "Balanced 15-College Strategy Matrix",
      description: "Categorizes target universities into Reach (Ivy/MIT), Target (Top 25), and Safety (Top 50)",
      category: "college",
      status: "idle",
      data: { reach: ["MIT", "Stanford", "Harvard"], target: ["Georgetown", "Michigan", "NYU"], safety: ["Rutgers", "UW"] }
    },
    {
      id: id(p, "essay-story"),
      kind: "college_essay_story",
      x: 100,
      y: 380,
      title: "Common App 650-Word Personal Statement",
      description: "Iterative narrative structure: Hook, challenge, intellectual transformation, future vision",
      category: "college",
      status: "idle",
      data: { wordCount: 648, draftIteration: 5, counselorApproved: true }
    },
    {
      id: id(p, "rec-tracker"),
      kind: "college_rec_tracker",
      x: 660,
      y: 380,
      title: "3x Letters of Recommendation Tracker",
      description: "Monitors Brag Sheet submission, Physics teacher, English teacher, and Counselor recs",
      category: "college",
      status: "idle",
      data: { counselor: "Done", stemTeacher: "Done", humanitiesTeacher: "Done" }
    },
    {
      id: id(p, "fafsa-css"),
      kind: "college_fafsa_css",
      x: 100,
      y: 560,
      title: "FAFSA & CSS Profile Financial Aid",
      description: "Submits federal tax transcripts, CSS institutional documents, and merit scholarship essays",
      category: "college",
      status: "idle",
      data: { fafsaSubmitted: true, cssProfileComplete: true }
    },
    {
      id: id(p, "decision-portal"),
      kind: "college_decision_portal",
      x: 380,
      y: 740,
      title: "Nov 1 Early Decision (ED/EA) Routing Gate",
      description: "Routes binding Early Decision application to dream school vs non-binding EA/RD portfolio",
      category: "college",
      status: "idle",
      data: { earlyChoice: "Stanford REA", deadline: "Nov 1, 11:59 PM" }
    },
    {
      id: id(p, "interview-prep"),
      kind: "college_interview_prep",
      x: 100,
      y: 920,
      title: "Alumni Interview Clinic & Prep",
      description: "Mock dialogue on intellectual vitality, campus fit, community impact, and questions for alumni",
      category: "college",
      status: "idle",
      data: { rating: "Outstanding", enthusiasm: 9.8 }
    },
    {
      id: id(p, "webhook-sync"),
      kind: "webhook",
      x: 660,
      y: 920,
      title: "Sync Application Status to Dashboard",
      description: "Auto-updates Notion Application Tracker and notifies guidance counselor",
      category: "utility",
      status: "idle",
      data: { portalSyncStatus: "All 12 Applications Confirmed Received" }
    },
    {
      id: id(p, "note"),
      kind: "note",
      x: 720,
      y: 180,
      title: "Ivy Admissions Strategy",
      description: "Show a sharp spike in one passion project rather than being well-rounded across 10 random clubs.",
      category: "utility",
      status: "idle",
      noteText: "Show a sharp spike in one passion project rather than being well-rounded across 10 random clubs."
    }
  ];

  applyLogic(nodes, {
    [id(p, "essay-story")]: { groups: [["pass", "all", [{ variable: "essayFinalized", op: "==", value: true }]]] },
    [id(p, "decision-portal")]: { groups: [["true", "all", [{ variable: "earlyDecisionSubmitted", op: "==", value: true }]]] },
    [id(p, "rec-tracker")]: { outputs: [{ variable: "lorReceived", op: "set", value: 3 }] },
  });

  const edges: WorkflowEdge[] = [
    { id: "ce1", source: id(p, "trigger"), port: "out", target: id(p, "profile-match"), style: "smooth", animated: true },
    { id: "ce2", source: id(p, "profile-match"), port: "out", target: id(p, "essay-story"), style: "smooth" },
    { id: "ce3", source: id(p, "profile-match"), port: "out", target: id(p, "rec-tracker"), style: "smooth" },
    { id: "ce4", source: id(p, "essay-story"), port: "pass", target: id(p, "fafsa-css"), style: "smooth" },
    { id: "ce5", source: id(p, "fafsa-css"), port: "out", target: id(p, "decision-portal"), style: "smooth" },
    { id: "ce6", source: id(p, "rec-tracker"), port: "out", target: id(p, "decision-portal"), style: "smooth" },
    { id: "ce7", source: id(p, "decision-portal"), port: "true", target: id(p, "interview-prep"), style: "smooth", label: "Early Action / ED" },
    { id: "ce8", source: id(p, "decision-portal"), port: "false", target: id(p, "webhook-sync"), style: "smooth", label: "Regular Decision" },
    { id: "ce9", source: id(p, "interview-prep"), port: "out", target: id(p, "webhook-sync"), style: "smooth" }
  ];

  return {
    id: "college-admissions",
    title: "Elite College Application & Admissions Roadmap",
    subtitle: "Common App, Ivy / Top-20 Essay Storytelling, Rec Letters & Financial Aid",
    description: "Complete strategic timeline for competitive college admissions: school balancing, 650-word personal essay drafting, teacher recommendation tracking, FAFSA/CSS financial aid, and alumni interview prep.",
    category: "college",
    badge: "Admissions Hub",
    iconName: "GraduationCap",
    accentColor: "#F59E0B",
    nodes,
    edges,
    defaultVariables: {
      targetSchoolsCount: 12,
      essayFinalized: true,
      lorReceived: 3,
      earlyDecisionSubmitted: true,
      interviewScheduled: true
    },
    stats: {
      estimatedTime: "4-6 Months",
      targetScoreOrGoal: "Top 20 Acceptance",
      nodeCount: nodes.length,
      difficulty: "Comprehensive"
    }
  };
}

// ================= 5. PRODUCTIVITY & DEEP WORK ARCHITECTURE =================
function createProductivityTemplate(): AutomationTemplate {
  const p = "prod";
  const nodes: WorkflowNode[] = [
    {
      id: id(p, "trigger"),
      kind: "trigger",
      x: 380,
      y: 40,
      title: "Daily 7:00 AM Morning Kickoff",
      description: "Initiates daily focus protocol and pulls scheduled tasks",
      category: "productivity",
      status: "idle",
      data: { energyLevel: "High", focusReadiness: "100%" }
    },
    {
      id: id(p, "inbox"),
      kind: "prod_inbox_triage",
      x: 380,
      y: 200,
      title: "GTD Inbox & Task Capture Dispatcher",
      description: "Captures all raw thoughts, homework, essay revisions, and reading assignments",
      category: "productivity",
      status: "idle",
      data: { tasksProcessed: 12, inboxZeroAchieved: true }
    },
    {
      id: id(p, "eisenhower"),
      kind: "prod_eisenhower",
      x: 380,
      y: 380,
      title: "Eisenhower Matrix Quadrant Classifier",
      description: "Filters Q1 Urgent/Important (SAT Mock) vs Q2 Non-urgent/Deep Growth (Vocabulary)",
      category: "productivity",
      status: "idle",
      data: { q1Count: 2, q2Count: 4, eliminatedDistractions: 6 }
    },
    {
      id: id(p, "distraction-guard"),
      kind: "prod_distraction_guard",
      x: 120,
      y: 560,
      title: "Focus Shield & App Blacklist Active",
      description: "Locks phone in focus mode, blocks social feeds, and sets binaural alpha wave audio",
      category: "productivity",
      status: "idle",
      data: { appsBlocked: 14, focusShieldStrength: "Maximum" }
    },
    {
      id: id(p, "pomodoro-block"),
      kind: "prod_pomodoro_block",
      x: 120,
      y: 740,
      title: "90-Minute Ultradian Deep Focus Session",
      description: "90 minutes of uninterrupted single-task immersion with 20 min active break",
      category: "productivity",
      status: "idle",
      data: { deepWorkHours: "4.5 hrs today", flowStateMaintained: true }
    },
    {
      id: id(p, "habit-streak"),
      kind: "prod_habit_streak",
      x: 380,
      y: 920,
      title: "Daily Habit Streak (28-Day Chain)",
      description: "Tracks consistency: 50 vocab flashcards + 20 SAT math drills + 30 min reading",
      category: "productivity",
      status: "idle",
      data: { streakDays: 28, consistencyScore: "98%" }
    },
    {
      id: id(p, "weekly-retro"),
      kind: "prod_weekly_retro",
      x: 380,
      y: 1100,
      title: "Sunday Weekly Calibration & Review",
      description: "Synthesizes weekly study output, audits velocity, and plans upcoming priorities",
      category: "productivity",
      status: "idle",
      data: { weeklyHours: 32, goalsCompleted: "94%" }
    },
    {
      id: id(p, "note"),
      kind: "note",
      x: 660,
      y: 560,
      title: "Deep Work Rule",
      description: "Never multitask during Q1/Q2 sessions. Single-tasking boosts retention by 40%.",
      category: "utility",
      status: "idle",
      noteText: "Never multitask during Q1/Q2 sessions. Single-tasking boosts retention by 40%."
    }
  ];

  applyLogic(nodes, {
    [id(p, "eisenhower")]: { groups: [["high", "all", [{ variable: "deepWorkMinutes", op: ">=", value: 60 }]]], fallback: "low" },
    [id(p, "pomodoro-block")]: { outputs: [{ variable: "deepWorkMinutes", op: "add", value: 90 }] },
    [id(p, "habit-streak")]: {
      groups: [["pass", "all", [{ variable: "streakDays", op: ">=", value: 1 }]]],
      outputs: [{ variable: "streakDays", op: "add", value: 1 }],
    },
  });

  const edges: WorkflowEdge[] = [
    { id: "pe1", source: id(p, "trigger"), port: "out", target: id(p, "inbox"), style: "smooth", animated: true },
    { id: "pe2", source: id(p, "inbox"), port: "out", target: id(p, "eisenhower"), style: "smooth" },
    { id: "pe3", source: id(p, "eisenhower"), port: "high", target: id(p, "distraction-guard"), style: "smooth", label: "Q1 / Q2 Priorities" },
    { id: "pe4", source: id(p, "distraction-guard"), port: "out", target: id(p, "pomodoro-block"), style: "smooth" },
    { id: "pe5", source: id(p, "pomodoro-block"), port: "out", target: id(p, "habit-streak"), style: "smooth" },
    { id: "pe6", source: id(p, "eisenhower"), port: "low", target: id(p, "habit-streak"), style: "smooth", label: "Delegate / Log" },
    { id: "pe7", source: id(p, "habit-streak"), port: "pass", target: id(p, "weekly-retro"), style: "smooth" }
  ];

  return {
    id: "productivity-system",
    title: "Ultra-Productivity & Deep Work Operating System",
    subtitle: "GTD Inbox Triage, Eisenhower Prioritization & 90-Min Focus Cycles",
    description: "Personal operating system designed to eliminate study burnout, maintain daily habit streaks, and maximize deep work output for high-stakes test prep and college applications.",
    category: "productivity",
    badge: "Deep Work OS",
    iconName: "Flame",
    accentColor: "#EC4899",
    nodes,
    edges,
    defaultVariables: {
      deepWorkMinutes: 270,
      streakDays: 28,
      inboxZero: true,
      tasksCompleted: 8,
      flowStateScore: 94
    },
    stats: {
      estimatedTime: "Daily / Weekly Routine",
      targetScoreOrGoal: "Peak Focus & 0 Burnout",
      nodeCount: nodes.length,
      difficulty: "Beginner"
    }
  };
}

export const TEMPLATES: Record<string, () => AutomationTemplate> = {
  "esl-mastery": createEslTemplate,
  "ielts-prep": createIeltsTemplate,
  "sat-accelerator": createSatTemplate,
  "college-admissions": createCollegeTemplate,
  "productivity-system": createProductivityTemplate,
};

export const TEMPLATE_LIST: AutomationTemplate[] = [
  createEslTemplate(),
  createIeltsTemplate(),
  createSatTemplate(),
  createCollegeTemplate(),
  createProductivityTemplate(),
];

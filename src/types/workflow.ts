export type DomainCategory = 
  | "esl"
  | "ielts"
  | "sat"
  | "college"
  | "productivity"
  | "logic"
  | "utility";

export type ActionKind =
  // Logic & Core Flow
  | "trigger"
  | "action"
  | "branch"
  | "delay"
  | "wait-until"
  | "webhook"
  | "notification"
  | "ai_agent"
  | "note"
  
  // ESL Flow Kinds
  | "esl_placement"
  | "esl_vocab_drill"
  | "esl_grammar_lab"
  | "esl_speaking_ai"
  | "esl_reading_pass"
  | "esl_cefr_gate"

  // IELTS Flow Kinds
  | "ielts_diagnostic"
  | "ielts_listening_sim"
  | "ielts_reading_acad"
  | "ielts_writing_eval"
  | "ielts_speaking_mock"
  | "ielts_band_predictor"

  // SAT Flow Kinds
  | "sat_baseline"
  | "sat_adaptive_module"
  | "sat_math_desmos"
  | "sat_rw_synthesis"
  | "sat_mock_exam"
  | "sat_error_taxonomy"

  // College Admissions Flow Kinds
  | "college_profile_match"
  | "college_essay_story"
  | "college_rec_tracker"
  | "college_fafsa_css"
  | "college_decision_portal"
  | "college_interview_prep"

  // Productivity Flow Kinds
  | "prod_inbox_triage"
  | "prod_eisenhower"
  | "prod_pomodoro_block"
  | "prod_distraction_guard"
  | "prod_habit_streak"
  | "prod_weekly_retro";

export type PortId = "in" | "out" | "true" | "false" | "pass" | "fail" | "high" | "low" | "alt";

export type PortDefinition = {
  id: PortId;
  label: string;
  type: "input" | "output";
  color?: string;
  tooltip?: string;
};

export type NodeStatus = "idle" | "pending" | "running" | "success" | "warning" | "failed" | "skipped";

export type RuleOperator = "==" | "!=" | ">" | ">=" | "<" | "<=" | "contains";

export type Rule = {
  variable: string;
  op: RuleOperator;
  value: string | number | boolean;
};

/** A group of rules; if it matches, execution leaves through `port`. */
export type RuleGroup = {
  id: string;
  mode: "all" | "any";
  rules: Rule[];
  port: PortId;
};

/** Variable mutation applied when a node finishes executing. */
export type NodeOutput = {
  variable: string;
  op: "set" | "add";
  value: string | number | boolean;
};

export type WorkflowNode = {
  id: string;
  kind: ActionKind;
  x: number;
  y: number;
  title: string;
  description: string;
  category: DomainCategory;
  status?: NodeStatus;
  data?: Record<string, any>;
  /** Evaluated in order for multi-port nodes; first match wins. */
  ruleGroups?: RuleGroup[];
  /** Port used when no rule group matches. Defaults to the last output port. */
  fallbackPort?: PortId;
  outputs?: NodeOutput[];
  customColor?: string;
  width?: number;
  height?: number;
  noteText?: string;
  /** Estimated study or completion minutes for scheduler and Today view. */
  estimatedMinutes?: number;
  /** Repetition target per week (e.g. 3 sessions/week). */
  sessionsPerWeek?: number;
  /** Fixed target deadline or exam milestone (ISO YYYY-MM-DD). */
  deadline?: string;
};

export type TaskStatus = "todo" | "done" | "skipped";

export type StudyTask = {
  id: string;
  workflowId: string;
  nodeId: string;
  date: string; // ISO date 'YYYY-MM-DD'
  minutes: number;
  title: string;
  description?: string;
  track: DomainCategory;
  status: TaskStatus;
  completedAt?: number;
};

export type ScheduleConfig = {
  examDate?: string; // ISO 'YYYY-MM-DD'
  examTitle?: string;
  dailyMinutesTarget: number; // e.g. 60 min/day
  restDays: number[]; // 0 = Sunday, 6 = Saturday, etc.
  startDate?: string; // ISO 'YYYY-MM-DD'
};

export type ScheduleStats = {
  streakDays: number;
  totalTasksCompleted: number;
  totalMinutesStudied: number;
  lastCompletedDate?: string;
};

export type SavedWorkflow = {
  id: string;
  name: string;
  templateId: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  /** Bumped when saved docs need migrating (see storage/db.ts). */
  schemaVersion?: number;
  /** Generated study tasks associated with this plan. */
  tasks?: StudyTask[];
  /** Schedule parameters and exam targets. */
  scheduleConfig?: ScheduleConfig;
};

export type WorkflowMeta = Pick<
  SavedWorkflow,
  "id" | "name" | "templateId" | "createdAt" | "updatedAt"
> & { nodeCount: number };

export type EdgeRoutingStyle = "smooth" | "orthogonal" | "curved" | "straight";

export type WorkflowEdge = {
  id: string;
  source: string;
  port: PortId;
  target: string;
  targetPort?: PortId;
  label?: string;
  style?: EdgeRoutingStyle;
  animated?: boolean;
  color?: string;
};

export type WorkflowView = {
  x: number;
  y: number;
  zoom: number;
};

export type WorkflowSelection = 
  | { type: "node"; id: string }
  | { type: "edge"; id: string }
  | { type: "multi"; nodeIds: string[]; edgeIds: string[] }
  | null;

export type RunStatus = "idle" | "running" | "paused" | "completed" | "error";

export type RunLog = {
  id: string;
  runIndex: number;
  nodeId: string | null;
  timestamp: number;
  level: "info" | "success" | "warning" | "error";
  message: string;
  details?: Record<string, any>;
};

export type SimulationVariable = {
  key: string;
  label: string;
  value: any;
  type: "string" | "number" | "boolean" | "list";
  category: DomainCategory;
};

export type AutomationTemplate = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: DomainCategory;
  badge: string;
  iconName: string;
  accentColor: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  defaultVariables: Record<string, any>;
  stats: {
    estimatedTime: string;
    targetScoreOrGoal: string;
    nodeCount: number;
    difficulty: "Beginner" | "Intermediate" | "Advanced" | "Comprehensive";
  };
};

import type {
  ActionKind,
  ScheduleConfig,
  ScheduleStats,
  StudyTask,
  WorkflowEdge,
  WorkflowNode,
} from "@/types/workflow";
import { makeId } from "@/storage/db";

/** Default study or exercise minutes by node kind when not explicitly overridden. */
export const DEFAULT_MINUTES_BY_KIND: Record<ActionKind, number> = {
  // Logic / Control nodes (0 = non-task milestone)
  trigger: 0,
  action: 30,
  branch: 0,
  delay: 0,
  "wait-until": 0,
  webhook: 0,
  notification: 0,
  ai_agent: 30,
  note: 0,

  // ESL
  esl_placement: 60,
  esl_vocab_drill: 25,
  esl_grammar_lab: 35,
  esl_speaking_ai: 30,
  esl_reading_pass: 30,
  esl_cefr_gate: 45,

  // IELTS
  ielts_diagnostic: 60,
  ielts_listening_sim: 40,
  ielts_reading_acad: 45,
  ielts_writing_eval: 60,
  ielts_speaking_mock: 30,
  ielts_band_predictor: 90,

  // SAT
  sat_baseline: 60,
  sat_adaptive_module: 45,
  sat_math_desmos: 40,
  sat_rw_synthesis: 40,
  sat_mock_exam: 134,
  sat_error_taxonomy: 30,

  // College Admissions
  college_profile_match: 45,
  college_essay_story: 60,
  college_rec_tracker: 25,
  college_fafsa_css: 45,
  college_decision_portal: 20,
  college_interview_prep: 45,

  // Productivity
  prod_inbox_triage: 15,
  prod_eisenhower: 20,
  prod_pomodoro_block: 50,
  prod_distraction_guard: 15,
  prod_habit_streak: 15,
  prod_weekly_retro: 30,
};

// ---------------- ISO Date Utilities ----------------

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function formatISODate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysISO(dateStr: string, days: number): string {
  const d = parseISODate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatISODate(d);
}

export function diffDays(dateA: string, dateB: string): number {
  const a = parseISODate(dateA).getTime();
  const b = parseISODate(dateB).getTime();
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

export function getDayOfWeek(dateStr: string): number {
  return parseISODate(dateStr).getUTCDay(); // 0 = Sunday, 1 = Monday... 6 = Saturday
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseISODate(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function getNextStudyDate(dateStr: string, restDays: number[]): string {
  let curr = dateStr;
  while (restDays.includes(getDayOfWeek(curr))) {
    curr = addDaysISO(curr, 1);
  }
  return curr;
}

// ---------------- Topological Sorter for DAG ----------------

export function getTopologicalNodeOrder(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const inDegree: Record<string, number> = {};
  const childrenMap: Record<string, string[]> = {};
  const nodeMap = new Map<string, WorkflowNode>();

  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    childrenMap[n.id] = [];
    nodeMap.set(n.id, n);
  });

  edges.forEach((e) => {
    if (inDegree[e.target] !== undefined) {
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    }
    if (childrenMap[e.source]) {
      childrenMap[e.source].push(e.target);
    }
  });

  const queue: string[] = [];
  nodes.forEach((n) => {
    if (inDegree[n.id] === 0) queue.push(n.id);
  });

  const orderedIds: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    orderedIds.push(curr);

    for (const child of childrenMap[curr] || []) {
      inDegree[child]--;
      if (inDegree[child] === 0 && !visited.has(child)) {
        queue.push(child);
      }
    }
  }

  // Include any remaining disconnected or cyclic nodes in their natural array order
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      orderedIds.push(n.id);
      visited.add(n.id);
    }
  });

  return orderedIds.map((id) => nodeMap.get(id)!).filter(Boolean);
}

// ---------------- Schedule Generator ----------------

export interface GenerateScheduleParams {
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  config?: Partial<ScheduleConfig>;
}

export function generateSchedule(params: {
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  config?: Partial<ScheduleConfig>;
}): { tasks: StudyTask[]; config: ScheduleConfig } {
  const { workflowId, nodes, edges } = params;

  const resolvedConfig: ScheduleConfig = {
    dailyMinutesTarget: params.config?.dailyMinutesTarget ?? 60,
    restDays: params.config?.restDays ?? [0], // Sunday is rest by default
    startDate: params.config?.startDate ?? getTodayISO(),
    examDate: params.config?.examDate,
    examTitle: params.config?.examTitle,
  };

  const orderedNodes = getTopologicalNodeOrder(nodes, edges);

  // Filter for nodes that represent real study tasks (duration > 0 and not note/trigger)
  const taskNodes = orderedNodes.filter((n) => {
    if (n.kind === "note" || n.kind === "trigger" || n.kind === "branch") return false;
    const mins = n.estimatedMinutes ?? DEFAULT_MINUTES_BY_KIND[n.kind] ?? 30;
    return mins > 0;
  });

  const tasks: StudyTask[] = [];
  let currentDate = getNextStudyDate(resolvedConfig.startDate!, resolvedConfig.restDays);
  let currentDayMinutes = 0;

  for (const node of taskNodes) {
    const minutes = node.estimatedMinutes ?? DEFAULT_MINUTES_BY_KIND[node.kind] ?? 30;
    const sessions = Math.max(1, node.sessionsPerWeek ? Math.min(node.sessionsPerWeek, 4) : 1);

    for (let s = 1; s <= sessions; s++) {
      // Check if current day exceeds target
      if (
        currentDayMinutes > 0 &&
        currentDayMinutes + minutes > resolvedConfig.dailyMinutesTarget
      ) {
        // Advance to next valid study day
        currentDate = getNextStudyDate(addDaysISO(currentDate, 1), resolvedConfig.restDays);
        currentDayMinutes = 0;
      }

      // Check if node has a hard deadline
      let taskDate = currentDate;
      if (node.deadline && node.deadline < currentDate) {
        taskDate = node.deadline;
      }

      // If examDate exists and we passed it, clamp to examDate or day before
      if (resolvedConfig.examDate && taskDate > resolvedConfig.examDate) {
        taskDate = resolvedConfig.examDate;
      }

      const taskTitle =
        sessions > 1 ? `${node.title} (Session ${s}/${sessions})` : node.title;

      tasks.push({
        id: makeId("task"),
        workflowId,
        nodeId: node.id,
        date: taskDate,
        minutes,
        title: taskTitle,
        description: node.description,
        track: node.category,
        status: "todo",
      });

      currentDayMinutes += minutes;

      // If multiple sessions for same node, spread subsequent sessions to future days
      if (s < sessions) {
        currentDate = getNextStudyDate(addDaysISO(currentDate, 2), resolvedConfig.restDays);
        currentDayMinutes = 0;
      }
    }
  }

  return { tasks, config: resolvedConfig };
}

// ---------------- "Never Miss Twice" Rescheduler ----------------

/**
 * Reschedules past overdue "todo" tasks without overwhelming today.
 * Places 1-2 urgent items today up to daily target, and rolls the rest
 * forward into upcoming days.
 */
export function rescheduleMissedTasks(
  tasks: StudyTask[],
  options?: {
    today?: string;
    dailyMinutesTarget?: number;
    restDays?: number[];
  }
): StudyTask[] {
  const today = options?.today ?? getTodayISO();
  const dailyTarget = options?.dailyMinutesTarget ?? 60;
  const restDays = options?.restDays ?? [0];

  const overdue = tasks.filter((t) => t.status === "todo" && t.date < today);
  if (overdue.length === 0) return tasks;

  const untouched = tasks.filter((t) => t.status !== "todo" || t.date >= today);

  // Group untouched future tasks by date to know daily loads
  const loadByDate: Record<string, number> = {};
  untouched.forEach((t) => {
    if (t.status === "todo") {
      loadByDate[t.date] = (loadByDate[t.date] || 0) + t.minutes;
    }
  });

  let scheduleDate = getNextStudyDate(today, restDays);
  const rebalancedOverdue: StudyTask[] = [];

  for (const task of overdue) {
    // Find next day with capacity
    while ((loadByDate[scheduleDate] || 0) + task.minutes > dailyTarget) {
      scheduleDate = getNextStudyDate(addDaysISO(scheduleDate, 1), restDays);
    }

    rebalancedOverdue.push({
      ...task,
      date: scheduleDate,
    });

    loadByDate[scheduleDate] = (loadByDate[scheduleDate] || 0) + task.minutes;
  }

  // Return combined sorted list
  const combined = [...untouched, ...rebalancedOverdue];
  combined.sort((a, b) => a.date.localeCompare(b.date));
  return combined;
}

// ---------------- Streak & Progress Stats ----------------

export function calculateScheduleStats(
  tasks: StudyTask[],
  todayISO = getTodayISO()
): ScheduleStats {
  const doneTasks = tasks.filter((t) => t.status === "done");
  const totalTasksCompleted = doneTasks.length;
  const totalMinutesStudied = doneTasks.reduce((acc, t) => acc + (t.minutes || 0), 0);

  if (doneTasks.length === 0) {
    return {
      streakDays: 0,
      totalTasksCompleted: 0,
      totalMinutesStudied: 0,
      lastCompletedDate: undefined,
    };
  }

  // Find set of distinct dates that had at least one completed task
  const completedDates = new Set<string>();
  doneTasks.forEach((t) => {
    if (t.completedAt) {
      completedDates.add(formatISODate(new Date(t.completedAt)));
    } else {
      completedDates.add(t.date);
    }
  });

  const sortedDates = [...completedDates].sort((a, b) => b.localeCompare(a));
  const lastCompletedDate = sortedDates[0];

  // Calculate consecutive days ending on today or yesterday
  let streak = 0;
  let checkDate = todayISO;

  // If nothing completed today yet, check if yesterday was completed
  if (!completedDates.has(checkDate)) {
    checkDate = addDaysISO(todayISO, -1);
  }

  // Count backwards day by day
  while (completedDates.has(checkDate)) {
    streak++;
    checkDate = addDaysISO(checkDate, -1);
  }

  return {
    streakDays: streak,
    totalTasksCompleted,
    totalMinutesStudied,
    lastCompletedDate,
  };
}

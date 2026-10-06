import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  calculateScheduleStats,
  diffDays,
  formatDisplayDate,
  formatISODate,
  generateSchedule,
  getDayOfWeek,
  getNextStudyDate,
  parseISODate,
  rescheduleMissedTasks,
} from "./scheduler";
import type { StudyTask, WorkflowEdge, WorkflowNode } from "@/types/workflow";

describe("scheduler date utilities", () => {
  it("formats and parses ISO dates consistently", () => {
    const iso = "2026-10-15";
    const parsed = parseISODate(iso);
    expect(formatISODate(parsed)).toBe(iso);
  });

  it("adds days correctly across month boundaries", () => {
    expect(addDaysISO("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDaysISO("2026-10-05", -5)).toBe("2026-09-30");
  });

  it("calculates difference in days", () => {
    expect(diffDays("2026-10-10", "2026-10-05")).toBe(5);
    expect(diffDays("2026-10-01", "2026-10-05")).toBe(-4);
  });

  it("computes day of week and skips rest days", () => {
    // 2026-10-04 is Sunday (0)
    expect(getDayOfWeek("2026-10-04")).toBe(0);
    // Sunday (0) is a rest day, next study date is Monday 2026-10-05
    expect(getNextStudyDate("2026-10-04", [0])).toBe("2026-10-05");
    // Monday (1) is not in restDays [0], so it returns Monday
    expect(getNextStudyDate("2026-10-05", [0])).toBe("2026-10-05");
  });

  it("formats display dates nicely", () => {
    expect(formatDisplayDate("2026-10-04")).toContain("Oct");
  });
});

describe("generateSchedule", () => {
  const nodes: WorkflowNode[] = [
    {
      id: "start",
      kind: "trigger",
      x: 0,
      y: 0,
      title: "Kickoff Trigger",
      description: "",
      category: "logic",
    },
    {
      id: "diag",
      kind: "ielts_diagnostic",
      x: 0,
      y: 100,
      title: "Diagnostic Test",
      description: "Baseline test",
      category: "ielts",
      estimatedMinutes: 60,
    },
    {
      id: "reading",
      kind: "ielts_reading_acad",
      x: 0,
      y: 200,
      title: "Reading Module",
      description: "Academic reading",
      category: "ielts",
      estimatedMinutes: 45,
    },
    {
      id: "writing",
      kind: "ielts_writing_eval",
      x: 0,
      y: 300,
      title: "Writing Practice",
      description: "Task 2 essay",
      category: "ielts",
      estimatedMinutes: 60,
    },
    {
      id: "note",
      kind: "note",
      x: 0,
      y: 400,
      title: "Tip Note",
      description: "Study hint",
      category: "utility",
    },
  ];

  const edges: WorkflowEdge[] = [
    { id: "e1", source: "start", port: "out", target: "diag" },
    { id: "e2", source: "diag", port: "out", target: "reading" },
    { id: "e3", source: "reading", port: "out", target: "writing" },
  ];

  it("filters out triggers and notes, and spaces tasks by daily target", () => {
    // 2026-10-05 is Monday
    const { tasks, config } = generateSchedule({
      workflowId: "test-wf",
      nodes,
      edges,
      config: {
        startDate: "2026-10-05",
        dailyMinutesTarget: 60,
        restDays: [0], // Sunday
      },
    });

    expect(config.dailyMinutesTarget).toBe(60);
    // Non-task nodes excluded, 3 study tasks remain
    expect(tasks).toHaveLength(3);
    expect(tasks.map((t) => t.nodeId)).toEqual(["diag", "reading", "writing"]);

    // diag is 60m (fills day 1: 2026-10-05)
    expect(tasks[0].date).toBe("2026-10-05");
    expect(tasks[0].minutes).toBe(60);

    // reading is 45m (moves to day 2: 2026-10-06)
    expect(tasks[1].date).toBe("2026-10-06");
    expect(tasks[1].minutes).toBe(45);

    // writing is 60m (moves to day 3: 2026-10-07)
    expect(tasks[2].date).toBe("2026-10-07");
    expect(tasks[2].minutes).toBe(60);
  });

  it("packs multiple short tasks into one day up to target minutes", () => {
    const shortNodes: WorkflowNode[] = [
      { id: "n1", kind: "action", x: 0, y: 0, title: "Vocab 1", description: "", category: "esl", estimatedMinutes: 20 },
      { id: "n2", kind: "action", x: 0, y: 0, title: "Vocab 2", description: "", category: "esl", estimatedMinutes: 20 },
      { id: "n3", kind: "action", x: 0, y: 0, title: "Vocab 3", description: "", category: "esl", estimatedMinutes: 20 },
    ];

    const { tasks } = generateSchedule({
      workflowId: "test-short",
      nodes: shortNodes,
      edges: [],
      config: {
        startDate: "2026-10-05",
        dailyMinutesTarget: 60,
        restDays: [],
      },
    });

    expect(tasks).toHaveLength(3);
    // All 3 sum to 60m, fitting on the same day!
    expect(tasks[0].date).toBe("2026-10-05");
    expect(tasks[1].date).toBe("2026-10-05");
    expect(tasks[2].date).toBe("2026-10-05");
  });
});

describe("rescheduleMissedTasks (Never Miss Twice)", () => {
  it("rolls overdue tasks forward without overloading today", () => {
    const today = "2026-10-10";
    const initialTasks: StudyTask[] = [
      {
        id: "t1",
        workflowId: "w",
        nodeId: "n1",
        date: "2026-10-08", // 2 days ago
        minutes: 40,
        title: "Missed Vocab",
        track: "esl",
        status: "todo",
      },
      {
        id: "t2",
        workflowId: "w",
        nodeId: "n2",
        date: "2026-10-09", // yesterday
        minutes: 40,
        title: "Missed Grammar",
        track: "esl",
        status: "todo",
      },
      {
        id: "t3",
        workflowId: "w",
        nodeId: "n3",
        date: "2026-10-10", // today
        minutes: 30,
        title: "Today Listening",
        track: "ielts",
        status: "todo",
      },
    ];

    const rebalanced = rescheduleMissedTasks(initialTasks, {
      today,
      dailyMinutesTarget: 60,
      restDays: [],
    });

    // None should be dated before today
    expect(rebalanced.some((t) => t.date < today)).toBe(false);

    // Today already had 30m; adding one 40m overdue task would exceed 60m,
    // so today gets kept at 30m, next day gets the first overdue, next day gets the second
    expect(rebalanced).toHaveLength(3);
    const dates = rebalanced.map((t) => t.date);
    expect(dates).toContain("2026-10-10");
  });
});

describe("calculateScheduleStats & Streaks", () => {
  it("calculates 0 for no completed tasks", () => {
    const stats = calculateScheduleStats([], "2026-10-10");
    expect(stats.streakDays).toBe(0);
    expect(stats.totalTasksCompleted).toBe(0);
  });

  it("calculates active streak including today and yesterday", () => {
    const tasks: StudyTask[] = [
      { id: "1", workflowId: "w", nodeId: "a", date: "2026-10-08", minutes: 30, title: "A", track: "sat", status: "done" },
      { id: "2", workflowId: "w", nodeId: "b", date: "2026-10-09", minutes: 45, title: "B", track: "sat", status: "done" },
      { id: "3", workflowId: "w", nodeId: "c", date: "2026-10-10", minutes: 25, title: "C", track: "sat", status: "done" },
    ];

    const stats = calculateScheduleStats(tasks, "2026-10-10");
    expect(stats.streakDays).toBe(3);
    expect(stats.totalTasksCompleted).toBe(3);
    expect(stats.totalMinutesStudied).toBe(100);
  });

  it("preserves streak if yesterday was completed and today is in progress", () => {
    const tasks: StudyTask[] = [
      { id: "1", workflowId: "w", nodeId: "a", date: "2026-10-08", minutes: 30, title: "A", track: "sat", status: "done" },
      { id: "2", workflowId: "w", nodeId: "b", date: "2026-10-09", minutes: 45, title: "B", track: "sat", status: "done" },
      // Today (2026-10-10) is still "todo"
      { id: "3", workflowId: "w", nodeId: "c", date: "2026-10-10", minutes: 25, title: "C", track: "sat", status: "todo" },
    ];

    const stats = calculateScheduleStats(tasks, "2026-10-10");
    expect(stats.streakDays).toBe(2);
  });
});

import type {
  AppView,
  ScheduleConfig,
  ScheduleSlice,
  ScheduleStats,
  SliceCreator,
  StudyTask,
  TaskStatus,
} from "./types";
import {
  addDaysISO,
  calculateScheduleStats,
  generateSchedule,
  getTodayISO,
  rescheduleMissedTasks,
} from "@/engine/scheduler";
import confetti from "canvas-confetti";

let timerInterval: ReturnType<typeof setInterval> | null = null;

const initialConfig: ScheduleConfig = {
  dailyMinutesTarget: 60,
  restDays: [0], // Sunday
  startDate: getTodayISO(),
  examTitle: "Target Milestone",
  examDate: addDaysISO(getTodayISO(), 60),
};

const initialStats: ScheduleStats = {
  streakDays: 0,
  totalTasksCompleted: 0,
  totalMinutesStudied: 0,
};

export const createScheduleSlice: SliceCreator<ScheduleSlice> = (set, get) => ({
  activeView: "today",
  tasks: [],
  scheduleConfig: initialConfig,
  scheduleStats: initialStats,
  activeFocusTaskId: null,
  focusTimerMinutes: 25,
  focusTimerSecondsRemaining: 25 * 60,
  isFocusTimerRunning: false,

  setActiveView: (view: AppView) => {
    set({ activeView: view });
    // If switching to canvas, ensure viewport is fitted
    if (view === "canvas") {
      requestAnimationFrame(() => {
        get().fitView();
      });
    }
  },

  setTasks: (tasks: StudyTask[]) => {
    const stats = calculateScheduleStats(tasks);
    set({ tasks, scheduleStats: stats });
  },

  toggleTaskStatus: (taskId: string, forceStatus?: TaskStatus) => {
    const prevTasks = get().tasks;
    const taskIndex = prevTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const currentTask = prevTasks[taskIndex];
    const newStatus: TaskStatus =
      forceStatus ?? (currentTask.status === "done" ? "todo" : "done");

    const updatedTasks = [...prevTasks];
    updatedTasks[taskIndex] = {
      ...currentTask,
      status: newStatus,
      completedAt: newStatus === "done" ? Date.now() : undefined,
    };

    const newStats = calculateScheduleStats(updatedTasks);
    set({ tasks: updatedTasks, scheduleStats: newStats });

    // Check if user completed all tasks for today!
    if (newStatus === "done") {
      const today = getTodayISO();
      const todaysTasks = updatedTasks.filter((t) => t.date === today);
      const allTodayDone =
        todaysTasks.length > 0 && todaysTasks.every((t) => t.status === "done");

      if (allTodayDone) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        } catch {
          /* ignore outside browser */
        }
      }
    }
  },

  updateTaskDate: (taskId: string, newDate: string) => {
    const updated = get().tasks.map((t) => (t.id === taskId ? { ...t, date: newDate } : t));
    const newStats = calculateScheduleStats(updated);
    set({ tasks: updated, scheduleStats: newStats });
  },

  recalibrateSchedule: () => {
    const { tasks, scheduleConfig } = get();
    const rebalanced = rescheduleMissedTasks(tasks, {
      today: getTodayISO(),
      dailyMinutesTarget: scheduleConfig.dailyMinutesTarget,
      restDays: scheduleConfig.restDays,
    });
    const newStats = calculateScheduleStats(rebalanced);
    set({ tasks: rebalanced, scheduleStats: newStats });
    get().pushLog("info", "Schedule recalibrated: overdue tasks rolled forward evenly.");
  },

  generateScheduleForWorkflow: () => {
    const s = get();
    const { tasks, config } = generateSchedule({
      workflowId: s.currentDocId || "default",
      nodes: s.nodes,
      edges: s.edges,
      config: s.scheduleConfig,
    });
    const stats = calculateScheduleStats(tasks);
    set({
      tasks,
      scheduleConfig: config,
      scheduleStats: stats,
    });
    s.pushLog("success", `Generated ${tasks.length} study tasks from workflow roadmap.`);
  },

  updateScheduleConfig: (patch: Partial<ScheduleConfig>) => {
    const newConfig = { ...get().scheduleConfig, ...patch };
    set({ scheduleConfig: newConfig });
  },

  setActiveFocusTaskId: (taskId: string | null) => {
    set({ activeFocusTaskId: taskId });
    if (taskId) {
      const task = get().tasks.find((t) => t.id === taskId);
      if (task && task.minutes > 0) {
        set({
          focusTimerMinutes: task.minutes,
          focusTimerSecondsRemaining: task.minutes * 60,
        });
      }
    }
  },

  startFocusTimer: (minutes?: number) => {
    if (timerInterval) clearInterval(timerInterval);
    const targetMins = minutes ?? get().focusTimerMinutes;
    set({
      isFocusTimerRunning: true,
      focusTimerMinutes: targetMins,
      focusTimerSecondsRemaining: targetMins * 60,
    });

    timerInterval = setInterval(() => {
      get().tickFocusTimer();
    }, 1000);
  },

  pauseFocusTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    set({ isFocusTimerRunning: false });
  },

  resetFocusTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    const mins = get().focusTimerMinutes;
    set({
      isFocusTimerRunning: false,
      focusTimerSecondsRemaining: mins * 60,
    });
  },

  tickFocusTimer: () => {
    const remaining = get().focusTimerSecondsRemaining;
    if (remaining <= 1) {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      set({
        isFocusTimerRunning: false,
        focusTimerSecondsRemaining: 0,
      });

      // Complete active task if linked
      const activeTaskId = get().activeFocusTaskId;
      if (activeTaskId) {
        get().toggleTaskStatus(activeTaskId, "done");
      }

      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.7 },
        });
      } catch {
        /* ignore outside browser */
      }
    } else {
      set({ focusTimerSecondsRemaining: remaining - 1 });
    }
  },
});

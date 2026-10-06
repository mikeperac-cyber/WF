import React, { useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import {
  diffDays,
  formatDisplayDate,
  getTodayISO,
  addDaysISO,
} from "@/engine/scheduler";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Target,
  Timer,
  Zap,
  ChevronRight,
  RefreshCw,
  Trophy,
  Coffee,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import type { DomainCategory } from "@/types/workflow";

const TRACK_STYLES: Record<
  DomainCategory,
  { bg: string; text: string; border: string; label: string; accent: string }
> = {
  esl: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    label: "ESL CEFR",
    accent: "#10B981",
  },
  ielts: {
    bg: "bg-sky-500/10 dark:bg-sky-500/15",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/30",
    label: "IELTS 8.5+",
    accent: "#0EA5E9",
  },
  sat: {
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30",
    label: "SAT 1550+",
    accent: "#8B5CF6",
  },
  college: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
    label: "Admissions",
    accent: "#F59E0B",
  },
  productivity: {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30",
    label: "Productivity",
    accent: "#F43F5E",
  },
  logic: {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/30",
    label: "Logic",
    accent: "#6366F1",
  },
  utility: {
    bg: "bg-slate-500/10 dark:bg-slate-500/15",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30",
    label: "Utility",
    accent: "#64748B",
  },
};

export const TodayView: React.FC = () => {
  const tasks = useWorkflowStore((s) => s.tasks);
  const scheduleConfig = useWorkflowStore((s) => s.scheduleConfig);
  const scheduleStats = useWorkflowStore((s) => s.scheduleStats);
  const docName = useWorkflowStore((s) => s.docName);
  const activeFocusTaskId = useWorkflowStore((s) => s.activeFocusTaskId);
  const focusTimerSecondsRemaining = useWorkflowStore((s) => s.focusTimerSecondsRemaining);
  const isFocusTimerRunning = useWorkflowStore((s) => s.isFocusTimerRunning);
  const focusTimerMinutes = useWorkflowStore((s) => s.focusTimerMinutes);

  const toggleTaskStatus = useWorkflowStore((s) => s.toggleTaskStatus);
  const recalibrateSchedule = useWorkflowStore((s) => s.recalibrateSchedule);
  const generateScheduleForWorkflow = useWorkflowStore((s) => s.generateScheduleForWorkflow);
  const setActiveFocusTaskId = useWorkflowStore((s) => s.setActiveFocusTaskId);
  const startFocusTimer = useWorkflowStore((s) => s.startFocusTimer);
  const pauseFocusTimer = useWorkflowStore((s) => s.pauseFocusTimer);
  const resetFocusTimer = useWorkflowStore((s) => s.resetFocusTimer);
  const updateScheduleConfig = useWorkflowStore((s) => s.updateScheduleConfig);
  const setActiveView = useWorkflowStore((s) => s.setActiveView);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState(scheduleConfig.examTitle ?? "Exam / Target");
  const [goalDate, setGoalDate] = useState(scheduleConfig.examDate ?? addDaysISO(getTodayISO(), 45));

  const today = getTodayISO();

  // Tasks for today
  const todaysTasks = tasks.filter((t) => t.date === today);
  const todaysDoneCount = todaysTasks.filter((t) => t.status === "done").length;
  const todaysTotalCount = todaysTasks.length;
  const todaysTotalMinutes = todaysTasks.reduce((acc, t) => acc + (t.minutes || 0), 0);
  const todaysDoneMinutes = todaysTasks
    .filter((t) => t.status === "done")
    .reduce((acc, t) => acc + (t.minutes || 0), 0);
  const progressPercent =
    todaysTotalCount > 0 ? Math.round((todaysDoneCount / todaysTotalCount) * 100) : 0;

  // Overdue tasks
  const overdueTasks = tasks.filter((t) => t.date < today && t.status === "todo");

  // Horizon: tasks for the next 3 days
  const horizonDates = [1, 2, 3].map((offset) => addDaysISO(today, offset));
  const upcomingTasks = tasks.filter((t) => horizonDates.includes(t.date));

  // Days until target exam/goal
  const daysUntilExam = scheduleConfig.examDate ? diffDays(scheduleConfig.examDate, today) : null;

  // Formatted focus timer display
  const timerMins = Math.floor(focusTimerSecondsRemaining / 60);
  const timerSecs = focusTimerSecondsRemaining % 60;
  const formattedTime = `${String(timerMins).padStart(2, "0")}:${String(timerSecs).padStart(2, "0")}`;

  const activeFocusTask = tasks.find((t) => t.id === activeFocusTaskId);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    updateScheduleConfig({
      examTitle: goalTitle,
      examDate: goalDate,
    });
    setIsEditingGoal(false);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-[#080B11] text-slate-800 dark:text-slate-100 p-4 md:p-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        {/* Top Hero Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Countdown Card */}
          <div className="md:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-xl">
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20 mb-2">
                    <Target className="w-3.5 h-3.5 text-amber-300" />
                    <span>{scheduleConfig.examTitle ?? "Target Goal"}</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    {docName || "Active Study Plan"}
                  </h2>
                </div>

                <button
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                  title="Edit exam goal date & title"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>

              {isEditingGoal ? (
                <form
                  onSubmit={handleSaveGoal}
                  className="mt-4 p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/20 flex flex-wrap gap-2 items-center text-xs"
                >
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="Milestone title (e.g. IELTS 8.5 Mock)"
                    className="px-2.5 py-1.5 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none flex-1 min-w-[140px]"
                  />
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-white text-indigo-900 font-bold hover:bg-white/90 transition-colors"
                  >
                    Save Target
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-2 border-t border-white/15 text-xs text-white/85">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-300" />
                    <span>
                      Target:{" "}
                      <strong className="text-white">
                        {scheduleConfig.examDate ? formatDisplayDate(scheduleConfig.examDate) : "Flexible pace"}
                      </strong>
                    </span>
                  </div>
                  {daysUntilExam !== null && (
                    <div className="px-2.5 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200 font-bold">
                      {daysUntilExam > 0
                        ? `⏱️ ${daysUntilExam} days remaining`
                        : daysUntilExam === 0
                        ? "🎉 Exam Day Today!"
                        : `${Math.abs(daysUntilExam)} days post-exam`}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Background Decorative Rings */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute right-12 -top-12 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          </div>

          {/* Daily Streak & Velocity Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Momentum
              </span>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                <Flame className="w-4 h-4 fill-current text-amber-500 animate-pulse" />
                <span>{scheduleStats.streakDays} Day Streak</span>
              </div>
            </div>

            <div className="my-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                <span>{todaysDoneCount}</span>
                <span className="text-slate-400 text-lg font-normal">/ {todaysTotalCount}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
                  tasks today
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {todaysDoneMinutes} / {todaysTotalMinutes} mins studied
              </span>
              <span>{progressPercent}% completed</span>
            </div>
          </div>
        </div>

        {/* Never Miss Twice / Overdue Banner */}
        {overdueTasks.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-4 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  "Never Miss Twice" Protection
                </h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-0.5">
                  You have <strong>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}</strong> from previous days.
                  Rebalancing smooths them into this week without cramming.
                </p>
              </div>
            </div>

            <button
              onClick={recalibrateSchedule}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rebalance Schedule</span>
            </button>
          </div>
        )}

        {/* Interactive Focus Timer Widget (Pomodoro / Ultradian) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Deep Work Focus Timer</span>
                  {activeFocusTask && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Task: {activeFocusTask.title}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isFocusTimerRunning
                    ? "Session in progress — silence notifications and focus completely."
                    : "Pick a duration or link a study step below to begin your focus block."}
                </p>
              </div>
            </div>

            {/* Digits & Play/Pause Controls */}
            <div className="flex items-center gap-3 self-center md:self-auto">
              <div className="font-mono text-3xl font-black tracking-tight text-slate-900 dark:text-white px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                {formattedTime}
              </div>

              {isFocusTimerRunning ? (
                <button
                  onClick={pauseFocusTimer}
                  className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold transition-all shadow-md active:scale-95"
                  title="Pause timer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => startFocusTimer()}
                  className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-glow-sm hover:scale-105 active:scale-95"
                  title="Start session"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              )}

              <button
                onClick={resetFocusTimer}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Preset buttons */}
              <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
                {[
                  { label: "25m", mins: 25 },
                  { label: "50m", mins: 50 },
                  { label: "90m", mins: 90 },
                ].map(({ label, mins }) => (
                  <button
                    key={mins}
                    onClick={() => startFocusTimer(mins)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      focusTimerMinutes === mins
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Today's Action Steps
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ({formatDisplayDate(today)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={generateScheduleForWorkflow}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Re-sync tasks with current node graph"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sync with Plan</span>
              </button>

              <button
                onClick={() => setActiveView("calendar")}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/40 text-xs font-semibold text-indigo-600 dark:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>View Full Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {todaysTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center bg-white/50 dark:bg-slate-900/30">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Coffee className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Tasks Scheduled for Today
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Today is either a designated rest day, or your tasks for this week are complete.
                Rest and consolidation are crucial for high exam performance.
              </p>
              <button
                onClick={() => setActiveView("calendar")}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                Check Upcoming Week
              </button>
            </div>
          ) : todaysDoneCount === todaysTotalCount ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 p-6 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-emerald-900 dark:text-emerald-200">
                Daily Target Crushed! 🎉
              </h4>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-1">
                You've completed all {todaysTotalCount} study blocks for today ({todaysTotalMinutes} minutes total).
                Your streak is protected!
              </p>
            </div>
          ) : null}

          {/* Task Card List */}
          <div className="space-y-2.5">
            {todaysTasks.map((task) => {
              const track = TRACK_STYLES[task.track as DomainCategory] ?? TRACK_STYLES.logic;
              const isDone = task.status === "done";
              const isFocusActive = activeFocusTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`group rounded-2xl border p-4 transition-all ${
                    isDone
                      ? "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-60"
                      : isFocusActive
                      ? "bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-500/60 shadow-md ring-2 ring-indigo-500/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox & Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                        title={isDone ? "Mark as uncompleted" : "Mark as completed"}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-5 h-5 hover:scale-110 transition-transform" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${track.bg} ${track.text} ${track.border}`}
                          >
                            {track.label}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.minutes} min
                          </span>
                        </div>

                        <h4
                          className={`text-sm font-bold text-slate-900 dark:text-white leading-tight ${
                            isDone ? "line-through text-slate-400 dark:text-slate-500" : ""
                          }`}
                        >
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Start Focus Session */}
                    {!isDone && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setActiveFocusTaskId(task.id);
                            startFocusTimer(task.minutes);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                            isFocusActive
                              ? "bg-indigo-600 text-white font-bold animate-pulse"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700"
                          }`}
                          title="Focus on this step with timer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {isFocusActive ? "Focusing" : "Focus"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Horizon: Next 3 Days Preview */}
        {upcomingTasks.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Upcoming Horizon (Next 3 Days)
              </h4>
              <button
                onClick={() => setActiveView("calendar")}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Schedule</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {horizonDates.map((dateStr) => {
                const dayTasks = tasks.filter((t) => t.date === dateStr);
                const totalMins = dayTasks.reduce((acc, t) => acc + t.minutes, 0);

                return (
                  <div
                    key={dateStr}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatDisplayDate(dateStr)}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {totalMins} min
                      </span>
                    </div>

                    {dayTasks.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Rest / Catch-up day</span>
                    ) : (
                      <div className="space-y-1.5">
                        {dayTasks.map((t) => (
                          <div
                            key={t.id}
                            className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate flex items-center gap-1"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: TRACK_STYLES[t.track as DomainCategory]?.accent ?? "#6366F1" }}
                            />
                            <span className="truncate">{t.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

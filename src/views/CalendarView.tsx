import React, { useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import {
  addDaysISO,
  formatDisplayDate,
  formatISODate,
  getDayOfWeek,
  getTodayISO,
  parseISODate,
} from "@/engine/scheduler";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  RefreshCw,
  Settings2,
  Sliders,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import type { DomainCategory } from "@/types/workflow";

const TRACK_COLORS: Record<DomainCategory, { bg: string; text: string; dot: string; label: string }> = {
  esl: { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300", dot: "#10B981", label: "ESL" },
  ielts: { bg: "bg-sky-500/10 dark:bg-sky-500/15", text: "text-sky-700 dark:text-sky-300", dot: "#0EA5E9", label: "IELTS" },
  sat: { bg: "bg-purple-500/10 dark:bg-purple-500/15", text: "text-purple-700 dark:text-purple-300", dot: "#8B5CF6", label: "SAT" },
  college: { bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-300", dot: "#F59E0B", label: "College" },
  productivity: { bg: "bg-rose-500/10 dark:bg-rose-500/15", text: "text-rose-700 dark:text-rose-300", dot: "#F43F5E", label: "Productivity" },
  logic: { bg: "bg-indigo-500/10 dark:bg-indigo-500/15", text: "text-indigo-700 dark:text-indigo-300", dot: "#6366F1", label: "Logic" },
  utility: { bg: "bg-slate-500/10 dark:bg-slate-500/15", text: "text-slate-700 dark:text-slate-300", dot: "#64748B", label: "Utility" },
};

export const CalendarView: React.FC = () => {
  const tasks = useWorkflowStore((s) => s.tasks);
  const scheduleConfig = useWorkflowStore((s) => s.scheduleConfig);
  const toggleTaskStatus = useWorkflowStore((s) => s.toggleTaskStatus);
  const updateTaskDate = useWorkflowStore((s) => s.updateTaskDate);
  const recalibrateSchedule = useWorkflowStore((s) => s.recalibrateSchedule);
  const generateScheduleForWorkflow = useWorkflowStore((s) => s.generateScheduleForWorkflow);
  const updateScheduleConfig = useWorkflowStore((s) => s.updateScheduleConfig);

  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const today = getTodayISO();

  // ---------------- Week View Calculations ----------------
  // Compute start of week (Monday) based on weekOffset
  const todayD = parseISODate(today);
  const todayDayOfWeek = todayD.getUTCDay(); // 0 = Sun, 1 = Mon...
  const distToMonday = todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek;
  const currentMondayStr = addDaysISO(today, distToMonday + weekOffset * 7);

  const weekDays = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDaysISO(currentMondayStr, offset));

  // ---------------- Month View Calculations ----------------
  const currentMonthDate = new Date(todayD.getUTCFullYear(), todayD.getUTCMonth() + monthOffset, 1);
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create monthly grid cells
  const monthGridDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const leadingDaysCount = (firstDayOfWeek + 6) % 7; // Monday-based
  for (let i = leadingDaysCount - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1, prevMonthLastDay - i));
    monthGridDays.push({
      dateStr: formatISODate(d),
      dayNum: prevMonthLastDay - i,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(year, month, d));
    monthGridDays.push({
      dateStr: formatISODate(dt),
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Trailing days for grid balance (up to 35 or 42)
  const remaining = (7 - (monthGridDays.length % 7)) % 7;
  for (let t = 1; t <= remaining; t++) {
    const dt = new Date(Date.UTC(year, month + 1, t));
    monthGridDays.push({
      dateStr: formatISODate(dt),
      dayNum: t,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-[#080B11] text-slate-800 dark:text-slate-100 p-4 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
          {/* Left: Title & Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-glow-sm">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Study Schedule</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {tasks.length} Planned Sessions
                </span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Paced automatically from your active workflow graph
              </span>
            </div>
          </div>

          {/* Center: Week / Month Switcher & Pagination */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setCalendarMode("week")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  calendarMode === "week"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Week View
              </button>
              <button
                onClick={() => setCalendarMode("month")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  calendarMode === "month"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Month View
              </button>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() =>
                  calendarMode === "week"
                    ? setWeekOffset((prev) => prev - 1)
                    : setMonthOffset((prev) => prev - 1)
                }
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  calendarMode === "week" ? setWeekOffset(0) : setMonthOffset(0)
                }
                className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() =>
                  calendarMode === "week"
                    ? setWeekOffset((prev) => prev + 1)
                    : setMonthOffset((prev) => prev + 1)
                }
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Sync & Settings */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={recalibrateSchedule}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Never Miss Twice: smoothly roll forward overdue tasks"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Never Miss Twice</span>
            </button>

            <button
              onClick={generateScheduleForWorkflow}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-glow-sm hover:scale-105"
              title="Regenerate all dates from workflow graph"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync Plan</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Schedule pace & rest day settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ---------------- WEEK VIEW ---------------- */}
        {calendarMode === "week" && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((dateStr) => {
              const dayTasks = tasks.filter((t) => t.date === dateStr);
              const dayOfWeek = getDayOfWeek(dateStr);
              const isRestDay = scheduleConfig.restDays.includes(dayOfWeek);
              const isToday = dateStr === today;
              const totalMins = dayTasks.reduce((acc, t) => acc + (t.minutes || 0), 0);
              const doneCount = dayTasks.filter((t) => t.status === "done").length;

              return (
                <div
                  key={dateStr}
                  className={`rounded-2xl border flex flex-col min-h-[460px] p-3 transition-all ${
                    isToday
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/50 shadow-md ring-2 ring-indigo-500/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 shadow-sm"
                  }`}
                >
                  {/* Day Header */}
                  <div className="pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                        {new Date(parseISODate(dateStr)).toLocaleDateString("en-US", {
                          weekday: "short",
                          timeZone: "UTC",
                        })}
                      </span>
                      <h4
                        className={`text-sm font-black ${
                          isToday
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {formatDisplayDate(dateStr).split(",")[1]}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 block">
                        {totalMins}m
                      </span>
                      {isRestDay && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          Rest Day
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Day Task List */}
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {dayTasks.length === 0 ? (
                      <div className="h-32 flex items-center justify-center text-center text-xs text-slate-400 italic">
                        {isRestDay ? "Designated rest" : "No sessions"}
                      </div>
                    ) : (
                      dayTasks.map((task) => {
                        const track = TRACK_COLORS[task.track as DomainCategory] ?? TRACK_COLORS.logic;
                        const isDone = task.status === "done";

                        return (
                          <div
                            key={task.id}
                            className={`group rounded-xl border p-2.5 text-xs transition-all ${
                              isDone
                                ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/60 opacity-60"
                                : "bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <button
                                onClick={() => toggleTaskStatus(task.id)}
                                className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                                title={isDone ? "Mark as todo" : "Mark as done"}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                                ) : (
                                  <Circle className="w-4 h-4 hover:scale-110 transition-transform" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${track.bg} ${track.text}`}
                                  >
                                    {track.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {task.minutes}m
                                  </span>
                                </div>

                                <h5
                                  className={`font-semibold text-slate-800 dark:text-slate-200 leading-tight line-clamp-2 ${
                                    isDone ? "line-through text-slate-400" : ""
                                  }`}
                                >
                                  {task.title}
                                </h5>

                                {/* Quick Shift Controls */}
                                <div className="mt-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/40 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() =>
                                      updateTaskDate(task.id, addDaysISO(task.date, 1))
                                    }
                                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                    title="Shift task to tomorrow"
                                  >
                                    <span>Tomorrow</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Day Footer */}
                  {dayTasks.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{doneCount} of {dayTasks.length} done</span>
                      {doneCount === dayTasks.length && (
                        <span className="text-emerald-500 font-bold">Done! ✓</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- MONTH VIEW ---------------- */}
        {calendarMode === "month" && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{monthName}</h3>
              <span className="text-xs text-slate-400 font-medium">
                Click any day to inspect planned load
              </span>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* 7-column Monthly Grid */}
            <div className="grid grid-cols-7 gap-2">
              {monthGridDays.map(({ dateStr, dayNum, isCurrentMonth }) => {
                const dayTasks = tasks.filter((t) => t.date === dateStr);
                const isToday = dateStr === today;
                const isExam = scheduleConfig.examDate === dateStr;

                return (
                  <div
                    key={dateStr}
                    className={`min-h-[90px] rounded-xl border p-2 flex flex-col justify-between transition-all ${
                      !isCurrentMonth
                        ? "bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-900 text-slate-400 opacity-40"
                        : isToday
                        ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500/60 shadow-sm"
                        : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {dayNum}
                      </span>

                      {isExam && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-sm">
                          EXAM 🎯
                        </span>
                      )}
                    </div>

                    {/* Task Indicators */}
                    <div className="space-y-1 my-1">
                      {dayTasks.slice(0, 2).map((t) => {
                        const track = TRACK_COLORS[t.track as DomainCategory] ?? TRACK_COLORS.logic;
                        return (
                          <div
                            key={t.id}
                            className={`text-[10px] font-medium truncate px-1.5 py-0.5 rounded ${track.bg} ${track.text}`}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 pl-1">
                          +{dayTasks.length - 2} more
                        </span>
                      )}
                    </div>

                    <div className="text-[9px] text-slate-400 font-medium text-right">
                      {dayTasks.length > 0
                        ? `${dayTasks.reduce((acc, t) => acc + t.minutes, 0)}m`
                        : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- SETTINGS MODAL ---------------- */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-fade-in text-slate-800 dark:text-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Schedule Pacing Settings</span>
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Daily Minutes Target */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Daily Study Target (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => updateScheduleConfig({ dailyMinutesTarget: mins })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        scheduleConfig.dailyMinutesTarget === mins
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {mins}m / day
                    </button>
                  ))}
                </div>
              </div>

              {/* Rest Days Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Rest Days (No New Tasks Scheduled)
                </label>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {[
                    { label: "S", day: 0 },
                    { label: "M", day: 1 },
                    { label: "T", day: 2 },
                    { label: "W", day: 3 },
                    { label: "T", day: 4 },
                    { label: "F", day: 5 },
                    { label: "S", day: 6 },
                  ].map(({ label, day }) => {
                    const isRest = scheduleConfig.restDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const newRestDays = isRest
                            ? scheduleConfig.restDays.filter((d: number) => d !== day)
                            : [...scheduleConfig.restDays, day];
                          updateScheduleConfig({ restDays: newRestDays });
                        }}
                        className={`py-2 rounded-lg font-bold border transition-colors ${
                          isRest
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Exam Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Target Exam Date
                </label>
                <input
                  type="date"
                  value={scheduleConfig.examDate ?? ""}
                  onChange={(e) => updateScheduleConfig({ examDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    generateScheduleForWorkflow();
                    setIsSettingsOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-glow-sm"
                >
                  Save & Regenerate Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

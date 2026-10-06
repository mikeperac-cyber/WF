import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useWorkflowStore } from "@/stores/workflowStore";
import { TEMPLATE_LIST } from "@/data/templates";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Plus,
  Download,
  Undo2,
  Redo2,
  Route,
  ChevronDown,
  Sun,
  Moon,
  KeyRound,
  Zap,
  StepForward,
  FolderOpen,
  Check,
  Loader2,
  AlertCircle,
  CheckSquare,
  Calendar,
  Workflow,
} from "lucide-react";
import type { EdgeRoutingStyle } from "@/types/workflow";

const templateAccent = new Map(TEMPLATE_LIST.map((t) => [t.id, t.accentColor]));

export const TopNavBar: React.FC = () => {
  const {
    activeView,
    activeTemplateId,
    docName,
    saveStatus,
    runStatus,
    executionSpeed,
    edgeRoutingStyle,
    theme,
    aiConfig,
    canUndo,
    canRedo,
  } = useWorkflowStore(
    useShallow((s) => ({
      activeView: s.activeView,
      activeTemplateId: s.activeTemplateId,
      docName: s.docName,
      saveStatus: s.saveStatus,
      runStatus: s.runStatus,
      executionSpeed: s.executionSpeed,
      edgeRoutingStyle: s.edgeRoutingStyle,
      theme: s.theme,
      aiConfig: s.aiConfig,
      canUndo: s.past.length > 0,
      canRedo: s.future.length > 0,
    }))
  );
  const setActiveView = useWorkflowStore((s) => s.setActiveView);
  const toggleTheme = useWorkflowStore((s) => s.toggleTheme);
  const setAiSettingsModalOpen = useWorkflowStore((s) => s.setAiSettingsModalOpen);
  const startSimulation = useWorkflowStore((s) => s.startSimulation);
  const pauseSimulation = useWorkflowStore((s) => s.pauseSimulation);
  const resetSimulation = useWorkflowStore((s) => s.resetSimulation);
  const stepSimulation = useWorkflowStore((s) => s.stepSimulation);
  const setExecutionSpeed = useWorkflowStore((s) => s.setExecutionSpeed);
  const setEdgeRoutingStyle = useWorkflowStore((s) => s.setEdgeRoutingStyle);
  const undo = useWorkflowStore((s) => s.undo);
  const redo = useWorkflowStore((s) => s.redo);
  const setLibraryOpen = useWorkflowStore((s) => s.setLibraryOpen);
  const setAddNodeModalOpen = useWorkflowStore((s) => s.setAddNodeModalOpen);
  const setExportModalOpen = useWorkflowStore((s) => s.setExportModalOpen);
  const autoLayout = useWorkflowStore((s) => s.autoLayout);

  const accent = templateAccent.get(activeTemplateId) ?? "#6366F1";
  const hasApiKey = Boolean(aiConfig.apiKey && aiConfig.apiKey.trim());

  return (
    <header className="h-16 px-4 border-b border-slate-200 dark:border-slate-800/90 glass-panel flex items-center justify-between gap-3 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl shrink-0 select-none whitespace-nowrap text-slate-800 dark:text-slate-100 transition-colors">
      {/* Left: Brand & Template Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-glow-sm flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div className="hidden xl:block">
            <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-1.5">
              <span>WORKFLOW STUDIO</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <span className="hidden 2xl:block mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              ESL • IELTS • SAT • Admissions • Productivity
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Current plan → opens the library */}
        <button
          onClick={() => setLibraryOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/70 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-sm group"
          title="My plans — open, rename, duplicate or create"
        >
          <FolderOpen className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="truncate max-w-[160px] md:max-w-[200px]">{docName}</span>
          <span className="flex items-center" aria-live="polite">
            {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            {saveStatus === "saved" && (
              <span title="All changes saved on this device">
                <Check className="w-3 h-3 text-emerald-500" />
              </span>
            )}
            {saveStatus === "error" && (
              <span title="Couldn't save — check the console">
                <AlertCircle className="w-3 h-3 text-rose-500" />
              </span>
            )}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Center: Top View Switcher (Today · Calendar · Plan Graph) */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-2xl p-1 text-xs font-semibold shrink-0 shadow-inner">
        <button
          onClick={() => setActiveView("today")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            activeView === "today"
              ? "bg-indigo-600 text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Daily action steps and focus timer"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Today</span>
        </button>

        <button
          onClick={() => setActiveView("calendar")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            activeView === "calendar"
              ? "bg-indigo-600 text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Week and month study calendar"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendar</span>
        </button>

        <button
          onClick={() => setActiveView("canvas")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            activeView === "canvas"
              ? "bg-indigo-600 text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Visual workflow graph editor"
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Plan Graph</span>
        </button>
      </div>

      {/* Canvas Runner Controls: Visible when on Canvas */}
      {activeView === "canvas" ? (
        <div className="hidden lg:flex items-center gap-1.5 shrink-0 glass-panel px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-inner bg-slate-50 dark:bg-slate-900/70">
          {runStatus === "running" ? (
            <button
              onClick={pauseSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-glow-amber"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-glow-sm hover:scale-105 active:scale-95"
              title={runStatus === "paused" ? "Continue the run" : "Simulate this plan with its current variables"}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{runStatus === "paused" ? "Resume" : runStatus === "completed" ? "Run again" : "Run"}</span>
            </button>
          )}

          <button
            onClick={stepSimulation}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Step: run one node at a time"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={resetSimulation}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Reset run (restores starting variables)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="hidden xl:inline text-[10px] uppercase text-slate-400 dark:text-slate-500">Speed:</span>
            {[1.0, 2.0, 3.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setExecutionSpeed(spd)}
                className={`px-1.5 py-0.5 rounded-md transition-colors ${
                  executionSpeed === spd
                    ? "bg-indigo-600 text-white font-bold"
                    : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="hidden lg:block text-xs text-slate-500 dark:text-slate-400 italic">
          {activeView === "today" ? "Focus & Daily Execution Mode" : "Weekly & Monthly Roadmap Schedule"}
        </div>
      )}

      {/* Right: BYOK AI, Theme Toggle, Tools, Undo/Redo & Modals */}
      <div className="flex items-center gap-2 shrink-0">
        {/* BYOK AI Status & Config Button */}
        <button
          onClick={() => setAiSettingsModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
            hasApiKey
              ? "bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25"
              : "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Configure BYOK (Bring Your Own Key) AI for live evaluation"
        >
          {hasApiKey ? (
            <>
              <Zap className="w-3.5 h-3.5 text-purple-500 fill-current animate-pulse" />
              <span className="hidden xl:inline capitalize">{aiConfig.provider} AI Key</span>
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xl:inline">BYOK AI</span>
            </>
          )}
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Connection Style Selector (compact cycler below 2xl) */}
        <button
          onClick={() => {
            const order: EdgeRoutingStyle[] = ["smooth", "orthogonal", "curved"];
            setEdgeRoutingStyle(order[(order.indexOf(edgeRoutingStyle) + 1) % order.length]);
          }}
          className="2xl:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors"
          title={`Line style: ${edgeRoutingStyle} (click to change)`}
        >
          <Route className="w-4 h-4 text-cyan-500" />
        </button>
        <div className="hidden 2xl:flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-1 text-xs">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase px-2 flex items-center gap-1">
            <Route className="w-3 h-3 text-cyan-500" />
            Line:
          </span>
          {(["smooth", "orthogonal", "curved"] as EdgeRoutingStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => setEdgeRoutingStyle(style)}
              className={`px-2 py-1 rounded-lg capitalize text-[11px] font-semibold transition-all ${
                edgeRoutingStyle === style
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Auto Layout DAG */}
        <button
          onClick={autoLayout}
          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Auto-organize graph"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span className="hidden 2xl:inline">Auto-Layout</span>
        </button>

        {/* Add Node Trigger */}
        <button
          onClick={() => setAddNodeModalOpen(true)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-glow-sm hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden lg:inline">Add Step</span>
        </button>

        {/* Export / Import Button */}
        <button
          onClick={() => setExportModalOpen(true)}
          className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          title="Export / Import JSON"
        >
          <Download className="w-4 h-4 text-cyan-500" />
        </button>
      </div>
    </header>
  );
};

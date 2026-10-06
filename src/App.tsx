import { useEffect } from "react";
import { TopNavBar } from "@/components/header/TopNavBar";
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas";
import { NodeInspector } from "@/components/inspector/NodeInspector";
import { SimulationConsole } from "@/components/simulator/SimulationConsole";
import { TemplateGalleryModal } from "@/components/templates/TemplateGalleryModal";
import { AddNodeModal } from "@/components/modals/AddNodeModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { AiSettingsModal } from "@/components/modals/AiSettingsModal";
import { WorkflowLibrary } from "@/components/library/WorkflowLibrary";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TodayView } from "@/views/TodayView";
import { CalendarView } from "@/views/CalendarView";
import { useWorkflowStore } from "@/stores/workflowStore";
import { DynamicIcon } from "@/components/icons/DynamicIcon";
import { PlusCircle } from "lucide-react";

export function App() {
  const activeView = useWorkflowStore((s) => s.activeView);
  const activeTemplateId = useWorkflowStore((s) => s.activeTemplateId);
  const loadTemplate = useWorkflowStore((s) => s.loadTemplate);
  const setAddNodeModalOpen = useWorkflowStore((s) => s.setAddNodeModalOpen);
  const theme = useWorkflowStore((s) => s.theme);
  const initLibrary = useWorkflowStore((s) => s.initLibrary);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Load saved plans from this device (or seed the first one).
  useEffect(() => {
    void initLibrary();
  }, [initLibrary]);

  const domainBlueprints = [
    { id: "esl-mastery", label: "ESL Flow", color: "#10B981", icon: "Languages" },
    { id: "ielts-prep", label: "IELTS 8.5+", color: "#06B6D4", icon: "Target" },
    { id: "sat-accelerator", label: "SAT 1550+", color: "#8B5CF6", icon: "Zap" },
    { id: "college-admissions", label: "College App", color: "#F59E0B", icon: "GraduationCap" },
    { id: "productivity-system", label: "Productivity", color: "#EC4899", icon: "Flame" },
  ];

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-[#080B11] text-slate-800 dark:text-slate-100 font-sans transition-colors">
      {/* Top Navigation Bar */}
      <TopNavBar />

      {/* Main Studio Viewport */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Quick Domain Launcher Sidebar (Pill Rail) */}
        <aside className="w-14 shrink-0 glass-panel border-r border-slate-200 dark:border-slate-800/80 flex flex-col items-center py-4 gap-3 z-30 bg-white/70 dark:bg-slate-950/70 transition-colors">
          <div className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider text-center">
            Flows
          </div>

          <div className="flex flex-col gap-2 w-full px-2">
            {domainBlueprints.map((item) => {
              const isActive = activeTemplateId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => loadTemplate(item.id)}
                  className={`relative group w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-slate-200 dark:bg-slate-800 shadow-md ring-2"
                      : "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                  style={{
                    borderColor: isActive ? item.color : undefined,
                    color: isActive ? item.color : undefined,
                    boxShadow: isActive ? `0 0 16px -2px ${item.color}50` : undefined,
                  }}
                  title={`Switch to ${item.label}`}
                >
                  <DynamicIcon name={item.icon} className="w-5 h-5" />

                  {/* Tooltip on hover */}
                  <span className="absolute left-14 z-50 glass-dropdown px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 dark:text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-slate-300 dark:border-slate-700 shadow-xl">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="h-px w-8 bg-slate-200 dark:bg-slate-800 my-1" />

          {/* Quick Add Node Button */}
          <button
            onClick={() => setAddNodeModalOpen(true)}
            className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 hover:text-white border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center transition-all hover:scale-105 shadow-sm group relative"
            title="Catalog of 25+ Specialized Nodes"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="absolute left-14 z-50 glass-dropdown px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 dark:text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-slate-300 dark:border-slate-700 shadow-xl">
              Node Catalog
            </span>
          </button>
        </aside>

        {/* Center: Dynamic View based on activeView */}
        {activeView === "today" ? (
          <ErrorBoundary area="today">
            <TodayView />
          </ErrorBoundary>
        ) : activeView === "calendar" ? (
          <ErrorBoundary area="calendar">
            <CalendarView />
          </ErrorBoundary>
        ) : (
          <>
            <main className="relative flex-1 h-full overflow-hidden">
              <ErrorBoundary area="canvas">
                <WorkflowCanvas />
              </ErrorBoundary>
            </main>

            {/* Right: Slide-over Node Inspector */}
            <ErrorBoundary area="inspector" compact>
              <NodeInspector />
            </ErrorBoundary>
          </>
        )}
      </div>

      {/* Bottom: Telemetry & Simulation Console (only on canvas) */}
      {activeView === "canvas" && (
        <ErrorBoundary area="console" compact>
          <SimulationConsole />
        </ErrorBoundary>
      )}

      {/* Global Modals */}
      <ErrorBoundary area="dialog" compact>
        <TemplateGalleryModal />
        <AddNodeModal />
        <ExportModal />
        <AiSettingsModal />
        <WorkflowLibrary />
      </ErrorBoundary>
    </div>
  );
}

export default App;

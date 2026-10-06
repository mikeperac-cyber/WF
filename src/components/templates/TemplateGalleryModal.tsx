import React from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { TEMPLATE_LIST } from "@/data/templates";
import { DynamicIcon } from "@/components/icons/DynamicIcon";
import {
  X,
  Sparkles,
  Clock,
  Award,
  Layers,
  Check,
  FilePlus2,
  ArrowRight,
} from "lucide-react";

export const TemplateGalleryModal: React.FC = () => {
  const isTemplateModalOpen = useWorkflowStore((s) => s.isTemplateModalOpen);
  const setTemplateModalOpen = useWorkflowStore((s) => s.setTemplateModalOpen);
  const newFromTemplate = useWorkflowStore((s) => s.newFromTemplate);
  const newBlank = useWorkflowStore((s) => s.newBlank);
  const activeTemplateId = useWorkflowStore((s) => s.activeTemplateId);
  // Picking a template always creates a NEW plan so edited copies are never overwritten.
  const loadTemplate = (id: string) => void newFromTemplate(id);
  const loadBlank = () => void newBlank();

  if (!isTemplateModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="relative w-full max-w-5xl max-h-[85vh] glass-panel rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Curriculum & Workflow Blueprints
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a specialized domain architecture for ESL, IELTS, SAT, College Admissions, or Productivity.
            </p>
          </div>

          <button
            onClick={() => setTemplateModalOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Template Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Blank Canvas Option */}
          <div
            onClick={() => {
              loadBlank();
              setTemplateModalOpen(false);
            }}
            className="group glass-panel rounded-2xl p-5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-600/20 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 flex items-center justify-center mb-3 transition-colors">
                <FilePlus2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Blank Canvas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Start from a blank canvas and construct custom pipelines from 25+ domain node types.
              </p>
            </div>

            <button className="mt-4 w-full py-2 bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-600 text-slate-800 dark:text-slate-200 group-hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors">
              <span>Create Empty Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pre-built Domain Templates */}
          {TEMPLATE_LIST.map((template) => {
            const isActive = activeTemplateId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => {
                  loadTemplate(template.id);
                  setTemplateModalOpen(false);
                }}
                className={`group glass-panel rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/90"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md border"
                      style={{
                        backgroundColor: `${template.accentColor}18`,
                        borderColor: `${template.accentColor}50`,
                        color: template.accentColor,
                      }}
                    >
                      <DynamicIcon name={template.iconName} className="w-5 h-5" />
                    </div>

                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${template.accentColor}15`,
                        borderColor: `${template.accentColor}35`,
                        color: template.accentColor,
                      }}
                    >
                      {template.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {template.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300/80 leading-relaxed mb-4 line-clamp-3">
                    {template.description}
                  </p>

                  <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Goal:
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{template.stats.targetScoreOrGoal}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-500" /> Duration:
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">{template.stats.estimatedTime}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-purple-500" /> Nodes:
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">{template.stats.nodeCount} steps</span>
                    </div>
                  </div>
                </div>

                <button
                  className={`mt-5 w-full py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 text-slate-700 dark:text-slate-200 group-hover:text-white"
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Currently Active</span>
                    </>
                  ) : (
                    <>
                      <span>Load Blueprint</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

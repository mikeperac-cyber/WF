import React, { useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { ACTION_DEFINITIONS, DOMAIN_GROUPS } from "@/data/nodeDefinitions";
import { DynamicIcon } from "@/components/icons/DynamicIcon";
import { X, Search, Plus } from "lucide-react";
import type { ActionKind, DomainCategory } from "@/types/workflow";

export const AddNodeModal: React.FC = () => {
  const { isAddNodeModalOpen, setAddNodeModalOpen, addNode } = useWorkflowStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DomainCategory | "all">("all");

  if (!isAddNodeModalOpen) return null;

  const allDefinitions = Object.values(ACTION_DEFINITIONS);

  const filtered = allDefinitions.filter((def) => {
    if (selectedCategory !== "all" && def.category !== selectedCategory) return false;
    if (
      search &&
      !def.label.toLowerCase().includes(search.toLowerCase()) &&
      !def.defaultDescription.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSelectNode = (kind: ActionKind) => {
    addNode(kind);
    setAddNodeModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="relative w-full max-w-4xl max-h-[85vh] glass-panel rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Plus className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add Workflow Node</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose from 25+ specialized nodes across ESL, IELTS, SAT, College Admissions & Productivity.
              </p>
            </div>
          </div>

          <button
            onClick={() => setAddNodeModalOpen(false)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Sub-bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search nodes (e.g. Desmos, Essay, Vocab, CEFR, Pomodoro)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800"
              }`}
            >
              All Categories
            </button>
            {DOMAIN_GROUPS.map((grp) => (
              <button
                key={grp.category}
                onClick={() => setSelectedCategory(grp.category)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === grp.category
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-400 dark:border-slate-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800"
                }`}
                style={{
                  color: selectedCategory === grp.category ? grp.accent : undefined,
                }}
              >
                <DynamicIcon name={grp.icon} className="w-3.5 h-3.5" />
                {grp.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Node Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((def) => (
            <div
              key={def.kind}
              onClick={() => handleSelectNode(def.kind)}
              className="glass-panel p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-white/80 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md border"
                    style={{
                      backgroundColor: `${def.accent}18`,
                      borderColor: `${def.accent}50`,
                      color: def.accent,
                    }}
                  >
                    <DynamicIcon name={def.icon} className="w-4 h-4" />
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${def.accent}15`,
                      borderColor: `${def.accent}30`,
                      color: def.accent,
                    }}
                  >
                    {def.badge}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors mb-1">
                  {def.label}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {def.defaultDescription}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="capitalize">{def.category} track</span>
                <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform font-semibold">
                  + Add to canvas
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

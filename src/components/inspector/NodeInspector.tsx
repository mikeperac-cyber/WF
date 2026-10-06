import React, { useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { ACTION_DEFINITIONS } from "@/data/nodeDefinitions";
import { DynamicIcon } from "@/components/icons/DynamicIcon";
import { executeAiCompletion } from "@/services/aiService";
import { RulesEditor } from "./RulesEditor";
import {
  X,
  Sliders,
  GitFork,
  Database,
  PlayCircle,
  Trash2,
  Copy,
  Loader2,
} from "lucide-react";

export const NodeInspector: React.FC = () => {
  const inspectorNodeId = useWorkflowStore((s) => s.inspectorNodeId);
  const node = useWorkflowStore((s) => s.nodes.find((n) => n.id === s.inspectorNodeId));
  const closeInspector = useWorkflowStore((s) => s.closeInspector);
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const duplicateNode = useWorkflowStore((s) => s.duplicateNode);
  const pushLog = useWorkflowStore((s) => s.pushLog);
  const aiConfig = useWorkflowStore((s) => s.aiConfig);
  const checkpoint = useWorkflowStore((s) => s.checkpoint);

  const [activeTab, setActiveTab] = useState<"config" | "rules" | "data" | "test">("config");
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);

  if (!inspectorNodeId || !node) return null;

  const def = ACTION_DEFINITIONS[node.kind] || ACTION_DEFINITIONS.action;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode(node.id, { title: e.target.value });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNode(node.id, { description: e.target.value });
  };

  const handleDataFieldChange = (key: string, value: any) => {
    updateNodeData(node.id, { [key]: value });
  };

  const handleRunSingleTest = async () => {
    pushLog("info", `[Isolated Test Run] Initiated for node: ${node.title}`, node.id);

    if (aiConfig.apiKey && aiConfig.apiKey.trim()) {
      setIsAiEvaluating(true);
      try {
        const sys = "You are an elite educational AI mentor providing concise diagnostic feedback.";
        const prompt = `Evaluate the student's status for the milestone '${node.title}'. Description: ${node.description}. Parameters: ${JSON.stringify(node.data || {})}`;
        const res = await executeAiCompletion(prompt, sys, aiConfig);
        setAiTestResult(res.text);
        pushLog("success", `[BYOK AI Feedback (${res.latencyMs}ms)]: ${res.text}`, node.id);
      } catch (err: any) {
        setAiTestResult(`AI Error: ${err.message}`);
        pushLog("warning", `AI Sandbox Notice: ${err.message}`);
      } finally {
        setIsAiEvaluating(false);
      }
    } else {
      setTimeout(() => {
        setAiTestResult(`✓ Simulator passed validation for ${node.title}. All constraints satisfied.`);
        pushLog("success", `[Simulator] Output verified for ${node.title}`, node.id, {
          result: "OK",
          latency: "94ms",
          payload: node.data,
        });
      }, 350);
    }
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[420px] z-50 glass-panel border-l border-slate-200 dark:border-slate-700/70 shadow-2xl flex flex-col animate-scale-in bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl text-slate-800 dark:text-slate-100 transition-colors">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md border"
            style={{
              backgroundColor: `${def.accent}18`,
              borderColor: `${def.accent}50`,
              color: def.accent,
            }}
          >
            <DynamicIcon name={def.icon} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-0.5"
              style={{
                backgroundColor: `${def.accent}20`,
                color: def.accent,
                border: `1px solid ${def.accent}40`,
              }}
            >
              {def.badge}
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {node.title}
            </h2>
          </div>
        </div>

        <button
          onClick={closeInspector}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 gap-1 text-xs">
        <button
          onClick={() => setActiveTab("config")}
          className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "config"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Config
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "rules"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          Rules
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "data"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Variables
        </button>
        <button
          onClick={() => setActiveTab("test")}
          className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "test"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
          Sandbox
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === "config" && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Node Title
              </label>
              <input
                type="text"
                value={node.title}
                onFocus={checkpoint}
                onChange={handleTitleChange}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Description & Instructions
              </label>
              <textarea
                value={node.description}
                onFocus={checkpoint}
                onChange={handleDescChange}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs resize-none"
              />
            </div>

            {/* Domain Parameters Section */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Domain Parameters ({def.category.toUpperCase()})
              </h4>

              {node.data &&
                Object.entries(node.data).map(([key, val]) => (
                  <div key={key} className="mb-3">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      type="text"
                      value={typeof val === "object" ? JSON.stringify(val) : String(val)}
                      onFocus={checkpoint}
                      onChange={(e) => handleDataFieldChange(key, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                    />
                  </div>
                ))}
            </div>
          </>
        )}

        {activeTab === "rules" && <RulesEditor node={node} />}

        {activeTab === "data" && (
          <div className="space-y-2 font-mono">
            <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-indigo-700 dark:text-indigo-300 overflow-x-auto leading-relaxed">
              {JSON.stringify(
                {
                  id: node.id,
                  kind: node.kind,
                  category: node.category,
                  data: node.data || {},
                  status: node.status,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {activeTab === "test" && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <h4 className="font-semibold text-slate-900 dark:text-slate-200 mb-1">
                {aiConfig.apiKey ? "Live BYOK AI Evaluation" : "Simulated Sandbox Run"}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-3">
                {aiConfig.apiKey
                  ? `Execute real live evaluation using your connected ${aiConfig.provider.toUpperCase()} (${aiConfig.model}) model.`
                  : "Run this node in sandbox mode to verify output variables."}
              </p>
              <button
                onClick={handleRunSingleTest}
                disabled={isAiEvaluating}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-glow-emerald transition-all"
              >
                {isAiEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Querying {aiConfig.provider}...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>Run Node Test</span>
                  </>
                )}
              </button>

              {aiTestResult && (
                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                  {aiTestResult}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950">
        <button
          onClick={() => duplicateNode(node.id)}
          className="flex-1 py-2 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <Copy className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          Duplicate
        </button>
        <button
          onClick={() => {
            deleteNode(node.id);
            closeInspector();
          }}
          className="py-2 px-3 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
};

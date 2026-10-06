import React, { useState, memo } from "react";
import type { PortId, WorkflowNode } from "@/types/workflow";
import { ACTION_DEFINITIONS } from "@/data/nodeDefinitions";
import { getNodeHeight, getOutputPorts, NODE_WIDTH } from "@/utils/geometry";
import { useWorkflowStore } from "@/stores/workflowStore";
import { DynamicIcon } from "@/components/icons/DynamicIcon";
import {
  MoreVertical,
  Sliders,
  Copy,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  ArrowDownCircle,
} from "lucide-react";

interface WorkflowNodeCardProps {
  node: WorkflowNode;
  selected: boolean;
  onPointerDown: (nodeId: string, e: React.PointerEvent) => void;
  onPortPointerDown: (nodeId: string, portId: PortId, e: React.PointerEvent) => void;
}

export const WorkflowNodeCard: React.FC<WorkflowNodeCardProps> = memo(({
  node,
  selected,
  onPointerDown,
  onPortPointerDown,
}) => {
  // Narrow selectors: subscribing to the whole store would re-render every
  // node on every pan/zoom tick and defeat memo().
  const openInspector = useWorkflowStore((s) => s.openInspector);
  const duplicateNode = useWorkflowStore((s) => s.duplicateNode);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const select = useWorkflowStore((s) => s.select);
  const snapType = useWorkflowStore((s) =>
    s.connecting?.snapTarget?.nodeId === node.id ? s.connecting.snapTarget.type : null
  );
  const [showMenu, setShowMenu] = useState(false);

  const def = ACTION_DEFINITIONS[node.kind] || ACTION_DEFINITIONS.action;
  const height = getNodeHeight(node);
  const outputPorts = getOutputPorts(node);
  const ruleCount = node.ruleGroups?.reduce((n, g) => n + g.rules.length, 0) ?? 0;
  const outputCount = node.outputs?.length ?? 0;

  // Status visual attributes
  const isRunning = node.status === "running";
  const isSuccess = node.status === "success";
  const isPending = node.status === "pending";
  const isError = node.status === "failed";

  return (
    <div
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
        width: NODE_WIDTH,
        height,
        ["--node-accent" as string]: def.accent,
      }}
      onPointerDown={(e) => {
        select({ type: "node", id: node.id });
        onPointerDown(node.id, e);
      }}
      className={`node-card node-surface absolute select-none cursor-grab active:cursor-grabbing rounded-2xl p-4 ${
        selected
          ? "node-selected ring-2 ring-indigo-500 shadow-glow-md"
          : "border-slate-200 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500/80"
      } ${
        isRunning
          ? "ring-2 ring-indigo-400 shadow-glow-lg animate-pulse"
          : isSuccess
          ? "ring-1 ring-emerald-500/80 border-emerald-500/40"
          : isError
          ? "ring-2 ring-rose-500"
          : ""
      } ${node.status === "skipped" ? "opacity-50 saturate-50" : ""} border shadow-xl dark:shadow-2xl group`}
    >
      {/* Top Input Port */}
      {node.kind !== "trigger" && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 group/port"
          title="Input Target Connection"
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              snapType === "input"
                ? "bg-indigo-500 scale-125 ring-4 ring-indigo-400/50 shadow-glow-md text-white"
                : "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-500 hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 group-hover/port:text-indigo-500" />
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md shrink-0 border"
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
              {node.title}
            </h3>
          </div>
        </div>

        {/* Status Indicator & Quick Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isRunning && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/40">
              <Loader2 className="w-3 h-3 animate-spin" />
              Running
            </span>
          )}
          {isSuccess && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3" />
              Done
            </span>
          )}
          {isPending && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/50">
              <Clock className="w-3 h-3" />
            </span>
          )}
          {isError && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/40">
              <AlertCircle className="w-3 h-3" />
              Fail
            </span>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 z-50 w-36 glass-dropdown rounded-xl p-1.5 text-xs text-slate-800 dark:text-slate-200 shadow-2xl animate-scale-in"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    openInspector(node.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  Configure
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    duplicateNode(node.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-500" />
                  Duplicate
                </button>
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    deleteNode(node.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-left text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 dark:text-slate-300/80 leading-relaxed mb-3 line-clamp-2 h-[39px]">
        {node.description}
      </p>

      {/* Dynamic Data Chips */}
      {((node.data && Object.keys(node.data).length > 0) || ruleCount > 0 || outputCount > 0) && (
        <div className="flex flex-nowrap overflow-hidden gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700/40">
          {(ruleCount > 0 || outputCount > 0) && (
            <span
              className="shrink-0 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-500/40"
              title="This node has routing rules / variable outputs (edit in Inspector → Rules)"
            >
              ⚡ {ruleCount > 0 ? `${ruleCount} rule${ruleCount > 1 ? "s" : ""}` : ""}
              {ruleCount > 0 && outputCount > 0 ? " · " : ""}
              {outputCount > 0 ? `${outputCount} output${outputCount > 1 ? "s" : ""}` : ""}
            </span>
          )}
          {Object.entries(node.data ?? {}).slice(0, ruleCount > 0 || outputCount > 0 ? 2 : 3).map(([k, v]) => (
            <span
              key={k}
              className="text-[10px] font-medium bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/60 max-w-[140px] truncate"
            >
              <span className="text-slate-400 dark:text-slate-500 mr-1">{k}:</span>
              <span className="text-indigo-600 dark:text-indigo-300">{String(v)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Bottom Output Ports */}
      <div className="absolute -bottom-3.5 left-0 right-0 flex justify-around items-center px-4 z-30 pointer-events-auto">
        {outputPorts.map((port) => (
          <div
            key={port.id}
            onPointerDown={(e) => {
              e.stopPropagation();
              onPortPointerDown(node.id, port.id, e);
            }}
            className="flex flex-col items-center group/port cursor-crosshair"
            title={`Drag to connect (${port.label})`}
          >
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-md transition-all flex items-center gap-1 border border-white/40 group-hover/port:scale-110 group-hover/port:shadow-glow-sm"
              style={{
                backgroundColor: port.color || def.accent,
                color: "#FFFFFF",
              }}
            >
              <span>{port.label}</span>
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

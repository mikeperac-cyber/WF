import React from "react";
import type { WorkflowNode, WorkflowView } from "@/types/workflow";
import { ACTION_DEFINITIONS } from "@/data/nodeDefinitions";
import { useWorkflowStore } from "@/stores/workflowStore";
import { getNodeHeight, NODE_WIDTH } from "@/utils/geometry";
import { MapPin } from "lucide-react";

interface WorkflowMinimapProps {
  nodes: WorkflowNode[];
  view: WorkflowView;
}

export const WorkflowMinimap: React.FC<WorkflowMinimapProps> = ({ nodes, view }) => {
  const setView = useWorkflowStore((s) => s.setView);
  const canvasSize = useWorkflowStore((s) => s.canvasSize);

  if (nodes.length === 0) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    minX = Math.min(minX, n.x - 100);
    maxX = Math.max(maxX, n.x + NODE_WIDTH + 100);
    minY = Math.min(minY, n.y - 100);
    maxY = Math.max(maxY, n.y + getNodeHeight(n) + 100);
  });

  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;

  const mapWidth = 190;
  const mapHeight = 120;

  const scale = Math.min(mapWidth / worldWidth, mapHeight / worldHeight);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const targetWorldX = minX + (e.clientX - rect.left) / scale;
    const targetWorldY = minY + (e.clientY - rect.top) / scale;

    setView((prev) => ({
      ...prev,
      x: canvasSize.width / 2 - targetWorldX * prev.zoom,
      y: canvasSize.height / 2 - targetWorldY * prev.zoom,
    }));
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute right-5 bottom-5 z-40 glass-panel rounded-2xl p-2.5 shadow-2xl border border-slate-200 dark:border-slate-700/60 bg-white/90 dark:bg-slate-950/90 flex flex-col gap-1.5 animate-fade-in">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
          Minimap
        </span>
        <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
          {Math.round(view.zoom * 100)}%
        </span>
      </div>

      <div
        onClick={handleMinimapClick}
        style={{ width: mapWidth, height: mapHeight }}
        className="relative bg-slate-100 dark:bg-slate-950/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer"
      >
        {/* Render Node Dots */}
        {nodes.map((node) => {
          const def = ACTION_DEFINITIONS[node.kind] || ACTION_DEFINITIONS.action;
          const nx = (node.x - minX) * scale;
          const ny = (node.y - minY) * scale;
          const nw = Math.max(6, NODE_WIDTH * scale);
          const nh = Math.max(4, getNodeHeight(node) * scale);

          return (
            <div
              key={node.id}
              style={{
                left: nx,
                top: ny,
                width: nw,
                height: nh,
                backgroundColor: def.accent,
              }}
              className="absolute rounded-sm opacity-80 shadow-sm"
              title={node.title}
            />
          );
        })}

        {/* Viewport Rectangle */}
        {(() => {
          const vx = (-view.x / view.zoom - minX) * scale;
          const vy = (-view.y / view.zoom - minY) * scale;
          const vw = (canvasSize.width / view.zoom) * scale;
          const vh = (canvasSize.height / view.zoom) * scale;

          return (
            <div
              style={{
                left: Math.max(0, vx),
                top: Math.max(0, vy),
                width: Math.min(mapWidth, vw),
                height: Math.min(mapHeight, vh),
              }}
              className="absolute border border-indigo-500 bg-indigo-500/20 pointer-events-none rounded"
            />
          );
        })()}
      </div>
    </div>
  );
};

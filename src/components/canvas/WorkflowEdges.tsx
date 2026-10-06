import React, { memo, useMemo } from "react";
import type { WorkflowEdge, WorkflowNode, WorkflowSelection } from "@/types/workflow";
import { ACTION_DEFINITIONS } from "@/data/nodeDefinitions";
import {
  getEdgePath,
  getInputPortPosition,
  getMidpoint,
  getOutputPortPosition,
  getOutputPorts,
} from "@/utils/geometry";
import { useWorkflowStore, type ConnectingState } from "@/stores/workflowStore";
import { Trash2 } from "lucide-react";

interface WorkflowEdgesProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selection: WorkflowSelection;
  activeEdgeId: string | null;
  connecting: ConnectingState | null;
}

type EdgeGeometry = {
  edge: WorkflowEdge;
  path: string;
  mid: { x: number; y: number };
  from: { x: number; y: number };
  to: { x: number; y: number };
  startColor: string;
  endColor: string;
  portLabel: string;
};

export const WorkflowEdges: React.FC<WorkflowEdgesProps> = memo(({
  nodes,
  edges,
  selection,
  activeEdgeId,
  connecting,
}) => {
  const select = useWorkflowStore((s) => s.select);
  const deleteEdge = useWorkflowStore((s) => s.deleteEdge);
  const traversedEdgeIds = useWorkflowStore((s) => s.traversedEdgeIds);
  const runStatus = useWorkflowStore((s) => s.runStatus);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Geometry only depends on nodes/edges, so drag & selection changes don't
  // recompute every path.
  const geometry = useMemo<EdgeGeometry[]>(() => {
    const out: EdgeGeometry[] = [];
    for (const edge of edges) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) continue;
      const style = edge.style || "smooth";
      const from = getOutputPortPosition(s, edge.port);
      const to = getInputPortPosition(t);
      const sDef = ACTION_DEFINITIONS[s.kind] || ACTION_DEFINITIONS.action;
      const tDef = ACTION_DEFINITIONS[t.kind] || ACTION_DEFINITIONS.action;
      const port = getOutputPorts(s).find((p) => p.id === edge.port);
      out.push({
        edge,
        path: getEdgePath(from, to, style),
        mid: getMidpoint(from, to, style),
        from,
        to,
        // Branch edges take their port colour (pass = green, fail = red…)
        startColor: edge.color || port?.color || sDef.accent,
        endColor: tDef.accent,
        portLabel: port?.label ?? edge.port,
      });
    }
    return out;
  }, [edges, nodeMap]);

  const traversed = useMemo(() => new Set(traversedEdgeIds), [traversedEdgeIds]);
  const showPath = runStatus !== "idle" && traversed.size > 0;

  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
      <defs>
        {geometry.map(({ edge, from, to, startColor, endColor }) => (
          <linearGradient
            key={`grad-${edge.id}`}
            id={`grad-${edge.id}`}
            gradientUnits="userSpaceOnUse"
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
          >
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        ))}
      </defs>

      {geometry.map(({ edge, path, mid, to, endColor, portLabel }) => {
        const isSelected = selection?.type === "edge" && selection.id === edge.id;
        const isActive = activeEdgeId === edge.id;
        const wasTaken = traversed.has(edge.id);
        const dimmed = showPath && !wasTaken && !isSelected;
        const label = edge.label || (edge.port !== "out" ? portLabel : "");

        return (
          <g
            key={edge.id}
            className="group/edge"
            style={{ opacity: dimmed ? 0.22 : 1, transition: "opacity 300ms ease" }}
          >
            {/* Fat invisible hit area */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={22}
              className="pointer-events-auto cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                select({ type: "edge", id: edge.id });
              }}
            />

            {(isSelected || isActive) && (
              <path
                d={path}
                fill="none"
                stroke={isActive ? "#6366F1" : "#A855F7"}
                strokeWidth={9}
                strokeOpacity={0.35}
                strokeLinecap="round"
                style={{ filter: "blur(3px)" }}
              />
            )}

            <path
              d={path}
              fill="none"
              stroke={`url(#grad-${edge.id})`}
              strokeWidth={isSelected ? 3.2 : wasTaken && showPath ? 3 : 2.2}
              strokeLinecap="round"
              className={isSelected || (wasTaken && showPath) ? "" : "opacity-80 group-hover/edge:opacity-100"}
            />

            {/* Arrow head just above the target's input port circle */}
            <path
              d={`M ${to.x - 5} ${to.y - 23} L ${to.x} ${to.y - 16} L ${to.x + 5} ${to.y - 23}`}
              fill="none"
              stroke={endColor}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {(isActive || (edge.animated && runStatus === "idle")) && (
              <path
                d={path}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={2.4}
                strokeDasharray="6 12"
                strokeLinecap="round"
                className="animate-edge-flow pointer-events-none"
                style={{ opacity: isActive ? 0.95 : 0.55 }}
              />
            )}

            {label && (
              <foreignObject
                x={mid.x - 80}
                y={mid.y - 12}
                width={160}
                height={26}
                className="overflow-visible"
              >
                <div className="flex items-center justify-center">
                  <span
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      select({ type: "edge", id: edge.id });
                    }}
                    className={`pointer-events-auto max-w-[156px] truncate px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-md border cursor-pointer transition-transform hover:scale-105 ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-400"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 dark:bg-slate-900/95 dark:text-slate-200 dark:border-slate-700/80 dark:hover:border-slate-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </foreignObject>
            )}

            {isSelected && (
              <foreignObject
                x={mid.x - 14}
                y={mid.y + (label ? 16 : -14)}
                width={28}
                height={28}
                className="overflow-visible animate-scale-in"
              >
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEdge(edge.id);
                  }}
                  className="pointer-events-auto w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg border border-rose-400 transition-transform hover:scale-110"
                  title="Delete connection (Del)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </foreignObject>
            )}
          </g>
        );
      })}

      {/* Live connection preview while dragging from a port */}
      {connecting && (() => {
        const sourceNode = nodeMap.get(connecting.sourceNodeId);
        if (!sourceNode) return null;
        const fromPos = getOutputPortPosition(sourceNode, connecting.sourcePortId);
        const pathData = getEdgePath(fromPos, connecting.currentPoint, "smooth");
        const snapped = !!connecting.snapTarget;
        return (
          <g className="pointer-events-none">
            <path
              d={pathData}
              fill="none"
              stroke={snapped ? "#10B981" : "#6366F1"}
              strokeWidth={2.5}
              strokeDasharray={snapped ? undefined : "6 6"}
              className={snapped ? "" : "animate-edge-flow"}
            />
            {connecting.snapTarget && (
              <circle
                cx={connecting.snapTarget.position.x}
                cy={connecting.snapTarget.position.y}
                r={13}
                fill="rgba(16,185,129,0.15)"
                stroke="#10B981"
                strokeWidth={2.5}
                className="animate-pulse"
              />
            )}
          </g>
        );
      })()}
    </svg>
  );
});

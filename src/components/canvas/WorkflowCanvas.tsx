import React, { useRef, useEffect, useCallback, useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { WorkflowNodeCard } from "@/components/nodes/WorkflowNodeCard";
import { StickyNoteNode } from "@/components/nodes/StickyNoteNode";
import { WorkflowEdges } from "@/components/canvas/WorkflowEdges";
import { WorkflowMinimap } from "@/components/canvas/WorkflowMinimap";
import { clampZoom, toCanvasCoords, type Point } from "@/utils/geometry";
import type { PortId } from "@/types/workflow";
import { ZoomIn, ZoomOut, Maximize2, Sparkles, Plus, Compass, Grid3X3 } from "lucide-react";

/** Pixels the pointer must travel before a press on a node becomes a drag. */
const DRAG_THRESHOLD = 3;

type Gesture =
  | { kind: "pan"; pointerId: number; startX: number; startY: number; viewX: number; viewY: number }
  | {
      kind: "node";
      pointerId: number;
      nodeId: string;
      offset: Point;
      startClient: Point;
      moved: boolean;
    }
  | { kind: "connect"; pointerId: number }
  | null;

export const WorkflowCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const view = useWorkflowStore((s) => s.view);
  const selection = useWorkflowStore((s) => s.selection);
  const activeEdgeId = useWorkflowStore((s) => s.activeEdgeId);
  const gridStyle = useWorkflowStore((s) => s.gridStyle);
  const showMinimap = useWorkflowStore((s) => s.showMinimap);
  const connecting = useWorkflowStore((s) => s.connecting);

  const setView = useWorkflowStore((s) => s.setView);
  const setCanvasSize = useWorkflowStore((s) => s.setCanvasSize);
  const zoomIn = useWorkflowStore((s) => s.zoomIn);
  const zoomOut = useWorkflowStore((s) => s.zoomOut);
  const fitView = useWorkflowStore((s) => s.fitView);
  const autoLayout = useWorkflowStore((s) => s.autoLayout);
  const select = useWorkflowStore((s) => s.select);
  const setAddNodeModalOpen = useWorkflowStore((s) => s.setAddNodeModalOpen);
  const toggleMinimap = useWorkflowStore((s) => s.toggleMinimap);
  const setGridStyle = useWorkflowStore((s) => s.setGridStyle);

  const gesture = useRef<Gesture>(null);
  const [isPanning, setIsPanning] = useState(false);

  // ---------------- Measure canvas (fitView / minimap / zoom centre) ----------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCanvasSize({ width: Math.round(width), height: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [setCanvasSize]);

  // ---------------- Keyboard shortcuts ----------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      ) {
        return;
      }
      const s = useWorkflowStore.getState();
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (s.selection?.type === "node") s.deleteNode(s.selection.id);
        else if (s.selection?.type === "edge") s.deleteEdge(s.selection.id);
      } else if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
      } else if (mod && e.key.toLowerCase() === "d" && s.selection?.type === "node") {
        e.preventDefault();
        s.duplicateNode(s.selection.id);
      } else if (mod && e.key === "0") {
        e.preventDefault();
        s.fitView();
      } else if (e.key === "Escape") {
        if (s.connecting) s.cancelConnecting();
        else s.select(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---------------- Wheel: zoom (ctrl/trackpad pinch or plain wheel) ----------------
  // Attached natively with passive:false — React's onWheel is passive, so
  // preventDefault() there is ignored and logs a warning.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const { view: v } = useWorkflowStore.getState();
      // Smooth, delta-proportional zoom works for both mice and trackpads.
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      const zoom = clampZoom(v.zoom * factor);
      const wx = (cx - v.x) / v.zoom;
      const wy = (cy - v.y) / v.zoom;
      setView(() => ({ x: cx - wx * zoom, y: cy - wy * zoom, zoom }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setView]);

  // ---------------- Pointer handlers ----------------
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    const { view: v } = useWorkflowStore.getState();
    gesture.current = {
      kind: "pan",
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      viewX: v.x,
      viewY: v.y,
    };
    containerRef.current?.setPointerCapture(e.pointerId);
    setIsPanning(true);
    select(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    const el = containerRef.current;
    if (!g || !el) return;
    const s = useWorkflowStore.getState();

    if (g.kind === "pan") {
      setView((prev) => ({ ...prev, x: g.viewX + (e.clientX - g.startX), y: g.viewY + (e.clientY - g.startY) }));
      return;
    }

    if (g.kind === "node") {
      if (!g.moved) {
        const dist = Math.hypot(e.clientX - g.startClient.x, e.clientY - g.startClient.y);
        if (dist < DRAG_THRESHOLD) return;
        // First real movement: record ONE undo step for the whole drag, and
        // capture the pointer so fast drags can't escape the canvas.
        g.moved = true;
        s.checkpoint();
        el.setPointerCapture(g.pointerId);
      }
      const p = toCanvasCoords(e.clientX, e.clientY, el.getBoundingClientRect(), s.view);
      s.moveNode(g.nodeId, Math.round(p.x - g.offset.x), Math.round(p.y - g.offset.y));
      return;
    }

    if (g.kind === "connect") {
      s.updateConnecting(toCanvasCoords(e.clientX, e.clientY, el.getBoundingClientRect(), s.view));
    }
  };

  const endGesture = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    if (containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
    if (g.kind === "connect") useWorkflowStore.getState().finishConnecting();
    gesture.current = null;
    setIsPanning(false);
  };

  // Stable callbacks (read live state from the store) so memoised node
  // components don't re-render when the canvas does.
  const handleNodePointerDown = useCallback((nodeId: string, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const s = useWorkflowStore.getState();
    const node = s.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const p = toCanvasCoords(e.clientX, e.clientY, el.getBoundingClientRect(), s.view);
    gesture.current = {
      kind: "node",
      pointerId: e.pointerId,
      nodeId,
      offset: { x: p.x - node.x, y: p.y - node.y },
      startClient: { x: e.clientX, y: e.clientY },
      moved: false,
    };
  }, []);

  const handlePortPointerDown = useCallback((nodeId: string, portId: PortId, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const s = useWorkflowStore.getState();
    s.startConnecting(nodeId, portId, toCanvasCoords(e.clientX, e.clientY, el.getBoundingClientRect(), s.view));
    gesture.current = { kind: "connect", pointerId: e.pointerId };
    el.setPointerCapture(e.pointerId);
  }, []);

  const gridClass =
    gridStyle === "dots"
      ? "canvas-grid-dots"
      : gridStyle === "lines"
      ? "canvas-grid-lines"
      : gridStyle === "cross"
      ? "canvas-grid-cross"
      : "";

  const toolBtn =
    "p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";

  return (
    <div
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onLostPointerCapture={(e) => {
        if (gesture.current && gesture.current.kind !== "node") endGesture(e);
      }}
      className={`relative w-full h-full overflow-hidden bg-slate-100 dark:bg-[#080B11] ${gridClass} ${
        isPanning ? "cursor-grabbing" : connecting ? "cursor-crosshair" : "cursor-default"
      } select-none touch-none transition-colors`}
      style={{
        // Grid scrolls/zooms with the canvas so it feels attached to the content.
        backgroundPosition: `${view.x}px ${view.y}px`,
        backgroundSize: gridStyle === "none" ? undefined : `${24 * view.zoom}px ${24 * view.zoom}px`,
      }}
    >
      <div
        style={{
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
          transformOrigin: "0 0",
        }}
        className="absolute inset-0 will-change-transform"
      >
        <WorkflowEdges
          nodes={nodes}
          edges={edges}
          selection={selection}
          activeEdgeId={activeEdgeId}
          connecting={connecting}
        />

        {nodes.map((node) => {
          const isSelected = selection?.type === "node" && selection.id === node.id;
          return node.kind === "note" ? (
            <StickyNoteNode
              key={node.id}
              node={node}
              selected={isSelected}
              onPointerDown={handleNodePointerDown}
            />
          ) : (
            <WorkflowNodeCard
              key={node.id}
              node={node}
              selected={isSelected}
              onPointerDown={handleNodePointerDown}
              onPortPointerDown={handlePortPointerDown}
            />
          );
        })}
      </div>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm font-semibold">This plan is empty</p>
            <p className="text-xs mt-1">Press the + button to add your first step.</p>
          </div>
        </div>
      )}

      {/* Floating left toolbar */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-5 left-5 z-40 flex flex-col gap-2 glass-panel rounded-2xl p-2 shadow-2xl border border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-950/80 animate-fade-in transition-colors"
      >
        <button
          onClick={() => setAddNodeModalOpen(true)}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-sm transition-all hover:scale-105 flex items-center justify-center"
          title="Add a step"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="h-px bg-slate-200 dark:bg-slate-700/60 my-0.5" />
        <button onClick={zoomIn} className={toolBtn} title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={zoomOut} className={toolBtn} title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={fitView} className={toolBtn} title="Fit everything (Ctrl+0)">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button onClick={autoLayout} className={toolBtn} title="Tidy up layout">
          <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
        </button>
        <div className="h-px bg-slate-200 dark:bg-slate-700/60 my-0.5" />
        <button
          onClick={() =>
            setGridStyle(
              gridStyle === "dots" ? "lines" : gridStyle === "lines" ? "cross" : gridStyle === "cross" ? "none" : "dots"
            )
          }
          className={toolBtn}
          title={`Background grid (${gridStyle})`}
        >
          <Grid3X3 className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
        </button>
        <button
          onClick={toggleMinimap}
          className={`p-2 rounded-xl transition-colors ${
            showMinimap
              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60"
              : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title="Toggle minimap"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {showMinimap && <WorkflowMinimap nodes={nodes} view={view} />}
    </div>
  );
};

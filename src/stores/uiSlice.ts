import type { WorkflowView } from "@/types/workflow";
import { clampZoom, getNodeHeight, NODE_WIDTH } from "@/utils/geometry";
import type { SliceCreator, UiSlice } from "./types";

export const DEFAULT_VIEW: WorkflowView = { x: 80, y: 40, zoom: 0.85 };

export const createUiSlice: SliceCreator<UiSlice> = (set, get) => ({
  view: DEFAULT_VIEW,
  canvasSize: { width: 1200, height: 700 },
  selection: null,
  edgeRoutingStyle: "smooth",
  gridStyle: "dots",
  showMinimap: true,
  inspectorNodeId: null,
  activeConsoleTab: "logs",
  isConsoleOpen: true,
  isTemplateModalOpen: false,
  isExportModalOpen: false,
  isAddNodeModalOpen: false,
  isAiSettingsModalOpen: false,
  isLibraryOpen: false,

  setView: (update) => set((s) => ({ view: update(s.view) })),

  setCanvasSize: (size) => {
    const prev = get().canvasSize;
    if (prev.width === size.width && prev.height === size.height) return;
    set({ canvasSize: size });
  },

  // Zoom buttons keep the canvas centre fixed instead of the top-left corner.
  zoomIn: () => zoomAroundCentre(set, get, 1.18),
  zoomOut: () => zoomAroundCentre(set, get, 1 / 1.18),

  resetView: () => set({ view: DEFAULT_VIEW }),

  fitView: () => {
    const { nodes, canvasSize } = get();
    if (nodes.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + NODE_WIDTH);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y + getNodeHeight(n));
    }
    const padding = 60;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const zoom = clampZoom(Math.min(canvasSize.width / width, canvasSize.height / height, 1.1));
    const x = (canvasSize.width - (maxX - minX) * zoom) / 2 - minX * zoom;
    const y = (canvasSize.height - (maxY - minY) * zoom) / 2 - minY * zoom;
    set({ view: { x, y, zoom } });
  },

  setEdgeRoutingStyle: (style) =>
    // Changing the global style also restyles existing edges so the toggle is visible.
    set((s) => ({ edgeRoutingStyle: style, edges: s.edges.map((e) => ({ ...e, style })) })),
  setGridStyle: (style) => set({ gridStyle: style }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),

  select: (selection) => set({ selection }),
  openInspector: (nodeId) => set({ inspectorNodeId: nodeId, selection: { type: "node", id: nodeId } }),
  closeInspector: () => set({ inspectorNodeId: null }),

  setConsoleOpen: (open) => set({ isConsoleOpen: open }),
  setConsoleTab: (tab) => set({ activeConsoleTab: tab }),
  setTemplateModalOpen: (open) => set({ isTemplateModalOpen: open }),
  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setAddNodeModalOpen: (open) => set({ isAddNodeModalOpen: open }),
  setAiSettingsModalOpen: (open) => set({ isAiSettingsModalOpen: open }),
  setLibraryOpen: (open) => set({ isLibraryOpen: open }),
});

function zoomAroundCentre(
  set: Parameters<SliceCreator<UiSlice>>[0],
  get: Parameters<SliceCreator<UiSlice>>[1],
  factor: number
) {
  const { view, canvasSize } = get();
  const zoom = clampZoom(view.zoom * factor);
  const cx = canvasSize.width / 2;
  const cy = canvasSize.height / 2;
  const ratio = zoom / view.zoom;
  set({ view: { zoom, x: cx - (cx - view.x) * ratio, y: cy - (cy - view.y) * ratio } });
}

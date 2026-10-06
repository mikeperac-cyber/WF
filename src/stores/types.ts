import type { StateCreator } from "zustand";
import type {
  ActionKind,
  EdgeRoutingStyle,
  PortId,
  RunLog,
  RunStatus,
  WorkflowEdge,
  WorkflowMeta,
  WorkflowNode,
  WorkflowSelection,
  WorkflowView,
  ScheduleConfig,
  ScheduleStats,
  StudyTask,
  TaskStatus,
} from "@/types/workflow";

export type { ScheduleConfig, ScheduleStats, StudyTask, TaskStatus };
import type { NearestPortResult, Point } from "@/utils/geometry";
import type { AiConfig } from "@/services/aiService";
import type { RunnerState } from "@/engine/runner";
import type { StorageKind } from "@/storage/db";

export type ConnectingState = {
  sourceNodeId: string;
  sourcePortId: PortId;
  currentPoint: Point;
  snapTarget: NearestPortResult | null;
};

export type Snapshot = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
};

export type GridStyle = "dots" | "lines" | "cross" | "none";
export type ConsoleTab = "logs" | "variables" | "telemetry";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SettingsSlice {
  theme: "dark" | "light";
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
  aiConfig: AiConfig;
  updateAiConfig: (patch: Partial<AiConfig>) => void;
}

export interface GraphSlice {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
  activeTemplateId: string;
  past: Snapshot[];
  future: Snapshot[];
  connecting: ConnectingState | null;

  checkpoint: () => void;
  undo: () => void;
  redo: () => void;

  addNode: (kind: ActionKind, pos?: Point) => void;
  updateNode: (id: string, patch: Partial<WorkflowNode>) => void;
  updateNodeData: (id: string, dataPatch: Record<string, any>) => void;
  moveNode: (id: string, x: number, y: number) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;

  connect: (source: string, port: PortId, target: string, targetPort?: PortId) => void;
  deleteEdge: (id: string) => void;

  startConnecting: (sourceNodeId: string, sourcePortId: PortId, startPoint: Point) => void;
  updateConnecting: (currentPoint: Point) => void;
  finishConnecting: () => void;
  cancelConnecting: () => void;

  autoLayout: () => void;
  setVariable: (key: string, value: any) => void;
  deleteVariable: (key: string) => void;
}

export interface UiSlice {
  view: WorkflowView;
  canvasSize: { width: number; height: number };
  selection: WorkflowSelection;
  edgeRoutingStyle: EdgeRoutingStyle;
  gridStyle: GridStyle;
  showMinimap: boolean;
  inspectorNodeId: string | null;
  activeConsoleTab: ConsoleTab;
  isConsoleOpen: boolean;
  isTemplateModalOpen: boolean;
  isExportModalOpen: boolean;
  isAddNodeModalOpen: boolean;
  isAiSettingsModalOpen: boolean;
  isLibraryOpen: boolean;

  setView: (update: (view: WorkflowView) => WorkflowView) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitView: () => void;

  setEdgeRoutingStyle: (style: EdgeRoutingStyle) => void;
  setGridStyle: (style: GridStyle) => void;
  toggleMinimap: () => void;

  select: (selection: WorkflowSelection) => void;
  openInspector: (nodeId: string) => void;
  closeInspector: () => void;

  setConsoleOpen: (open: boolean) => void;
  setConsoleTab: (tab: ConsoleTab) => void;
  setTemplateModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setAddNodeModalOpen: (open: boolean) => void;
  setAiSettingsModalOpen: (open: boolean) => void;
  setLibraryOpen: (open: boolean) => void;
}

export interface RunSlice {
  runStatus: RunStatus;
  runnerState: RunnerState | null;
  /** Variables as they were before the run; restored on reset and used for saving. */
  runBaseVariables: Record<string, any> | null;
  runIndex: number;
  activeNodeId: string | null;
  activeEdgeId: string | null;
  /** Edges actually taken during the current/last run (for path highlighting). */
  traversedEdgeIds: string[];
  executionSpeed: number;
  logs: RunLog[];

  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: () => void;
  setExecutionSpeed: (speed: number) => void;
  pushLog: (
    level: RunLog["level"],
    message: string,
    nodeId?: string | null,
    details?: Record<string, any>
  ) => void;
  clearLogs: () => void;
}

export type ImportPayload = {
  name?: string;
  templateId?: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
};

export interface LibrarySlice {
  currentDocId: string | null;
  docName: string;
  library: WorkflowMeta[];
  libraryReady: boolean;
  storageKind: StorageKind | null;
  saveStatus: SaveStatus;

  initLibrary: () => Promise<void>;
  saveNow: () => Promise<void>;
  openWorkflow: (id: string) => Promise<void>;
  newFromTemplate: (templateId: string) => Promise<void>;
  openOrCreateFromTemplate: (templateId: string) => Promise<void>;
  newBlank: () => Promise<void>;
  renameWorkflow: (id: string, name: string) => Promise<void>;
  duplicateWorkflow: (id: string) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  importWorkflow: (payload: ImportPayload) => Promise<void>;

  /** Back-compat aliases used by the sidebar and gallery. */
  loadTemplate: (templateId: string) => void;
  loadBlank: () => void;
}

export type AppView = "canvas" | "today" | "calendar";

export interface ScheduleSlice {
  activeView: AppView;
  tasks: StudyTask[];
  scheduleConfig: ScheduleConfig;
  scheduleStats: ScheduleStats;
  activeFocusTaskId: string | null;
  focusTimerMinutes: number;
  focusTimerSecondsRemaining: number;
  isFocusTimerRunning: boolean;

  setActiveView: (view: AppView) => void;
  setTasks: (tasks: StudyTask[]) => void;
  toggleTaskStatus: (taskId: string, forceStatus?: TaskStatus) => void;
  updateTaskDate: (taskId: string, newDate: string) => void;
  recalibrateSchedule: () => void;
  generateScheduleForWorkflow: () => void;
  updateScheduleConfig: (patch: Partial<ScheduleConfig>) => void;

  setActiveFocusTaskId: (taskId: string | null) => void;
  startFocusTimer: (minutes?: number) => void;
  pauseFocusTimer: () => void;
  resetFocusTimer: () => void;
  tickFocusTimer: () => void;
}

export type WorkflowStoreState = SettingsSlice &
  GraphSlice &
  UiSlice &
  RunSlice &
  LibrarySlice &
  ScheduleSlice;

export type SliceCreator<T> = StateCreator<WorkflowStoreState, [], [], T>;

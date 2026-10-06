import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { ACTION_DEFINITIONS } from "@/data/nodeDefinitions";
import { TEMPLATE_LIST } from "@/data/templates";
import { autoLayoutDAG, findNearestPort } from "@/utils/geometry";
import { makeId } from "@/storage/db";
import type { GraphSlice, SliceCreator, Snapshot } from "./types";

const HISTORY_LIMIT = 40;

export function snapshot(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  variables: Record<string, any>
): Snapshot {
  return structuredClone({ nodes, edges, variables });
}

const initialTemplate = TEMPLATE_LIST[0];

export const createGraphSlice: SliceCreator<GraphSlice> = (set, get) => ({
  nodes: initialTemplate.nodes,
  edges: initialTemplate.edges,
  variables: initialTemplate.defaultVariables,
  activeTemplateId: initialTemplate.id,
  past: [],
  future: [],
  connecting: null,

  checkpoint: () => {
    const { nodes, edges, variables, past, runBaseVariables } = get();
    set({
      past: [...past, snapshot(nodes, edges, runBaseVariables ?? variables)].slice(-HISTORY_LIMIT),
      future: [],
    });
  },

  undo: () => {
    const { past, future, nodes, edges, variables } = get();
    const prev = past.at(-1);
    if (!prev) return;
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      variables: prev.variables,
      past: past.slice(0, -1),
      future: [snapshot(nodes, edges, variables), ...future],
      selection: null,
    });
  },

  redo: () => {
    const { past, future, nodes, edges, variables } = get();
    const next = future[0];
    if (!next) return;
    set({
      nodes: next.nodes,
      edges: next.edges,
      variables: next.variables,
      past: [...past, snapshot(nodes, edges, variables)],
      future: future.slice(1),
      selection: null,
    });
  },

  addNode: (kind, pos) => {
    get().checkpoint();
    const def = ACTION_DEFINITIONS[kind];
    const { view, canvasSize } = get();
    const id = makeId(kind.replace(/_/g, "-"));

    // Default placement: centre of the visible canvas.
    const x = pos ? pos.x : (canvasSize.width / 2 - view.x) / view.zoom - 170;
    const y = pos ? pos.y : (canvasSize.height / 2 - view.y) / view.zoom - 70;

    const newNode: WorkflowNode = {
      id,
      kind,
      x: Math.round(x),
      y: Math.round(y),
      title: def ? def.defaultTitle : "New Node",
      description: def ? def.defaultDescription : "Node step description",
      category: def ? def.category : "logic",
      status: "idle",
      data: def?.defaultData ? { ...def.defaultData } : {},
      ...(kind === "note" ? { noteText: def?.defaultDescription ?? "" } : {}),
    };

    set((s) => ({
      nodes: [...s.nodes, newNode],
      selection: { type: "node", id },
      inspectorNodeId: kind === "note" ? s.inspectorNodeId : id,
    }));
    get().pushLog("info", `Added node [${newNode.title}]`, id);
  },

  updateNode: (id, patch) =>
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),

  updateNodeData: (id, dataPatch) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...(n.data || {}), ...dataPatch } } : n
      ),
    })),

  moveNode: (id, x, y) =>
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) })),

  deleteNode: (id) => {
    get().checkpoint();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selection: s.selection && "id" in s.selection && s.selection.id === id ? null : s.selection,
      inspectorNodeId: s.inspectorNodeId === id ? null : s.inspectorNodeId,
    }));
    get().pushLog("warning", `Deleted node ${id}`);
  },

  duplicateNode: (id) => {
    const target = get().nodes.find((n) => n.id === id);
    if (!target) return;
    get().checkpoint();
    const newId = makeId(target.kind.replace(/_/g, "-"));
    const cloned: WorkflowNode = {
      ...structuredClone(target),
      id: newId,
      title: `${target.title} (Copy)`,
      x: target.x + 40,
      y: target.y + 40,
      status: "idle",
    };
    // Rule group ids must stay unique per node.
    cloned.ruleGroups = cloned.ruleGroups?.map((g, i) => ({ ...g, id: `${newId}-g${i + 1}` }));
    set((s) => ({
      nodes: [...s.nodes, cloned],
      selection: { type: "node", id: newId },
      inspectorNodeId: newId,
    }));
    get().pushLog("info", `Duplicated node ${target.title}`, newId);
  },

  connect: (source, port, target, targetPort = "in") => {
    if (source === target) return;
    const { edges, nodes } = get();
    if (!nodes.some((n) => n.id === source) || !nodes.some((n) => n.id === target)) return;
    if (edges.some((e) => e.source === source && e.port === port && e.target === target)) return;

    get().checkpoint();
    const newEdge: WorkflowEdge = {
      id: makeId("edge"),
      source,
      port,
      target,
      targetPort,
      style: get().edgeRoutingStyle,
      animated: true,
    };
    set((s) => ({ edges: [...s.edges, newEdge], selection: { type: "edge", id: newEdge.id } }));
    get().pushLog("info", `Connected [${source}] (${port}) → [${target}]`);
  },

  deleteEdge: (id) => {
    get().checkpoint();
    set((s) => ({
      edges: s.edges.filter((e) => e.id !== id),
      selection: s.selection && "id" in s.selection && s.selection.id === id ? null : s.selection,
    }));
    get().pushLog("warning", `Removed connection ${id}`);
  },

  startConnecting: (sourceNodeId, sourcePortId, startPoint) =>
    set({ connecting: { sourceNodeId, sourcePortId, currentPoint: startPoint, snapTarget: null } }),

  updateConnecting: (currentPoint) => {
    const { connecting, nodes } = get();
    if (!connecting) return;
    const snap = findNearestPort(currentPoint, nodes, connecting.sourceNodeId);
    // Only inputs are valid drop targets; snapping to another output is confusing.
    const valid = snap && snap.type === "input" ? snap : null;
    set({
      connecting: {
        ...connecting,
        currentPoint: valid ? valid.position : currentPoint,
        snapTarget: valid,
      },
    });
  },

  finishConnecting: () => {
    const { connecting } = get();
    if (connecting?.snapTarget?.type === "input") {
      get().connect(
        connecting.sourceNodeId,
        connecting.sourcePortId,
        connecting.snapTarget.nodeId,
        connecting.snapTarget.portId
      );
    }
    set({ connecting: null });
  },

  cancelConnecting: () => set({ connecting: null }),

  autoLayout: () => {
    get().checkpoint();
    const { nodes, edges } = get();
    set({ nodes: autoLayoutDAG(nodes, edges) });
    get().fitView();
    get().pushLog("info", "Auto-arranged nodes (layered layout)");
  },

  setVariable: (key, value) => {
    set((s) => ({
      variables: { ...s.variables, [key]: value },
      // Editing a variable mid-run should also persist as the new baseline.
      runBaseVariables: s.runBaseVariables ? { ...s.runBaseVariables, [key]: value } : null,
      runnerState: s.runnerState ? { ...s.runnerState, vars: { ...s.runnerState.vars, [key]: value } } : null,
    }));
    get().pushLog("info", `Variable updated: ${key} = ${JSON.stringify(value)}`);
  },

  deleteVariable: (key) => {
    set((s) => {
      const { [key]: _removed, ...rest } = s.variables;
      const base = s.runBaseVariables ? { ...s.runBaseVariables } : null;
      if (base) delete base[key];
      return { variables: rest, runBaseVariables: base };
    });
    get().pushLog("warning", `Variable removed: ${key}`);
  },
});

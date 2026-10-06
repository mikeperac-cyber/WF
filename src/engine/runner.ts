import type { PortId, WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { getOutputPorts } from "@/utils/geometry";
import { applyOutputs, evaluateRoute, type RouteDecision } from "./rules";

/** A node may be re-entered this many times (remedial loops) before we stop. */
export const MAX_VISITS_PER_NODE = 6;
/** Hard ceiling on total steps so a bad graph can never hang the UI. */
export const MAX_TOTAL_STEPS = 500;

export type RunnerState = {
  queue: string[];
  visits: Record<string, number>;
  vars: Record<string, unknown>;
  steps: number;
  done: boolean;
};

export type StepResult = {
  state: RunnerState;
  nodeId: string | null;
  decision: RouteDecision | null;
  traversedEdgeIds: string[];
  /** Targets that were not queued because they hit the visit limit. */
  blockedNodeIds: string[];
  changedVars: string[];
};

function isRunnable(node: WorkflowNode) {
  return node.kind !== "note";
}

/** Triggers first; otherwise every runnable node without incoming edges. */
export function findStartNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const runnable = nodes.filter(isRunnable);
  const triggers = runnable.filter((n) => n.kind === "trigger").map((n) => n.id);
  if (triggers.length > 0) return triggers;
  const targets = new Set(edges.map((e) => e.target));
  const roots = runnable.filter((n) => !targets.has(n.id)).map((n) => n.id);
  return roots.length > 0 ? roots : runnable.slice(0, 1).map((n) => n.id);
}

export function initRun(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  vars: Record<string, unknown>
): RunnerState {
  const queue = findStartNodes(nodes, edges);
  return { queue, visits: {}, vars: { ...vars }, steps: 0, done: queue.length === 0 };
}

/** Decides which port a node exits through, given current variables. */
export function routeNode(node: WorkflowNode, vars: Record<string, unknown>): RouteDecision {
  const ports = getOutputPorts(node).map((p) => p.id as PortId);
  if (ports.length <= 1) {
    return { port: ports[0] ?? "out", matchedGroupId: null, reason: "single output" };
  }
  const fallback = node.fallbackPort && ports.includes(node.fallbackPort)
    ? node.fallbackPort
    : node.ruleGroups && node.ruleGroups.length > 0
      ? ports[ports.length - 1]
      : ports[0];
  return evaluateRoute(node.ruleGroups, vars, fallback);
}

/**
 * Executes exactly one node: applies its outputs, picks a port, and queues
 * downstream nodes. Pure — never mutates the input state.
 */
export function stepRun(
  state: RunnerState,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): StepResult {
  const empty: StepResult = {
    state: { ...state, done: true },
    nodeId: null,
    decision: null,
    traversedEdgeIds: [],
    blockedNodeIds: [],
    changedVars: [],
  };
  if (state.done || state.queue.length === 0 || state.steps >= MAX_TOTAL_STEPS) return empty;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const queue = [...state.queue];
  const nodeId = queue.shift()!;
  const node = byId.get(nodeId);

  if (!node) {
    return { ...empty, state: { ...state, queue, done: queue.length === 0 } };
  }

  const visits = { ...state.visits, [nodeId]: (state.visits[nodeId] ?? 0) + 1 };
  const vars = applyOutputs(state.vars, node.outputs);
  const changedVars = Object.keys(vars).filter((k) => vars[k] !== state.vars[k]);
  const decision = routeNode(node, vars);
  const singlePort = getOutputPorts(node).length <= 1;

  // Single-output nodes follow every outgoing edge (legacy graphs may label
  // them inconsistently); branching nodes only follow the chosen port.
  const outgoing = edges.filter(
    (e) => e.source === nodeId && (singlePort || e.port === decision.port)
  );

  const blockedNodeIds: string[] = [];
  for (const edge of outgoing) {
    if (!byId.has(edge.target)) continue;
    if ((visits[edge.target] ?? 0) >= MAX_VISITS_PER_NODE) {
      blockedNodeIds.push(edge.target);
      continue;
    }
    // A node already waiting in the queue is a join point; run it once.
    if (!queue.includes(edge.target)) queue.push(edge.target);
  }

  const steps = state.steps + 1;
  return {
    state: {
      queue,
      visits,
      vars,
      steps,
      done: queue.length === 0 || steps >= MAX_TOTAL_STEPS,
    },
    nodeId,
    decision,
    traversedEdgeIds: outgoing.filter((e) => !blockedNodeIds.includes(e.target)).map((e) => e.id),
    blockedNodeIds,
    changedVars,
  };
}

/** Runs to completion synchronously. Used by tests and "dry run" previews. */
export function runToEnd(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  vars: Record<string, unknown>
) {
  let state = initRun(nodes, edges, vars);
  const path: { nodeId: string; port: PortId }[] = [];
  while (!state.done) {
    const result = stepRun(state, nodes, edges);
    state = result.state;
    if (result.nodeId && result.decision) {
      path.push({ nodeId: result.nodeId, port: result.decision.port });
    }
  }
  return { state, path };
}

import confetti from "canvas-confetti";
import type { NodeStatus, WorkflowNode } from "@/types/workflow";
import { initRun, MAX_TOTAL_STEPS, stepRun } from "@/engine/runner";
import { executeAiCompletion } from "@/services/aiService";
import type { RunSlice, SliceCreator, WorkflowStoreState } from "./types";

type Set = Parameters<SliceCreator<RunSlice>>[0];
type Get = () => WorkflowStoreState;

const AI_KINDS = new Set(["ai_agent", "ielts_writing_eval", "esl_speaking_ai"]);

let timer: ReturnType<typeof setTimeout> | null = null;
/** Bumped on start/reset so stale async continuations (AI calls, timers) bail out. */
let runToken = 0;

function clearTimer() {
  if (timer) clearTimeout(timer);
  timer = null;
}

/** Cancels any scheduled/in-flight step without logging (used when switching documents). */
export function stopRunTimers() {
  clearTimer();
  runToken++;
}

function setStatus(nodes: WorkflowNode[], id: string, status: NodeStatus) {
  return nodes.map((n) => (n.id === id ? { ...n, status } : n));
}

function stepDelay(get: Get) {
  return Math.max(250, 1000 / get().executionSpeed);
}

/** Prepares a fresh run. Returns false if there is nothing to run. */
function beginRun(set: Set, get: Get, status: "running" | "paused"): boolean {
  const { nodes, edges, variables, runBaseVariables, runIndex } = get();
  if (nodes.length === 0) return false;
  const base = runBaseVariables ?? variables;
  const runner = initRun(nodes, edges, base);
  runToken++;
  clearTimer();
  set({
    runBaseVariables: base,
    variables: { ...base },
    runnerState: runner,
    runIndex: runIndex + 1,
    runStatus: status,
    activeNodeId: null,
    activeEdgeId: null,
    traversedEdgeIds: [],
    nodes: nodes.map((n) => ({ ...n, status: n.kind === "note" ? "idle" : "pending" })),
  });
  const { aiConfig } = get();
  get().pushLog(
    "info",
    `▶ Run #${runIndex + 1} started${aiConfig.apiKey ? ` · AI: ${aiConfig.provider}` : " · sandbox (no AI key)"}`
  );
  if (runner.done) {
    get().pushLog("warning", "Nothing to run: add a Trigger node or connect your nodes.");
    finish(set, get);
    return false;
  }
  return true;
}

function finish(set: Set, get: Get) {
  clearTimer();
  const { runnerState } = get();
  const hitCap = (runnerState?.steps ?? 0) >= MAX_TOTAL_STEPS;
  set((s) => ({
    runStatus: "completed",
    activeNodeId: null,
    activeEdgeId: null,
    nodes: s.nodes.map((n) => (n.status === "pending" ? { ...n, status: "skipped" } : n)),
  }));
  if (hitCap) {
    get().pushLog("error", `Run stopped after ${MAX_TOTAL_STEPS} steps — check for an endless loop.`);
    return;
  }
  get().pushLog("success", `🎉 Run complete in ${runnerState?.steps ?? 0} steps.`);
  try {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  } catch {
    /* confetti is cosmetic */
  }
}

async function maybeCallAi(get: Get, node: WorkflowNode, token: number) {
  const { aiConfig } = get();
  if (!AI_KINDS.has(node.kind) || !aiConfig.apiKey?.trim()) return;
  try {
    const sys =
      "You are a supportive academic tutor. Give brief, specific feedback. Never write the student's work for them.";
    const prompt = `Milestone: ${node.title}\nDescription: ${node.description}\nData: ${JSON.stringify(
      node.data || {}
    )}\nCurrent variables: ${JSON.stringify(get().variables)}`;
    const res = await executeAiCompletion(prompt, sys, aiConfig);
    if (token !== runToken) return;
    get().pushLog("success", `⚡ AI (${res.latencyMs}ms): ${res.text.slice(0, 140)}…`, node.id, {
      fullResponse: res.text,
    });
  } catch (err: any) {
    if (token !== runToken) return;
    get().pushLog("warning", `AI call failed: ${err?.message ?? err} (run continues)`, node.id);
  }
}

/** Applies one engine step to the store (statuses, vars, edges, logs). */
function commitStep(set: Set, get: Get): boolean {
  const { runnerState, nodes, edges } = get();
  if (!runnerState) return false;
  const result = stepRun(runnerState, nodes, edges);
  const { nodeId, decision } = result;

  set((s) => ({
    runnerState: result.state,
    variables: result.state.vars as Record<string, any>,
    activeEdgeId: result.traversedEdgeIds[0] ?? null,
    traversedEdgeIds: [...new Set([...s.traversedEdgeIds, ...result.traversedEdgeIds])],
    nodes: nodeId
      ? s.nodes.map((n) => {
          if (n.id === nodeId) return { ...n, status: "success" as NodeStatus };
          if (result.state.queue.includes(n.id) && n.status !== "running") return { ...n, status: "pending" as NodeStatus };
          return n;
        })
      : s.nodes,
  }));

  if (nodeId) {
    const node = nodes.find((n) => n.id === nodeId);
    const title = node?.title ?? nodeId;
    if (decision && decision.reason !== "single output") {
      get().pushLog("info", `↳ [${title}] → ${decision.port.toUpperCase()} (${decision.reason})`, nodeId);
    } else {
      get().pushLog("success", `✓ ${title}`, nodeId);
    }
    if (result.changedVars.length > 0) {
      const changes = result.changedVars
        .map((k) => `${k} = ${JSON.stringify(result.state.vars[k])}`)
        .join(", ");
      get().pushLog("info", `  vars: ${changes}`, nodeId);
    }
    for (const blocked of result.blockedNodeIds) {
      const t = nodes.find((n) => n.id === blocked)?.title ?? blocked;
      get().pushLog("warning", `Loop limit reached — not re-entering [${t}]`, blocked);
    }
  }

  if (result.state.done) {
    finish(set, get);
    return false;
  }
  return true;
}

/** Timed tick: highlight next node, optionally call AI, then commit after a delay. */
async function tick(set: Set, get: Get) {
  const token = runToken;
  const { runnerState, runStatus } = get();
  if (runStatus !== "running" || !runnerState) return;
  if (runnerState.done || runnerState.queue.length === 0) {
    finish(set, get);
    return;
  }
  const nextId = runnerState.queue[0];
  set((s) => ({ activeNodeId: nextId, nodes: setStatus(s.nodes, nextId, "running") }));

  const node = get().nodes.find((n) => n.id === nextId);
  if (node) await maybeCallAi(get, node, token);
  if (token !== runToken || get().runStatus !== "running") return;

  timer = setTimeout(() => {
    if (token !== runToken || get().runStatus !== "running") return;
    if (commitStep(set, get)) {
      timer = setTimeout(() => void tick(set, get), stepDelay(get) * 0.4);
    }
  }, stepDelay(get));
}

export const createRunSlice: SliceCreator<RunSlice> = (set, get) => ({
  runStatus: "idle",
  runnerState: null,
  runBaseVariables: null,
  runIndex: 0,
  activeNodeId: null,
  activeEdgeId: null,
  traversedEdgeIds: [],
  executionSpeed: 1,
  logs: [
    {
      id: "log-init",
      runIndex: 0,
      nodeId: null,
      timestamp: Date.now(),
      level: "info",
      message: "Workflow Studio ready. Press Run to simulate the plan.",
    },
  ],

  startSimulation: () => {
    const { runStatus } = get();
    if (runStatus === "running") return;
    if (runStatus === "paused" && get().runnerState && !get().runnerState!.done) {
      set({ runStatus: "running" });
      get().pushLog("info", "▶ Resumed");
      void tick(set, get);
      return;
    }
    if (beginRun(set, get, "running")) void tick(set, get);
  },

  pauseSimulation: () => {
    if (get().runStatus !== "running") return;
    clearTimer();
    runToken++; // drop any in-flight AI continuation; resume restarts the tick
    set({ runStatus: "paused" });
    get().pushLog("warning", "⏸ Paused");
  },

  resetSimulation: () => {
    clearTimer();
    runToken++;
    set((s) => ({
      runStatus: "idle",
      runnerState: null,
      variables: s.runBaseVariables ?? s.variables,
      runBaseVariables: null,
      activeNodeId: null,
      activeEdgeId: null,
      traversedEdgeIds: [],
      nodes: s.nodes.map((n) => ({ ...n, status: "idle" })),
    }));
    get().pushLog("info", "↺ Reset — variables restored to their starting values");
  },

  stepSimulation: () => {
    const { runStatus, runnerState } = get();
    if (runStatus === "running") get().pauseSimulation();
    if (runStatus === "idle" || runStatus === "completed" || !runnerState) {
      if (!beginRun(set, get, "paused")) return;
    }
    const next = get().runnerState?.queue[0];
    if (next) set({ activeNodeId: next });
    commitStep(set, get);
    const after = get().runnerState;
    if (get().runStatus === "paused" && after && !after.done) {
      const upcoming = after.queue[0];
      set((s) => ({ activeNodeId: upcoming ?? null, nodes: upcoming ? setStatus(s.nodes, upcoming, "running") : s.nodes }));
    }
  },

  setExecutionSpeed: (speed) => set({ executionSpeed: speed }),

  pushLog: (level, message, nodeId = null, details) => {
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      runIndex: get().runIndex,
      nodeId,
      timestamp: Date.now(),
      level,
      message,
      details,
    };
    set((s) => ({ logs: [entry, ...s.logs].slice(0, 300) }));
  },

  clearLogs: () => set({ logs: [] }),
});

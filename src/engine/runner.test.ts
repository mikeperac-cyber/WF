import { describe, expect, it } from "vitest";
import { TEMPLATES } from "@/data/templates";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { findStartNodes, initRun, MAX_VISITS_PER_NODE, routeNode, runToEnd, stepRun } from "./runner";

function run(templateId: string, overrides: Record<string, unknown> = {}) {
  const t = TEMPLATES[templateId]();
  const { state, path } = runToEnd(t.nodes, t.edges, { ...t.defaultVariables, ...overrides });
  const ids = path.map((p) => p.nodeId.replace(/^[a-z]+-/, ""));
  return { t, state, path, ids };
}

const node = (id: string, kind: WorkflowNode["kind"] = "action", extra: Partial<WorkflowNode> = {}): WorkflowNode => ({
  id,
  kind,
  x: 0,
  y: 0,
  title: id,
  description: "",
  category: "logic",
  ...extra,
});
const edge = (source: string, target: string, port: WorkflowEdge["port"] = "out"): WorkflowEdge => ({
  id: `${source}->${target}:${port}`,
  source,
  target,
  port,
});

describe("templates simulate realistically", () => {
  it("ESL: strong placement goes through the grammar lab to certification", () => {
    const { ids, state } = run("esl-mastery");
    expect(ids).toEqual(["trigger", "placement", "grammar", "speaking-ai", "reading-pass", "cefr-gate"]);
    expect(state.vars.fluencyScore).toBe(86);
  });

  it("ESL: weak placement takes the vocabulary path instead", () => {
    const { ids } = run("esl-mastery", { grammarAccuracy: 60 });
    expect(ids).toContain("vocab");
    expect(ids).not.toContain("grammar");
    expect(ids.at(-1)).toBe("cefr-gate");
  });

  it("IELTS: loops through the remedial cycle twice, then reaches the predictor", () => {
    const { ids, state } = run("ielts-prep");
    expect(ids.filter((i) => i === "remedial-delay")).toHaveLength(2);
    expect(ids.filter((i) => i === "writing-eval")).toHaveLength(3);
    expect(ids.at(-1)).toBe("predictor");
    expect(state.vars.writingScore).toBe(7.5);
    expect(state.vars.overallMockScore).toBe(8);
  });

  it("SAT: retakes the mock twice after AI coaching, then passes", () => {
    const { ids, state } = run("sat-accelerator");
    expect(ids.filter((i) => i === "bluebook-mock")).toHaveLength(3);
    expect(ids.filter((i) => i === "ai-mentor")).toHaveLength(2);
    expect(ids.at(-1)).toBe("score-notification");
    expect(state.vars.currentMockScore).toBe(1540);
  });

  it("College: the decision gate is a join and runs exactly once", () => {
    const { ids } = run("college-admissions");
    expect(ids.filter((i) => i === "decision-portal")).toHaveLength(1);
    expect(ids).toContain("interview-prep");
    expect(ids.at(-1)).toBe("webhook-sync");
  });

  it("College: without early decision it skips the interview", () => {
    const { ids } = run("college-admissions", { earlyDecisionSubmitted: false });
    expect(ids).not.toContain("interview-prep");
  });

  it("Productivity: streak and deep-work minutes increase", () => {
    const { state, ids, t } = run("productivity-system");
    expect(ids.at(-1)).toBe("weekly-retro");
    expect(state.vars.streakDays).toBe((t.defaultVariables.streakDays as number) + 1);
    expect(state.vars.deepWorkMinutes).toBe((t.defaultVariables.deepWorkMinutes as number) + 90);
  });

  it("never runs sticky notes", () => {
    for (const id of Object.keys(TEMPLATES)) {
      const { path, t } = run(id);
      const notes = new Set(t.nodes.filter((n) => n.kind === "note").map((n) => n.id));
      expect(path.some((p) => notes.has(p.nodeId))).toBe(false);
    }
  });
});

describe("runner safety", () => {
  it("terminates an endless loop via the per-node visit cap", () => {
    const nodes = [node("t", "trigger"), node("a"), node("b")];
    const edges = [edge("t", "a"), edge("a", "b"), edge("b", "a")];
    const { state, path } = runToEnd(nodes, edges, {});
    expect(state.done).toBe(true);
    expect(path.filter((p) => p.nodeId === "a")).toHaveLength(MAX_VISITS_PER_NODE);
  });

  it("reports blocked nodes when the cap is hit", () => {
    const nodes = [node("t", "trigger"), node("a")];
    const edges = [edge("t", "a"), edge("a", "a")];
    let state = initRun(nodes, edges, {});
    let blocked: string[] = [];
    while (!state.done) {
      const r = stepRun(state, nodes, edges);
      blocked = blocked.concat(r.blockedNodeIds);
      state = r.state;
    }
    expect(blocked).toContain("a");
  });

  it("is pure: stepRun never mutates its input", () => {
    const nodes = [node("t", "trigger", { outputs: [{ variable: "x", op: "add", value: 1 }] }), node("a")];
    const edges = [edge("t", "a")];
    const s0 = initRun(nodes, edges, { x: 1 });
    const snapshot = JSON.stringify(s0);
    stepRun(s0, nodes, edges);
    expect(JSON.stringify(s0)).toBe(snapshot);
  });

  it("starts from roots when there is no trigger, and ignores notes", () => {
    const nodes = [node("n", "note"), node("a"), node("b")];
    expect(findStartNodes(nodes, [edge("a", "b")])).toEqual(["a"]);
  });

  it("ignores edges pointing at deleted nodes", () => {
    const nodes = [node("t", "trigger")];
    const { path, state } = runToEnd(nodes, [edge("t", "ghost")], {});
    expect(path).toHaveLength(1);
    expect(state.done).toBe(true);
  });

  it("uses the fallback port, or the last port when rules exist but none match", () => {
    const withRules = node("b", "branch", {
      ruleGroups: [{ id: "g", mode: "all", port: "true", rules: [{ variable: "x", op: ">", value: 5 }] }],
    });
    expect(routeNode(withRules, { x: 1 }).port).toBe("false");
    expect(routeNode({ ...withRules, fallbackPort: "true" }, { x: 1 }).port).toBe("true");
    expect(routeNode(node("plain", "branch"), {}).port).toBe("true");
  });
});

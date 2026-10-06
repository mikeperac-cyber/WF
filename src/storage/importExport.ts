import type { ImportPayload } from "@/stores/types";
import type { ActionKind, PortId, WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { ACTION_DEFINITIONS } from "@/data/nodeDefinitions";

export const EXPORT_VERSION = "2.0.0";

const VALID_PORTS: PortId[] = ["in", "out", "true", "false", "pass", "fail", "high", "low", "alt"];

export type ImportResult = { ok: true; payload: ImportPayload; warnings: string[] } | { ok: false; error: string };

/**
 * Validates untrusted JSON (from a file or paste) before it touches the
 * store. Drops broken nodes/edges instead of failing the whole import.
 */
export function validateImport(raw: unknown): ImportResult {
  if (!raw || typeof raw !== "object") return { ok: false, error: "That isn't a workflow file." };
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    return { ok: false, error: "The file must contain \"nodes\" and \"edges\" lists." };
  }

  const warnings: string[] = [];
  const seen = new Set<string>();
  const nodes: WorkflowNode[] = [];
  for (const n of data.nodes as any[]) {
    if (!n || typeof n.id !== "string" || seen.has(n.id)) {
      warnings.push("Skipped a node with a missing or duplicate id.");
      continue;
    }
    const kind: ActionKind = ACTION_DEFINITIONS[n.kind as ActionKind] ? n.kind : "action";
    if (kind !== n.kind) warnings.push(`Unknown step type "${String(n.kind)}" was converted to a generic step.`);
    seen.add(n.id);
    nodes.push({
      ...n,
      kind,
      x: Number.isFinite(n.x) ? n.x : 0,
      y: Number.isFinite(n.y) ? n.y : 0,
      title: typeof n.title === "string" ? n.title : "Untitled step",
      description: typeof n.description === "string" ? n.description : "",
      category: n.category ?? ACTION_DEFINITIONS[kind]?.category ?? "logic",
      status: "idle",
    });
  }

  const edges: WorkflowEdge[] = [];
  const edgeIds = new Set<string>();
  for (const e of data.edges as any[]) {
    if (!e || typeof e.source !== "string" || typeof e.target !== "string" || !seen.has(e.source) || !seen.has(e.target)) {
      warnings.push("Skipped a connection pointing at a missing step.");
      continue;
    }
    let id = typeof e.id === "string" ? e.id : `edge-${edges.length + 1}`;
    while (edgeIds.has(id)) id = `${id}-dup`;
    edgeIds.add(id);
    edges.push({ ...e, id, port: VALID_PORTS.includes(e.port) ? e.port : "out" });
  }

  const variables =
    data.variables && typeof data.variables === "object" && !Array.isArray(data.variables)
      ? (data.variables as Record<string, unknown>)
      : {};

  return {
    ok: true,
    payload: {
      name: typeof data.name === "string" ? data.name : undefined,
      templateId: typeof data.templateId === "string" ? data.templateId : null,
      nodes,
      edges,
      variables,
    },
    warnings: [...new Set(warnings)],
  };
}

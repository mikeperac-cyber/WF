import type { NodeOutput, PortId, Rule, RuleGroup, RuleOperator } from "@/types/workflow";

export const OPERATORS: { op: RuleOperator; label: string }[] = [
  { op: ">=", label: "≥" },
  { op: ">", label: ">" },
  { op: "<=", label: "≤" },
  { op: "<", label: "<" },
  { op: "==", label: "=" },
  { op: "!=", label: "≠" },
  { op: "contains", label: "contains" },
];

/**
 * Normalises values coming from text inputs: "8.0" -> 8, "true" -> true.
 * Variables edited in the console/inspector arrive as strings, so every
 * comparison goes through this.
 */
export function coerce(value: unknown): string | number | boolean | null | undefined {
  if (typeof value !== "string") return value as any;
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "false") return false;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : trimmed;
}

export function compare(left: unknown, op: RuleOperator, right: unknown): boolean {
  const a = coerce(left);
  const b = coerce(right);
  if (a === undefined || a === null) return false;

  switch (op) {
    case "==":
      return a === b || String(a).toLowerCase() === String(b).toLowerCase();
    case "!=":
      return !(a === b || String(a).toLowerCase() === String(b).toLowerCase());
    case "contains":
      return String(a).toLowerCase().includes(String(b).toLowerCase());
    case ">":
    case ">=":
    case "<":
    case "<=": {
      if (typeof a !== "number" || typeof b !== "number") return false;
      if (op === ">") return a > b;
      if (op === ">=") return a >= b;
      if (op === "<") return a < b;
      return a <= b;
    }
  }
}

export function describeRule(rule: Rule, vars: Record<string, unknown>): string {
  const label = OPERATORS.find((o) => o.op === rule.op)?.label ?? rule.op;
  const current = vars[rule.variable];
  return `${rule.variable} (${current === undefined ? "unset" : String(current)}) ${label} ${String(rule.value)}`;
}

export type RouteDecision = {
  port: PortId;
  matchedGroupId: string | null;
  reason: string;
};

/**
 * Picks the output port for a node. Groups are evaluated in order; the first
 * group whose rules match (all / any) wins. Empty groups never match.
 */
export function evaluateRoute(
  groups: RuleGroup[] | undefined,
  vars: Record<string, unknown>,
  fallback: PortId
): RouteDecision {
  for (const group of groups ?? []) {
    if (group.rules.length === 0) continue;
    const results = group.rules.map((r) => compare(vars[r.variable], r.op, r.value));
    const matched = group.mode === "all" ? results.every(Boolean) : results.some(Boolean);
    if (matched) {
      const parts = group.rules
        .filter((_, i) => results[i])
        .map((r) => describeRule(r, vars));
      return {
        port: group.port,
        matchedGroupId: group.id,
        reason: parts.join(group.mode === "all" ? " AND " : " OR "),
      };
    }
  }
  return {
    port: fallback,
    matchedGroupId: null,
    reason: groups && groups.some((g) => g.rules.length > 0) ? "no rule matched → fallback" : "no rules configured",
  };
}

/** Applies a node's outputs to a copy of the variable bag. */
export function applyOutputs(
  vars: Record<string, unknown>,
  outputs: NodeOutput[] | undefined
): Record<string, unknown> {
  if (!outputs || outputs.length === 0) return vars;
  const next = { ...vars };
  for (const out of outputs) {
    if (!out.variable) continue;
    if (out.op === "add") {
      const base = coerce(next[out.variable]);
      const delta = coerce(out.value);
      const sum = (typeof base === "number" ? base : 0) + (typeof delta === "number" ? delta : 0);
      // Avoid 7.000000001 style float noise on band scores.
      next[out.variable] = Math.round(sum * 1000) / 1000;
    } else {
      next[out.variable] = coerce(out.value);
    }
  }
  return next;
}

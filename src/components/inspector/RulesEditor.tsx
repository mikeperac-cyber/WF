import React, { useMemo } from "react";
import type { NodeOutput, PortId, Rule, RuleGroup, RuleOperator, WorkflowNode } from "@/types/workflow";
import { useWorkflowStore } from "@/stores/workflowStore";
import { getOutputPorts } from "@/utils/geometry";
import { OPERATORS } from "@/engine/rules";
import { routeNode } from "@/engine/runner";
import { makeId } from "@/storage/db";
import { Plus, Trash2, GitFork, Variable, ArrowRight, Info } from "lucide-react";

const input =
  "min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export const RulesEditor: React.FC<{ node: WorkflowNode }> = ({ node }) => {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const checkpoint = useWorkflowStore((s) => s.checkpoint);
  const variables = useWorkflowStore((s) => s.variables);

  const ports = getOutputPorts(node);
  const portIds = ports.map((p) => p.id as PortId);
  const isBranching = ports.length > 1;
  const groups = node.ruleGroups ?? [];
  const outputs = node.outputs ?? [];
  const varNames = useMemo(() => Object.keys(variables).sort(), [variables]);
  const listId = `vars-${node.id}`;

  const preview = useMemo(() => routeNode(node, variables), [node, variables]);
  const portLabel = (id: PortId) => ports.find((p) => p.id === id)?.label ?? id;
  const portColor = (id: PortId) => ports.find((p) => p.id === id)?.color ?? "#6366F1";

  // ---- mutations (structural ones record an undo step) ----
  const setGroups = (next: RuleGroup[], undoable = true) => {
    if (undoable) checkpoint();
    updateNode(node.id, { ruleGroups: next });
  };
  const setOutputs = (next: NodeOutput[], undoable = true) => {
    if (undoable) checkpoint();
    updateNode(node.id, { outputs: next });
  };
  const patchGroup = (gi: number, patch: Partial<RuleGroup>, undoable = true) =>
    setGroups(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)), undoable);
  const patchRule = (gi: number, ri: number, patch: Partial<Rule>, undoable = false) =>
    patchGroup(gi, { rules: groups[gi].rules.map((r, j) => (j === ri ? { ...r, ...patch } : r)) }, undoable);

  const addGroup = () =>
    setGroups([
      ...groups,
      {
        id: makeId(`${node.id}-g`),
        mode: "all",
        port: portIds.find((p) => !groups.some((g) => g.port === p)) ?? portIds[0],
        rules: [{ variable: varNames[0] ?? "", op: ">=", value: "" }],
      },
    ]);

  return (
    <div className="space-y-4">
      <datalist id={listId}>
        {varNames.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      {/* ---------- Routing ---------- */}
      <section className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <GitFork className="w-3.5 h-3.5 text-indigo-500" /> Routing rules
        </h4>

        {!isBranching ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
            This step has a single exit, so it always continues to every connected step. Use outputs below to change variables.
          </p>
        ) : (
          <>
            {/* Live preview */}
            <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/40 text-[11px] text-slate-700 dark:text-slate-200">
              With the current variables this step exits via{" "}
              <span
                className="px-1.5 py-0.5 rounded-md font-bold text-white"
                style={{ backgroundColor: portColor(preview.port) }}
              >
                {portLabel(preview.port)}
              </span>
              <span className="block mt-1 text-slate-500 dark:text-slate-400 font-mono text-[10px] break-words">
                {preview.reason}
              </span>
            </div>

            {groups.length === 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No rules yet — the step always takes the fallback exit. Add a rule to make it decide.
              </p>
            )}

            {groups.map((g, gi) => (
              <div
                key={g.id}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 space-y-2"
              >
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">If</span>
                  <select
                    value={g.mode}
                    onChange={(e) => patchGroup(gi, { mode: e.target.value as "all" | "any" })}
                    className={input}
                  >
                    <option value="all">ALL</option>
                    <option value="any">ANY</option>
                  </select>
                  <span>of these match</span>
                  <ArrowRight className="w-3 h-3" />
                  <select
                    value={g.port}
                    onChange={(e) => patchGroup(gi, { port: e.target.value as PortId })}
                    className={input}
                    style={{ color: portColor(g.port), fontWeight: 700 }}
                  >
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setGroups(groups.filter((_, i) => i !== gi))}
                    className="ml-auto p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    title="Remove this rule group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {g.rules.map((r, ri) => (
                  <div key={ri} className="grid grid-cols-[1fr_auto_1fr_auto] gap-1.5 items-center">
                    <input
                      list={listId}
                      value={r.variable}
                      placeholder="variable"
                      onFocus={checkpoint}
                      onChange={(e) => patchRule(gi, ri, { variable: e.target.value })}
                      className={`${input} font-mono`}
                    />
                    <select
                      value={r.op}
                      onChange={(e) => patchRule(gi, ri, { op: e.target.value as RuleOperator }, true)}
                      className={input}
                    >
                      {OPERATORS.map((o) => (
                        <option key={o.op} value={o.op}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={String(r.value)}
                      placeholder="value"
                      onFocus={checkpoint}
                      onChange={(e) => patchRule(gi, ri, { value: e.target.value })}
                      className={`${input} font-mono`}
                    />
                    <button
                      onClick={() => patchGroup(gi, { rules: g.rules.filter((_, j) => j !== ri) })}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500"
                      title="Remove condition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() =>
                    patchGroup(gi, { rules: [...g.rules, { variable: varNames[0] ?? "", op: ">=", value: "" }] })
                  }
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add condition
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={addGroup}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Plus className="w-3 h-3" /> Add rule
              </button>
              <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">Otherwise exit via</span>
              <select
                value={node.fallbackPort ?? ""}
                onChange={(e) => {
                  checkpoint();
                  updateNode(node.id, { fallbackPort: (e.target.value || undefined) as PortId | undefined });
                }}
                className={input}
              >
                <option value="">Auto ({portLabel(groups.length ? portIds[portIds.length - 1] : portIds[0])})</option>
                {ports.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </section>

      {/* ---------- Outputs ---------- */}
      <section className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <Variable className="w-3.5 h-3.5 text-emerald-500" /> When this step finishes
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Change variables as the plan runs — e.g. add 0.5 to <code>writingScore</code> after a practice cycle.
        </p>

        {outputs.map((o, oi) => (
          <div key={oi} className="grid grid-cols-[1fr_auto_1fr_auto] gap-1.5 items-center">
            <input
              list={listId}
              value={o.variable}
              placeholder="variable"
              onFocus={checkpoint}
              onChange={(e) =>
                setOutputs(outputs.map((x, i) => (i === oi ? { ...x, variable: e.target.value } : x)), false)
              }
              className={`${input} font-mono`}
            />
            <select
              value={o.op}
              onChange={(e) =>
                setOutputs(outputs.map((x, i) => (i === oi ? { ...x, op: e.target.value as "set" | "add" } : x)))
              }
              className={input}
            >
              <option value="set">set to</option>
              <option value="add">add</option>
            </select>
            <input
              value={String(o.value)}
              placeholder="value"
              onFocus={checkpoint}
              onChange={(e) =>
                setOutputs(outputs.map((x, i) => (i === oi ? { ...x, value: e.target.value } : x)), false)
              }
              className={`${input} font-mono`}
            />
            <button
              onClick={() => setOutputs(outputs.filter((_, i) => i !== oi))}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500"
              title="Remove output"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <button
          onClick={() => setOutputs([...outputs, { variable: varNames[0] ?? "", op: "add", value: "1" }])}
          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <Plus className="w-3 h-3" /> Add output
        </button>
      </section>
    </div>
  );
};

import React, { useState, useMemo } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { EXPORT_VERSION, validateImport } from "@/storage/importExport";
import {
  X,
  Download,
  Copy,
  Upload,
  Check,
  FileCode,
} from "lucide-react";

export const ExportModal: React.FC = () => {
  const isExportModalOpen = useWorkflowStore((s) => s.isExportModalOpen);
  const setExportModalOpen = useWorkflowStore((s) => s.setExportModalOpen);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  // Export the plan's starting values, not values mutated by a simulation run.
  const variables = useWorkflowStore((s) => s.runBaseVariables ?? s.variables);
  const activeTemplateId = useWorkflowStore((s) => s.activeTemplateId);
  const docName = useWorkflowStore((s) => s.docName);
  const pushLog = useWorkflowStore((s) => s.pushLog);
  const importWorkflow = useWorkflowStore((s) => s.importWorkflow);

  const [copied, setCopied] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");

  const exportPayload = useMemo(() => ({
    version: EXPORT_VERSION,
    name: docName,
    templateId: activeTemplateId,
    nodes: nodes.map((n) => ({ ...n, status: "idle" as const })),
    edges,
    variables,
  }), [docName, activeTemplateId, nodes, edges, variables]);

  const jsonString = useMemo(() => JSON.stringify(exportPayload, null, 2), [exportPayload]);

  if (!isExportModalOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      pushLog("success", "Plan JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      pushLog("warning", "Clipboard is blocked here — use Download instead.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safe = docName.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "plan";
    link.download = `${safe}.workflow.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    pushLog("success", `Downloaded "${docName}"`);
  };

  const runImport = async (text: string) => {
    setImportError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err: any) {
      setImportError(`That doesn't look like valid JSON (${err.message}).`);
      return;
    }
    const result = validateImport(parsed);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    await importWorkflow(result.payload);
    for (const w of result.warnings) pushLog("warning", `Import: ${w}`);
    setImportJsonText("");
    setExportModalOpen(false);
  };

  const handleImport = () => void runImport(importJsonText);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setImportJsonText(text);
    await runImport(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="relative w-full max-w-3xl max-h-[85vh] glass-panel rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <FileCode className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Workflow Portability & Export
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pure client-side JSON serialization, instant backup, and multi-device sync.
              </p>
            </div>
          </div>

          <button
            onClick={() => setExportModalOpen(false)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 gap-2 text-xs">
          <button
            onClick={() => setActiveTab("export")}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "export"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export Blueprint
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "import"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeTab === "export" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  Serialized JSON Specification ({nodes.length} nodes, {edges.length} edges):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center gap-1.5 transition-colors shadow-glow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-mono text-[11px] max-h-80 overflow-y-auto leading-relaxed">
                {jsonString}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-slate-700 dark:text-slate-300 text-xs">
                  Open a <code>.workflow.json</code> file or paste its contents. It's added as a new plan — nothing is overwritten.
                </p>
                <label className="shrink-0 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                  Choose file…
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      void handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <textarea
                rows={10}
                placeholder='{"name": "My plan", "nodes": [...], "edges": [...]}'
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  setImportError(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 font-mono text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              {importError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{importError}</p>
              )}
              <button
                onClick={handleImport}
                disabled={!importJsonText.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-glow-md transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Import as new plan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

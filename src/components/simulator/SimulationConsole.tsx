import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWorkflowStore } from "@/stores/workflowStore";
import {
  Terminal,
  Database,
  Activity,
  ChevronDown,
  ChevronUp,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
} from "lucide-react";

export const SimulationConsole: React.FC = () => {
  const {
    logs,
    variables,
    nodes,
    edges,
    runStatus,
    activeConsoleTab,
    isConsoleOpen,
    setConsoleOpen,
    setConsoleTab,
    clearLogs,
    setVariable,
  } = useWorkflowStore(
    useShallow((s) => ({
      logs: s.logs,
      variables: s.variables,
      nodes: s.nodes,
      edges: s.edges,
      runStatus: s.runStatus,
      activeConsoleTab: s.activeConsoleTab,
      isConsoleOpen: s.isConsoleOpen,
      setConsoleOpen: s.setConsoleOpen,
      setConsoleTab: s.setConsoleTab,
      clearLogs: s.clearLogs,
      setVariable: s.setVariable,
    }))
  );

  const [logFilter, setLogFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (logFilter !== "all" && log.level !== logFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out glass-panel border-t border-slate-200 dark:border-slate-700/70 shadow-2xl ${
        isConsoleOpen ? "h-48 [@media(min-height:960px)]:h-64" : "h-11"
      } flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl text-slate-800 dark:text-slate-100 transition-colors`}
    >
      {/* Console Header Bar */}
      <div className="h-11 px-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setConsoleOpen(!isConsoleOpen)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white transition-colors"
          >
            <Terminal className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Workflow Console & Telemetry</span>
            {isConsoleOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Simulation Status Chip */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
            <span
              className={`w-2 h-2 rounded-full ${
                runStatus === "running"
                  ? "bg-indigo-500 animate-ping"
                  : runStatus === "completed"
                  ? "bg-emerald-500"
                  : runStatus === "paused"
                  ? "bg-amber-500"
                  : "bg-slate-400"
              }`}
            />
            <span className="uppercase text-slate-600 dark:text-slate-300 tracking-wider">
              {runStatus}
            </span>
          </div>
        </div>

        {/* Tab Switchers */}
        {isConsoleOpen && (
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setConsoleTab("logs")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeConsoleTab === "logs"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Logs ({logs.length})
            </button>
            <button
              onClick={() => setConsoleTab("variables")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeConsoleTab === "variables"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Variables ({Object.keys(variables).length})
            </button>
            <button
              onClick={() => setConsoleTab("telemetry")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeConsoleTab === "telemetry"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Graph Stats
            </button>
          </div>
        )}

        {/* Console Controls */}
        <div className="flex items-center gap-2">
          {isConsoleOpen && activeConsoleTab === "logs" && (
            <button
              onClick={clearLogs}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
              title="Clear Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Console Content */}
      {isConsoleOpen && (
        <div className="flex-1 overflow-hidden p-3 text-xs">
          {/* Tab 1: Telemetry Logs */}
          {activeConsoleTab === "logs" && (
            <div className="h-full flex flex-col gap-2">
              {/* Filter Sub-bar */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filter:
                  </span>
                  {(["all", "info", "success", "warning", "error"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLogFilter(lvl)}
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full transition-colors ${
                        logFilter === lvl
                          ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
                />
              </div>

              {/* Logs Stream */}
              <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-slate-400 dark:text-slate-500 py-6">
                    No log messages to display.
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2.5 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors border-b border-slate-100 dark:border-slate-900/80"
                    >
                      <span className="text-slate-400 dark:text-slate-500 shrink-0 select-none">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>

                      {log.level === "success" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {log.level === "info" && (
                        <Info className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                      )}
                      {log.level === "warning" && (
                        <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                      )}
                      {log.level === "error" && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}

                      <span
                        className={`flex-1 ${
                          log.level === "success"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : log.level === "warning"
                            ? "text-amber-700 dark:text-amber-300"
                            : log.level === "error"
                            ? "text-rose-700 dark:text-rose-300"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Variables Watcher */}
          {activeConsoleTab === "variables" && (
            <div className="h-full overflow-y-auto pr-2">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                    <th className="pb-2">Variable Key</th>
                    <th className="pb-2">Current Value</th>
                    <th className="pb-2">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {Object.entries(variables).map(([key, val]) => (
                    <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-2 text-indigo-700 dark:text-indigo-300 font-semibold">{key}</td>
                      <td className="py-2">
                        <input
                          type="text"
                          value={typeof val === "object" ? JSON.stringify(val) : String(val)}
                          onChange={(e) => setVariable(key, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-emerald-700 dark:text-emerald-300 w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2 text-slate-400 dark:text-slate-500 text-[10px] capitalize">
                        {typeof val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Graph Statistics & Telemetry */}
          {activeConsoleTab === "telemetry" && (
            <div className="grid grid-cols-4 gap-4 h-full items-center p-2">
              <div className="glass-panel p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Active Nodes
                </span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{nodes.length}</span>
              </div>
              <div className="glass-panel p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Connections
                </span>
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{edges.length}</span>
              </div>
              <div className="glass-panel p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Variables Tracked
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {Object.keys(variables).length}
                </span>
              </div>
              <div className="glass-panel p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Execution State
                </span>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400 uppercase">
                  {runStatus}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

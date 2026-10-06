import React, { useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { TEMPLATE_LIST } from "@/data/templates";
import { DynamicIcon } from "@/components/icons/DynamicIcon";
import {
  X,
  FolderOpen,
  Plus,
  Copy,
  Trash2,
  Pencil,
  Check,
  FilePlus2,
  HardDrive,
  Search,
} from "lucide-react";

function timeAgo(ts: number, now: number) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} d ago` : new Date(ts).toLocaleDateString();
}

const templateMeta = new Map(TEMPLATE_LIST.map((t) => [t.id, t]));

export const WorkflowLibrary: React.FC = () => {
  const isOpen = useWorkflowStore((s) => s.isLibraryOpen);
  return isOpen ? <LibraryPanel /> : null;
};

const LibraryPanel: React.FC = () => {
  const setOpen = useWorkflowStore((s) => s.setLibraryOpen);
  const library = useWorkflowStore((s) => s.library);
  const currentDocId = useWorkflowStore((s) => s.currentDocId);
  const storageKind = useWorkflowStore((s) => s.storageKind);
  const openWorkflow = useWorkflowStore((s) => s.openWorkflow);
  const newBlank = useWorkflowStore((s) => s.newBlank);
  const renameWorkflow = useWorkflowStore((s) => s.renameWorkflow);
  const duplicateWorkflow = useWorkflowStore((s) => s.duplicateWorkflow);
  const deleteWorkflow = useWorkflowStore((s) => s.deleteWorkflow);
  const setTemplateModalOpen = useWorkflowStore((s) => s.setTemplateModalOpen);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Captured when the panel opens so "x min ago" labels are stable.
  const [now] = useState(() => Date.now());
  const filtered = library.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()));

  const commitRename = async (id: string) => {
    await renameWorkflow(id, draftName);
    setEditingId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">My plans</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {library.length} saved on this device
                {storageKind && storageKind !== "indexeddb" && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {" "}· {storageKind === "memory" ? "not persistent" : "limited storage"}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800/60">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plans…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <button
            onClick={() => {
              setOpen(false);
              setTemplateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <FilePlus2 className="w-4 h-4" /> From template
          </button>
          <button
            onClick={async () => {
              await newBlank();
              setOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" /> Blank
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-10">
              {library.length === 0 ? "No plans yet — start from a template." : "No plans match your search."}
            </p>
          )}
          <ul className="flex flex-col gap-1.5">
            {filtered.map((m) => {
              const t = m.templateId ? templateMeta.get(m.templateId) : undefined;
              const isCurrent = m.id === currentDocId;
              const isEditing = editingId === m.id;
              const isConfirming = confirmDeleteId === m.id;
              return (
                <li
                  key={m.id}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-colors ${
                    isCurrent
                      ? "border-indigo-300 bg-indigo-50/70 dark:border-indigo-500/40 dark:bg-indigo-950/40"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/70"
                  }`}
                >
                  <span
                    className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border"
                    style={{
                      color: t?.accentColor ?? "#6366F1",
                      backgroundColor: `${t?.accentColor ?? "#6366F1"}18`,
                      borderColor: `${t?.accentColor ?? "#6366F1"}40`,
                    }}
                  >
                    <DynamicIcon name={t?.iconName ?? "Workflow"} className="w-4 h-4" />
                  </span>

                  <button
                    className="flex-1 min-w-0 text-left"
                    disabled={isEditing}
                    onClick={async () => {
                      await openWorkflow(m.id);
                      setOpen(false);
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitRename(m.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={() => void commitRename(m.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 text-sm font-semibold rounded-lg bg-white dark:bg-slate-900 border border-indigo-400 focus:outline-none"
                      />
                    ) : (
                      <span className="block text-sm font-semibold truncate">
                        {m.name}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            open
                          </span>
                        )}
                      </span>
                    )}
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {t ? t.badge : "Custom"} · {m.nodeCount} steps · edited {timeAgo(m.updatedAt, now)}
                    </span>
                  </button>

                  {isConfirming ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Delete?</span>
                      <button
                        onClick={async () => {
                          await deleteWorkflow(m.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <IconBtn title="Save name" onClick={() => void commitRename(m.id)}>
                          <Check className="w-4 h-4 text-emerald-500" />
                        </IconBtn>
                      ) : (
                        <IconBtn
                          title="Rename"
                          onClick={() => {
                            setDraftName(m.name);
                            setEditingId(m.id);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </IconBtn>
                      )}
                      <IconBtn title="Duplicate" onClick={() => void duplicateWorkflow(m.id)}>
                        <Copy className="w-4 h-4" />
                      </IconBtn>
                      <IconBtn title="Delete" onClick={() => setConfirmDeleteId(m.id)}>
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </IconBtn>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

const IconBtn: React.FC<{ title: string; onClick: () => void; children: React.ReactNode }> = ({
  title,
  onClick,
  children,
}) => (
  <button
    title={title}
    onClick={onClick}
    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
  >
    {children}
  </button>
);

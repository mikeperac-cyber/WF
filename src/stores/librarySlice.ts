import type { SavedWorkflow, WorkflowNode } from "@/types/workflow";
import { TEMPLATES } from "@/data/templates";
import { makeId, openWorkspace, type WorkspaceStore } from "@/storage/db";
import { generateSchedule, calculateScheduleStats } from "@/engine/scheduler";
import { stopRunTimers } from "./runSlice";
import type { LibrarySlice, SliceCreator, WorkflowStoreState } from "./types";

type Set = Parameters<SliceCreator<LibrarySlice>>[0];
type Get = () => WorkflowStoreState;

let workspace: WorkspaceStore | null = null;
let initPromise: Promise<void> | null = null;

const LAST_DOC_KEY = "lastDocId";

/** Exposed for the autosave subscriber and tests. */
export function getWorkspace() {
  return workspace;
}

function blankNodes(): WorkflowNode[] {
  return [
    {
      id: makeId("trigger"),
      kind: "trigger",
      x: 380,
      y: 80,
      title: "Start",
      description: "Where this plan begins. Connect your first step below.",
      category: "logic",
      status: "idle",
    },
  ];
}

function docFromTemplate(templateId: string): SavedWorkflow | null {
  const factory = TEMPLATES[templateId];
  if (!factory) return null;
  const t = factory();
  const now = Date.now();
  const wfId = makeId("wf");
  const { tasks, config } = generateSchedule({
    workflowId: wfId,
    nodes: t.nodes,
    edges: t.edges,
  });
  return {
    id: wfId,
    name: t.title,
    templateId: t.id,
    nodes: t.nodes,
    edges: t.edges,
    variables: t.defaultVariables,
    createdAt: now,
    updatedAt: now,
    tasks,
    scheduleConfig: config,
  };
}

/** Serialises the current editor state into a document. */
export function currentDoc(s: WorkflowStoreState): SavedWorkflow | null {
  if (!s.currentDocId) return null;
  const meta = s.library.find((m) => m.id === s.currentDocId);
  return {
    id: s.currentDocId,
    name: s.docName,
    templateId: s.activeTemplateId === "blank" ? null : s.activeTemplateId,
    nodes: s.nodes,
    edges: s.edges,
    // Never persist values mutated by a simulation run.
    variables: s.runBaseVariables ?? s.variables,
    createdAt: meta?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    tasks: s.tasks,
    scheduleConfig: s.scheduleConfig,
  };
}

async function refreshList(set: Set) {
  if (!workspace) return;
  set({ library: await workspace.list() });
}

function applyDoc(set: Set, get: Get, doc: SavedWorkflow) {
  stopRunTimers();

  const tasks =
    doc.tasks && doc.tasks.length > 0
      ? doc.tasks
      : generateSchedule({
          workflowId: doc.id,
          nodes: doc.nodes,
          edges: doc.edges,
          config: doc.scheduleConfig,
        }).tasks;
  const scheduleConfig = doc.scheduleConfig ?? get().scheduleConfig;
  const scheduleStats = calculateScheduleStats(tasks);

  set({
    runStatus: "idle",
    runnerState: null,
    activeNodeId: null,
    activeEdgeId: null,
    currentDocId: doc.id,
    docName: doc.name,
    nodes: doc.nodes.map((n) => ({ ...n, status: "idle" })),
    edges: doc.edges,
    variables: doc.variables ?? {},
    activeTemplateId: doc.templateId ?? "blank",
    tasks,
    scheduleConfig,
    scheduleStats,
    selection: null,
    inspectorNodeId: null,
    past: [],
    future: [],
    runBaseVariables: null,
    traversedEdgeIds: [],
  });
  void workspace?.setSetting(LAST_DOC_KEY, doc.id);
  // Wait a frame so the canvas has measured itself before fitting.
  requestAnimationFrame(() => get().fitView());
}

async function persistAndOpen(set: Set, get: Get, doc: SavedWorkflow, message: string) {
  await get().saveNow();
  if (workspace) await workspace.save(doc);
  await refreshList(set);
  applyDoc(set, get, doc);
  get().pushLog("info", message);
}

export const createLibrarySlice: SliceCreator<LibrarySlice> = (set, get) => ({
  currentDocId: null,
  docName: "Untitled plan",
  library: [],
  libraryReady: false,
  storageKind: null,
  saveStatus: "idle",

  initLibrary: () => {
    initPromise ??= (async () => {
      workspace = await openWorkspace();
      set({ storageKind: workspace.kind });
      if (workspace.kind !== "indexeddb") {
        get().pushLog(
          "warning",
          workspace.kind === "memory"
            ? "Storage is unavailable — changes will be lost when you close the app."
            : "Using browser localStorage for saving (limited space)."
        );
      }
      const list = await workspace.list();
      set({ library: list });

      let doc: SavedWorkflow | undefined;
      if (list.length > 0) {
        const lastId = await workspace.getSetting<string>(LAST_DOC_KEY);
        doc = (lastId && (await workspace.load(lastId))) || (await workspace.load(list[0].id));
      }
      if (!doc) {
        const fresh = docFromTemplate("esl-mastery");
        if (fresh) {
          await workspace.save(fresh);
          await refreshList(set);
          doc = fresh;
        }
      }
      if (doc) applyDoc(set, get, doc);
      set({ libraryReady: true });
    })();
    return initPromise;
  },

  saveNow: async () => {
    const doc = currentDoc(get());
    if (!doc || !workspace) return;
    set({ saveStatus: "saving" });
    try {
      await workspace.save(doc);
      set((s) => ({
        saveStatus: "saved",
        library: [
          { id: doc.id, name: doc.name, templateId: doc.templateId, createdAt: doc.createdAt, updatedAt: doc.updatedAt, nodeCount: doc.nodes.length },
          ...s.library.filter((m) => m.id !== doc.id),
        ],
      }));
    } catch (err: any) {
      set({ saveStatus: "error" });
      get().pushLog("error", `Save failed: ${err?.message ?? err}`);
    }
  },

  openWorkflow: async (id) => {
    if (!workspace || id === get().currentDocId) return;
    await get().saveNow();
    const doc = await workspace.load(id);
    if (!doc) {
      get().pushLog("error", "That plan could not be found.");
      await refreshList(set);
      return;
    }
    applyDoc(set, get, doc);
    get().pushLog("info", `Opened "${doc.name}"`);
  },

  newFromTemplate: async (templateId) => {
    const doc = docFromTemplate(templateId);
    if (!doc) return;
    await persistAndOpen(set, get, doc, `Created "${doc.name}" from template`);
  },

  openOrCreateFromTemplate: async (templateId) => {
    const existing = get().library.find((m) => m.templateId === templateId);
    if (existing) return get().openWorkflow(existing.id);
    return get().newFromTemplate(templateId);
  },

  newBlank: async () => {
    const now = Date.now();
    const doc: SavedWorkflow = {
      id: makeId("wf"),
      name: "Untitled plan",
      templateId: null,
      nodes: blankNodes(),
      edges: [],
      variables: {},
      createdAt: now,
      updatedAt: now,
    };
    await persistAndOpen(set, get, doc, "Created a blank plan");
  },

  renameWorkflow: async (id, name) => {
    const clean = name.trim() || "Untitled plan";
    if (id === get().currentDocId) {
      set({ docName: clean });
      await get().saveNow();
      return;
    }
    if (!workspace) return;
    const doc = await workspace.load(id);
    if (!doc) return;
    await workspace.save({ ...doc, name: clean, updatedAt: Date.now() });
    await refreshList(set);
  },

  duplicateWorkflow: async (id) => {
    if (!workspace) return;
    await get().saveNow();
    const src = await workspace.load(id);
    if (!src) return;
    const now = Date.now();
    const copy: SavedWorkflow = { ...structuredClone(src), id: makeId("wf"), name: `${src.name} (copy)`, createdAt: now, updatedAt: now };
    await workspace.save(copy);
    await refreshList(set);
    get().pushLog("info", `Duplicated "${src.name}"`);
  },

  deleteWorkflow: async (id) => {
    if (!workspace) return;
    await workspace.remove(id);
    await refreshList(set);
    if (id === get().currentDocId) {
      set({ currentDocId: null }); // prevent saveNow from resurrecting it
      const next = get().library[0];
      if (next) {
        const doc = await workspace.load(next.id);
        if (doc) applyDoc(set, get, doc);
      } else {
        await get().newBlank();
      }
    }
    get().pushLog("warning", "Plan deleted");
  },

  importWorkflow: async (payload) => {
    const now = Date.now();
    const doc: SavedWorkflow = {
      id: makeId("wf"),
      name: payload.name?.trim() || "Imported plan",
      templateId: payload.templateId ?? null,
      nodes: payload.nodes,
      edges: payload.edges,
      variables: payload.variables ?? {},
      createdAt: now,
      updatedAt: now,
    };
    await persistAndOpen(set, get, doc, `Imported "${doc.name}" (${doc.nodes.length} nodes)`);
  },

  loadTemplate: (templateId) => void get().openOrCreateFromTemplate(templateId),
  loadBlank: () => void get().newBlank(),
});

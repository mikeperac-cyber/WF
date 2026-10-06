import { create } from "zustand";
import { createSettingsSlice } from "./settingsSlice";
import { createGraphSlice } from "./graphSlice";
import { createUiSlice } from "./uiSlice";
import { createRunSlice } from "./runSlice";
import { createLibrarySlice } from "./librarySlice";
import { createScheduleSlice } from "./scheduleSlice";
import type { WorkflowStoreState } from "./types";

export type { ConnectingState, WorkflowStoreState } from "./types";

/**
 * Single store composed from focused slices. Components keep importing
 * `useWorkflowStore` exactly as before; prefer narrow selectors
 * (`useWorkflowStore((s) => s.nodes)`) to avoid needless re-renders.
 */
export const useWorkflowStore = create<WorkflowStoreState>()((...a) => ({
  ...createSettingsSlice(...a),
  ...createGraphSlice(...a),
  ...createUiSlice(...a),
  ...createRunSlice(...a),
  ...createLibrarySlice(...a),
  ...createScheduleSlice(...a),
}));

// ---------------- Autosave ----------------
// Debounced: saves 500ms after the last document change. Run-time status
// changes are stripped by the storage layer, and run-mutated variables are
// excluded via runBaseVariables, so simulations never dirty the saved plan.
const AUTOSAVE_MS = 500;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

useWorkflowStore.subscribe((state, prev) => {
  if (!state.libraryReady || !state.currentDocId) return;
  if (state.currentDocId !== prev.currentDocId) return; // doc just switched; nothing new to save
  const docChanged =
    state.nodes !== prev.nodes ||
    state.edges !== prev.edges ||
    state.docName !== prev.docName ||
    state.tasks !== prev.tasks ||
    state.scheduleConfig !== prev.scheduleConfig ||
    (state.runBaseVariables ?? state.variables) !== (prev.runBaseVariables ?? prev.variables);
  if (!docChanged) return;
  // Pure status churn during a run isn't worth a write.
  if (state.runStatus === "running" && state.edges === prev.edges && onlyStatusChanged(state, prev)) return;

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void useWorkflowStore.getState().saveNow();
  }, AUTOSAVE_MS);
});

function onlyStatusChanged(a: WorkflowStoreState, b: WorkflowStoreState) {
  if (a.nodes.length !== b.nodes.length) return false;
  for (let i = 0; i < a.nodes.length; i++) {
    const x = a.nodes[i];
    const y = b.nodes[i];
    if (x === y) continue;
    if (x.id !== y.id || x.x !== y.x || x.y !== y.y || x.title !== y.title) return false;
    const { status: _s1, ...rx } = x;
    const { status: _s2, ...ry } = y;
    if (JSON.stringify(rx) !== JSON.stringify(ry)) return false;
  }
  return true;
}

// Flush pending saves when the window is closing.
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      void useWorkflowStore.getState().saveNow();
    }
  });
}

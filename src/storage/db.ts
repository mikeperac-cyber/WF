import { createStore, del, entries, get, set } from "idb-keyval";
import type { SavedWorkflow, WorkflowMeta } from "@/types/workflow";

/** Minimal async key-value contract so storage backends are swappable (IDB / localStorage / memory / future Tauri FS). */
export interface KV {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  entries<T>(): Promise<[string, T][]>;
}

export type StorageKind = "indexeddb" | "localstorage" | "memory";

export function createMemoryKV(): KV {
  const map = new Map<string, unknown>();
  return {
    async get<T>(key: string) {
      const v = map.get(key);
      return v === undefined ? undefined : (structuredClone(v) as T);
    },
    async set(key, value) {
      map.set(key, structuredClone(value));
    },
    async del(key) {
      map.delete(key);
    },
    async entries<T>() {
      return [...map.entries()].map(([k, v]) => [k, structuredClone(v) as T]);
    },
  };
}

export function createLocalStorageKV(prefix = "wf_kv:"): KV {
  return {
    async get<T>(key: string) {
      const raw = localStorage.getItem(prefix + key);
      return raw === null ? undefined : (JSON.parse(raw) as T);
    },
    async set(key, value) {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    },
    async del(key) {
      localStorage.removeItem(prefix + key);
    },
    async entries<T>() {
      const out: [string, T][] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(prefix)) continue;
        const raw = localStorage.getItem(k);
        if (raw !== null) out.push([k.slice(prefix.length), JSON.parse(raw) as T]);
      }
      return out;
    },
  };
}

export function createIdbKV(): KV {
  const store = createStore("workflow-studio", "kv");
  return {
    get: <T>(key: string) => get<T>(key, store),
    set: (key, value) => set(key, value, store),
    del: (key) => del(key, store),
    entries: <T>() => entries<string, T>(store),
  };
}

const DOC_PREFIX = "doc:";

/** Strips run-time state so saved documents are clean and diff-friendly. */
function sanitize(doc: SavedWorkflow): SavedWorkflow {
  return {
    ...doc,
    nodes: doc.nodes.map(({ status: _status, ...rest }) => ({ ...rest, status: "idle" })),
  };
}

/** v2: cards grew taller/wider, so v1 layouts are spread out to stop overlaps. */
export const SCHEMA_VERSION = 2;

export function migrate(doc: SavedWorkflow): SavedWorkflow {
  if ((doc.schemaVersion ?? 1) >= SCHEMA_VERSION) return doc;
  return {
    ...doc,
    schemaVersion: SCHEMA_VERSION,
    nodes: doc.nodes.map((n) => ({ ...n, x: Math.round(n.x * 1.5), y: Math.round(n.y * 1.45) })),
  };
}

export class WorkspaceStore {
  constructor(
    private readonly kv: KV,
    readonly kind: StorageKind
  ) {}

  async list(): Promise<WorkflowMeta[]> {
    const all = await this.kv.entries<SavedWorkflow>();
    return all
      .filter(([k]) => k.startsWith(DOC_PREFIX))
      .map(([, d]) => ({
        id: d.id,
        name: d.name,
        templateId: d.templateId,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        nodeCount: d.nodes.length,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async load(id: string) {
    const doc = await this.kv.get<SavedWorkflow>(DOC_PREFIX + id);
    return doc ? migrate(doc) : doc;
  }

  save(doc: SavedWorkflow) {
    return this.kv.set(DOC_PREFIX + doc.id, { ...sanitize(doc), schemaVersion: SCHEMA_VERSION });
  }

  remove(id: string) {
    return this.kv.del(DOC_PREFIX + id);
  }

  getSetting<T>(key: string) {
    return this.kv.get<T>(`setting:${key}`);
  }

  setSetting(key: string, value: unknown) {
    return this.kv.set(`setting:${key}`, value);
  }
}

async function probe(kv: KV) {
  await kv.set("__probe", 1);
  await kv.get("__probe");
  await kv.del("__probe");
}

/**
 * Opens the best available backend. IndexedDB can be unavailable (private
 * mode, some file:// contexts), so we degrade to localStorage and finally to
 * memory so the app always works.
 */
export async function openWorkspace(): Promise<WorkspaceStore> {
  try {
    if (typeof indexedDB !== "undefined") {
      const kv = createIdbKV();
      await probe(kv);
      return new WorkspaceStore(kv, "indexeddb");
    }
  } catch {
    /* fall through */
  }
  try {
    if (typeof localStorage !== "undefined") {
      const kv = createLocalStorageKV();
      await probe(kv);
      return new WorkspaceStore(kv, "localstorage");
    }
  } catch {
    /* fall through */
  }
  return new WorkspaceStore(createMemoryKV(), "memory");
}

/** Collision-safe id that also works outside secure contexts (file://). */
export function makeId(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "getRandomValues" in crypto
      ? Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("")
      : Math.random().toString(16).slice(2, 14);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

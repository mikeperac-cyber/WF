import { describe, expect, it } from "vitest";
import { WorkspaceStore, createMemoryKV, makeId } from "./db";
import { validateImport } from "./importExport";
import type { SavedWorkflow } from "@/types/workflow";

const doc = (id: string, updatedAt: number): SavedWorkflow =>
  ({
    id,
    name: `Plan ${id}`,
    templateId: null,
    createdAt: 1,
    updatedAt,
    nodes: [{ id: "n1", kind: "action", title: "A", description: "", category: "logic", x: 0, y: 0, status: "success" }],
    edges: [],
    variables: { a: 1 },
  }) as unknown as SavedWorkflow;

describe("WorkspaceStore", () => {
  it("round-trips, sanitizes status and sorts by recency", async () => {
    const ws = new WorkspaceStore(createMemoryKV(), "memory");
    await ws.save(doc("a", 10));
    await ws.save(doc("b", 20));
    const list = await ws.list();
    expect(list.map((m) => m.id)).toEqual(["b", "a"]);
    expect(list[0].nodeCount).toBe(1);
    const loaded = await ws.load("a");
    expect(loaded?.nodes[0].status).toBe("idle");
    expect(loaded?.variables).toEqual({ a: 1 });
  });

  it("removes docs and keeps settings separate from docs", async () => {
    const ws = new WorkspaceStore(createMemoryKV(), "memory");
    await ws.save(doc("a", 1));
    await ws.setSetting("lastOpenId", "a");
    await ws.remove("a");
    expect(await ws.list()).toEqual([]);
    expect(await ws.getSetting("lastOpenId")).toBe("a");
  });
});

describe("makeId", () => {
  it("is unique and prefixed", () => {
    const ids = new Set(Array.from({ length: 200 }, () => makeId("x")));
    expect(ids.size).toBe(200);
    expect([...ids][0].startsWith("x-")).toBe(true);
  });
});

describe("validateImport", () => {
  it("rejects non-workflow input", () => {
    expect(validateImport(null).ok).toBe(false);
    expect(validateImport({ nodes: [] }).ok).toBe(false);
  });

  it("repairs bad nodes and drops dangling edges", () => {
    const res = validateImport({
      name: "Imported",
      nodes: [
        { id: "a", kind: "nope", x: "bad" },
        { id: "a", kind: "action" },
        { id: "b", kind: "action", x: 5, y: 6, status: "running" },
      ],
      edges: [
        { id: "e", source: "a", target: "b", port: "weird" },
        { id: "e", source: "a", target: "b", port: "out" },
        { id: "z", source: "a", target: "missing" },
      ],
      variables: [1, 2],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const { nodes, edges, variables, name } = res.payload;
    expect(name).toBe("Imported");
    expect(nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(nodes[0].kind).toBe("action");
    expect(nodes[0].x).toBe(0);
    expect(nodes[1].status).toBe("idle");
    expect(edges).toHaveLength(2);
    expect(edges[0].port).toBe("out");
    expect(new Set(edges.map((e) => e.id)).size).toBe(2);
    expect(variables).toEqual({});
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});

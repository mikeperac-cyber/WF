import { describe, expect, it } from "vitest";
import { TEMPLATE_LIST } from "@/data/templates";
import {
  NODE_WIDTH,
  getInputPortPosition,
  getNodeHeight,
  getOutputPortPosition,
  getOutputPorts,
  isBackwardEdge,
} from "./geometry";

/** Guards the visual quality of every built-in template. */
describe.each(TEMPLATE_LIST.map((t) => [t.id, t] as const))("template layout: %s", (_id, template) => {
  const byId = new Map(template.nodes.map((n) => [n.id, n]));

  it("has no overlapping cards (with a 24px gutter)", () => {
    const GUTTER = 24;
    const boxes = template.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, w: NODE_WIDTH, h: getNodeHeight(n) }));
    const overlaps: string[] = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const sepX = a.x + a.w + GUTTER <= b.x || b.x + b.w + GUTTER <= a.x;
        const sepY = a.y + a.h + GUTTER <= b.y || b.y + b.h + GUTTER <= a.y;
        if (!sepX && !sepY) overlaps.push(`${a.id} ↔ ${b.id}`);
      }
    }
    expect(overlaps).toEqual([]);
  });

  it("does not cross sibling edges leaving the same node", () => {
    const crossings: string[] = [];
    for (const node of template.nodes) {
      const ports = getOutputPorts(node).map((p) => p.id);
      const out = template.edges
        .filter((e) => e.source === node.id && byId.has(e.target))
        .sort((a, b) => ports.indexOf(a.port) - ports.indexOf(b.port));
      for (let i = 1; i < out.length; i++) {
        if (out[i].port === out[i - 1].port) continue;
        const prevX = getInputPortPosition(byId.get(out[i - 1].target)!).x;
        const curX = getInputPortPosition(byId.get(out[i].target)!).x;
        if (curX < prevX) crossings.push(`${node.id}: ${out[i - 1].port}→${out[i].port}`);
      }
    }
    expect(crossings).toEqual([]);
  });

  it("only draws loop-backs for edges that really go upward", () => {
    const falseLoops = template.edges.filter((e) => {
      const s = byId.get(e.source);
      const t = byId.get(e.target);
      if (!s || !t) return false;
      const from = getOutputPortPosition(s, e.port);
      const to = getInputPortPosition(t);
      return isBackwardEdge(from, to) && t.y > s.y;
    });
    expect(falseLoops.map((e) => e.id)).toEqual([]);
  });
});

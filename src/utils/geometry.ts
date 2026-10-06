import type { EdgeRoutingStyle, PortId, WorkflowEdge, WorkflowNode, WorkflowView } from "@/types/workflow";
import { ACTION_DEFINITIONS } from "@/data/nodeDefinitions";

export type Point = { x: number; y: number };

export const NODE_WIDTH = 340;
export const NODE_MIN_HEIGHT = 120;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2.0;

/** Height of the card's chip row + its top border/padding. */
const CHIP_ROW_HEIGHT = 28;
/** Padding + header + 2-line description (the card reserves both lines). */
const NODE_BASE_HEIGHT = 136;

/**
 * Cards are rendered at exactly this height (not min-height) so edge
 * endpoints computed here always land on the rendered ports.
 */
export function getNodeHeight(node: WorkflowNode): number {
  if (node.height) return node.height;
  if (node.kind === "note") return 140;
  const hasChips =
    (node.data && Object.keys(node.data).length > 0) ||
    (node.ruleGroups?.some((g) => g.rules.length > 0) ?? false) ||
    (node.outputs?.length ?? 0) > 0;
  return NODE_BASE_HEIGHT + (hasChips ? CHIP_ROW_HEIGHT : 0);
}

export function getInputPortPosition(node: WorkflowNode): Point {
  return {
    x: node.x + NODE_WIDTH / 2,
    y: node.y,
  };
}

export function getOutputPorts(node: WorkflowNode) {
  const def = ACTION_DEFINITIONS[node.kind];
  if (!def) return [{ id: "out" as PortId, label: "Next", color: "#6366F1" }];
  return def.defaultPorts.filter((p) => p.type === "output");
}

export function getOutputPortPosition(
  node: WorkflowNode,
  portId: PortId = "out",
  nodeHeight?: number
): Point {
  const height = nodeHeight ?? getNodeHeight(node);
  const ports = getOutputPorts(node);
  const index = ports.findIndex((p) => p.id === portId);

  if (ports.length <= 1 || index === -1) {
    return {
      x: node.x + NODE_WIDTH / 2,
      y: node.y + height,
    };
  }

  // Distribute multiple output ports evenly across bottom
  const step = NODE_WIDTH / (ports.length + 1);
  return {
    x: node.x + step * (index + 1),
    y: node.y + height,
  };
}

// ---------------- Path Calculators ----------------

/** An edge whose target sits above its source port — i.e. a loop back. */
export function isBackwardEdge(from: Point, to: Point): boolean {
  return to.y - from.y < 12;
}

/**
 * X of the vertical "lane" a loop-back edge travels along, clear of both
 * nodes. Uses the source's outer side (left if the target is to the right)
 * so the loop hugs its own column instead of crossing sibling nodes.
 */
export function loopLaneX(from: Point, to: Point): number {
  const gap = NODE_WIDTH / 2 + 60;
  return from.x <= to.x ? Math.min(from.x, to.x) - gap : Math.max(from.x, to.x) + gap;
}

export function getSmoothBezierPath(from: Point, to: Point): string {
  const dy = to.y - from.y;

  if (!isBackwardEdge(from, to)) {
    const c = Math.max(dy * 0.45, 40);
    return `M ${from.x} ${from.y} C ${from.x} ${from.y + c}, ${to.x} ${to.y - c}, ${to.x} ${to.y}`;
  }

  // Loop back: drop out of the source, swing to a side lane, climb, and
  // enter the target from above so the arrow direction stays readable.
  const lane = loopLaneX(from, to);
  const midY = (from.y + to.y) / 2;
  const drop = 70;
  return [
    `M ${from.x} ${from.y}`,
    `C ${from.x} ${from.y + drop}, ${lane} ${from.y + drop}, ${lane} ${midY}`,
    `C ${lane} ${to.y - drop}, ${to.x} ${to.y - drop}, ${to.x} ${to.y}`,
  ].join(" ");
}

export function getOrthogonalPath(from: Point, to: Point): string {
  const dy = to.y - from.y;
  const dx = to.x - from.x;
  const r = 12; // corner radius

  if (!isBackwardEdge(from, to)) {
    const midY = from.y + dy / 2;
    if (Math.abs(dx) < 4) {
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }
    const sx = dx > 0 ? 1 : -1;
    const rr = Math.min(r, Math.abs(dx) / 2, Math.abs(dy) / 4);
    return `M ${from.x} ${from.y} L ${from.x} ${midY - rr} Q ${from.x} ${midY} ${from.x + sx * rr} ${midY} L ${to.x - sx * rr} ${midY} Q ${to.x} ${midY} ${to.x} ${midY + rr} L ${to.x} ${to.y}`;
  }

  // Backward loop orthogonal
  const drop = 36;
  const laneX = loopLaneX(from, to);
  return `M ${from.x} ${from.y} L ${from.x} ${from.y + drop} L ${laneX} ${from.y + drop} L ${laneX} ${to.y - drop} L ${to.x} ${to.y - drop} L ${to.x} ${to.y}`;
}

export function getCurvedPath(from: Point, to: Point): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const curvature = 35;
  const cx = midX + (from.y - to.y > 0 ? curvature : -curvature);
  const cy = midY;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

export function getStraightPath(from: Point, to: Point): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

export function getEdgePath(
  from: Point,
  to: Point,
  style: EdgeRoutingStyle = "smooth"
): string {
  switch (style) {
    case "orthogonal":
      return getOrthogonalPath(from, to);
    case "curved":
      return getCurvedPath(from, to);
    case "straight":
      return getStraightPath(from, to);
    case "smooth":
    default:
      return getSmoothBezierPath(from, to);
  }
}

/** Where to place an edge's label so it sits on the drawn path. */
export function getMidpoint(from: Point, to: Point, style: EdgeRoutingStyle = "smooth"): Point {
  if (isBackwardEdge(from, to) && (style === "smooth" || style === "orthogonal")) {
    return { x: loopLaneX(from, to), y: (from.y + to.y) / 2 };
  }
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

// ---------------- Coordinate Transforms ----------------

export function toCanvasCoords(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  view: WorkflowView
): Point {
  return {
    x: (clientX - containerRect.left - view.x) / view.zoom,
    y: (clientY - containerRect.top - view.y) / view.zoom,
  };
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

// ---------------- Magnetic Port Snapping ----------------

export type NearestPortResult = {
  nodeId: string;
  portId: PortId;
  type: "input" | "output";
  position: Point;
  distance: number;
};

export function findNearestPort(
  point: Point,
  nodes: WorkflowNode[],
  excludeNodeId?: string,
  maxDistance = 42
): NearestPortResult | null {
  let nearest: NearestPortResult | null = null;
  let minDist = maxDistance;

  for (const node of nodes) {
    if (node.id === excludeNodeId) continue;

    // Check input port
    const inputPos = getInputPortPosition(node);
    const distInput = Math.hypot(point.x - inputPos.x, point.y - inputPos.y);
    if (distInput < minDist) {
      minDist = distInput;
      nearest = {
        nodeId: node.id,
        portId: "in",
        type: "input",
        position: inputPos,
        distance: distInput,
      };
    }

    // Check output ports
    const ports = getOutputPorts(node);
    for (const p of ports) {
      const outPos = getOutputPortPosition(node, p.id);
      const distOut = Math.hypot(point.x - outPos.x, point.y - outPos.y);
      if (distOut < minDist) {
        minDist = distOut;
        nearest = {
          nodeId: node.id,
          portId: p.id,
          type: "output",
          position: outPos,
          distance: distOut,
        };
      }
    }
  }

  return nearest;
}

// ---------------- Auto-Layout DAG Algorithm ----------------

export function autoLayoutDAG(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  if (nodes.length === 0) return [];

  // Build adjacency list & in-degrees
  const inDegree: Record<string, number> = {};
  const childrenMap: Record<string, string[]> = {};

  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    childrenMap[n.id] = [];
  });

  edges.forEach((e) => {
    if (inDegree[e.target] !== undefined) {
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    }
    if (childrenMap[e.source]) {
      childrenMap[e.source].push(e.target);
    }
  });

  // Level assignment (Topological Sort / Longest Path)
  const levels: Record<string, number> = {};
  const queue: string[] = [];

  nodes.forEach((n) => {
    if (inDegree[n.id] === 0) {
      queue.push(n.id);
      levels[n.id] = 0;
    }
  });

  // Handle cycles or disconnected nodes
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
    levels[nodes[0].id] = 0;
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levels[curr] || 0;

    for (const child of childrenMap[curr] || []) {
      levels[child] = Math.max(levels[child] || 0, currLevel + 1);
      inDegree[child]--;
      if (inDegree[child] === 0) {
        queue.push(child);
      }
    }
  }

  // Ensure all nodes have a level assigned
  nodes.forEach((n) => {
    if (levels[n.id] === undefined) {
      levels[n.id] = 0;
    }
  });

  // Group nodes by level
  const levelGroups: Record<number, WorkflowNode[]> = {};
  nodes.forEach((n) => {
    const lvl = levels[n.id];
    if (!levelGroups[lvl]) levelGroups[lvl] = [];
    levelGroups[lvl].push(n);
  });

  // Position nodes layer by layer
  const Y_GAP = 250;
  const X_GAP = 420;
  const updatedNodes: WorkflowNode[] = [];

  const maxLevel = Math.max(...Object.keys(levelGroups).map(Number));

  for (let l = 0; l <= maxLevel; l++) {
    const group = levelGroups[l] || [];
    const totalWidth = group.length * X_GAP;
    const startX = 400 - totalWidth / 2;

    group.forEach((node, idx) => {
      updatedNodes.push({
        ...node,
        x: startX + idx * X_GAP,
        y: 60 + l * Y_GAP,
      });
    });
  }

  return updatedNodes;
}

import { LiveList } from "@liveblocks/client";
import type { Edge, Node } from "@xyflow/react";
import type {
  StoredFlowEdge,
  StoredFlowNode,
} from "@/lib/evidence-board-types";

export const INITIAL_EVIDENCE_NODES: StoredFlowNode[] = [
  {
    id: "note-victim",
    type: "stickyNote",
    position: { x: 120, y: 120 },
    data: {
      text: "Victim last seen at Platform 9. Station clock reads 21:14.",
    },
  },
  {
    id: "photo-ticket",
    type: "polaroid",
    position: { x: 480, y: 70 },
    data: {
      caption: "TORN TICKET",
    },
  },
  {
    id: "note-witness",
    type: "stickyNote",
    position: { x: 420, y: 280 },
    data: {
      text: "Night clerk reports a second visitor after closing.",
    },
  },
];

export const INITIAL_EVIDENCE_EDGES: StoredFlowEdge[] = [];

export function createInitialEvidenceStorage() {
  return {
    nodes: new LiveList(INITIAL_EVIDENCE_NODES),
    edges: new LiveList(INITIAL_EVIDENCE_EDGES),
  };
}

export function serializeFlowNode(node: Node): StoredFlowNode {
  return JSON.parse(JSON.stringify(node)) as StoredFlowNode;
}

export function serializeFlowEdge(edge: Edge): StoredFlowEdge {
  return JSON.parse(JSON.stringify(edge)) as StoredFlowEdge;
}

export function deserializeFlowNodes(nodes: readonly unknown[]): Node[] {
  return nodes.map((node) => {
    const stored = node as StoredFlowNode;

    return {
      ...stored,
      position: { ...stored.position },
      data: { ...stored.data },
    } as unknown as Node;
  });
}

export function deserializeFlowEdges(edges: readonly unknown[]): Edge[] {
  return edges.map((edge) => {
    const stored = edge as StoredFlowEdge;

    return {
      ...stored,
      data: stored.data ? { ...stored.data } : undefined,
    } as unknown as Edge;
  });
}

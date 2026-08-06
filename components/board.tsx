"use client";

import { ClientSideSuspense } from "@liveblocks/react";
import { type DragEvent, useEffect, useMemo, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type XYPosition,
} from "@xyflow/react";
import { useCollaborationIdentity } from "@/components/collaboration-context";
import { RedStringEdge } from "@/components/flow-edges";
import {
  LiveStickyNoteNode,
  PolaroidNode,
  StickyNoteNode,
} from "@/components/flow-nodes";
import {
  deserializeFlowEdges,
  deserializeFlowNodes,
  serializeFlowEdge,
  serializeFlowNode,
} from "@/lib/evidence-board-storage";
import { triggerHaptic } from "@/lib/haptics";
import { useMutation, useStorage } from "@/lib/liveblocks";
import {
  type EvidenceNodeType,
  useInvestigationStore,
} from "@/store/use-investigation-store";

const dragTransferType = "application/reactflow";

const localNodeTypes = {
  stickyNote: StickyNoteNode,
  polaroid: PolaroidNode,
};

const liveNodeTypes = {
  stickyNote: LiveStickyNoteNode,
  polaroid: PolaroidNode,
};

const edgeTypes = {
  redString: RedStringEdge,
};

type EvidenceItem = {
  label: string;
  nodeType: EvidenceNodeType;
};

const evidenceItems: EvidenceItem[] = [
  { label: "Blank Sticky", nodeType: "stickyNote" },
  { label: "Suspect Polaroid", nodeType: "polaroid" },
];

function EvidenceBox() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncDefaultState = () => setIsOpen(!mediaQuery.matches);

    syncDefaultState();
    mediaQuery.addEventListener("change", syncDefaultState);
    return () => mediaQuery.removeEventListener("change", syncDefaultState);
  }, []);

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    nodeType: EvidenceNodeType,
  ) {
    event.dataTransfer.setData(dragTransferType, nodeType);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <div className="absolute left-2 top-2 z-10 w-48 border-4 border-[var(--ink)] bg-[var(--panel)] p-2 font-mono shadow-[3px_3px_0_var(--ink)] rounded-none md:left-4 md:top-4 md:p-3 md:shadow-[4px_4px_0_var(--ink)]">
      <button
        type="button"
        onClick={() =>
          setIsOpen((open) => {
            if (!open) triggerHaptic("light");
            return !open;
          })
        }
        aria-expanded={isOpen}
        aria-controls="evidence-box-actions"
        className={`flex min-h-11 w-full items-center border-b-2 border-[var(--ink)] px-1 text-left text-xs font-bold uppercase tracking-normal ${
          isOpen ? "mb-3" : ""
        }`}
      >
        [ {isOpen ? "-" : "+"} ] Evidence Box
      </button>

      {isOpen ? (
        <div id="evidence-box-actions" className="space-y-2">
          {evidenceItems.map((item) => (
            <div
              key={item.nodeType}
              draggable
              onDragStart={(event) => handleDragStart(event, item.nodeType)}
              className="flex min-h-11 cursor-grab items-center border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase shadow-[3px_3px_0_var(--ink)] active:cursor-grabbing rounded-none"
            >
              {item.label}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type BoardSurfaceProps = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addEvidenceNode: (nodeType: EvidenceNodeType, position: XYPosition) => void;
  setNodeLock: (nodeId: string, lockedBy: string | null) => void;
  isLive: boolean;
};

function BoardSurface({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  addEvidenceNode,
  setNodeLock,
  isLive,
}: BoardSurfaceProps) {
  const { screenToFlowPosition } = useReactFlow();
  const { agentId } = useCollaborationIdentity();

  const renderedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const lockedBy =
          typeof node.data.lockedBy === "string" ? node.data.lockedBy : null;

        return {
          ...node,
          draggable: lockedBy === null || lockedBy === agentId,
        };
      }),
    [agentId, nodes],
  );

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const nodeType = event.dataTransfer.getData(dragTransferType);
    if (nodeType !== "stickyNote" && nodeType !== "polaroid") return;

    addEvidenceNode(
      nodeType,
      screenToFlowPosition({ x: event.clientX, y: event.clientY }),
    );
  }

  function handleNodeDragStart(_event: unknown, node: Node) {
    const lockedBy =
      typeof node.data.lockedBy === "string" ? node.data.lockedBy : null;

    if (lockedBy === null || lockedBy === agentId) {
      setNodeLock(node.id, agentId);
    }
  }

  function handleNodeDragStop(_event: unknown, node: Node) {
    setNodeLock(node.id, null);
  }

  return (
    <div className="relative h-full w-full bg-[var(--paper)]">
      <EvidenceBox />
      <ReactFlow
        nodes={renderedNodes}
        edges={edges}
        nodeTypes={isLive ? liveNodeTypes : localNodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        fitView
        className="bg-[var(--paper)]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="var(--dim)"
          gap={24}
          size={1}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function LiveBoardCanvas() {
  const storedNodes = useStorage((root) => root.nodes);
  const storedEdges = useStorage((root) => root.edges);
  const nodes = useMemo(() => deserializeFlowNodes(storedNodes), [storedNodes]);
  const edges = useMemo(() => deserializeFlowEdges(storedEdges), [storedEdges]);

  const onNodesChange = useMutation(({ storage }, changes: NodeChange[]) => {
    const liveNodes = storage.get("nodes");
    const currentNodes = deserializeFlowNodes(liveNodes.toJSON());
    const nextNodes = applyNodeChanges(changes, currentNodes);

    liveNodes.clear();
    nextNodes.forEach((node) => liveNodes.push(serializeFlowNode(node)));
  }, []);

  const onEdgesChange = useMutation(({ storage }, changes: EdgeChange[]) => {
    const liveEdges = storage.get("edges");
    const currentEdges = deserializeFlowEdges(liveEdges.toJSON());
    const nextEdges = applyEdgeChanges(changes, currentEdges);

    liveEdges.clear();
    nextEdges.forEach((edge) => liveEdges.push(serializeFlowEdge(edge)));
  }, []);

  const addEvidenceNode = useMutation(
    ({ storage }, nodeType: EvidenceNodeType, position: XYPosition) => {
      const node: Node = {
        id: `${nodeType}-${crypto.randomUUID()}`,
        type: nodeType,
        position,
        data:
          nodeType === "stickyNote"
            ? { text: "" }
            : { caption: "SUSPECT POLAROID" },
      };

      storage.get("nodes").push(serializeFlowNode(node));
    },
    [],
  );

  const setNodeLock = useMutation(
    ({ storage }, nodeId: string, lockedBy: string | null) => {
      const liveNodes = storage.get("nodes");
      const nodeIndex = liveNodes.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) return;

      const node = liveNodes.get(nodeIndex);
      if (!node) return;

      liveNodes.set(nodeIndex, {
        ...node,
        data: {
          ...node.data,
          lockedBy,
        },
      });
    },
    [],
  );

  return (
    <BoardSurface
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      addEvidenceNode={addEvidenceNode}
      setNodeLock={setNodeLock}
      isLive
    />
  );
}

function LocalBoardCanvas() {
  const nodes = useInvestigationStore((state) => state.nodes);
  const edges = useInvestigationStore((state) => state.edges);
  const onNodesChange = useInvestigationStore((state) => state.onNodesChange);
  const onEdgesChange = useInvestigationStore((state) => state.onEdgesChange);
  const addEvidenceNode = useInvestigationStore(
    (state) => state.addEvidenceNode,
  );
  const lockNode = useInvestigationStore((state) => state.lockNode);
  const unlockNode = useInvestigationStore((state) => state.unlockNode);

  return (
    <BoardSurface
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      addEvidenceNode={addEvidenceNode}
      setNodeLock={(nodeId, lockedBy) => {
        if (lockedBy) lockNode(nodeId, lockedBy);
        else unlockNode(nodeId, "AGENT-01");
      }}
      isLive={false}
    />
  );
}

function BoardStorageFallback() {
  return (
    <div className="grid h-full w-full place-items-center bg-[var(--paper)] p-6 font-mono text-sm font-black uppercase tracking-[0.14em] text-[var(--dim)]">
      [ DECRYPTING LEDGER... ]
    </div>
  );
}

export function Board() {
  const { isMultiplayer } = useCollaborationIdentity();

  return (
    <ReactFlowProvider>
      {isMultiplayer ? (
        <ClientSideSuspense fallback={<BoardStorageFallback />}>
          <LiveBoardCanvas />
        </ClientSideSuspense>
      ) : (
        <LocalBoardCanvas />
      )}
    </ReactFlowProvider>
  );
}

"use client";

import { type DragEvent, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Node,
  useReactFlow,
} from "@xyflow/react";
import { useCollaborationIdentity } from "@/components/collaboration-context";
import { RedStringEdge } from "@/components/flow-edges";
import { PolaroidNode, StickyNoteNode } from "@/components/flow-nodes";
import { triggerHaptic } from "@/lib/haptics";
import {
  type EvidenceNodeType,
  useInvestigationStore,
} from "@/store/use-investigation-store";

const dragTransferType = "application/reactflow";

const nodeTypes = {
  stickyNote: StickyNoteNode,
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

function BoardCanvas() {
  const nodes = useInvestigationStore((state) => state.nodes);
  const edges = useInvestigationStore((state) => state.edges);
  const onNodesChange = useInvestigationStore((state) => state.onNodesChange);
  const onEdgesChange = useInvestigationStore((state) => state.onEdgesChange);
  const lockNode = useInvestigationStore((state) => state.lockNode);
  const unlockNode = useInvestigationStore((state) => state.unlockNode);
  const addEvidenceNode = useInvestigationStore(
    (state) => state.addEvidenceNode,
  );
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

    if (nodeType !== "stickyNote" && nodeType !== "polaroid") {
      return;
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    addEvidenceNode(nodeType, position);
  }

  function handleNodeDragStart(_event: unknown, node: Node) {
    const lockedBy =
      typeof node.data.lockedBy === "string" ? node.data.lockedBy : null;

    if (lockedBy === null || lockedBy === agentId) {
      lockNode(node.id, agentId);
    }
  }

  function handleNodeDragStop(_event: unknown, node: Node) {
    unlockNode(node.id, agentId);
  }

  return (
    <div className="relative h-full w-full bg-[var(--paper)]">
      <EvidenceBox />
      <ReactFlow
        nodes={renderedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
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

export function Board() {
  return (
    <ReactFlowProvider>
      <BoardCanvas />
    </ReactFlowProvider>
  );
}

import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react'
import { create } from 'zustand'

export type EvidenceNodeType = 'stickyNote' | 'polaroid'

type InvestigationState = {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  addEvidenceNode: (nodeType: EvidenceNodeType, position: XYPosition) => void
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void
}

export const useInvestigationStore = create<InvestigationState>((set, get) => ({
  nodes: [
    {
      id: 'note-victim', type: 'stickyNote', position: { x: 120, y: 120 },
      data: { text: 'Victim last seen at Platform 9. Station clock reads 21:14.' },
    },
    {
      id: 'photo-ticket', type: 'polaroid', position: { x: 480, y: 70 },
      data: { caption: 'TORN TICKET' },
    },
    {
      id: 'note-witness', type: 'stickyNote', position: { x: 420, y: 280 },
      data: { text: 'Night clerk reports a second visitor after closing.' },
    },
  ],
  edges: [
    { id: 'note-victim-photo-ticket', source: 'note-victim', target: 'photo-ticket', type: 'redString' },
    { id: 'note-victim-note-witness', source: 'note-victim', target: 'note-witness', type: 'redString' },
  ],
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  addEvidenceNode: (nodeType, position) => {
    const id = `${nodeType}-${crypto.randomUUID()}`
    set({
      nodes: [...get().nodes, {
        id,
        type: nodeType,
        position,
        data: nodeType === 'stickyNote' ? { text: '' } : { caption: 'SUSPECT POLAROID' },
      }],
    })
  },
  updateNodeData: (nodeId, data) => set({
    nodes: get().nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node),
  }),
}))

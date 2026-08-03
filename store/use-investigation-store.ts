import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";

export type EvidenceNodeType = "stickyNote" | "polaroid";
export type ActiveWorkspace = "canvas" | "map" | "network" | "timeline";
export type TimeRange = [string, string];
export type SpatialBounds = {
  north: number;
  east: number;
  south: number;
  west: number;
};

export type InvestigationFact = {
  id: string;
  type: "forensic" | "testimonial";
  text: string;
  status: "verified" | "disputed" | "pending";
};

/* ─── Deck.gl data types ──────────────────────── */

export type IncidentPoint = {
  coordinates: [number, number];
  weight: number;
  date: string;
};

export type MovementArc = {
  from: { coordinates: [number, number] };
  to: { coordinates: [number, number] };
  inbound: number;
  outbound: number;
  date: string;
  label: string;
};

/* ─── Mock data generators ────────────────────── */

// Gaussian-ish clustering using Box-Muller
function gaussianRandom(mean: number, stddev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + stddev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// 6 crime hotspot centers around Chicago
const hotspotCenters: [number, number][] = [
  [-87.6298, 41.8818], // Loop
  [-87.6465, 41.8786], // West Loop
  [-87.6142, 41.8757], // South Loop
  [-87.6338, 41.8905], // River North
  [-87.6209, 41.8895], // Streeterville
  [-87.6501, 41.882],  // Fulton Market
];

const incidentDates = [
  "2026-07-18", "2026-07-19", "2026-07-20", "2026-07-21",
  "2026-07-22", "2026-07-23", "2026-07-24", "2026-07-25",
  "2026-07-26", "2026-07-27", "2026-07-28",
];

function generateIncidentData(): IncidentPoint[] {
  const points: IncidentPoint[] = [];
  for (let i = 0; i < 1000; i++) {
    const center = hotspotCenters[Math.floor(Math.random() * hotspotCenters.length)];
    const lng = gaussianRandom(center[0], 0.008);
    const lat = gaussianRandom(center[1], 0.005);
    const weight = Math.floor(Math.random() * 9) + 1;
    const date = incidentDates[Math.floor(Math.random() * incidentDates.length)];
    points.push({ coordinates: [lng, lat], weight, date });
  }
  return points;
}

function generateMovementData(): MovementArc[] {
  return [
    { from: { coordinates: [-87.6285, 41.884] }, to: { coordinates: [-87.6465, 41.8786] }, inbound: 120, outbound: 0, date: "2026-07-18", label: "ADA → WEST LOOP" },
    { from: { coordinates: [-87.632, 41.879] }, to: { coordinates: [-87.6142, 41.8757] }, inbound: 0, outbound: 85, date: "2026-07-18", label: "MARLOWE → SOUTH LOOP" },
    { from: { coordinates: [-87.6231, 41.8822] }, to: { coordinates: [-87.6338, 41.8905] }, inbound: 45, outbound: 200, date: "2026-07-19", label: "VALE → RIVER NORTH" },
    { from: { coordinates: [-87.6198, 41.8894] }, to: { coordinates: [-87.6501, 41.882] }, inbound: 300, outbound: 0, date: "2026-07-20", label: "SHELL TRANSFER #1" },
    { from: { coordinates: [-87.6285, 41.884] }, to: { coordinates: [-87.6142, 41.8757] }, inbound: 0, outbound: 150, date: "2026-07-20", label: "ADA → EVIDENCE ROOM" },
    { from: { coordinates: [-87.641, 41.8866] }, to: { coordinates: [-87.6209, 41.8895] }, inbound: 70, outbound: 30, date: "2026-07-21", label: "PLATFORM 9 → ANNEX" },
    { from: { coordinates: [-87.6367, 41.8921] }, to: { coordinates: [-87.6465, 41.8786] }, inbound: 220, outbound: 0, date: "2026-07-22", label: "DEPOSIT FORGERY ROUTE" },
    { from: { coordinates: [-87.61, 41.8695] }, to: { coordinates: [-87.6338, 41.8905] }, inbound: 0, outbound: 400, date: "2026-07-22", label: "ARSON SITE → DINER" },
    { from: { coordinates: [-87.6465, 41.8786] }, to: { coordinates: [-87.6391, 41.8738] }, inbound: 90, outbound: 60, date: "2026-07-23", label: "FORCED ENTRY LINK" },
    { from: { coordinates: [-87.6391, 41.8738] }, to: { coordinates: [-87.6287, 41.875] }, inbound: 0, outbound: 175, date: "2026-07-24", label: "CANAL → TRANSIT HALL" },
    { from: { coordinates: [-87.6287, 41.875] }, to: { coordinates: [-87.6209, 41.8795] }, inbound: 250, outbound: 0, date: "2026-07-24", label: "TRANSIT HALL TRANSFER" },
    { from: { coordinates: [-87.6209, 41.8795] }, to: { coordinates: [-87.6173, 41.8838] }, inbound: 0, outbound: 130, date: "2026-07-25", label: "COUNTERFEIT LINK" },
    { from: { coordinates: [-87.6173, 41.8838] }, to: { coordinates: [-87.6501, 41.882] }, inbound: 180, outbound: 0, date: "2026-07-25", label: "ARCHIVE → MARKET" },
    { from: { coordinates: [-87.6501, 41.882] }, to: { coordinates: [-87.6338, 41.8905] }, inbound: 0, outbound: 350, date: "2026-07-26", label: "ACCELERANT PURCHASE" },
    { from: { coordinates: [-87.6338, 41.8905] }, to: { coordinates: [-87.6117, 41.8724] }, inbound: 100, outbound: 50, date: "2026-07-26", label: "MARKET ROW THREAT" },
    { from: { coordinates: [-87.6117, 41.8724] }, to: { coordinates: [-87.6261, 41.8912] }, inbound: 0, outbound: 80, date: "2026-07-27", label: "BACK-LOT → TOOL ROOM" },
    { from: { coordinates: [-87.6261, 41.8912] }, to: { coordinates: [-87.6429, 41.8847] }, inbound: 500, outbound: 0, date: "2026-07-27", label: "TOOL TAMPER CASH DROP" },
    { from: { coordinates: [-87.6429, 41.8847] }, to: { coordinates: [-87.6285, 41.884] }, inbound: 0, outbound: 275, date: "2026-07-28", label: "FINAL LEDGER ROUTE" },
  ];
}

// Generate once at module load — stable across re-renders
const INCIDENT_DATA = generateIncidentData();
const MOVEMENT_DATA = generateMovementData();

/* ─── Store ───────────────────────────────────── */

type InvestigationState = {
  activeWorkspace: ActiveWorkspace;
  timeRange: TimeRange;
  playbackDate: string;
  isMapPlaying: boolean;
  selectedSuspectId: string | null;
  selectedCrimeTypes: string[];
  spatialBounds: SpatialBounds | null;
  nodes: Node[];
  edges: Edge[];
  incidentData: IncidentPoint[];
  movementData: MovementArc[];
  setActiveWorkspace: (workspace: ActiveWorkspace) => void;
  setTimeRange: (timeRange: TimeRange) => void;
  setPlaybackDate: (date: string) => void;
  setIsMapPlaying: (isPlaying: boolean) => void;
  setSelectedSuspectId: (suspectId: string | null) => void;
  toggleSelectedCrimeType: (crimeType: string) => void;
  setSelectedCrimeTypeEnabled: (crimeType: string, isEnabled: boolean) => void;
  setSpatialBounds: (bounds: SpatialBounds | null) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addEvidenceNode: (nodeType: EvidenceNodeType, position: XYPosition) => void;
  pinFactToBoard: (text: string) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  facts: InvestigationFact[];
  isLedgerOpen: boolean;
  toggleLedger: () => void;
  openLedger: () => void;
  clearAllFilters: () => void;
};

export const useInvestigationStore = create<InvestigationState>((set, get) => ({
  activeWorkspace: "map",
  timeRange: ["2026-07-18", "2026-07-28"],
  playbackDate: "2026-07-28",
  isMapPlaying: false,
  selectedSuspectId: null,
  selectedCrimeTypes: ["Burglary", "Assault", "Fraud", "Robbery", "Arson"],
  spatialBounds: null,
  incidentData: INCIDENT_DATA,
  movementData: MOVEMENT_DATA,
  nodes: [
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
  ],
  edges: [
    {
      id: "note-victim-photo-ticket",
      source: "note-victim",
      target: "photo-ticket",
      type: "redString",
    },
    {
      id: "note-victim-note-witness",
      source: "note-victim",
      target: "note-witness",
      type: "redString",
    },
  ],
  setActiveWorkspace: (workspace) => {
    set({ activeWorkspace: workspace });
  },
  setTimeRange: (timeRange) => {
    set({ timeRange });
  },
  setPlaybackDate: (date) => {
    set({ playbackDate: date });
  },
  setIsMapPlaying: (isPlaying) => {
    set({ isMapPlaying: isPlaying });
  },
  setSelectedSuspectId: (suspectId) => {
    set({ selectedSuspectId: suspectId });
  },
  toggleSelectedCrimeType: (crimeType) => {
    const selectedCrimeTypes = get().selectedCrimeTypes;
    const nextTypes = selectedCrimeTypes.includes(crimeType)
      ? selectedCrimeTypes.filter((type) => type !== crimeType)
      : [...selectedCrimeTypes, crimeType];

    set({
      selectedCrimeTypes: nextTypes,
    });
  },
  setSelectedCrimeTypeEnabled: (crimeType, isEnabled) => {
    const selectedCrimeTypes = get().selectedCrimeTypes;

    if (isEnabled) {
      set({
        selectedCrimeTypes: selectedCrimeTypes.includes(crimeType)
          ? selectedCrimeTypes
          : [...selectedCrimeTypes, crimeType],
      });
      return;
    }

    set({
      selectedCrimeTypes: selectedCrimeTypes.filter((type) => type !== crimeType),
    });
  },
  setSpatialBounds: (bounds) => {
    set({ spatialBounds: bounds });
  },
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  addEvidenceNode: (nodeType, position) => {
    const id = `${nodeType}-${crypto.randomUUID()}`;
    const data =
      nodeType === "stickyNote"
        ? { text: "" }
        : { caption: "SUSPECT POLAROID" };

    set({
      nodes: [
        ...get().nodes,
        {
          id,
          type: nodeType,
          position,
          data,
        },
      ],
    });
  },
  pinFactToBoard: (text) => {
    const randomOffset = () => Math.round(Math.random() * 180 - 90);
    const centerX =
      typeof window === "undefined" ? 420 : Math.round(window.innerWidth / 2);
    const centerY =
      typeof window === "undefined" ? 280 : Math.round(window.innerHeight / 2);

    set({
      nodes: [
        ...get().nodes,
        {
          id: `stickyNote-${crypto.randomUUID()}`,
          type: "stickyNote",
          position: {
            x: centerX + randomOffset(),
            y: centerY + randomOffset(),
          },
          data: {
            text,
          },
        },
      ],
    });
  },
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
          : node,
      ),
    });
  },
  facts: [
    {
      id: "fact-001",
      type: "forensic",
      text: "The victim entered the station at 21:14 and never appeared on the northbound camera.",
      status: "verified",
    },
    {
      id: "fact-002",
      type: "forensic",
      text: "A torn ticket stub was recovered from the inner coat pocket.",
      status: "pending",
    },
    {
      id: "fact-003",
      type: "testimonial",
      text: "The night clerk claims a second visitor arrived fifteen minutes after closing.",
      status: "disputed",
    },
    {
      id: "fact-004",
      type: "testimonial",
      text: "The ledger clock differs from station time by seven minutes.",
      status: "pending",
    },
  ],
  isLedgerOpen: true,
  toggleLedger: () => set((state) => ({ isLedgerOpen: !state.isLedgerOpen })),
  openLedger: () => set({ isLedgerOpen: true }),
  clearAllFilters: () =>
    set({
      timeRange: ["2026-07-18", "2026-07-28"],
      playbackDate: "2026-07-28",
      selectedSuspectId: null,
      selectedCrimeTypes: ["Burglary", "Assault", "Fraud", "Robbery", "Arson"],
      spatialBounds: null,
      isMapPlaying: false,
    }),
}));

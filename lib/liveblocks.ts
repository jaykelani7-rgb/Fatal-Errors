import { createClient, type LiveList } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { ForceMapPanEvent } from "@/liveblocks.config";
import type {
  StoredFlowEdge,
  StoredFlowNode,
} from "@/lib/evidence-board-types";

export const LIVEBLOCKS_ROOM_ID =
  process.env.NEXT_PUBLIC_LIVEBLOCKS_ROOM_ID ?? "case-tb-001041";

export function formatCaseName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-");
}

export type CollaborationPresence = {
  x: number | null;
  y: number | null;
  agentId: string;
};

type CollaborationUserMeta = {
  id: string;
  info: {
    name?: string;
  };
};

type CollaborationStorage = {
  nodes: LiveList<StoredFlowNode>;
  edges: LiveList<StoredFlowEdge>;
};

const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

export const isLiveblocksConfigured = Boolean(publicApiKey);

// The inert development key keeps local builds functional. The runtime only
// enters a room when a real NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is configured.
export const liveblocksClient = createClient({
  publicApiKey: publicApiKey ?? "pk_dev_missing",
});

const roomContext = createRoomContext<
  CollaborationPresence,
  CollaborationStorage,
  CollaborationUserMeta,
  ForceMapPanEvent
>(liveblocksClient);

export const {
  RoomProvider,
  useBroadcastEvent,
  useEventListener,
  useMutation,
  useOthers,
  useStatus,
  useUpdateMyPresence,
} = roomContext;

export const useStorage = roomContext.suspense.useStorage;

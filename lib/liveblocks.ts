import { createClient, type LiveList } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { ForceMapPanEvent } from "@/liveblocks.config";
import type {
  StoredFlowEdge,
  StoredFlowNode,
} from "@/lib/evidence-board-types";

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

// Liveblocks public keys are embedded in the browser bundle by design. Keep the
// environment variable as an override, while providing the project's public key
// as a deployment-safe fallback for hosts that do not copy `.env.local`.
const defaultPublicApiKey =
  "pk_dev_Tpjzr1_Gzo4_apRD2ip80XJC5uOe_KcW7V0nfUDXIz__w5UYXawRsQWtKMNpUp2C";

const publicApiKey =
  process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY?.trim() || defaultPublicApiKey;

export const isLiveblocksConfigured = Boolean(publicApiKey);

export const liveblocksClient = createClient({
  publicApiKey,
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

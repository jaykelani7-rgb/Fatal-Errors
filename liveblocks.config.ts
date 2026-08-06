export type ForceMapPanEvent = {
  type: "FORCE_MAP_PAN";
  coordinates: [number, number];
  targetId: string;
};

declare global {
  interface Liveblocks {
    Presence: {
      x: number | null;
      y: number | null;
      agentId: string;
    };
    Storage: Record<string, never>;
    UserMeta: {
      id: string;
      info: {
        name?: string;
      };
    };
    RoomEvent: ForceMapPanEvent;
  }
}

export {};

"use client";

import { Maximize2, Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import Map, { Marker } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

if (typeof window !== "undefined") {
  // Official MapLibre v6 API to bypass Webpack ESM worker bundling
  setWorkerUrl("/maplibre-gl-worker.js");
}
import {
  type SpatialBounds,
  type IncidentPoint,
  type MovementArc,
  useInvestigationStore,
} from "@/store/use-investigation-store";

/* ─── Deck.gl imports ─────────────────────────── */

import { DeckGL } from "@deck.gl/react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { ArcLayer } from "@deck.gl/layers";
import { AmbientLight, DirectionalLight, LightingEffect } from "@deck.gl/core";

type ActiveLayerType = "PINS" | "HEAT" | "DENSITY" | "ROUTES";

/* ─── Types ───────────────────────────────────── */

type CrimeType = "Burglary" | "Assault" | "Fraud" | "Robbery" | "Arson";
type IncidentSeverity = "LOW" | "MED" | "HIGH" | "CRITICAL";

type Incident = {
  id: string;
  type: CrimeType;
  title: string;
  date: string;
  severity: IncidentSeverity;
  coordinates: [number, number];
  intensity: number;
};

const crimeTypes: CrimeType[] = [
  "Burglary",
  "Assault",
  "Fraud",
  "Robbery",
  "Arson",
];

// Original incidents kept for the filter panel count
const incidents: Incident[] = [
  { id: "INC-001", type: "Burglary", title: "Station Locker Breach", date: "2026-07-18", severity: "HIGH", coordinates: [-87.6285, 41.884], intensity: 8 },
  { id: "INC-002", type: "Assault", title: "Alley Witness Report", date: "2026-07-18", severity: "MED", coordinates: [-87.632, 41.879], intensity: 5 },
  { id: "INC-003", type: "Fraud", title: "Ticket Ledger Mismatch", date: "2026-07-19", severity: "LOW", coordinates: [-87.6231, 41.8822], intensity: 3 },
  { id: "INC-004", type: "Robbery", title: "North Arcade Holdup", date: "2026-07-20", severity: "HIGH", coordinates: [-87.6198, 41.8894], intensity: 7 },
  { id: "INC-005", type: "Burglary", title: "Evidence Room Entry", date: "2026-07-20", severity: "CRITICAL", coordinates: [-87.6142, 41.8757], intensity: 10 },
  { id: "INC-006", type: "Assault", title: "Platform Stairwell Fight", date: "2026-07-21", severity: "HIGH", coordinates: [-87.641, 41.8866], intensity: 8 },
  { id: "INC-007", type: "Fraud", title: "Annex Deposit Forgery", date: "2026-07-22", severity: "MED", coordinates: [-87.6367, 41.8921], intensity: 4 },
  { id: "INC-008", type: "Arson", title: "Loading Dock Fire", date: "2026-07-22", severity: "HIGH", coordinates: [-87.61, 41.8695], intensity: 9 },
  { id: "INC-009", type: "Burglary", title: "Clerk Office Forced Entry", date: "2026-07-23", severity: "MED", coordinates: [-87.6465, 41.8786], intensity: 6 },
  { id: "INC-010", type: "Robbery", title: "Canal Street Bag Snatch", date: "2026-07-24", severity: "MED", coordinates: [-87.6391, 41.8738], intensity: 5 },
  { id: "INC-011", type: "Assault", title: "Transit Hall Battery", date: "2026-07-24", severity: "CRITICAL", coordinates: [-87.6287, 41.875], intensity: 9 },
  { id: "INC-012", type: "Fraud", title: "Counterfeit Transfer Book", date: "2026-07-25", severity: "LOW", coordinates: [-87.6209, 41.8795], intensity: 3 },
  { id: "INC-013", type: "Burglary", title: "Archive Cage Breach", date: "2026-07-25", severity: "HIGH", coordinates: [-87.6173, 41.8838], intensity: 8 },
  { id: "INC-014", type: "Arson", title: "Viaduct Accelerant Trace", date: "2026-07-26", severity: "MED", coordinates: [-87.6501, 41.882], intensity: 6 },
  { id: "INC-015", type: "Robbery", title: "Market Row Threat", date: "2026-07-26", severity: "HIGH", coordinates: [-87.6338, 41.8905], intensity: 7 },
  { id: "INC-016", type: "Assault", title: "Back-Lot Confrontation", date: "2026-07-27", severity: "MED", coordinates: [-87.6117, 41.8724], intensity: 5 },
  { id: "INC-017", type: "Burglary", title: "Tool Room Tamper", date: "2026-07-27", severity: "LOW", coordinates: [-87.6261, 41.8912], intensity: 4 },
  { id: "INC-018", type: "Fraud", title: "Signal Ledger Substitution", date: "2026-07-28", severity: "HIGH", coordinates: [-87.6429, 41.8847], intensity: 7 },
];

/* ─── SUSPECT → INCIDENT LINKS ─────────────────────────── */

const suspectIncidentLinks: Record<string, string[]> = {
  "sus-ada": ["INC-001", "INC-005", "INC-008", "INC-013"],
  "sus-marlowe": ["INC-002", "INC-006", "INC-009", "INC-016"],
  "sus-vale": ["INC-003", "INC-007", "INC-010", "INC-012", "INC-018"],
};

const playbackDates = Array.from(
  new Set(incidents.map((incident) => incident.date)),
).sort();

/* ─── Deck.gl constants ───────────────────────── */

const HEXAGON_COLOR_RANGE: [number, number, number][] = [
  [1, 22, 30],       // #01161E — deepest (base void)
  [18, 69, 89],      // #124559
  [49, 100, 118],    // interpolated
  [89, 131, 146],    // #598392
  [140, 165, 160],   // interpolated
  [174, 195, 176],   // #AEC3B0 — peak (phosphor sage)
];

const HIGHLIGHT_COLOR: [number, number, number, number] = [239, 246, 224, 255]; // #EFF6E0

// Lighting for 3D hexagon shadows
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
});

const directionalLight = new DirectionalLight({
  color: [255, 255, 255],
  intensity: 1.5,
  direction: [-3, -9, -1],
});

const lightingEffect = new LightingEffect({
  ambientLight,
  directionalLight,
});

/* ─── Map style configs ───────────────────────── */

const LIGHT_MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/* ─── Helpers ─────────────────────────────────── */

function isWithinBounds(coords: [number, number], bounds: SpatialBounds | null) {
  if (!bounds) return true;
  const [longitude, latitude] = coords;
  return (
    latitude <= bounds.north &&
    latitude >= bounds.south &&
    longitude <= bounds.east &&
    longitude >= bounds.west
  );
}

function TacticalMarker({ color }: { color: string }) {
  return (
    <div
      className="h-4 w-4 border border-[#EFF6E0] shadow-[0_0_10px_rgba(239,246,224,0.3)]"
      style={{
        backgroundColor: color,
        transform: "rotate(45deg)",
      }}
    />
  );
}

/* ─── Tooltip renderer ────────────────────────── */

function getTooltip({ object, layer }: { object?: unknown; layer?: { id?: string } }) {
  if (!object) return null;

  if (layer?.id === "hexagon-layer") {
    const hex = object as { points?: unknown[]; elevationValue?: number };
    const count = hex.points?.length ?? hex.elevationValue ?? 0;
    return {
      html: `
        <div style="
          background: rgba(18,69,89,0.92);
          backdrop-filter: blur(12px);
          border: 1px solid #598392;
          border-radius: 0;
          padding: 10px 14px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          font-weight: 900;
          color: #EFF6E0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          box-shadow: 0 4px 20px rgba(1,22,30,0.6);
        ">
          <div style="color: #598392; font-size: 9px; margin-bottom: 4px;">CRIME DENSITY ANALYSIS</div>
          <div style="font-size: 16px; color: #AEC3B0;">${count} INCIDENTS</div>
          <div style="color: #598392; font-size: 9px; margin-top: 4px;">HEX BIN AGGREGATE</div>
        </div>
      `,
      style: {
        backgroundColor: "transparent",
        border: "none",
        padding: "0",
      },
    };
  }

  if (layer?.id === "arc-layer") {
    const arc = object as MovementArc;
    return {
      html: `
        <div style="
          background: rgba(18,69,89,0.92);
          backdrop-filter: blur(12px);
          border: 1px solid #598392;
          border-radius: 0;
          padding: 10px 14px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          font-weight: 900;
          color: #EFF6E0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          box-shadow: 0 4px 20px rgba(1,22,30,0.6);
        ">
          <div style="color: #598392; font-size: 9px; margin-bottom: 4px;">MOVEMENT TRACE</div>
          <div style="color: #AEC3B0; margin-bottom: 4px;">${arc.label}</div>
          <div>IN: ${arc.inbound} / OUT: ${arc.outbound}</div>
          <div style="color: #598392; font-size: 9px; margin-top: 4px;">${arc.date}</div>
        </div>
      `,
      style: {
        backgroundColor: "transparent",
        border: "none",
        padding: "0",
      },
    };
  }

  return null;
}

/* ─── Component ───────────────────────────────── */

export function GeospatialMapWorkspace() {
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const [activeLayer, setActiveLayer] = useState<ActiveLayerType>("PINS");

  const [isMapReady, setIsMapReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const selectedCrimeTypes = useInvestigationStore((s) => s.selectedCrimeTypes);
  const setSelectedCrimeTypeEnabled = useInvestigationStore((s) => s.setSelectedCrimeTypeEnabled);
  const spatialBounds = useInvestigationStore((s) => s.spatialBounds);
  const setSpatialBounds = useInvestigationStore((s) => s.setSpatialBounds);
  const playbackDate = useInvestigationStore((s) => s.playbackDate);
  const setPlaybackDate = useInvestigationStore((s) => s.setPlaybackDate);
  const isMapPlaying = useInvestigationStore((s) => s.isMapPlaying);
  const setIsMapPlaying = useInvestigationStore((s) => s.setIsMapPlaying);
  const timeRange = useInvestigationStore((s) => s.timeRange);
  const incidentData = useInvestigationStore((s) => s.incidentData);
  const movementData = useInvestigationStore((s) => s.movementData);

  const playbackIndex = Math.max(0, playbackDates.indexOf(playbackDate));

  /* ── Deck.gl view state ────────────────────── */

  const [viewState, setViewState] = useState({
    longitude: -87.6298,
    latitude: 41.8818,
    zoom: 12.7,
    pitch: 60,
    bearing: -20,
  });

  /* ── Memoized filtered data for Deck.gl ──── */

  const filteredIncidents = useMemo(
    () =>
      incidentData.filter(
        (d) =>
          d.date <= playbackDate &&
          d.date >= timeRange[0] &&
          d.date <= timeRange[1] &&
          isWithinBounds(d.coordinates, spatialBounds),
      ),
    [incidentData, playbackDate, timeRange, spatialBounds],
  );

  const filteredMovements = useMemo(
    () =>
      movementData.filter(
        (d) =>
          d.date <= playbackDate &&
          d.date >= timeRange[0] &&
          d.date <= timeRange[1],
      ),
    [movementData, playbackDate, timeRange],
  );

  // Original incidents for filter counts
  const visibleIncidents = useMemo(
    () =>
      incidents.filter(
        (incident) =>
          selectedCrimeTypes.includes(incident.type) &&
          incident.date <= playbackDate &&
          incident.date >= timeRange[0] &&
          incident.date <= timeRange[1] &&
          isWithinBounds(incident.coordinates, spatialBounds),
      ),
    [playbackDate, selectedCrimeTypes, spatialBounds, timeRange],
  );

  const filterCounts = useMemo(
    () =>
      crimeTypes.reduce<Record<CrimeType, number>>((counts, crimeType) => {
        counts[crimeType] = incidents.filter(
          (incident) =>
            incident.type === crimeType &&
            incident.date <= playbackDate &&
            incident.date >= timeRange[0] &&
            incident.date <= timeRange[1] &&
            isWithinBounds(incident.coordinates, spatialBounds),
        ).length;
        return counts;
      }, {} as Record<CrimeType, number>),
    [playbackDate, spatialBounds, timeRange],
  );

  /* ── Deck.gl layers ────────────────────────── */

  const layers = useMemo(() => {
    const result = [];
    if (activeLayer === "DENSITY") {
      result.push(
        new HexagonLayer<IncidentPoint>({
          id: "hexagon-layer",
          data: filteredIncidents,
          getPosition: (d: IncidentPoint) => d.coordinates,
          getElevationWeight: (d: IncidentPoint) => d.weight,
          elevationScale: 50,
          elevationRange: [0, 3000],
          extruded: true,
          radius: 200,
          colorRange: HEXAGON_COLOR_RANGE,
          pickable: true,
          autoHighlight: true,
          highlightColor: HIGHLIGHT_COLOR,
          coverage: 0.88,
          upperPercentile: 95,
          material: {
            ambient: 0.5,
            diffuse: 0.6,
            shininess: 20,
            specularColor: [89, 131, 146],
          },
        })
      );
    }
    if (activeLayer === "ROUTES") {
      result.push(
        new ArcLayer<MovementArc>({
          id: "arc-layer",
          data: filteredMovements,
          getSourcePosition: (d: MovementArc) => d.from.coordinates,
          getTargetPosition: (d: MovementArc) => d.to.coordinates,
          getSourceColor: [174, 195, 176, 255], // #AEC3B0 phosphor sage
          getTargetColor: [89, 131, 146, 200], // #598392 muted steel
          getWidth: 2.5,
          pickable: true,
          autoHighlight: true,
          highlightColor: HIGHLIGHT_COLOR,
          greatCircle: false,
        })
      );
    }
    return result;
  }, [filteredIncidents, filteredMovements, activeLayer]);

  /* ── Playback timer ────────────────────────── */

  useEffect(() => {
    if (!isMapPlaying) return;
    const timer = window.setInterval(() => {
      const nextIndex = playbackIndex + 1;
      if (nextIndex >= playbackDates.length) {
        setIsMapPlaying(false);
        return;
      }
      setPlaybackDate(playbackDates[nextIndex]);
    }, 850);
    return () => window.clearInterval(timer);
  }, [isMapPlaying, playbackIndex, setIsMapPlaying, setPlaybackDate]);

  const togglePlayback = () => {
    if (isMapPlaying) {
      setIsMapPlaying(false);
      return;
    }
    if (playbackIndex >= playbackDates.length - 1) {
      setPlaybackDate(playbackDates[0]);
    }
    setIsMapPlaying(true);
  };

  /* ── Sync Deck.gl viewState to Mapbox ──────── */

  const onViewStateChange = useCallback(({ viewState: newViewState }: any) => {
    setViewState(newViewState);
  }, []);

  /* ── Render ─────────────────────────────────── */

  // Prevent WebGL crash by waiting for theme resolution
  if (!mounted || !resolvedTheme) {
    return <div className="relative w-full h-full min-h-[640px] bg-[#F4F4F0] dark:bg-[#01161E]" />;
  }

  const MARKER_COLORS = ["#124559", "#598392", "#AEC3B0", "#EFF6E0"];
  const getMarkerColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return MARKER_COLORS[hash % MARKER_COLORS.length];
  };

  const mapDimensions = { width: "100%", height: "100%" };
  const currentMapStyle = isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

  // Fallback coordinates (center of US) in case viewState is undefined
  const fallbackViewState = {
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3,
    pitch: 45
  };

  return (
    <div
      className={`relative w-full h-[800px] min-h-[800px] rounded-xl overflow-hidden bg-gray-900 ${
        isFullscreenMap ? "fixed inset-0 z-50 min-h-screen" : ""
      }`}
    >
      <DeckGL
        initialViewState={fallbackViewState}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        controller={true}
        layers={layers}
        effects={[lightingEffect]}
        getTooltip={getTooltip as any}
        style={mapDimensions}
      >
        <Map
          style={mapDimensions}
          mapStyle={currentMapStyle}
          reuseMaps={true}
          attributionControl={false}
        >
          {activeLayer === "PINS" &&
            visibleIncidents.map((incident) => (
              <Marker
                key={incident.id}
                longitude={incident.coordinates[0]}
                latitude={incident.coordinates[1]}
                anchor="center"
              >
                <TacticalMarker color={getMarkerColor(incident.id)} />
              </Marker>
            ))}
        </Map>
      </DeckGL>

      {/* Tactical Layer Toggle UI */}
      <div className="absolute right-4 top-4 z-20 flex border border-[#598392] font-mono text-xs font-black uppercase tracking-wide shadow-[4px_4px_0_rgba(1,22,30,0.8)]">
        {(["PINS", "HEAT", "DENSITY", "ROUTES"] as ActiveLayerType[]).map((layer) => (
          <button
            key={layer}
            onClick={() => setActiveLayer(layer)}
            className={`px-3 py-2 transition-colors ${
              activeLayer === layer
                ? "bg-[#EFF6E0] text-[#01161E]"
                : "border-r border-[#598392] bg-[#124559] text-[#EFF6E0] last:border-r-0 hover:bg-[#598392]"
            }`}
          >
            {layer}
          </button>
        ))}
      </div>

      {/* Border overlay */}
      <div className="pointer-events-none absolute inset-0 border-4 border-[var(--ink)] z-30" />

      {/* Filter Drawer */}
      <aside className="absolute left-4 top-4 z-10 w-[min(330px,calc(100%-2rem))] border-4 border-[var(--ink)] bg-[var(--paper)] font-mono text-xs font-black uppercase shadow-[6px_6px_0_var(--ink)]">
        <div className="border-b-4 border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-[var(--paper)]">
          Filter Drawer
        </div>
        <div className="space-y-2 p-3">
          {crimeTypes.map((crimeType) => {
            const count = filterCounts[crimeType];
            const incidentLabel = count === 1 ? "INCIDENT" : "INCIDENTS";

            return (
              <label
                key={crimeType}
                className="flex cursor-pointer items-center gap-2 border-2 border-[var(--ink)] bg-[var(--panel)] px-2 py-2"
              >
                <input
                  type="checkbox"
                  checked={selectedCrimeTypes.includes(crimeType)}
                  onChange={(event) =>
                    setSelectedCrimeTypeEnabled(crimeType, event.target.checked)
                  }
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0">
                  {crimeType.toUpperCase()} ({count} {incidentLabel})
                </span>
              </label>
            );
          })}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="border-2 border-[var(--ink)] bg-[var(--panel)] px-2 py-2">
              Visible: {visibleIncidents.length}
            </div>
            <button
              type="button"
              onClick={() => {
                setSpatialBounds(null);
              }}
              className="border-2 border-[var(--ink)] bg-[var(--accent)] px-2 py-2 text-left text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Clear Query
            </button>
          </div>
          <div className="border-2 border-[var(--ink)] bg-[var(--panel)] px-2 py-2">
            Bounds: {spatialBounds ? "ACTIVE" : "NONE"}
          </div>
        </div>
      </aside>

      {/* Fullscreen toggle (mobile) */}
      <button
        type="button"
        onClick={() => setIsFullscreenMap((f) => !f)}
        className="absolute right-4 top-4 z-20 flex h-11 items-center gap-2 border-4 border-[var(--ink)] bg-[var(--accent)] px-3 font-mono text-xs font-black uppercase text-[var(--ink)] shadow-[4px_4px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none md:hidden"
      >
        {isFullscreenMap ? (
          <X aria-hidden="true" size={18} strokeWidth={3} />
        ) : (
          <Maximize2 aria-hidden="true" size={18} strokeWidth={3} />
        )}
        [ {isFullscreenMap ? "EXIT MAP" : "FULLSCREEN MAP"} ]
      </button>

      {/* Playback bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 border-4 border-[var(--ink)] bg-[var(--paper)] p-3 font-mono text-xs font-black uppercase shadow-[6px_6px_0_var(--ink)] md:left-[370px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <button
            type="button"
            onClick={togglePlayback}
            className="flex h-11 items-center justify-center gap-2 border-4 border-[var(--ink)] bg-[var(--danger)] px-4 text-[var(--paper)] shadow-[4px_4px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none md:w-36"
          >
            {isMapPlaying ? (
              <Pause aria-hidden="true" size={18} fill="currentColor" />
            ) : (
              <Play aria-hidden="true" size={18} fill="currentColor" />
            )}
            {isMapPlaying ? "Pause" : "Play"}
          </button>
          <label className="grid min-w-0 flex-1 gap-1">
            <span>
              MapWeave Time Playback / {playbackDate} / {visibleIncidents.length}{" "}
              shown
            </span>
            <input
              type="range"
              min={0}
              max={playbackDates.length - 1}
              step={1}
              value={playbackIndex}
              onChange={(event) => {
                setIsMapPlaying(false);
                setPlaybackDate(playbackDates[Number(event.target.value)]);
              }}
              className="fatal-time-slider w-full"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type * as L from "leaflet";
import type { Detection } from "@/services/detection";
import { getContactSemantic } from "@/services/detection";

export type TileLayerKey = "google_hybrid" | "google_maps" | "google_satellite";

interface TileConfig {
  name: string;
  shortLabel: string;
  url: string;
  options: L.TileLayerOptions;
}

const TILE_CONFIGS: Record<TileLayerKey, TileConfig> = {
  google_hybrid: {
    name: "Google Hybrid (Satellite + Place Names)",
    shortLabel: "Google Hybrid",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    options: {
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  google_maps: {
    name: "Google Maps (Roadmap & Places)",
    shortLabel: "Google Maps",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    options: {
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  google_satellite: {
    name: "Google Satellite (Pure Imagery)",
    shortLabel: "Google Satellite",
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    options: {
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
};

function getLocationDescription(lat: number, lon: number): string {
  if (lat >= 11.8 && lat <= 12.1 && lon >= 79.7 && lon <= 80.2) {
    return "Puducherry Offshore · Bay of Bengal";
  }
  if (lat >= 8.5 && lat <= 10.0 && lon >= 78.0 && lon <= 80.0) {
    return "Gulf of Mannar / Palk Strait, TN";
  }
  if (lat >= 12.5 && lat <= 13.5 && lon >= 80.0 && lon <= 80.5) {
    return "Chennai Offshore · Coromandel Coast";
  }
  return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
}

export function TrackMap({
  detections,
  selectedId,
  onSelect,
  height = 250,
  showContactList = true,
}: {
  detections: Detection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  height?: number;
  showContactList?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const leafletLibRef = useRef<typeof L | null>(null);
  const prevCountRef = useRef<number>(-1);

  const [activeTile, setActiveTile] = useState<TileLayerKey>("google_hybrid");
  const [isMapReady, setIsMapReady] = useState(false);

  const validPts = detections.filter(
    (d) => d.location && typeof d.location.lat === "number" && typeof d.location.lon === "number"
  );

  const centerLat = validPts.length > 0 ? validPts[0].location!.lat : 11.925;
  const centerLon = validPts.length > 0 ? validPts[0].location!.lon : 79.865;
  const primaryLocationName = getLocationDescription(centerLat, centerLon);

  // 1. Initialize Leaflet Map (SSR-Safe Dynamic Client Import)
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;
      leafletLibRef.current = L;

      // Prevent duplicate initialization
      if (mapInstanceRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        touchZoom: true,
      });

      // Default oceanic position if no detection coordinates
      const defaultCenter: [number, number] =
        validPts.length > 0 ? [validPts[0].location!.lat, validPts[0].location!.lon] : [11.925, 79.865];

      map.setView(defaultCenter, 13);

      // Add active Google tile layer
      const cfg = TILE_CONFIGS[activeTile];
      const baseTile = L.tileLayer(cfg.url, cfg.options).addTo(map);
      baseTile.bringToBack();
      tileLayerRef.current = baseTile;

      // Create vector / marker layer group
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      mapInstanceRef.current = map;
      setIsMapReady(true);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        layerGroupRef.current = null;
        leafletLibRef.current = null;
      }
    };
  }, []);

  // 2. Switch Tile Layer (Clean direct swap between Google Hybrid, Maps, and Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const cfg = TILE_CONFIGS[activeTile];
    const newBaseTile = L.tileLayer(cfg.url, cfg.options).addTo(map);
    newBaseTile.bringToBack();
    tileLayerRef.current = newBaseTile;
  }, [activeTile]);

  // 3. Render Markers & Trackline onto Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !L || !layerGroup) return;

    layerGroup.clearLayers();

    if (validPts.length === 0) return;

    const latLngs: [number, number][] = validPts.map((d) => [d.location!.lat, d.location!.lon]);

    // ── Survey Trackline ──────────────────────────────
    if (latLngs.length > 1) {
      // High-contrast halo outline for readability on all tile layers
      L.polyline(latLngs, {
        color: "#050B14",
        weight: 4,
        opacity: 0.65,
        lineCap: "round",
      }).addTo(layerGroup);

      // Primary tactical dashed trackline
      L.polyline(latLngs, {
        color: "#C9A15A",
        weight: 2,
        dashArray: "6, 6",
        opacity: 0.95,
      }).addTo(layerGroup);
    }

    // ── Sensor Towfish Marker ─────────────────────────
    const towfishPos = latLngs[0];
    if (towfishPos) {
      const towfishIcon = L.divIcon({
        className: "hs-towfish-marker-icon",
        html: `
          <div style="display: flex; align-items: center; gap: 4px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.65)); cursor: pointer;">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon points="7,2 12,12 2,12" fill="#C9A15A" stroke="#08111e" stroke-width="1.5" />
            </svg>
            <span style="background: #C9A15A; color: #08111e; font-family: var(--font-mono, monospace); font-size: 8px; font-weight: 700; padding: 1.5px 5px; border-radius: 2px; letter-spacing: 0.06em; line-height: 1;">TOWFISH</span>
          </div>
        `,
        iconSize: [66, 16],
        iconAnchor: [7, 8],
      });

      const towfishMarker = L.marker(towfishPos, {
        icon: towfishIcon,
        zIndexOffset: 500,
      });

      towfishMarker.bindTooltip(
        `<div style="font-family: var(--font-mono, monospace); font-size: 10px; line-height: 1.3;">
           <div style="font-weight: 700; color: #C9A15A;">SENSOR TOWFISH PLATFORM</div>
           <div style="font-size: 9px; color: #94A3B8;">📍 ${getLocationDescription(towfishPos[0], towfishPos[1])}</div>
           <div style="font-size: 8.5px; color: #CBD5E1;">${towfishPos[0].toFixed(4)}°N, ${towfishPos[1].toFixed(4)}°E</div>
         </div>`,
        { direction: "top", offset: [0, -10], opacity: 0.95 }
      );

      towfishMarker.addTo(layerGroup);
    }

    // ── Contact Pins with Location Tooltips ────────────
    validPts.forEach((d) => {
      const sem = getContactSemantic(d);
      const isSelected = selectedId === d.id;
      const contactLoc = getLocationDescription(d.location!.lat, d.location!.lon);

      const markerIcon = L.divIcon({
        className: "hs-contact-marker-icon",
        html: `
          <div class="hs-leaflet-marker ${isSelected ? "selected" : ""}" style="display: flex; align-items: center; gap: 4px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
            <span class="hs-marker-diamond" style="width: 11px; height: 11px; transform: rotate(45deg) ${isSelected ? "scale(1.25)" : ""}; border: 2px solid ${sem.hex}; background-color: ${isSelected ? sem.hex : "#0A1420"}; box-shadow: ${isSelected ? `0 0 0 3px ${sem.hex}66` : "0 1px 3px rgba(0,0,0,0.4)"}; flex-shrink: 0; display: block; border-radius: 1px;"></span>
            <span class="hs-marker-tag" style="border: 1px solid ${sem.hex}; background-color: ${isSelected ? sem.hex : "#0A1420"}; color: ${isSelected ? "#FFFFFF" : "#E2E8F0"}; font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 600; padding: 1.5px 5px; border-radius: 3px; line-height: 1;">${d.id}</span>
          </div>
        `,
        iconSize: [64, 20],
        iconAnchor: [6, 10],
      });

      const marker = L.marker([d.location!.lat, d.location!.lon], {
        icon: markerIcon,
        zIndexOffset: isSelected ? 1000 : 200,
      });

      marker.bindTooltip(
        `<div style="font-family: var(--font-mono, monospace); font-size: 10px; line-height: 1.35;">
           <div style="font-weight: 700; color: ${sem.hex};">${d.id} · ${sem.shortLabel}</div>
           <div style="font-size: 9px; color: #94A3B8; margin-top: 1px;">📍 ${contactLoc}</div>
           <div style="font-size: 8.5px; color: #CBD5E1;">${d.location!.lat.toFixed(4)}°N, ${d.location!.lon.toFixed(4)}°E</div>
         </div>`,
        { direction: "top", offset: [0, -10], opacity: 0.95 }
      );

      marker.on("click", () => {
        onSelect(d.id);
      });

      marker.addTo(layerGroup);
    });
  }, [validPts, selectedId, onSelect, isMapReady]);

  // 4. Initial Bounds Fit on Data Load
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L || validPts.length === 0) return;

    if (prevCountRef.current !== validPts.length) {
      prevCountRef.current = validPts.length;
      const bounds = L.latLngBounds(validPts.map((p) => [p.location!.lat, p.location!.lon]));
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    }
  }, [validPts, isMapReady]);

  // 5. Fly to Selected Contact
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedId) return;

    const target = validPts.find((d) => d.id === selectedId);
    if (target?.location) {
      map.flyTo([target.location.lat, target.location.lon], Math.max(map.getZoom(), 14), {
        duration: 0.7,
      });
    }
  }, [selectedId, validPts]);

  // 6. Responsive Invalidate Size
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => clearTimeout(timer);
  }, [height, isMapReady]);

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L) return;

    if (validPts.length > 0) {
      const bounds = L.latLngBounds(validPts.map((p) => [p.location!.lat, p.location!.lon]));
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    } else {
      map.setView([11.925, 79.865], 13);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* ── Tactical Header Bar with Legend + 3 Google Basemap Controls ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded"
        style={{
          background: "var(--bg-surface-sunken)",
          border: "1px solid var(--border-default)",
          fontSize: 10,
          fontFamily: "var(--font-mono)",
        }}
      >
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
              <polygon points="5,1 9,9 1,9" fill="#C9A15A" />
            </svg>
            <span className="font-semibold tracking-wider">TOWFISH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="block h-2 w-2 rotate-45 shrink-0"
              style={{
                border: "1px solid var(--state-classified-benign)",
                backgroundColor: "color-mix(in srgb, var(--state-classified-benign) 40%, transparent)",
              }}
            />
            <span className="font-semibold tracking-wider">CONTACT (ID)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-3.5 shrink-0"
              style={{ borderTop: "2px dashed #C9A15A" }}
            />
            <span className="font-semibold tracking-wider">TRACKLINE</span>
          </div>
        </div>

        {/* 3 Google Basemap Options & Reset Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="flex items-center rounded p-0.5"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            {(Object.keys(TILE_CONFIGS) as TileLayerKey[]).map((key) => {
              const isActive = activeTile === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTile(key)}
                  className={`px-2.5 py-0.5 rounded text-[9.5px] font-mono transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[var(--accent-primary)] text-[var(--accent-primary-fg)] font-bold shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                  title={TILE_CONFIGS[key].name}
                >
                  {TILE_CONFIGS[key].shortLabel}
                </button>
              );
            })}
          </div>

          {/* Reset View Button */}
          <button
            type="button"
            onClick={handleResetView}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[9.5px] font-mono font-medium transition-colors cursor-pointer"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
            title="Recenter & fit all contacts"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Interactive Leaflet Map Container ────────────── */}
      <div
        className="relative overflow-hidden rounded"
        style={{
          height,
          border: "1px solid var(--border-default)",
          background: "#08111e",
        }}
      >
        <div ref={containerRef} className="h-full w-full" style={{ zIndex: 1 }} />

        {/* Real-Time Geographic Sector / Place Badge Overlay */}
        <div className="pointer-events-none absolute bottom-5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0A1420]/85 backdrop-blur-xs border border-[var(--border-default)] shadow-xs">
          <span className="text-[11px]">📍</span>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] font-bold text-[#FFFFFF] tracking-wide">
              {primaryLocationName}
            </span>
            <span className="font-mono text-[8px] text-[var(--text-tertiary)]">
              Center: {centerLat.toFixed(4)}°N, {centerLon.toFixed(4)}°E
            </span>
          </div>
        </div>

        {/* Loading / Standby Overlay */}
        {!isMapReady && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#08111e]/90 text-center">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-secondary)]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#C9A15A] animate-pulse" />
              <span>INITIALIZING GEOSPATIAL MAP ENGINE...</span>
            </div>
          </div>
        )}

        {/* Empty Contacts Banner */}
        {isMapReady && validPts.length === 0 && (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-20">
            <span className="font-mono text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)]/90 px-3 py-1 rounded border border-[var(--border-default)] shadow-xs">
              STANDBY · NO ACTIVE CONTACT GEOMETRY
            </span>
          </div>
        )}
      </div>

      {/* ── Contact Listing Below Map ──────────────────────── */}
      {showContactList && validPts.length > 0 && (
        <div className="space-y-1.5">
          {validPts.map((d) => {
            const sem = getContactSemantic(d);
            const isSelected = selectedId === d.id;
            const locName = getLocationDescription(d.location!.lat, d.location!.lon);
            return (
              <div
                key={d.id}
                onClick={() => onSelect(d.id)}
                className="flex items-center justify-between px-3 py-1.5 rounded cursor-pointer transition-colors"
                style={{
                  background: isSelected ? "var(--bg-surface-sunken)" : "var(--bg-surface)",
                  border: `1px solid ${isSelected ? sem.color : "var(--border-default)"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rotate-45 shrink-0"
                    style={{ backgroundColor: sem.color }}
                  />
                  <span className="font-mono text-[11px] font-semibold" style={{ color: sem.color }}>
                    {d.id}
                  </span>
                  <span className="font-sans text-[11px] text-[var(--text-secondary)]">
                    {sem.shortLabel}
                  </span>
                  <span className="hidden sm:inline-block font-mono text-[9.5px] text-[var(--text-tertiary)]">
                    · 📍 {locName}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                  {d.location!.lat.toFixed(4)}°N / {d.location!.lon.toFixed(4)}°E
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}




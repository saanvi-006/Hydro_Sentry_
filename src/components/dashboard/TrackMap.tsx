import type { Detection } from "@/services/detection";
import { getContactSemantic } from "@/services/detection";

export function TrackMap({
  detections,
  selectedId,
  onSelect,
  height = 220,
  showContactList = true,
}: {
  detections: Detection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  height?: number;
  showContactList?: boolean;
}) {
  const pts = detections.filter((d) => d.location);

  // Default coordinates if no points loaded
  const lats = pts.length > 0 ? pts.map((p) => p.location!.lat) : [11.905, 11.945];
  const lons = pts.length > 0 ? pts.map((p) => p.location!.lon) : [79.845, 79.885];
  const pad = 0.005;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLon = Math.min(...lons) - pad;
  const maxLon = Math.max(...lons) + pad;

  // Graticule tick marks calculation
  const latTicks = [
    { pct: 20, val: (maxLat - 0.2 * (maxLat - minLat)).toFixed(4) + "°N" },
    { pct: 50, val: (maxLat - 0.5 * (maxLat - minLat)).toFixed(4) + "°N" },
    { pct: 80, val: (maxLat - 0.8 * (maxLat - minLat)).toFixed(4) + "°N" },
  ];
  const lonTicks = [
    { pct: 25, val: (minLon + 0.25 * (maxLon - minLon)).toFixed(4) + "°E" },
    { pct: 50, val: (minLon + 0.50 * (maxLon - minLon)).toFixed(4) + "°E" },
    { pct: 75, val: (minLon + 0.75 * (maxLon - minLon)).toFixed(4) + "°E" },
  ];

  return (
    <div className="space-y-3">
      {/* ── Persistent Legend ─────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded"
        style={{
          background: "var(--bg-surface-sunken)",
          border: "1px solid var(--border-default)",
          fontSize: 10,
          fontFamily: "var(--font-mono)",
        }}
      >
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
            <polygon points="5,1 9,9 1,9" fill="var(--accent-primary)" />
          </svg>
          <span>SENSOR TOWFISH</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <span
            className="block h-2 w-2 rotate-45"
            style={{
              border: "1px solid var(--state-classified-benign)",
              backgroundColor: "color-mix(in srgb, var(--state-classified-benign) 40%, transparent)",
            }}
          />
          <span>CONTACT (ID TAG)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <span
            className="h-0.5 w-3.5"
            style={{ borderTop: "1px dashed var(--text-primary)" }}
          />
          <span>TRACKLINE PATH</span>
        </div>
      </div>

      {/* ── Map Viewport with Real Graticule ─────────────────── */}
      <div
        className="surface-sunken relative overflow-hidden"
        style={{
          height,
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius)",
          background: "var(--bg-surface-sunken)",
        }}
      >
        {/* SVG Graticule grid lines */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Horizontal latitude lines */}
          {latTicks.map((t) => (
            <line
              key={t.pct}
              x1="0%"
              y1={`${t.pct}%`}
              x2="100%"
              y2={`${t.pct}%`}
              stroke="var(--border-default)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          ))}
          {/* Vertical longitude lines */}
          {lonTicks.map((t) => (
            <line
              key={t.pct}
              x1={`${t.pct}%`}
              y1="0%"
              x2={`${t.pct}%`}
              y2="100%"
              stroke="var(--border-default)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          ))}

          {/* High-Contrast Survey Trackline */}
          <path
            d="M 12% 75% Q 40% 45%, 70% 35% T 90% 18%"
            fill="none"
            stroke="#1B3A5C"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.85"
          />
        </svg>

        {/* Latitude tick marks (Left edge) */}
        {latTicks.map((t) => (
          <span
            key={t.pct}
            className="absolute left-1.5 -translate-y-1/2 font-mono text-[8px] font-medium text-[var(--text-secondary)] select-none bg-[var(--bg-surface)] px-1 py-0.5 rounded border border-[var(--border-default)] shadow-xs"
            style={{ top: `${t.pct}%` }}
          >
            {t.val}
          </span>
        ))}

        {/* Longitude tick marks (Bottom edge) */}
        {lonTicks.map((t) => (
          <span
            key={t.pct}
            className="absolute bottom-1 -translate-x-1/2 font-mono text-[8px] font-medium text-[var(--text-secondary)] select-none bg-[var(--bg-surface)] px-1 py-0.5 rounded border border-[var(--border-default)] shadow-xs"
            style={{ left: `${t.pct}%` }}
          >
            {t.val}
          </span>
        ))}

        {/* Own Sensor Towfish / Platform Icon */}
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1"
          style={{ left: "15%", top: "72%" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polygon points="7,2 12,12 2,12" fill="var(--accent-primary)" stroke="var(--bg-surface)" strokeWidth="1" />
          </svg>
          <span
            className="rounded px-1 py-0.5 font-mono text-[8px] font-bold tracking-wider uppercase shadow-xs"
            style={{ background: "var(--accent-primary)", color: "var(--accent-primary-fg)" }}
          >
            TOWFISH
          </span>
        </div>

        {/* Contact Pins with On-Map Direct ID Tags */}
        {pts.map((d) => {
          const sem = getContactSemantic(d);
          const x = ((d.location!.lon - minLon) / (maxLon - minLon)) * 100;
          const y = (1 - (d.location!.lat - minLat) / (maxLat - minLat)) * 100;
          const isSelected = selectedId === d.id;

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 cursor-pointer transition-transform hover:scale-110"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {/* Diamond marker */}
              <span
                className="block h-3 w-3 rotate-45 shrink-0"
                style={{
                  border: `2px solid ${sem.color}`,
                  backgroundColor: isSelected ? sem.color : "var(--bg-surface)",
                  boxShadow: isSelected
                    ? `0 0 0 3px color-mix(in srgb, ${sem.color} 30%, transparent)`
                    : "var(--shadow-card)",
                }}
              />
              {/* On-map persistent ID pill */}
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold whitespace-nowrap shadow-xs"
                style={{
                  backgroundColor: isSelected ? sem.color : "var(--bg-surface)",
                  color: isSelected ? "#FFFFFF" : "var(--text-primary)",
                  border: `1px solid ${sem.color}`,
                }}
              >
                {d.id}
              </span>
            </button>
          );
        })}

        {pts.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <span className="font-mono text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] px-2.5 py-1 rounded border border-[var(--border-default)]">
              STANDBY · NO ACTIVE CONTACT STREAM
            </span>
          </div>
        )}
      </div>

      {/* Contact listing below map */}
      {showContactList && (
        <div className="space-y-1.5">
          {pts.map((d) => {
            const sem = getContactSemantic(d);
            const isSelected = selectedId === d.id;
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

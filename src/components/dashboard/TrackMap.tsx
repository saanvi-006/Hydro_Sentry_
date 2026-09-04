import type { Detection } from "@/services/detection";
import { PRIORITY_COLOR } from "@/services/detection";

export function TrackMap({
  detections,
  selectedId,
  onSelect,
}: {
  detections: Detection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const pts = detections.filter((d) => d.location);
  if (pts.length === 0) {
    return (
      <p className="border border-hairline bg-card p-3 font-mono text-[11px] text-muted-foreground">
        No positioned contacts on this track.
      </p>
    );
  }

  const lats = pts.map((p) => p.location!.lat);
  const lons = pts.map((p) => p.location!.lon);
  const pad = 0.004;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLon = Math.min(...lons) - pad;
  const maxLon = Math.max(...lons) + pad;

  return (
    <div>
      <div className="grid-field relative h-40 border border-hairline bg-black">
        {pts.map((d) => {
          const x = ((d.location!.lon - minLon) / (maxLon - minLon)) * 100;
          const y = (1 - (d.location!.lat - minLat) / (maxLat - minLat)) * 100;
          const color = PRIORITY_COLOR[d.priority];
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              title={d.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span
                className="block h-2.5 w-2.5 rotate-45 border"
                style={{
                  borderColor: color,
                  backgroundColor: selectedId === d.id ? color : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
      <ul className="mt-2 space-y-1 font-mono text-[10px] text-muted-foreground">
        {pts.map((d) => (
          <li key={d.id} className="flex justify-between">
            <span style={{ color: PRIORITY_COLOR[d.priority] }}>{d.id}</span>
            <span>
              {d.location!.lat.toFixed(4)} / {d.location!.lon.toFixed(4)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

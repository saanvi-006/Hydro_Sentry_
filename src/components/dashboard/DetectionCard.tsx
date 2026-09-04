import type { Detection } from "@/services/detection";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/services/detection";
import { cn } from "@/lib/utils";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-[12px] tabular-nums">{value}</p>
    </div>
  );
}

export function DetectionCard({
  detection: d,
  active,
  onSelect,
}: {
  detection: Detection;
  active: boolean;
  onSelect: () => void;
}) {
  const color = PRIORITY_COLOR[d.priority];
  const unknown = d.type === "unknown_anomaly";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "fade-up w-full border-l-2 border-y border-r border-hairline bg-card p-3 text-left transition-colors hover:bg-accent",
        active && "bg-accent",
      )}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-medium tracking-tight">
            {unknown ? "Unclassified anomaly" : `${d.class}`}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{d.id}</p>
        </div>
        <span
          className="shrink-0 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-black"
          style={{ backgroundColor: color }}
        >
          {PRIORITY_LABEL[d.priority]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {unknown ? (
          <Metric label="Match" value="none" />
        ) : (
          <Metric
            label="Detector"
            value={`${((d.detector_confidence ?? 0) * 100).toFixed(0)}%`}
          />
        )}
        <Metric label="Anomaly" value={d.anomaly_score.toFixed(2)} />
        <Metric label="Physics" value={d.physics_score.toFixed(2)} />
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>Operational {(d.operational_confidence * 100).toFixed(0)}%</span>
        <span>
          {d.location
            ? `${d.location.lat.toFixed(4)}, ${d.location.lon.toFixed(4)}`
            : "no fix"}
        </span>
      </div>
    </button>
  );
}

import type { Detection } from "@/services/detection";
import { getContactSemantic } from "@/services/detection";
import { cn } from "@/lib/utils";

function ScoreBar({
  label,
  value,
  fillColor,
}: {
  label: string;
  value: number;
  fillColor: string;
}) {
  const pct = Math.round(value * 100);
  // Confidence-weighted rendering: opacity scales directly with value (min 35%, max 100%)
  const fillOpacity = Math.max(0.35, Math.min(1, value));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-1">
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 10,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--text-tertiary)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {pct}%
        </span>
      </div>
      <div
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
        style={{
          background: "var(--bg-surface-sunken)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: fillColor,
            opacity: fillOpacity,
          }}
        />
      </div>
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
  const sem = getContactSemantic(d);
  const unknown = d.type === "unknown_anomaly";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "fade-up w-full text-left transition-all rounded-[var(--radius)] cursor-pointer",
        active ? "ring-2 ring-[var(--accent-primary)]" : "hover:border-[var(--border-strong)]",
      )}
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${active ? "var(--accent-primary)" : "var(--border-default)"}`,
        borderLeft: `3px solid ${sem.color}`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="p-3.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.3,
              }}
            >
              {unknown
                ? "Unclassified anomaly"
                : d.class
                  ? d.class.charAt(0).toUpperCase() + d.class.slice(1)
                  : "Unknown contact"}
            </p>
            <p
              className="mt-0.5 truncate"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-secondary)",
              }}
            >
              {d.id}
            </p>
          </div>

          {/* Semantic status badge scaled by confidence */}
          <span
            className="shrink-0 rounded px-2 py-0.5"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              backgroundColor: sem.color,
              color: "#FFFFFF",
              opacity: sem.badgeOpacity,
            }}
          >
            {sem.label}
          </span>
        </div>

        {/* Score bars — confidence-weighted */}
        <div className="mt-3 space-y-2">
          {unknown ? (
            <ScoreBar label="Anomaly Score" value={d.anomaly_score} fillColor={sem.color} />
          ) : (
            <ScoreBar
              label="Detector Conf"
              value={d.detector_confidence ?? 0}
              fillColor={sem.color}
            />
          )}
          <ScoreBar label="Physics Shadow Match" value={d.physics_score} fillColor={sem.color} />
        </div>

        {/* Footer row: operational confidence + coordinates */}
        <div
          className="mt-3.5 pt-2 flex items-center justify-between"
          style={{
            borderTop: "1px solid var(--border-default)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
          }}
        >
          <span style={{ color: "var(--text-tertiary)" }}>
            OP CONF{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {(d.operational_confidence * 100).toFixed(0)}%
            </span>
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            {d.location
              ? `${d.location.lat.toFixed(4)}°N · ${d.location.lon.toFixed(4)}°E`
              : "NO FIX"}
          </span>
        </div>
      </div>
    </button>
  );
}

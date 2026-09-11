export interface EvaluationMetric {
  value: string;
  label: string;
  subtext: string;
  badge?: string;
}

export const EVALUATION_METRICS: EvaluationMetric[] = [
  {
    value: "0.907",
    label: "Best F1",
    subtext: "YOLO + PatchCore",
    badge: "DUAL BRANCH",
  },
  {
    value: "0.894",
    label: "YOLO F1",
    subtext: "Tuned YOLOv8",
    badge: "STANDALONE",
  },
  {
    value: "0.928",
    label: "Precision",
    subtext: "Corroborative Fusion",
    badge: "CORROBORATED",
  },
  {
    value: "8",
    label: "False Positives",
    subtext: "vs 140 with Naïve Union",
    badge: "-94.3% CLUTTER",
  },
];

export function DetectionPerformance({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`card-elevated p-4 sm:p-5 rounded-[var(--radius)] ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <div className="flex items-center gap-2">
          <h3
            className="font-bold tracking-wider text-xs sm:text-sm uppercase"
            style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)", letterSpacing: "0.08em" }}
          >
            DETECTION PERFORMANCE
          </h3>
          <span
            className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
            style={{ background: "var(--accent-primary)" }}
          >
            BENCHMARK
          </span>
        </div>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
          SIH26057 Evaluation Set · IoU ≥ 0.10
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {EVALUATION_METRICS.map((m) => (
          <div
            key={m.label}
            className="flex flex-col justify-between p-3.5 rounded"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-start justify-between gap-1">
              <span
                className="font-bold tracking-tight"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: compact ? 24 : 30,
                  color: "var(--text-primary)",
                  lineHeight: 1.1,
                }}
              >
                {m.value}
              </span>
              {m.badge && (
                <span
                  className="font-mono text-[8.5px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)",
                    color: "var(--accent-primary)",
                  }}
                >
                  {m.badge}
                </span>
              )}
            </div>
            <div className="mt-2.5">
              <p
                className="font-semibold text-xs sm:text-[13px]"
                style={{ color: "var(--text-primary)", lineHeight: 1.25 }}
              >
                {m.label}
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-secondary)", lineHeight: 1.3 }}
              >
                {m.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

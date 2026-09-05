import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { UploadCloud, Play, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SonarCanvas } from "@/components/dashboard/SonarCanvas";
import { DetectionCard } from "@/components/dashboard/DetectionCard";
import { TrackMap } from "@/components/dashboard/TrackMap";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { detectionProvider } from "@/services/detection";
import type { DetectionResult, HealthStatus } from "@/services/detection";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Analysis — HydroSentry" },
      {
        name: "description",
        content:
          "Review side-scan sonar frames, inspect detected contacts and track unclassified seabed anomalies in one console.",
      },
      { property: "og:title", content: "Analysis — HydroSentry" },
      {
        property: "og:description",
        content:
          "Sonar frame review with bounding-box overlays, live contact feed and survey positions.",
      },
    ],
  }),
  component: Dashboard,
});

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("flex flex-col card-elevated", className)}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
        borderRadius: "var(--radius)",
      }}
    >
      {/* Panel header */}
      <div
        className="shrink-0 px-4 py-3"
        style={{
          borderBottom: "1px solid var(--border-default)",
          background: "var(--bg-surface)",
        }}
      >
        <p className="eyebrow">{title}</p>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

function Dashboard() {
  const [threshold, setThreshold]   = useState(0.25);
  const [result, setResult]         = useState<DetectionResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [fileName, setFileName]     = useState<string | null>(null);
  const [enhanced, setEnhanced]     = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [health, setHealth]         = useState<HealthStatus | null>(null);
  const [dragging, setDragging]     = useState(false);

  useEffect(() => {
    detectionProvider.checkHealth().then(setHealth).catch(() => setHealth(null));
    // Auto-populate with sample survey on first visit
    void run(null);
  }, []);

  const run = useCallback(
    async (file: File | null) => {
      setLoading(true);
      setError(null);
      setSelectedId(null);
      try {
        const res = await detectionProvider.detect(file, threshold);
        setResult(res);
      } catch (e) {
        setResult(null);
        setError(e instanceof Error ? e.message : "Detection failed");
      } finally {
        setLoading(false);
      }
    },
    [threshold],
  );

  const handleFile = (file: File) => {
    setFileName(file.name);
    void run(file);
  };

  const summary = result?.summary;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg-canvas)" }}>
      <SiteHeader />

      {/* ── Rebuilt Grouped Chips Status Bar (Section 3) ─────── */}
      <div
        className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-6 py-2.5"
        style={{
          borderBottom: "1px solid var(--border-default)",
          background: "var(--bg-surface)",
        }}
      >
        {/* Left Chip Group: Frame & Source */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.04em",
              }}
            >
              FRAME
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {result?.image_id ?? "SSS-2291-A"}
            </span>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1 rounded"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.04em",
              }}
            >
              SOURCE
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-primary)",
              }}
            >
              {fileName ?? "survey_recording_moes.png"}
            </span>
          </div>
        </div>

        {/* Right Chip Group: Model, Latency & Stream */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.04em",
              }}
            >
              MODEL
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              {health?.model_version ?? "v2.4-moes"} · LOADED
            </span>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1 rounded"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.04em",
              }}
            >
              INFERENCE
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--accent-primary)",
              }}
            >
              {result ? `${result.processing_time_ms} ms` : "358 ms"}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span className="h-2 w-2 rounded-full bg-[#1E7A5C]" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.04em",
              }}
            >
              SENSOR STREAM
            </span>
          </div>
        </div>
      </div>

      {/* ── Main 3-column layout (Natural page flow, elevated cards) ── */}
      <main className="mx-auto max-w-[1600px] w-full p-6 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_360px] xl:grid-cols-[300px_minmax(0,1fr)_380px]">
        {/* Left — Ingest */}
        <Panel title="Ingest & Calibration" className="analysis-col">
          {/* Drop zone on sunken surface */}
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="surface-sunken flex cursor-pointer flex-col items-center justify-center gap-2 px-4 py-8 text-center transition-all hover:border-[var(--accent-primary)]"
            style={{
              border: `1px dashed ${dragging ? "var(--accent-primary)" : "var(--border-default)"}`,
              borderRadius: "var(--radius)",
              background: dragging ? "var(--bg-surface-sunken)" : "var(--bg-surface-sunken)",
            }}
          >
            <UploadCloud
              className="h-5 w-5"
              strokeWidth={1.5}
              style={{ color: dragging ? "var(--accent-primary)" : "var(--text-secondary)" }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
              Drop a sonar frame or click to browse
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-secondary)" }}>
              .png · .jpg · .tif
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>

          {/* Threshold control */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Confidence threshold</p>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                {threshold.toFixed(2)}
              </span>
            </div>
            <Slider
              className="mt-3"
              min={0}
              max={0.95}
              step={0.05}
              value={[threshold]}
              onValueChange={(v) => setThreshold(v[0] ?? 0)}
            />
          </div>

          {/* Run sample button — Accent Primary (Navy #1B3A5C) */}
          <button
            type="button"
            onClick={() => { setFileName(null); void run(null); }}
            disabled={loading}
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{
              borderRadius: "var(--radius)",
              background: "var(--accent-primary)",
              color: "var(--accent-primary-fg)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2} />
            {loading ? "Processing…" : "Load sample survey"}
          </button>

          {/* Error state */}
          {error && (
            <div
              className="mt-4 flex gap-2 p-3"
              style={{
                border: "1px solid var(--border-default)",
                borderLeftWidth: 3,
                borderLeftColor: "var(--state-known-confirmed)",
                borderRadius: "var(--radius)",
                fontSize: 11,
                lineHeight: 1.5,
                color: "var(--text-secondary)",
                background: "var(--bg-surface-sunken)",
              }}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} style={{ color: "var(--state-known-confirmed)" }} />
              <span>{error}</span>
            </div>
          )}

          {/* Legend */}
          <div
            className="mt-6 space-y-2 pt-4"
            style={{ borderTop: "1px solid var(--border-default)" }}
          >
            <p className="eyebrow">Acoustic Contact Legend</p>
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-xs bg-[#B3261E]" />
                <span style={{ color: "var(--text-primary)" }}>Solid Red — Confirmed Threat (Mine)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-xs bg-[#2563A6]" />
                <span style={{ color: "var(--text-primary)" }}>Solid Blue — Classified Benign (Wreck)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-xs bg-[#C2600A]" />
                <span style={{ color: "var(--text-primary)" }}>Solid Orange — Caution / Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-xs border border-dashed border-[#5B5F7A] bg-[#5B5F7A]/30" />
                <span style={{ color: "var(--text-primary)" }}>Dashed Slate — Unclassified Anomaly</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Center — Sonar canvas */}
        <Panel title="Sonar Acoustic Frame">
          {/* View toggle */}
          <div className="mb-3 flex items-center gap-1.5">
            {(["Raw", "Processed"] as const).map((label, i) => {
              const on = enhanced === (i === 1);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setEnhanced(i === 1)}
                  className="transition-colors cursor-pointer"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 12px",
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    fontWeight: on ? 600 : 500,
                    background: on ? "var(--accent-primary)" : "var(--bg-surface-sunken)",
                    color: on ? "var(--accent-primary-fg)" : "var(--text-secondary)",
                    border: on ? "1px solid var(--accent-primary)" : "1px solid var(--border-default)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <Skeleton className="aspect-[1024/640] w-full" style={{ borderRadius: "var(--radius)" }} />
          ) : result ? (
            <SonarCanvas
              detections={result.detections}
              enhanced={enhanced}
              seed={result.image_id}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <div
              className="surface-sunken relative flex aspect-[1024/640] w-full flex-col items-center justify-center overflow-hidden"
              style={{
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius)",
                background: "var(--bg-surface-sunken)",
              }}
            >
              {/* Corner coordinate crosshairs / ticks */}
              <div className="absolute top-2 left-2 font-mono text-[9px] text-[var(--text-secondary)] select-none">
                + [PORT 50m]
              </div>
              <div className="absolute top-2 right-2 font-mono text-[9px] text-[var(--text-secondary)] select-none">
                [STBD 50m] +
              </div>
              <div className="absolute bottom-2 left-2 font-mono text-[9px] text-[var(--text-secondary)] select-none">
                + LAT: 11.9312°N
              </div>
              <div className="absolute bottom-2 right-2 font-mono text-[9px] text-[var(--text-secondary)] select-none">
                LON: 79.8541°E +
              </div>

              {/* Center nadir line */}
              <div
                className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 opacity-30"
                style={{ borderLeft: "1px dashed var(--border-strong)" }}
              />

              {/* Status instrument indicator */}
              <div className="relative z-10 flex flex-col items-center gap-2 p-6 text-center max-w-sm">
                <div
                  className="flex items-center gap-2 px-3 py-1 rounded font-mono text-[10px]"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1E7A5C]" />
                  <span>TRANSDUCER STREAM STANDBY</span>
                </div>
                <p
                  className="mt-1"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}
                >
                  Awaiting acoustic survey ingest
                </p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Click &ldquo;Load sample survey&rdquo; on the left panel or drop a side-scan recording to begin automated contact detection.
                </p>
              </div>
            </div>
          )}

          {result && result.detections.length === 0 && !loading && (
            <p className="mt-3" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
              Frame clear — no contacts above threshold.
            </p>
          )}
        </Panel>

        {/* Right — Live feed + track map */}
        <Panel title="Contact Feed & Tactical Track">
          {/* Summary metrics — strict semantic colors */}
          <div
            className="grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius)]"
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--border-default)",
            }}
          >
            {[
              { label: "Known",       value: summary?.known_count,             color: "var(--state-classified-benign)" },
              { label: "Unclassified", value: summary?.unknown_anomaly_count,  color: "var(--state-unclassified)" },
              { label: "FP Filtered", value: summary?.false_positives_filtered, color: "var(--state-muted-meta)" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="px-2 py-3 text-center"
                style={{ background: "var(--bg-surface)" }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 22,
                    fontWeight: 600,
                    color: color,
                    lineHeight: 1,
                  }}
                >
                  {value ?? "—"}
                </p>
                <p className="eyebrow mt-1 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            Acoustic clutter suppressed by physics validation before analyst feed.
          </p>

          {/* Detection cards */}
          <div className="mt-4 space-y-2">
            {loading &&
              [0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[120px] w-full" style={{ borderRadius: "var(--radius)" }} />
              ))}
            {!loading &&
              result?.detections.map((d, idx) => (
                <div
                  key={d.id}
                  className={`fade-up stagger-${Math.min(idx + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}
                >
                  <DetectionCard
                    detection={d}
                    active={selectedId === d.id}
                    onSelect={() => setSelectedId(d.id)}
                  />
                </div>
              ))}
            {!loading && result && result.detections.length === 0 && (
              <p
                className="p-3"
                style={{
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  background: "var(--bg-surface-sunken)",
                }}
              >
                No contacts to review.
              </p>
            )}
            {!loading && !result && (
              <p
                className="p-3"
                style={{
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  background: "var(--bg-surface-sunken)",
                }}
              >
                Load a survey to populate the feed.
              </p>
            )}
          </div>

          {/* Tactical track */}
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border-default)" }}>
            <p className="eyebrow mb-2">Tactical Survey Track</p>
            <TrackMap
              detections={result?.detections ?? []}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </Panel>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
        <div
          className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-6 py-4"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}
        >
          <span>HydroSentry · Operational Survey Console</span>
          <span>Ministry of Earth Sciences · SIH Project</span>
        </div>
      </footer>
    </div>
  );
}

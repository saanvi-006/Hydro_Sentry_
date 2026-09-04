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
      { title: "Command center — HydroSentry" },
      {
        name: "description",
        content:
          "Review side-scan sonar frames, inspect detected contacts and track unclassified seabed anomalies in one console.",
      },
      { property: "og:title", content: "Command center — HydroSentry" },
      {
        property: "og:description",
        content:
          "Sonar frame review with bounding-box overlays, live contact feed and survey positions.",
      },
    ],
  }),
  component: Dashboard;
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
      className={cn("flex flex-col border border-hairline bg-card", className)}
    >
      <div className="border-b border-hairline px-3 py-2">
        <p className="eyebrow">{title}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </section>
  );
}

function Dashboard() {
  const [threshold, setThreshold] = useState(0.25);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [enhanced, setEnhanced] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    detectionProvider.checkHealth().then(setHealth).catch(() => setHealth(null));
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
    <div className="flex h-screen flex-col bg-background">
      <SiteHeader />

      <div className="flex items-center justify-between border-b border-hairline px-6 py-2 font-mono text-[11px] text-muted-foreground">
        <span>
          Frame: {result?.image_id ?? "—"} · Source: {fileName ?? "sample survey"}
        </span>
        <span className="flex items-center gap-4">
          <span>
            Model {health?.model_version ?? "…"}
            {health?.model_loaded ? " · loaded" : ""}
          </span>
          <span>Inference {result ? `${result.processing_time_ms} ms` : "—"}</span>
        </span>
      </div>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-px overflow-auto bg-hairline p-px xl:grid-cols-[300px_minmax(0,1fr)_380px] xl:overflow-hidden">
        {/* Left — ingest */}
        <Panel title="Ingest">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-hairline px-4 py-10 text-center transition-colors hover:border-muted-foreground",
              dragging && "border-muted-foreground bg-accent",
            )}
          >
            <UploadCloud className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[12px] text-muted-foreground">
              Drop a sonar frame or click to browse
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              .png .jpg .tif
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

          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Confidence threshold</p>
              <span className="font-mono text-[12px] tabular-nums">
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

          <button
            type="button"
            onClick={() => {
              setFileName(null);
              void run(null);
            }}
            disabled={loading}
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-primary font-mono text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2} />
            {loading ? "Processing…" : "Load sample survey"}
          </button>

          {error && (
            <div
              className="mt-4 flex gap-2 border border-hairline p-2 text-[11px] leading-relaxed"
              style={{ borderLeftColor: "#FF453A", borderLeftWidth: 2 }}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 space-y-1.5 border-t border-hairline pt-4">
            <p className="eyebrow">Legend</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              Solid outline — known object
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              Dashed outline — unclassified anomaly
            </p>
          </div>
        </Panel>

        {/* Center — canvas */}
        <Panel title="Sonar frame">
          <div className="mb-3 flex items-center gap-1">
            {(["Raw", "AI-enhanced"] as const).map((label, i) => {
              const on = enhanced === (i === 1);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setEnhanced(i === 1)}
                  className={cn(
                    "rounded-sm px-3 py-1 font-mono text-[11px] transition-colors",
                    on
                      ? "bg-primary text-primary-foreground"
                      : "border border-hairline text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <Skeleton className="aspect-[1024/640] w-full rounded-sm" />
          ) : result ? (
            <SonarCanvas
              detections={result.detections}
              enhanced={enhanced}
              seed={result.image_id}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <div className="flex aspect-[1024/640] w-full items-center justify-center border border-dashed border-hairline">
              <p className="font-mono text-[12px] text-muted-foreground">
                No frame loaded
              </p>
            </div>
          )}

          {result && result.detections.length === 0 && !loading && (
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              Frame clear — no contacts above threshold.
            </p>
          )}
        </Panel>

        {/* Right — feed + map */}
        <Panel title="Live feed">
          <div className="grid grid-cols-3 gap-px border border-hairline bg-hairline">
            <div className="bg-card px-2 py-3 text-center">
              <p className="font-mono text-[20px] tabular-nums">
                {summary?.known_count ?? "—"}
              </p>
              <p className="eyebrow mt-1">Known</p>
            </div>
            <div className="bg-card px-2 py-3 text-center">
              <p className="font-mono text-[20px] tabular-nums">
                {summary?.unknown_anomaly_count ?? "—"}
              </p>
              <p className="eyebrow mt-1">Unclassified</p>
            </div>
            <div className="bg-card px-2 py-3 text-center">
              <p
                className="font-mono text-[20px] tabular-nums"
                style={{ color: "#32ADE6" }}
              >
                {summary?.false_positives_filtered ?? "—"}
              </p>
              <p className="eyebrow mt-1">FP filtered</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            False positives suppressed on this frame before review.
          </p>

          <div className="mt-4 space-y-2">
            {loading &&
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] w-full" />)}
            {!loading &&
              result?.detections.map((d) => (
                <DetectionCard
                  key={d.id}
                  detection={d}
                  active={selectedId === d.id}
                  onSelect={() => setSelectedId(d.id)}
                />
              ))}
            {!loading && result && result.detections.length === 0 && (
              <p className="border border-hairline p-3 font-mono text-[11px] text-muted-foreground">
                No contacts to review.
              </p>
            )}
            {!loading && !result && (
              <p className="border border-hairline p-3 font-mono text-[11px] text-muted-foreground">
                Load a survey to populate the feed.
              </p>
            )}
          </div>

          <div className="mt-6">
            <p className="eyebrow">Tactical track</p>
            <div className="mt-2">
              <TrackMap
                detections={result?.detections ?? []}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </div>
        </Panel>
      </main>
    </div>
  );
}

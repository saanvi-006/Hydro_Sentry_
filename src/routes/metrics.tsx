import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { detectionProvider } from "@/services/detection";
import type { DetectionResult } from "@/services/detection";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Model performance — HydroSentry" },
      {
        name: "description",
        content:
          "Reference figures for the HydroSentry detection pipeline: inference time, precision and recall, and the stages a survey frame passes through.",
      },
      { property: "og:title", content: "Model performance — HydroSentry" },
      {
        property: "og:description",
        content:
          "Inference timing, precision and recall reference figures, and the four-stage detection pipeline.",
      },
    ],
  }),
  component: Metrics,
});

const stages = [
  {
    n: "01",
    title: "Tiling",
    body: "The survey frame is cut into overlapping tiles so small contacts survive downscaling.",
  },
  {
    n: "02",
    title: "Detection",
    body: "Each tile is scanned for known object signatures — wrecks, mines, aircraft debris.",
  },
  {
    n: "03",
    title: "Physics filtering",
    body: "Shadow geometry and acoustic return are checked against the sensor geometry to drop clutter.",
  },
  {
    n: "04",
    title: "Fused output",
    body: "Surviving contacts are merged across tiles, scored and assigned a review priority.",
  },
];

const figures = [
  { label: "Precision", value: "0.91", note: "known classes, held-out survey set" },
  { label: "Recall", value: "0.87", note: "known classes, held-out survey set" },
  { label: "Anomaly recall", value: "0.79", note: "unclassified contacts" },
];

function Metrics() {
  const [last, setLast] = useState<DetectionResult | null>(null);

  useEffect(() => {
    detectionProvider
      .detect(null, 0.25)
      .then(setLast)
      .catch(() => setLast(null));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-6 py-12">
        <p className="eyebrow">Status</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Model performance</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          Reference figures for the current prototype build. Values are indicative and
          will be replaced by live evaluation once the detection service is connected.
        </p>

        <div className="mt-10 grid gap-px border border-hairline bg-hairline sm:grid-cols-4">
          <div className="bg-card p-5">
            <p className="eyebrow">Inference time</p>
            <p className="mt-2 font-mono text-[26px] tabular-nums">
              {last ? `${last.processing_time_ms}` : "—"}
              <span className="ml-1 text-[13px] text-muted-foreground">ms</span>
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">last processed frame</p>
          </div>
          {figures.map((f) => (
            <div key={f.label} className="bg-card p-5">
              <p className="eyebrow">{f.label}</p>
              <p className="mt-2 font-mono text-[26px] tabular-nums">{f.value}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{f.note}</p>
            </div>
          ))}
        </div>

        <p className="eyebrow mt-12">Pipeline</p>
        <ol className="mt-4 grid gap-px border border-hairline bg-hairline md:grid-cols-4">
          {stages.map((s) => (
            <li key={s.n} className="bg-card p-5">
              <p className="font-mono text-[11px] text-muted-foreground">{s.n}</p>
              <h2 className="mt-2 text-[15px] font-medium tracking-tight">{s.title}</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}

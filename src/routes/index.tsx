import { createFileRoute, Link } from "@tanstack/react-router";
import { Radar, Layers, Filter, Map } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HydroSentry — Acoustic anomaly detection for seabed surveys" },
      {
        name: "description",
        content:
          "HydroSentry analyses side-scan sonar surveys to surface shipwrecks, mines, aircraft and unclassified seabed anomalies for maritime review teams.",
      },
      {
        property: "og:title",
        content: "HydroSentry — Acoustic anomaly detection for seabed surveys",
      },
      {
        property: "og:description",
        content:
          "Side-scan sonar analysis console: known-object detection, unclassified anomaly flagging and false-positive suppression.",
      },
    ],
  }),
  component: Home,
});

const pillars = [
  {
    icon: Radar,
    eyebrow: "Detection",
    title: "Real-time detection",
    body: "Survey frames are tiled and scanned as they arrive, with contacts posted to the live feed within a few hundred milliseconds.",
  },
  {
    icon: Layers,
    eyebrow: "Classification",
    title: "Known vs unclassified",
    body: "Matched contacts carry a class and confidence. Everything else is held as an unclassified anomaly rather than forced into a label.",
  },
  {
    icon: Filter,
    eyebrow: "Suppression",
    title: "False-positive suppression",
    body: "Physics-based checks on shadow geometry and acoustic return remove seabed clutter before an analyst ever sees it.",
  },
  {
    icon: Map,
    eyebrow: "Coverage",
    title: "Survey mapping",
    body: "Every contact keeps its survey position, so a track can be reviewed geographically as well as frame by frame.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-hairline">
        <div className="grid-field pointer-events-none absolute inset-0 opacity-40" />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
          preserveAspectRatio="none"
          viewBox="0 0 1200 500"
          aria-hidden="true"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${60 + i * 32} C 200 ${20 + i * 34}, 420 ${120 + i * 28}, 640 ${70 + i * 31} S 1020 ${30 + i * 33}, 1200 ${90 + i * 29}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground"
            />
          ))}
        </svg>

        <div className="relative mx-auto max-w-[1600px] px-6 py-24 md:py-32">
          <div className="max-w-3xl fade-up">
            <p className="eyebrow">Acoustic survey intelligence · MoES</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
              Seabed contacts, resolved before the survey ends.
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              HydroSentry reads side-scan sonar imagery and separates genuine seabed
              contacts — wrecks, mines, aircraft debris and unclassified anomalies — from
              the clutter that fills every survey line.
            </p>
            <div className="mt-10">
              <Link
                to="/dashboard"
                className="inline-flex h-11 items-center rounded-sm bg-primary px-6 font-mono text-[13px] font-medium tracking-tight text-primary-foreground transition-opacity hover:opacity-90"
              >
                Enter command center
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16">
        <p className="eyebrow">Capabilities</p>
        <div className="mt-6 grid gap-px overflow-hidden rounded-sm border border-hairline bg-hairline md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((p) => (
            <Card
              key={p.title}
              className="gap-0 rounded-none border-0 bg-card p-6 shadow-none"
            >
              <p.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <p className="eyebrow mt-5">{p.eyebrow}</p>
              <h2 className="mt-2 text-[17px] font-medium tracking-tight">{p.title}</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                {p.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-6 py-6 font-mono text-[11px] text-muted-foreground">
          <span>HydroSentry · prototype build</span>
          <span>Ministry of Earth Sciences · survey analysis programme</span>
        </div>
      </footer>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, ArrowLeft, Play, AlertTriangle, Loader2, FlaskConical } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SonarCanvas } from "@/components/dashboard/SonarCanvas";
import { DetectionCard } from "@/components/dashboard/DetectionCard";
import { TrackMap } from "@/components/dashboard/TrackMap";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { surveyProvider } from "@/services/survey";
import type { SurveyRecord } from "@/services/survey";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Surveys — HydroSentry" },
      {
        name: "description",
        content:
          "Run new sonar surveys, open existing results, and inspect acoustic contact detections.",
      },
    ],
  }),
  component: Dashboard,
});

type WorkspaceState = "gateway" | "setup" | "processing" | "results";

// ── Small shared Panel wrapper ─────────────────────────────────────
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
      className={cn("flex flex-col card-elevated min-h-0", className)}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
        borderRadius: "var(--radius)",
      }}
    >
      <div
        className="shrink-0 px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--border-default)", background: "var(--bg-surface)" }}
      >
        <p className="eyebrow">{title}</p>
      </div>
      <div className="flex-1 p-3.5 overflow-y-auto min-h-0">{children}</div>
    </section>
  );
}

// ── Gateway ────────────────────────────────────────────────────────
function Gateway({
  onNew,
  onOpen,
}: {
  onNew: () => void;
  onOpen: (s: SurveyRecord) => void;
}) {
  const surveys = surveyProvider.getAll();

  function formatTs(ts: number) {
    return new Date(ts).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return (
    <div className="mx-auto max-w-[1400px] w-full px-6 pt-8 pb-16 flex-1 flex flex-col fade-up">
      {/* Header */}
      <div className="pb-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <p className="eyebrow">Survey Gateway</p>
        <h1
          className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Sonar Survey Workspace
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Start a new acoustic survey analysis or continue from a previous mission run.
        </p>
      </div>

      {/* Action cards — side by side in perfect 2-column layout */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Start New Analysis */}
        <button
          type="button"
          onClick={onNew}
          className="flex flex-col justify-between gap-4 p-6 text-left transition-all duration-150 hover:shadow-md cursor-pointer group"
          style={{
            background: "var(--bg-surface)",
            border: "2px solid var(--accent-primary)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div>
            <div className="flex items-center justify-between w-full mb-3">
              <span
                className="font-mono text-[10px] font-bold px-2.5 py-1 rounded text-white tracking-wider"
                style={{ background: "var(--accent-primary)" }}
              >
                + NEW SURVEY
              </span>
              <span
                className="font-mono text-[12px] font-semibold transition-transform group-hover:translate-x-1"
                style={{ color: "var(--accent-primary)" }}
              >
                Configure Parameters →
              </span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Start New Analysis
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 6 }}>
              Upload a side-scan sonar acoustic frame (.png, .jpg, .tif), configure detection confidence thresholds, and trigger automated anomaly detection.
            </p>
          </div>
          <div
            className="pt-3 flex items-center gap-2 font-mono text-[11px]"
            style={{ borderTop: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}
          >
            <span>Supports standard bathymetric image formats</span>
          </div>
        </button>

        {/* 2. Open Last Survey */}
        <button
          type="button"
          onClick={() => surveys.length > 0 && onOpen(surveys[0]!)}
          disabled={surveys.length === 0}
          className="flex flex-col justify-between gap-4 p-6 text-left transition-all duration-150 hover:shadow-md cursor-pointer disabled:opacity-50 group"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div>
            <div className="flex items-center justify-between w-full mb-3">
              <span
                className="font-mono text-[10px] font-bold px-2.5 py-1 rounded tracking-wider"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-secondary)",
                }}
              >
                OPEN EXISTING
              </span>
              {surveys.length > 0 && (
                <span
                  className="font-mono text-[12px] font-semibold transition-transform group-hover:translate-x-1"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Resume Mission →
                </span>
              )}
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Open Last Survey
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 6 }}>
              {surveys.length > 0
                ? `Resume: ${surveys[0]!.name} (${surveys[0]!.result.summary.total_detections} contacts flagged in ${surveys[0]!.region ?? "active region"}).`
                : "No active surveys run yet. Start a new analysis to create the first survey record."}
            </p>
          </div>
          <div
            className="pt-3 flex items-center justify-between font-mono text-[11px]"
            style={{ borderTop: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}
          >
            <span>{surveys.length > 0 ? `Timestamp: ${formatTs(surveys[0]!.timestamp)}` : "Standby"}</span>
          </div>
        </button>
      </div>

      {/* Recent surveys list — full width below the action cards */}
      {surveys.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-[12px] font-semibold uppercase tracking-wider font-mono"
              style={{ color: "var(--text-secondary)" }}
            >
              Recent Surveys ({surveys.length})
            </h2>
            <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              Click any mission to inspect evidence, tracks & contacts
            </span>
          </div>

          <div
            className="overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {surveys.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onOpen(s)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-surface-sunken)]/70 cursor-pointer"
                style={{
                  borderBottom: i < surveys.length - 1 ? "1px solid var(--border-default)" : "none",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      {s.name}
                    </span>
                    {s.isSample && (
                      <span
                        className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold"
                        style={{
                          background: "var(--bg-surface-sunken)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-tertiary)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        DEMO
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                      marginTop: 3,
                    }}
                  >
                    {s.region ?? "No region"} · {formatTs(s.timestamp)} · {s.result.summary.total_detections} detections · Frame: {s.result.image_id}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold px-3 py-1 rounded shrink-0"
                  style={{
                    background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)",
                    color: "var(--accent-primary)",
                  }}
                >
                  Open Workspace →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prototype indicator */}
      <p
        className="mt-8 font-mono text-[10px] text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        PROTOTYPE DATA — MOCK PROVIDER
      </p>
    </div>
  );
}

// ── Setup form ─────────────────────────────────────────────────────
function SetupForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (params: {
    name: string;
    file: File | null;
    region: string;
    description: string;
    threshold: number;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [threshold, setThreshold] = useState(0.25);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = name.trim().length > 0 && file !== null;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  return (
    <div className="mx-auto max-w-[680px] w-full px-6 pt-8 pb-16 fade-up">
      {/* Back */}
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1.5 mb-6 transition-opacity hover:opacity-70 cursor-pointer"
        style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Surveys
      </button>

      <p className="eyebrow">New Survey Setup</p>
      <h1
        className="mt-1 text-xl font-bold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        Configure Survey Parameters
      </h1>

      <div className="mt-6 space-y-5">
        {/* Survey name (required) */}
        <div>
          <label
            className="eyebrow block mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Survey Name <span style={{ color: "var(--state-known-confirmed)" }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gulf of Mannar Run #3"
            className="w-full px-3 py-2 outline-none transition-all"
            style={{
              background: "var(--bg-surface-sunken)",
              border: `1px solid ${name.trim() ? "var(--accent-primary)" : "var(--border-default)"}`,
              borderRadius: "var(--radius)",
              fontSize: 13,
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        {/* Sonar file (required) */}
        <div>
          <label className="eyebrow block mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Sonar Frame File <span style={{ color: "var(--state-known-confirmed)" }}>*</span>
          </label>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="surface-sunken flex cursor-pointer flex-col items-center justify-center gap-2 px-4 py-6 text-center transition-all"
            style={{
              border: `1px dashed ${dragging ? "var(--accent-primary)" : file ? "var(--accent-primary)" : "var(--border-default)"}`,
              borderRadius: "var(--radius)",
              background: "var(--bg-surface-sunken)",
            }}
          >
            <UploadCloud
              className="h-5 w-5"
              strokeWidth={1.5}
              style={{ color: file ? "var(--accent-primary)" : "var(--text-secondary)" }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
              {file ? file.name : "Drop a sonar frame or click to browse"}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-secondary)" }}>
              .png · .jpg · .tif
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </label>
        </div>

        {/* Region (optional) */}
        <div>
          <label className="eyebrow block mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Region <span style={{ color: "var(--text-tertiary)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. Gulf of Mannar, TN"
            className="w-full px-3 py-2 outline-none transition-all"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius)",
              fontSize: 13,
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        {/* Description (optional) */}
        <div>
          <label className="eyebrow block mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Description <span style={{ color: "var(--text-tertiary)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief notes about this survey run…"
            rows={3}
            className="w-full px-3 py-2 outline-none resize-none transition-all"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius)",
              fontSize: 13,
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        {/* Threshold */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="eyebrow" style={{ color: "var(--text-secondary)" }}>
              Confidence Threshold
            </label>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {threshold.toFixed(2)}
            </span>
          </div>
          <Slider
            min={0}
            max={0.95}
            step={0.05}
            value={[threshold]}
            onValueChange={(v) => setThreshold(v[0] ?? 0)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 font-medium transition-colors cursor-pointer"
            style={{
              borderRadius: "var(--radius)",
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit({ name: name.trim(), file, region: region.trim(), description: description.trim(), threshold })}
            className="flex-1 h-10 inline-flex items-center justify-center gap-2 font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
            style={{
              borderRadius: "var(--radius)",
              background: "var(--accent-primary)",
              color: "var(--accent-primary-fg)",
              fontSize: 13,
            }}
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2} />
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Processing indicator ───────────────────────────────────────────
function Processing() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 fade-up">
      <Loader2
        className="h-8 w-8 animate-spin"
        style={{ color: "var(--accent-primary)" }}
        strokeWidth={1.5}
      />
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "0.05em",
        }}
      >
        ANALYZING SONAR FRAME…
      </p>
      <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        Running acoustic contact detection. Please wait.
      </p>
    </div>
  );
}

// ── Results workspace ──────────────────────────────────────────────
function ResultsWorkspace({
  survey,
  onBack,
}: {
  survey: SurveyRecord;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [enhanced, setEnhanced] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { result } = survey;
  const summary = result.summary;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Sub-header bar */}
      <div
        className="shrink-0"
        style={{
          borderBottom: "1px solid var(--border-default)",
          background: "var(--bg-surface)",
        }}
      >
        <div className="mx-auto max-w-[1400px] w-full flex flex-wrap items-center justify-between gap-3 px-6 py-2">
          {/* Left: back + survey name */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-70 cursor-pointer"
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Surveys
            </button>
            <span style={{ color: "var(--border-strong)", userSelect: "none" }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {survey.name}
            </span>
            {survey.isSample && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold"
                style={{
                  background: "#FEF3C7",
                  border: "1px solid #F59E0B",
                  color: "#92400E",
                  letterSpacing: "0.04em",
                }}
              >
                <FlaskConical className="h-3 w-3" strokeWidth={2} />
                DEMO METADATA
              </span>
            )}
          </div>

          {/* Right: telemetry chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1 rounded"
              style={{ background: "var(--bg-surface-sunken)", border: "1px solid var(--border-default)" }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
                FRAME
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                {result.image_id}
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1 rounded"
              style={{ background: "var(--bg-surface-sunken)", border: "1px solid var(--border-default)" }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
                INFERENCE
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--accent-primary)" }}>
                {result.processing_time_ms} ms
              </span>
            </div>
            <button
              type="button"
              onClick={() => void navigate({ to: "/metrics", search: { id: survey.id } })}
              className="h-8 px-4 inline-flex items-center gap-1.5 font-semibold transition-opacity hover:opacity-85 cursor-pointer"
              style={{
                borderRadius: "var(--radius)",
                background: "var(--accent-primary)",
                color: "var(--accent-primary-fg)",
                fontSize: 12,
                fontFamily: "var(--font-sans)",
              }}
            >
              View Report →
            </button>
          </div>
        </div>
      </div>

      {/* 3-column evidence workspace */}
      <main className="mx-auto max-w-[1400px] w-full px-6 py-4 grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_340px] xl:grid-cols-[280px_minmax(0,1fr)_360px] min-h-0">
        {/* Left — Legend + metadata */}
        <Panel title="Survey Details" className="analysis-col">
          {/* Survey metadata */}
          <div className="space-y-3 text-[12px]">
            {[
              { label: "Survey", value: survey.name },
              { label: "Region", value: survey.region ?? "Not specified" },
              { label: "Threshold", value: survey.threshold.toFixed(2) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="eyebrow">{label}</p>
                <p style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: 2 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Acoustic contact legend */}
          <div className="mt-6 space-y-2 pt-4" style={{ borderTop: "1px solid var(--border-default)" }}>
            <p className="eyebrow">Acoustic Contact Legend</p>
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-xs bg-[#B3261E]" />
                <span style={{ color: "var(--text-primary)" }}>Red — Confirmed Threat (Mine)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-xs bg-[#2563A6]" />
                <span style={{ color: "var(--text-primary)" }}>Blue — Classified Benign</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-xs bg-[#C2600A]" />
                <span style={{ color: "var(--text-primary)" }}>Orange — Caution / Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-xs border border-dashed border-[#5B5F7A] bg-[#5B5F7A]/30" />
                <span style={{ color: "var(--text-primary)" }}>Dashed — Unclassified Anomaly</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Center — Sonar canvas (evidence-first / greatest weight) */}
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

          <SonarCanvas
            detections={result.detections}
            enhanced={enhanced}
            seed={result.image_id}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {result.detections.length === 0 && (
            <p className="mt-3" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
              Frame clear — no contacts above threshold.
            </p>
          )}
        </Panel>

        {/* Right — Contact feed + tactical track */}
        <Panel title="Contact Feed & Tactical Track">
          {/* Summary metrics */}
          <div
            className="grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius)]"
            style={{ border: "1px solid var(--border-default)", background: "var(--border-default)" }}
          >
            {[
              { label: "Known",        value: summary.known_count,             color: "var(--state-classified-benign)" },
              { label: "Unclassified", value: summary.unknown_anomaly_count,   color: "var(--state-unclassified)" },
              { label: "FP Filtered",  value: summary.false_positives_filtered, color: "var(--state-muted-meta)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="px-2 py-3 text-center" style={{ background: "var(--bg-surface)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}>
                  {value}
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
            {result.detections.length === 0 ? (
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
            ) : (
              result.detections.map((d, idx) => (
                <div key={d.id} className={`fade-up stagger-${Math.min(idx + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}>
                  <DetectionCard
                    detection={d}
                    active={selectedId === d.id}
                    onSelect={() => setSelectedId(d.id)}
                  />
                </div>
              ))
            )}
          </div>

          {/* Tactical track map */}
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border-default)" }}>
            <p className="eyebrow mb-2">Tactical Survey Track</p>
            <TrackMap
              detections={result.detections}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </Panel>
      </main>
    </div>
  );
}

// ── Root Dashboard component ───────────────────────────────────────
function Dashboard() {
  const [state, setState] = useState<WorkspaceState>("gateway");
  const [activeSurvey, setActiveSurvey] = useState<SurveyRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check URL param ?id= for direct deep-link into a survey result
  const search = Route.useSearch() as Record<string, string | undefined>;
  const deepLinkId = search.id as string | undefined;

  useEffect(() => {
    if (deepLinkId) {
      const s = surveyProvider.getById(deepLinkId);
      if (s) {
        setActiveSurvey(s);
        setState("results");
      }
    }
  }, [deepLinkId]);

  async function handleSubmit(params: {
    name: string;
    file: File | null;
    region: string;
    description: string;
    threshold: number;
  }) {
    setState("processing");
    setError(null);
    try {
      const record = await surveyProvider.create({
        name: params.name,
        file: params.file,
        region: params.region || undefined,
        description: params.description || undefined,
        threshold: params.threshold,
      });
      setActiveSurvey(record);
      setState("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed");
      setState("setup");
    }
  }

  return (
    /* Guardrail: data-dense console — gradient-mesh on shell only, do NOT add grid-field dot texture here */
    <div className="flex min-h-screen flex-col gradient-mesh">
      <SiteHeader />

      {/* flex-1 wrapper so child states always start from just below the header */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div
            className="mx-auto max-w-[640px] w-full mt-4 px-6 flex gap-2 p-3"
            style={{
              border: "1px solid var(--border-default)",
              borderLeftWidth: 3,
              borderLeftColor: "var(--state-known-confirmed)",
              borderRadius: "var(--radius)",
              fontSize: 12,
              color: "var(--text-secondary)",
              background: "var(--bg-surface-sunken)",
            }}
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} style={{ color: "var(--state-known-confirmed)" }} />
            <span>{error}</span>
          </div>
        )}

        {state === "gateway" && (
          <Gateway
            onNew={() => setState("setup")}
            onOpen={(s) => { setActiveSurvey(s); setState("results"); }}
          />
        )}

        {state === "setup" && (
          <SetupForm
            onCancel={() => setState("gateway")}
            onSubmit={handleSubmit}
          />
        )}

        {state === "processing" && <Processing />}

        {state === "results" && activeSurvey && (
          <ResultsWorkspace
            survey={activeSurvey}
            onBack={() => setState("gateway")}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="shrink-0" style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
        <div
          className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-3"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}
        >
          <span>HydroSentry · Survey Workspace</span>
          <span>Ministry of Earth Sciences · SIH Project</span>
        </div>
      </footer>
    </div>
  );
}

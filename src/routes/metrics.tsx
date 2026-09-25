import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SonarCanvas } from "@/components/dashboard/SonarCanvas";
import { PriorityBadge } from "@/components/dashboard/PriorityBadge";
import { surveyProvider } from "@/services/survey";
import type { SurveyRecord } from "@/services/survey";
import { isLiveMode, getAnnotatedImageUrl } from "@/services/detection";
import { FileText, Loader2, MapPin } from "lucide-react";
import { exportPdf } from "@/services/report/pdfExport";
import { DetectionPerformance } from "@/components/dashboard/DetectionPerformance";
import { TrackMap } from "@/components/dashboard/TrackMap";
import { isAuthenticated } from "@/services/auth/authService";
import { triggerAuthModal } from "@/context/AuthModalContext";

// Search params schema (TanStack Router v1)
export const Route = createFileRoute("/metrics")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reports — HydroSentry" },
      {
        name: "description",
        content:
          "Detailed survey report: findings table, sonar evidence, and export.",
      },
    ],
  }),
  component: Reports,
});

function formatTs(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function Reports() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();

  useEffect(() => {
    if (!isAuthenticated()) {
      void navigate({ to: "/" });
      triggerAuthModal({
        targetPath: id ? `/metrics?id=${id}` : "/metrics",
        reason: "Authentication required to access Intelligence Reports. Please sign in to continue.",
      });
    }
  }, [navigate, id]);

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [enhanced, setEnhanced] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isAuthenticated()) {
    return null;
  }

  async function handleExportPdf(s: SurveyRecord) {
    setGeneratingPdf(true);
    try {
      await exportPdf(s);
    } finally {
      setGeneratingPdf(false);
    }
  }

  // Resolve survey: from ?id param, or fallback to most recent
  const allSurveys = surveyProvider.getAll();
  const survey: SurveyRecord | null =
    id ? surveyProvider.getById(id) : (allSurveys[0] ?? null);

  if (!survey) {
    return (
      /* Guardrail: data-dense console — gradient-mesh on shell only, do NOT add grid-field dot texture here */
      <div className="flex min-h-screen flex-col gradient-mesh">
        <SiteHeader />
        <main className="mx-auto max-w-[1400px] w-full px-6 py-20 flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            No survey data available.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Run a survey first to generate a report.
          </p>
          <Link
            to="/surveys"
            className="mt-2 inline-flex h-10 items-center justify-center px-5 font-semibold transition-opacity hover:opacity-90"
            style={{
              borderRadius: "var(--radius)",
              background: "var(--accent-primary)",
              color: "var(--accent-primary-fg)",
              fontSize: 13,
            }}
          >
            Go to Surveys
          </Link>
        </main>
      </div>
    );
  }

  const { result } = survey;

  return (
    /* Guardrail: data-dense console — gradient-mesh on shell only, do NOT add grid-field dot texture here */
    <div className="flex min-h-screen flex-col gradient-mesh">
      <SiteHeader />

      <main
        className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 pt-4 pb-4 flex-1 flex flex-col gap-3.5 fade-up min-h-0"
      >
        {/* ── Page header with survey selector ──────────────── */}
        <div className="shrink-0 pb-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <p className="eyebrow">Survey Report</p>
                <span
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    background: isLiveMode()
                      ? "color-mix(in srgb, var(--accent-primary) 12%, transparent)"
                      : "var(--bg-surface-sunken)",
                    border: `1px solid ${isLiveMode() ? "var(--accent-primary)" : "var(--border-strong)"}`,
                    color: isLiveMode() ? "var(--accent-primary)" : "var(--text-tertiary)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {isLiveMode() ? "LIVE INFERENCE BACKEND" : "MISSION ARCHIVE"}
                </span>
              </div>

              {/* Survey selector dropdown */}
              <div className="flex flex-wrap items-center gap-2 mt-0.5 w-full sm:w-auto">
                <label
                  htmlFor="survey-picker"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.04em",
                  }}
                >
                  MISSION:
                </label>
                <select
                  id="survey-picker"
                  value={survey.id}
                  onChange={(e) => {
                    void navigate({ to: "/metrics", search: { id: e.target.value } });
                  }}
                  className="w-full sm:w-auto max-w-full sm:max-w-[360px]"
                  style={{
                    background: "var(--bg-surface-sunken)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.3rem 0.6rem",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    color: "var(--text-primary)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {allSurveys.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatTs(s.timestamp)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                <span className="flex items-center gap-1 font-medium" style={{ color: "var(--text-primary)" }}>
                  <MapPin size={13} className="text-[var(--accent-primary)] shrink-0" />
                  <span>{survey.locationName || survey.region || "Unspecified Location"}</span>
                </span>
                {survey.location && (
                  <span
                    className="font-mono text-[11px] px-2 py-0.5 rounded"
                    style={{
                      background: "var(--bg-surface-sunken)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {survey.location.lat.toFixed(5)}°, {survey.location.lon.toFixed(5)}°
                  </span>
                )}
                <span className="text-[var(--text-tertiary)]">·</span>
                <span>{formatTs(survey.timestamp)}</span>
              </div>
            </div>

            {/* Header actions: Tactical Map jump + Export PDF */}
            <div className="flex flex-wrap items-center w-full sm:w-auto justify-end gap-2">
              <a
                href="#tactical-map"
                className="h-9 px-3.5 inline-flex items-center gap-1.5 font-semibold transition-opacity hover:opacity-85 cursor-pointer w-full sm:w-auto justify-center"
                style={{
                  borderRadius: "var(--radius)",
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontFamily: "var(--font-sans)",
                }}
              >
                <MapPin size={13} strokeWidth={2} />
                Tactical Map ↓
              </a>
              <button
                type="button"
                disabled={generatingPdf}
                onClick={() => void handleExportPdf(survey)}
                className="h-9 px-4 font-semibold transition-all cursor-pointer hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 w-full sm:w-auto"
                style={{
                  borderRadius: "var(--radius)",
                  background: "var(--accent-primary)",
                  color: "var(--accent-primary-fg)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
                title="Download official PDF survey report with raw and processed sonar imagery"
              >
                {generatingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                )}
                {generatingPdf ? "Rendering PDF..." : "Export PDF"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Official ML Benchmark Evaluation Performance ─── */}
        <DetectionPerformance className="shrink-0" />

        {/* ── Compact stat strip ───────────────────────── */}
        <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Total Detections", value: result.summary.total_detections,       color: "var(--text-primary)" },
            { label: "Known Contacts",   value: result.summary.known_count,             color: "var(--state-classified-benign)" },
            { label: "Unclassified",     value: result.summary.unknown_anomaly_count,   color: "var(--state-unclassified)" },
            { label: "FP Suppressed",    value: result.summary.false_positives_filtered, color: "var(--state-muted-meta)" },
          ].map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-2 min-w-0"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(18px, 3.5vw, 22px)",
                  fontWeight: 700,
                  color: m.color,
                  lineHeight: 1,
                  minWidth: "2ch",
                }}
              >
                {m.value}
              </span>
              <span
                className="truncate"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  lineHeight: 1.25,
                }}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Two-pane: findings table (left) + sonar canvas (right) ── */}
        <div
          className="flex-1 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 min-h-0"
        >
          {/* Left — Findings table */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2
                className="text-[11px] font-semibold uppercase tracking-wider font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                Findings ({result.detections.length})
              </h2>
              <span className="sm:hidden font-mono text-[9.5px] text-[var(--text-tertiary)]">
                ← swipe to view columns →
              </span>
            </div>
            {result.detections.length === 0 ? (
              <p
                className="p-4"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                No detections above the YOLO confidence floor for this survey.
              </p>
            ) : (
              <div
                className="flex-1 overflow-auto table-scroll-container"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <table className="w-full text-left min-w-[620px]">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--bg-surface-sunken)" }}>
                      {["Contact ID", "Type", "Class", "Source", "Priority", "Det. Conf.", "Anomaly", "Coordinates"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5"
                          style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-tertiary)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.detections.map((d, i) => {
                      const typeLabel = d.type === "known" ? "Known Object" : "Unknown Anomaly";
                      const rawClass = d.class_name ?? d.class;
                      const classLabel = rawClass ? rawClass.toUpperCase() : "—";
                      const rawSrc =
                        d.src ??
                        d.source ??
                        (d.type === "unknown_anomaly" || d.detector_confidence === null
                          ? "patchcore_only"
                          : d.anomaly_score > 0.35
                          ? "both"
                          : "yolo_only");
                      const sourceLabel =
                        rawSrc === "both" ? "Both" : rawSrc === "yolo_only" ? "YOLO Only" : "PatchCore Only";
                      const bucket =
                        d.bucket ??
                        (d.priority === "high_priority"
                          ? "HIGH"
                          : d.priority === "review_required"
                          ? "REVIEW"
                          : d.priority === "low_priority"
                          ? "REJECT"
                          : "NORMAL");
                      const detConf =
                        d.detector_confidence !== null && d.detector_confidence !== undefined
                          ? `${Math.round(d.detector_confidence * 100)}%`
                          : d.yolo_confidence !== null && d.yolo_confidence !== undefined
                          ? `${Math.round(d.yolo_confidence * 100)}%`
                          : "—";
                      const coordinates =
                        d.location && typeof d.location.lat === "number" && typeof d.location.lon === "number"
                          ? `${d.location.lat.toFixed(4)}°, ${d.location.lon.toFixed(4)}°`
                          : "—";

                      return (
                        <tr
                          key={d.id}
                          onClick={() => setSelectedId(d.id)}
                          className="cursor-pointer transition-colors hover:bg-[var(--bg-surface-sunken)]"
                          style={{
                            borderBottom: i < result.detections.length - 1 ? "1px solid var(--border-default)" : "none",
                            background: selectedId === d.id ? "rgba(37, 99, 235, 0.08)" : undefined,
                          }}
                        >
                          <td className="px-3 py-2.5">
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                              {d.id}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                              {classLabel}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                              style={{
                                background:
                                  rawSrc === "both"
                                    ? "rgba(37, 99, 235, 0.12)"
                                    : rawSrc === "yolo_only"
                                    ? "rgba(201, 161, 90, 0.18)"
                                    : "rgba(100, 116, 139, 0.15)",
                                color:
                                  rawSrc === "both"
                                    ? "#2563EB"
                                    : rawSrc === "yolo_only"
                                    ? "#C9A15A"
                                    : "var(--text-secondary)",
                              }}
                            >
                              {sourceLabel}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                              style={{
                                background:
                                  bucket === "HIGH"
                                    ? "rgba(220, 38, 38, 0.15)"
                                    : bucket === "REVIEW"
                                    ? "rgba(217, 119, 6, 0.15)"
                                    : "rgba(100, 116, 139, 0.12)",
                                color:
                                  bucket === "HIGH"
                                    ? "#DC2626"
                                    : bucket === "REVIEW"
                                    ? "#D97706"
                                    : "var(--text-tertiary)",
                              }}
                            >
                              {bucket}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                              {detConf}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                              {d.anomaly_score.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                              {coordinates}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right — Sonar canvas + survey metadata */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h2
                  className="shrink-0 text-[11px] font-semibold uppercase tracking-wider font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Target Evidence — Sonar Frame
                </h2>
                <div className="flex items-center gap-1.5">
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
                          padding: "2px 8px",
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
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
              </div>
              <div
                className="flex-1 p-3 overflow-hidden flex flex-col justify-center"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <SonarCanvas
                  detections={result.detections}
                  enhanced={enhanced}
                  seed={result.image_id}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  imageUrl={survey.imageUrl || (isLiveMode() ? getAnnotatedImageUrl(result.image_id) : undefined)}
                />
                {result.detections.length === 0 && (
                  <p
                    className="mt-2.5 text-center"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--state-classified-benign)",
                    }}
                  >
                    ✓ Baseline verified — zero contacts detected above operational threshold.
                  </p>
                )}
              </div>
            </div>

            {/* Survey metadata key-value panel */}
            <div
              className="shrink-0 px-4 py-2.5"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius)",
              }}
            >
              <p className="eyebrow mb-1.5">Survey Metadata</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                {[
                  { label: "Frame ID",         value: result.image_id },
                  { label: "Inference",        value: `${result.processing_time_ms} ms` },
                  { label: "YOLO Conf. Floor", value: `${(survey.threshold * 100).toFixed(0)}% (0.25)` },
                  { label: "Location",         value: survey.locationName || survey.region || "Not specified" },
                  { label: "Coordinates",      value: survey.location ? `${survey.location.lat.toFixed(5)}°, ${survey.location.lon.toFixed(5)}°` : "Not georeferenced" },
                  { label: "Description",      value: survey.description ?? "Not provided" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                      {label}
                    </p>
                    <p className="truncate" style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 1, fontWeight: 500 }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Full-Width Tactical Map Console ────────────────── */}
        <section
          id="tactical-map"
          className="shrink-0 w-full mt-2"
        >
          <div
            className="flex flex-col overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Header */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              style={{
                borderBottom: "1px solid var(--border-default)",
                background: "var(--bg-surface-sunken)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: "var(--text-primary)",
                  }}
                >
                  TACTICAL GEOSPATIAL RECONSTRUCTION // WGS-84 BATHYMETRY
                </span>
                <span
                  className="hidden sm:inline font-mono text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {survey.locationName || survey.region || "SURVEY SECTOR"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>
                <span>
                  PLOTTED TARGETS: <strong style={{ color: "var(--accent-primary)" }}>{result.detections.length}</strong>
                </span>
              </div>
            </div>

            {/* Map canvas */}
            <TrackMap
              detections={result.detections}
              selectedId={selectedId}
              onSelect={setSelectedId}
              height={380}
              showContactList={true}
              region={survey.locationName || survey.region}
              surveyLocation={survey.location}
              surveyName={survey.name}
            />
          </div>
        </section>
      </main>

      <footer className="shrink-0" style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
        <div
          className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}
        >
          <span>HydroSentry · Survey Report</span>
          <span>SIH Project</span>
        </div>
      </footer>
    </div>
  );
}


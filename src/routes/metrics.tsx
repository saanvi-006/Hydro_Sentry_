import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SonarCanvas } from "@/components/dashboard/SonarCanvas";
import { surveyProvider } from "@/services/survey";
import type { SurveyRecord } from "@/services/survey";

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
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function priorityLabel(p: string) {
  switch (p) {
    case "high_priority":   return "CONFIRMED THREAT";
    case "review_required": return "REVIEW REQUIRED";
    case "normal":          return "CLASSIFIED BENIGN";
    default:                return "UNCLASSIFIED";
  }
}

function priorityColor(p: string) {
  switch (p) {
    case "high_priority":   return "var(--state-known-confirmed)";
    case "review_required": return "var(--state-caution)";
    case "normal":          return "var(--state-classified-benign)";
    default:                return "var(--state-unclassified)";
  }
}

function exportJson(survey: SurveyRecord) {
  const blob = new Blob([JSON.stringify(survey, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hydrosentry-${survey.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv(survey: SurveyRecord) {
  const header = ["id", "type", "class", "priority", "operational_confidence", "detector_confidence", "anomaly_score", "physics_score", "lat", "lon"];
  const rows = survey.result.detections.map((d) => [
    d.id,
    d.type,
    d.class ?? "",
    d.priority,
    d.operational_confidence,
    d.detector_confidence ?? "",
    d.anomaly_score,
    d.physics_score,
    d.location?.lat ?? "",
    d.location?.lon ?? "",
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hydrosentry-${survey.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Reports() {
  const { id } = Route.useSearch();

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
            to="/dashboard"
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
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden flex-col gradient-mesh">
      <SiteHeader />

      {/* flex-1 + flex-col enables inner panes to use flex-1 / overflow-y-auto within 100vh on laptop */}
      <main
        className="mx-auto max-w-[1400px] w-full px-6 pt-6 pb-3 flex-1 flex flex-col gap-4 fade-up min-h-0"
      >
        {/* ── Page header ──────────────────────────────── */}
        <div className="shrink-0 pb-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="eyebrow">Survey Report</p>
                {/* Prototype indicator — shown once, here */}
                <span
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    background: "var(--bg-surface-sunken)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.05em",
                  }}
                >
                  PROTOTYPE DATA — MOCK PROVIDER
                </span>
              </div>
              <h1
                className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {survey.name}
              </h1>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                {survey.region ?? "Region not specified"} · {formatTs(survey.timestamp)}
              </p>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportCsv(survey)}
                className="h-9 px-4 font-semibold transition-colors cursor-pointer hover:opacity-80"
                style={{
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => exportJson(survey)}
                className="h-9 px-4 font-semibold transition-colors cursor-pointer hover:opacity-80"
                style={{
                  borderRadius: "var(--radius)",
                  background: "var(--accent-primary)",
                  color: "var(--accent-primary-fg)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* ── Compact stat strip ───────────────────────── */}
        <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Detections", value: result.summary.total_detections,       color: "var(--text-primary)" },
            { label: "Known Contacts",   value: result.summary.known_count,             color: "var(--state-classified-benign)" },
            { label: "Unclassified",     value: result.summary.unknown_anomaly_count,   color: "var(--state-unclassified)" },
            { label: "FP Suppressed",    value: result.summary.false_positives_filtered, color: "var(--state-muted-meta)" },
          ].map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-3 px-4 py-3"
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
                  fontSize: 28,
                  fontWeight: 700,
                  color: m.color,
                  lineHeight: 1,
                  minWidth: "2ch",
                }}
              >
                {m.value}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  lineHeight: 1.3,
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
            <h2
              className="shrink-0 mb-2 text-[11px] font-semibold uppercase tracking-wider font-mono"
              style={{ color: "var(--text-secondary)" }}
            >
              Findings
            </h2>
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
                No detections above the confidence threshold for this survey.
              </p>
            ) : (
              <div
                className="flex-1 overflow-y-auto"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <table className="w-full text-left min-w-[520px]">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--bg-surface-sunken)" }}>
                      {["Contact ID", "Type", "Class", "Priority", "Op. Confidence", "Anomaly", "Physics"].map((h) => (
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
                    {result.detections.map((d, i) => (
                      <tr
                        key={d.id}
                        style={{ borderBottom: i < result.detections.length - 1 ? "1px solid var(--border-default)" : "none" }}
                      >
                        <td className="px-3 py-2.5">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                            {d.id}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                            {d.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                            {d.class ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="px-2 py-0.5 rounded font-mono text-[9px] font-bold text-white"
                            style={{ background: priorityColor(d.priority) }}
                          >
                            {priorityLabel(d.priority)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                            {(d.operational_confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                            {d.anomaly_score.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                            {d.physics_score.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right — Sonar canvas + survey metadata */}
          <div className="flex flex-col gap-3 min-h-0">
            {result.detections.length > 0 && (
              <div className="flex flex-col flex-1 min-h-0">
                <h2
                  className="shrink-0 mb-2 text-[11px] font-semibold uppercase tracking-wider font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Target Evidence — Sonar Frame
                </h2>
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
                    enhanced={true}
                    seed={result.image_id}
                    selectedId={null}
                    onSelect={() => {}}
                  />
                </div>
              </div>
            )}

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
                  { label: "Frame ID",    value: result.image_id },
                  { label: "Inference",   value: `${result.processing_time_ms} ms` },
                  { label: "Threshold",   value: survey.threshold.toFixed(2) },
                  { label: "Region",      value: survey.region ?? "Not specified" },
                  { label: "Description", value: survey.description ?? "Not provided" },
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
      </main>

      <footer className="shrink-0" style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
        <div
          className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-3"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}
        >
          <span>HydroSentry · Survey Report</span>
          <span>Ministry of Earth Sciences · SIH Project</span>
        </div>
      </footer>
    </div>
  );
}


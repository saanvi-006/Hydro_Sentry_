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
    <div className="flex min-h-screen flex-col gradient-mesh">
      <SiteHeader />

      <main className="mx-auto max-w-[1400px] w-full px-6 py-10 flex-1 fade-up">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="pb-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
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
                className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {survey.name}
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
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

        {/* ── 1. Survey Summary ────────────────────────────── */}
        <section className="mt-8">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-secondary)" }}>
            Survey Summary
          </h2>
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { label: "Total Detections",  value: result.summary.total_detections,      color: "var(--text-primary)" },
              { label: "Known Contacts",    value: result.summary.known_count,            color: "var(--state-classified-benign)" },
              { label: "Unclassified",      value: result.summary.unknown_anomaly_count,  color: "var(--state-unclassified)" },
              { label: "FP Suppressed",     value: result.summary.false_positives_filtered, color: "var(--state-muted-meta)" },
            ].map((m) => (
              <div
                key={m.label}
                className="p-4 flex flex-col gap-1.5"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                  {m.label}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 30, fontWeight: 700, color: m.color, lineHeight: 1 }}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Survey metadata row */}
          <div
            className="mt-4 flex flex-wrap gap-6 px-4 py-3"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius)",
            }}
          >
            {[
              { label: "Frame ID",   value: result.image_id },
              { label: "Inference",  value: `${result.processing_time_ms} ms` },
              { label: "Threshold",  value: survey.threshold.toFixed(2) },
              { label: "Region",     value: survey.region ?? "Not specified" },
              { label: "Description", value: survey.description ?? "Not provided" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                  {label}
                </p>
                <p style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2, fontWeight: 500 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. Findings Table ────────────────────────────── */}
        <section className="mt-8">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-secondary)" }}>
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
              className="overflow-x-auto"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--bg-surface-sunken)" }}>
                    {["Contact ID", "Type", "Class", "Priority", "Op. Confidence", "Anomaly Score", "Physics Score"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5"
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
                      <td className="px-4 py-2.5">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                          {d.id}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                          {d.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                          {d.class ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="px-2 py-0.5 rounded font-mono text-[9px] font-bold text-white"
                          style={{ background: priorityColor(d.priority) }}
                        >
                          {priorityLabel(d.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                          {(d.operational_confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                          {d.anomaly_score.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
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
        </section>

        {/* ── 3. Target Evidence (Sonar Canvas, read-only) ─── */}
        {result.detections.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-secondary)" }}>
              Target Evidence — Sonar Frame
            </h2>
            <div
              className="p-4"
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
          </section>
        )}


      </main>

      <footer style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
        <div
          className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-4"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}
        >
          <span>HydroSentry · Survey Report</span>
          <span>Ministry of Earth Sciences · SIH Project</span>
        </div>
      </footer>
    </div>
  );
}

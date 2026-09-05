import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { surveyProvider } from "@/services/survey";
import type { SurveyRecord } from "@/services/survey";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Dashboard — HydroSentry" },
      {
        name: "description",
        content: "Read-only overview of all past sonar survey runs, aggregated findings, and priority contacts.",
      },
    ],
  }),
  component: Overview,
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

function priorityColor(p: string) {
  switch (p) {
    case "high_priority":   return "var(--state-known-confirmed)";
    case "review_required": return "var(--state-caution)";
    case "normal":          return "var(--state-classified-benign)";
    default:                return "var(--state-unclassified)";
  }
}

function priorityLabel(p: string) {
  switch (p) {
    case "high_priority":   return "CONFIRMED THREAT";
    case "review_required": return "REVIEW REQUIRED";
    case "normal":          return "CLASSIFIED BENIGN";
    default:                return "UNCLASSIFIED";
  }
}

function Overview() {
  const surveys: SurveyRecord[] = surveyProvider.getAll();

  // Aggregate headline metrics
  const totalSurveys = surveys.length;
  const totalDetections = surveys.reduce((sum, s) => sum + s.result.summary.total_detections, 0);
  const totalFP = surveys.reduce((sum, s) => sum + s.result.summary.false_positives_filtered, 0);

  const allDetections = surveys.flatMap((s) =>
    s.result.detections.map((d) => ({ ...d, surveyName: s.name, surveyId: s.id }))
  );
  const priorityFindings = allDetections.filter((d) => d.priority === "high_priority");

  // Class breakdown across all surveys
  const totalKnown = surveys.reduce((s, r) => s + r.result.summary.known_count, 0);
  const totalUnclassified = surveys.reduce((s, r) => s + r.result.summary.unknown_anomaly_count, 0);

  return (
    /* Guardrail: data-dense console — gradient-mesh on shell only, do NOT add grid-field dot texture here */
    <div className="flex min-h-screen flex-col gradient-mesh">
      <SiteHeader />

      <main className="mx-auto max-w-[1400px] w-full px-6 py-10 flex-1 fade-up">
        {/* Page header */}
        <div className="pb-6" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <p className="eyebrow">Survey Overview · Read-only</p>
          <h1
            className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Dashboard
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed max-w-[600px]" style={{ color: "var(--text-secondary)" }}>
            Aggregated view of all sonar survey runs. Navigate to{" "}
            <Link to="/dashboard" className="underline" style={{ color: "var(--accent-primary)" }}>
              Surveys
            </Link>{" "}
            to start a new analysis.
          </p>
        </div>

        {surveys.length === 0 ? (
          /* ── Empty state ─────────────────────────────── */
          <div
            className="mt-10 flex flex-col items-center justify-center gap-3 p-10 text-center rounded"
            style={{
              background: "var(--bg-surface)",
              border: "1px dashed var(--border-strong)",
              borderRadius: "var(--radius)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              No surveys yet.
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Go to Surveys to run your first analysis.
            </p>
            <Link
              to="/dashboard"
              className="mt-2 inline-flex h-10 items-center justify-center gap-2 px-5 transition-opacity hover:opacity-90"
              style={{
                borderRadius: "var(--radius)",
                background: "var(--accent-primary)",
                color: "var(--accent-primary-fg)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              + New Survey
            </Link>
          </div>
        ) : (
          <>
            {/* ── Headline Metric Cards ─────────────────── */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Surveys Run",       value: totalSurveys,    color: "var(--accent-primary)" },
                { label: "Total Detections",  value: totalDetections, color: "var(--state-classified-benign)" },
                { label: "Priority Findings", value: priorityFindings.length, color: "var(--state-known-confirmed)" },
                { label: "FP Filtered",       value: totalFP,         color: "var(--state-muted-meta)" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="card-elevated p-5 flex flex-col gap-2"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    boxShadow: "var(--shadow-card)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {m.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 34,
                      fontWeight: 700,
                      color: m.color,
                      lineHeight: 1,
                    }}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Detection Class Breakdown ─────────────── */}
            <div className="mt-8">
              <h2
                className="mb-3 text-[13px] font-semibold uppercase tracking-wider font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                Detection Class Breakdown — All Surveys
              </h2>
              <div
                className="grid grid-cols-3 gap-px overflow-hidden"
                style={{
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius)",
                  background: "var(--border-default)",
                }}
              >
                {[
                  { label: "Known",         value: totalKnown,        color: "var(--state-classified-benign)" },
                  { label: "Unclassified",  value: totalUnclassified, color: "var(--state-unclassified)" },
                  { label: "FP Suppressed", value: totalFP,           color: "var(--state-muted-meta)" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="px-4 py-4 text-center"
                    style={{ background: "var(--bg-surface)" }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 28,
                        fontWeight: 700,
                        color,
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </p>
                    <p className="eyebrow mt-1 text-[10px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Recent Surveys Table ──────────────────── */}
            <div className="mt-8">
              <h2
                className="mb-3 text-[13px] font-semibold uppercase tracking-wider font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                Recent Surveys
              </h2>
              <div
                className="overflow-hidden"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--bg-surface-sunken)" }}>
                      {["Survey Name", "Region", "Timestamp", "Detections", "Top Priority", ""].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((s, i) => {
                      const topPriority = s.result.detections.reduce<string | null>((best, d) => {
                        const order = ["high_priority", "review_required", "normal", "low_priority"];
                        if (!best) return d.priority;
                        return order.indexOf(d.priority) < order.indexOf(best) ? d.priority : best;
                      }, null);
                      return (
                        <tr
                          key={s.id}
                          style={{
                            borderBottom: i < surveys.length - 1 ? "1px solid var(--border-default)" : "none",
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
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
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}
                          >
                            {s.region ?? "Not specified"}
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}
                          >
                            {formatTs(s.timestamp)}
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}
                          >
                            {s.result.summary.total_detections}
                          </td>
                          <td className="px-4 py-3">
                            {topPriority ? (
                              <span
                                className="px-2 py-0.5 rounded font-mono text-[10px] font-bold text-white"
                                style={{ background: priorityColor(topPriority) }}
                              >
                                {priorityLabel(topPriority)}
                              </span>
                            ) : (
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to="/metrics"
                              search={{ id: s.id }}
                              className="font-mono text-[11px] font-semibold underline transition-opacity hover:opacity-70"
                              style={{ color: "var(--accent-primary)" }}
                            >
                              Report →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Priority Findings ─────────────────────── */}
            {priorityFindings.length > 0 && (
              <div className="mt-8">
                <h2
                  className="mb-3 text-[13px] font-semibold uppercase tracking-wider font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Priority Findings — All Surveys
                </h2>
                <div className="space-y-2">
                  {priorityFindings.map((d) => (
                    <div
                      key={`${d.surveyId}-${d.id}`}
                      className="flex items-center gap-4 px-4 py-3"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-default)",
                        borderLeft: "3px solid var(--state-known-confirmed)",
                        borderRadius: "var(--radius)",
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      <span
                        className="font-mono text-[10px] font-bold px-2 py-0.5 rounded text-white"
                        style={{ background: "var(--state-known-confirmed)" }}
                      >
                        {d.priority.replace("_", " ").toUpperCase()}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        {d.class ? d.class.toUpperCase() : "UNKNOWN ANOMALY"}
                      </span>
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {d.id}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: "auto" }}>
                        From: {d.surveyName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
        <div
          className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-4"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}
        >
          <span>HydroSentry · Survey Dashboard</span>
          <span>Ministry of Earth Sciences · SIH Project</span>
        </div>
      </footer>
    </div>
  );
}

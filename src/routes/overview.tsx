import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { TrackMap } from "@/components/dashboard/TrackMap";
import { PriorityBadge } from "@/components/dashboard/PriorityBadge";
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
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function Overview() {
  const surveys: SurveyRecord[] = surveyProvider.getAll();

  const [mapExpanded, setMapExpanded] = useState(false);
  const [selectedSurveyFilter, setSelectedSurveyFilter] = useState<string>("all");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Aggregate headline metrics
  const totalSurveys     = surveys.length;
  const totalDetections  = surveys.reduce((sum, s) => sum + s.result.summary.total_detections, 0);
  const totalFP          = surveys.reduce((sum, s) => sum + s.result.summary.false_positives_filtered, 0);
  const allDetections    = surveys.flatMap((s) =>
    s.result.detections.map((d) => ({ ...d, surveyName: s.name, surveyId: s.id }))
  );
  const priorityFindings = allDetections.filter((d) => d.priority === "high_priority");

  // Class breakdown across all surveys
  const totalKnown        = surveys.reduce((s, r) => s + r.result.summary.known_count, 0);
  const totalUnclassified = surveys.reduce((s, r) => s + r.result.summary.unknown_anomaly_count, 0);

  const filteredMapDetections =
    selectedSurveyFilter === "all"
      ? allDetections
      : allDetections.filter((d) => d.surveyId === selectedSurveyFilter);

  const selectedContact = allDetections.find((d) => d.id === selectedContactId) ?? null;

  return (
    /* Guardrail: data-dense console — gradient-mesh on shell only, do NOT add grid-field dot texture here */
    <div className="flex min-h-screen flex-col gradient-mesh">
      <SiteHeader />

      <main className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 pt-4 pb-4 flex-1 flex flex-col gap-3.5 fade-up min-h-0">
        {/* ── Page header ──────────────────────────────────── */}
        <div className="shrink-0 pb-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="eyebrow">Survey Dashboard</p>
                <span
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    background: "var(--bg-surface-sunken)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.05em",
                  }}
                >
                  OVERVIEW · READ-ONLY
                </span>
              </div>
              <h1
                className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Dashboard
              </h1>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                Aggregated telemetry and acoustic detections across past sonar survey runs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="inline-flex h-9 items-center justify-center gap-1.5 px-4 font-semibold transition-opacity hover:opacity-90 cursor-pointer shrink-0 text-xs"
                style={{
                  borderRadius: "var(--radius)",
                  background: "var(--accent-primary)",
                  color: "var(--accent-primary-fg)",
                }}
              >
                + New Survey
              </Link>
            </div>
          </div>
        </div>

        {surveys.length === 0 ? (
          /* ── Empty state ─────────────────────────────────── */
          <div
            className="flex flex-col items-center justify-center gap-3 p-10 text-center rounded"
            style={{
              background: "var(--bg-surface)",
              border: "1px dashed var(--border-strong)",
              borderRadius: "var(--radius)",
            }}
          >
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
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
            {/* ── Compact metric strip (4 chips, horizontal) ─── */}
            <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Surveys Run",       value: totalSurveys,            color: "var(--accent-primary)" },
                { label: "Total Detections",  value: totalDetections,         color: "var(--state-classified-benign)" },
                { label: "Priority Findings", value: priorityFindings.length, color: "var(--state-known-confirmed)" },
                { label: "FP Filtered",       value: totalFP,                 color: "var(--state-muted-meta)" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="flex items-center gap-3 px-4 py-2.5"
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
                      fontSize: 24,
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

            {/* ── Two-pane area ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
              {/* Left pane — Recent Surveys table (increased row length / 2-tier metadata) */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-wider font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Recent Surveys ({surveys.length})
                  </h2>
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Sorted by most recent
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
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border-default)",
                          background: "var(--bg-surface-sunken)",
                        }}
                      >
                        <th
                          className="px-3.5 py-2 text-left font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]"
                        >
                          Survey Details
                        </th>
                        <th
                          className="px-3 py-2 text-center font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] whitespace-nowrap"
                        >
                          Top Priority
                        </th>
                        <th
                          className="px-3.5 py-2 text-right font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] whitespace-nowrap"
                        >
                          Report
                        </th>
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
                            className="transition-colors hover:bg-[var(--bg-surface-sunken)]/60"
                            style={{
                              borderBottom: i < surveys.length - 1 ? "1px solid var(--border-default)" : "none",
                            }}
                          >
                            <td className="px-3.5 py-2.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[13px] font-semibold"
                                  style={{ color: "var(--text-primary)" }}
                                  title={s.name}
                                >
                                  {s.name}
                                </span>
                                {s.isSample && (
                                  <span
                                    className="px-1.5 py-0.2 rounded font-mono text-[8.5px] font-bold shrink-0"
                                    style={{
                                      background: "var(--bg-surface-sunken)",
                                      border: "1px solid var(--border-strong)",
                                      color: "var(--text-tertiary)",
                                      letterSpacing: "0.04em",
                                    }}
                                  >
                                    DEMO
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-mono text-[var(--text-secondary)]">
                                <span>{s.region ?? "Not specified"}</span>
                                <span className="text-[var(--text-tertiary)]">·</span>
                                <span>{formatTs(s.timestamp)}</span>
                                <span className="text-[var(--text-tertiary)]">·</span>
                                <span className="text-[var(--text-primary)] font-semibold">
                                  {s.result.summary.total_detections} contacts
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              {topPriority ? (
                                <PriorityBadge priority={topPriority} />
                              ) : (
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                              <Link
                                to="/metrics"
                                search={{ id: s.id }}
                                className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[11px] font-semibold px-2.5 py-1 rounded transition-all hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-fg)] cursor-pointer"
                                style={{
                                  color: "var(--accent-primary)",
                                  background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
                                  border: "1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)",
                                }}
                              >
                                <span>Report</span>
                                <span className="text-[12px] leading-none" aria-hidden="true">→</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right pane — Class breakdown + Priority findings (fully visible content) */}
              <div className="flex flex-col gap-3 min-w-0">
                {/* Detection class breakdown */}
                <div>
                  <h2
                    className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Detection Class Breakdown
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
                      { label: "Known",         value: totalKnown,         color: "var(--state-classified-benign)" },
                      { label: "Unclassified",  value: totalUnclassified,  color: "var(--state-unclassified)" },
                      { label: "FP Suppressed", value: totalFP,            color: "var(--state-muted-meta)" },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="px-3 py-2 text-center"
                        style={{ background: "var(--bg-surface)" }}
                      >
                        <p
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 22,
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

                {/* Priority findings — full text visibility */}
                {priorityFindings.length > 0 && (
                  <div>
                    <h2
                      className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider font-mono"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Priority Findings ({priorityFindings.length})
                    </h2>
                    <div className="space-y-2">
                      {priorityFindings.map((d) => (
                        <div
                          key={`${d.surveyId}-${d.id}`}
                          className="flex items-center gap-3 px-3 py-2 transition-all hover:shadow-xs min-w-0"
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-default)",
                            borderLeft: "3px solid var(--state-known-confirmed)",
                            borderRadius: "var(--radius)",
                            boxShadow: "var(--shadow-card)",
                          }}
                        >
                          <PriorityBadge priority={d.priority} />
                          <span
                            className="text-[12px] font-semibold whitespace-nowrap"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {d.class ? d.class.toUpperCase() : "UNKNOWN ANOMALY"}
                          </span>
                          <span
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shrink-0"
                            style={{
                              background: "var(--bg-surface-sunken)",
                              border: "1px solid var(--border-default)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {d.id}
                          </span>
                          <span
                            className="text-[11px] text-[var(--text-tertiary)] ml-auto whitespace-nowrap"
                            title={d.surveyName}
                          >
                            {d.surveyName.replace("Demo Survey — ", "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Collapsible Tactical Geospatial Map (Very last section) ── */}
            <div
              className="overflow-hidden transition-all duration-200"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* Collapsible header bar */}
              <button
                type="button"
                onClick={() => setMapExpanded(!mapExpanded)}
                className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--bg-surface-sunken)]/50 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center h-6 w-6 rounded shrink-0"
                    style={{
                      background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-[11px] font-bold tracking-tight"
                        style={{ color: "var(--text-primary)" }}
                      >
                        TACTICAL GEOSPATIAL MAP
                      </span>
                      <span
                        className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--bg-surface-sunken)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        WGS-84 GRID
                      </span>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: "var(--text-secondary)", marginTop: 1 }}>
                      {allDetections.length} georeferenced contacts across {surveys.length} survey sectors
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-[10.5px] font-semibold px-2.5 py-1 rounded inline-flex items-center gap-1"
                    style={{
                      background: mapExpanded ? "var(--accent-primary)" : "var(--bg-surface-sunken)",
                      color: mapExpanded ? "var(--accent-primary-fg)" : "var(--accent-primary)",
                      border: "1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)",
                    }}
                  >
                    {mapExpanded ? (
                      <>
                        <span>Collapse Map</span>
                        <ChevronUp className="h-3 w-3" strokeWidth={2} />
                      </>
                    ) : (
                      <>
                        <span>Expand Map</span>
                        <ChevronDown className="h-3 w-3" strokeWidth={2} />
                      </>
                    )}
                  </span>
                </div>
              </button>

              {/* Enlarged Map Body */}
              {mapExpanded && (
                <div
                  className="p-3.5 space-y-3"
                  style={{
                    borderTop: "1px solid var(--border-default)",
                    background: "var(--bg-surface)",
                  }}
                >
                  {/* Filter selector strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[9.5px] text-[var(--text-tertiary)] uppercase tracking-wider mr-1">
                        Sector Filter:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSurveyFilter("all")}
                        className="px-2.5 py-0.5 rounded font-mono text-[10px] font-semibold transition-colors cursor-pointer"
                        style={{
                          background: selectedSurveyFilter === "all" ? "var(--accent-primary)" : "var(--bg-surface-sunken)",
                          color: selectedSurveyFilter === "all" ? "var(--accent-primary-fg)" : "var(--text-secondary)",
                          border: `1px solid ${selectedSurveyFilter === "all" ? "var(--accent-primary)" : "var(--border-default)"}`,
                        }}
                      >
                        All Sectors ({allDetections.length})
                      </button>
                      {surveys.map((s) => {
                        const count = s.result.detections.length;
                        const active = selectedSurveyFilter === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedSurveyFilter(s.id)}
                            className="px-2.5 py-0.5 rounded font-mono text-[10px] font-semibold transition-colors cursor-pointer"
                            style={{
                              background: active ? "var(--accent-primary)" : "var(--bg-surface-sunken)",
                              color: active ? "var(--accent-primary-fg)" : "var(--text-secondary)",
                              border: `1px solid ${active ? "var(--accent-primary)" : "var(--border-default)"}`,
                            }}
                          >
                            {s.name.replace("Demo Survey — ", "")} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {selectedContact && (
                      <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-[var(--bg-surface-sunken)] border border-[var(--border-default)]">
                        <span className="font-mono text-[9.5px] text-[var(--text-tertiary)]">SELECTED:</span>
                        <span className="font-mono text-[10.5px] font-bold text-[var(--text-primary)]">
                          {selectedContact.id}
                        </span>
                        <span className="text-[10.5px] text-[var(--text-secondary)]">
                          ({selectedContact.class ?? "Anomaly"})
                        </span>
                        <Link
                          to="/metrics"
                          search={{ id: selectedContact.surveyId }}
                          className="font-mono text-[9.5px] text-[var(--accent-primary)] underline hover:opacity-80 ml-1"
                        >
                          View Report →
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Render TrackMap */}
                  <TrackMap
                    detections={filteredMapDetections}
                    selectedId={selectedContactId}
                    onSelect={setSelectedContactId}
                    height={280}
                    showContactList={true}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="shrink-0" style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
        <div
          className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-3"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}
        >
          <span>HydroSentry · Survey Dashboard</span>
          <span>SIH Project</span>
        </div>
      </footer>
    </div>
  );
}

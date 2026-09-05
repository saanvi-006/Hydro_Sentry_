import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { TrackMap } from "@/components/dashboard/TrackMap";
import { surveyProvider } from "@/services/survey";
import type { SurveyRecord } from "@/services/survey";
import { cn } from "@/lib/utils";

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

function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  switch (priority) {
    case "high_priority":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold whitespace-nowrap shrink-0",
            className
          )}
          style={{
            background: "color-mix(in srgb, var(--state-known-confirmed) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--state-known-confirmed) 40%, transparent)",
            color: "var(--state-known-confirmed)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: "var(--state-known-confirmed)",
              boxShadow: "0 0 4px var(--state-known-confirmed)",
            }}
          />
          CONFIRMED THREAT
        </span>
      );
    case "review_required":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold whitespace-nowrap shrink-0",
            className
          )}
          style={{
            background: "color-mix(in srgb, var(--state-caution) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--state-caution) 40%, transparent)",
            color: "var(--state-caution)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: "var(--state-caution)",
              boxShadow: "0 0 4px var(--state-caution)",
            }}
          />
          REVIEW REQUIRED
        </span>
      );
    case "normal":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold whitespace-nowrap shrink-0",
            className
          )}
          style={{
            background: "color-mix(in srgb, var(--state-classified-benign) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--state-classified-benign) 40%, transparent)",
            color: "var(--state-classified-benign)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: "var(--state-classified-benign)",
              boxShadow: "0 0 4px var(--state-classified-benign)",
            }}
          />
          CLASSIFIED BENIGN
        </span>
      );
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold whitespace-nowrap shrink-0",
            className
          )}
          style={{
            background: "color-mix(in srgb, var(--state-unclassified) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--state-unclassified) 40%, transparent)",
            color: "var(--state-unclassified)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: "var(--state-unclassified)",
            }}
          />
          UNCLASSIFIED
        </span>
      );
  }
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

      <main className="mx-auto max-w-[1400px] w-full px-6 pt-6 pb-6 flex-1 flex flex-col gap-4 fade-up">
        {/* ── Page header ──────────────────────────────────── */}
        <div className="shrink-0 pb-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Survey Overview · Read-only</p>
              <h1
                className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Dashboard
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                Aggregated view of all sonar survey runs. Review missions, acoustic detections, and priority contacts.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex h-9 items-center justify-center gap-2 px-4 font-semibold transition-opacity hover:opacity-90 cursor-pointer shrink-0"
              style={{
                borderRadius: "var(--radius)",
                background: "var(--accent-primary)",
                color: "var(--accent-primary-fg)",
                fontSize: 12,
              }}
            >
              + New Survey
            </Link>
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

            {/* ── Two-pane area ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4">
              {/* Left pane — Recent Surveys table */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid var(--border-default)",
                            background: "var(--bg-surface-sunken)",
                          }}
                        >
                          <th
                            className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]"
                            style={{ minWidth: 160 }}
                          >
                            Survey Name
                          </th>
                          <th
                            className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] whitespace-nowrap"
                          >
                            Region
                          </th>
                          <th
                            className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] whitespace-nowrap"
                          >
                            Timestamp
                          </th>
                          <th
                            className="px-3 py-2.5 text-center font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] whitespace-nowrap"
                          >
                            Detections
                          </th>
                          <th
                            className="px-4 py-2.5 text-center font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] whitespace-nowrap"
                          >
                            Top Priority
                          </th>
                          <th
                            className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] whitespace-nowrap"
                            style={{ minWidth: 80 }}
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
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                                    {s.name}
                                  </span>
                                  {s.isSample && (
                                    <span
                                      className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold shrink-0"
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
                                className="px-3 py-3 whitespace-nowrap"
                                style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}
                              >
                                {s.region ?? "Not specified"}
                              </td>
                              <td
                                className="px-3 py-3 whitespace-nowrap"
                                style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}
                              >
                                {formatTs(s.timestamp)}
                              </td>
                              <td
                                className="px-3 py-3 text-center whitespace-nowrap"
                                style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}
                              >
                                {s.result.summary.total_detections}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                {topPriority ? (
                                  <PriorityBadge priority={topPriority} />
                                ) : (
                                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
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
              </div>

              {/* Right pane — Class breakdown + Priority findings */}
              <div className="flex flex-col gap-4">
                {/* Detection class breakdown */}
                <div>
                  <h2
                    className="mb-2 text-[11px] font-semibold uppercase tracking-wider font-mono"
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
                        className="px-3 py-3 text-center"
                        style={{ background: "var(--bg-surface)" }}
                      >
                        <p
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 26,
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

                {/* Priority findings */}
                {priorityFindings.length > 0 && (
                  <div>
                    <h2
                      className="mb-2 text-[11px] font-semibold uppercase tracking-wider font-mono"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Priority Findings ({priorityFindings.length})
                    </h2>
                    <div className="space-y-2">
                      {priorityFindings.map((d) => (
                        <div
                          key={`${d.surveyId}-${d.id}`}
                          className="flex items-center gap-3 px-3.5 py-2.5 transition-all hover:shadow-xs"
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-default)",
                            borderLeft: "3px solid var(--state-known-confirmed)",
                            borderRadius: "var(--radius)",
                            boxShadow: "var(--shadow-card)",
                          }}
                        >
                          <PriorityBadge priority={d.priority} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                            {d.class ? d.class.toUpperCase() : "UNKNOWN ANOMALY"}
                          </span>
                          <span
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              background: "var(--bg-surface-sunken)",
                              border: "1px solid var(--border-default)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {d.id}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: "auto", whiteSpace: "nowrap" }}>
                            {d.surveyName}
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
              className="mt-2 overflow-hidden transition-all duration-200"
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
                className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface-sunken)]/50 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center h-7 w-7 rounded shrink-0"
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
                        className="font-mono text-[12px] font-bold tracking-tight"
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
                    className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded inline-flex items-center gap-1"
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
                  className="p-4 space-y-4"
                  style={{
                    borderTop: "1px solid var(--border-default)",
                    background: "var(--bg-surface)",
                  }}
                >
                  {/* Filter selector strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mr-1">
                        Sector Filter:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSurveyFilter("all")}
                        className="px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-colors cursor-pointer"
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
                            className="px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-colors cursor-pointer"
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
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--bg-surface-sunken)] border border-[var(--border-default)]">
                        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">SELECTED:</span>
                        <span className="font-mono text-[11px] font-bold text-[var(--text-primary)]">
                          {selectedContact.id}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          ({selectedContact.class ?? "Anomaly"})
                        </span>
                        <Link
                          to="/metrics"
                          search={{ id: selectedContact.surveyId }}
                          className="font-mono text-[10px] text-[var(--accent-primary)] underline hover:opacity-80 ml-1"
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
          <span>Ministry of Earth Sciences · SIH Project</span>
        </div>
      </footer>
    </div>
  );
}

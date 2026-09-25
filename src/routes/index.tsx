import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScanLine, Target, ShieldAlert, Navigation, Radio, LayoutDashboard } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { DetectionPerformance } from "@/components/dashboard/DetectionPerformance";
import { useAuthModal } from "@/context/AuthModalContext";
import { isAuthenticated } from "@/services/auth/authService";

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

/* ── Authentic Dataset Sonar Preview Panel ───────────────────── */
function SonarPreviewPanel() {
  return (
    <div
      className="fade-up stagger-2 relative overflow-hidden surface-sunken"
      style={{
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-default)",
        background: "var(--bg-surface-sunken)",
      }}
    >
      <div className="relative overflow-hidden bg-black aspect-[16/10] sm:aspect-[720/420]">
        {/* Actual Sonar Image from Dataset */}
        <img
          src="/sonar/crops/000002_raw.png"
          alt="Side-scan sonar acoustic survey frame 000002"
          className="w-full h-full object-cover filter contrast-105 select-none"
        />

        {/* Sweeping Sonar Beam Line Animation */}
        <div className="sonar-beam-sweep pointer-events-none" />
      </div>

      {/* Telemetry status bar */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-px text-[9.5px] sm:text-[10px] font-mono"
        style={{
          borderTop: "1px solid var(--border-default)",
          background: "var(--border-default)",
        }}
      >
        <div className="px-2.5 sm:px-3 py-2 flex flex-col justify-center min-w-0" style={{ background: "var(--bg-surface)" }}>
          <span style={{ fontSize: 9, letterSpacing: "0.04em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Frame ID</span>
          <span className="truncate font-semibold" style={{ color: "var(--text-primary)", marginTop: 1 }}>SSS-000002</span>
        </div>
        <div className="px-2.5 sm:px-3 py-2 flex flex-col justify-center min-w-0" style={{ background: "var(--bg-surface)" }}>
          <span style={{ fontSize: 9, letterSpacing: "0.04em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Position</span>
          <span className="truncate" style={{ color: "var(--text-secondary)", marginTop: 1 }}>09.1452°N · 79.2148°E</span>
        </div>
        <div className="px-2.5 sm:px-3 py-2 flex flex-col justify-center min-w-0" style={{ background: "var(--bg-surface)" }}>
          <span style={{ fontSize: 9, letterSpacing: "0.04em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Latency</span>
          <span className="font-semibold" style={{ color: "var(--accent-primary)", marginTop: 1 }}>312 ms</span>
        </div>
        <div className="px-2.5 sm:px-3 py-2 flex flex-col justify-center min-w-0" style={{ background: "var(--bg-surface)" }}>
          <span style={{ fontSize: 9, letterSpacing: "0.04em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Filtered Targets</span>
          <span className="truncate font-semibold" style={{ marginTop: 1 }}>
            <span style={{ color: "var(--state-classified-benign)" }}>1 verified</span>
            <span style={{ color: "var(--text-tertiary)" }}> · </span>
            <span style={{ color: "var(--state-muted-meta)" }}>8 FP</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Capability mini visualizations ─────────────────────────── */
function DetectionMini() {
  return (
    <div
      className="surface-sunken relative overflow-hidden"
      style={{ height: 80, borderRadius: "var(--radius)", background: "var(--bg-surface-sunken)", border: "1px solid var(--border-default)" }}
    >
      {[12, 28, 44, 60, 76].map((y) => (
        <div
          key={y}
          className="absolute w-full"
          style={{ top: y, height: 1, background: `rgba(18,22,28,${0.04 + Math.sin(y) * 0.01})` }}
        />
      ))}
      <div className="absolute" style={{ left: "32%", top: "25%", width: "20%", height: "40%", border: "1.5px solid #2563A6" }}>
        <span className="absolute -top-[14px] left-0 px-1" style={{ fontFamily: "var(--font-mono)", fontSize: 8, background: "#2563A6", color: "#FFFFFF", borderRadius: 1 }}>wreck</span>
      </div>
      <div className="absolute" style={{ left: "64%", top: "45%", width: "12%", height: "26%", border: "1.5px dashed #5B5F7A" }}>
        <span className="absolute -top-[14px] left-0 px-1" style={{ fontFamily: "var(--font-mono)", fontSize: 8, background: "#5B5F7A", color: "#FFFFFF", borderRadius: 1 }}>anomaly</span>
      </div>
    </div>
  );
}

function ClassificationMini() {
  return (
    <div
      className="surface-sunken flex flex-col justify-center gap-2 px-3 py-2"
      style={{ height: 80, borderRadius: "var(--radius)", background: "var(--bg-surface-sunken)", border: "1px solid var(--border-default)" }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-primary)", fontWeight: 600 }}>SHIPWRECK</span>
        <span className="px-1.5 py-0.5" style={{ fontFamily: "var(--font-mono)", fontSize: 10, background: "#2563A6", color: "#FFFFFF", borderRadius: 2 }}>94%</span>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Detector Score</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-secondary)" }}>94%</span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: "var(--border-default)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: "94%", background: "#2563A6", borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

function SuppressionMini() {
  return (
    <div
      className="surface-sunken flex items-center justify-around px-2"
      style={{ height: 80, borderRadius: "var(--radius)", background: "var(--bg-surface-sunken)", border: "1px solid var(--border-default)" }}
    >
      <div className="text-center">
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>140</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", marginTop: 4 }}>Naïve Union</div>
      </div>
      <div className="text-[12px] text-[var(--border-strong)]">→</div>
      <div className="text-center">
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--state-muted-meta)", lineHeight: 1 }}>132</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--state-muted-meta)", marginTop: 4 }}>Clutter Filtered</div>
      </div>
      <div className="text-[12px] text-[var(--border-strong)]">→</div>
      <div className="text-center">
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--state-classified-benign)", lineHeight: 1 }}>8</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--state-classified-benign)", marginTop: 4 }}>Corroborated FP</div>
      </div>
    </div>
  );
}

function CoverageMini() {
  return (
    <div
      className="surface-sunken relative flex items-center justify-center"
      style={{ height: 80, borderRadius: "var(--radius)", background: "var(--bg-surface-sunken)", border: "1px solid var(--border-default)" }}
    >
      <svg width="180" height="60" viewBox="0 0 180 60" fill="none">
        <path d="M 10 40 Q 60 20, 110 35 T 170 15" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
        <circle cx="45" cy="30" r="3" fill="#2563A6" />
        <circle cx="95" cy="27" r="3" fill="#B3261E" />
        <circle cx="140" cy="25" r="3" fill="#5B5F7A" />
      </svg>
      <div className="absolute bottom-1 right-2 font-mono text-[9px] text-[var(--text-secondary)]">
        WGS-84 Swath Path
      </div>
    </div>
  );
}

const pillars = [
  {
    step: "01",
    code: "INGEST & TILE",
    title: "Stream Decomposition",
    body: "Survey frames are dynamically sliced into overlapping acoustic tiles, surfacing contacts within 400ms without downsampling loss.",
    icon: ScanLine,
    Mini: DetectionMini,
  },
  {
    step: "02",
    code: "CLASSIFICATION",
    title: "Known Objects vs. Anomalies",
    body: "Matched contacts carry signature confidence scores. Unmatched returns remain explicitly flagged as unclassified anomalies.",
    icon: Target,
    Mini: ClassificationMini,
  },
  {
    step: "03",
    code: "SUPPRESSION",
    title: "Physics Clutter Rejection",
    body: "Corroborative fusion suppresses acoustic clutter from 140 down to 8 false positives (-94.3% clutter reduction) while maintaining 0.907 Best F1.",
    icon: ShieldAlert,
    Mini: SuppressionMini,
  },
  {
    step: "04",
    code: "GEOLOCATION",
    title: "Tactical Trackline Positioning",
    body: "Every contact keeps its survey coordinates, enabling geographic mission reconstruction and swath review along the vessel path.",
    icon: Navigation,
    Mini: CoverageMini,
  },
];

function Home() {
  const { openLogin } = useAuthModal();
  const [capabilitiesInView, setCapabilitiesInView] = useState(false);
  const capabilitiesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = capabilitiesRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setCapabilitiesInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen gradient-mesh">
      <SiteHeader />

      {/* ── Fold 1: Upper Fold (Hero with Copy & Dataset Image) ── */}
      <section
        className="relative overflow-hidden grid-field"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16">
          <div className="grid items-center gap-8 md:gap-12 md:grid-cols-2">
            {/* Left: copy */}
            <div className="fade-up">
              <p className="eyebrow">Acoustic survey intelligence · MoES SIH Project</p>

              <h1
                className="mt-2.5 leading-tight tracking-tight fade-up"
                style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 700, color: "var(--text-primary)" }}
              >
                Seabed contacts resolved before the survey ends.
              </h1>

              <p className="mt-4 fade-up stagger-2" style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text-secondary)", maxWidth: 480 }}>
                HydroSentry processes side-scan sonar imagery and separates genuine seabed
                contacts — wrecks, ordnance, aircraft debris, and unclassified anomalies — from
                the acoustic clutter that fills every survey run.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 fade-up stagger-3">
                <Link
                  to="/dashboard"
                  onClick={(e) => {
                    if (!isAuthenticated()) {
                      e.preventDefault();
                      openLogin("/dashboard", "Sign in with operator credentials to access the Mission Dashboard");
                    }
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 px-5 transition-opacity hover:opacity-90 cursor-pointer shadow-xs w-full sm:w-auto text-center"
                  style={{
                    borderRadius: "var(--radius)",
                    background: "var(--accent-primary)",
                    color: "var(--accent-primary-fg)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <LayoutDashboard size={15} />
                  Mission Dashboard
                </Link>
                <Link
                  to="/surveys"
                  onClick={(e) => {
                    if (!isAuthenticated()) {
                      e.preventDefault();
                      openLogin("/surveys", "Sign in with operator credentials to open the Sonar Analysis Console");
                    }
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 px-5 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-sunken)] cursor-pointer w-full sm:w-auto text-center"
                  style={{
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  <Radio size={15} />
                  Launch Sonar Analysis
                </Link>
              </div>

              {/* Status badge */}
              <p className="mt-6 fade-up stagger-4" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                Operational prototype
              </p>
            </div>

            {/* Right: sonar product preview with actual dataset image and animated HUD */}
            <div className="fade-up stagger-2 relative overflow-hidden rounded-[var(--radius)]">
              <div className="hero-glow -top-24 -right-16" aria-hidden="true" />
              <SonarPreviewPanel />
            </div>
          </div>
        </div>
      </section>

      {/* ── Fold 2: Mid Fold (Model Evaluation Performance Metrics) ── */}
      <section id="model-evaluation" className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 sm:py-12">
        <DetectionPerformance />
      </section>

      {/* ── Fold 3: Last Fold (Capabilities) ── */}
      <section
        ref={capabilitiesRef}
        className={`mx-auto max-w-[1400px] px-4 sm:px-6 py-10 sm:py-16 scroll-reveal ${capabilitiesInView ? "in-view" : ""}`}
      >
        <div className="mb-8">
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Capabilities
          </h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Four synchronized processing modules transforming raw acoustic signals into verified survey contacts.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
          {pillars.map(({ step, code, title, body, icon: Icon, Mini }, i) => (
            <div
              key={title}
              className={`scroll-reveal ${capabilitiesInView ? "in-view" : ""} reveal-delay-${i + 1} card-elevated flex flex-col p-4 sm:p-5 h-full`}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-card)",
                borderRadius: "var(--radius)",
              }}
            >
              <Mini />
              <div className="mt-4 flex flex-col flex-1">
                {/* Header with visual anchor icon and step */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      {step}
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {code}
                    </span>
                  </div>
                  <Icon className="h-4 w-4 text-[var(--text-secondary)] shrink-0" strokeWidth={1.5} />
                </div>

                <h3
                  className="mt-2.5 text-[14px] font-semibold tracking-tight leading-snug min-h-[38px] flex items-start"
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
        <div
          className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}
        >
          <span>HydroSentry · Operational Survey Platform</span>
          <span>SIH Project</span>
        </div>
      </footer>
    </div>
  );
}

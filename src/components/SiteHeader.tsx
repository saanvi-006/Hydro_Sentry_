import { Link } from "@tanstack/react-router";

/** Concentric-arcs sonar icon */
function SonarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <path d="M5.5 9 A3.5 3.5 0 0 1 12.5 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" fill="none" />
      <path d="M2.5 9 A6.5 6.5 0 0 1 15.5 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

const navLinks = [
  { to: "/",          label: "Home",        exact: true  },
  { to: "/dashboard", label: "Analysis",    exact: false },
  { to: "/metrics",   label: "Performance", exact: false },
] as const;

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{
        background: "color-mix(in srgb, var(--bg-surface) 96%, transparent)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
        {/* Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85 cursor-pointer"
          style={{ color: "var(--text-primary)" }}
        >
          <span style={{ color: "var(--accent-primary)" }}>
            <SonarIcon />
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
            HydroSentry
          </span>
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              paddingLeft: 8,
              borderLeft: "1px solid var(--border-default)",
              marginLeft: 4,
            }}
          >
            MoES · SIH Project
          </span>
        </Link>

        {/* Navigation + operational status indicator */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {navLinks.map(({ to, label, exact }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact }}
                className="nav-link cursor-pointer"
                activeProps={{ className: "nav-link nav-link-active cursor-pointer" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Persistent operational readiness chip */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
              marginLeft: 8,
            }}
          >
            <span className="h-2 w-2 rounded-full bg-[#1E7A5C]" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 500,
                color: "var(--text-secondary)",
                letterSpacing: "0.04em",
              }}
            >
              SYS // READY
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

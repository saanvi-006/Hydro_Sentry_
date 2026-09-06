import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Moon, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  { to: "/",          label: "Home",      exact: true  },
  { to: "/overview",  label: "Dashboard", exact: false },
  { to: "/dashboard", label: "Surveys",   exact: false },
  { to: "/metrics",   label: "Reports",   exact: false },
] as const;

export function SiteHeader() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("hydrosentry-theme", next);
    } catch {
      // ignore
    }
  };

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{
        background: "color-mix(in srgb, var(--bg-surface) 96%, transparent)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      <div className="mx-auto flex h-11 sm:h-12 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85 cursor-pointer"
          style={{ color: "var(--text-primary)" }}
        >
          <span style={{ color: "var(--brand-gold, #C9A15A)" }} aria-hidden="true">
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

        {/* Desktop navigation + theme toggle */}
        <div className="flex items-center gap-2">
          {/* Desktop nav — hidden on small screens */}
          <nav className="hidden md:flex items-center gap-1">
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

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title={`Active: ${theme === "light" ? "Aero-Hydro (Light)" : "Abyssal Indigo (Dark)"} — click to switch`}
            className="flex items-center justify-center h-7 w-7 rounded cursor-pointer transition-colors hover:bg-[var(--bg-surface-sunken)] hover:border-[var(--border-strong)]"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              marginLeft: 4,
            }}
          >
            {theme === "light" ? (
              <Moon className="h-3.5 w-3.5" strokeWidth={1.75} />
            ) : (
              <Sun className="h-3.5 w-3.5" strokeWidth={1.75} style={{ color: "var(--accent-primary)" }} />
            )}
          </button>

          {/* Mobile hamburger — only visible below md */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                className="md:hidden flex items-center justify-center h-7 w-7 rounded cursor-pointer transition-colors"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                  marginLeft: 4,
                }}
              >
                <Menu className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              style={{
                background: "var(--bg-surface)",
                borderLeft: "1px solid var(--border-default)",
                padding: "1.5rem 1.25rem",
                width: "220px",
              }}
            >
              <nav className="flex flex-col gap-1 mt-6">
                {navLinks.map(({ to, label, exact }) => (
                  <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact }}
                    onClick={() => setMobileOpen(false)}
                    className="nav-link cursor-pointer py-2"
                    activeProps={{ className: "nav-link nav-link-active cursor-pointer py-2" }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

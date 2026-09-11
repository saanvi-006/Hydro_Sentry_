import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Moon, Menu, LogOut, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getCachedUser, isAuthenticated, logout } from "@/services/auth/authService";
import type { AuthUser } from "@/services/auth/authService";

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
  { to: "/",         label: "Home",      exact: true  },
  { to: "/dashboard", label: "Dashboard", exact: false },
  { to: "/surveys",   label: "Surveys",   exact: false },
  { to: "/metrics",   label: "Reports",   exact: false },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(current);
    
    const syncAuth = () => {
      setLoggedIn(isAuthenticated());
      setUser(getCachedUser());
    };
    syncAuth();

    window.addEventListener("auth-change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth-change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setUser(null);
    void navigate({ to: "/login" });
  };

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

          {/* Subtle vertical divider between nav and actions */}
          <div
            className="hidden md:block h-4 w-px mx-1"
            style={{ background: "var(--border-default)" }}
            aria-hidden="true"
          />

          {/* User menu dropdown — shown when logged in */}
          {loggedIn && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group hidden md:inline-flex items-center gap-2 h-8 px-2.5 rounded-full cursor-pointer transition-all outline-none hover:opacity-90"
                  style={{
                    background: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent-primary) 22%, transparent)",
                    color: "var(--text-primary)",
                  }}
                  title={`Signed in as ${user.username} — click for options`}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "var(--accent-primary)",
                      color: "var(--accent-primary-fg)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.02em",
                      color: "var(--text-primary)",
                    }}
                  >
                    {user.username}
                  </span>
                  <ChevronDown
                    className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    style={{ color: "var(--text-tertiary)" }}
                    strokeWidth={2}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-56 p-1.5 shadow-lg border"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div className="px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>
                      Account
                    </p>
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        background: "color-mix(in srgb, #22C55E 15%, transparent)",
                        color: "#16A34A",
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      Active
                    </span>
                  </div>
                  <p
                    className="font-mono text-xs font-semibold truncate mt-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.username}
                  </p>
                  {user.email && (
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {user.email}
                    </p>
                  )}
                </div>

                <DropdownMenuSeparator style={{ backgroundColor: "var(--border-default)" }} />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer flex items-center gap-2 px-2.5 py-2 text-xs font-medium rounded transition-colors hover:bg-[color-mix(in_srgb,var(--state-known-confirmed)_10%,transparent)] focus:bg-[color-mix(in_srgb,var(--state-known-confirmed)_10%,transparent)]"
                  style={{
                    color: "var(--state-known-confirmed)",
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Login link — shown when NOT logged in */}
          {!loggedIn && (
            <Link
              to="/login"
              className="hidden md:inline-flex items-center"
              style={{
                marginLeft: 2,
                padding: "0 14px",
                height: 30,
                borderRadius: "var(--radius-md)",
                background: "var(--accent-primary)",
                color: "var(--accent-primary-fg)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.01em",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Sign in
            </Link>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title={`Active: ${theme === "light" ? "Aero-Hydro (Light)" : "Abyssal Indigo (Dark)"} — click to switch`}
            className="flex items-center justify-center h-8 w-8 rounded cursor-pointer transition-colors hover:bg-[var(--bg-surface-sunken)] hover:border-[var(--border-strong)]"
            style={{
              background: "var(--bg-surface-sunken)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              marginLeft: 2,
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
                {/* Mobile auth row */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-default)" }}>
                  {loggedIn ? (
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                      className="nav-link cursor-pointer py-2 w-full text-left flex items-center gap-2"
                      style={{ color: "var(--state-known-confirmed)" }}
                    >
                      <LogOut size={14} strokeWidth={1.75} />
                      Sign out{user ? ` (${user.username})` : ""}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="nav-link cursor-pointer py-2"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

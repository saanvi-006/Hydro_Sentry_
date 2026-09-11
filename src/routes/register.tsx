import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Radio } from "lucide-react";
import { register as registerUser, isAuthenticated } from "@/services/auth/authService";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      void navigate({ to: "/surveys" });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await registerUser(username.trim(), email.trim(), password);
      void navigate({ to: "/surveys" });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    background: "var(--bg-surface-sunken)",
    border: `1px solid ${hasError ? "var(--state-known-confirmed)" : "var(--border-default)"}`,
    borderRadius: "var(--radius-md)",
    padding: "0.5rem 0.75rem",
    fontSize: 13,
    fontFamily: "var(--font-mono)",
    color: "var(--text-primary)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.02em",
  };

  const valid = username.trim() && email.trim() && password;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-canvas)" }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 70% 50% at 20% 30%, color-mix(in srgb, var(--accent-primary) 8%, transparent), transparent)," +
            "radial-gradient(ellipse 60% 40% at 80% 70%, color-mix(in srgb, var(--accent-primary) 5%, transparent), transparent)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <span
            style={{
              color: "var(--brand-gold, #C9A15A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "color-mix(in srgb, var(--brand-gold, #C9A15A) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--brand-gold, #C9A15A) 30%, transparent)",
            }}
          >
            <Radio size={22} strokeWidth={1.5} />
          </span>
          <div className="text-center">
            <h1
              style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.015em", color: "var(--text-primary)" }}
            >
              HydroSentry
            </h1>
            <p
              style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginTop: 2, letterSpacing: "0.03em", textTransform: "uppercase" }}
            >
              MoES · SIH Project
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="card-elevated"
          style={{ padding: "2rem 2rem 1.75rem", borderRadius: "var(--radius-lg)" }}
        >
          <h2 style={{ fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 4 }}>
            Create your account
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Register to access the sonar detection console.
          </p>

          <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-username" style={labelStyle}>USERNAME</label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="operator_id"
                style={inputStyle(!!error)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = error ? "var(--state-known-confirmed)" : "var(--border-default)"; }}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-email" style={labelStyle}>EMAIL</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="analyst@niot.res.in"
                style={inputStyle(!!error)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = error ? "var(--state-known-confirmed)" : "var(--border-default)"; }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-password" style={labelStyle}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input
                  id="reg-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ ...inputStyle(!!error), padding: "0.5rem 2.5rem 0.5rem 0.75rem" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = error ? "var(--state-known-confirmed)" : "var(--border-default)"; }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-tertiary)", padding: 0, display: "flex", alignItems: "center",
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                style={{
                  background: "color-mix(in srgb, var(--state-known-confirmed) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--state-known-confirmed) 30%, transparent)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.5rem 0.75rem",
                  fontSize: 12,
                  color: "var(--state-known-confirmed)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !valid}
              style={{
                marginTop: 4,
                background: loading || !valid ? "var(--bg-surface-sunken)" : "var(--accent-primary)",
                color: loading || !valid ? "var(--text-tertiary)" : "var(--accent-primary-fg)",
                border: "1px solid transparent",
                borderRadius: "var(--radius-md)",
                padding: "0.55rem 1.25rem",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading || !valid ? "not-allowed" : "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--border-default)",
              textAlign: "center",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "var(--accent-primary)", fontWeight: 500, textDecoration: "none" }}
            >
              Sign in
            </Link>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--text-tertiary)",
            marginTop: "1.25rem",
            fontFamily: "var(--font-mono)",
          }}
        >
          RESTRICTED SYSTEM — NIOT / MoES AUTHORISED PERSONNEL ONLY
        </p>
      </div>
    </div>
  );
}

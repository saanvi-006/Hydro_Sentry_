import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Radio,
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthModal } from "@/context/AuthModalContext";
import { login, register as registerUser, ensureAuth, loginDemoOperator } from "@/services/auth/authService";

export function AuthModal() {
  const { isOpen, mode, targetPath, reason, closeModal, setMode } = useAuthModal();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
    } else {
      setUsername("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setError(null);
      setLoading(false);
      setDemoLoading(false);
    }
  }, [isOpen]);

  const handleSuccess = (destination?: string | null) => {
    closeModal();
    const dest = destination || targetPath;
    if (dest) {
      void navigate({ to: dest });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
      handleSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await registerUser(username.trim(), email.trim(), password);
      handleSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setDemoLoading(true);
    setError(null);
    try {
      loginDemoOperator();
      handleSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not sign in with demo operator.";
      setError(msg);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent
        className="w-[92vw] max-w-[420px] p-0 overflow-hidden border card-elevated"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Top Header Badge */}
        <div
          className="p-5 pb-4"
          style={{
            background: "var(--bg-surface-sunken)",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              style={{
                color: "var(--brand-gold, #C9A15A)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "color-mix(in srgb, var(--brand-gold, #C9A15A) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--brand-gold, #C9A15A) 32%, transparent)",
                flexShrink: 0,
              }}
            >
              <Radio size={19} strokeWidth={1.75} />
            </span>
            <div>
              <DialogTitle
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Operator Authentication
              </DialogTitle>
              <DialogDescription
                className="text-[11.5px] mt-0.5 line-clamp-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {reason ?? "Sign in with your HydroSentry operator credentials to access consoles."}
              </DialogDescription>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            className="mt-4 grid grid-cols-2 p-1 rounded-md"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className="py-1.5 text-xs font-semibold rounded transition-all cursor-pointer text-center"
              style={{
                background: mode === "login" ? "var(--accent-primary)" : "transparent",
                color: mode === "login" ? "var(--accent-primary-fg)" : "var(--text-secondary)",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className="py-1.5 text-xs font-semibold rounded transition-all cursor-pointer text-center"
              style={{
                background: mode === "register" ? "var(--accent-primary)" : "transparent",
                color: mode === "register" ? "var(--accent-primary-fg)" : "var(--text-secondary)",
              }}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-2.5 rounded text-xs"
              style={{
                background: "color-mix(in srgb, var(--state-known-confirmed) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--state-known-confirmed) 30%, transparent)",
                color: "var(--state-known-confirmed)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label
                  className="block text-[11px] font-mono font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. operator"
                    autoFocus
                    required
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded outline-none transition-all"
                    style={{
                      background: "var(--bg-surface-sunken)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    className="text-[11px] font-mono font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                    <Lock size={14} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-8 pr-9 py-2 text-xs font-mono rounded outline-none transition-all"
                    style={{
                      background: "var(--bg-surface-sunken)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || demoLoading || !username.trim() || !password}
                className="w-full h-9 flex items-center justify-center gap-2 font-semibold text-xs rounded transition-opacity cursor-pointer disabled:opacity-50"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--accent-primary-fg)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label
                  className="block text-[11px] font-mono font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    autoFocus
                    required
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded outline-none transition-all"
                    style={{
                      background: "var(--bg-surface-sunken)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-[11px] font-mono font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                    <Mail size={14} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@hydrosentry.org"
                    required
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded outline-none transition-all"
                    style={{
                      background: "var(--bg-surface-sunken)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-[11px] font-mono font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                    <Lock size={14} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-8 pr-9 py-2 text-xs font-mono rounded outline-none transition-all"
                    style={{
                      background: "var(--bg-surface-sunken)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || demoLoading || !username.trim() || !email.trim() || !password}
                className="w-full h-9 flex items-center justify-center gap-2 font-semibold text-xs rounded transition-opacity cursor-pointer disabled:opacity-50"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--accent-primary-fg)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <>
                    <span>Create Account &amp; Proceed</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Access Button */}
          <div
            className="pt-3 border-t"
            style={{ borderColor: "var(--border-default)" }}
          >
            <button
              type="button"
              disabled={loading || demoLoading}
              onClick={handleQuickDemoLogin}
              className="w-full py-2 px-3 flex items-center justify-between rounded text-xs transition-all cursor-pointer hover:opacity-90 disabled:opacity-50"
              style={{
                background: "color-mix(in srgb, var(--brand-gold, #C9A15A) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--brand-gold, #C9A15A) 30%, transparent)",
                color: "var(--text-primary)",
              }}
              title="1-Click login with pre-configured Operator demo account (operator / Operator@2026)"
            >
              <div className="flex items-center gap-2">
                <Sparkles
                  size={14}
                  style={{ color: "var(--brand-gold, #C9A15A)" }}
                  className="shrink-0"
                />
                <div className="text-left">
                  <p className="font-semibold text-[11.5px] leading-tight">
                    Quick Demo Access
                  </p>
                  <p
                    className="font-mono text-[10px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Operator · Operator@2026
                  </p>
                </div>
              </div>
              {demoLoading ? (
                <Loader2 size={13} className="animate-spin text-[var(--brand-gold, #C9A15A)]" />
              ) : (
                <span
                  className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                  style={{ background: "var(--brand-gold, #C9A15A)" }}
                >
                  1-Click Entry →
                </span>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

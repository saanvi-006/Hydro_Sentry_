/**
 * authService.ts
 * Thin client for the HydroSentry backend auth endpoints.
 * Token is stored in localStorage under the key below.
 *
 * Backend contracts (from audit of api/auth_routes.py):
 *   POST /api/auth/register   { username, email, password }
 *   POST /api/auth/login      { username, password }  -> { access_token, token_type }
 *   GET  /api/auth/me         Authorization: Bearer <token>
 */

const BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ||
  "https://hydrosentry-oty1.onrender.com";

const TOKEN_KEY = "hydrosentry-token";
const USER_KEY  = "hydrosentry-user";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// ── Token helpers (safe — never throws) ──────────────────────────────────────

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

function saveSession(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-change"));
    }
  } catch { /* ignore */ }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-change"));
    }
  } catch { /* ignore */ }
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Register a new account. Auto-logins on success. Throws AuthError on failure. */
export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
  } catch {
    throw new AuthError(
      "Cannot reach the HydroSentry server. Check that the backend is running.",
    );
  }

  const body = (await res.json().catch(() => null)) as
    | { detail?: string }
    | null;

  if (!res.ok) {
    const detail = body?.detail ?? `Registration failed (HTTP ${res.status}).`;
    throw new AuthError(String(detail), res.status);
  }

  // Auto-login after successful registration
  return login(username, password);
}

/** Login with username + password. Stores token on success. Throws AuthError on failure. */
export async function login(
  username: string,
  password: string,
): Promise<AuthUser> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new AuthError(
      "Cannot reach the HydroSentry server. Check that the backend is running.",
    );
  }

  const body = (await res.json().catch(() => null)) as
    | LoginResponse
    | { detail?: string }
    | null;

  if (!res.ok) {
    const detail =
      (body as { detail?: string } | null)?.detail ??
      `Login failed (HTTP ${res.status}).`;
    throw new AuthError(String(detail), res.status);
  }

  const { access_token } = body as LoginResponse;

  // Fetch user profile
  let userRes: Response;
  try {
    userRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
  } catch {
    throw new AuthError("Logged in but could not fetch user profile.");
  }

  if (!userRes.ok) {
    throw new AuthError(
      `Could not fetch user profile (HTTP ${userRes.status}).`,
    );
  }

  const user = (await userRes.json()) as AuthUser;
  saveSession(access_token, user);
  return user;
}

/** Logout — clears local session. */
export function logout(): void {
  clearSession();
}

/** Returns full Authorization header value, or empty string if not logged in. */
export function authHeader(): string {
  const token = getToken();
  return token ? `Bearer ${token}` : "";
}

/**
 * Ensures a valid authenticated session exists.
 * If no token is stored or session is stale, auto-authenticates
 * with the default operator account.
 */
export async function ensureAuth(): Promise<string> {
  const existing = getToken();
  if (existing) return existing;

  try {
    const user = await login("operator", "Operator@2026");
    return getToken() ?? "";
  } catch {
    try {
      await register("operator", "operator@hydrosentry.org", "Operator@2026");
      return getToken() ?? "";
    } catch {
      return "";
    }
  }
}


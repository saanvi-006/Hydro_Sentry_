import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type AuthModalMode = "login" | "register";

export interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  targetPath: string | null;
  reason: string | null;
  openLogin: (targetPath?: string, reason?: string) => void;
  openRegister: (targetPath?: string, reason?: string) => void;
  closeModal: () => void;
  setMode: (mode: AuthModalMode) => void;
}

const AuthModalContext = createContext<AuthModalState | undefined>(undefined);

export const AUTH_MODAL_EVENT = "hydrosentry-open-auth-modal";

export function triggerAuthModal(options?: {
  targetPath?: string;
  reason?: string;
  mode?: AuthModalMode;
}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(AUTH_MODAL_EVENT, { detail: options || {} })
    );
  }
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>("login");
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  const openLogin = useCallback((target?: string, r?: string) => {
    setMode("login");
    setTargetPath(target ?? null);
    setReason(r ?? null);
    setIsOpen(true);
  }, []);

  const openRegister = useCallback((target?: string, r?: string) => {
    setMode("register");
    setTargetPath(target ?? null);
    setReason(r ?? null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // clean query param if present
    if (typeof window !== "undefined" && window.location.search.includes("auth=")) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        url.searchParams.delete("redirect");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      } catch {
        // ignore
      }
    }
  }, []);

  // Listen to custom window events
  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        targetPath?: string;
        reason?: string;
        mode?: AuthModalMode;
      }>;
      const detail = customEvent.detail || {};
      if (detail.mode === "register") {
        openRegister(detail.targetPath, detail.reason);
      } else {
        openLogin(detail.targetPath, detail.reason);
      }
    };

    window.addEventListener(AUTH_MODAL_EVENT, handleEvent);
    return () => window.removeEventListener(AUTH_MODAL_EVENT, handleEvent);
  }, [openLogin, openRegister]);

  // Check URL params on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const authReq = params.get("auth");
      const redirect = params.get("redirect");
      if (authReq === "required" || authReq === "login") {
        const pageName = redirect
          ? redirect.replace(/^\//, "").charAt(0).toUpperCase() + redirect.replace(/^\//, "").slice(1)
          : "protected areas";
        openLogin(
          redirect ?? undefined,
          `Authentication required to access ${pageName}. Please sign in to continue.`
        );
      }
    } catch {
      // ignore
    }
  }, [openLogin]);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        targetPath,
        reason,
        openLogin,
        openRegister,
        closeModal,
        setMode,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return ctx;
}

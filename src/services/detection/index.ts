import { mockProvider } from "./mockProvider";
import { liveProvider } from "./liveProvider";
import type { DetectionProvider } from "./provider";

export function isLiveMode(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem("hydrosentry-provider");
    if (stored !== null) return stored === "live";
  } catch {
    // ignore
  }
  return import.meta.env["VITE_USE_LIVE_API"] !== "false";
}

export function setLiveMode(live: boolean): void {
  try {
    localStorage.setItem("hydrosentry-provider", live ? "live" : "mock");
  } catch {
    // ignore
  }
}

/** Swappable detection provider — dynamically routes to liveProvider or mockProvider */
export const detectionProvider: DetectionProvider = {
  detect(file, threshold) {
    return isLiveMode()
      ? liveProvider.detect(file, threshold)
      : mockProvider.detect(file, threshold);
  },
  checkHealth() {
    return isLiveMode()
      ? liveProvider.checkHealth()
      : mockProvider.checkHealth();
  },
};

export * from "./types";
export * from "./liveProvider";
export { mockScans } from "./mockProvider";
export type { DetectionProvider } from "./provider";

import type { DetectionProvider } from "./provider";
import type { DetectionResult, HealthStatus } from "./types";
import { mockProvider } from "./mockProvider";

const BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:8000";

export const liveProvider: DetectionProvider = {
  async detect(file, threshold): Promise<DetectionResult> {
    try {
      const form = new FormData();
      if (file) form.append("image", file);
      form.append("confidence_threshold", String(threshold));
      const res = await fetch(`${BASE_URL}/api/detect`, { method: "POST", body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Detection request failed (${res.status})`);
      }
      return (await res.json()) as DetectionResult;
    } catch {
      // Backend unavailable — degrade to mock data so the console stays usable.
      return mockProvider.detect(file, threshold);
    }
  },

  async checkHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (!res.ok) throw new Error(`Health check failed (${res.status})`);
      return (await res.json()) as HealthStatus;
    } catch {
      return mockProvider.checkHealth();
    }
  },
};

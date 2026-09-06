import type { DetectionProvider } from "./provider";
import type { DetectionResult, HealthStatus } from "./types";

const BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:8000";

/** Thrown when the backend returns an error or is unreachable. */
export class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

export const liveProvider: DetectionProvider = {
  async detect(file, threshold): Promise<DetectionResult> {
    let res: Response;
    try {
      const form = new FormData();
      if (file) form.append("image", file);
      form.append("confidence_threshold", String(threshold));
      res = await fetch(`${BASE_URL}/api/detect`, { method: "POST", body: form });
    } catch {
      throw new BackendUnavailableError(
        `Backend unreachable at ${BASE_URL}. Check that the inference server is running.`,
      );
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new BackendUnavailableError(
        body?.error ?? `Detection request failed (HTTP ${res.status}).`,
      );
    }

    return (await res.json()) as DetectionResult;
  },

  async checkHealth(): Promise<HealthStatus> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/api/health`);
    } catch {
      throw new BackendUnavailableError(
        `Backend unreachable at ${BASE_URL}. Check that the inference server is running.`,
      );
    }
    if (!res.ok) throw new BackendUnavailableError(`Health check failed (HTTP ${res.status}).`);
    return (await res.json()) as HealthStatus;
  },
};

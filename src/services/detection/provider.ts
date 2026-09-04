import type { DetectionResult, HealthStatus } from "./types";

export interface DetectionProvider {
  detect(file: File | null, threshold: number): Promise<DetectionResult>;
  checkHealth(): Promise<HealthStatus>;
}

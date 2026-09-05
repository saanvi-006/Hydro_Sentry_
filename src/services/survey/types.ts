import type { DetectionResult } from "@/services/detection";

export interface SurveyRecord {
  id: string;
  name: string;
  region?: string;
  description?: string;
  timestamp: number; // Unix ms
  threshold: number;
  result: DetectionResult;
  isSample: boolean;
}

export interface SurveyCreateParams {
  name: string;
  file: File | null; // null = sample
  region?: string;
  description?: string;
  threshold: number;
}

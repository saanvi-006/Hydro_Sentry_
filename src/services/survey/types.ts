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
  imageUrl?: string;
  location?: { lat: number; lon: number };
}

export interface SurveyCreateParams {
  name: string;
  file: File | null; // null = sample
  region?: string;
  description?: string;
  threshold: number;
}

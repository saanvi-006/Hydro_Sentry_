export interface Detection {
  id: string;
  type: "known" | "unknown_anomaly";
  class: "aircraft" | "mine" | "shipwreck" | null;
  detector_confidence: number | null;
  anomaly_score: number;
  physics_score: number;
  operational_confidence: number;
  priority: "normal" | "low_priority" | "review_required" | "high_priority";
  bbox: { x_min: number; y_min: number; x_max: number; y_max: number };
  location: { lat: number; lon: number } | null;
}

export interface DetectionResult {
  image_id: string;
  image_width: number;
  image_height: number;
  processing_time_ms: number;
  detections: Detection[];
  summary: {
    total_detections: number;
    known_count: number;
    unknown_anomaly_count: number;
    false_positives_filtered: number;
  };
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  model_version: string;
}

export interface ApiError {
  error: string;
  code: string;
}

export const PRIORITY_COLOR: Record<Detection["priority"], string> = {
  high_priority: "#FF453A",
  review_required: "#FF9F0A",
  normal: "#32ADE6",
  low_priority: "#8E8E93",
};

export const PRIORITY_LABEL: Record<Detection["priority"], string> = {
  high_priority: "High priority",
  review_required: "Review required",
  normal: "Normal",
  low_priority: "Low priority",
};

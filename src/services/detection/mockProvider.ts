import type { DetectionProvider } from "./provider";
import type { Detection, DetectionResult, HealthStatus } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const scanA: DetectionResult = {
  image_id: "SSS-2291-A",
  image_width: 1024,
  image_height: 640,
  processing_time_ms: 412,
  detections: [
    {
      id: "d-001",
      type: "known",
      class: "shipwreck",
      detector_confidence: 0.94,
      anomaly_score: 0.88,
      physics_score: 0.91,
      operational_confidence: 0.93,
      priority: "high_priority",
      bbox: { x_min: 0.11, y_min: 0.18, x_max: 0.34, y_max: 0.46 },
      location: { lat: 11.9312, lon: 79.8541 },
    },
    {
      id: "d-002",
      type: "known",
      class: "mine",
      detector_confidence: 0.71,
      anomaly_score: 0.64,
      physics_score: 0.55,
      operational_confidence: 0.66,
      priority: "review_required",
      bbox: { x_min: 0.52, y_min: 0.29, x_max: 0.61, y_max: 0.4 },
      location: { lat: 11.9407, lon: 79.8698 },
    },
    {
      id: "d-003",
      type: "unknown_anomaly",
      class: null,
      detector_confidence: null,
      anomaly_score: 0.79,
      physics_score: 0.42,
      operational_confidence: 0.51,
      priority: "review_required",
      bbox: { x_min: 0.68, y_min: 0.58, x_max: 0.86, y_max: 0.79 },
      location: { lat: 11.9188, lon: 79.8812 },
    },
    {
      id: "d-004",
      type: "known",
      class: "aircraft",
      detector_confidence: 0.62,
      anomaly_score: 0.37,
      physics_score: 0.7,
      operational_confidence: 0.58,
      priority: "normal",
      bbox: { x_min: 0.3, y_min: 0.66, x_max: 0.47, y_max: 0.83 },
      location: { lat: 11.9026, lon: 79.8459 },
    },
  ],
  summary: {
    total_detections: 4,
    known_count: 3,
    unknown_anomaly_count: 1,
    false_positives_filtered: 27,
  },
};

const scanB: DetectionResult = {
  image_id: "SSS-2293-C",
  image_width: 1024,
  image_height: 640,
  processing_time_ms: 358,
  detections: [
    {
      id: "d-101",
      type: "unknown_anomaly",
      class: null,
      detector_confidence: null,
      anomaly_score: 0.92,
      physics_score: 0.61,
      operational_confidence: 0.74,
      priority: "high_priority",
      bbox: { x_min: 0.22, y_min: 0.31, x_max: 0.44, y_max: 0.62 },
      location: { lat: 12.0121, lon: 80.1044 },
    },
    {
      id: "d-102",
      type: "known",
      class: "shipwreck",
      detector_confidence: 0.44,
      anomaly_score: 0.21,
      physics_score: 0.33,
      operational_confidence: 0.29,
      priority: "low_priority",
      bbox: { x_min: 0.6, y_min: 0.12, x_max: 0.78, y_max: 0.3 },
      location: { lat: 12.0203, lon: 80.1187 },
    },
  ],
  summary: {
    total_detections: 2,
    known_count: 1,
    unknown_anomaly_count: 1,
    false_positives_filtered: 14,
  },
};

const scanEmpty: DetectionResult = {
  image_id: "SSS-2295-E",
  image_width: 1024,
  image_height: 640,
  processing_time_ms: 296,
  detections: [],
  summary: {
    total_detections: 0,
    known_count: 0,
    unknown_anomaly_count: 0,
    false_positives_filtered: 0,
  },
};

const scans = [scanA, scanB, scanEmpty];
let call = 0;

function filterByThreshold(result: DetectionResult, threshold: number): DetectionResult {
  const kept: Detection[] = result.detections.filter(
    (d) => d.operational_confidence >= threshold,
  );
  const dropped = result.detections.length - kept.length;
  return {
    ...result,
    detections: kept,
    summary: {
      total_detections: kept.length,
      known_count: kept.filter((d) => d.type === "known").length,
      unknown_anomaly_count: kept.filter((d) => d.type === "unknown_anomaly").length,
      false_positives_filtered: result.summary.false_positives_filtered + dropped,
    },
  };
}

export const mockProvider: DetectionProvider = {
  async detect(file, threshold) {
    await delay(300 + Math.random() * 200);
    if (file && /error|fail/i.test(file.name)) {
      throw new Error("Sonar frame rejected: unreadable header (code: DECODE_FAILED)");
    }
    const base = scans[call++ % scans.length]!;
    return filterByThreshold(base, threshold);
  },
  async checkHealth(): Promise<HealthStatus> {
    await delay(200);
    return { status: "ok", model_loaded: true, model_version: "hs-fused-0.4.1-mock" };
  },
};

export const mockScans = scans;

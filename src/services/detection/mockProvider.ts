import type { DetectionProvider } from "./provider";
import type { Detection, DetectionResult, HealthStatus } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Real evaluation test cases from SIH26057 ML Pipeline:
 * - YOLOv8n (specialist: aircraft, shipwreck)
 * - PatchCore (normality baseline on clean seafloor; gate at 0.3103)
 * - Greedy IoU fusion (IoU >= 0.10) with Corroboration triage rule
 */

// 1. Frame 000002: Corroborated Aircraft Target (HIGH)
const scan000002: DetectionResult = {
  image_id: "SSS-000002",
  image_width: 715,
  image_height: 745,
  processing_time_ms: 312,
  detections: [
    {
      id: "det-000002-1",
      type: "known",
      class: "aircraft",
      class_name: "aircraft",
      source: "both",
      src: "both",
      bucket: "HIGH",
      yolo_confidence: 0.83,
      detector_confidence: 0.83,
      anomaly_score: 0.65,
      physics_score: 0.82,
      operational_confidence: 0.83,
      priority: "high_priority",
      bbox: { x_min: 0.238, y_min: 0.298, x_max: 0.744, y_max: 0.779 },
      location: { lat: 9.1452, lon: 79.2148 },
    },
  ],
  summary: {
    total_detections: 1,
    known_count: 1,
    unknown_anomaly_count: 0,
    false_positives_filtered: 0,
  },
};

// 2. Frame 000241: Corroborated Shipwreck + Review Anomaly Contact
const scan000241: DetectionResult = {
  image_id: "SSS-000241",
  image_width: 715,
  image_height: 745,
  processing_time_ms: 364,
  detections: [
    {
      id: "det-000241-1",
      type: "known",
      class: "shipwreck",
      class_name: "shipwreck",
      source: "both",
      src: "both",
      bucket: "HIGH",
      yolo_confidence: 0.75,
      detector_confidence: 0.75,
      anomaly_score: 0.62,
      physics_score: 0.76,
      operational_confidence: 0.75,
      priority: "high_priority",
      bbox: { x_min: 0.004, y_min: 0.381, x_max: 0.993, y_max: 0.678 },
      location: { lat: 9.8214, lon: 79.6419 },
    },
    {
      id: "det-000241-2",
      type: "unknown_anomaly",
      class: null,
      class_name: null,
      source: "patchcore_only",
      src: "patchcore_only",
      bucket: "REVIEW",
      yolo_confidence: null,
      detector_confidence: null,
      anomaly_score: 0.57,
      physics_score: 0.61,
      operational_confidence: 0.57,
      priority: "review_required",
      bbox: { x_min: 0.705, y_min: 0.365, x_max: 0.812, y_max: 0.582 },
      location: { lat: 9.8228, lon: 79.6435 },
    },
  ],
  summary: {
    total_detections: 2,
    known_count: 1,
    unknown_anomaly_count: 1,
    false_positives_filtered: 2,
  },
};

// 3. Frame 000021: Submerged Aircraft with Shadow
const scan000021: DetectionResult = {
  image_id: "SSS-000021",
  image_width: 715,
  image_height: 745,
  processing_time_ms: 298,
  detections: [
    {
      id: "det-000021-1",
      type: "known",
      class: "aircraft",
      class_name: "aircraft",
      source: "both",
      src: "both",
      bucket: "HIGH",
      yolo_confidence: 0.87,
      detector_confidence: 0.87,
      anomaly_score: 0.46,
      physics_score: 0.85,
      operational_confidence: 0.87,
      priority: "high_priority",
      bbox: { x_min: 0.021, y_min: 0.140, x_max: 0.780, y_max: 0.870 },
      location: { lat: 15.3812, lon: 73.8014 },
    },
  ],
  summary: {
    total_detections: 1,
    known_count: 1,
    unknown_anomaly_count: 0,
    false_positives_filtered: 1,
  },
};

// 4. Frame 000022: High-contrast Aircraft Contact
const scan000022: DetectionResult = {
  image_id: "SSS-000022",
  image_width: 715,
  image_height: 745,
  processing_time_ms: 326,
  detections: [
    {
      id: "det-000022-1",
      type: "known",
      class: "aircraft",
      class_name: "aircraft",
      source: "both",
      src: "both",
      bucket: "HIGH",
      yolo_confidence: 0.89,
      detector_confidence: 0.89,
      anomaly_score: 0.58,
      physics_score: 0.88,
      operational_confidence: 0.89,
      priority: "high_priority",
      bbox: { x_min: 0.024, y_min: 0.032, x_max: 0.757, y_max: 0.993 },
      location: { lat: 15.3940, lon: 73.8125 },
    },
  ],
  summary: {
    total_detections: 1,
    known_count: 1,
    unknown_anomaly_count: 0,
    false_positives_filtered: 0,
  },
};

// 5. Frame 57: Open-Set Anthropogenic Structure (Unlabelled in dataset)
const scan000057: DetectionResult = {
  image_id: "SSS-000057",
  image_width: 715,
  image_height: 745,
  processing_time_ms: 355,
  detections: [
    {
      id: "det-000057-1",
      type: "known",
      class: "shipwreck",
      class_name: "shipwreck",
      source: "yolo_only",
      src: "yolo_only",
      bucket: "REVIEW",
      yolo_confidence: 0.74,
      detector_confidence: 0.74,
      anomaly_score: 0.43,
      physics_score: 0.68,
      operational_confidence: 0.74,
      priority: "review_required",
      bbox: { x_min: 0.004, y_min: 0.413, x_max: 0.994, y_max: 0.991 },
      location: { lat: 10.5667, lon: 72.6417 },
    },
  ],
  summary: {
    total_detections: 1,
    known_count: 1,
    unknown_anomaly_count: 0,
    false_positives_filtered: 3,
  },
};

// 6. Frame 62: Clean Seafloor (Gate Score 0.1245 < 0.3103, Anomaly Branch Disabled)
const scan000062: DetectionResult = {
  image_id: "SSS-000062",
  image_width: 715,
  image_height: 745,
  processing_time_ms: 198,
  detections: [],
  summary: {
    total_detections: 0,
    known_count: 0,
    unknown_anomaly_count: 0,
    false_positives_filtered: 0,
  },
};

const scans = [scan000002, scan000241, scan000021, scan000022, scan000057, scan000062];
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
    return {
      status: "ok",
      model_loaded: true,
      model_version: "yolov8n-patchcore-fused-v1.0.0",
    };
  },
};

export const mockScans = scans;


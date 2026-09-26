import type { DetectionProvider } from "./provider";
import type { Detection, DetectionResult, HealthStatus } from "./types";
import { authHeader, clearSession, ensureAuth, getToken } from "@/services/auth/authService";
const BASE_URL = (
  import.meta.env["VITE_API_BASE_URL"] ||
  "https://hydrosentry-835512366533.asia-south1.run.app"
).replace(/\/+$/, "");

/** Thrown when the backend returns an error or is unreachable. */
export class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

/** Backend raw detection format from services/fusion.py */
interface RawBackendDetection {
  id?: string;
  bbox?: { x_min: number; y_min: number; x_max: number; y_max: number };
  source?: "both" | "yolo_only" | "patchcore_only";
  class?: "aircraft" | "shipwreck" | null;
  yolo_confidence?: number | null;
  anomaly_score?: number | null;
  anomaly_mean?: number | null;
  bucket?: "HIGH" | "REVIEW" | "REJECT";
  location?: { lat: number | null; lon: number | null } | null;
  bbox_width_meters?: number | null;
  bbox_height_meters?: number | null;
}

interface RawBackendResponse {
  image_id?: string;
  image_width?: number;
  image_height?: number;
  processing_time_ms?: number;
  detections?: RawBackendDetection[];
  summary?: {
    total_detections?: number;
    high_count?: number;
    review_count?: number;
    reject_count?: number;
    known_object_count?: number;
    unknown_anomaly_count?: number;
    aircraft_count?: number;
    shipwreck_count?: number;
    known_count?: number;
    false_positives_filtered?: number;
  };
}

/** Translates backend response to frontend DetectionResult contract */
function adaptBackendResponse(raw: RawBackendResponse): DetectionResult {
  const rawDetections = Array.isArray(raw.detections) ? raw.detections : [];

  const detections: Detection[] = rawDetections.map((d, index): Detection => {
    // 1. Map source -> type
    const isAnomalyOnly = d.source === "patchcore_only";
    const type: Detection["type"] = isAnomalyOnly ? "unknown_anomaly" : "known";

    // 2. Map bucket -> priority
    let priority: Detection["priority"] = "normal";
    if (d.bucket === "HIGH") priority = "high_priority";
    else if (d.bucket === "REVIEW") priority = "review_required";
    else if (d.bucket === "REJECT") priority = "low_priority";

    // 3. Operational confidence calculation
    const yoloConf = typeof d.yolo_confidence === "number" ? d.yolo_confidence : null;
    const anomalyScore = typeof d.anomaly_score === "number" ? d.anomaly_score : 0;
    const physicsScore = typeof d.anomaly_mean === "number" ? d.anomaly_mean : 0;

    let opConf = 0.5;
    if (d.source === "both") {
      opConf = yoloConf !== null ? Math.min(1.0, yoloConf * 0.7 + anomalyScore * 0.3) : anomalyScore;
    } else if (d.source === "yolo_only") {
      opConf = yoloConf ?? 0.5;
    } else if (d.source === "patchcore_only") {
      opConf = anomalyScore;
    }

    const bbox = {
      x_min: d.bbox?.x_min ?? 0,
      y_min: d.bbox?.y_min ?? 0,
      x_max: d.bbox?.x_max ?? 1,
      y_max: d.bbox?.y_max ?? 1,
    };

    const location =
      d.location && typeof d.location.lat === "number" && typeof d.location.lon === "number"
        ? { lat: d.location.lat, lon: d.location.lon }
        : null;

    const rawSource = d.source ?? (isAnomalyOnly ? "patchcore_only" : "yolo_only");
    const bucket = d.bucket ?? (priority === "high_priority" ? "HIGH" : priority === "review_required" ? "REVIEW" : "REJECT");

    return {
      id: d.id ?? `det_${String(index + 1).padStart(3, "0")}`,
      type,
      class: d.class ?? null,
      class_name: d.class ?? null,
      source: rawSource,
      src: rawSource,
      bucket,
      yolo_confidence: yoloConf,
      detector_confidence: yoloConf,
      anomaly_score: anomalyScore,
      physics_score: physicsScore,
      operational_confidence: Math.round(opConf * 100) / 100,
      priority,
      bbox,
      location,
      bbox_width_meters: d.bbox_width_meters ?? null,
      bbox_height_meters: d.bbox_height_meters ?? null,
    };
  });

  const rawSummary = raw.summary ?? {};
  const totalDetections = rawSummary.total_detections ?? detections.length;
  const knownCount =
    rawSummary.known_object_count ??
    rawSummary.known_count ??
    detections.filter((d) => d.type === "known").length;
  const unknownAnomalyCount =
    rawSummary.unknown_anomaly_count ??
    detections.filter((d) => d.type === "unknown_anomaly").length;
  const falsePositivesFiltered =
    rawSummary.reject_count ?? rawSummary.false_positives_filtered ?? 0;

  return {
    image_id: raw.image_id ?? `scan_${Date.now()}`,
    image_width: raw.image_width ?? 715,
    image_height: raw.image_height ?? 745,
    processing_time_ms: raw.processing_time_ms ?? 0,
    detections,
    summary: {
      total_detections: totalDetections,
      known_count: knownCount,
      unknown_anomaly_count: unknownAnomalyCount,
      false_positives_filtered: falsePositivesFiltered,
    },
  };
}

export const liveProvider: DetectionProvider = {
  async detect(file, threshold): Promise<DetectionResult> {
    let token = getToken();
    if (!token) {
      token = await ensureAuth();
    }

    const sendRequest = async (authToken: string | null) => {
      const form = new FormData();
      if (file) form.append("image", file);
      form.append("confidence_threshold", String(threshold));
      return fetch(`${BASE_URL}/api/detect`, {
        method: "POST",
        body: form,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
    };

    let res: Response;
    try {
      res = await sendRequest(token);
      // If 401 Unauthorized (session was expired or created against old backend instance), auto-refresh and retry once
      if (res.status === 401) {
        clearSession();
        token = await ensureAuth();
        res = await sendRequest(token);
      }
    } catch {
      throw new BackendUnavailableError(
        `Backend unreachable at ${BASE_URL}. Check that the inference server is running.`,
      );
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string; detail?: string } | null;
      throw new BackendUnavailableError(
        body?.error ?? body?.detail ?? `Detection request failed (HTTP ${res.status}).`,
      );
    }

    const rawJson = (await res.json()) as RawBackendResponse;
    return adaptBackendResponse(rawJson);
  },

  async checkHealth(): Promise<HealthStatus> {
    let res: Response;
    try {
      // Health endpoint is public — no auth needed
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

/** Returns URL to retrieve the annotated frame from the backend with token */
export function getAnnotatedImageUrl(imageId: string): string {
  const token = getToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${BASE_URL}/api/images/annotated/${encodeURIComponent(imageId)}${query}`;
}

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

export const SEMANTIC_PALETTE_LIGHT = {
  accentPrimary: "#1B3A5C",
  knownConfirmed: "#B3261E",    // Deep Red: confirmed threat (mine/ordnance)
  unclassified: "#5B5F7A",      // Slate/Violet-Gray: unclassified anomaly contacts, dashed
  classifiedBenign: "#2563A6",  // Blue: confidently classified non-threat (shipwreck/debris)
  caution: "#C2600A",           // Orange: mid-confidence / needs review
  mutedMeta: "#8A8F99",         // Gray: false positives, filtered counts
} as const;

export const SEMANTIC_PALETTE_DARK = {
  accentPrimary: "#C9A15A",     // Muted brass
  knownConfirmed: "#E5544A",    // Brightened Red for dark contrast
  unclassified: "#8890AC",      // Lightened Slate
  classifiedBenign: "#5E93D6",  // Brightened Steel-Blue (never cyan)
  caution: "#E2954A",           // Brightened Amber
  mutedMeta: "#7C8494",         // Gray
} as const;

export const SEMANTIC_PALETTE = SEMANTIC_PALETTE_LIGHT;

export const PRIORITY_COLOR: Record<Detection["priority"], string> = {
  high_priority: "var(--state-known-confirmed)",
  review_required: "var(--state-caution)",
  normal: "var(--state-classified-benign)",
  low_priority: "var(--state-unclassified)",
};

export const PRIORITY_LABEL: Record<Detection["priority"], string> = {
  high_priority: "Confirmed Threat",
  review_required: "Review Required",
  normal: "Classified Benign",
  low_priority: "Unclassified Anomaly",
};

export interface ContactSemantic {
  color: string;
  hex: string;
  label: string;
  shortLabel: string;
  isDashed: boolean;
  confidence: number;
  fillOpacity: number;
  badgeOpacity: number;
}

export function getContactSemantic(d: Detection, theme?: "light" | "dark"): ContactSemantic {
  const activeTheme =
    theme ??
    (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light");
  const palette = activeTheme === "dark" ? SEMANTIC_PALETTE_DARK : SEMANTIC_PALETTE_LIGHT;

  const isAnomaly = d.type === "unknown_anomaly" || !d.class;
  const isMine = d.class?.toLowerCase() === "mine";
  const conf = isAnomaly
    ? d.anomaly_score
    : (d.detector_confidence ?? d.operational_confidence ?? 0.5);

  const fillOpacity = Math.max(0.35, Math.min(1, conf));
  const badgeOpacity = Math.max(0.70, Math.min(1, 0.50 + conf * 0.50));

  if (isAnomaly) {
    return {
      color: "var(--state-unclassified)",
      hex: palette.unclassified,
      label: "UNCLASSIFIED ANOMALY",
      shortLabel: "ANOMALY",
      isDashed: true,
      confidence: conf,
      fillOpacity,
      badgeOpacity,
    };
  }

  if (isMine) {
    return {
      color: "var(--state-known-confirmed)",
      hex: palette.knownConfirmed,
      label: "THREAT // MINE",
      shortLabel: "MINE",
      isDashed: false,
      confidence: conf,
      fillOpacity,
      badgeOpacity,
    };
  }

  if (d.priority === "review_required" || conf < 0.60) {
    return {
      color: "var(--state-caution)",
      hex: palette.caution,
      label: "CAUTION // REVIEW",
      shortLabel: "REVIEW",
      isDashed: false,
      confidence: conf,
      fillOpacity,
      badgeOpacity,
    };
  }

  return {
    color: "var(--state-classified-benign)",
    hex: palette.classifiedBenign,
    label: `BENIGN // ${d.class.toUpperCase()}`,
    shortLabel: d.class.toUpperCase(),
    isDashed: false,
    confidence: conf,
    fillOpacity,
    badgeOpacity,
  };
}

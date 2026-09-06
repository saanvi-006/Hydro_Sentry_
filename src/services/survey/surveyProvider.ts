import { detectionProvider } from "@/services/detection";
import { mockScans } from "@/services/detection/mockProvider";
import type { SurveyRecord, SurveyCreateParams } from "./types";

let counter = 0;
function genId() {
  return `survey-${Date.now()}-${++counter}`;
}

// Pre-seed realistic surveys from real ML evaluation scans
const seedSurveys: SurveyRecord[] = [
  {
    id: "sample-000002",
    name: "Survey 000002 — Gulf of Mannar",
    region: "Gulf of Mannar, TN",
    description: "Acoustic transect: corroborated aircraft fuselage target (83% detector confidence, corroborated by PatchCore anomaly gate at 0.65).",
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2h ago
    threshold: 0.25,
    result: mockScans[0]!,
    isSample: true,
  },
  {
    id: "sample-000241",
    name: "Survey 000241 — Palk Strait",
    region: "Palk Strait, TN",
    description: "Dual-channel waterfall: corroborated shipwreck contact (75%) plus isolated open-set anomaly flagged for operator review (2 FP clutter filtered).",
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5h ago
    threshold: 0.25,
    result: mockScans[1]!,
    isSample: true,
  },
  {
    id: "sample-000021",
    name: "Survey 000021 — Goa Coastline",
    region: "Goa Continental Shelf",
    description: "High-resolution side-scan pass: corroborated aircraft debris target (87% confidence, 1 low-confidence acoustic clutter false positive suppressed).",
    timestamp: Date.now() - 1000 * 60 * 60 * 9, // 9h ago
    threshold: 0.25,
    result: mockScans[2]!,
    isSample: true,
  },
  {
    id: "sample-000057",
    name: "Survey 000057 — Lakshadweep Ridge",
    region: "Lakshadweep Basin",
    description: "Open-set detection evaluation: uncatalogued anthropogenic debris requiring analyst review (YOLO single-branch hit at 0.74, 3 speckles suppressed).",
    timestamp: Date.now() - 1000 * 60 * 60 * 16, // 16h ago
    threshold: 0.25,
    result: mockScans[4]!,
    isSample: true,
  },
  {
    id: "sample-000062",
    name: "Survey 000062 — Seabed Baseline",
    region: "Palk Strait Transect B",
    description: "Normality verification: clean seafloor frame correctly gated at anomaly score 0.1245 (below 0.3103 threshold, zero false positives generated).",
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 24h ago
    threshold: 0.25,
    result: mockScans[5]!,
    isSample: true,
  },
];

// In-memory store (most recent first)
const store: SurveyRecord[] = [...seedSurveys];

export const surveyProvider = {
  getAll(): SurveyRecord[] {
    return [...store].sort((a, b) => b.timestamp - a.timestamp);
  },

  getById(id: string): SurveyRecord | null {
    return store.find((s) => s.id === id) ?? null;
  },

  async create(params: SurveyCreateParams): Promise<SurveyRecord> {
    const result = await detectionProvider.detect(params.file, params.threshold);
    const record: SurveyRecord = {
      id: genId(),
      name: params.name,
      region: params.region,
      description: params.description,
      timestamp: Date.now(),
      threshold: params.threshold,
      result,
      isSample: false,
    };
    store.unshift(record);
    return record;
  },
};

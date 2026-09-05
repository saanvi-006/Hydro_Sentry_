import { mockProvider, mockScans } from "@/services/detection/mockProvider";
import type { SurveyRecord, SurveyCreateParams } from "./types";

let counter = 0;
function genId() {
  return `survey-${Date.now()}-${++counter}`;
}

// Pre-seed two sample surveys from the mock scans
const seedSurveys: SurveyRecord[] = [
  {
    id: "sample-a",
    name: "Demo Survey — Gulf of Mannar",
    region: "Gulf of Mannar, TN",
    description: "Pre-loaded sample: multi-target acoustic survey with 4 contacts.",
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2h ago
    threshold: 0.25,
    result: mockScans[0]!,
    isSample: true,
  },
  {
    id: "sample-b",
    name: "Demo Survey — Palk Strait",
    region: "Palk Strait, TN",
    description: "Pre-loaded sample: anomaly-dominant survey with 2 contacts.",
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5h ago
    threshold: 0.25,
    result: mockScans[1]!,
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
    const result = await mockProvider.detect(params.file, params.threshold);
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

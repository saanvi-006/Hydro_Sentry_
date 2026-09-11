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
    location: { lat: 9.15, lon: 79.15 },
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
    location: { lat: 9.85, lon: 79.45 },
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
    location: { lat: 15.40, lon: 73.70 },
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
    location: { lat: 10.57, lon: 72.64 },
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
    location: { lat: 9.80, lon: 79.40 },
  },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export function parseRegionToCoords(region?: string): { lat: number; lon: number } | null {
  if (!region) return null;
  const trimmed = region.trim();

  // 1. Direct coordinate check: "15.29, 73.82" or "15.29° N, 73.82° E"
  const coordMatch = trimmed.match(/([+-]?\d+(?:\.\d+)?)\s*°?\s*([NS])?[\s,;/]+([+-]?\d+(?:\.\d+)?)\s*°?\s*([EW])?/i);
  if (coordMatch) {
    let lat = parseFloat(coordMatch[1]);
    if (coordMatch[2]?.toUpperCase() === "S") lat = -lat;
    let lon = parseFloat(coordMatch[3]);
    if (coordMatch[4]?.toUpperCase() === "W") lon = -lon;
    if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)) };
    }
  }

  // 2. Comprehensive coastal/marine region dictionary
  const lower = trimmed.toLowerCase();
  const REGION_MAP: Array<{ keywords: string[]; coords: [number, number] }> = [
    { keywords: ["mannar"], coords: [9.15, 79.15] },
    { keywords: ["palk", "strait"], coords: [9.85, 79.45] },
    { keywords: ["goa", "mormugao", "panaji", "continental shelf"], coords: [15.40, 73.70] },
    { keywords: ["mumbai", "bombay", "high"], coords: [18.95, 72.80] },
    { keywords: ["chennai", "madras", "coromandel"], coords: [13.10, 80.35] },
    { keywords: ["puducherry", "pondicherry"], coords: [11.93, 79.85] },
    { keywords: ["kochi", "cochin", "kerala", "malabar"], coords: [9.96, 76.22] },
    { keywords: ["vizag", "visakhapatnam", "andhra"], coords: [17.68, 83.35] },
    { keywords: ["lakshadweep", "kavaratti", "agatti", "minicoy"], coords: [10.57, 72.64] },
    { keywords: ["andaman", "nicobar", "port blair"], coords: [11.66, 92.74] },
    { keywords: ["kutch", "kandla", "gujarat"], coords: [22.50, 69.50] },
    { keywords: ["khambhat", "surat"], coords: [21.10, 72.50] },
    { keywords: ["kolkata", "calcutta", "haldia", "sundarbans"], coords: [21.65, 88.05] },
    { keywords: ["paradip", "odisha", "puri"], coords: [20.25, 86.70] },
    { keywords: ["kanyakumari", "comorin"], coords: [8.08, 77.55] },
    { keywords: ["mangalore", "karnataka"], coords: [12.87, 74.82] },
    { keywords: ["tuticorin", "thoothukudi"], coords: [8.76, 78.13] },
    { keywords: ["arabian"], coords: [15.00, 68.00] },
    { keywords: ["bengal"], coords: [14.00, 86.00] },
    { keywords: ["indian ocean"], coords: [-2.00, 78.00] },
    { keywords: ["red sea"], coords: [20.00, 38.50] },
    { keywords: ["singapore", "malacca"], coords: [1.25, 103.80] },
    { keywords: ["persian", "gulf of oman"], coords: [26.00, 52.00] },
    { keywords: ["mediterranean"], coords: [34.50, 18.50] },
  ];

  for (const item of REGION_MAP) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return { lat: item.coords[0], lon: item.coords[1] };
    }
  }

  return null;
}

const STORAGE_KEY = "hydrosentry-surveys";

function loadUserSurveys(): SurveyRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SurveyRecord[];
  } catch {
    return [];
  }
}

function saveUserSurveys(records: SurveyRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    // Only persist non-sample user surveys to keep storage slim
    const userSurveys = records.filter((r) => !r.isSample);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userSurveys.slice(0, 25)));
  } catch {
    // ignore quota errors
  }
}

// In-memory store (most recent first) initialized with user surveys + seed surveys
const userStored = loadUserSurveys();
const store: SurveyRecord[] = [...userStored, ...seedSurveys];

export const surveyProvider = {
  getAll(): SurveyRecord[] {
    return [...store].sort((a, b) => b.timestamp - a.timestamp);
  },

  getById(id: string): SurveyRecord | null {
    return store.find((s) => s.id === id) ?? null;
  },

  async create(params: SurveyCreateParams): Promise<SurveyRecord> {
    const result = await detectionProvider.detect(params.file, params.threshold);
    let imageUrl: string | undefined = undefined;
    if (params.file && typeof window !== "undefined") {
      try {
        const dataUrl = await readFileAsDataUrl(params.file);
        imageUrl = dataUrl || URL.createObjectURL(params.file);
      } catch {
        try {
          imageUrl = URL.createObjectURL(params.file);
        } catch {
          // ignore
        }
      }
    }

    const location = parseRegionToCoords(params.region) ?? { lat: 11.925, lon: 79.865 };

    // Distribute detections with realistic spatial offsets around the survey location
    const localizedDetections = result.detections.map((d, idx) => {
      if (d.location && typeof d.location.lat === "number" && typeof d.location.lon === "number") {
        return d;
      }
      const offsetX = ((d.bbox?.x_min ?? 0.5) - 0.5) * 0.008 + idx * 0.001;
      const offsetY = ((d.bbox?.y_min ?? 0.5) - 0.5) * 0.008 + idx * 0.001;
      return {
        ...d,
        location: {
          lat: Number((location.lat + offsetY).toFixed(6)),
          lon: Number((location.lon + offsetX).toFixed(6)),
        },
      };
    });

    const localizedResult = {
      ...result,
      detections: localizedDetections,
    };

    const record: SurveyRecord = {
      id: genId(),
      name: params.name,
      region: params.region,
      description: params.description,
      timestamp: Date.now(),
      threshold: params.threshold,
      result: localizedResult,
      isSample: false,
      imageUrl,
      location,
    };
    store.unshift(record);
    saveUserSurveys(store);
    return record;
  },
};

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
    locationName: "Gulf of Mannar, Tamil Nadu, India",
    description: "Acoustic transect: corroborated aircraft fuselage target (83% detector confidence, corroborated by PatchCore anomaly gate at 0.65).",
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2h ago
    threshold: 0.25,
    result: mockScans[0]!,
    isSample: true,
    imageUrl: "/sonar/crops/000002_processed.png",
    location: { lat: 9.15, lon: 79.15 },
  },
  {
    id: "sample-000241",
    name: "Survey 000241 — Palk Strait",
    region: "Palk Strait, TN",
    locationName: "Palk Strait, Tamil Nadu, India",
    description: "Dual-channel waterfall: corroborated shipwreck contact (75%) plus isolated open-set anomaly flagged for operator review (2 FP clutter filtered).",
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5h ago
    threshold: 0.25,
    result: mockScans[1]!,
    isSample: true,
    imageUrl: "/sonar/crops/000241_processed.png",
    location: { lat: 9.85, lon: 79.45 },
  },
  {
    id: "sample-000021",
    name: "Survey 000021 — Goa Coastline",
    region: "Goa Continental Shelf",
    locationName: "Goa Continental Shelf, India",
    description: "High-resolution side-scan pass: corroborated aircraft debris target (87% confidence, 1 low-confidence acoustic clutter false positive suppressed).",
    timestamp: Date.now() - 1000 * 60 * 60 * 9, // 9h ago
    threshold: 0.25,
    result: mockScans[2]!,
    isSample: true,
    imageUrl: "/sonar/crops/000021_processed.png",
    location: { lat: 15.40, lon: 73.70 },
  },
  {
    id: "sample-000022",
    name: "Survey 000022 — Mumbai Offshore",
    region: "Mumbai High, MH",
    locationName: "Mumbai High, Maharashtra, India",
    description: "Acoustic side-scan pass: high-confidence aircraft contact (89%) corroborated across dual sonar branches.",
    timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12h ago
    threshold: 0.25,
    result: mockScans[3]!,
    isSample: true,
    imageUrl: "/sonar/crops/000022_processed.png",
    location: { lat: 18.95, lon: 72.80 },
  },
  {
    id: "sample-000057",
    name: "Survey 000057 — Lakshadweep Ridge",
    region: "Lakshadweep Basin",
    locationName: "Lakshadweep Basin, India",
    description: "Open-set detection evaluation: uncatalogued anthropogenic debris requiring analyst review (YOLO single-branch hit at 0.74, 3 speckles suppressed).",
    timestamp: Date.now() - 1000 * 60 * 60 * 16, // 16h ago
    threshold: 0.25,
    result: mockScans[4]!,
    isSample: true,
    imageUrl: "/sonar/crops/57_processed.png",
    location: { lat: 10.57, lon: 72.64 },
  },
  {
    id: "sample-000062",
    name: "Survey 000062 — Seabed Baseline",
    region: "Palk Strait Transect B",
    locationName: "Palk Strait Transect B, Tamil Nadu, India",
    description: "Normality verification: clean seafloor frame correctly gated at anomaly score 0.1245 (below 0.3103 threshold, zero false positives generated).",
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 24h ago
    threshold: 0.25,
    result: mockScans[5]!,
    isSample: true,
    imageUrl: "/sonar/crops/62_processed.png",
    location: { lat: 9.80, lon: 79.40 },
  },
  {
    id: "sample-000132",
    name: "Survey 000132 — Coromandel Deep",
    region: "Chennai Continental Margin, TN",
    locationName: "Coromandel Deep, Chennai, India",
    description: "Deep acoustic survey pass: high-contrast submerged acoustic target with characteristic acoustic shadow.",
    timestamp: Date.now() - 1000 * 60 * 60 * 30, // 30h ago
    threshold: 0.25,
    result: {
      image_id: "SSS-000132",
      image_width: 715,
      image_height: 745,
      processing_time_ms: 340,
      detections: [
        {
          id: "det-000132-1",
          type: "known",
          class: "shipwreck",
          class_name: "shipwreck",
          source: "both",
          src: "both",
          bucket: "HIGH",
          yolo_confidence: 0.81,
          detector_confidence: 0.81,
          anomaly_score: 0.54,
          physics_score: 0.79,
          operational_confidence: 0.81,
          priority: "high_priority",
          bbox: { x_min: 0.18, y_min: 0.22, x_max: 0.82, y_max: 0.78 },
          location: { lat: 13.08, lon: 80.32 },
        },
      ],
      summary: {
        total_detections: 1,
        known_count: 1,
        unknown_anomaly_count: 0,
        false_positives_filtered: 1,
      },
    },
    isSample: true,
    imageUrl: "/sonar/crops/000132_processed.png",
    location: { lat: 13.10, lon: 80.35 },
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

export function getLocationSector(lat: number, lon: number): string {
  if (lat >= 11.8 && lat <= 12.1 && lon >= 79.7 && lon <= 80.2) return "Puducherry Offshore, Bay of Bengal";
  if (lat >= 8.5 && lat <= 10.0 && lon >= 78.0 && lon <= 80.0) return "Gulf of Mannar / Palk Strait, TN";
  if (lat >= 12.5 && lat <= 13.5 && lon >= 80.0 && lon <= 80.5) return "Chennai Offshore, Coromandel Coast";
  if (lat >= 15.0 && lat <= 15.8 && lon >= 73.4 && lon <= 74.2) return "Goa Continental Shelf, Arabian Sea";
  if (lat >= 18.5 && lat <= 19.5 && lon >= 72.5 && lon <= 73.2) return "Mumbai Offshore, Konkan Coast";
  if (lat >= 9.6 && lat <= 10.3 && lon >= 75.9 && lon <= 76.5) return "Kochi Offshore, Malabar Coast";
  if (lat >= 17.4 && lat <= 18.0 && lon >= 83.1 && lon <= 83.6) return "Visakhapatnam Coast, Bay of Bengal";
  if (lat >= 9.8 && lat <= 11.5 && lon >= 71.5 && lon <= 74.0) return "Lakshadweep Basin, Arabian Sea";
  if (lat >= 11.0 && lat <= 13.5 && lon >= 92.2 && lon <= 93.5) return "Andaman Sea, Port Blair Sector";
  const latStr = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"}`;
  const lonStr = `${Math.abs(lon).toFixed(4)}°${lon >= 0 ? "E" : "W"}`;
  return `${latStr}, ${lonStr}`;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  if (typeof window !== "undefined") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14`,
        {
          signal: controller.signal,
          headers: { "Accept-Language": "en" },
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const place =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.suburb ||
          addr.county ||
          addr.state_district ||
          addr.municipality;
        const state = addr.state;
        const country = addr.country;
        const parts = [place, state, country].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
        if (data.name) return String(data.name);
        if (data.display_name) {
          return data.display_name.split(",").slice(0, 3).map((s: string) => s.trim()).join(", ");
        }
      }
    } catch {
      // ignore network errors or timeouts
    }
  }
  return getLocationSector(lat, lon);
}

async function compressImageForStorage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return resolve("");
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1024;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          resolve(compressed);
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

const STORAGE_KEY = "hydrosentry-surveys";
const imageMemoryCache = new Map<string, string>();

function loadUserSurveys(): SurveyRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SurveyRecord[];
    list.forEach((s) => {
      if (s.imageUrl) imageMemoryCache.set(s.id, s.imageUrl);
    });
    return list;
  } catch {
    return [];
  }
}

function saveUserSurveys(records: SurveyRecord[]): void {
  if (typeof window === "undefined") return;
  const userSurveys = records.filter((r) => !r.isSample);
  for (const count of [25, 20, 15, 10, 5, 2, 1]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userSurveys.slice(0, count)));
      return;
    } catch {
      // retry with smaller subset if browser storage quota exceeded
    }
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
    const found = store.find((s) => s.id === id);
    if (!found) return null;
    if (!found.imageUrl && imageMemoryCache.has(id)) {
      return { ...found, imageUrl: imageMemoryCache.get(id) };
    }
    return found;
  },

  async create(params: SurveyCreateParams): Promise<SurveyRecord> {
    const result = await detectionProvider.detect(params.file, params.threshold);
    let imageUrl: string | undefined = undefined;
    if (params.file && typeof window !== "undefined") {
      try {
        const compressed = await compressImageForStorage(params.file);
        imageUrl = compressed || URL.createObjectURL(params.file);
      } catch {
        try {
          imageUrl = URL.createObjectURL(params.file);
        } catch {
          // ignore
        }
      }
    }

    const coordInput = params.coordinates || params.region;
    const userLocation = parseRegionToCoords(coordInput);
    const location = userLocation ?? { lat: 11.925, lon: 79.865 };

    let locationName = params.locationName?.trim();
    if (!locationName && params.region && !params.region.includes(",")) {
      locationName = params.region.trim();
    }
    if (!locationName) {
      locationName = getLocationSector(location.lat, location.lon);
    }

    // Anchor all contact detections with realistic spatial distribution around the user's GPS survey location
    const localizedDetections = result.detections.map((d, idx) => {
      const offsetX = ((d.bbox?.x_min ?? 0.5) - 0.5) * 0.006 + idx * 0.0012;
      const offsetY = ((d.bbox?.y_min ?? 0.5) - 0.5) * 0.006 + idx * 0.0012;
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
      region: locationName,
      locationName,
      description: params.description,
      timestamp: Date.now(),
      threshold: params.threshold,
      result: localizedResult,
      isSample: false,
      imageUrl,
      location,
    };
    if (imageUrl) {
      imageMemoryCache.set(record.id, imageUrl);
    }
    store.unshift(record);
    saveUserSurveys(store);
    return record;
  },
};

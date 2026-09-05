# HydroSentry

**Automated Underwater Marine Debris & Acoustic Anomaly Detection System**  
*Smart India Hackathon · Problem Statement ID: 26057*  
*Organization: Ministry of Earth Sciences (MoES) | Department: National Institute of Ocean Technology (NIOT)*  
*Theme: Disaster Management | Category: Software*

---

## 📌 Problem Context & Scope

Anthropogenic (man-made) marine debris poses an escalating ecological and navigational hazard across coastal and deep-sea environments. Among the most destructive pollutants are **ghost nets** (abandoned, lost, or discarded fishing gear) that continuously trap marine life and damage reefs, alongside industrial hazards such as submerged pipes, sunken wreckage, and discarded containers.

Marine scientists and ocean technologists rely on **Side-Scan Sonar (SSS)** towed behind survey vessels or mounted on Autonomous Underwater Vehicles (AUVs) to acoustically image the seabed. However, manual inspection of sonar waterfall logs across hundreds of kilometers of survey tracks is:
- **Labor-Intensive & Slow**: Surveyors must manually review gigabytes of continuous acoustic backscatter.
- **Prone to False Positives**: Natural seabed topology (rock clusters, sand ripples, geological ridges) casts acoustic shadows that closely resemble man-made objects.
- **Acoustically Degraded**: Sonar imagery inherently suffers from speckle noise, resolution changes across slant range, and sensor motion artifacts (heave, pitch, roll).

**HydroSentry** addresses Problem Statement 26057 by providing an automated computer vision pipeline and review dashboard designed to ingest side-scan sonar imagery, detect anthropogenic debris, filter out natural false positives, geotag anomalies, and generate structured survey reports.

---

## 🎯 Solution Architecture & Core Modules

HydroSentry is structured around the four deliverables specified in PS ID 26057:

```
                    [ Raw Side-Scan Sonar Logs (SSS) ]
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Sonar Pre-Processing & Acoustic Noise Filtering                      │
│    • Speckle noise attenuation & contrast normalization                 │
│    • Distinguishes natural geological formations from rigid debris       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. Computer Vision Anomaly Detection Engine                             │
│    • Identifies anthropogenic debris: Ghost Nets, Pipes, Wrecks         │
│    • Detects acoustic highlight + shadow pairings                       │
│    • Classifies Known vs. Unclassified seabed anomalies                │
│    • Adjustable confidence scoring (0% – 100%)                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Geotagging & Survey Mapping Engine                                   │
│    • Correlates sonar ping coordinates with localized anomaly bboxes    │
│    • Plots debris coordinates on interactive basemaps (Google / Leaflet)│
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Analyst Dashboard & Structured Reporting Engine                      │
│    • Side-by-side raw vs. annotated acoustic visualization              │
│    • Summary metrics: verified targets vs. filtered false positives     │
│    • Structured export: JSON & CSV format for NIOT survey logs          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Key Features

### 1. Acoustic Anomaly Detection & Shadow Analysis
- **Target Classes**: Detects and bounds high-risk anthropogenic debris categories:
  - **Ghost Fishing Gear & Entangled Nets** (High priority hazards)
  - **Submerged Pipes & Cylinders** (Linear acoustic profiles)
  - **Shipwreck & Metal Debris** (High-intensity acoustic backscatter)
  - **Unclassified Seabed Anomalies** (Anomalous acoustic patterns flagged for manual inspection)
- **Highlight-Shadow Association**: Recognizes that side-scan sonar targets consist of an acoustic highlight (reflected sound) followed by an acoustic shadow zone (blocked beam).
- **Interactive Threshold Tuning**: Allows surveyors to dial confidence thresholds dynamically, observing how detections and false positives respond to different seafloor clutter levels.

### 2. Geotagging & Track Cartography
- **Survey Track Plotting**: Synchronizes detected bounding boxes with recorded ping latitude and longitude coordinates.
- **Multi-Layer Cartography**: Powered by Leaflet with three focused basemap modes for coastal and offshore context:
  - **Google Hybrid**: High-resolution imagery with geographic labels and navigation references.
  - **Google Maps**: Clean topographic view for survey boundaries and coastal markers.
  - **Google Satellite**: Unobstructed aerial photography for marine survey environments.

### 3. Structured Reporting & Geotagged Export
- **Machine-Readable Exports**: Generates structured **JSON** and **CSV** reports containing:
  - Anomaly Unique ID & Timestamp
  - Geographic Coordinates (Latitude, Longitude)
  - Normalized Bounding Coordinates (`x_min`, `y_min`, `x_max`, `y_max`)
  - Detected Class & Confidence Score (%)
  - Acoustic Anomaly vs. Physics Correlation Metric
- Compatible with GIS workflows, NIOT survey databases, and post-mission cleanup logs.

### 4. Focused Analyst UI
- **Ergonomic Dual Themes**:
  - **Command Center (Dark)**: Matte obsidian interface optimized for low-glare operations in shipboard survey workstations.
  - **Tactical Daylight (Light)**: High-contrast palette with subtle gold and navy accents for bright outdoor or laboratory environments.
- **Non-Destructive Inspection**: Fast toggle between raw sonar backscatter and AI-annotated overlays without altering the underlying survey file.

---

## 💻 Tech Stack & Implementation Details

| Component | Implementation | Purpose |
|---|---|---|
| **Frontend Framework** | [TanStack Start](https://tanstack.com/start) & [React 19](https://react.dev) | Modern full-stack SSR application with type-safe routing |
| **Build & Bundle** | [Vite 8](https://vitejs.dev) & [Nitro](https://nitro.unjs.io) | Sub-second HMR and lightweight server packaging |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) + Radix UI primitives | Information-dense, accessible maritime UI components |
| **Mapping Engine** | [Leaflet](https://leafletjs.com) + Google Tile Services | Lightweight, client-rendered geospatial survey tracks |
| **Language** | [TypeScript](https://www.typescriptlang.org) | End-to-end type safety for detection schema and survey metadata |

---

## 📂 Project Structure

```
Hydro_Sentry_/
├── public/                     # Static assets & brand favicons
├── src/
│   ├── components/
│   │   ├── dashboard/          # SonarCanvas, TrackMap, BoundingBoxOverlay, MetricsCard
│   │   ├── ui/                 # Radix UI primitives, badges, and controls
│   │   └── SiteHeader.tsx      # Navigation and theme toggle
│   ├── routes/
│   │   ├── __root.tsx          # Root document & global theme provider
│   │   ├── index.tsx           # Platform landing & problem statement context
│   │   ├── dashboard.tsx       # Primary acoustic inspection & annotation workspace
│   │   ├── overview.tsx        # Survey log overview & geotagged pin summary
│   │   └── metrics.tsx         # Model performance evaluation & filtering metrics
│   ├── services/
│   │   └── detection/          # Modular detection pipeline abstraction
│   │       ├── types.ts        # Locked Detection and DetectionResult data structures
│   │       ├── provider.ts     # Interface definition (detect, checkHealth)
│   │       ├── mockProvider.ts # Representative SSS datasets across seafloor topologies
│   │       └── liveProvider.ts # REST API integration client for backend model services
│   └── styles.css              # Custom CSS tokens, tactical palettes, and layout rules
├── package.json
└── tsconfig.json
```

---

## ⚙️ Modular Model Integration

HydroSentry is engineered with a modular provider pattern in `src/services/detection/`. The frontend communicates with a standardized detection contract:

```typescript
interface Detection {
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
```

- **Current Prototype State**: Bundled with a deterministic mock provider simulating varied seafloor scenarios (cluttered rocky seafloor, sand ripple backgrounds, high-density debris zones, and empty control scans) to evaluate UI states and filtering behavior.
- **Backend Model Connection**: Pre-configured REST client in `liveProvider.ts` targeting:
  - `POST /api/detect` — Ingests side-scan sonar image files and confidence threshold parameters.
  - `GET /api/health` — Reports inference model status and runtime version.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/saanvi-006/Hydro_Sentry_.git
   cd Hydro_Sentry_
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Access the dashboard at [http://localhost:8081](http://localhost:8081) (or the port displayed in your terminal).

4. **Compile production build**:
   ```bash
   npm run build
   ```

---

## 📋 Evaluation Context

- **Event**: Smart India Hackathon (SIH)
- **Problem Statement**: ID 26057 — *AI-Powered Automated Underwater Marine Debris and Anomaly Detection System using Side-Scan Sonar Imagery*
- **Nodal Agency**: Ministry of Earth Sciences (MoES)
- **Research Institution**: National Institute of Ocean Technology (NIOT)

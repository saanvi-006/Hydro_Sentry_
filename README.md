# HydroSentry

> **Autonomous Multibeam Sonar Bathymetry & Acoustic Anomaly Detection Platform**  
> *Smart India Hackathon (SIH) Project · Operational Prototype*

---

## 🌊 Overview

**HydroSentry** is an advanced maritime command-and-control dashboard engineered for hydrographic surveyors, defense analysts, and oceanographic research teams. Built to analyze side-scan sonar and multibeam bathymetric feeds in real time, HydroSentry detects, categorizes, and localizes submerged seabed features and navigational hazards — including shipwrecks, mines, submerged aircraft, and unclassified anomalies.

Designed with tactical maritime hardware aesthetics in mind, HydroSentry balances dense operational data displays with intuitive, high-visibility visual feeds.

---

## 🚀 Key Capabilities

### 1. Acoustic Sonar Canvas & AI Annotation
- **Real-Time Bounding Box Overlays**: Normalized coordinate bounding boxes color-coded by tactical priority:
  - 🔴 **High Priority / Wreck**: `#FF453A`
  - 🟠 **Review Required / Mine**: `#FF9F0A`
  - 🔵 **Normal / Aircraft**: `#32ADE6`
  - ⚪ **Low Priority / Natural Feature**: `#8E8E93`
- **Known vs. Unclassified Classification**: Distinct solid bounding outlines for confirmed classification vs. dashed amber outlines for unclassified seabed anomalies.
- **Raw / AI-Enhanced Visualization**: Instant toggle between raw acoustic imagery and edge-sharpened, noise-reduced neural output.
- **Physics-Informed Suppression**: Active false-positive reduction pipeline filtering sediment reflections and acoustic multipath artifacts.

### 2. Geographic Mission & Track Mapping
- **Interactive Leaflet Cartography**: Precision survey track plotting, vessel heading indicators, and geospatial anomaly pins.
- **3 Google Basemap Layers**:
  - 🛰️ **Google Hybrid**: High-resolution satellite imagery with global street and boundary labels.
  - 🗺️ **Google Maps**: Clean standard vector cartography for geographic reference and bathymetric boundaries.
  - 🌍 **Google Satellite**: Pure high-definition aerial/satellite photography for coastal context.

### 3. Dual Tactical Themes
- **Dark Mode (Default Command Center)**: Deep obsidian and matte charcoal (`#121212` / `#1C1C1E`) engineered for low-light bridge and mission control environments.
- **Light Mode**: High-contrast, daylight-optimized tactical palette with subtle champagne gold (`#C9A15A`) and coastal navy mesh gradients.
- **Signature Branding**: HydroSentry concentric golden sonar arc logo (`#C9A15A`) preserved across all theme contexts.

### 4. Enterprise Architecture & Pages
- **`/` — Mission Landing**: Executive overview, operational readiness metrics, platform capabilities, and quick launch actions.
- **`/dashboard` — Survey Workspace**: Unified 3-column command center integrating file upload, confidence sliders, live sonar canvas, detection telemetry, and track mapping.
- **`/overview` — Mission Fleet Operations**: Multi-survey surveillance overview, vessel positioning, and aggregate fleet telemetry.
- **`/metrics` — Survey & Inference Reports**: Pipeline throughput, precision/recall benchmarks, physics filtering efficiency, and exportable mission summaries.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Core Framework** | [TanStack Start](https://tanstack.com/start) (Full-stack SSR) & [React 19](https://react.dev) |
| **Server Engine** | [Nitro](https://nitro.unjs.io) with Cloudflare Module preset |
| **Build Tooling** | [Vite 8](https://vitejs.dev) |
| **Styling & Design** | [Tailwind CSS](https://tailwindcss.com), Custom CSS Tokens, Glassmorphism |
| **UI Components** | [Radix UI](https://www.radix-ui.com), [Lucide React](https://lucide.dev) |
| **Cartography** | [Leaflet](https://leafletjs.com) with Google Maps Tile Services |
| **Language** | [TypeScript](https://www.typescriptlang.org) (Strict type definitions throughout) |

---

## 📐 Data Provider Architecture

HydroSentry features a decoupled data abstraction layer in `src/services/detection/`. Components consume survey feeds through a uniform interface without coupling to specific transport protocols:

```
src/services/detection/
├── types.ts          # Core Detection and DetectionResult data structures
├── provider.ts       # Uniform interface (detect, checkHealth)
├── mockProvider.ts   # Deterministic acoustic survey datasets (known/unknown/empty scans)
├── liveProvider.ts   # REST client (POST /api/detect, GET /api/health) with mock fallback
└── index.ts          # Active provider instance export
```

To switch between mock simulation and a live inference backend, adjust the export in `src/services/detection/index.ts` or define `VITE_API_BASE_URL`.

---

## 💻 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Package Manager**: `npm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/saanvi-006/Hydro_Sentry_.git
   cd Hydro_Sentry_
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:8081](http://localhost:8081) in your browser.

4. **Run production build**:
   ```bash
   npm run build
   ```

---

## 📁 Repository Structure

```
Hydro_Sentry_/
├── public/                     # Static assets & brand favicons (SVG + ICO)
├── src/
│   ├── components/             # Reusable UI & tactical components
│   │   ├── dashboard/          # SonarCanvas, TrackMap, BoundingBoxOverlay, MetricsCard
│   │   ├── ui/                 # Radix UI primitives & buttons
│   │   └── SiteHeader.tsx      # Persistent navigation header & theme switcher
│   ├── routes/                 # File-based TanStack Start routes
│   │   ├── __root.tsx          # Root document, metadata, theme provider
│   │   ├── index.tsx           # Operational home page
│   │   ├── dashboard.tsx       # Survey command workspace
│   │   ├── overview.tsx        # Multi-mission overview
│   │   └── metrics.tsx         # Survey report & model telemetry
│   ├── services/
│   │   └── detection/          # Unified mock & live detection provider
│   ├── styles.css              # Design tokens, mesh glow, theme styling
│   └── router.tsx              # Router initialization
├── app.config.ts               # TanStack Start / Nitro configuration
├── package.json                # Project dependencies and build scripts
└── tsconfig.json               # TypeScript configuration
```

---

## 📜 License & Acknowledgments
- **Project**: Developed as part of the Smart India Hackathon (SIH) prototype evaluation.
- **Classification**: Operational Prototype — Hydrographic Survey & Acoustic Anomaly Detection.

# HydroSentry 🌊

AI-assisted triage for side-scan sonar surveys — separating man-made debris and hazards from natural seafloor clutter.

HydroSentry is a prototype built for **Smart India Hackathon (SIH) Problem Statement #26057**, issued by the Ministry of Earth Sciences (MoES) through the National Institute of Ocean Technology (NIOT). It gives an analyst a single workspace to upload a side-scan sonar frame, review AI-flagged contacts against the raw acoustic image, and export a structured findings report — instead of scrolling through kilometers of sonar log by eye.

> This is the **frontend** repository. It renders detections through a swappable provider layer and currently ships with a mock data provider — see [Backend](#-backend) below for the companion detection-pipeline repo.

## 📋 Problem Statement

| Field | Detail |
|---|---|
| **ID** | 26057 |
| **Title** | AI-Powered Automated Underwater Marine Debris and Anomaly Detection System using Side-Scan Sonar Imagery |
| **Organization** | Ministry of Earth Sciences (MoES) |
| **Department** | National Institute of Ocean Technology (NIOT) |
| **Category** | Software |
| **Theme** | Disaster Management |

Marine debris — ghost nets, wreckage, and other man-made hazards — accumulates across seafloor terrain that's monitored using side-scan sonar towed behind survey vessels or mounted on AUVs. Manually reviewing that volume of acoustic imagery is slow and error-prone, and debris is easy to miss against natural clutter like rock formations and sand ripples. The problem statement calls for an end-to-end pipeline that detects man-made anomalies in sonar imagery, scores them with a confidence value to suppress false positives from acoustic shadows and noise, and surfaces the result through a dashboard that an analyst can actually use — with geotagged, exportable reports.

## 🖥️ What HydroSentry does

HydroSentry is the **user-facing dashboard** called for in the problem statement's expected solution — the piece an analyst opens to upload a survey, see detections, and download a report.

- **Sonar contact review** — upload a side-scan sonar frame and see AI-flagged contacts drawn directly on the image as bounding boxes
- **Known vs. unknown anomaly distinction** — recognized objects (shipwrecks, mines, aircraft debris) are visually distinguished from unclassified anomalies that need analyst judgment
- **Confidence-scored triage** — every contact carries a confidence score and a priority tier, so the highest-value findings surface first instead of getting buried in noise
- **Geographic context** — detections are plotted against their survey coordinates alongside the sonar canvas
- **Survey dashboard** — a rollup view across all surveys run so far: totals, classification breakdown, and top-priority findings
- **Exportable reports** — per-survey findings as downloadable CSV or JSON, matching the structured-report requirement in the problem statement

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, [TanStack Start](https://tanstack.com/start) / TanStack Router
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix primitives), lucide-react
- **Data & forms**: TanStack Query, react-hook-form, zod
- **Build tooling**: Vite

## 🔌 Detection layer

The dashboard talks to detections through a single provider interface (`src/services/detection/`), independent of whichever model or pipeline sits behind it. It currently ships with a mock provider so the UI can be demoed and evaluated standalone; swapping in the real detection backend is a one-line change (`src/services/detection/index.ts`) once it's connected, with no changes needed elsewhere in the app.

## 🔗 Backend

The detection backend — the AI/CV pipeline that actually processes sonar imagery — lives in a companion repository and is being integrated:

**https://github.com/Khushicodes15/HydroSentry**

## 🚀 Getting Started

**Prerequisites**: [Node.js](https://nodejs.org/)

```
git clone https://github.com/saanvi-006/Hydro_Sentry_.git
cd Hydro_Sentry_
npm install
npm run dev
```

Open the local URL printed in your terminal (typically `http://localhost:5173`).

## 🤖 Development Process & Acknowledgments

Initial UI scaffolding for this project was built with [Lovable](https://lovable.dev), allowing focus to stay on the detection-data architecture, dashboard interaction design, and survey/reporting workflow.

# Hydro Sentry Command

Build a React + Vite + TypeScript + Tailwind + shadcn/ui prototype called HydroSentry — an acoustic anomaly detection dashboard for the Ministry of Earth Sciences (side-scan sonar analysis: shipwrecks, mines, aircraft, and unclassified seabed anomalies). This is a hackathon prototype on the free tier — no backend calls yet, all data from a mock layer designed to be swapped for a real API later with a one-line change. Use React Router for navigation.



Budget discipline: if a single feature is going to eat the whole remaining credit budget, skip it entirely rather than half-building it — a clean, working smaller product beats a broken bigger one. If you have to cut, cut in this order (least important first): (1) the model metrics page — reduce to a static placeholder, (2) a real interactive map — reduce to a static styled list of pins/coordinates, (3) light/dark toggle, (4) any animation or transition polish. Never cut: the landing page, the core dashboard (upload + canvas + detection list), or the mock data provider structure below — those are the actual deliverable.



Design direction — read this before writing any component

This needs to look like a piece of high-end, tactical maritime hardware (think modern radar consoles or space-flight UIs), not a generic SaaS or AI-generated dashboard. Be deliberate about avoiding the following default patterns:



Explicitly avoid:



Purple-to-blue gradient hero sections, glowing buttons, or drop-shadow-everything.



Default Tailwind colors (blue-500, slate-800), or any neon/saturated accents in the core UI structure.



Oversized rounded corners on every element (rounded-3xl on cards, pills, everything).



Generic hero copy like "Revolutionize your workflow" over a stock photo or abstract 3D blob illustration.



Default fonts like Inter or Roboto at default Tailwind sizes with no real typographic hierarchy.



Bouncy micro-animations, confetti, emoji in UI copy.



Instead:



Palette (Stealth Monochrome): The UI structure must be strictly grayscale to allow the ML bounding boxes to pop.



Backgrounds: True matte black (#121212) for the app base, dark charcoal (#1C1C1E) for cards/panels.



Borders: Crisp 1px solid hairlines using slightly lighter gray (#2C2C2E), not shadows.



Primary Actions: Brutalist pure white buttons with black text.



The ONLY Color: Reserved exclusively for the bounding boxes and alert chips. Wreck/High Priority = Neon Red (#FF453A), Mine/Review = Neon Orange (#FF9F0A), Aircraft/Normal = Electric Blue (#32ADE6), Natural/Low = Muted Gray (#8E8E93).



Typography (Engineering/Premium):



UI / Data Tables: Use a technical monospace or highly structured sans-serif like JetBrains Mono, Space Grotesk, or Geist Mono. This instantly signals "engineering tool."



Headers / Display: Pair with a sharp, commanding sans like Space Grotesk or Clash Display.



Treatment: Sentence case throughout, except for tiny uppercase micro-labels (tracked-out, 11px, used sparingly for section eyebrows like "TACTICAL TRACK" or "STATUS").



Light and dark mode: Do NOT implement a light mode toggle. This is a command-center tool; force dark mode permanently.



Density over whitespace: This is an analyst tool, not a marketing site — favor compact, information-dense layouts (like a real ops dashboard) over large centered hero blocks, except on the homepage itself.



Who's using this: trained maritime/defense analysts and MoES reviewers — not general consumers. Prioritize scannability, clear data hierarchy, and unambiguous labeling over "friendly" consumer UI patterns. Avoid ML jargon in labels where a plain term works (e.g. "unclassified anomaly" not "OOD detection"), but don't dumb down the actual data density.



Pages

/ — Homepage (build this first, and give it real polish — it's the first impression)

Classic, professional, institutional. Header with a simple wordmark ("HydroSentry") and a small MoES-style tagline, not a literal government logo. A calm hero section — a subtle sonar-texture or topographic-line background (SVG/CSS, grayscale, not a stock photo), a one-line mission statement, and a single stark white "Enter Command Center" call to action. Below the fold: 3–4 simple feature/pillar cards (Real-time detection, Known vs unknown anomaly classification, False-positive suppression, Survey mapping) using shadcn Card. No login form — this can go straight into the dashboard.



/dashboard — Command center (the main screen, most of the credit budget goes here)

Three-column layout, never reloads:



Left — upload: drag-drop zone, confidence threshold slider, a "Load sample survey" button that loads mock data.



Center — sonar canvas: renders the (mock/placeholder) sonar image with bounding box overlays drawn from bbox (normalized 0–1 coordinates, scaled to display size). Boxes color-coded by priority (see mapping below), and known-type boxes get a solid outline, unknown_anomaly boxes get a dashed outline — this distinction matters, don't drop it. Raw/AI-enhanced toggle.



Right — live feed + map: scrollable detection cards (branch display on type: known shows class + detector_confidence; unknown shows "unclassified anomaly", no confidence). Summary strip showing known_count, unknown_anomaly_count, and false_positives_filtered prominently — that last number is the product's core value proposition, give it visual weight. A simple map (Leaflet if budget allows, otherwise a static styled list of coordinates) plotting each detection's location when present.



Priority → color mapping (use exactly this, don't invent your own):



high_priority → #FF453A (Neon Red)



review_required → #FF9F0A (Neon Orange)



normal → #32ADE6 (Electric Blue)



low_priority → #8E8E93 (Muted Gray)



/metrics — Model metrics (lowest priority — build only if budget remains)

Static is fine here. Inference time (from the last mock response), placeholder precision/recall numbers, and a simple labeled diagram or ordered list showing the pipeline stages (tiling → detection → physics filtering → fused output). No need for live charts.



Assets and imagery

No stock photography, no literal sonar-fish icons. For the sonar canvas, use a generated grayscale noise/texture pattern (CSS/SVG or a canvas-drawn static pattern) to suggest sonar imagery — this reads as more credible than a clean vector illustration.



Icons: lucide-react (already bundled with shadcn), outline style only, used sparingly.



Map: Leaflet with a dark tile theme if it fits the budget; otherwise degrade gracefully per the cut list above.



Mock ↔ live data architecture

Build this exact structure — it's what lets someone swap in a real backend later by changing one line:



src/services/detection/

  types.ts        // Detection, DetectionResult — exact shape below, locked

  provider.ts       // interface: detect(file, threshold), checkHealth()

  mockProvider.ts     // returns varied fake responses; simulate a short delay (300-500ms)

  liveProvider.ts      // calls POST /api/detect against VITE_API_BASE_URL; catches its own failures and falls back to mockProvider's data

  index.ts            // exports `detectionProvider`, currently = mockProvider

Every page/component calls detectionProvider.detect() / .checkHealth() only — never import mock data directly into a component.



Locked field shapes — do not rename or reshape:



TypeScript

interface Detection {

  id: string;

  type: "known" | "unknown_anomaly";

  class: "aircraft" | "mine" | "shipwreck" | null; // null when type is unknown_anomaly

  detector_confidence: number | null; // 0-1, null when no YOLO match

  anomaly_score: number; // 0-1

  physics_score: number; // 0-1

  operational_confidence: number; // 0-1

  priority: "normal" | "low_priority" | "review_required" | "high_priority";

  bbox: { x_min: number; y_min: number; x_max: number; y_max: number }; // normalized 0-1

  location: { lat: number; lon: number } | null;

}



interface DetectionResult {

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

mockProvider.ts should include at least: one scan with 2-3 mixed known/unknown detections across different priorities, one empty scan (detections: []), and one error case — enough variety to see every UI state without needing a real backend.

liveProvider.ts — build against these exact endpoints (base URL from VITE_API_BASE_URL, placeholder http://localhost:8000 for now):

POST /api/detect   (multipart/form-data: image, confidence_threshold)

GET  /api/health   → { status, model_loaded, model_version }

Errors return { error: string, code: string }.

Keep it light

No auth.

Simple skeleton/spinner loading states on mock calls.

Desktop-first for /dashboard (it's a dense 3-column ops layout) — responsive/mobile is a stretch goal, not a priority.

Minimal animation: simple fade/slide transitions only, nothing elaborate.

Build order: homepage → dashboard skeleton (all three columns wired to mock data) → dashboard polish (colors, dashed/solid boxes, map) → metrics page, in that order, stopping wherever the budget runs out.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/67d0de7f-3262-482f-bc5c-b17a40535848).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

import { useEffect, useRef } from "react";
import type { Detection } from "@/services/detection";
import { getContactSemantic } from "@/services/detection";

interface Props {
  detections: Detection[];
  enhanced: boolean;
  seed: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const realSonarImages: Record<string, { raw: string; processed: string }> = {
  "000002": { raw: "/sonar/crops/000002_raw.png", processed: "/sonar/crops/000002_processed.png" },
  "000241": { raw: "/sonar/crops/000241_raw.png", processed: "/sonar/crops/000241_processed.png" },
  "000021": { raw: "/sonar/crops/000021_raw.png", processed: "/sonar/crops/000021_processed.png" },
  "000022": { raw: "/sonar/crops/000022_raw.png", processed: "/sonar/crops/000022_processed.png" },
  "57":     { raw: "/sonar/crops/57_raw.png",     processed: "/sonar/crops/57_processed.png" },
  "000057": { raw: "/sonar/crops/57_raw.png",     processed: "/sonar/crops/57_processed.png" },
  "62":     { raw: "/sonar/crops/62_raw.png",     processed: "/sonar/crops/62_processed.png" },
  "000062": { raw: "/sonar/crops/62_raw.png",     processed: "/sonar/crops/62_processed.png" },
  "000132": { raw: "/sonar/crops/000132_raw.png", processed: "/sonar/crops/000132_processed.png" },
};

function getSonarPair(seed: string): { raw: string; processed: string } | null {
  for (const [key, pair] of Object.entries(realSonarImages)) {
    if (seed.includes(key)) return pair;
  }
  return null;
}

function drawSonar(canvas: HTMLCanvasElement, enhanced: boolean, seed: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) % 100000;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const nadir = Math.exp(-(((y - h / 2) / (h * 0.012)) ** 2));
    for (let x = 0; x < w; x++) {
      const band = 0.5 + 0.5 * Math.sin(x * 0.006 + y * 0.02);
      const grain = rand();
      let v = 32 + band * 44 + grain * (enhanced ? 38 : 72);
      v -= nadir * 24;
      v += Math.exp(-(((x - w * 0.72) / (w * 0.09)) ** 2)) * 24;
      if (enhanced) v = 24 + (v - 24) * 1.25;
      const c = Math.max(0, Math.min(255, v));
      const i = (y * w + x) * 4;
      img.data[i]     = c;
      img.data[i + 1] = c + 1;
      img.data[i + 2] = c + 3;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function SonarCanvas({ detections, enhanced, seed, selectedId, onSelect }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pair = getSonarPair(seed);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    if (pair) {
      const src = enhanced ? pair.processed : pair.raw;
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => {
        drawSonar(canvas, enhanced, seed);
      };
      img.src = src;
    } else {
      drawSonar(canvas, enhanced, seed);
    }
  }, [enhanced, seed, pair]);

  return (
    <div
      className="surface-sunken relative w-full overflow-hidden"
      style={{
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-default)",
        background: "var(--bg-surface-sunken)",
      }}
    >
      <canvas ref={ref} width={pair ? 715 : 1024} height={pair ? 745 : 640} className="block w-full h-auto" />

      {/* Center nadir track indicator — only when using synthetic fallback */}
      {!pair && (
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-px opacity-40"
          style={{ borderTop: "1px dashed var(--border-strong)" }}
        />
      )}

      {/* Bounding box overlays — only visible in Processed mode */}
      {enhanced && (
        <div className="absolute inset-0">
          {detections.map((d) => {
            const sem    = getContactSemantic(d);
            const left   = `${d.bbox.x_min * 100}%`;
            const top    = `${d.bbox.y_min * 100}%`;
            const width  = `${(d.bbox.x_max - d.bbox.x_min) * 100}%`;
            const height = `${(d.bbox.y_max - d.bbox.y_min) * 100}%`;
            const active = selectedId === d.id;

            // Confidence-weighted fill and border
            const borderAlpha = Math.max(0.5, Math.min(1, 0.35 + sem.confidence * 0.65));
            const fillAlpha   = Math.max(0.08, sem.confidence * 0.22);

            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelect(d.id)}
                style={{
                  left,
                  top,
                  width,
                  height,
                  borderColor: sem.color,
                  borderStyle: sem.isDashed ? "dashed" : "solid",
                  borderWidth: active ? 2.5 : 1.5,
                  backgroundColor: `color-mix(in srgb, ${sem.color} ${Math.round(fillAlpha * 100)}%, transparent)`,
                  boxShadow: active ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${sem.color}` : undefined,
                  opacity: borderAlpha,
                }}
                className="absolute transition-all hover:opacity-100 cursor-pointer"
              >
                {/* High-contrast identification tag */}
                <span
                  className="absolute -top-[19px] left-0 whitespace-nowrap px-1.5 py-0.5"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    backgroundColor: sem.color,
                    color: "#FFFFFF",
                    borderRadius: 2,
                    opacity: sem.badgeOpacity,
                  }}
                >
                  {sem.shortLabel} {Math.round(sem.confidence * 100)}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

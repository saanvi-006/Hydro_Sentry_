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

  useEffect(() => {
    if (ref.current) drawSonar(ref.current, enhanced, seed);
  }, [enhanced, seed]);

  return (
    <div
      className="surface-sunken relative w-full overflow-hidden"
      style={{
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-default)",
        background: "var(--bg-surface-sunken)",
      }}
    >
      <canvas ref={ref} width={1024} height={640} className="block w-full" />

      {/* Center nadir track indicator */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-px opacity-40"
        style={{ borderTop: "1px dashed var(--border-strong)" }}
      />

      {/* Bounding box overlays */}
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
                borderColor: sem.hex,
                borderStyle: sem.isDashed ? "dashed" : "solid",
                borderWidth: active ? 2.5 : 1.5,
                backgroundColor: `${sem.hex}${Math.round(fillAlpha * 255).toString(16).padStart(2, "0")}`,
                boxShadow: active ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${sem.hex}` : undefined,
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
                  backgroundColor: sem.hex,
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
    </div>
  );
}

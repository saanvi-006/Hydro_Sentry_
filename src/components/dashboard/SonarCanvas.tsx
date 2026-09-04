import { useEffect, useRef } from "react";
import type { Detection } from "@/services/detection";
import { PRIORITY_COLOR } from "@/services/detection";

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
    // across-track intensity falloff, plus a nadir band down the middle
    const nadir = Math.exp(-(((y - h / 2) / (h * 0.012)) ** 2));
    for (let x = 0; x < w; x++) {
      const band = 0.5 + 0.5 * Math.sin(x * 0.006 + y * 0.02);
      const grain = rand();
      let v = 26 + band * 46 + grain * (enhanced ? 42 : 78);
      v -= nadir * 24;
      v += Math.exp(-(((x - w * 0.72) / (w * 0.09)) ** 2)) * 22;
      if (enhanced) v = 18 + (v - 18) * 1.25;
      const c = Math.max(0, Math.min(255, v));
      const i = (y * w + x) * 4;
      img.data[i] = c;
      img.data[i + 1] = c;
      img.data[i + 2] = c + 2;
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
    <div className="relative w-full overflow-hidden rounded-sm border border-hairline bg-black">
      <canvas ref={ref} width={1024} height={640} className="block w-full" />
      <div className="absolute inset-0">
        {detections.map((d) => {
          const left = `${d.bbox.x_min * 100}%`;
          const top = `${d.bbox.y_min * 100}%`;
          const width = `${(d.bbox.x_max - d.bbox.x_min) * 100}%`;
          const height = `${(d.bbox.y_max - d.bbox.y_min) * 100}%`;
          const color = PRIORITY_COLOR[d.priority];
          const unknown = d.type === "unknown_anomaly";
          const active = selectedId === d.id;
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
                borderColor: color,
                borderStyle: unknown ? "dashed" : "solid",
                boxShadow: active ? `0 0 0 1px ${color}` : undefined,
              }}
              className="absolute border-2 transition-opacity hover:opacity-80"
            >
              <span
                className="absolute -top-[18px] left-0 whitespace-nowrap px-1 font-mono text-[10px] tracking-wide text-black"
                style={{ backgroundColor: color }}
              >
                {unknown ? "unclassified" : d.class}
                {d.detector_confidence !== null
                  ? ` ${(d.detector_confidence * 100).toFixed(0)}%`
                  : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

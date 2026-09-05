import { cn } from "@/lib/utils";

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  switch (priority) {
    case "high_priority":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold whitespace-nowrap shrink-0",
            className
          )}
          style={{
            background: "color-mix(in srgb, var(--state-known-confirmed) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--state-known-confirmed) 40%, transparent)",
            color: "var(--state-known-confirmed)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: "var(--state-known-confirmed)",
              boxShadow: "0 0 4px var(--state-known-confirmed)",
            }}
          />
          CONFIRMED THREAT
        </span>
      );
    case "review_required":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold whitespace-nowrap shrink-0",
            className
          )}
          style={{
            background: "color-mix(in srgb, var(--state-caution) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--state-caution) 40%, transparent)",
            color: "var(--state-caution)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: "var(--state-caution)",
              boxShadow: "0 0 4px var(--state-caution)",
            }}
          />
          REVIEW REQUIRED
        </span>
      );
    case "normal":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold whitespace-nowrap shrink-0",
            className
          )}
          style={{
            background: "color-mix(in srgb, var(--state-classified-benign) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--state-classified-benign) 40%, transparent)",
            color: "var(--state-classified-benign)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: "var(--state-classified-benign)",
              boxShadow: "0 0 4px var(--state-classified-benign)",
            }}
          />
          CLASSIFIED BENIGN
        </span>
      );
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold whitespace-nowrap shrink-0",
            className
          )}
          style={{
            background: "color-mix(in srgb, var(--state-unclassified) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--state-unclassified) 40%, transparent)",
            color: "var(--state-unclassified)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: "var(--state-unclassified)",
            }}
          />
          UNCLASSIFIED
        </span>
      );
  }
}

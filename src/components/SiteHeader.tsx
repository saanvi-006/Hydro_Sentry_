import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="text-[17px] font-semibold tracking-tight">HydroSentry</span>
          <span className="eyebrow hidden sm:inline">Ministry of Earth Sciences</span>
        </Link>
        <nav className="flex items-center gap-1 font-mono text-[12px]">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-sm px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground bg-secondary" }}
          >
            Overview
          </Link>
          <Link
            to="/dashboard"
            className="rounded-sm px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground bg-secondary" }}
          >
            Command center
          </Link>
          <Link
            to="/metrics"
            className="rounded-sm px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground bg-secondary" }}
          >
            Model
          </Link>
        </nav>
      </div>
    </header>
  );
}

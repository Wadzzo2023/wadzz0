import { ArrowUpRight, ScanLine } from "lucide-react";

/** The AR web app (collect drops in the real world). */
const AR_WEB_URL = "https://web.wadzzo.com";

/**
 * "Go to AR" in the sidebar, between the nav and the balance card: opens the AR web
 * app. It nudges three times after the page loads, then stays still; on hover it lifts and the
 * arrow shoots off (transform-only animation).
 */
export function ArLaunchButton({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <a
      href={AR_WEB_URL}
      target="_blank"
      rel="noreferrer"
      onClick={onNavigate}
      aria-label="Go to the AR app"
      className="group blob bg-side-ink text-side flex h-14 w-full origin-left animate-[ar-nudge_0.9s_ease-in-out_1.5s_3] items-center gap-3 px-3 transition-transform duration-200 hover:-translate-y-0.5 hover:-rotate-1"
    >
      <span className="bg-side text-side-ink flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-90">
        <ScanLine className="size-[18px]" strokeWidth={2.6} />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="display block text-2xl">Go to AR</span>
        <span className="text-side/70 block truncate text-[11px] font-semibold">Collect drops in the real world</span>
      </span>
      <ArrowUpRight className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.8} />
    </a>
  );
}

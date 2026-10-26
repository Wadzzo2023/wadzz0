import { cn } from "~/lib/utils";

const APP_STORE_URL = "https://apps.apple.com/us/app/wadzzo/id1639649037";
/** Not published yet: the Google Play tile shows "Coming soon" until this is set. */
const PLAY_STORE_URL: string | null = null;

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.1 8.79.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.51-.71 2.84-.71 1.33 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.14.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.32-3.5zM14.18 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.96-.49 2.56-1.23z" />
    </svg>
  );
}

function PlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#00D7FE" d="M3.6 2.3c-.3.3-.4.7-.4 1.3v16.8c0 .6.1 1 .4 1.3l9.5-9.7z" />
      <path fill="#FFCE00" d="m16.3 15.2-3.2-3.2 3.2-3.2 3.8 2.2c1.1.6 1.1 1.6 0 2.2z" />
      <path fill="#FF3A44" d="M16.3 15.2 13.1 12l-9.5 9.7c.4.4.9.4 1.6.1z" />
      <path fill="#00F076" d="M16.3 8.8 5.2 2.2c-.7-.4-1.2-.3-1.6.1l9.5 9.7z" />
    </svg>
  );
}

const tile = "bg-side-ink text-side flex h-8 min-w-0 items-center gap-1.5 rounded-lg px-2";

/** "Get the app": App Store and Google Play side by side, kept short for the sidebar's fixed footer. */
export function AppDownload() {
  return (
    <section aria-label="Get the Wadzzo app">
      <div className="grid grid-cols-2 gap-2">
        <a href={APP_STORE_URL} target="_blank" rel="noreferrer" className={cn(tile, "transition-transform duration-200 hover:-translate-y-0.5")}>
          <AppleLogo className="size-3.5 shrink-0" />
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[7px] font-semibold opacity-70">Download on the</span>
            <span className="block truncate text-[11px] font-bold">App Store</span>
          </span>
        </a>
        {PLAY_STORE_URL ? (
          <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className={cn(tile, "transition-transform duration-200 hover:-translate-y-0.5")}>
            <PlayLogo className="size-3.5 shrink-0" />
            <span className="min-w-0 leading-none">
              <span className="block truncate text-[7px] font-semibold opacity-70">Get it on</span>
              <span className="block truncate text-[11px] font-bold">Google Play</span>
            </span>
          </a>
        ) : (
          <span aria-disabled className={cn(tile, "cursor-default opacity-60")} title="Coming soon to Google Play">
            <PlayLogo className="size-3.5 shrink-0 grayscale" />
            <span className="min-w-0 leading-none">
              <span className="block truncate text-[7px] font-semibold opacity-70">Coming soon</span>
              <span className="block truncate text-[11px] font-bold">Google Play</span>
            </span>
          </span>
        )}
      </div>
    </section>
  );
}

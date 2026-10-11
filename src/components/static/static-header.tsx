import type { ReactNode } from "react";

/** The top of an info page (About, FAQ, Support, Privacy): eyebrow, title, one line. */
export function StaticHeader({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description?: ReactNode }) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-foreground/[0.06] p-6 sm:p-10">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.2),transparent_55%),radial-gradient(circle_at_85%_80%,hsl(190_90%_50%/0.12),transparent_55%)]" />
      <p className="label-caps text-primary">{eyebrow}</p>
      <h1 className="mt-1 font-hud text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
    </header>
  );
}

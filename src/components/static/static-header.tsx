import type { ReactNode } from "react";

/** The top of an info page (About, FAQ, Support, Privacy): a green block with a marker eyebrow, giant title and one line. */
export function StaticHeader({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description?: ReactNode }) {
  return (
    <header className="blob relative overflow-hidden bg-side p-6 text-side-ink sm:p-10">
      <p className="marker -rotate-2 text-base">*{eyebrow.toLowerCase()}*</p>
      <h1 className="display mt-2 break-words text-6xl sm:text-8xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl font-semibold text-side-ink/80">{description}</p>}
    </header>
  );
}

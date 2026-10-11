import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";

import { cn } from "~/lib/utils";

/**
 * Renders HTML written in wadzz0's rich-text editor — bounty briefs, and
 * entries submitted from there. It's user-authored markup from another app,
 * so it goes through DOMPurify before it touches the DOM; the reference
 * renders it raw.
 *
 * Every page here is client-rendered, so DOMPurify always has a `window`.
 */
export function RichText({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["style", "form", "input", "button"],
      }),
    [html],
  );

  return (
    <div
      className={cn(
        "break-words text-[13px] leading-relaxed text-ar-dim",
        "[&_a]:text-ar-green-hot [&_a]:underline [&_h1]:text-[16px] [&_h1]:font-semibold [&_h1]:text-ar-text [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-ar-text [&_h3]:font-semibold [&_h3]:text-ar-text",
        "[&_img]:my-2 [&_img]:rounded-ar [&_li]:ml-4 [&_ol]:list-decimal [&_p+p]:mt-2 [&_strong]:text-ar-text [&_ul]:list-disc",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/** The plain text inside stored HTML — for editing an entry in a textarea. */
export function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(
    DOMPurify.sanitize(html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p>/gi, "\n\n")),
    "text/html",
  );
  return doc.body.textContent?.trim() ?? "";
}

import { format, isSameDay } from "date-fns";
import { Lock } from "lucide-react";
import { useEffect, useRef } from "react";

import { BrandAvatar } from "~/components/ar/BrandAvatar";
import { Skeleton } from "~/components/ar/Skeleton";
import { cn } from "~/lib/utils";
import { type RouterOutputs } from "~/utils/api";

type Message = RouterOutputs["bounty"]["thread"][number];

/**
 * ── ChatPanel ──────────────────────────────────────────────────────────────
 *
 * Your private thread with the brand — the reference's "doubt" chat. Only
 * the two of you see it. The composer lives in the page's bottom bar, where
 * the keyboard pushes it, so this is just the transcript.
 */
export function ChatPanel({
  messages,
  loading,
  brand,
}: {
  messages: Message[] | undefined;
  loading: boolean;
  brand: { name: string; avatarUrl: string | null };
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const count = messages?.length ?? 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: count > 0 ? "smooth" : "auto", block: "end" });
  }, [count]);

  if (loading) {
    return (
      <div className="space-y-2.5" role="status" aria-label="Loading chat">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="ml-auto h-10 w-2/3" />
      </div>
    );
  }

  return (
    <div>
      <p className="font-hud mb-4 flex items-center justify-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ar-faint">
        <Lock size={10} strokeWidth={2.6} />
        Only you and {brand.name} can see this
      </p>

      {count === 0 ? (
        <div className="py-8 text-center">
          <BrandAvatar
            src={brand.avatarUrl}
            className="mx-auto h-12 w-12 rounded-[14px] ring-1 ring-white/15"
          />
          <p className="mx-auto mt-3 max-w-[17rem] text-[12.5px] leading-relaxed text-ar-faint">
            Not sure what counts? Ask {brand.name} directly before you send your entry.
          </p>
        </div>
      ) : (
        <ol className="space-y-1.5">
          {messages!.map((m, i) => {
            const prev = messages![i - 1];
            const newDay = !prev || !isSameDay(new Date(prev.createdAt), new Date(m.createdAt));
            const grouped = prev && !newDay && prev.fromBrand === m.fromBrand;
            return (
              <li key={m.id}>
                {newDay && (
                  <p className="font-hud my-3 text-center text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ar-faint">
                    {format(new Date(m.createdAt), "d MMM yyyy")}
                  </p>
                )}
                <div
                  className={cn(
                    "flex items-end gap-2",
                    m.fromBrand ? "justify-start" : "justify-end",
                    !grouped && "mt-3",
                  )}
                >
                  {m.fromBrand && (
                    <span className="w-7 shrink-0">
                      {!grouped && (
                        <BrandAvatar src={brand.avatarUrl} className="h-7 w-7 rounded-[9px]" />
                      )}
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] whitespace-pre-wrap break-words rounded-[16px] px-3.5 py-2 text-[13.5px] leading-snug",
                      m.fromBrand
                        ? "rounded-bl-[6px] border border-ar-line bg-white/[0.05] text-ar-text"
                        : "rounded-br-[6px] bg-ar-green/20 text-ar-text ring-1 ring-ar-green/40",
                    )}
                  >
                    {m.content}
                    <span className="font-hud ml-2 inline-block translate-y-[2px] text-[9px] text-ar-faint">
                      {format(new Date(m.createdAt), "HH:mm")}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div ref={endRef} />
    </div>
  );
}

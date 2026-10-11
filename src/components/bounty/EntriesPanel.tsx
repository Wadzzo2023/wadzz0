import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { type Entry, formatBytes, mediaIcon } from "~/components/bounty/EntrySheet";
import { RichText } from "~/components/bounty/RichText";
import { Skeleton } from "~/components/ar/Skeleton";
import { ENTRY_STATUS, TONE_CLASS } from "~/lib/bounty";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

/**
 * The review path wadzz0's brand screen moves an entry along. Rejected and
 * approved are two ends of the same last step.
 */
const STEPS = ["UNCHECKED", "CHECKED", "ONREVIEW", "DONE"] as const;
const STEP_LABEL = ["Sent", "Seen", "In review", "Decision"];

function stepIndex(status: Entry["status"]) {
  if (status === "APPROVED" || status === "REJECTED") return 3;
  return STEPS.indexOf(status);
}

/**
 * ── EntriesPanel ───────────────────────────────────────────────────────────
 *
 * Your own entries on this bounty — never anyone else's, same as the
 * reference. Each shows where it is in review as a four-step track, which
 * answers "did they even look at it?" without anyone having to ask in chat.
 */
export function EntriesPanel({
  bountyId,
  open,
  onEdit,
}: {
  bountyId: number;
  /** Bounty still accepting entries — edits and deletes allowed. */
  open: boolean;
  onEdit: (entry: Entry) => void;
}) {
  const entries = api.bounty.entries.useQuery({ bountyId });

  if (entries.isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading entries">
        <Skeleton className="h-[132px] w-full" />
      </div>
    );
  }

  if (entries.isError) {
    return (
      <p className="rounded-ar border border-ar-danger/40 bg-ar-danger/10 px-3.5 py-2.5 text-[12px] text-ar-danger">
        Couldn&rsquo;t load your entries.
      </p>
    );
  }

  if ((entries.data ?? []).length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-hud text-[13px] font-bold uppercase tracking-[0.14em] text-ar-dim">
          No entries yet
        </p>
        <p className="mx-auto mt-1.5 max-w-[17rem] text-[12.5px] leading-relaxed text-ar-faint">
          {open
            ? "Read the brief, do the thing, then send it in with the button below."
            : "This bounty closed before you sent anything."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(entries.data ?? []).map((entry, i) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          number={(entries.data ?? []).length - i}
          editable={open}
          onEdit={() => onEdit(entry)}
          bountyId={bountyId}
        />
      ))}
    </div>
  );
}

function EntryCard({
  entry,
  number,
  editable,
  onEdit,
  bountyId,
}: {
  entry: Entry;
  number: number;
  editable: boolean;
  onEdit: () => void;
  bountyId: number;
}) {
  const utils = api.useUtils();
  const [confirming, setConfirming] = useState(false);
  const remove = api.bounty.deleteEntry.useMutation({
    onSuccess: () =>
      Promise.all([
        utils.bounty.entries.invalidate({ bountyId }),
        utils.bounty.byId.invalidate({ id: bountyId }),
        utils.bounty.mine.invalidate(),
      ]),
  });

  const status = ENTRY_STATUS[entry.status];
  const step = stepIndex(entry.status);
  const images = entry.medias.filter((m) => m.type.startsWith("image/"));
  const files = entry.medias.filter((m) => !m.type.startsWith("image/"));

  return (
    <article className="ar-bevel rounded-ar-lg p-3.5">
      <header className="flex items-center justify-between gap-2">
        <p className="font-hud text-[10px] font-semibold uppercase tracking-[0.16em] text-ar-faint">
          Entry {number} &middot; {format(new Date(entry.createdAt), "d MMM, HH:mm")}
        </p>
        <span
          className={cn(
            "font-hud inline-flex h-[20px] items-center rounded-full border px-2 text-[9.5px] font-semibold uppercase tracking-[0.12em]",
            TONE_CLASS[status.tone],
          )}
        >
          {status.label}
        </span>
      </header>

      {/* Review track */}
      <ol className="mt-3 flex items-center gap-1" aria-label={`Review status: ${status.label}`}>
        {STEP_LABEL.map((label, i) => {
          const reached = i <= step;
          const final = i === 3 && step === 3;
          return (
            <li key={label} className="flex flex-1 flex-col gap-1">
              <span
                className={cn(
                  "h-1 rounded-full",
                  !reached
                    ? "bg-white/[0.07]"
                    : final && entry.status === "REJECTED"
                      ? "bg-ar-danger"
                      : "bg-ar-green-hot",
                )}
              />
              <span
                className={cn(
                  "font-hud text-[8.5px] font-semibold uppercase tracking-[0.1em]",
                  reached ? "text-ar-dim" : "text-ar-faint/60",
                )}
              >
                {final ? status.label : label}
              </span>
            </li>
          );
        })}
      </ol>

      <RichText html={entry.content} className="mt-3" />

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {images.map((m) => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="block aspect-square overflow-hidden rounded-[10px] bg-white/[0.04]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
            </a>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((m) => {
            const Icon = mediaIcon(m.type);
            return (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-ar border border-ar-line bg-white/[0.03] px-3 py-2"
              >
                <Icon size={15} strokeWidth={2.2} className="shrink-0 text-ar-dim" />
                <span className="min-w-0 flex-1 truncate text-[12px] text-ar-text">{m.name}</span>
                <span className="font-hud shrink-0 text-[10px] text-ar-faint">
                  {formatBytes(m.size)}
                </span>
              </a>
            );
          })}
        </div>
      )}

      {editable && (
        <div className="mt-3 flex gap-2 border-t border-ar-line pt-3">
          <button
            onClick={onEdit}
            className="font-hud flex h-8 items-center gap-1.5 rounded-full border border-ar-line px-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ar-dim hover:text-ar-text"
          >
            <Pencil size={11} strokeWidth={2.5} />
            Edit
          </button>
          <button
            onClick={() => (confirming ? remove.mutate({ entryId: entry.id }) : setConfirming(true))}
            onBlur={() => setConfirming(false)}
            disabled={remove.isPending}
            className={cn(
              "font-hud flex h-8 items-center gap-1.5 rounded-full border px-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] disabled:opacity-50",
              confirming
                ? "border-ar-danger/60 bg-ar-danger/15 text-ar-danger"
                : "border-ar-line text-ar-dim hover:text-ar-text",
            )}
          >
            <Trash2 size={11} strokeWidth={2.5} />
            {remove.isPending ? "Deleting…" : confirming ? "Tap to confirm" : "Delete"}
          </button>
          {remove.error && (
            <span className="self-center text-[11px] text-ar-danger">{remove.error.message}</span>
          )}
        </div>
      )}
    </article>
  );
}

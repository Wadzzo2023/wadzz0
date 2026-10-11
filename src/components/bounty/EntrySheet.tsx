import {
  FileText,
  Film,
  Image as ImageIcon,
  Music,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { htmlToText } from "~/components/bounty/RichText";
import { ArButton } from "~/components/ar/ArButton";
import { BottomSheet } from "~/components/ar/BottomSheet";
import {
  ENTRY_FILE_TYPES,
  entryFileProblem,
  MAX_ENTRY_FILES,
} from "~/lib/upload-files";
import { type UploadedMedia, useEntryUpload } from "~/hooks/use-entry-upload";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/utils/api";

export type Entry = RouterOutputs["bounty"]["entries"][number];

export function mediaIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Film;
  if (type.startsWith("audio/")) return Music;
  return FileText;
}

export const formatBytes = (n: number) =>
  n < 1024 * 1024
    ? `${Math.max(1, Math.round(n / 1024))} KB`
    : `${(n / (1024 * 1024)).toFixed(1)} MB`;

/**
 * ── EntrySheet ─────────────────────────────────────────────────────────────
 *
 * Send (or edit) an entry. A plain text box rather than wadzz0's desktop
 * rich-text editor — on a phone, a toolbar of formatting buttons is mostly in
 * the way — plus up to five attachments straight from the camera roll.
 *
 * Nothing is uploaded until "Send": picking a file and then changing your
 * mind shouldn't leave orphans in the bucket. Each file then shows its own
 * progress, so a slow video doesn't make the whole sheet look stuck.
 */
export function EntrySheet({
  bountyId,
  open,
  onClose,
  editing,
}: {
  bountyId: number;
  open: boolean;
  onClose: () => void;
  /** Present when editing an existing entry. */
  editing?: Entry | null;
}) {
  const utils = api.useUtils();
  const upload = useEntryUpload(bountyId);
  const inputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [kept, setKept] = useState<UploadedMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Fresh form every time the sheet opens, seeded from the entry if editing.
  // Keyed on the entry's id, not the object: a background refetch hands back
  // a new object for the same entry and must not wipe what's being typed.
  const resetUpload = upload.reset;
  const editingId = editing?.id;
  useEffect(() => {
    if (!open) return;
    setText(editing ? htmlToText(editing.content) : "");
    setKept(
      editing?.medias.map(({ url, name, size, type }) => ({ url, name, size, type })) ??
        [],
    );
    setError(null);
    resetUpload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId, resetUpload]);

  const create = api.bounty.createEntry.useMutation();
  const update = api.bounty.updateEntry.useMutation();

  const total = kept.length + upload.files.length;
  const canSend = text.trim().length >= 2 && !busy;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const bad = incoming.map((f) => [f, entryFileProblem(f)] as const).find(([, p]) => p);
    if (bad) {
      setError(`${bad[0].name}: ${bad[1]}`);
      return;
    }
    if (total + incoming.length > MAX_ENTRY_FILES) {
      setError(`Up to ${MAX_ENTRY_FILES} attachments per entry`);
      return;
    }
    setError(null);
    upload.add(incoming);
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const uploaded = await upload.uploadAll(upload.files);
      const medias = [...kept, ...uploaded];
      if (editing) {
        await update.mutateAsync({ entryId: editing.id, content: text, medias });
      } else {
        await create.mutateAsync({ bountyId, content: text, medias });
      }
      await Promise.all([
        utils.bounty.entries.invalidate({ bountyId }),
        utils.bounty.byId.invalidate({ id: bountyId }),
        utils.bounty.mine.invalidate(),
      ]);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send your entry");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={busy ? () => undefined : onClose}
      dismissible={!busy}
      labelledBy="entry-sheet-title"
      className="flex max-h-[92%] flex-col"
    >
      <div className="flex items-center justify-between px-5 pb-3 pt-2">
        <h2
          id="entry-sheet-title"
          className="font-hud text-[17px] font-bold text-ar-text"
        >
          {editing ? "Edit entry" : "Send an entry"}
        </h2>
        <button
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="text-ar-faint hover:text-ar-text disabled:opacity-40"
        >
          <X size={18} strokeWidth={2.4} />
        </button>
      </div>

      <div className="ar-scroll min-h-0 flex-1 px-5">
        <label htmlFor="entry-text" className="sr-only">
          Your entry
        </label>
        <textarea
          id="entry-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          rows={6}
          maxLength={5000}
          placeholder="What did you do? Links, context, anything the brand should know."
          className="ar-bevel w-full resize-none rounded-ar p-3.5 text-[14px] leading-relaxed text-ar-text outline-none placeholder:text-ar-faint focus:border-ar-green/50"
        />

        {/* ── Attachments ─────────────────────────────────────────── */}
        <div className="mt-3 space-y-2">
          {kept.map((m) => (
            <FileRow
              key={m.url}
              name={m.name}
              type={m.type}
              size={m.size}
              done
              onRemove={busy ? undefined : () => setKept((k) => k.filter((x) => x.url !== m.url))}
            />
          ))}
          {upload.files.map((p) => (
            <FileRow
              key={p.key}
              name={p.file.name}
              type={p.file.type}
              size={p.file.size}
              progress={busy ? p.progress : undefined}
              error={p.error}
              onRemove={busy ? undefined : () => upload.remove(p.key)}
            />
          ))}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ENTRY_FILE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {total < MAX_ENTRY_FILES && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-ar border border-dashed border-ar-line-bright text-[12.5px] font-semibold text-ar-dim hover:text-ar-text disabled:opacity-40"
          >
            <Paperclip size={15} strokeWidth={2.3} />
            Add photos, video or files
            <span className="text-ar-faint">
              ({total}/{MAX_ENTRY_FILES})
            </span>
          </button>
        )}

        {error && (
          <p className="mt-3 rounded-ar border border-ar-danger/40 bg-ar-danger/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-ar-danger">
            {error}
          </p>
        )}
      </div>

      <div className="px-5 pt-3">
        <ArButton
          variant="primary"
          size="lg"
          block
          icon={Send}
          busy={busy}
          disabled={!canSend}
          onClick={() => void send()}
        >
          {busy
            ? upload.files.length > 0
              ? "Uploading…"
              : "Sending…"
            : editing
              ? "Save changes"
              : "Send entry"}
        </ArButton>
      </div>
    </BottomSheet>
  );
}

function FileRow({
  name,
  type,
  size,
  progress,
  done,
  error,
  onRemove,
}: {
  name: string;
  type: string;
  size: number;
  progress?: number;
  done?: boolean;
  error?: string;
  onRemove?: () => void;
}) {
  const Icon = mediaIcon(type);
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-ar border bg-white/[0.03] px-3 py-2.5",
        error ? "border-ar-danger/50" : "border-ar-line",
      )}
    >
      {progress != null && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-ar-green/10 transition-[width]"
          style={{ width: `${progress}%` }}
        />
      )}
      <Icon size={16} strokeWidth={2.2} className="relative shrink-0 text-ar-dim" />
      <span className="relative min-w-0 flex-1">
        <span className="block truncate text-[12.5px] text-ar-text">{name}</span>
        <span
          className={cn(
            "font-hud block text-[10px] tabular-nums",
            error ? "text-ar-danger" : "text-ar-faint",
          )}
        >
          {error ??
            (progress != null
              ? `${progress}%`
              : done
                ? `${formatBytes(size)} · attached`
                : formatBytes(size))}
        </span>
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="relative shrink-0 text-ar-faint hover:text-ar-text"
        >
          <X size={15} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

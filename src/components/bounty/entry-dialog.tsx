"use client";

import { FileText, Film, Image as ImageIcon, Music, Paperclip, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { useEntryUpload, type UploadedMedia } from "~/hooks/use-entry-upload";
import { MAX_ENTRY_FILES, entryFileProblem } from "~/lib/upload-files";
import { api, type RouterOutputs } from "~/utils/api";

export type Entry = RouterOutputs["bounty"]["entries"][number];

/** The icon for a file's MIME type. */
export function MediaTypeIcon({ type, className }: { type: string; className?: string }) {
  if (type.startsWith("image/")) return <ImageIcon className={className} />;
  if (type.startsWith("video/")) return <Film className={className} />;
  if (type.startsWith("audio/")) return <Music className={className} />;
  return <FileText className={className} />;
}

export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`);

/** Entry HTML (from the editor) → plain text for editing. */
const htmlToText = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();

/**
 * Submit or edit an entry: a message for the brand plus up to five files.
 * Nothing uploads until "Send", so picking and dropping files costs nothing.
 */
export function EntryDialog({ bountyId, editing, onClose }: { bountyId: number; editing: Entry | null; onClose: () => void }) {
  const [text, setText] = useState(editing ? htmlToText(editing.content) : "");
  const [kept, setKept] = useState<UploadedMedia[]>(editing?.medias.map(({ url, name, size, type }) => ({ url, name, size, type })) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const upload = useEntryUpload(bountyId);
  const utils = api.useUtils();
  const create = api.bounty.createEntry.useMutation();
  const update = api.bounty.updateEntry.useMutation();
  const total = kept.length + upload.files.length;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const bad = files.map(entryFileProblem).find(Boolean);
    if (bad) return setError(bad);
    if (total + files.length > MAX_ENTRY_FILES) return setError(`Up to ${MAX_ENTRY_FILES} files per entry.`);
    setError(null);
    upload.add(files);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const uploaded = await upload.uploadAll(upload.files);
      const medias = [...kept, ...uploaded];
      if (editing) await update.mutateAsync({ entryId: editing.id, content: text.trim(), medias });
      else await create.mutateAsync({ bountyId, content: text.trim(), medias });
      await Promise.all([utils.bounty.entries.invalidate({ bountyId }), utils.bounty.byId.invalidate({ id: bountyId })]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your entry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display text-2xl">{editing ? "Edit your entry" : "Submit an entry"}</DialogTitle>
          <DialogDescription>Tell the brand about your entry and attach your work (images, video, audio, PDF).</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={5000} placeholder="What did you make? Add links if it's hosted elsewhere." className="resize-none rounded-xl" autoFocus />
          {(kept.length > 0 || upload.files.length > 0) && (
            <ul className="space-y-2">
              {kept.map((m) => (
                <FileRow busy={busy} key={m.url} name={m.name} size={m.size} type={m.type} onRemove={() => setKept((k) => k.filter((x) => x.url !== m.url))} />
              ))}
              {upload.files.map((f) => (
                <FileRow busy={busy} key={f.key} name={f.file.name} size={f.file.size} type={f.file.type} progress={f.progress} onRemove={() => upload.remove(f.key)} />
              ))}
            </ul>
          )}
          {error && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{error}</p>}
          <div className="flex items-center justify-between gap-2">
            <input ref={input} type="file" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
            <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={busy || total >= MAX_ENTRY_FILES}>
              <Paperclip className="size-4" /> Attach ({total}/{MAX_ENTRY_FILES})
            </Button>
            <Button type="submit" className="px-6 font-bold" disabled={busy || text.trim().length < 2}>
              {busy ? "Sending…" : editing ? "Save changes" : "Send entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FileRow({ name, size, type, progress, busy, onRemove }: { name: string; size: number; type: string; progress?: number; busy: boolean; onRemove?: () => void }) {
  return (
    <li className="relative flex items-center gap-3 overflow-hidden rounded-xl bg-foreground/[0.04] px-3 py-2.5 ring-1 ring-foreground/[0.06]">
      {progress != null && progress > 0 && <span aria-hidden className="absolute inset-y-0 left-0 bg-primary/12 transition-[width]" style={{ width: `${progress}%` }} />}
      <MediaTypeIcon type={type} className="relative size-4 shrink-0 text-muted-foreground" />
      <span className="relative min-w-0 flex-1">
        <span className="block truncate text-sm">{name}</span>
        <span className="block text-[11px] tabular-nums text-muted-foreground">{progress != null && progress > 0 && progress < 100 ? `${progress}%` : formatBytes(size)}</span>
      </span>
      {onRemove && !busy && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="relative text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      )}
    </li>
  );
}

"use client";

import type { MediaType } from "@prisma/client";
import { Box, Download, Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "~/lib/utils";
import { Spinner } from "~/ui/spinner";

const ModelViewer = dynamic(() => import("./model-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center">
      <Spinner />
    </div>
  ),
});

/**
 * One player for every kind of item: image, video, audio and 3D share the
 * same frame, the same fullscreen button and the same download action, so an
 * owner opens anything the same way.
 */
export function MediaPlayer({
  type,
  url,
  poster,
  title,
  className,
}: {
  type: MediaType;
  url: string;
  poster?: string | null;
  title: string;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const fullscreen = () => void (document.fullscreenElement ? document.exitFullscreen() : frame.current?.requestFullscreen());

  return (
    <div ref={frame} className={cn("group relative overflow-hidden rounded-xl border bg-surface-2", className)}>
      <div className="aspect-square w-full [:fullscreen_&]:h-full [:fullscreen_&]:aspect-auto">
        {type === "IMAGE" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={title} className="size-full object-contain" />
        )}
        {type === "VIDEO" && <video src={url} poster={poster ?? undefined} controls playsInline className="size-full bg-black object-contain" />}
        {type === "MUSIC" && <AudioPlayer url={url} poster={poster} title={title} />}
        {type === "THREE_D" && <ModelViewer url={url} />}
      </div>
      <div className="absolute right-2 top-2 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        {type === "THREE_D" && (
          <Chip label="Drag to rotate">
            <Box className="size-4" />
          </Chip>
        )}
        <IconButton label="Download" onClick={() => window.open(url, "_blank", "noopener")}>
          <Download className="size-4" />
        </IconButton>
        <IconButton label="Fullscreen" onClick={fullscreen}>
          <Maximize2 className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-lg bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
    >
      {children}
    </button>
  );
}

function Chip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex h-8 items-center gap-1.5 rounded-lg bg-black/55 px-2.5 text-xs font-medium text-white backdrop-blur-sm">
      {children}
      {label}
    </span>
  );
}

const time = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/** Cover art with play/pause, a seek bar and volume — sized like the other media. */
function AudioPlayer({ url, poster, title }: { url: string; poster?: string | null; title: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const on = {
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      timeupdate: () => setPos(a.currentTime),
      loadedmetadata: () => setDur(a.duration),
      ended: () => setPlaying(false),
    };
    for (const [k, f] of Object.entries(on)) a.addEventListener(k, f);
    return () => {
      for (const [k, f] of Object.entries(on)) a.removeEventListener(k, f);
    };
  }, []);

  const toggle = () => void (audio.current?.paused ? audio.current.play() : audio.current?.pause());

  return (
    <div className="relative flex size-full flex-col justify-end">
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <audio ref={audio} src={url} preload="metadata" muted={muted} />
      <div className="relative space-y-3 p-4 text-white">
        <p className="truncate font-hud text-lg font-semibold">{title}</p>
        <input
          type="range"
          min={0}
          max={dur || 0}
          step={0.1}
          value={pos}
          onChange={(e) => audio.current && (audio.current.currentTime = Number(e.target.value))}
          aria-label="Seek"
          className="w-full accent-[hsl(var(--primary))]"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            {playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
          </button>
          <span className="font-mono text-xs tabular-nums text-white/80">
            {time(pos)} / {time(dur)}
          </span>
          <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="ml-auto text-white/85 hover:text-white">
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

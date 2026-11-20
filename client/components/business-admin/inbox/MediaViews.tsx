"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, Mic, Pause, Play, X } from "lucide-react";
import { apiErrorMessage, fetchMediaBlob, type MediaInfo } from "@/lib/businessAdminApi";
import { formatBytes } from "@/lib/inboxLogic";

/**
 * Loads a message's file through the authenticated API as a Blob (WhatsApp's access token and download URLs never
 * reach the browser). The object URL is created on demand and revoked on unmount, so nothing leaks.
 */
export function useMediaBlob(messageId: string, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const current = useRef<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const blob = await fetchMediaBlob(messageId);
      const next = URL.createObjectURL(blob);
      if (current.current) URL.revokeObjectURL(current.current);
      current.current = next;
      setUrl(next);
      setState("ready");
      return next;
    } catch (err) {
      // Blob error responses are JSON blobs; show a short reason without trying to parse them.
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 404 ? "WhatsApp no longer has this file. Media is only kept for about 30 days." : status === 503 ? "WhatsApp is not configured on this server." : (apiErrorMessage(err) ?? "Could not download this file."));
      setState("error");
      return null;
    }
  }, [messageId]);

  useEffect(() => {
    if (enabled && state === "idle") void load();
  }, [enabled, state, load]);
  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );
  return { url, state, error, load };
}

function save(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const ErrorLine = ({ text, onRetry }: { text: string; onRetry: () => void }) => (
  <div role="alert" className="flex items-center gap-2 text-xs text-amber-200">
    <span>{text}</span>
    <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">Retry</button>
  </div>
);

export function ImageView({ messageId, media }: { messageId: string; media: MediaInfo }) {
  const m = useMediaBlob(messageId, media.available);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!media.available) return <p className="text-xs italic text-white/45">Photo not available</p>;
  return (
    <div>
      {m.state === "ready" && m.url ? (
        <button type="button" onClick={() => setOpen(true)} aria-label="Open photo" className="block overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.url} alt={media.caption ?? "Photo"} className="max-h-72 w-full max-w-[18rem] object-cover" />
        </button>
      ) : m.state === "error" ? (
        <ErrorLine text={m.error} onRetry={() => void m.load()} />
      ) : (
        <div className="flex h-40 w-56 max-w-full items-center justify-center rounded-lg bg-white/5" aria-label="Loading photo">
          <Loader2 className="animate-spin text-white/40" size={20} />
        </div>
      )}
      {open && m.url && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Photo">
          <button type="button" aria-label="Close photo" className="absolute inset-0" onClick={() => setOpen(false)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.url} alt={media.caption ?? "Photo"} className="relative max-h-full max-w-full rounded-lg object-contain" />
          <div className="absolute right-4 top-4 flex gap-2">
            <button type="button" onClick={() => save(m.url as string, media.filename ?? "photo.jpg")} aria-label="Download photo" className="rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25"><Download size={18} /></button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25"><X size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export function VideoView({ messageId, media }: { messageId: string; media: MediaInfo }) {
  const [wanted, setWanted] = useState(false);
  const m = useMediaBlob(messageId, wanted && media.available);
  if (!media.available) return <p className="text-xs italic text-white/45">Video not available</p>;
  // Videos can be large: only download when the person asks to play.
  if (!wanted) {
    return (
      <button type="button" onClick={() => setWanted(true)} className="flex h-32 w-56 max-w-full flex-col items-center justify-center gap-2 rounded-lg bg-white/6 text-white/70 hover:bg-white/10">
        <Play size={26} />
        <span className="text-xs">Play video{media.sizeBytes ? ` · ${formatBytes(media.sizeBytes)}` : ""}</span>
      </button>
    );
  }
  if (m.state === "error") return <ErrorLine text={m.error} onRetry={() => void m.load()} />;
  if (m.state !== "ready" || !m.url) return <div className="flex h-32 w-56 items-center justify-center rounded-lg bg-white/5"><Loader2 className="animate-spin text-white/40" size={20} /></div>;
  return (
    <div>
      <video src={m.url} controls preload="metadata" className="max-h-72 w-full max-w-[20rem] rounded-lg bg-black" />
      <button type="button" onClick={() => save(m.url as string, media.filename ?? "video.mp4")} className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white"><Download size={11} /> Download</button>
    </div>
  );
}

const fmtTime = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/** WhatsApp-style voice note / audio player with seek and elapsed time. */
export function AudioView({ messageId, media }: { messageId: string; media: MediaInfo }) {
  const [wanted, setWanted] = useState(false);
  const m = useMediaBlob(messageId, wanted && media.available);
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    // Start playback as soon as the file arrives after the person pressed play.
    if (wanted && m.state === "ready" && audio.current) void audio.current.play().catch(() => setPlaying(false));
  }, [wanted, m.state]);

  if (!media.available) return <p className="text-xs italic text-white/45">Audio not available</p>;
  const toggle = () => {
    if (!wanted) return setWanted(true);
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  return (
    <div className="w-60 max-w-full" data-testid="audio-view">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : media.voice ? "Play voice message" : "Play audio"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600">
          {m.state === "loading" ? <Loader2 size={16} className="animate-spin" /> : playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={dur || 1}
            step={0.1}
            value={pos}
            disabled={m.state !== "ready"}
            aria-label="Seek"
            onChange={(e) => {
              if (audio.current) audio.current.currentTime = Number(e.target.value);
              setPos(Number(e.target.value));
            }}
            className="h-1 w-full cursor-pointer accent-brand-500 disabled:opacity-40"
          />
          <div className="mt-0.5 flex items-center justify-between text-[10px] text-white/45">
            <span className="inline-flex items-center gap-1">{media.voice && <Mic size={10} />}{fmtTime(playing || pos > 0 ? pos : dur)}</span>
            {media.sizeBytes ? <span>{formatBytes(media.sizeBytes)}</span> : null}
          </div>
        </div>
      </div>
      {m.state === "error" && <ErrorLine text={m.error} onRetry={() => void m.load()} />}
      {m.state === "ready" && m.url && (
        <audio
          ref={audio}
          src={m.url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => (setPlaying(false), setPos(0))}
          onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        />
      )}
    </div>
  );
}

export function DocumentView({ messageId, media }: { messageId: string; media: MediaInfo }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = media.filename ?? "Document";
  const download = async () => {
    setBusy(true);
    setError("");
    try {
      const blob = await fetchMediaBlob(messageId);
      const url = URL.createObjectURL(blob);
      save(url, name);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 404 ? "WhatsApp no longer has this file (kept ~30 days)." : "Could not download this file.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="w-60 max-w-full">
      <div className="flex items-center gap-3 rounded-lg bg-white/6 px-3 py-2.5">
        <FileText size={22} className="shrink-0 text-brand-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/90" title={name}>{name}</p>
          <p className="text-[11px] text-white/45">{[media.mimeType?.split("/")[1]?.toUpperCase().slice(0, 12), formatBytes(media.sizeBytes)].filter(Boolean).join(" · ")}</p>
        </div>
        <button type="button" disabled={busy || !media.available} onClick={() => void download()} aria-label={`Download ${name}`} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-40">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-amber-200">{error}</p>}
    </div>
  );
}

export function MediaView({ messageId, media }: { messageId: string; media: MediaInfo }) {
  switch (media.kind) {
    case "image":
    case "sticker":
      return <ImageView messageId={messageId} media={media} />;
    case "video":
      return <VideoView messageId={messageId} media={media} />;
    case "audio":
      return <AudioView messageId={messageId} media={media} />;
    default:
      return <DocumentView messageId={messageId} media={media} />;
  }
}

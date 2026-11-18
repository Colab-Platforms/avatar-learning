"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  RefreshCw,
  Video,
  Clock,
  HardDrive,
  Calendar,
} from "lucide-react";
import {
  deleteIntroVideo,
  fetchAdminIntroVideo,
  uploadIntroVideo,
  type IntroVideoMeta,
} from "@/lib/direct2hire/introVideoApi";
import { Field, Spinner, inputCls, primaryBtn } from "@/components/admin/FormField";

function formatBytes(bytes?: string | null) {
  if (!bytes) return null;
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return null;
  const mb = n / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`;
}

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m <= 0) return `${s}s`;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export default function AdminIntroVideoPage() {
  const [video, setVideo] = useState<IntroVideoMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("Course Introduction");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminIntroVideo();
      setVideo(data);
      if (!data) setShowUpload(true);
    } catch {
      setError("Failed to load introduction video.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && (!title || title === "Course Introduction")) {
      setTitle(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    setProgress(0);
    try {
      const saved = await uploadIntroVideo(
        file,
        title.trim() || file.name,
        setProgress,
      );
      setVideo(saved);
      setShowUpload(false);
      setFile(null);
      setProgress(0);
      await load();
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        e?.response?.data?.message ?? e?.message ?? "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !video ||
      !window.confirm(
        "Delete the introduction video? Students will no longer see it until you upload a new one.",
      )
    ) {
      return;
    }
    setDeleting(true);
    setError("");
    try {
      await deleteIntroVideo();
      setVideo(null);
      setShowUpload(true);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        e?.response?.data?.message ?? e?.message ?? "Failed to delete video.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const sizeLabel = formatBytes(video?.sizeBytes);
  const durationLabel = formatDuration(video?.durationSeconds);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Intro Video</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Direct2Hire · Shared welcome video shown before any course
        </p>
      </div>

      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="h-48 rounded-2xl bg-ink-700/40 animate-pulse" />
          <div className="h-24 rounded-2xl bg-ink-700/40 animate-pulse" />
        </div>
      ) : video?.hasVideo ? (
        <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
          <div className="aspect-video bg-ink-950 relative">
            {video.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/25">
                <Video size={36} strokeWidth={1.25} />
                <span className="text-sm">No thumbnail yet</span>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
                Current Video
              </p>
              <h2 className="text-lg font-semibold text-white/90">
                {video.title}
              </h2>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/45">
              {durationLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} className="text-white/30" />
                  {durationLabel}
                </span>
              )}
              {sizeLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <HardDrive size={13} className="text-white/30" />
                  {sizeLabel}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-white/30" />
                Uploaded {formatDate(video.createdAt)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowUpload(true);
                  setTitle(video.title);
                  setFile(null);
                }}
                className={`${primaryBtn} text-xs`}
              >
                <RefreshCw size={13} />
                Replace Video
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                {deleting ? <Spinner small /> : <Trash2 size={13} />}
                Delete Video
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-ink-800 border border-white/6 rounded-2xl py-14 text-center px-6">
          <Video size={32} className="mx-auto text-white/15 mb-3" />
          <p className="text-sm text-white/50 mb-1">No introduction video yet</p>
          <p className="text-xs text-white/30 mb-5 max-w-sm mx-auto">
            Upload one welcome video for all Direct2Hire courses. Students see it
            once on their first visit.
          </p>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className={`${primaryBtn} text-xs`}
          >
            <Upload size={13} />
            Upload New Video
          </button>
        </div>
      )}

      {showUpload && (
        <form
          onSubmit={handleUpload}
          className="bg-ink-800 border border-brand-500/15 rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <Upload size={14} className="text-brand-400" />
              {video?.hasVideo ? "Replace Introduction Video" : "Upload Introduction Video"}
            </p>
            {video?.hasVideo && (
              <button
                type="button"
                onClick={() => {
                  setShowUpload(false);
                  setFile(null);
                }}
                className="text-[11px] text-white/30 hover:text-white/55 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500/30 transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={handleFile}
              className="hidden"
            />
            {file ? (
              <p className="text-sm text-brand-300">
                {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            ) : (
              <p className="text-sm text-white/35">
                Click to select a video file (mp4, mov, etc.)
              </p>
            )}
          </div>

          {file && (
            <Field label="Video Title" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Course Introduction"
                className={inputCls}
                required
              />
            </Field>
          )}

          {uploading && (
            <div>
              <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                <span>Uploading directly to Bunny.net…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {file && (
            <button
              type="submit"
              disabled={uploading}
              className={`${primaryBtn} disabled:opacity-50 w-full justify-center`}
            >
              {uploading ? (
                <>
                  <Spinner />
                  Uploading {progress}%…
                </>
              ) : (
                <>
                  <Upload size={13} />
                  {video?.hasVideo ? "Replace Video" : "Upload Video"}
                </>
              )}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clapperboard, Upload, CheckCircle2 } from "lucide-react";
import {
  fetchAdminIntroVideo,
  uploadIntroVideo,
  type AdminIntroVideo,
} from "@/lib/adminApi";
import { Field, Spinner, inputCls, primaryBtn } from "@/components/admin/FormField";

export default function IntroVideoPage() {
  const [video, setVideo] = useState<AdminIntroVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVideo(await fetchAdminIntroVideo());
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
    if (f && !title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadIntroVideo(file, title || file.name, setProgress);
      setFile(null);
      setTitle("");
      setProgress(0);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message ?? e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Intro Video</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Shown once to every student before they start their first course topic —
          same video for every course.
        </p>
      </div>

      {/* Current video */}
      <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          <Clapperboard size={14} className="text-white/35" />
          <span className="text-sm font-semibold text-white">Current Video</span>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="h-12 rounded-lg bg-ink-700/40 animate-pulse" />
          ) : video?.bunnyVideoId ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-brand-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/85 truncate">{video.title}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  Uploaded {new Date(video.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/35">
              No intro video configured yet — upload one below.
            </p>
          )}
        </div>
      </div>

      {/* Upload form */}
      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-5">
          {video?.bunnyVideoId ? "Replace Video" : "Upload Video"}
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div
            onClick={() => ref.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-brand-500/30 transition-colors"
          >
            <input ref={ref} type="file" accept="video/*" onChange={handleFile} className="hidden" />
            {file ? (
              <p className="text-xs text-brand-300">
                {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            ) : (
              <p className="text-xs text-white/30">Click to select a video file (mp4, mov, etc.)</p>
            )}
          </div>
          {file && (
            <Field label="Video Title" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
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
          {error && <p className="text-red-400 text-xs">{error}</p>}
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
                  Upload Video
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Video, FileText, Trash2, Pencil, X, Check } from "lucide-react";
import { Spinner, inputCls, primaryBtn } from "./FormField";
import { VideoUploadForm } from "./VideoUploadForm";
import { FileUploadForm } from "./FileUploadForm";
import { updateTopic, deleteTopic, deleteResource } from "@/lib/adminApi";

interface TopicResource {
  id: string;
  title: string;
  category: string;
  type: string;
  url: string;
  bunnyVideoId?: string;
  size?: string;
}

interface Topic {
  id: string;
  title: string;
  description?: string;
  topicOrder: number;
  duration?: number;
  resources: TopicResource[];
}

export function TopicRow({
  topic,
  onChanged,
}: {
  topic: Topic;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: topic.title,
    description: topic.description ?? "",
    duration: topic.duration ?? ("" as string | number),
    topicOrder: topic.topicOrder,
  });
  const [deletingTopic, setDeletingTopic] = useState(false);
  const [deletingResource, setDeletingResource] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const video = topic.resources.find((r) => r.category === "VIDEO");
  const files = topic.resources.filter((r) => r.category !== "VIDEO");

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTopic(topic.id, {
        title: form.title,
        description: form.description,
        duration: form.duration ? Number(form.duration) : undefined,
        topicOrder: form.topicOrder,
      });
      setEditing(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm({
      title: topic.title,
      description: topic.description ?? "",
      duration: topic.duration ?? "",
      topicOrder: topic.topicOrder,
    });
    setEditing(false);
  };

  const handleDeleteTopic = async () => {
    if (!confirm("Delete this topic and all its files?")) return;
    setDeletingTopic(true);
    try {
      await deleteTopic(topic.id);
      onChanged();
    } finally {
      setDeletingTopic(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    setDeletingResource(id);
    try {
      await deleteResource(id);
      onChanged();
    } finally {
      setDeletingResource(null);
    }
  };

  return (
    <div className="bg-ink-900/20 border-b border-white/4 last:border-0">
      {/* Topic header row */}
      <div className="flex items-start justify-between gap-3 px-5 py-3.5">
        {editing ? (
          <form onSubmit={submitEdit} className="flex-1 space-y-3">
            {/* Title full width */}
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={`${inputCls} w-full`}
              placeholder="Topic title"
              required
            />
            {/* Description */}
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className={`${inputCls} w-full resize-none`}
              placeholder="Description (optional)"
            />
            {/* Order + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-white/30">Order</label>
                <input
                  type="number"
                  min={1}
                  value={form.topicOrder}
                  onChange={(e) => setForm((f) => ({ ...f, topicOrder: Number(e.target.value) }))}
                  className={`${inputCls} w-full`}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-white/30">Duration (mins)</label>
                <input
                  type="number"
                  min={0}
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  className={`${inputCls} w-full`}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 text-ink-950 text-xs font-semibold hover:bg-brand-400 transition-colors disabled:opacity-50"
              >
                {saving ? <Spinner small /> : <Check size={11} />}
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs hover:text-white/70 transition-colors"
              >
                <X size={11} /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-brand-500/10 border border-brand-500/15 flex items-center justify-center shrink-0 text-[10px] font-bold text-brand-400">
                {topic.topicOrder}
              </span>
              <p className="text-sm font-semibold text-white/85 truncate">{topic.title}</p>
              {topic.duration ? (
                <span className="text-[10px] text-white/25 shrink-0">{topic.duration}m</span>
              ) : null}
            </div>
            {topic.description && (
              <p className="text-xs text-white/35 mt-1 ml-8.5">{topic.description}</p>
            )}
          </div>
        )}

        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-white/25 hover:text-brand-400 hover:bg-brand-500/8 transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={handleDeleteTopic}
              disabled={deletingTopic}
              className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
            >
              {deletingTopic ? <Spinner small /> : <Trash2 size={12} />}
            </button>
          </div>
        )}
      </div>

      {/* Media area */}
      {!editing && (
        <div className="px-5 pb-4 ml-8 space-y-2">
          {/* ── Video ── */}
          {video ? (
            <div className="flex items-center gap-2.5 bg-ink-900/60 border border-white/6 rounded-xl px-4 py-2.5">
              <Video size={13} className="text-brand-400 shrink-0" />
              <span className="text-xs text-white/70 flex-1 truncate">{video.title}</span>
              {video.size && (
                <span className="text-[10px] text-white/25 shrink-0">
                  {(Number(video.size) / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-medium text-brand-400 hover:text-brand-300 transition-colors shrink-0"
              >
                Preview
              </a>
              <button
                onClick={() => handleDeleteResource(video.id)}
                disabled={deletingResource === video.id}
                className="p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
              >
                {deletingResource === video.id ? <Spinner small /> : <Trash2 size={11} />}
              </button>
            </div>
          ) : uploadingVideo ? (
            <VideoUploadForm
              topicId={topic.id}
              onDone={() => { setUploadingVideo(false); onChanged(); }}
              onCancel={() => setUploadingVideo(false)}
            />
          ) : (
            <button
              onClick={() => setUploadingVideo(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-white/10 text-xs text-white/35 hover:text-brand-400 hover:border-brand-500/30 hover:bg-brand-500/5 transition-colors w-full justify-center"
            >
              <Video size={13} />
              Upload Lecture Video
            </button>
          )}

          {/* ── Resource files ── */}
          {files.map((res) => (
            <div
              key={res.id}
              className="flex items-center gap-2.5 bg-ink-900/60 border border-white/6 rounded-xl px-4 py-2.5"
            >
              <FileText size={13} className="text-white/35 shrink-0" />
              <span className="text-xs text-white/70 flex-1 truncate">{res.title}</span>
              {res.size && (
                <span className="text-[10px] text-white/25 shrink-0">
                  {(Number(res.size) / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
              <a
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-medium text-brand-400 hover:text-brand-300 transition-colors shrink-0"
              >
                Open
              </a>
              <button
                onClick={() => handleDeleteResource(res.id)}
                disabled={deletingResource === res.id}
                className="p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
              >
                {deletingResource === res.id ? <Spinner small /> : <Trash2 size={11} />}
              </button>
            </div>
          ))}

          {uploadingFile ? (
            <FileUploadForm
              topicId={topic.id}
              onDone={() => { setUploadingFile(false); onChanged(); }}
              onCancel={() => setUploadingFile(false)}
            />
          ) : (
            <button
              onClick={() => setUploadingFile(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-white/10 text-xs text-white/35 hover:text-white/60 hover:border-white/20 hover:bg-white/4 transition-colors w-full justify-center"
            >
              <FileText size={13} />
              Upload Resource File
            </button>
          )}
        </div>
      )}
    </div>
  );
}

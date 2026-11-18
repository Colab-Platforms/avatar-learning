import {
  ChevronDown,
  FileText,
  Trash2,
  Plus,
  Pencil,
  X,
  Check,
  Video,
  Upload,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { Spinner, inputCls, primaryBtn } from "./FormField";
import { TopicRow } from "./TopicRow";
import { InlineModuleEditor } from "./ModuleEditors";
import {
  updateLesson,
  createTopic,
  uploadVideo,
  uploadCourseFile,
  deleteResource,
} from "@/lib/adminApi";

interface Resource {
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
  resources: Resource[];
}

interface Lesson {
  id: string;
  weekNumber: number;
  title: string;
  description?: string;
  modules: string[];
  isPublished: boolean;
  isFreePreview: boolean;
  lessonOrder: number;
  resources: Resource[];
  topics: Topic[];
}

export function WeekRow({
  lesson,
  isExpanded,
  isEditingModules,
  onToggleExpand,
  onEditModules,
  onModulesSaved,
  onDelete,
  isDeleting,
  onChanged,
}: {
  lesson: Lesson;
  isExpanded: boolean;
  isEditingModules: boolean;
  onToggleExpand: () => void;
  onEditModules: () => void;
  onModulesSaved: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onChanged: () => void;
}) {
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    title: lesson.title,
    description: lesson.description ?? "",
  });

  const [addingTopic, setAddingTopic] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);
  const [topicError, setTopicError] = useState("");
  const [topicForm, setTopicForm] = useState({
    title: "",
    description: "",
    duration: "" as string | number,
    topicOrder: (lesson.topics ?? []).length + 1,
  });

  // Media attached to new topic form
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceTitle, setResourceTitle] = useState("");
  const [uploadingResource, setUploadingResource] = useState(false);

  const [deletingResource, setDeletingResource] = useState<string | null>(null);

  const orphanResources = (lesson.resources ?? []).filter(
    (r) => !(lesson.topics ?? []).some((t) => t.resources.some((tr) => tr.id === r.id)),
  );
  const sortedTopics = [...(lesson.topics ?? [])].sort((a, b) => a.topicOrder - b.topicOrder);

  /* ── Week title/desc edit ── */
  const submitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await updateLesson(lesson.id, {
        title: infoForm.title,
        description: infoForm.description,
      });
      setEditingInfo(false);
      onModulesSaved();
    } finally {
      setSavingInfo(false);
    }
  };

  /* ── Add-topic form helpers ── */
  const resetTopicForm = () => {
    setTopicForm({ title: "", description: "", duration: "", topicOrder: (lesson.topics ?? []).length + 2 });
    setVideoFile(null);
    setVideoTitle("");
    setVideoProgress(0);
    setResourceFile(null);
    setResourceTitle("");
    setTopicError("");
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setVideoFile(f);
    if (f) setVideoTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleResourcePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setResourceFile(f);
    if (f) setResourceTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const submitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTopic(true);
    setTopicError("");
    try {
      const created = await createTopic(lesson.id, {
        title: topicForm.title,
        description: topicForm.description || undefined,
        duration: topicForm.duration ? Number(topicForm.duration) : undefined,
        topicOrder: topicForm.topicOrder,
      });

      if (videoFile) {
        setUploadingVideo(true);
        try {
          await uploadVideo(created.id, videoFile, videoTitle || videoFile.name, setVideoProgress);
        } catch {
          setTopicError("Topic saved but video upload failed — retry from the topic row.");
        } finally {
          setUploadingVideo(false);
        }
      }

      if (resourceFile) {
        setUploadingResource(true);
        try {
          await uploadCourseFile(created.id, resourceFile, resourceTitle || resourceFile.name);
        } catch {
          setTopicError((p) =>
            p ? p + " Resource upload also failed." : "Topic saved but resource upload failed."
          );
        } finally {
          setUploadingResource(false);
        }
      }

      resetTopicForm();
      setAddingTopic(false);
      onChanged();
    } catch {
      setTopicError("Failed to create topic.");
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDeleteOrphanResource = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    setDeletingResource(id);
    try {
      await deleteResource(id);
      onChanged();
    } finally {
      setDeletingResource(null);
    }
  };

  const isBusy = savingTopic || uploadingVideo || uploadingResource;

  return (
    <div className="px-6 py-5">
      {/* ── Week header ── */}
      <div className="flex items-start justify-between gap-4">
        {editingInfo ? (
          <form onSubmit={submitInfo} className="flex-1 space-y-2">
            <input
              value={infoForm.title}
              onChange={(e) => setInfoForm((f) => ({ ...f, title: e.target.value }))}
              className={`${inputCls} text-sm`}
              placeholder="Week title"
              required
            />
            <textarea
              value={infoForm.description}
              onChange={(e) => setInfoForm((f) => ({ ...f, description: e.target.value }))}
              className={`${inputCls} text-xs resize-none`}
              placeholder="Description (optional)"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={savingInfo}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 text-ink-950 text-xs font-semibold hover:bg-brand-400 transition-colors disabled:opacity-50"
              >
                {savingInfo ? <Spinner small /> : <Check size={11} />}
                {savingInfo ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInfoForm({ title: lesson.title, description: lesson.description ?? "" });
                  setEditingInfo(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs hover:text-white/70 transition-colors"
              >
                <X size={11} /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={onToggleExpand}
            className="flex items-start gap-3 min-w-0 flex-1 text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-brand-400">{lesson.weekNumber}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/90">{lesson.title}</p>
              {lesson.description && (
                <p className="text-xs text-white/40 mt-0.5">{lesson.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {lesson.isFreePreview && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-elec-500/10 text-elec-400 uppercase tracking-wide">
                    Free
                  </span>
                )}
                <span className="text-[10px] text-white/25">
                  {(lesson.topics ?? []).length} topic{(lesson.topics ?? []).length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {!editingInfo && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditingInfo(true); }}
              className="p-1.5 rounded-lg text-white/25 hover:text-brand-400 hover:bg-brand-500/8 transition-colors"
            >
              <Pencil size={13} />
            </button>
          )}
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
          >
            {isDeleting ? <Spinner small /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* ── Expanded content ── */}
      {isExpanded && (
        <div className="mt-5 ml-11 space-y-3">
          {/* Topics section */}
          <div className="border border-white/6 rounded-2xl overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-5 py-3 bg-ink-900/50 border-b border-white/5">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={11} />
                Lesson Topics
                {sortedTopics.length > 0 && (
                  <span className="ml-1 text-white/20 font-normal normal-case">
                    ({sortedTopics.length})
                  </span>
                )}
              </p>
              {!addingTopic && (
                <button
                  onClick={() => setAddingTopic(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-white/35 hover:text-brand-400 transition-colors"
                >
                  <Plus size={12} /> Add Topic
                </button>
              )}
            </div>

            {/* Existing topics */}
            {sortedTopics.length > 0 && (
              <div className="divide-y divide-white/4">
                {sortedTopics.map((topic) => (
                  <TopicRow key={topic.id} topic={topic} onChanged={onChanged} />
                ))}
              </div>
            )}

            {/* ── Add Topic Form ── */}
            {addingTopic && (
              <form
                onSubmit={submitTopic}
                className="border-t border-white/5 bg-ink-900/30 p-5 space-y-4"
              >
                <p className="text-xs font-semibold text-white/60">New Topic</p>

                {/* Title (full width) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-white/35 font-medium">Topic Title *</label>
                  <input
                    value={topicForm.title}
                    onChange={(e) => setTopicForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Introduction to Generative AI"
                    className={`${inputCls} w-full`}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-white/35 font-medium">Description</label>
                  <textarea
                    value={topicForm.description}
                    onChange={(e) => setTopicForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Brief description (optional)"
                    className={`${inputCls} w-full resize-none`}
                  />
                </div>

                {/* Order + Duration row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-white/35 font-medium">Order</label>
                    <input
                      type="number"
                      min={1}
                      value={topicForm.topicOrder}
                      onChange={(e) => setTopicForm((f) => ({ ...f, topicOrder: Number(e.target.value) }))}
                      className={`${inputCls} w-full`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-white/35 font-medium">Duration (mins)</label>
                    <input
                      type="number"
                      min={0}
                      value={topicForm.duration}
                      onChange={(e) => setTopicForm((f) => ({ ...f, duration: e.target.value }))}
                      placeholder="0"
                      className={`${inputCls} w-full`}
                    />
                  </div>
                </div>

                {/* Lecture Video */}
                <div className="space-y-2">
                  <label className="text-[11px] text-white/35 font-medium flex items-center gap-1.5">
                    <Video size={11} className="text-brand-400/70" /> Lecture Video
                    <span className="text-white/20 font-normal">(optional)</span>
                  </label>
                  <div
                    onClick={() => document.getElementById(`vid-new-${lesson.id}`)?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      videoFile
                        ? "border-brand-500/40 bg-brand-500/5"
                        : "border-white/8 hover:border-white/15"
                    }`}
                  >
                    <input
                      id={`vid-new-${lesson.id}`}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoPick}
                      className="hidden"
                    />
                    {videoFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-brand-300">
                        <Check size={14} className="text-emerald-400" />
                        <span className="font-medium truncate max-w-xs">{videoFile.name}</span>
                        <span className="text-white/30 text-xs shrink-0">
                          {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-white/30">
                        <Upload size={14} />
                        <span className="text-sm">Click to attach a video file</span>
                      </div>
                    )}
                  </div>
                  {videoFile && (
                    <input
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Video title"
                      className={`${inputCls} w-full text-sm`}
                    />
                  )}
                  {uploadingVideo && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-white/30">Uploading video… {videoProgress}%</p>
                    </div>
                  )}
                </div>

                {/* Resource File */}
                <div className="space-y-2">
                  <label className="text-[11px] text-white/35 font-medium flex items-center gap-1.5">
                    <FileText size={11} className="text-white/40" /> Resource File
                    <span className="text-white/20 font-normal">(optional)</span>
                  </label>
                  <div
                    onClick={() => document.getElementById(`res-new-${lesson.id}`)?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      resourceFile
                        ? "border-brand-500/40 bg-brand-500/5"
                        : "border-white/8 hover:border-white/15"
                    }`}
                  >
                    <input
                      id={`res-new-${lesson.id}`}
                      type="file"
                      onChange={handleResourcePick}
                      className="hidden"
                    />
                    {resourceFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-brand-300">
                        <Check size={14} className="text-emerald-400" />
                        <span className="font-medium truncate max-w-xs">{resourceFile.name}</span>
                        <span className="text-white/30 text-xs shrink-0">
                          {(resourceFile.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-white/30">
                        <Upload size={14} />
                        <span className="text-sm">Click to attach a file (pdf, docx, zip…)</span>
                      </div>
                    )}
                  </div>
                  {resourceFile && (
                    <input
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                      placeholder="Resource title"
                      className={`${inputCls} w-full text-sm`}
                    />
                  )}
                  {uploadingResource && (
                    <p className="text-[10px] text-white/30 flex items-center gap-1.5">
                      <Spinner small /> Uploading resource…
                    </p>
                  )}
                </div>

                {topicError && (
                  <p className="text-red-400 text-xs bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
                    {topicError}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isBusy}
                    className={`${primaryBtn} disabled:opacity-50`}
                  >
                    {isBusy && <Spinner small />}
                    {uploadingVideo
                      ? `Uploading video… ${videoProgress}%`
                      : uploadingResource
                      ? "Uploading resource…"
                      : savingTopic
                      ? "Creating…"
                      : "Add Topic"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { resetTopicForm(); setAddingTopic(false); }}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white/70 transition-colors disabled:opacity-40"
                  >
                    <X size={13} /> Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Empty state */}
            {sortedTopics.length === 0 && !addingTopic && (
              <div className="py-8 text-center">
                <p className="text-xs text-white/25">No topics yet — click Add Topic to get started.</p>
              </div>
            )}
          </div>

          {/* Orphan resources (legacy) */}
          {orphanResources.length > 0 && (
            <div className="border border-amber-500/15 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/10">
                <p className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-widest">
                  Unassigned resources
                </p>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {orphanResources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center gap-2.5 bg-ink-900/60 border border-white/5 rounded-xl px-3.5 py-2.5"
                  >
                    <FileText size={13} className="text-white/35 shrink-0" />
                    <span className="text-xs text-white/70 flex-1 truncate">{res.title}</span>
                    <button
                      onClick={() => handleDeleteOrphanResource(res.id)}
                      disabled={deletingResource === res.id}
                      className="p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
                    >
                      {deletingResource === res.id ? <Spinner small /> : <Trash2 size={11} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Week syllabus bullets — shown on the public course page */}
          <div className="border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-ink-900/40 border-b border-white/5">
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">
                Week Syllabus{" "}
                <span className="normal-case font-normal text-white/20">
                  (shown on the public course page)
                </span>
              </p>
              {!isEditingModules && (
                <button
                  onClick={onEditModules}
                  className="flex items-center gap-1 text-[10px] text-white/30 hover:text-brand-400 transition-colors"
                >
                  <Pencil size={11} /> Edit
                </button>
              )}
            </div>
            <div className="px-4 py-3">
              {isEditingModules ? (
                <InlineModuleEditor
                  lessonId={lesson.id}
                  modules={lesson.modules}
                  onSaved={onModulesSaved}
                />
              ) : lesson.modules.length === 0 ? (
                <p className="text-xs text-white/25 py-1">
                  No syllabus bullets yet — click Edit to add.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {lesson.modules.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/55">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500/8 text-brand-400 text-[9px] font-semibold">
                        {i + 1}
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

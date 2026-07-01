import {
  ChevronDown,
  Video,
  FileText,
  Trash2,
  Upload,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Spinner, inputCls } from "./FormField";
import { InlineModuleEditor } from "./ModuleEditors";
import { VideoUploadForm } from "./VideoUploadForm";
import { updateLesson } from "@/lib/adminApi";

interface Resource {
  id: string;
  title: string;
  category: string;
  type: string;
  url: string;
  bunnyVideoId?: string;
  size?: string;
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
  onDeleteResource,
  deletingResource,
  uploadingFor,
  onStartUpload,
  onUploadDone,
  onCancelUpload,
}: {
  lesson: Lesson;
  isExpanded: boolean;
  isEditingModules: boolean;
  onToggleExpand: () => void;
  onEditModules: () => void;
  onModulesSaved: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onDeleteResource: (id: string) => void;
  deletingResource: string | null;
  uploadingFor: string | null;
  onStartUpload: () => void;
  onUploadDone: () => void;
  onCancelUpload: () => void;
}) {
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    title: lesson.title,
    description: lesson.description ?? "",
  });

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

  return (
    <div className="px-6 py-5">
      {/* Week header */}
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
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-500 text-ink-950 text-xs font-semibold hover:bg-brand-400 transition-colors disabled:opacity-50"
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
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-white/10 text-white/50 text-xs hover:text-white/70 transition-colors"
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
              <span className="text-xs font-bold text-brand-400">
                {lesson.weekNumber}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/90">
                {lesson.title}
              </p>
              {lesson.description && (
                <p className="text-xs text-white/40 mt-0.5 ">
                  {lesson.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {lesson.isFreePreview && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-elec-500/10 text-elec-400 uppercase tracking-wide">
                    Free
                  </span>
                )}
                <span className="text-[10px] text-white/25">
                  {lesson.modules.length} topics
                </span>
                <span className="text-[10px] text-white/25">
                  {lesson.resources.length} video
                  {lesson.resources.length !== 1 ? "s" : ""}
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

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 ml-11 space-y-4">
          {/* Modules section */}
          <div className="border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-ink-900/40 border-b border-white/5">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                Lesson Topics
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
                  No lesson topics yet. Click Edit to add some.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {lesson.modules.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-white/55"
                    >
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

          {/* Resources */}
          {lesson.resources.length > 0 && (
            <div className="space-y-1.5">
              {lesson.resources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center gap-2.5 bg-ink-900/60 border border-white/5 rounded-xl px-3.5 py-2.5"
                >
                  {res.category === "VIDEO" ? (
                    <Video size={13} className="text-brand-400 shrink-0" />
                  ) : (
                    <FileText size={13} className="text-white/35 shrink-0" />
                  )}
                  <span className="text-xs text-white/70 flex-1 truncate">
                    {res.title}
                  </span>
                  {res.size && (
                    <span className="text-[10px] text-white/25 shrink-0">
                      {(Number(res.size) / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                  {res.category === "VIDEO" && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-brand-400 hover:text-brand-300 transition-colors shrink-0"
                    >
                      Preview
                    </a>
                  )}
                  <button
                    onClick={() => onDeleteResource(res.id)}
                    disabled={deletingResource === res.id}
                    className="p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40 shrink-0"
                  >
                    {deletingResource === res.id ? (
                      <Spinner small />
                    ) : (
                      <Trash2 size={11} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video upload */}
          {uploadingFor === lesson.id ? (
            <VideoUploadForm
              lessonId={lesson.id}
              onDone={onUploadDone}
              onCancel={onCancelUpload}
            />
          ) : (
            <button
              onClick={onStartUpload}
              className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-brand-400 transition-colors"
            >
              <Upload size={12} /> Upload Video
            </button>
          )}
        </div>
      )}
    </div>
  );
}

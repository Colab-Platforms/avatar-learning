"use client";

import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  Pencil,
  Eye,
  EyeOff,
  X,
  Paperclip,
} from "lucide-react";
import { Field, Spinner, inputCls, primaryBtn } from "./FormField";
import { useAdminInternshipTasks } from "@/hooks/queries/useAdminInternshipTasks";
import {
  useCreateAdminInternshipTask,
  useUpdateAdminInternshipTask,
  useDeleteAdminInternshipTask,
} from "@/hooks/mutations/useAdminInternshipTasks";
import {
  uploadInternshipFileToCloudinary,
  INTERNSHIP_FILE_ACCEPT,
  type AdminInternshipTask,
  type TaskAttachmentInput,
} from "@/lib/internshipApi";

type TaskFormState = {
  weekNumber: number;
  title: string;
  shortDescription: string;
  detailedInstructions: string;
  expectedDeliverables: string;
  estimatedHours: string;
  isPublished: boolean;
  attachments: TaskAttachmentInput[];
};

const emptyForm = (weekNumber = 1): TaskFormState => ({
  weekNumber,
  title: "",
  shortDescription: "",
  detailedInstructions: "",
  expectedDeliverables: "",
  estimatedHours: "",
  isPublished: false,
  attachments: [],
});

function taskToForm(task: AdminInternshipTask): TaskFormState {
  return {
    weekNumber: task.weekNumber,
    title: task.title,
    shortDescription: task.shortDescription,
    detailedInstructions: task.detailedInstructions,
    expectedDeliverables: task.expectedDeliverables,
    estimatedHours: task.estimatedHours?.toString() ?? "",
    isPublished: task.isPublished,
    attachments: task.attachments.map((a) => ({
      url: a.url,
      publicId: a.publicId,
      originalFilename: a.originalFilename,
      mimeType: a.mimeType,
      size: a.size,
    })),
  };
}

export function InternshipTasksEditor({ courseId }: { courseId: string }) {
  const { data: tasks = [], isLoading, isError, refetch } =
    useAdminInternshipTasks(courseId);
  const createMutation = useCreateAdminInternshipTask(courseId);
  const updateMutation = useUpdateAdminInternshipTask(courseId);
  const deleteMutation = useDeleteAdminInternshipTask(courseId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm());
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const usedWeeks = useMemo(
    () => new Set(tasks.map((t) => t.weekNumber)),
    [tasks],
  );

  const nextWeek = useMemo(() => {
    for (let w = 1; w <= 8; w++) {
      if (!usedWeeks.has(w) || (editingId && form.weekNumber === w)) return w;
    }
    return 1;
  }, [usedWeeks, editingId, form.weekNumber]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(nextWeek));
    setError("");
    setShowForm(true);
  };

  const openEdit = (task: AdminInternshipTask) => {
    setEditingId(task.id);
    setForm(taskToForm(task));
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError("");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: TaskAttachmentInput[] = [];
      for (const file of files) {
        uploaded.push(await uploadInternshipFileToCloudinary(file, "admin"));
      }
      setForm((f) => ({
        ...f,
        attachments: [...f.attachments, ...uploaded],
      }));
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAttachment = (publicId: string) => {
    setForm((f) => ({
      ...f,
      attachments: f.attachments.filter((a) => a.publicId !== publicId),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      weekNumber: form.weekNumber,
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      detailedInstructions: form.detailedInstructions.trim(),
      expectedDeliverables: form.expectedDeliverables.trim(),
      estimatedHours: form.estimatedHours
        ? Number(form.estimatedHours)
        : null,
      isPublished: form.isPublished,
      attachments: form.attachments,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          taskId: editingId,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeForm();
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        e?.response?.data?.message ?? e?.message ?? "Failed to save task",
      );
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Delete this internship task? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync(taskId);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to delete task");
    }
  };

  const togglePublish = async (task: AdminInternshipTask) => {
    try {
      await updateMutation.mutateAsync({
        taskId: task.id,
        payload: { isPublished: !task.isPublished },
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to update publish status");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-ink-800 border border-white/6 rounded-2xl p-12 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6 space-y-3">
        <p className="text-sm text-red-400">Failed to load internship tasks.</p>
        <button onClick={() => refetch()} className={primaryBtn}>
          Retry
        </button>
      </div>
    );
  }

  const sorted = [...tasks].sort((a, b) => a.weekNumber - b.weekNumber);
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Internship Tasks{" "}
            <span className="text-white/30 font-normal">
              ({sorted.length} / 8)
            </span>
          </h2>
          <p className="text-xs text-white/35 mt-0.5">
            One task per week for the Direct2Hire internship. Students unlock
            weeks sequentially after approval.
          </p>
        </div>
        {sorted.length < 8 && !showForm && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/10 text-white/55 text-xs hover:text-white/80 hover:bg-white/4 transition-colors"
          >
            <Plus size={13} />
            Add Task
          </button>
        )}
      </div>

      {error && !showForm && (
        <p className="px-6 pt-4 text-xs text-red-400">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="m-4 bg-ink-900/60 border border-brand-500/15 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white/70">
              {editingId ? "Edit Internship Task" : "New Internship Task"}
            </p>
            <button
              type="button"
              onClick={closeForm}
              className="text-white/30 hover:text-white/60"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Week Number" required>
              <select
                value={form.weekNumber}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    weekNumber: Number(e.target.value),
                  }))
                }
                className={inputCls}
                required
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((w) => (
                  <option
                    key={w}
                    value={w}
                    disabled={
                      usedWeeks.has(w) &&
                      !(editingId && form.weekNumber === w)
                    }
                  >
                    Week {w}
                    {usedWeeks.has(w) &&
                    !(editingId && form.weekNumber === w)
                      ? " (taken)"
                      : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estimated Hours">
              <input
                type="number"
                min={1}
                max={200}
                value={form.estimatedHours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estimatedHours: e.target.value }))
                }
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Status">
              <label className="flex items-center gap-2 h-[42px] text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isPublished: e.target.checked }))
                  }
                  className="rounded border-white/20"
                />
                Published
              </label>
            </Field>
          </div>

          <Field label="Title" required>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className={inputCls}
              required
              placeholder="e.g. Build a Basic Chatbot"
            />
          </Field>
          <Field label="Short Description" required>
            <textarea
              value={form.shortDescription}
              onChange={(e) =>
                setForm((f) => ({ ...f, shortDescription: e.target.value }))
              }
              className={`${inputCls} min-h-[72px]`}
              required
              placeholder="Brief overview shown on the task list"
            />
          </Field>
          <Field label="Detailed Instructions" required>
            <textarea
              value={form.detailedInstructions}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  detailedInstructions: e.target.value,
                }))
              }
              className={`${inputCls} min-h-[120px]`}
              required
            />
          </Field>
          <Field label="Expected Deliverables" required>
            <textarea
              value={form.expectedDeliverables}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  expectedDeliverables: e.target.value,
                }))
              }
              className={`${inputCls} min-h-[90px]`}
              required
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                Attachments
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50"
              >
                {uploading ? <Spinner small /> : <Upload size={12} />}
                Upload files
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept={INTERNSHIP_FILE_ACCEPT}
                onChange={handleUpload}
                className="hidden"
              />
            </div>
            {form.attachments.length === 0 ? (
              <p className="text-xs text-white/25">
                Optional starter files, datasets, templates (PDF, DOC, ZIP,
                images…)
              </p>
            ) : (
              <ul className="space-y-1.5">
                {form.attachments.map((a) => (
                  <li
                    key={a.publicId}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white/3 border border-white/6 px-3 py-2"
                  >
                    <span className="text-xs text-white/70 truncate flex items-center gap-1.5">
                      <Paperclip size={12} className="text-white/30 shrink-0" />
                      {a.originalFilename}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.publicId)}
                      className="text-white/25 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || uploading}
              className={`${primaryBtn} disabled:opacity-50`}
            >
              {saving ? (
                <>
                  <Spinner />
                  Saving…
                </>
              ) : editingId ? (
                "Update Task"
              ) : (
                "Create Task"
              )}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 && !showForm ? (
        <div className="py-16 text-center">
          <FileText size={28} className="mx-auto text-white/15 mb-3" />
          <p className="text-sm text-white/35">No internship tasks yet.</p>
          <button onClick={openCreate} className={`${primaryBtn} mt-4`}>
            <Plus size={14} /> Add Week 1 Task
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {sorted.map((task) => (
            <li
              key={task.id}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4"
            >
              <div className="shrink-0 w-16">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Week {task.weekNumber}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {task.title}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.isPublished
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/5 text-white/35"
                    }`}
                  >
                    {task.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-white/40 line-clamp-2">
                  {task.shortDescription}
                </p>
                {task.attachments.length > 0 && (
                  <p className="text-[10px] text-white/25 mt-1.5 flex items-center gap-1">
                    <Paperclip size={10} />
                    {task.attachments.length} attachment
                    {task.attachments.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => togglePublish(task)}
                  title={task.isPublished ? "Unpublish" : "Publish"}
                  className="p-2 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/5"
                >
                  {task.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => openEdit(task)}
                  className="p-2 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/5"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

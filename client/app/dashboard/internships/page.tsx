"use client";

import { useMemo, useRef, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock3,
  Lock,
  Loader2,
  Upload,
  ExternalLink,
  FileText,
  X,
  Plus,
  Award,
  Paperclip,
  Link as LinkIcon,
  Download,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { useInternshipTasks } from "@/hooks/queries/useInternshipTasks";
import { useSubmitInternshipTask } from "@/hooks/mutations/useSubmitInternshipTask";
import {
  uploadInternshipFileToCloudinary,
  INTERNSHIP_FILE_ACCEPT,
  type StudentInternshipTask,
  type InternshipDerivedStatus,
  type TaskAttachmentInput,
} from "@/lib/internshipApi";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import PretextAnimatedHeight from "@/components/counselling/PretextAnimatedHeight";
import { cn } from "@/lib/utils";

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTaskDateInfo(
  task: StudentInternshipTask,
  firstSubmittedAt?: string | null,
) {
  if (task.submission?.submittedAt) {
    const date = new Date(task.submission.submittedAt);
    return `Submitted ${date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    })}`;
  }

  // Calculate due date (relative to first submission or current date)
  const anchor = firstSubmittedAt ? new Date(firstSubmittedAt) : new Date();
  const dueDate = new Date(anchor);
  dueDate.setDate(anchor.getDate() + (task.weekNumber - 1) * 7);

  return `Due: ${dueDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

const STATUS_STYLES: Record<
  InternshipDerivedStatus,
  { label: string; badge: string; card: string }
> = {
  APPROVED: {
    label: "Approved",
    badge: "bg-[#E8F8F2] text-[#00A86B] border-[#D1F2E5]",
    card: "border-slate-200/80",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    badge: "bg-[#FFF9EC] text-[#F59E0B] border-[#FDE68A]",
    card: "border-slate-200/80",
  },
  AVAILABLE: {
    label: "In Progress",
    badge: "bg-[#EEF4FF] text-[#3B82F6] border-[#DBEAFE]",
    card: "border-slate-200/80",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    card: "border-slate-200/80",
  },
  LOCKED: {
    label: "Upcoming",
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    card: "border-slate-100 opacity-85",
  },
};

function StatCard({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition-shadow duration-200">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-extrabold tracking-tight",
          accentClass,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TaskModal({
  task,
  onClose,
}: {
  task: StudentInternshipTask;
  onClose: () => void;
}) {
  const submitMutation = useSubmitInternshipTask();
  const canEdit =
    task.derivedStatus === "AVAILABLE" ||
    task.derivedStatus === "CHANGES_REQUESTED";

  const [files, setFiles] = useState<TaskAttachmentInput[]>([]);
  const [links, setLinks] = useState<{ url: string; label: string }[]>([
    { url: "", label: "" },
  ]);
  const [notes, setNotes] = useState(task.submission?.studentNotes ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: TaskAttachmentInput[] = [];
      for (const file of selected) {
        uploaded.push(await uploadInternshipFileToCloudinary(file, "user"));
      }
      setFiles((prev) => [...prev, ...uploaded]);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validLinks = links.filter((l) => l.url.trim());
    if (files.length === 0 && validLinks.length === 0) {
      setError("Add at least one file or link");
      return;
    }
    try {
      await submitMutation.mutateAsync({
        taskId: task.id,
        payload: {
          files,
          links: validLinks.map((l) => ({
            url: l.url.trim(),
            label: l.label.trim() || null,
          })),
          studentNotes: notes.trim() || null,
        },
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Submission failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Week {task.weekNumber}
            </p>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-650"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Overview
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {task.shortDescription}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Detailed Instructions
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {task.detailedInstructions}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Expected Deliverables
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {task.expectedDeliverables}
            </p>
          </section>

          {task.estimatedHours != null && (
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <Clock3 size={14} />
              Estimated {task.estimatedHours} hour
              {task.estimatedHours !== 1 ? "s" : ""}
            </p>
          )}

          {task.attachments.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Task Resources
              </h3>
              <ul className="space-y-2">
                {task.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Download size={14} />
                      <span className="truncate">{a.originalFilename}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {task.submission?.adminFeedback && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-1">
                Admin Feedback
              </p>
              <p className="text-sm text-orange-900 whitespace-pre-wrap">
                {task.submission.adminFeedback}
              </p>
            </div>
          )}

          {task.submission && !canEdit && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Your Submission
              </h3>
              <ul className="space-y-2">
                {task.submission.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
                    >
                      {a.kind === "LINK" ? (
                        <LinkIcon size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                      {a.label || a.originalFilename || a.url}
                      <ExternalLink size={12} className="text-slate-300" />
                    </a>
                  </li>
                ))}
              </ul>
              {task.submission.studentNotes && (
                <p className="mt-3 text-sm text-slate-500 whitespace-pre-wrap">
                  {task.submission.studentNotes}
                </p>
              )}
            </section>
          )}

          {canEdit && (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 border-t border-slate-100 pt-5"
            >
              <h3 className="text-sm font-semibold text-slate-800">
                Submission Area
              </h3>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Files
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="mt-1.5 w-full rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-center hover:border-blue-300 hover:bg-blue-50/50 transition-colors disabled:opacity-50"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept={INTERNSHIP_FILE_ACCEPT}
                    onChange={handleFiles}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2
                      size={20}
                      className="mx-auto animate-spin text-blue-500 mb-2"
                    />
                  ) : (
                    <Upload size={20} className="mx-auto text-slate-300 mb-2" />
                  )}
                  <p className="text-xs text-slate-500">
                    PDF, DOC, DOCX, ZIP, RAR, PNG, JPG · max 25 MB each
                  </p>
                </button>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f) => (
                      <li
                        key={f.publicId}
                        className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <Paperclip size={12} />
                          {f.originalFilename}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((prev) =>
                              prev.filter((x) => x.publicId !== f.publicId),
                            )
                          }
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Links
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setLinks((prev) => [...prev, { url: "", label: "" }])
                    }
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={12} /> Add link
                  </button>
                </div>
                <div className="space-y-2">
                  {links.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={link.label}
                        onChange={(e) =>
                          setLinks((prev) =>
                            prev.map((l, idx) =>
                              idx === i ? { ...l, label: e.target.value } : l,
                            ),
                          )
                        }
                        placeholder="Label (GitHub, Figma…)"
                        className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                      <input
                        value={link.url}
                        onChange={(e) =>
                          setLinks((prev) =>
                            prev.map((l, idx) =>
                              idx === i ? { ...l, url: e.target.value } : l,
                            ),
                          )
                        }
                        placeholder="https://…"
                        type="url"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                      {links.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setLinks((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="text-slate-300 hover:text-red-500 px-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Student Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                  placeholder="Anything your reviewer should know…"
                />
              </div>

              {error && (
                <p className="text-sm text-red-650 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitMutation.isPending || uploading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-semibold py-3 hover:bg-blue-500 disabled:opacity-60 transition-colors"
              >
                {submitMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {task.derivedStatus === "CHANGES_REQUESTED"
                  ? "Resubmit Work"
                  : "Submit Work"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardInternshipsPage() {
  const { data, isLoading, isError, error, refetch } = useInternshipTasks();
  const [selectedTask, setSelectedTask] =
    useState<StudentInternshipTask | null>(null);

  const { user } = useAppSelector((s) => s.auth);

  const progress = data?.progress;
  const tasks = useMemo(
    () => [...(data?.tasks ?? [])].sort((a, b) => a.weekNumber - b.weekNumber),
    [data?.tasks],
  );
  const allApproved =
    (progress?.total ?? 0) > 0 && progress?.approvedCount === progress?.total;

  const firstSubmittedAt = useMemo(() => {
    const sorted = [...tasks]
      .filter((t) => t.submission?.submittedAt)
      .sort(
        (a, b) =>
          new Date(a.submission!.submittedAt).getTime() -
          new Date(b.submission!.submittedAt).getTime(),
      );
    return sorted[0]?.submission?.submittedAt || null;
  }, [tasks]);

  const activeTask = useMemo(() => {
    return tasks.find(
      (t) =>
        t.derivedStatus === "AVAILABLE" ||
        t.derivedStatus === "CHANGES_REQUESTED" ||
        t.derivedStatus === "UNDER_REVIEW",
    );
  }, [tasks]);

  const nextDeadlineStr = useMemo(() => {
    if (!activeTask) return "No upcoming deadlines";
    const anchor = firstSubmittedAt ? new Date(firstSubmittedAt) : new Date();
    const dueDate = new Date(anchor);
    dueDate.setDate(anchor.getDate() + (activeTask.weekNumber - 1) * 7);
    return `Next deadline: ${dueDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }, [activeTask, firstSubmittedAt]);

  const userDisplayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : "John Doe";

  const userD2HId = user?.id
    ? `D2H-${user.id.slice(-4).toUpperCase()}`
    : "D2H-2847";

  const currentMonthYear = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 rounded bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? "Failed to load internship tasks.";
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Briefcase size={20} className="text-blue-600" />
          Internships
        </h1>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-650">
          {message}
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data?.course) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Briefcase size={20} className="text-blue-600" />
          Internships
        </h1>
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm px-6">
          <Briefcase size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-600 font-medium mb-1">
            Select your Direct2Hire course first
          </p>
          <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
            Internship tasks unlock after counselling is complete and you choose
            a course.
          </p>
          <Link
            href="/dashboard/counselling"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-blue-500"
          >
            Go to Counselling
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Search & Profile Header */}
      {/* <header className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-8 py-4 bg-white border-b border-slate-200/50">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search here..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-200/50 focus:bg-white border-0 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white" />
          </button>

          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {userDisplayName}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                {userD2HId} · {currentMonthYear}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-350/10 flex items-center justify-center font-bold text-slate-600 text-sm">
                {userDisplayName[0]?.toUpperCase()}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
        {/* Course info title */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="inline-block bg-[#E6F0FA] text-[#1E6BFF] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
              DIRECT2HIRE PROGRAMME
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Internships Tasks
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 max-w-xl">
              Complete 8 weekly tasks to earn your 2-month Internship
              Certificate.
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium bg-slate-100 w-fit px-2 py-0.5 rounded">
              Course: {data.course.title}
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm text-right shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tasks Completed
            </p>
            <p className="text-3xl font-black text-[#1E6BFF] mt-1">
              {progress?.approvedCount ?? 0}
              <span className="text-slate-300 font-medium text-lg ml-1">
                / {progress?.total ?? 0}
              </span>
            </p>
          </div>
        </div>

        {/* Your Internship Progress card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-800">
              Your Internship Progress
            </h3>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {progress?.approvedCount ?? 0} of {progress?.total ?? 0} tasks
              approved
            </span>
          </div>

          <div className="h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-[#1E6BFF] transition-all duration-700"
              style={{
                width: `${
                  progress?.total
                    ? Math.round(
                        ((progress.approvedCount ?? 0) / progress.total) * 100,
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              label="Approved"
              value={progress?.approved ?? 0}
              accentClass="text-[#10B981]"
            />
            <StatCard
              label="Under Review"
              value={progress?.underReview ?? 0}
              accentClass="text-[#F59E0B]"
            />
            <StatCard
              label="In Progress"
              value={progress?.available ?? 0}
              accentClass="text-[#3B82F6]"
            />
            <StatCard
              label="Upcoming"
              value={progress?.locked ?? 0}
              accentClass="text-[#6B7280]"
            />
          </div>

          <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-[#1E6BFF]" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Complete and get all 8 tasks approved to unlock your{" "}
                <span className="font-bold text-slate-800">
                  2-month Internship Certificate
                </span>
                .
              </p>
            </div>

            <button
              disabled={!allApproved}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-sm transition-all duration-200"
            >
              <Download size={14} className="text-slate-500" />
              Download Certificate
            </button>
          </div>
        </div>

        {/* All Tasks Section */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              All Tasks{" "}
              <span className="text-slate-400 font-normal text-xs ml-1">
                (1 per week)
              </span>
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {nextDeadlineStr}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Internship tasks for this course have not been published yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tasks.map((task) => {
                const style =
                  STATUS_STYLES[task.derivedStatus] || STATUS_STYLES.LOCKED;
                const isLocked = task.derivedStatus === "LOCKED";
                const primaryAction =
                  task.derivedStatus === "AVAILABLE" ||
                  task.derivedStatus === "CHANGES_REQUESTED"
                    ? "Submit Work"
                    : "View Task";

                if (isLocked) {
                  return (
                    <div
                      key={task.id}
                      className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-h-[240px] flex flex-col justify-between overflow-hidden"
                    >
                      {/* Background Faded Content */}
                      <div className="filter blur-[1px] opacity-25 select-none pointer-events-none flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 border border-slate-200 uppercase">
                              Upcoming
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Week {task.weekNumber}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-850">
                            Task {task.weekNumber}: {task.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            {task.shortDescription}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                          <button className="flex-1 py-2 text-xs font-semibold border border-slate-200 rounded-xl text-slate-400 bg-white">
                            View Task
                          </button>
                          <button className="flex-1 py-2 text-xs font-semibold border border-slate-100 rounded-xl text-slate-355 bg-slate-50">
                            Locked
                          </button>
                        </div>
                      </div>

                      {/* Locked Overlay */}
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-sm border border-slate-200/60 mb-2">
                          <Lock size={16} />
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                          Unlocks after Task {task.weekNumber - 1}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                          is approved
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "rounded-2xl border bg-white p-5 shadow-sm min-h-[240px] flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300",
                      style.card,
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <span
                          className={cn(
                            "inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase",
                            style.badge,
                          )}
                        >
                          {style.label}
                        </span>

                        <div className="text-right">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Week {task.weekNumber}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                            {getTaskDateInfo(task, firstSubmittedAt)}
                          </p>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-800 hover:text-[#1E6BFF] transition-colors">
                        Task {task.weekNumber}: {task.title}
                      </h3>

                      <PretextAnimatedHeight
                        text={task.shortDescription}
                        font="13px Inter"
                        lineHeight={18}
                        className="mt-2"
                      >
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {task.shortDescription}
                        </p>
                      </PretextAnimatedHeight>

                      {task.derivedStatus === "CHANGES_REQUESTED" &&
                        task.submission?.adminFeedback && (
                          <PretextAnimatedHeight
                            text={task.submission.adminFeedback}
                            font="11px Inter"
                            lineHeight={16}
                            className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-2.5"
                          >
                            <p className="text-[11px] text-orange-700 font-medium">
                              Feedback: {task.submission.adminFeedback}
                            </p>
                          </PretextAnimatedHeight>
                        )}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="flex-1 py-2.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        View Task
                      </button>

                      {task.derivedStatus === "APPROVED" ? (
                        <div className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm cursor-default">
                          Approved ✓
                        </div>
                      ) : task.derivedStatus === "UNDER_REVIEW" ? (
                        <div className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 shadow-sm cursor-default">
                          Pending Review
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="flex-1 py-2.5 text-xs font-bold bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm shadow-blue-100"
                        >
                          {primaryAction}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Internship Certificate Banner */}
        <div className="rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm flex flex-col md:flex-row min-h-[260px] bg-slate-100">
          {/* Left side: Blue info */}
          <div className="flex-1 bg-[#1A52B8] p-8 md:p-10 flex flex-col justify-between text-white relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

            <div>
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                <Award size={24} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Internship Certificate
              </h3>
              <p className="text-xs md:text-sm text-white/80 mt-2 max-w-sm leading-relaxed font-medium">
                Complete and get all 8 tasks approved to unlock your official
                2-month Internship Certificate from Avatar India.
              </p>
            </div>

            <div className="mt-6 md:mt-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                Progress: {progress?.approvedCount ?? 0} /{" "}
                {progress?.total ?? 0} tasks approved
              </span>
            </div>
          </div>

          {/* Right side: Mockup image area */}
          <div className="w-full md:w-[350px] lg:w-[450px] bg-[#E2E8F0] flex items-center justify-center min-h-[180px] md:min-h-0 relative select-none">
            {/* Diagonal split effect on desktop */}
            <div
              className="absolute top-0 left-0 bottom-0 w-16 bg-[#1A52B8] hidden md:block"
              style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            />

            <span className="text-3xl md:text-4xl font-black tracking-widest text-[#94A3B8]">
              IMAGE
            </span>
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskModal
          task={tasks.find((t) => t.id === selectedTask.id) ?? selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

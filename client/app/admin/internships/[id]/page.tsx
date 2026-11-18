"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  Pencil,
  X,
  Check,
  Users,
} from "lucide-react";
import {
  fetchAdminInternship,
  updateInternship,
  toggleInternshipPublish,
} from "@/lib/adminApi";
import type { OutcomeItem } from "@/lib/internshipsApi";
import { Field, Spinner, primaryBtn, inputCls } from "@/components/admin/FormField";
import {
  LearnItemEditor,
  CourseLearnItem,
} from "@/components/admin/LearnItemEditor";

interface Internship {
  id: string;
  title: string;
  slug: string;
  company: string;
  description?: string;
  domain?: string;
  stipend?: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "REMOTE";
  location?: string;
  deadline?: string;
  isPublished: boolean;
  keyLearningOutcomes?: OutcomeItem[];
  majorProject?: OutcomeItem[];
  whatYouReceive?: OutcomeItem[];
  category: { id: string; name: string };
  _count: { applications: number };
}

const EMPLOYMENT_COLOR: Record<string, string> = {
  FULL_TIME: "text-emerald-400 bg-emerald-400/10",
  PART_TIME: "text-amber-400 bg-amber-400/10",
  REMOTE: "text-blue-400 bg-blue-400/10",
};

const toLearnItems = (raw: unknown): CourseLearnItem[] => {
  if (!Array.isArray(raw)) return [];
  return (raw as CourseLearnItem[]).map((item) => ({
    title: item?.title ?? "",
    body: item?.body ?? "",
  }));
};

const filterItems = (items: CourseLearnItem[]) =>
  items.filter((item) => item.title.trim() && item.body.trim());

export default function AdminInternshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [editingHeader, setEditingHeader] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    title: "",
    company: "",
    description: "",
    employmentType: "FULL_TIME" as "FULL_TIME" | "PART_TIME" | "REMOTE",
    location: "",
    stipend: "",
    domain: "",
    deadline: "",
  });

  const [keyLearningOutcomes, setKeyLearningOutcomes] = useState<
    CourseLearnItem[]
  >([]);
  const [majorProject, setMajorProject] = useState<CourseLearnItem[]>([]);
  const [whatYouReceive, setWhatYouReceive] = useState<CourseLearnItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminInternship(id);
      setInternship(data);
      setKeyLearningOutcomes(toLearnItems(data.keyLearningOutcomes));
      setMajorProject(toLearnItems(data.majorProject));
      setWhatYouReceive(toLearnItems(data.whatYouReceive));
    } catch {
      setError("Failed to load internship.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const handlePublish = async () => {
    setTogglingPublish(true);
    try {
      await toggleInternshipPublish(id);
      await load();
    } catch {
      setError("Failed to toggle publish state.");
    } finally {
      setTogglingPublish(false);
    }
  };

  const startEditHeader = () => {
    if (!internship) return;
    setHeaderForm({
      title: internship.title,
      company: internship.company,
      description: internship.description ?? "",
      employmentType: internship.employmentType,
      location: internship.location ?? "",
      stipend: internship.stipend ?? "",
      domain: internship.domain ?? "",
      deadline: internship.deadline ? internship.deadline.slice(0, 10) : "",
    });
    setEditingHeader(true);
  };

  const submitHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHeader(true);
    setError("");
    try {
      await updateInternship(id, {
        ...headerForm,
        deadline: headerForm.deadline || undefined,
      });
      setEditingHeader(false);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to update internship.");
    } finally {
      setSavingHeader(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMsg(null);
    try {
      await updateInternship(id, {
        keyLearningOutcomes: filterItems(keyLearningOutcomes),
        majorProject: filterItems(majorProject),
        whatYouReceive: filterItems(whatYouReceive),
      });
      setMsg({ text: "Internship details saved successfully!", ok: true });
      setTimeout(() => load(), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        text: e?.response?.data?.message ?? "Failed to save. Please try again.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`rounded-2xl bg-ink-800 animate-pulse ${i === 0 ? "h-32" : "h-24"}`}
          />
        ))}
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400 text-sm">
          {error || "Internship not found."}
        </p>
        <Link
          href="/admin/internships"
          className="mt-3 inline-block text-xs text-brand-400"
        >
          ← Back to internships
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 text-xs text-white/35">
        <Link href="/admin" className="hover:text-white/60 transition-colors">
          Admin
        </Link>
        <ChevronRight size={12} />
        <Link
          href="/admin/internships"
          className="hover:text-white/60 transition-colors"
        >
          Internships
        </Link>
        <ChevronRight size={12} />
        <span className="text-white/55 truncate max-w-48">
          {internship.title}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">
        {editingHeader ? (
          <form onSubmit={submitHeader} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title" required className="sm:col-span-2">
                <input
                  value={headerForm.title}
                  onChange={(e) => setHeaderForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="Company" required>
                <input
                  value={headerForm.company}
                  onChange={(e) => setHeaderForm((f) => ({ ...f, company: e.target.value }))}
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="Employment Type" required>
                <select
                  value={headerForm.employmentType}
                  onChange={(e) => setHeaderForm((f) => ({ ...f, employmentType: e.target.value as "FULL_TIME" | "PART_TIME" | "REMOTE" }))}
                  className={inputCls}
                  required
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea
                  value={headerForm.description}
                  onChange={(e) => setHeaderForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <Field label="Location">
                <input
                  value={headerForm.location}
                  onChange={(e) => setHeaderForm((f) => ({ ...f, location: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Stipend">
                <input
                  value={headerForm.stipend}
                  onChange={(e) => setHeaderForm((f) => ({ ...f, stipend: e.target.value }))}
                  placeholder="e.g. ₹10,000/month"
                  className={inputCls}
                />
              </Field>
              <Field label="Domain">
                <input
                  value={headerForm.domain}
                  onChange={(e) => setHeaderForm((f) => ({ ...f, domain: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Deadline">
                <input
                  type="date"
                  value={headerForm.deadline}
                  onChange={(e) => setHeaderForm((f) => ({ ...f, deadline: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingHeader(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/10 text-white/55 text-xs hover:text-white/80 hover:bg-white/4 transition-colors"
              >
                <X size={13} /> Cancel
              </button>
              <button
                type="submit"
                disabled={savingHeader}
                className={`${primaryBtn} disabled:opacity-50`}
              >
                {savingHeader ? <Spinner /> : <Check size={13} />}
                {savingHeader ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-white">
                  {internship.title}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${EMPLOYMENT_COLOR[internship.employmentType]}`}
                >
                  {internship.employmentType.replace(/_/g, " ")}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    internship.isPublished
                      ? "bg-brand-500/10 text-brand-400"
                      : "bg-white/6 text-white/35"
                  }`}
                >
                  {internship.isPublished ? "Live" : "Draft"}
                </span>
              </div>
              <p className="text-sm text-brand-300/70 font-medium mb-2">
                {internship.company}
              </p>
              {internship.description && (
                <p className="text-sm text-white/45 mb-3 line-clamp-2">
                  {internship.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-white/40">
                <span>{internship.category.name}</span>
                {internship.location && <span>{internship.location}</span>}
                {internship.stipend && <span>{internship.stipend}</span>}
                <span>{internship._count.applications} applications</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/admin/internships/${id}/applicants`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-white/10 text-white/55 hover:text-white/80 hover:bg-white/4 transition-colors"
              >
                <Users size={14} /> Applicants
              </Link>
              <button
                onClick={startEditHeader}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-white/10 text-white/55 hover:text-white/80 hover:bg-white/4 transition-colors"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={handlePublish}
                disabled={togglingPublish}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  internship.isPublished
                    ? "bg-white/6 text-white/60 hover:bg-white/10 border border-white/10"
                    : "bg-brand-500 text-ink-950 hover:bg-brand-400"
                }`}
              >
                {togglingPublish ? (
                  <Spinner />
                ) : internship.isPublished ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
                {internship.isPublished ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="bg-ink-800 border border-white/6 rounded-2xl p-6 space-y-8"
      >
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">
            Internship Details
          </h2>
          <p className="text-xs text-white/35">
            Add key learning outcomes, major projects, and what students will
            receive.
          </p>
        </div>

        {msg && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              msg.ok
                ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-300"
                : "border-red-500/30 bg-red-500/8 text-red-300"
            }`}
          >
            <span className="mt-0.5 text-lg leading-none">
              {msg.ok ? "✓" : "✕"}
            </span>
            <span>{msg.text}</span>
          </div>
        )}

        <Field label="Key Learning Outcomes">
          <LearnItemEditor
            items={keyLearningOutcomes}
            onChange={setKeyLearningOutcomes}
          />
        </Field>

        <Field label="Major Projects">
          <LearnItemEditor items={majorProject} onChange={setMajorProject} />
        </Field>

        <Field label="What You Will Receive">
          <LearnItemEditor
            items={whatYouReceive}
            onChange={setWhatYouReceive}
          />
        </Field>

        <div className="flex justify-end pt-2 border-t border-white/5">
          <button
            type="submit"
            disabled={saving}
            className={`${primaryBtn} disabled:opacity-50`}
          >
            {saving ? <Spinner /> : <Save size={14} />}
            {saving ? "Saving…" : "Save Details"}
          </button>
        </div>
      </form>
    </div>
  );
}

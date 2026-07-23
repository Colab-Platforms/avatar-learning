"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Check, X, ClipboardList, Users, Trash2 } from "lucide-react";
import { Field, Spinner, inputCls, primaryBtn } from "./FormField";
import { QuestionRow, OptionListEditor } from "./QuestionRow";
import {
  fetchAdminAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  toggleAssessmentPublish,
  createQuestion,
  WEEKLY_QUESTION_COUNT,
  FINAL_QUESTION_COUNT,
  type AdminAssessment,
  type AssessmentType,
  type OptionInput,
} from "@/lib/adminAssessmentApi";

const emptyOptions = (): OptionInput[] => [
  { optionText: "", isCorrect: false, optionOrder: 1 },
  { optionText: "", isCorrect: false, optionOrder: 2 },
];

interface LessonRef {
  id: string;
  title: string;
  weekNumber: number;
}

function AssessmentPanel({
  assessment,
  expectedCount,
  onChanged,
}: {
  assessment: AdminAssessment;
  expectedCount: number;
  onChanged: () => void;
}) {
  const [error, setError] = useState("");
  const [editingMeta, setEditingMeta] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [deletingAssessment, setDeletingAssessment] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [metaForm, setMetaForm] = useState({
    title: "",
    description: "",
    timeLimitMinutes: 30,
    passingScorePercent: "" as string | number,
    maxTabSwitchWarnings: 3,
    maxAttempts: 3,
  });
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    points: 1,
    questionOrder: 1,
    options: emptyOptions(),
  });

  const startEditMeta = () => {
    setMetaForm({
      title: assessment.title,
      description: assessment.description ?? "",
      timeLimitMinutes: assessment.timeLimitMinutes,
      passingScorePercent: assessment.passingScorePercent ?? "",
      maxTabSwitchWarnings: assessment.maxTabSwitchWarnings,
      maxAttempts: assessment.maxAttempts ?? 3,
    });
    setEditingMeta(true);
  };

  const submitMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMeta(true);
    setError("");
    try {
      await updateAssessment(assessment.id, {
        title: metaForm.title,
        description: metaForm.description || undefined,
        timeLimitMinutes: metaForm.timeLimitMinutes,
        passingScorePercent:
          metaForm.passingScorePercent === "" ? null : Number(metaForm.passingScorePercent),
        maxTabSwitchWarnings: metaForm.maxTabSwitchWarnings,
        ...(assessment.type === "FINAL" ? { maxAttempts: metaForm.maxAttempts } : {}),
      });
      setEditingMeta(false);
      onChanged();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to update assessment.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleTogglePublish = async () => {
    setTogglingPublish(true);
    setError("");
    try {
      await toggleAssessmentPublish(assessment.id);
      onChanged();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to toggle publish state.");
    } finally {
      setTogglingPublish(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!confirm("Delete this assessment and all its questions? This cannot be undone.")) return;
    setDeletingAssessment(true);
    try {
      await deleteAssessment(assessment.id);
      onChanged();
    } catch {
      setError("Failed to delete assessment.");
    } finally {
      setDeletingAssessment(false);
    }
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuestion(true);
    setError("");
    try {
      await createQuestion(assessment.id, questionForm);
      setQuestionForm({
        questionText: "",
        points: 1,
        questionOrder: assessment.questions.length + 2,
        options: emptyOptions(),
      });
      setShowAddQuestion(false);
      onChanged();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to add question.");
    } finally {
      setSavingQuestion(false);
    }
  };

  const canAddMore = assessment.questions.length < expectedCount;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-ink-900/40 border border-white/6 rounded-xl p-5">
        {editingMeta ? (
          <form onSubmit={submitMeta} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title" required className="sm:col-span-2">
              <input
                value={metaForm.title}
                onChange={(e) => setMetaForm((f) => ({ ...f, title: e.target.value }))}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                value={metaForm.description}
                onChange={(e) => setMetaForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <Field label="Time Limit (minutes)" required>
              <input
                type="number"
                min={1}
                value={metaForm.timeLimitMinutes}
                onChange={(e) => setMetaForm((f) => ({ ...f, timeLimitMinutes: Number(e.target.value) }))}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Passing Score (%)">
              <input
                type="number"
                min={0}
                max={100}
                value={metaForm.passingScorePercent}
                onChange={(e) => setMetaForm((f) => ({ ...f, passingScorePercent: e.target.value }))}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Max Tab-Switch Warnings" required className="sm:col-span-2">
              <input
                type="number"
                min={1}
                value={metaForm.maxTabSwitchWarnings}
                onChange={(e) =>
                  setMetaForm((f) => ({ ...f, maxTabSwitchWarnings: Number(e.target.value) }))
                }
                className={inputCls}
                required
              />
            </Field>
            {assessment.type === "FINAL" && (
              <Field label="Max Attempts" required className="sm:col-span-2">
                <input
                  type="number"
                  min={1}
                  value={metaForm.maxAttempts}
                  onChange={(e) => setMetaForm((f) => ({ ...f, maxAttempts: Number(e.target.value) }))}
                  className={inputCls}
                  required
                />
              </Field>
            )}
            <div className="sm:col-span-2 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingMeta(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/10 text-white/55 text-xs hover:text-white/80 hover:bg-white/4 transition-colors"
              >
                <X size={13} /> Cancel
              </button>
              <button type="submit" disabled={savingMeta} className={`${primaryBtn} disabled:opacity-50`}>
                {savingMeta ? <Spinner /> : <Check size={13} />}
                {savingMeta ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="text-base font-bold text-white">{assessment.title}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    assessment.isPublished ? "bg-brand-500/10 text-brand-400" : "bg-white/6 text-white/35"
                  }`}
                >
                  {assessment.isPublished ? "Published" : "Draft"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/6 text-white/40">
                  {assessment.questions.length}/{expectedCount} questions
                </span>
              </div>
              {assessment.description && (
                <p className="text-sm text-white/45 mb-3">{assessment.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-white/40">
                <span>{assessment.timeLimitMinutes} min limit</span>
                {assessment.passingScorePercent != null && (
                  <span>{assessment.passingScorePercent}% to pass</span>
                )}
                <span>{assessment.maxTabSwitchWarnings} tab-switch warnings</span>
                <span className="flex items-center gap-1.5">
                  <Users size={12} /> {assessment._count.attempts} attempt
                  {assessment._count.attempts !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={startEditMeta}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-white/10 text-white/55 hover:text-white/80 hover:bg-white/4 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleTogglePublish}
                disabled={togglingPublish}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  assessment.isPublished
                    ? "bg-white/6 text-white/60 hover:bg-white/10 border border-white/10"
                    : "bg-brand-500 text-ink-950 hover:bg-brand-400"
                }`}
              >
                {togglingPublish ? <Spinner /> : assessment.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                {assessment.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={handleDeleteAssessment}
                disabled={deletingAssessment}
                className="p-2.5 rounded-xl text-white/25 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
              >
                {deletingAssessment ? <Spinner small /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-ink-900/40 border border-white/6 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <h4 className="text-sm font-semibold text-white">
            Questions{" "}
            <span className="text-white/30 font-normal">
              ({assessment.questions.length}/{expectedCount})
            </span>
          </h4>
          {canAddMore && (
            <button
              onClick={() => {
                setQuestionForm((f) => ({ ...f, questionOrder: assessment.questions.length + 1 }));
                setShowAddQuestion((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/10 text-white/55 text-xs hover:text-white/80 hover:bg-white/4 transition-colors"
            >
              <Plus size={13} />
              {showAddQuestion ? "Cancel" : "Add Question"}
            </button>
          )}
        </div>

        {showAddQuestion && canAddMore && (
          <div className="px-5 py-4 border-b border-white/5 bg-ink-950/40">
            <form onSubmit={submitQuestion} className="space-y-3">
              <textarea
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm((f) => ({ ...f, questionText: e.target.value }))}
                rows={2}
                placeholder="Question text"
                className={`${inputCls} w-full resize-none`}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Order" required>
                  <input
                    type="number"
                    min={1}
                    value={questionForm.questionOrder}
                    onChange={(e) =>
                      setQuestionForm((f) => ({ ...f, questionOrder: Number(e.target.value) }))
                    }
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="Points" required>
                  <input
                    type="number"
                    min={1}
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, points: Number(e.target.value) }))}
                    className={inputCls}
                    required
                  />
                </Field>
              </div>
              <Field label="Options (select the correct answer)">
                <OptionListEditor
                  options={questionForm.options}
                  onChange={(options) => setQuestionForm((f) => ({ ...f, options }))}
                />
              </Field>
              <div className="flex justify-end">
                <button type="submit" disabled={savingQuestion} className={`${primaryBtn} disabled:opacity-50`}>
                  {savingQuestion && <Spinner />}
                  {savingQuestion ? "Saving…" : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        )}

        {assessment.questions.length === 0 ? (
          <div className="py-10 text-center">
            <ClipboardList size={24} className="mx-auto text-white/15 mb-2" />
            <p className="text-sm text-white/35">
              No questions yet. Add exactly {expectedCount} questions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {[...assessment.questions]
              .sort((a, b) => a.questionOrder - b.questionOrder)
              .map((q) => (
                <QuestionRow key={q.id} question={q} onChanged={onChanged} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateAssessmentForm({
  type,
  lessonId,
  defaultTitle,
  expectedCount,
  courseId,
  onCreated,
}: {
  type: AssessmentType;
  lessonId?: string;
  defaultTitle: string;
  expectedCount: number;
  courseId: string;
  onCreated: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: defaultTitle,
    description: "",
    timeLimitMinutes: type === "FINAL" ? 60 : 20,
    passingScorePercent: "" as string | number,
    maxTabSwitchWarnings: 3,
    maxAttempts: 3,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createAssessment(courseId, {
        title: form.title,
        description: form.description || undefined,
        type,
        lessonId: type === "WEEKLY" ? lessonId : null,
        timeLimitMinutes: form.timeLimitMinutes,
        passingScorePercent:
          form.passingScorePercent === "" ? undefined : Number(form.passingScorePercent),
        maxTabSwitchWarnings: form.maxTabSwitchWarnings,
        maxAttempts: type === "FINAL" ? form.maxAttempts : null,
      });
      onCreated();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to create assessment.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {error && <p className="sm:col-span-2 text-red-400 text-xs">{error}</p>}
      <Field label="Title" required className="sm:col-span-2">
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className={inputCls}
          required
        />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </Field>
      <Field label="Time Limit (minutes)" required>
        <input
          type="number"
          min={1}
          value={form.timeLimitMinutes}
          onChange={(e) => setForm((f) => ({ ...f, timeLimitMinutes: Number(e.target.value) }))}
          className={inputCls}
          required
        />
      </Field>
      <Field label="Passing Score (%)">
        <input
          type="number"
          min={0}
          max={100}
          value={form.passingScorePercent}
          onChange={(e) => setForm((f) => ({ ...f, passingScorePercent: e.target.value }))}
          placeholder="Optional"
          className={inputCls}
        />
      </Field>
      {type === "FINAL" && (
        <Field label="Max Attempts" required className="sm:col-span-2">
          <input
            type="number"
            min={1}
            value={form.maxAttempts}
            onChange={(e) => setForm((f) => ({ ...f, maxAttempts: Number(e.target.value) }))}
            className={inputCls}
            required
          />
        </Field>
      )}
      <p className="sm:col-span-2 text-xs text-white/35">
        This assessment requires exactly {expectedCount} questions before it can be published.
        {type === "WEEKLY" ? " Students can retake weekly assessments unlimited times." : ""}
      </p>
      <div className="sm:col-span-2 flex justify-end">
        <button type="submit" disabled={creating} className={`${primaryBtn} disabled:opacity-50`}>
          {creating && <Spinner />}
          {creating ? "Creating…" : "Create Assessment"}
        </button>
      </div>
    </form>
  );
}

export function AssessmentEditor({
  courseId,
  lessons,
}: {
  courseId: string;
  lessons: LessonRef[];
}) {
  const [assessments, setAssessments] = useState<AdminAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminAssessments(courseId);
      setAssessments(data);
      setError("");
    } catch {
      setError("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedLessons = [...lessons].sort((a, b) => a.weekNumber - b.weekNumber);
  const weeklyByLessonId = new Map(
    assessments.filter((a) => a.type === "WEEKLY" && a.lessonId).map((a) => [a.lessonId!, a]),
  );
  const finalAssessment = assessments.find((a) => a.type === "FINAL") ?? null;

  if (loading) {
    return (
      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-ink-900/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={16} className="text-brand-400" />
          <h2 className="text-sm font-semibold text-white">Weekly Assessments</h2>
        </div>
        <p className="text-xs text-white/40 mb-5">
          One assessment per week ({WEEKLY_QUESTION_COUNT} questions each). Unlocks after all topics in
          that week are completed.
        </p>

        {sortedLessons.length === 0 ? (
          <p className="text-sm text-white/35">Add weeks first, then create weekly assessments.</p>
        ) : (
          <div className="space-y-5">
            {sortedLessons.map((lesson) => {
              const existing = weeklyByLessonId.get(lesson.id);
              return (
                <div key={lesson.id} className="rounded-xl border border-white/6 overflow-hidden">
                  <div className="px-5 py-3 bg-ink-900/50 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-white">
                      Week {lesson.weekNumber}
                      <span className="text-white/40 font-normal"> · {lesson.title}</span>
                    </h3>
                  </div>
                  <div className="p-5">
                    {existing ? (
                      <AssessmentPanel
                        assessment={existing}
                        expectedCount={WEEKLY_QUESTION_COUNT}
                        onChanged={load}
                      />
                    ) : (
                      <CreateAssessmentForm
                        courseId={courseId}
                        type="WEEKLY"
                        lessonId={lesson.id}
                        defaultTitle={`Week ${lesson.weekNumber} Assessment`}
                        expectedCount={WEEKLY_QUESTION_COUNT}
                        onCreated={load}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={16} className="text-brand-400" />
          <h2 className="text-sm font-semibold text-white">Final Assessment</h2>
        </div>
        <p className="text-xs text-white/40 mb-5">
          One final assessment for the course ({FINAL_QUESTION_COUNT} questions). Unlocks after all
          weekly assessments are completed.
        </p>
        {finalAssessment ? (
          <AssessmentPanel
            assessment={finalAssessment}
            expectedCount={FINAL_QUESTION_COUNT}
            onChanged={load}
          />
        ) : (
          <CreateAssessmentForm
            courseId={courseId}
            type="FINAL"
            defaultTitle="Final Course Assessment"
            expectedCount={FINAL_QUESTION_COUNT}
            onCreated={load}
          />
        )}
      </div>
    </div>
  );
}

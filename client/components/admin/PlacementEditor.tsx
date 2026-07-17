"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Check, X, ClipboardList, Users, Trash2 } from "lucide-react";
import { Field, Spinner, inputCls, primaryBtn } from "./FormField";
import { PlacementQuestionRow, PlacementOptionListEditor } from "./PlacementQuestionRow";
import {
  fetchAdminPlacementAssessment,
  createPlacementAssessment,
  updatePlacementAssessment,
  deletePlacementAssessment,
  togglePlacementAssessmentPublish,
  createPlacementQuestion,
  type AdminPlacementAssessment,
  type PlacementOptionInput,
} from "@/lib/adminPlacementApi";

const emptyOptions = (): PlacementOptionInput[] => [
  { optionText: "", isCorrect: false, optionOrder: 1 },
  { optionText: "", isCorrect: false, optionOrder: 2 },
];

export function PlacementEditor({ courseId }: { courseId: string }) {
  const [assessment, setAssessment] = useState<AdminPlacementAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [deletingAssessment, setDeletingAssessment] = useState(false);

  const [editingMeta, setEditingMeta] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({
    title: "",
    description: "",
    timeLimitMinutes: 30,
    passingScorePercent: 60,
    questionsPerAttempt: 20,
    maxTabSwitchWarnings: 3,
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    points: 1,
    questionOrder: 1,
    options: emptyOptions(),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await fetchAdminPlacementAssessment(courseId);
      setAssessment(data);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 404) {
        setNotFound(true);
        setAssessment(null);
      } else {
        setError("Failed to load placement assessment.");
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    timeLimitMinutes: 30,
    passingScorePercent: 60,
    questionsPerAttempt: 20,
    maxTabSwitchWarnings: 3,
  });
  const [creating, setCreating] = useState(false);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createPlacementAssessment(courseId, {
        title: createForm.title,
        description: createForm.description || undefined,
        timeLimitMinutes: createForm.timeLimitMinutes,
        passingScorePercent: createForm.passingScorePercent,
        questionsPerAttempt: createForm.questionsPerAttempt,
        maxTabSwitchWarnings: createForm.maxTabSwitchWarnings,
      });
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to create placement assessment.");
    } finally {
      setCreating(false);
    }
  };

  const startEditMeta = () => {
    if (!assessment) return;
    setMetaForm({
      title: assessment.title,
      description: assessment.description ?? "",
      timeLimitMinutes: assessment.timeLimitMinutes,
      passingScorePercent: assessment.passingScorePercent,
      questionsPerAttempt: assessment.questionsPerAttempt,
      maxTabSwitchWarnings: assessment.maxTabSwitchWarnings,
    });
    setEditingMeta(true);
  };

  const submitMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment) return;
    setSavingMeta(true);
    setError("");
    try {
      await updatePlacementAssessment(assessment.id, {
        title: metaForm.title,
        description: metaForm.description || undefined,
        timeLimitMinutes: metaForm.timeLimitMinutes,
        passingScorePercent: metaForm.passingScorePercent,
        questionsPerAttempt: metaForm.questionsPerAttempt,
        maxTabSwitchWarnings: metaForm.maxTabSwitchWarnings,
      });
      setEditingMeta(false);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to update placement assessment.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!assessment) return;
    setTogglingPublish(true);
    try {
      await togglePlacementAssessmentPublish(assessment.id);
      await load();
    } catch {
      setError("Failed to toggle publish state.");
    } finally {
      setTogglingPublish(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!assessment) return;
    if (!confirm("Delete this placement assessment and all its questions? This cannot be undone.")) return;
    setDeletingAssessment(true);
    try {
      await deletePlacementAssessment(assessment.id);
      await load();
    } catch {
      setError("Failed to delete placement assessment.");
    } finally {
      setDeletingAssessment(false);
    }
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment) return;
    setSavingQuestion(true);
    setError("");
    try {
      await createPlacementQuestion(assessment.id, questionForm);
      setQuestionForm({
        questionText: "",
        points: 1,
        questionOrder: assessment.questions.length + 2,
        options: emptyOptions(),
      });
      setShowAddQuestion(false);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to add question.");
    } finally {
      setSavingQuestion(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-ink-900/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={16} className="text-brand-400" />
          <h2 className="text-sm font-semibold text-white">Create Placement Assessment</h2>
        </div>
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <form onSubmit={submitCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title" required className="sm:col-span-2">
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Pre-Placement Assessment"
              className={inputCls}
              required
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Time Limit (minutes)" required>
            <input
              type="number"
              min={1}
              value={createForm.timeLimitMinutes}
              onChange={(e) => setCreateForm((f) => ({ ...f, timeLimitMinutes: Number(e.target.value) }))}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Passing Score (%)" required>
            <input
              type="number"
              min={0}
              max={100}
              value={createForm.passingScorePercent}
              onChange={(e) => setCreateForm((f) => ({ ...f, passingScorePercent: Number(e.target.value) }))}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Questions Per Attempt" required>
            <input
              type="number"
              min={1}
              value={createForm.questionsPerAttempt}
              onChange={(e) => setCreateForm((f) => ({ ...f, questionsPerAttempt: Number(e.target.value) }))}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Max Tab-Switch Warnings" required>
            <input
              type="number"
              min={1}
              value={createForm.maxTabSwitchWarnings}
              onChange={(e) => setCreateForm((f) => ({ ...f, maxTabSwitchWarnings: Number(e.target.value) }))}
              className={inputCls}
              required
            />
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={creating} className={`${primaryBtn} disabled:opacity-50`}>
              {creating && <Spinner />}
              {creating ? "Creating…" : "Create Placement Assessment"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Meta card */}
      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">
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
            <Field label="Passing Score (%)" required>
              <input
                type="number"
                min={0}
                max={100}
                value={metaForm.passingScorePercent}
                onChange={(e) => setMetaForm((f) => ({ ...f, passingScorePercent: Number(e.target.value) }))}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Questions Per Attempt" required>
              <input
                type="number"
                min={1}
                value={metaForm.questionsPerAttempt}
                onChange={(e) => setMetaForm((f) => ({ ...f, questionsPerAttempt: Number(e.target.value) }))}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Max Tab-Switch Warnings" required>
              <input
                type="number"
                min={1}
                value={metaForm.maxTabSwitchWarnings}
                onChange={(e) => setMetaForm((f) => ({ ...f, maxTabSwitchWarnings: Number(e.target.value) }))}
                className={inputCls}
                required
              />
            </Field>
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
                <h2 className="text-lg font-bold text-white">{assessment.title}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    assessment.isPublished ? "bg-brand-500/10 text-brand-400" : "bg-white/6 text-white/35"
                  }`}
                >
                  {assessment.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              {assessment.description && <p className="text-sm text-white/45 mb-3">{assessment.description}</p>}
              <div className="flex flex-wrap gap-4 text-xs text-white/40">
                <span>{assessment.timeLimitMinutes} min limit</span>
                <span>
                  {assessment.questions.length} question{assessment.questions.length !== 1 ? "s" : ""} in bank
                </span>
                <span>{assessment.questionsPerAttempt} per attempt</span>
                <span>{assessment.passingScorePercent}% to pass</span>
                <span>{assessment.maxTabSwitchWarnings} tab-switch warnings allowed</span>
                <span className="flex items-center gap-1.5">
                  <Users size={12} /> {assessment._count.attempts} attempt{assessment._count.attempts !== 1 ? "s" : ""}
                </span>
              </div>
              {assessment.questions.length < assessment.questionsPerAttempt && (
                <p className="mt-3 text-xs text-amber-400">
                  Add at least {assessment.questionsPerAttempt} questions before publishing — students need a full
                  random pool to start an attempt.
                </p>
              )}
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

      {/* Questions */}
      <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">
            Questions <span className="text-white/30 font-normal">({assessment.questions.length})</span>
          </h2>
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
        </div>

        {showAddQuestion && (
          <div className="px-6 py-5 border-b border-white/5 bg-ink-900/50">
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
                    onChange={(e) => setQuestionForm((f) => ({ ...f, questionOrder: Number(e.target.value) }))}
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
                <PlacementOptionListEditor
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
          <div className="py-14 text-center">
            <ClipboardList size={28} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/35">No questions yet. Add the first one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {[...assessment.questions]
              .sort((a, b) => a.questionOrder - b.questionOrder)
              .map((q) => (
                <PlacementQuestionRow key={q.id} question={q} onChanged={load} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

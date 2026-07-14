"use client";

import { useState } from "react";
import { Trash2, Pencil, X, Check, Plus } from "lucide-react";
import { Spinner, inputCls } from "./FormField";
import { updateQuestion, deleteQuestion, type AdminAssessmentQuestion, type OptionInput } from "@/lib/adminAssessmentApi";

export function OptionListEditor({ options, onChange }: { options: OptionInput[]; onChange: (o: OptionInput[]) => void }) {
  const update = (i: number, patch: Partial<OptionInput>) =>
    onChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const add = () =>
    onChange([...options, { optionText: "", isCorrect: false, optionOrder: options.length + 1 }]);

  const remove = (i: number) =>
    onChange(
      options
        .filter((_, idx) => idx !== i)
        .map((o, idx) => ({ ...o, optionOrder: idx + 1 })),
    );

  const setCorrect = (i: number) =>
    onChange(options.map((o, idx) => ({ ...o, isCorrect: idx === i })));

  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="radio"
            name="correct-option"
            checked={opt.isCorrect}
            onChange={() => setCorrect(i)}
            className="accent-brand-500 shrink-0"
            title="Mark as correct answer"
          />
          <input
            value={opt.optionText}
            onChange={(e) => update(i, { optionText: e.target.value })}
            placeholder={`Option ${i + 1}`}
            className={`${inputCls} text-xs py-2 flex-1`}
          />
          {options.length > 2 && (
            <button type="button" onClick={() => remove(i)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
              <X size={13} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-brand-400 transition-colors"
      >
        <Plus size={11} /> Add option
      </button>
    </div>
  );
}

export function QuestionRow({ question, onChanged }: { question: AdminAssessmentQuestion; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    questionText: question.questionText,
    points: question.points,
    questionOrder: question.questionOrder,
    options: question.options.map((o) => ({
      optionText: o.optionText,
      isCorrect: o.isCorrect,
      optionOrder: o.optionOrder,
    })) as OptionInput[],
  });

  const cancelEdit = () => {
    setForm({
      questionText: question.questionText,
      points: question.points,
      questionOrder: question.questionOrder,
      options: question.options.map((o) => ({
        optionText: o.optionText,
        isCorrect: o.isCorrect,
        optionOrder: o.optionOrder,
      })),
    });
    setError("");
    setEditing(false);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateQuestion(question.id, form);
      setEditing(false);
      onChanged();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this question?")) return;
    setDeleting(true);
    try {
      await deleteQuestion(question.id);
      onChanged();
    } finally {
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-ink-900/20 border-b border-white/4 last:border-0 px-5 py-4">
        <form onSubmit={submitEdit} className="space-y-3">
          <textarea
            value={form.questionText}
            onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
            rows={2}
            className={`${inputCls} w-full resize-none`}
            placeholder="Question text"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-white/30">Order</label>
              <input
                type="number"
                min={1}
                value={form.questionOrder}
                onChange={(e) => setForm((f) => ({ ...f, questionOrder: Number(e.target.value) }))}
                className={`${inputCls} w-full`}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-white/30">Points</label>
              <input
                type="number"
                min={1}
                value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                className={`${inputCls} w-full`}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-white/30">Options (select correct answer)</label>
            <OptionListEditor
              options={form.options}
              onChange={(options) => setForm((f) => ({ ...f, options }))}
            />
          </div>
          {error && <p className="text-red-400 text-[11px]">{error}</p>}
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
      </div>
    );
  }

  return (
    <div className="bg-ink-900/20 border-b border-white/4 last:border-0 px-5 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-brand-500/10 border border-brand-500/15 flex items-center justify-center shrink-0 text-[10px] font-bold text-brand-400">
              {question.questionOrder}
            </span>
            <p className="text-sm font-semibold text-white/85">{question.questionText}</p>
            <span className="text-[10px] text-white/25 shrink-0">{question.points} pt{question.points !== 1 ? "s" : ""}</span>
          </div>
          <div className="mt-2 ml-8.5 space-y-1">
            {question.options.map((o) => (
              <p key={o.id} className={`text-xs ${o.isCorrect ? "text-emerald-400 font-medium" : "text-white/40"}`}>
                {o.isCorrect ? "✓ " : "· "}
                {o.optionText}
              </p>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-white/25 hover:text-brand-400 hover:bg-brand-500/8 transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
          >
            {deleting ? <Spinner small /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

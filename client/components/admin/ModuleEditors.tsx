import { useState } from "react";
import { Plus, X, Save, GripVertical } from "lucide-react";
import { updateLesson } from "@/lib/adminApi";
import { inputCls, Spinner } from "./FormField";

// Inline editor (for editing existing lesson modules)
export function InlineModuleEditor({ lessonId, modules: initial, onSaved }: {
    lessonId: string; modules: string[]; onSaved: () => void;
}) {
    const [modules, setModules] = useState<string[]>(initial.length > 0 ? [...initial] : [""]);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const add = () => setModules((m) => [...m, ""]);
    const remove = (i: number) => setModules((m) => m.filter((_, idx) => idx !== i));
    const update = (i: number, val: string) => setModules((m) => m.map((v, idx) => idx === i ? val : v));

    const save = async () => {
        setSaving(true);
        setErr("");
        const cleaned = modules.map((m) => m.trim()).filter(Boolean);
        try {
            await updateLesson(lessonId, { modules: cleaned });
            onSaved();
        } catch {
            setErr("Failed to save modules.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-2">
            {modules.map((mod, i) => (
                <div key={i} className="flex items-center gap-2">
                    <GripVertical size={13} className="text-white/15 shrink-0" />
                    <input
                        value={mod}
                        onChange={(e) => update(i, e.target.value)}
                        placeholder={`Topic ${i + 1}`}
                        className="flex-1 bg-ink-800 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-500/40 transition"
                    />
                    <button onClick={() => remove(i)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                        <X size={13} />
                    </button>
                </div>
            ))}
            {err && <p className="text-red-400 text-[11px]">{err}</p>}
            <div className="flex items-center gap-3 pt-1">
                <button onClick={add}
                    className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-brand-400 transition-colors">
                    <Plus size={11} /> Add topic
                </button>
                <button onClick={save} disabled={saving}
                    className="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50 font-semibold">
                    {saving ? <Spinner small /> : <Save size={11} />}
                    {saving ? "Saving…" : "Save"}
                </button>
            </div>
        </div>
    );
}

// Module list editor (for add lesson form)
export function ModuleListEditor({ modules, onChange }: { modules: string[]; onChange: (m: string[]) => void }) {
    const list = modules.length === 0 ? [""] : modules;

    const update = (i: number, val: string) => {
        const next = [...list]; next[i] = val; onChange(next.filter((_, idx) => idx !== list.length - 1 || val).map(v => v));
    };
    const add = () => onChange([...list, ""]);
    const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-2">
            {list.map((mod, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        value={mod}
                        onChange={(e) => update(i, e.target.value)}
                        placeholder={`Topic ${i + 1}`}
                        className={`${inputCls} text-xs py-2`}
                    />
                    {list.length > 1 && (
                        <button type="button" onClick={() => remove(i)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                            <X size={13} />
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={add}
                className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-brand-400 transition-colors">
                <Plus size={11} /> Add topic
            </button>
        </div>
    );
}

import { Plus, X } from "lucide-react";
import { inputCls } from "./FormField";

export interface CourseLearnItem { title: string; body: string; }

export function LearnItemEditor({
    label, items, onChange,
}: {
    label: string;
    items: CourseLearnItem[];
    onChange: (items: CourseLearnItem[]) => void;
}) {
    const empty = (): CourseLearnItem => ({ title: "", body: "" });

    const update = (i: number, field: keyof CourseLearnItem, val: string) => {
        const next = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item);
        onChange(next);
    };

    const add = () => onChange([...items, empty()]);
    const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</p>
                <button type="button" onClick={add}
                    className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-brand-400 transition-colors">
                    <Plus size={11} /> Add item
                </button>
            </div>
            {items.length === 0 && (
                <p className="text-xs text-white/25 py-1">No items yet. Click "Add item" to get started.</p>
            )}
            {items.map((item, i) => (
                <div key={i} className="border border-white/8 rounded-xl p-4 space-y-3 bg-ink-900/40">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/30 font-semibold">Item {i + 1}</span>
                        <button type="button" onClick={() => remove(i)}
                            className="text-white/20 hover:text-red-400 transition-colors">
                            <X size={13} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-white/30 uppercase tracking-wider">Title</label>
                            <input
                                value={item.title}
                                onChange={(e) => update(i, "title", e.target.value)}
                                placeholder="e.g. Build AI Workflows"
                                className={inputCls}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-white/30 uppercase tracking-wider">Description</label>
                            <textarea
                                value={item.body}
                                onChange={(e) => update(i, "body", e.target.value)}
                                placeholder="Short description shown on the course page"
                                rows={2}
                                className={`${inputCls} resize-none`}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

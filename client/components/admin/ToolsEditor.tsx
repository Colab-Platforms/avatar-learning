import { useState } from "react";
import { X } from "lucide-react";

export function ToolsEditor({ tools, onChange }: { tools: string[]; onChange: (t: string[]) => void }) {
    const [input, setInput] = useState("");

    const commit = (val: string) => {
        const trimmed = val.trim();
        if (trimmed && !tools.includes(trimmed)) onChange([...tools, trimmed]);
        setInput("");
    };

    const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(input); }
        if (e.key === "Backspace" && !input && tools.length > 0)
            onChange(tools.slice(0, -1));
    };

    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (e.target.value.trim()) commit(e.target.value);
    };

    return (
        <div className="flex flex-wrap gap-2 min-h-[44px] w-full bg-ink-900 border border-white/8 rounded-xl px-3 py-2
                        focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/20 transition">
            {tools.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 bg-brand-500/12 border border-brand-500/25
                                         text-brand-300 text-xs font-medium px-2.5 py-1 rounded-lg">
                    {t}
                    <button type="button" onClick={() => onChange(tools.filter((x) => x !== t))}
                        className="text-brand-400/60 hover:text-red-400 transition-colors leading-none">
                        <X size={11} />
                    </button>
                </span>
            ))}
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                onBlur={onBlur}
                placeholder={tools.length === 0 ? "Type a tool and press Enter…" : "Add more…"}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-white/20
                           focus:outline-none py-0.5"
            />
        </div>
    );
}

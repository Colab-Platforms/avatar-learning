export function Field({ label, required, className, children }: {
    label: string; required?: boolean; className?: string; children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                {label}{required && <span className="text-brand-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

export function Spinner({ small }: { small?: boolean }) {
    const s = small ? "w-3 h-3 border" : "w-3.5 h-3.5 border-2";
    return <span className={`${s} border-current border-t-transparent rounded-full animate-spin inline-block`} />;
}

export const inputCls = "w-full bg-ink-900 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition";
export const primaryBtn = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors";

import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { uploadVideo } from "@/lib/adminApi";
import { Field, Spinner, inputCls, primaryBtn } from "./FormField";

export function VideoUploadForm({ topicId, onDone, onCancel }: {
    topicId: string; onDone: () => void; onCancel: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const ref = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        if (f && !title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        setError("");
        try {
            await uploadVideo(topicId, file, title || file.name, setProgress);
            onDone();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e?.response?.data?.message ?? e?.message ?? "Upload failed");
            setUploading(false);
        }
    };

    return (
        <form onSubmit={submit} className="bg-ink-900/60 border border-brand-500/15 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                    <Upload size={12} className="text-brand-400" /> Upload Video to Bunny.net
                </p>
                <button type="button" onClick={onCancel} className="text-[10px] text-white/25 hover:text-white/50 transition-colors">Cancel</button>
            </div>
            <div onClick={() => ref.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-brand-500/30 transition-colors">
                <input ref={ref} type="file" accept="video/*" onChange={handleFile} className="hidden" />
                {file ? (
                    <p className="text-xs text-brand-300">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
                ) : (
                    <p className="text-xs text-white/30">Click to select a video file (mp4, mov, etc.)</p>
                )}
            </div>
            {file && (
                <Field label="Video Title" required>
                    <input value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter video title" className={inputCls} required />
                </Field>
            )}
            {uploading && (
                <div>
                    <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                        <span>Uploading directly to Bunny.net…</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}
            {error && <p className="text-red-400 text-xs">{error}</p>}
            {file && (
                <button type="submit" disabled={uploading} className={`${primaryBtn} disabled:opacity-50 w-full justify-center`}>
                    {uploading ? <><Spinner />Uploading {progress}%…</> : <><Upload size={13} />Upload Video</>}
                </button>
            )}
        </form>
    );
}

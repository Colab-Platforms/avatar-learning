import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadCourseImage } from "@/lib/adminApi";

interface ImageUploadFieldProps {
    label: string;
    value: string;
    onChange: (url: string) => void;
}

export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Only image files are allowed.");
            return;
        }
        setError("");
        setUploading(true);
        try {
            const url = await uploadCourseImage(file);
            onChange(url);
        } catch {
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</label>

            {value ? (
                <div className="relative group rounded-xl overflow-hidden border border-white/8 bg-ink-900">
                    <img src={value} alt={label} className="w-full h-52 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                        >
                            <Upload size={12} />
                            {uploading ? "Uploading…" : "Replace"}
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
                        >
                            <X size={12} />
                            Remove
                        </button>
                    </div>
                    {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !uploading && inputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 h-52 rounded-xl border border-dashed border-white/15 bg-ink-900 cursor-pointer hover:border-brand-500/40 hover:bg-brand-500/4 transition-colors"
                >
                    {uploading ? (
                        <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <ImageIcon size={24} className="text-white/20" />
                            <p className="text-xs text-white/35">Drop image or <span className="text-brand-400">click to upload</span></p>
                        </>
                    )}
                </div>
            )}

            {error && <p className="text-[11px] text-red-400">{error}</p>}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                }}
            />
        </div>
    );
}

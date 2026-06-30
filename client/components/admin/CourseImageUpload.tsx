"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { uploadCourseImage, type CourseImageField } from "@/lib/adminApi";
import { Spinner } from "./FormField";

interface Props {
    courseId: string;
    field: CourseImageField;
    label: string;
    currentUrl?: string;
    /** Called with the new Cloudinary URL after a successful upload */
    onUploaded: (url: string) => void;
}

type UploadState =
    | { status: "idle" }
    | { status: "uploading"; progress: number }
    | { status: "done"; url: string }
    | { status: "error"; message: string };

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";
const MAX_MB = 5;

export function CourseImageUpload({ courseId, field, label, currentUrl, onUploaded }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const activeUrl = uploadState.status === "done" ? uploadState.url : currentUrl;

    const processFile = useCallback(
        async (file: File) => {
            if (!file.type.startsWith("image/")) {
                setUploadState({ status: "error", message: "Only image files are allowed." });
                return;
            }
            if (file.size > MAX_MB * 1024 * 1024) {
                setUploadState({ status: "error", message: `File must be under ${MAX_MB} MB.` });
                return;
            }

            // Local preview immediately
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            setUploadState({ status: "uploading", progress: 0 });

            try {
                const result = await uploadCourseImage(courseId, field, file, (pct) =>
                    setUploadState({ status: "uploading", progress: pct }),
                );
                setUploadState({ status: "done", url: result.url });
                onUploaded(result.url);
            } catch (err: any) {
                const msg = err?.response?.data?.message ?? err?.message ?? "Upload failed.";
                setUploadState({ status: "error", message: msg });
                setPreview(null);
            }
        },
        [courseId, field, onUploaded],
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // reset so same file can be re-selected after an error
        e.target.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
    const handleDragLeave = () => setDragging(false);

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        setUploadState({ status: "idle" });
        onUploaded("");
    };

    const displayUrl = preview ?? activeUrl ?? null;
    const isUploading = uploadState.status === "uploading";

    return (
        <div className="flex flex-col gap-2">
            {/* Label row */}
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                    {label}
                </span>
                {uploadState.status === "done" && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                    </span>
                )}
            </div>

            {/* Drop zone */}
            <div
                onClick={() => !isUploading && inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative group rounded-xl border-2 border-dashed overflow-hidden transition-all duration-200
                    ${isUploading ? "cursor-wait" : "cursor-pointer"}
                    ${dragging
                        ? "border-brand-500/70 bg-brand-500/8"
                        : displayUrl
                            ? "border-white/10 hover:border-brand-500/40"
                            : "border-white/10 hover:border-brand-500/40 hover:bg-brand-500/4"
                    }`}
                style={{ minHeight: "140px" }}
            >
                {/* Image preview */}
                {displayUrl ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={displayUrl}
                            alt={label}
                            className="w-full h-full object-cover"
                            style={{ maxHeight: "200px" }}
                        />
                        {/* Overlay on hover */}
                        {!isUploading && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
                                    <Upload className="h-3.5 w-3.5" /> Replace
                                </span>
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-300 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-1.5 hover:bg-red-500/25 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" /> Remove
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/8 text-white/30 group-hover:border-brand-500/30 group-hover:text-brand-400 transition-all duration-200">
                            <ImageIcon className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-sm font-medium text-white/50 group-hover:text-white/70 transition-colors">
                                {dragging ? "Drop to upload" : "Click or drag & drop"}
                            </p>
                            <p className="text-[11px] text-white/25 mt-0.5">
                                JPEG, PNG, WebP, GIF · max {MAX_MB} MB
                            </p>
                        </div>
                    </div>
                )}

                {/* Upload progress overlay */}
                {isUploading && (
                    <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                        <Spinner />
                        <p className="text-sm font-medium text-white/70">
                            Uploading… {uploadState.progress}%
                        </p>
                        {/* Progress bar */}
                        <div className="w-3/4 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-500 rounded-full transition-all duration-150"
                                style={{ width: `${uploadState.progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Error message */}
            {uploadState.status === "error" && (
                <div className="flex items-center gap-2 text-[12px] text-red-300 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {uploadState.message}
                </div>
            )}

            {/* Current URL display (read-only) */}
            {activeUrl && uploadState.status !== "uploading" && (
                <p className="text-[10px] text-white/20 truncate" title={activeUrl}>
                    {activeUrl}
                </p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />
        </div>
    );
}

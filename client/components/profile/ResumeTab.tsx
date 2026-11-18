import { useState } from "react";
import { FileText, Check, X, ExternalLink, Trash2, Loader2, Upload } from "lucide-react";
import { Button, ConfirmationDialog } from "@/components/ui";
import type { AuthUser } from "@/store/authSlice";
import { TabPanel, PanelHeader } from "./shared";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

export function ResumeTab({
  user, loading, resumeFile, resumeOk, resumeErr, onFileSelect, onUpload, onClear, onDelete,
}: {
  user: AuthUser;
  loading: boolean;
  resumeFile: File | null;
  resumeOk: boolean;
  resumeErr: string | null;
  onFileSelect: (file: File | null, error: string | null) => void;
  onUpload: () => void;
  onClear: () => void;
  onDelete: () => void | Promise<void>;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      await onDelete();
    } finally {
      setShowConfirm(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    if (!file) {
      onFileSelect(null, null);
      return;
    }
    if (file.size > MAX_RESUME_SIZE) {
      onFileSelect(null, "File size too large. Maximum allowed size is 5 MB.");
      return;
    }
    onFileSelect(file, null);
  };

  return (
    <TabPanel>
      <PanelHeader icon={<FileText className="h-3.5 w-3.5 text-brand-600" />} title="Resume / CV" />

      <div className="p-4 sm:p-6 space-y-5">
        {/* feedback banners */}
        {resumeOk && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
            <Check className="h-4 w-4 shrink-0" /> Resume uploaded successfully!
          </div>
        )}
        {resumeErr && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            <X className="h-4 w-4 shrink-0" /> {resumeErr}
          </div>
        )}

        {/* current resume */}
        {user.resumeUrl ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border bg-surface-alt px-4 py-3.5">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text">Resume uploaded</p>
                  <p className="text-[12px] text-text-subtle mt-0.5 truncate">
                    {user.resumeUrl.split('/').pop() || "Document"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <a
                  href={user.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50
                             px-3 py-1.5 text-[12px] font-medium text-brand-700
                             hover:bg-brand-100 transition-colors duration-200"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
                </a>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                  className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50
                             px-3 py-1.5 text-[12px] font-medium text-red-600
                             hover:bg-red-100 disabled:opacity-40 transition-colors duration-200"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Remove
                </button>
              </div>
            </div>

            {/* Resume Preview */}
            <div className="w-full rounded-xl border border-border overflow-hidden bg-surface-alt h-[300px] sm:h-[500px] relative">
              {/* We append url hash params to hide the browser's default PDF toolbar for a cleaner look */}
              <iframe
                src={user.resumeUrl.toLowerCase().endsWith('.pdf') ? `${user.resumeUrl}#toolbar=0&navpanes=0&view=FitH` : user.resumeUrl}
                className="w-full h-full border-0 bg-white"
                title="Resume Preview"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface-alt p-8 text-center">
            <FileText className="h-10 w-10 text-text-subtle mx-auto mb-3" />
            <p className="text-[14px] font-medium text-text-muted mb-1">No resume uploaded</p>
            <p className="text-[12px] text-text-subtle">Upload a PDF or Word document (max 5 MB)</p>
          </div>
        )}

        <div className="h-px bg-border" />

        {/* upload new */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-subtle">
            {user.resumeUrl ? "Replace Resume" : "Upload Resume"}
          </p>
          <label className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-brand-200
                            bg-brand-50/40 hover:bg-brand-50 hover:border-brand-300
                            cursor-pointer transition-all duration-250 p-6 text-center">
            <Upload className="h-7 w-7 text-brand-500" />
            <div className="min-w-0 max-w-full">
              <p className="text-[13px] font-medium text-text-muted truncate px-2">
                {resumeFile ? resumeFile.name : "Click to select file"}
              </p>
              <p className="text-[11px] text-text-subtle mt-0.5">PDF, DOC, DOCX · Max 5 MB</p>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {resumeFile && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" disabled={loading} onClick={onUpload}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {loading ? "Uploading…" : "Upload"}
              </Button>
              <Button variant="ghost" size="sm" disabled={loading} onClick={onClear}>
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Resume"
        message="Are you sure you want to remove your resume? This will permanently delete the uploaded file and remove the preview."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={loading}
      />
    </TabPanel>
  );
}


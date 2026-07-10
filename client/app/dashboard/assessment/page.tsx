import { ClipboardCheck } from "lucide-react";

export default function AssessmentPage() {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <ClipboardCheck size={20} className="text-blue-600" />
        AI Assessment
      </h1>
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
        <ClipboardCheck size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">
          Your assessment score will show up here soon.
        </p>
      </div>
    </div>
  );
}

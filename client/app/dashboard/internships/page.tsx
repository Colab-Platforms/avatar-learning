import { Briefcase } from "lucide-react";

export default function DashboardInternshipsPage() {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <Briefcase size={20} className="text-blue-600" />
        Internships
      </h1>
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
        <Briefcase size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">
          Task upload and verification is coming soon.
        </p>
      </div>
    </div>
  );
}

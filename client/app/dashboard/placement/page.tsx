import { Trophy } from "lucide-react";

export default function PlacementPage() {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <Trophy size={20} className="text-blue-600" />
        Job Placement
      </h1>
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
        <Trophy size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">Coming soon.</p>
      </div>
    </div>
  );
}

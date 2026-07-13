import { MessageCircleHeart } from "lucide-react";

export default function CounsellingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
        <MessageCircleHeart size={20} className="text-blue-600" />
        Counselling
      </h1>
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
        <MessageCircleHeart size={32} className="mx-auto mb-3 text-slate-300" />
        <p className="text-sm text-slate-500">
          Your counselling session will be shown here.
        </p>
      </div>
    </div>
  );
}

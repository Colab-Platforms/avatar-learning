import { Ban } from "lucide-react";

export function AutoSubmitModal({ reason }: { reason: "timeout" | "violation" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-xl text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Ban size={22} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Assessment submitted</h3>
        <p className="text-sm text-slate-500">
          {reason === "timeout"
            ? "Time is up. Your attempt has been submitted automatically."
            : "Too many tab switches were detected. Your attempt has been submitted automatically."}
        </p>
      </div>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";

export function TabSwitchWarningModal({
  count,
  max,
  onDismiss,
}: {
  count: number;
  max: number;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-xl text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Stay on this tab</h3>
        <p className="text-sm text-slate-500 mb-5">
          Warning {count} of {max}. Switching tabs or windows during the assessment is tracked. Reaching {max} will
          auto-submit your attempt.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          I understand, continue
        </button>
      </div>
    </div>
  );
}

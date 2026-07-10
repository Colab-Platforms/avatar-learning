import { CheckCircle2 } from "lucide-react";
import type { CounsellingProfile } from "@/lib/counselling/counsellingApi";

interface CounsellingSubmittedProps {
  profile: CounsellingProfile;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CounsellingSubmitted({
  profile,
}: CounsellingSubmittedProps) {
  const submittedAt = formatDate(profile.submittedAt);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-16 text-center shadow-sm">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
      <h2 className="text-2xl font-bold text-slate-800">
        Form Submitted Successfully
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
        Thank you, {profile.fullName}. Your pre-counselling information has
        been saved and shared with your counsellor so they can prepare for your
        first session.
      </p>
      {submittedAt && (
        <p className="mt-4 text-xs font-medium text-emerald-700">
          Submitted on {submittedAt}
        </p>
      )}
    </div>
  );
}

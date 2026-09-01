import { redirect } from "next/navigation";

export default async function LegacyDirect2HireCounsellingPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/dashboard/${courseId}/counselling`);
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevLoginForm } from "./DevLoginForm";

export const metadata: Metadata = { title: "Dev test login | Avatar Adaption", robots: { index: false, follow: false } };

// Local development only: production builds (NODE_ENV=production) answer 404. The API refuses it too unless the backend
// was started with NODE_ENV=development and DEV_TEST_LOGIN=true.
export default function DevAdaptionLoginPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DevLoginForm />;
}

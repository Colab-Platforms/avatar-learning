import type { Metadata } from "next";
import { BusinessAdminGuard } from "@/components/business-admin/BusinessAdminGuard";
// Scoped light theme: every rule starts with .ba-root[data-ba-theme="light"], so it cannot touch /admin or other pages.
import "@/components/business-admin/business-theme.css";

// Internal tool: keep it out of search indexes. Access itself is enforced by the API (see BusinessAdminGuard).
export const metadata: Metadata = {
  title: "Business Admin | Avatar Adaption",
  robots: { index: false, follow: false },
};

export default function BusinessAdminLayout({ children }: { children: React.ReactNode }) {
  return <BusinessAdminGuard>{children}</BusinessAdminGuard>;
}

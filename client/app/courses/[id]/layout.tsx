import type { Metadata } from "next";
import { API_BASE_URL, API_BASE_ERROR } from "@/lib/apiBase";
import { pageMetadata } from "@/lib/seo";

// SEO metadata for course detail pages (the page itself is a client component).
// Self-referencing canonical, so a course is never canonicalised to the /courses list.
// Enrol / learn / assessment / success sub-pages are noindex (next.config.ts headers).

type Props = { params: Promise<{ id: string }> };

const plain = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const path = `/courses/${encodeURIComponent(id)}`;
  let title = "AI Course | Avatar Learning";
  let description = "A practical AI course from Avatar Learning: learn at your own pace and build job-ready skills with hands-on projects.";
  if (!API_BASE_ERROR && API_BASE_URL) {
    try {
      // Same public endpoint the page uses; cached for an hour, so it adds no per-request API load.
      const res = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(id)}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(2500), // never hold the page back on a slow API
      });
      if (res.ok) {
        const course = (await res.json())?.data as { title?: string; description?: string } | undefined;
        if (course?.title) title = `${course.title} | Avatar Learning`;
        const d = course?.description ? plain(course.description) : "";
        if (d) description = d.length > 160 ? `${d.slice(0, 157).trimEnd()}…` : d;
      }
    } catch {
      // API unreachable: keep the generic title; the page itself still loads client-side.
    }
  }
  return pageMetadata({ title, description, path });
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return children;
}

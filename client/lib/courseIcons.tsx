import {
  Brain, PenLine, FolderCode, Wrench,
  GraduationCap, Briefcase, RefreshCw, Building2,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Brain,
  PenLine,
  FolderCode,
  Wrench,
  GraduationCap,
  Briefcase,
  RefreshCw,
  Building2,
};

export function CourseIcon({
  name,
  className = "h-6 w-6 text-brand-400",
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

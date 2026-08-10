"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    BookOpen,
    FolderOpen,
    ListVideo,
    Users,
    TrendingUp,
    Plus,
    IndianRupee,
    Briefcase,
    Wallet,
    UserCheck,
} from "lucide-react";
import {
    fetchAdminCourses,
    fetchCategories,
    fetchAdminDashboardOverview,
    type AdminDashboardOverview,
} from "@/lib/adminApi";
import { formatPaise } from "@/lib/formatters";

interface StatCard {
    label: string;
    value: number | string;
    sub: string;
    icon: React.ElementType;
    color: string;
}

interface BreakdownSegment {
    label: string;
    count: number;
    color: string;
    bar: string;
}

function BreakdownBar({
    title,
    segments,
    footnote,
}: {
    title: string;
    segments: BreakdownSegment[];
    footnote?: string;
}) {
    const total = segments.reduce((s, seg) => s + seg.count, 0);
    return (
        <div className="bg-ink-800 border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">{title}</span>
                {footnote && <span className="text-xs text-white/40">{footnote}</span>}
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-white/6 flex">
                {total === 0 ? (
                    <div className="h-full w-full bg-white/8" />
                ) : (
                    segments.map((seg) => (
                        <div
                            key={seg.label}
                            className={`h-full ${seg.bar} transition-all duration-700`}
                            style={{ width: `${(seg.count / total) * 100}%` }}
                        />
                    ))
                )}
            </div>
            <div className="mt-3 space-y-1.5">
                {segments.map((seg) => (
                    <div key={seg.label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-white/50">
                            <span className={`w-2 h-2 rounded-full ${seg.color}`} />
                            {seg.label}
                        </span>
                        <span className="text-white/70 font-medium">
                            {seg.count}
                            <span className="text-white/30 font-normal ml-1">
                                ({total ? Math.round((seg.count / total) * 100) : 0}%)
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface RecentCourse {
    id: string;
    title: string;
    level: string;
    isPublished: boolean;
    category: { name: string };
    _count: { lessons: number; enrollments: number };
}

const LEVEL_COLOR: Record<string, string> = {
    BEGINNER: "text-emerald-400 bg-emerald-400/10",
    INTERMEDIATE: "text-amber-400 bg-amber-400/10",
    ADVANCED: "text-red-400 bg-red-400/10",
};

export default function AdminOverviewPage() {
    const [courses, setCourses] = useState<RecentCourse[]>([]);
    const [catCount, setCatCount] = useState(0);
    const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [c, cats, ov] = await Promise.all([
                fetchAdminCourses(),
                fetchCategories(),
                fetchAdminDashboardOverview(),
            ]);
            setCourses(c);
            setCatCount(cats.length);
            setOverview(ov);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const published = courses.filter((c) => c.isPublished).length;
    const totalLessons = courses.reduce((s, c) => s + c._count.lessons, 0);
    const totalEnrollments = courses.reduce((s, c) => s + c._count.enrollments, 0);

    const stats: StatCard[] = [
        { label: "Total Courses", value: courses.length, sub: `${published} published`, icon: BookOpen, color: "text-brand-400 bg-brand-500/10" },
        { label: "Categories", value: catCount, sub: "Active groups", icon: FolderOpen, color: "text-elec-400 bg-elec-500/10" },
        { label: "Total Lessons", value: totalLessons, sub: "Across all courses", icon: ListVideo, color: "text-purple-400 bg-purple-500/10" },
        { label: "Enrollments", value: totalEnrollments, sub: "Total students", icon: Users, color: "text-emerald-400 bg-emerald-500/10" },
        ...(overview ? [{
            label: "Course Revenue",
            value: formatPaise(overview.revenue.courseInPaise),
            sub: "From paid course orders",
            icon: IndianRupee,
            color: "text-amber-400 bg-amber-500/10",
        }] : []),
    ];

    const d2hStats: StatCard[] = overview ? [
        {
            label: "D2H Revenue",
            value: formatPaise(overview.revenue.direct2hireInPaise),
            sub: "From paid Direct2Hire orders",
            icon: IndianRupee,
            color: "text-amber-400 bg-amber-500/10",
        },
        {
            label: "Assessment + Counselling Revenue",
            value: formatPaise(overview.revenue.assessmentCounsellingInPaise),
            sub: "From ₹99 tier purchases",
            icon: IndianRupee,
            color: "text-sky-400 bg-sky-500/10",
        },
        {
            label: "D2H Enrolled",
            value: overview.d2h.paid,
            sub: `${overview.d2h.refunded} refunded overall`,
            icon: UserCheck,
            color: "text-sky-400 bg-sky-500/10",
        },
        {
            label: "Partners",
            value: overview.partners.approved,
            sub: `${overview.partners.pending} requests pending`,
            icon: Wallet,
            color: "text-pink-400 bg-pink-500/10",
        },
        {
            label: "Internship Applications",
            value: overview.internshipApps.pending + overview.internshipApps.accepted + overview.internshipApps.rejected,
            sub: `${overview.internshipApps.pending} pending · ${overview.internshipApps.accepted} accepted`,
            icon: Users,
            color: "text-violet-400 bg-violet-500/10",
        },
    ] : [];

    const revenueSegments: BreakdownSegment[] = overview ? [
        { label: "Direct2Hire", count: overview.revenue.direct2hireInPaise, color: "bg-amber-400", bar: "bg-amber-500" },
        { label: "Courses", count: overview.revenue.courseInPaise, color: "bg-brand-400", bar: "bg-brand-500" },
        { label: "Assessment + Counselling", count: overview.revenue.assessmentCounsellingInPaise, color: "bg-sky-400", bar: "bg-sky-500" },
    ] : [];

    const d2hFunnelSegments: BreakdownSegment[] = overview ? [
        { label: "Enrolled", count: overview.d2h.paid, color: "bg-sky-400", bar: "bg-sky-500" },
        { label: "Refunded", count: overview.d2h.refunded, color: "bg-red-400", bar: "bg-red-500" },
    ] : [];
    const d2hRetentionRate = overview && (overview.d2h.paid + overview.d2h.refunded) > 0
        ? Math.round((overview.d2h.paid / (overview.d2h.paid + overview.d2h.refunded)) * 100)
        : null;

    const partnerSegments: BreakdownSegment[] = overview ? [
        { label: "Approved", count: overview.partners.approved, color: "bg-pink-400", bar: "bg-pink-500" },
        { label: "Pending", count: overview.partners.pending, color: "bg-amber-400", bar: "bg-amber-500" },
        { label: "Rejected", count: overview.partners.rejected, color: "bg-red-400", bar: "bg-red-500" },
    ] : [];
    const partnerApprovalTotal = overview ? overview.partners.approved + overview.partners.pending + overview.partners.rejected : 0;
    const partnerApprovalRate = overview && partnerApprovalTotal > 0
        ? Math.round((overview.partners.approved / partnerApprovalTotal) * 100)
        : null;

    const internshipAppSegments: BreakdownSegment[] = overview ? [
        { label: "Accepted", count: overview.internshipApps.accepted, color: "bg-emerald-400", bar: "bg-emerald-500" },
        { label: "Pending", count: overview.internshipApps.pending, color: "bg-amber-400", bar: "bg-amber-500" },
        { label: "Rejected", count: overview.internshipApps.rejected, color: "bg-red-400", bar: "bg-red-500" },
    ] : [];
    const internshipAppTotal = overview ? overview.internshipApps.accepted + overview.internshipApps.pending + overview.internshipApps.rejected : 0;
    const internshipAcceptanceRate = overview && internshipAppTotal > 0
        ? Math.round((overview.internshipApps.accepted / internshipAppTotal) * 100)
        : null;

    const courseLevelCounts = courses.reduce<Record<string, number>>((acc, c) => {
        acc[c.level] = (acc[c.level] ?? 0) + 1;
        return acc;
    }, {});

    const courseLevelSegments: BreakdownSegment[] = [
        { label: "Beginner", count: courseLevelCounts.BEGINNER ?? 0, color: "bg-emerald-400", bar: "bg-emerald-500" },
        { label: "Intermediate", count: courseLevelCounts.INTERMEDIATE ?? 0, color: "bg-amber-400", bar: "bg-amber-500" },
        { label: "Advanced", count: courseLevelCounts.ADVANCED ?? 0, color: "bg-red-400", bar: "bg-red-500" },
    ];

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-sm text-white/40 mt-0.5">Welcome back — here's what's happening.</p>
                </div>
                <Link
                    href="/admin/courses"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors"
                >
                    <Plus size={15} />
                    New Course
                </Link>
            </div>

            {/* Revenue Overview */}
            {loading ? (
                <div className="h-32 rounded-2xl bg-ink-800 border border-white/5 animate-pulse" />
            ) : overview && (
                <div className="relative overflow-hidden bg-linear-to-br from-ink-800 via-ink-800 to-brand-700/20 border border-white/6 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-sm font-semibold text-white">
                            <IndianRupee size={15} className="text-brand-400" />
                            Total Revenue
                        </span>
                        <span className="text-xs text-white/40">Lifetime, paid orders only</span>
                    </div>
                    <p className="text-4xl font-bold text-white mb-4 tracking-tight">{formatPaise(overview.revenue.totalInPaise)}</p>
                    <div className="h-2 rounded-full overflow-hidden bg-white/6 flex">
                        {overview.revenue.totalInPaise === 0 ? (
                            <div className="h-full w-full bg-white/8" />
                        ) : (
                            revenueSegments.map((seg) => (
                                <div
                                    key={seg.label}
                                    className={`h-full ${seg.bar} transition-all duration-700`}
                                    style={{ width: `${(seg.count / overview.revenue.totalInPaise) * 100}%` }}
                                />
                            ))
                        )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
                        {revenueSegments.map((seg) => (
                            <span key={seg.label} className="flex items-center gap-2 text-xs text-white/50">
                                <span className={`w-2 h-2 rounded-full ${seg.color}`} />
                                {seg.label}
                                <span className="text-white/70 font-medium">{formatPaise(seg.count)}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Direct2Hire */}
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wide">
                <Briefcase size={14} className="text-sky-400" />
                Direct2Hire
            </h2>
            {loading ? (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-ink-800 border border-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {d2hStats.map(({ label, value, sub, icon: Icon, color }) => (
                        <div key={label} className="bg-ink-800 border border-white/6 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/12 transition-colors">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{value}</p>
                                <p className="text-xs text-white/40 mt-0.5">{label}</p>
                                <p className="text-[11px] text-white/25 mt-1">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && overview && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <BreakdownBar
                        title="Enrollment Retention"
                        segments={d2hFunnelSegments}
                        footnote={d2hRetentionRate !== null ? `${d2hRetentionRate}% retained` : undefined}
                    />
                    <BreakdownBar
                        title="Partner Applications"
                        segments={partnerSegments}
                        footnote={partnerApprovalRate !== null ? `${partnerApprovalRate}% approved` : undefined}
                    />
                    <BreakdownBar
                        title="Internship Applications"
                        segments={internshipAppSegments}
                        footnote={internshipAcceptanceRate !== null ? `${internshipAcceptanceRate}% accepted` : undefined}
                    />
                </div>
            )}

            {/* Courses */}
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wide">
                <BookOpen size={14} className="text-brand-400" />
                Courses
            </h2>
            {loading ? (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-ink-800 border border-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.map(({ label, value, sub, icon: Icon, color }) => (
                        <div key={label} className="bg-ink-800 border border-white/6 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/12 transition-colors">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{value}</p>
                                <p className="text-xs text-white/40 mt-0.5">{label}</p>
                                <p className="text-[11px] text-white/25 mt-1">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && courses.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-ink-800 border border-white/6 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={15} className="text-brand-400" />
                                <span className="text-sm font-semibold text-white">Publishing Progress</span>
                            </div>
                            <span className="text-xs text-white/40">{published} / {courses.length} courses live</span>
                        </div>
                        <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-500 rounded-full transition-all duration-700"
                                style={{ width: courses.length ? `${(published / courses.length) * 100}%` : "0%" }}
                            />
                        </div>
                    </div>
                    <BreakdownBar title="Courses by Level" segments={courseLevelSegments} />
                </div>
            )}

            {/* Recent Courses */}
            <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-sm font-semibold text-white">Recent Courses</h2>
                    <Link href="/admin/courses" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                        View all →
                    </Link>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-10 rounded-lg bg-ink-700/40 animate-pulse" />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="py-16 text-center">
                        <BookOpen size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm text-white/35">No courses yet.</p>
                        <Link href="/admin/courses" className="mt-3 inline-block text-xs text-brand-400 hover:text-brand-300">
                            Create your first course →
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-white/4">
                        {courses.slice(0, 6).map((course) => (
                            <div key={course.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-ink-700/30 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white/85 truncate">{course.title}</p>
                                    <p className="text-xs text-white/35 mt-0.5">{course.category.name}</p>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${LEVEL_COLOR[course.level]}`}>
                                    {course.level}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    course.isPublished ? "bg-brand-500/10 text-brand-400" : "bg-white/6 text-white/35"
                                }`}>
                                    {course.isPublished ? "Live" : "Draft"}
                                </span>
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-white/50">{course._count.lessons} lessons</p>
                                    <p className="text-[11px] text-white/25">{course._count.enrollments} enrolled</p>
                                </div>
                                <Link
                                    href={`/admin/courses/${course.id}`}
                                    className="text-xs text-white/35 hover:text-brand-400 transition-colors shrink-0"
                                >
                                    Manage →
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

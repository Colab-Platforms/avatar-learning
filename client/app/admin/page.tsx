"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, FolderOpen, ListVideo, Users, TrendingUp, Plus } from "lucide-react";
import { fetchAdminCourses, fetchCategories } from "@/lib/adminApi";

interface StatCard {
    label: string;
    value: number | string;
    sub: string;
    icon: React.ElementType;
    color: string;
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
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [c, cats] = await Promise.all([fetchAdminCourses(), fetchCategories()]);
            setCourses(c);
            setCatCount(cats.length);
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

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-ink-800 border border-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.map(({ label, value, sub, icon: Icon, color }) => (
                        <div key={label} className="bg-ink-800 border border-white/6 rounded-2xl p-5 flex flex-col gap-3">
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

            {/* Publishing Progress */}
            {!loading && courses.length > 0 && (
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

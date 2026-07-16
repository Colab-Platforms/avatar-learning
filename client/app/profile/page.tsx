"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser, logoutThunk, clearError, uploadResume, deleteResume } from "@/store/authSlice";
import { fetchMyEnrollments, type MyEnrollment } from "@/lib/coursesApi";
import type { UpdateUserBody } from "@/store/authSlice";
import type { Tab } from "@/components/profile/shared";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PersonalTab } from "@/components/profile/PersonalTab";
import { LocationTab } from "@/components/profile/LocationTab";
import { CoursesTab } from "@/components/profile/CoursesTab";
import { ResumeTab } from "@/components/profile/ResumeTab";
import { PartnersTab } from "@/components/profile/PartnersTab";
import { AccountDetails } from "@/components/profile/AccountDetails";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { user, loading, error, hasHydrated } = useAppSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [editing,       setEditing]       = useState(false);
  const [saveOk,        setSaveOk]        = useState(false);
  const [form,          setForm]          = useState<UpdateUserBody>({});
  const [enrollments,   setEnrollments]   = useState<MyEnrollment[]>([]);
  const [resumeFile,    setResumeFile]    = useState<File | null>(null);
  const [resumeOk,      setResumeOk]      = useState(false);
  const [resumeErr,     setResumeErr]     = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (!user) return;
    fetchMyEnrollments().then(setEnrollments).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user && editing) {
      setForm({
        firstName: user.firstName ?? "",
        lastName:  user.lastName  ?? "",
        address:   user.address   ?? "",
        gender:    user.gender    ?? "",
        state:     user.state     ?? "",
        country:   user.country   ?? "",
      });
    }
  }, [user, editing]);

  if (!hasHydrated || !user) return null;

  const setField = (field: keyof UpdateUserBody) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    dispatch(clearError());
    setSaveOk(false);
    const result = await dispatch(updateUser({ id: user.id, ...form }));
    if (updateUser.fulfilled.match(result)) {
      setSaveOk(true);
      setEditing(false);
      setTimeout(() => setSaveOk(false), 3500);
    }
  };

  const handleCancel = () => { setEditing(false); dispatch(clearError()); };

  const handleResumeFileSelect = (file: File | null, err: string | null) => {
    setResumeErr(err);
    setResumeFile(file);
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setResumeErr(null);
    setResumeOk(false);
    const result = await dispatch(uploadResume(resumeFile));
    if (uploadResume.fulfilled.match(result)) {
      setResumeOk(true);
      setResumeFile(null);
      setTimeout(() => setResumeOk(false), 3500);
    } else {
      setResumeErr(result.payload as string);
    }
  };

  const handleResumeDelete = async () => {
    setResumeErr(null);
    const result = await dispatch(deleteResume());
    if (!deleteResume.fulfilled.match(result)) {
      setResumeErr(result.payload as string);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/");
  };

  const completedCount = enrollments.filter((e) => e.isCompleted).length;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-surface-alt text-text overflow-x-hidden pt-16">
        <div className="container-x py-6 sm:py-10 max-w-6xl">

          {/* ── toast banners ── */}
          <div className="space-y-3 mb-6">
            {saveOk && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200
                              bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700"
                style={{ animation: "fade-up-in 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
                <Check className="h-4 w-4 shrink-0" /> Profile updated successfully!
              </div>
            )}
            {error && !saveOk && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200
                              bg-red-50 px-4 py-3 text-[13px] text-red-700"
                style={{ animation: "fade-up-in 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
                <X className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════
              MAIN LAYOUT — sidebar + content
              NOTE: explicit grid-cols-1 on mobile + min-w-0
              on both tracks stops content from forcing the
              grid wider than the viewport (grid blowout fix)
          ════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

            <ProfileSidebar
              user={user}
              editing={editing}
              loading={loading}
              coursesCount={enrollments.length}
              completedCount={completedCount}
              onEdit={() => setEditing(true)}
              onSave={handleSave}
              onCancel={handleCancel}
              onLogout={handleLogout}
            />

            {/* ─── RIGHT CONTENT ─── */}
            <div className="space-y-5 min-w-0">

              <ProfileTabs activeTab={activeTab} onChange={setActiveTab} coursesCount={enrollments.length} />

              {activeTab === "personal" && (
                <PersonalTab
                  user={user} editing={editing} form={form} loading={loading}
                  onFieldChange={setField} onSave={handleSave} onCancel={handleCancel}
                />
              )}

              {activeTab === "location" && (
                <LocationTab
                  user={user} editing={editing} form={form} loading={loading}
                  onFieldChange={setField} onSave={handleSave} onCancel={handleCancel}
                  onEditStart={() => setEditing(true)}
                />
              )}

              {activeTab === "courses" && <CoursesTab enrollments={enrollments} />}

              {activeTab === "resume" && (
                <ResumeTab
                  user={user} loading={loading}
                  resumeFile={resumeFile} resumeOk={resumeOk} resumeErr={resumeErr}
                  onFileSelect={handleResumeFileSelect}
                  onUpload={handleResumeUpload}
                  onClear={() => setResumeFile(null)}
                  onDelete={handleResumeDelete}
                />
              )}

              {activeTab === "partners" && <PartnersTab />}

              <AccountDetails user={user} />

            </div>
            {/* end right content */}

          </div>
          {/* end grid */}

        </div>
      </main>
      <Footer />
    </>
  );
}

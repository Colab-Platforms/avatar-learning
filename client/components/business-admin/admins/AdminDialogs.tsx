"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, X } from "lucide-react";
import {
  apiErrorField,
  createAdmin,
  describeApiError,
  resetAdminPassword,
  updateAdmin,
  type AdminAccount,
  type AdminMeta,
  type RoleKey,
} from "@/lib/businessAdminApi";

export function Modal({ title, onClose, children, label, wide = false }: { title: string; onClose: () => void; children: ReactNode; label: string; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input, select, button[type=submit]")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={ref} className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900 shadow-2xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} sm:rounded-2xl`}>
        <div className="flex items-center justify-between gap-3 border-b border-white/6 px-5 py-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-white/50 hover:bg-white/5">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none";

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-white/60">{label}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block text-xs text-red-300">{error}</span> : hint ? <span className="mt-1 block text-[11px] text-white/35">{hint}</span> : null}
    </label>
  );
}

function PasswordInput({ value, onChange, name, autoComplete = "new-password" }: { value: string; onChange: (v: string) => void; name: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`${input} pr-10`}
      />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 hover:text-white">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

const PASSWORD_HINT = "At least 10 characters, mixing three of: lowercase, uppercase, numbers, symbols. Not a common password, and not containing the person's name or email.";

function RoleAndModules({ meta, roleKey, modules, onRole, onModules }: { meta: AdminMeta; roleKey: RoleKey; modules: string[]; onRole: (r: RoleKey) => void; onModules: (m: string[]) => void }) {
  const preset = meta.roles.find((r) => r.key === roleKey);
  const custom = roleKey === "CUSTOM";
  const shown = custom ? modules : (preset?.modules ?? []);
  return (
    <>
      <Field label="Role" hint={preset?.description}>
        <select
          name="roleKey"
          value={roleKey}
          onChange={(e) => {
            const next = e.target.value as RoleKey;
            // Switching to Custom starts from what the current role already allows, so nothing is silently dropped.
            if (next === "CUSTOM" && modules.length === 0) onModules(preset?.modules ?? []);
            onRole(next);
          }}
          className={input}
        >
          {meta.roles.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
      </Field>
      <fieldset className="mt-4">
        <legend className="mb-1 text-xs font-semibold text-white/60">Module permissions</legend>
        <p className="mb-2 text-[11px] text-white/35">{custom ? "Tick the modules this admin may use." : "Set by the role. Choose Custom to pick modules yourself."}</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {meta.modules.map((m) => {
            const on = shown.includes(m.key);
            return (
              <label key={m.key} className={`flex items-center gap-2 rounded-lg border border-white/8 px-3 py-2 text-sm ${custom ? "cursor-pointer text-white/80" : "text-white/50"}`}>
                <input
                  type="checkbox"
                  name={`module-${m.key}`}
                  checked={on}
                  disabled={!custom}
                  onChange={(e) => onModules(e.target.checked ? [...modules, m.key] : modules.filter((x) => x !== m.key))}
                />
                {m.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

export function CreateAdminDialog({ meta, onClose }: { meta: AdminMeta; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [roleKey, setRoleKey] = useState<RoleKey>("SUPPORT_AGENT");
  const [modules, setModules] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const m = useMutation({
    mutationFn: () => createAdmin({ ...form, roleKey, ...(roleKey === "CUSTOM" ? { modules } : {}) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["biz-admins"] });
      onClose();
    },
    onError: (err) => {
      const field = apiErrorField(err);
      setFieldErrors(field ? { [field]: describeApiError(err) } : { form: describeApiError(err) });
    },
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter the person's name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Enter a password.";
    if (roleKey === "CUSTOM" && modules.length === 0) errs.modules = "Select at least one module.";
    setFieldErrors(errs);
    if (Object.keys(errs).length === 0) m.mutate();
  };
  return (
    <Modal title="Create admin" label="Create admin" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Full name" error={fieldErrors.name}><input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="off" className={input} /></Field>
        <Field label="Email ID" error={fieldErrors.email}><input name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" className={input} /></Field>
        <Field label="Password" error={fieldErrors.password} hint={PASSWORD_HINT}><PasswordInput name="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} /></Field>
        <RoleAndModules meta={meta} roleKey={roleKey} modules={modules} onRole={setRoleKey} onModules={setModules} />
        {fieldErrors.modules && <p role="alert" className="text-xs text-red-300">{fieldErrors.modules}</p>}
        {fieldErrors.form && <p role="alert" className="text-sm text-red-300">{fieldErrors.form}</p>}
        <p className="text-[11px] text-white/35">The new admin signs in with this email and password. They cannot be made a Super Admin from here.</p>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={m.isPending} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{m.isPending ? "Creating…" : "Create admin"}</button>
        </div>
      </form>
    </Modal>
  );
}

export function EditAdminDialog({ admin, meta, onClose }: { admin: AdminAccount; meta: AdminMeta; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(admin.name);
  const [roleKey, setRoleKey] = useState<RoleKey>(admin.roleKey ?? (admin.source === "allowlist" ? "MANAGER" : "SUPPORT_AGENT"));
  const [modules, setModules] = useState<string[]>(admin.roleKey === "CUSTOM" ? admin.modules : []);
  const [error, setError] = useState("");
  const m = useMutation({
    mutationFn: () => updateAdmin(admin.id, { name: name.trim(), roleKey, ...(roleKey === "CUSTOM" ? { modules } : {}) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["biz-admins"] });
      onClose();
    },
    onError: (err) => setError(describeApiError(err)),
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Enter the person's name.");
    if (roleKey === "CUSTOM" && modules.length === 0) return setError("Select at least one module.");
    setError("");
    m.mutate();
  };
  return (
    <Modal title={`Edit ${admin.name}`} label="Edit admin" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-xs text-white/40">{admin.email}</p>
        {admin.source === "allowlist" && <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">This admin currently has full access through the server allowlist. Saving gives them the permissions below instead.</p>}
        <Field label="Full name"><input name="name" value={name} onChange={(e) => setName(e.target.value)} className={input} /></Field>
        <RoleAndModules meta={meta} roleKey={roleKey} modules={modules} onRole={setRoleKey} onModules={setModules} />
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={m.isPending} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{m.isPending ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </Modal>
  );
}

export function ResetPasswordDialog({ admin, onClose }: { admin: AdminAccount; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const m = useMutation({
    mutationFn: () => resetAdminPassword(admin.id, password),
    onSuccess: () => setDone(true),
    onError: (err) => setError(describeApiError(err)),
  });
  const mismatch = useMemo(() => confirm.length > 0 && confirm !== password, [confirm, password]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return setError("Enter a new password.");
    if (password !== confirm) return setError("The two passwords do not match.");
    setError("");
    m.mutate();
  };
  return (
    <Modal title={`Reset password for ${admin.name}`} label="Reset password" onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <p role="status" className="text-sm text-emerald-300">Password reset. {admin.name} has been signed out everywhere and must sign in with the new password.</p>
          <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Done</button></div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="New password" hint={PASSWORD_HINT}><PasswordInput name="password" value={password} onChange={setPassword} /></Field>
          <Field label="Confirm new password" error={mismatch ? "The two passwords do not match." : undefined}><PasswordInput name="confirm" value={confirm} onChange={setConfirm} /></Field>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={m.isPending} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{m.isPending ? "Resetting…" : "Reset password"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function DeactivateDialog({ admin, onClose }: { admin: AdminAccount; onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const m = useMutation({
    mutationFn: () => updateAdmin(admin.id, { isActive: false }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["biz-admins"] });
      onClose();
    },
    onError: (err) => setError(describeApiError(err)),
  });
  return (
    <Modal title={`Deactivate ${admin.name}?`} label="Deactivate admin" onClose={onClose}>
      <p className="text-sm text-white/60">They will be signed out immediately and cannot open Business Admin until you activate the account again. Their conversations stay assigned to them.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
        <button type="button" onClick={() => m.mutate()} disabled={m.isPending} className="rounded-lg border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60">{m.isPending ? "Deactivating…" : "Deactivate"}</button>
      </div>
    </Modal>
  );
}

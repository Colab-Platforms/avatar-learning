import { User, Mail, Phone, BadgeCheck } from "lucide-react";
import type { AuthUser, UpdateUserBody } from "@/store/authSlice";
import { Field, EditActions, TabPanel, PanelHeader, ReadOnlyRow, inputCls } from "./shared";

export function PersonalTab({
  user, editing, form, loading, onFieldChange, onSave, onCancel,
}: {
  user: AuthUser;
  editing: boolean;
  form: UpdateUserBody;
  loading: boolean;
  onFieldChange: (field: keyof UpdateUserBody) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <TabPanel>
      <PanelHeader icon={<User className="h-3.5 w-3.5 text-brand-400" />} title="Personal Information" editing={editing} />

      <div className="p-4 sm:p-6 space-y-5">
        {/* name row */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="First Name"
            value={user.firstName}
            editing={editing}
            inputNode={<input value={form.firstName ?? ""} onChange={onFieldChange("firstName")} placeholder="First name" className={inputCls} />}
          />
          <Field
            label="Last Name"
            value={user.lastName}
            editing={editing}
            inputNode={<input value={form.lastName ?? ""} onChange={onFieldChange("lastName")} placeholder="Last name" className={inputCls} />}
          />
        </div>

        <div className="divider-glow" />

        {/* email + phone — read-only rows */}
        <div className="grid sm:grid-cols-2 gap-4">
          <ReadOnlyRow
            icon={<Mail className="h-4 w-4 text-white/20 shrink-0" />}
            label="Email Address"
            value={user.email}
            badge={user.isEmailVerified && (
              <span className="hidden xs:inline-flex shrink-0 items-center gap-1 text-[11px] text-emerald-400
                               bg-emerald-500/8 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
          />
          <ReadOnlyRow
            icon={<Phone className="h-4 w-4 text-white/20 shrink-0" />}
            label="Phone Number"
            value={user.phoneNo}
            badge={user.isPhoneVerified && (
              <span className="hidden xs:inline-flex shrink-0 items-center gap-1 text-[11px] text-emerald-400
                               bg-emerald-500/8 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
          />
        </div>

        <div className="divider-glow" />

        {/* gender */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Gender"
            value={user.gender}
            editing={editing}
            inputNode={
              <select value={form.gender ?? ""} onChange={onFieldChange("gender")}
                className={`${inputCls} cursor-pointer`}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            }
          />
        </div>

        {editing && <EditActions loading={loading} onSave={onSave} onCancel={onCancel} />}
      </div>
    </TabPanel>
  );
}

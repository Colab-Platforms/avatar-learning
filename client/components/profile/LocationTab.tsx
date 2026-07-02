import { MapPin, Globe } from "lucide-react";
import type { AuthUser, UpdateUserBody } from "@/store/authSlice";
import { Field, EditActions, TabPanel, PanelHeader, inputCls } from "./shared";

export function LocationTab({
  user, editing, form, loading, onFieldChange, onSave, onCancel, onEditStart,
}: {
  user: AuthUser;
  editing: boolean;
  form: UpdateUserBody;
  loading: boolean;
  onFieldChange: (field: keyof UpdateUserBody) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditStart: () => void;
}) {
  return (
    <TabPanel>
      <PanelHeader icon={<MapPin className="h-3.5 w-3.5 text-brand-400" />} title="Location" editing={editing} />

      <div className="p-4 sm:p-6 space-y-5">
        <Field
          label="Street Address"
          value={user.address}
          editing={editing}
          inputNode={<input value={form.address ?? ""} onChange={onFieldChange("address")} placeholder="123 Main Street" className={inputCls} />}
        />

        <div className="divider-glow" />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="State / Province"
            value={user.state}
            editing={editing}
            inputNode={<input value={form.state ?? ""} onChange={onFieldChange("state")} placeholder="Maharashtra" className={inputCls} />}
          />
          <Field
            label="Country"
            value={user.country}
            editing={editing}
            inputNode={<input value={form.country ?? ""} onChange={onFieldChange("country")} placeholder="India" className={inputCls} />}
          />
        </div>

        {/* map placeholder — tasteful empty state */}
        {!editing && !user.state && !user.country && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <Globe className="h-8 w-8 text-white/10 mx-auto mb-2" />
            <p className="text-[13px] text-white/25">No location set yet</p>
            <button
              onClick={onEditStart}
              className="mt-2 text-[12px] text-brand-400/60 hover:text-brand-400 transition-colors duration-200"
            >
              Add your location →
            </button>
          </div>
        )}

        {editing && <EditActions loading={loading} onSave={onSave} onCancel={onCancel} />}
      </div>
    </TabPanel>
  );
}

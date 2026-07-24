import { MapPin, Globe } from "lucide-react";
import type { AuthUser, UpdateUserBody } from "@/store/authSlice";
import { Field, EditActions, TabPanel, PanelHeader, inputCls } from "./shared";
import {
  getCountries,
  getStatesForCountry,
  getCitiesForState,
} from "@/data/countries";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

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
  const countries = useMemo(() => getCountries(), []);
  const states = useMemo(() => form.country ? getStatesForCountry(form.country) : [], [form.country]);
  const cities = useMemo(() => (form.country && form.state) ? getCitiesForState(form.country, form.state) : [], [form.country, form.state]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFieldChange("country")(e);
    const emptyEvent = { target: { value: "" } } as React.ChangeEvent<HTMLSelectElement>;
    onFieldChange("state")(emptyEvent);
    onFieldChange("city")(emptyEvent);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFieldChange("state")(e);
    const emptyEvent = { target: { value: "" } } as React.ChangeEvent<HTMLSelectElement>;
    onFieldChange("city")(emptyEvent);
  };

  return (
    <TabPanel>
      <PanelHeader icon={<MapPin className="h-3.5 w-3.5 text-brand-600" />} title="Location" editing={editing} />

      <div className="p-4 sm:p-6 space-y-5">
        <Field
          label="Street Address"
          value={user.address}
          editing={editing}
          inputNode={<input value={form.address ?? ""} onChange={onFieldChange("address")} placeholder="123 Main Street" className={inputCls} />}
        />

        <div className="h-px bg-border" />

        <div className="grid sm:grid-cols-3 gap-4">
          <Field
            label="Country"
            value={user.country}
            editing={editing}
            inputNode={
              <select
                value={form.country ?? ""}
                onChange={handleCountryChange}
                className={cn(inputCls, "appearance-none cursor-pointer bg-white")}
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {c.name}
                  </option>
                ))}
              </select>
            }
          />
          <Field
            label="State / Province"
            value={user.state}
            editing={editing}
            inputNode={
              <select
                value={form.state ?? ""}
                onChange={handleStateChange}
                disabled={states.length === 0}
                className={cn(inputCls, "appearance-none cursor-pointer bg-white disabled:opacity-50")}
              >
                <option value="">
                  {states.length === 0 ? "No states available" : "Select state"}
                </option>
                {states.map((s) => (
                  <option key={s.isoCode} value={s.isoCode}>
                    {s.name}
                  </option>
                ))}
              </select>
            }
          />
          <Field
            label="City"
            value={user.city}
            editing={editing}
            inputNode={
              <select
                value={form.city ?? ""}
                onChange={onFieldChange("city")}
                disabled={!form.state || cities.length === 0}
                className={cn(inputCls, "appearance-none cursor-pointer bg-white disabled:opacity-50")}
              >
                <option value="">
                  {!form.state
                    ? "Select state first"
                    : cities.length === 0
                    ? "No cities available"
                    : "Select city"}
                </option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            }
          />
        </div>

        {/* map placeholder — tasteful empty state */}
        {!editing && !user.state && !user.country && (
          <div className="rounded-xl border border-border bg-surface-alt p-8 text-center">
            <Globe className="h-8 w-8 text-text-subtle mx-auto mb-2" />
            <p className="text-[13px] text-text-subtle">No location set yet</p>
            <button
              onClick={onEditStart}
              className="mt-2 text-[12px] text-brand-600 hover:text-brand-700 transition-colors duration-200"
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

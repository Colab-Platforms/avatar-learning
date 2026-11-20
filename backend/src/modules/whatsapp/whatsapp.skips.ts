import type { SkipRecord, SkipReason } from "./whatsapp.types.js";

/** Counts per skip reason, e.g. { phone_number_id_mismatch: 2 }. */
export function countSkipReasons(records: SkipRecord[]): Partial<Record<SkipReason, number>> {
  const out: Partial<Record<SkipReason, number>> = {};
  for (const r of records) out[r.reason] = (out[r.reason] ?? 0) + 1;
  return out;
}

const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
const fmt = (m: Map<string, number>) => [...m.entries()].map(([k, v]) => `${k}:${v}`).join(",");

/**
 * Human-readable, privacy-safe explanation of why changes were skipped. Contains only reason codes, counts,
 * Meta field names, required-key NAMES and match booleans - never IDs, phone numbers, names, tokens or message text.
 * Returns "" when nothing was skipped.
 */
export function describeSkips(records: SkipRecord[]): string {
  if (records.length === 0) return "";
  const parts: string[] = [
    "reasons=" +
      Object.entries(countSkipReasons(records))
        .map(([k, v]) => `${k}=${v}`)
        .join(","),
  ];

  const mismatches = records.filter((r) => r.reason === "phone_number_id_mismatch");
  if (mismatches.length > 0) {
    const present = mismatches.filter((r) => r.incomingPhoneNumberIdPresent).length;
    parts.push("phone_number_id_match=false", `incoming_phone_number_id_present=${present}/${mismatches.length}`);
  }

  const fields = new Map<string, number>();
  for (const r of records) if (r.reason === "change_field_unsupported" && r.field) inc(fields, r.field);
  if (fields.size > 0) parts.push(`unsupported_fields=${fmt(fields)}`);

  for (const [reason, label] of [
    ["message_missing_keys", "message_missing"],
    ["status_missing_keys", "status_missing"],
  ] as const) {
    const keys = new Map<string, number>();
    for (const r of records) if (r.reason === reason) for (const k of r.missingKeys ?? []) inc(keys, k);
    if (keys.size > 0) parts.push(`${label}=${fmt(keys)}`);
  }
  return parts.join("; ");
}

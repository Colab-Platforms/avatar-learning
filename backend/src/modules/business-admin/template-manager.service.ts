import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import { WhatsappApiError, type TemplateDefinition, type TemplateSubmission, type TemplateSubmitResult } from "@/modules/whatsapp/whatsapp.client.js";
import { DuplicateTemplateError, type TemplateRecord, type TemplateStore } from "./template-manager.store.js";
import { MEDIA_EXAMPLE_LIMITS, buildComponents, draftFromComponents, validateTemplate, type FieldError, type HeaderFormat, type TemplateInput } from "./template-manager.validation.js";

export type TemplateErrorCode = "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "NOT_EDITABLE" | "META_ERROR" | "NOT_CONFIGURED";

export class TemplateError extends ApiError {
  constructor(
    readonly code: TemplateErrorCode,
    message: string,
    statusCode: number,
    readonly errors?: FieldError[],
  ) {
    super(message, statusCode);
    Object.setPrototypeOf(this, TemplateError.prototype);
  }
}

/** What the manager needs from Meta. Injected so tests never touch the network. */
export interface MetaTemplates {
  list(): Promise<TemplateDefinition[]>;
  get(metaId: string): Promise<TemplateDefinition>;
  create(t: TemplateSubmission): Promise<TemplateSubmitResult>;
  edit(metaId: string, t: { category?: string; components: Array<Record<string, unknown>> }): Promise<void>;
  uploadExample?(file: { data: Uint8Array; mimeType: string; filename: string }): Promise<{ handle: string }>;
}

export interface TemplateManagerDeps {
  store: TemplateStore;
  meta: MetaTemplates;
  now?: () => Date;
  /** Called after anything that can change what Meta has approved (so the send path never uses a stale list). */
  onChanged?: () => void;
}

export interface TemplateDto {
  id: string;
  name: string;
  language: string;
  category: string;
  parameterFormat: "POSITIONAL" | "NAMED";
  status: string;
  /** Where `status` comes from: "local" (never sent to Meta) or "meta" (reported by Meta). */
  statusSource: "local" | "meta";
  metaTemplateId: string | null;
  draft: TemplateRecord["draft"];
  rejectedReason: string | null;
  lastError: string | null;
  submittedAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  /** True only for a template Meta has approved: the only kind an automation or message may use. */
  approved: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  canDelete: boolean;
}

/** Statuses from which Meta lets a template be edited (resubmitted). PENDING is under review; DISABLED/other cannot be edited. */
const META_EDITABLE = new Set(["REJECTED", "APPROVED", "PAUSED"]);

const safeMessage = (err: unknown): string => {
  if (err instanceof WhatsappApiError) return err.message.slice(0, 600);
  return "Meta could not be reached. Try again.";
};

export function toDto(r: TemplateRecord): TemplateDto {
  const isDraft = r.status === "DRAFT" && !r.metaTemplateId;
  return {
    id: r.id,
    name: r.name,
    language: r.language,
    category: r.category,
    parameterFormat: r.parameterFormat,
    status: r.status,
    statusSource: isDraft ? "local" : "meta",
    metaTemplateId: r.metaTemplateId,
    draft: r.draft,
    rejectedReason: r.rejectedReason,
    lastError: r.lastError,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    lastSyncedAt: r.lastSyncedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
    approved: r.status === "APPROVED",
    canEdit: isDraft || META_EDITABLE.has(r.status),
    canSubmit: isDraft,
    canDelete: isDraft,
  };
}

export class TemplateManagerService {
  private readonly now: () => Date;
  private readonly submitting = new Set<string>();
  constructor(private readonly deps: TemplateManagerDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  private invalid(errors: FieldError[]): never {
    throw new TemplateError("VALIDATION", errors[0]?.message ?? "The template is not valid.", STATUS_CODES.BAD_REQUEST, errors);
  }
  private validated(raw: unknown): TemplateInput {
    const v = validateTemplate(raw);
    if (!v.ok) this.invalid(v.errors);
    return v.value;
  }
  private async need(id: string): Promise<TemplateRecord> {
    const r = await this.deps.store.get(id);
    if (!r) throw new TemplateError("NOT_FOUND", "Template not found.", STATUS_CODES.NOT_FOUND);
    return r;
  }
  private metaFailure(err: unknown, what: string): TemplateError {
    const unconfigured = err instanceof WhatsappApiError && !err.httpStatus && /not configured|disabled/i.test(err.message);
    logger.warn(`[Templates] ${what} failed${err instanceof WhatsappApiError && err.metaCode ? ` (code ${err.metaCode})` : ""}`);
    return new TemplateError(unconfigured ? "NOT_CONFIGURED" : "META_ERROR", safeMessage(err), unconfigured ? STATUS_CODES.SERVICE_UNAVAILABLE : STATUS_CODES.UNPROCESSIBLE_ENTITY);
  }

  async list(): Promise<TemplateDto[]> {
    return (await this.deps.store.list()).map(toDto);
  }

  async get(id: string): Promise<TemplateDto> {
    return toDto(await this.need(id));
  }

  /** Saves a LOCAL draft. Nothing is sent to Meta and the status is DRAFT: this never implies approval. */
  async create(raw: unknown, userId: string): Promise<TemplateDto> {
    const v = this.validated(raw);
    try {
      return toDto(await this.deps.store.create({ ...v, status: "DRAFT", createdByUserId: userId }));
    } catch (err) {
      if (err instanceof DuplicateTemplateError) throw new TemplateError("CONFLICT", "A template with this name and language already exists.", STATUS_CODES.CONFLICT, [{ field: "name", message: "This name is already used for that language." }]);
      throw err;
    }
  }

  /**
   * Edits a template. A local draft is simply updated. A template Meta already has (REJECTED, APPROVED or PAUSED) is edited
   * on Meta first and the local copy only changes once Meta accepted the edit; its new status is then read back from Meta.
   */
  async update(id: string, raw: unknown): Promise<TemplateDto> {
    const rec = await this.need(id);
    const dto = toDto(rec);
    if (!dto.canEdit) {
      throw new TemplateError("NOT_EDITABLE", rec.status === "PENDING" ? "This template is under review by Meta. Wait for the result before editing it." : `A template with status ${rec.status} cannot be edited.`, STATUS_CODES.CONFLICT);
    }
    const v = this.validated({ ...(raw as object), name: rec.name, language: rec.language });
    const isDraft = dto.statusSource === "local";
    if (isDraft) {
      // A draft may still change name/language (it was never sent anywhere).
      const wanted = this.validated(raw);
      try {
        return toDto(await this.deps.store.update(id, { name: wanted.name, language: wanted.language, category: wanted.category, parameterFormat: wanted.parameterFormat, draft: wanted.draft, lastError: null }));
      } catch (err) {
        if (err instanceof DuplicateTemplateError) throw new TemplateError("CONFLICT", "A template with this name and language already exists.", STATUS_CODES.CONFLICT, [{ field: "name", message: "This name is already used for that language." }]);
        throw err;
      }
    }

    if (!rec.metaTemplateId) throw new TemplateError("NOT_EDITABLE", "This template has no Meta id yet. Sync from Meta first.", STATUS_CODES.CONFLICT);
    if (v.parameterFormat !== rec.parameterFormat) throw new TemplateError("NOT_EDITABLE", "The variable style (numbered or named) cannot be changed after submission.", STATUS_CODES.CONFLICT);
    if (rec.status === "APPROVED" && v.category !== rec.category) throw new TemplateError("NOT_EDITABLE", "The category of an approved template cannot be changed.", STATUS_CODES.CONFLICT);
    try {
      await this.deps.meta.edit(rec.metaTemplateId, { ...(v.category !== rec.category ? { category: v.category } : {}), components: buildComponents(v) });
    } catch (err) {
      const failure = this.metaFailure(err, "Template edit");
      await this.deps.store.update(id, { lastError: failure.message }).catch(() => undefined);
      throw failure;
    }
    // Meta accepted the edit. Its own answer decides the new status; if it cannot be read now, leave the status for the next sync.
    let patch: Parameters<TemplateStore["update"]>[1] = { draft: v.draft, category: v.category, lastError: null, submittedAt: this.now() };
    try {
      const fresh = await this.deps.meta.get(rec.metaTemplateId);
      patch = { ...patch, status: fresh.status || rec.status, category: fresh.category || v.category, rejectedReason: fresh.rejectedReason ?? null, lastSyncedAt: this.now() };
    } catch {
      /* keep the previous status */
    }
    const saved = await this.deps.store.update(id, patch);
    this.deps.onChanged?.();
    return toDto(saved);
  }

  /** Submits a local draft to Meta for review. The stored status is whatever Meta replies, never assumed. */
  async submit(id: string): Promise<TemplateDto> {
    const rec = await this.need(id);
    if (rec.status !== "DRAFT" || rec.metaTemplateId) throw new TemplateError("CONFLICT", "This template was already submitted to Meta.", STATUS_CODES.CONFLICT);
    if (this.submitting.has(id)) throw new TemplateError("CONFLICT", "This template is already being submitted.", STATUS_CODES.CONFLICT);
    const v = this.validated(rec);
    this.submitting.add(id);
    try {
      let result: TemplateSubmitResult;
      try {
        result = await this.deps.meta.create({ name: v.name, language: v.language, category: v.category, parameterFormat: v.parameterFormat, components: buildComponents(v) });
      } catch (err) {
        const failure = this.metaFailure(err, "Template submit");
        await this.deps.store.update(id, { lastError: failure.message }).catch(() => undefined);
        throw failure;
      }
      let status = result.status;
      let rejectedReason: string | null = null;
      if (!status) {
        // Meta created it but did not say in what state: read it back instead of guessing.
        try {
          const fresh = await this.deps.meta.get(result.id);
          status = fresh.status;
          rejectedReason = fresh.rejectedReason ?? null;
        } catch {
          /* leave unknown */
        }
      }
      const saved = await this.deps.store.update(id, {
        status: status || "UNKNOWN",
        category: result.category || v.category,
        metaTemplateId: result.id,
        rejectedReason,
        lastError: null,
        submittedAt: this.now(),
        lastSyncedAt: this.now(),
      });
      this.deps.onChanged?.();
      return toDto(saved);
    } finally {
      this.submitting.delete(id);
    }
  }

  /** Removes a local draft. Templates Meta knows about are never deleted from here. */
  async remove(id: string): Promise<void> {
    const rec = await this.need(id);
    if (!toDto(rec).canDelete) throw new TemplateError("NOT_EDITABLE", "Only drafts that were never submitted can be deleted here.", STATUS_CODES.CONFLICT);
    await this.deps.store.delete(id);
  }

  /** Pulls every template from Meta (all pages) and mirrors Meta's status, reason and content locally. Local drafts are untouched. */
  async sync(): Promise<{ total: number; created: number; updated: number; byStatus: Record<string, number>; localOnlyMissingOnMeta: number }> {
    let remote: TemplateDefinition[];
    try {
      remote = await this.deps.meta.list();
    } catch (err) {
      throw this.metaFailure(err, "Template sync");
    }
    const now = this.now();
    let created = 0;
    let updated = 0;
    const byStatus: Record<string, number> = {};
    const seen = new Set<string>();
    for (const t of remote) {
      if (!t.name || !t.language) continue;
      seen.add(`${t.name}\u0000${t.language}`);
      byStatus[t.status || "UNKNOWN"] = (byStatus[t.status || "UNKNOWN"] ?? 0) + 1;
      const format = t.parameterFormat === "NAMED" ? "NAMED" : "POSITIONAL";
      const fields = {
        category: t.category,
        parameterFormat: format as "POSITIONAL" | "NAMED",
        status: t.status || "UNKNOWN",
        metaTemplateId: t.id ?? null,
        rejectedReason: t.rejectedReason ?? null,
        draft: draftFromComponents(t.components, t.category, format),
        lastError: null,
        lastSyncedAt: now,
      };
      const existing = await this.deps.store.findByNameLanguage(t.name, t.language);
      if (existing) {
        await this.deps.store.update(existing.id, { ...fields, submittedAt: existing.submittedAt ?? now });
        updated++;
      } else {
        await this.deps.store.create({ name: t.name, language: t.language, ...fields, submittedAt: now });
        created++;
      }
    }
    const all = await this.deps.store.list();
    const localOnlyMissingOnMeta = all.filter((r) => r.metaTemplateId && !seen.has(`${r.name}\u0000${r.language}`)).length;
    this.deps.onChanged?.();
    return { total: remote.length, created, updated, byStatus, localOnlyMissingOnMeta };
  }

  /** Uploads a sample file for an image/video/document header and returns Meta's handle. */
  async uploadExample(format: HeaderFormat, file: { data: Uint8Array; mimeType: string; filename: string }): Promise<{ handle: string }> {
    if (format === "TEXT") throw new TemplateError("VALIDATION", "Text headers have no sample file.", STATUS_CODES.BAD_REQUEST);
    const rule = MEDIA_EXAMPLE_LIMITS[format];
    if (!rule.mimes.includes(file.mimeType)) throw new TemplateError("VALIDATION", `A ${format.toLowerCase()} header sample must be a ${rule.label}.`, STATUS_CODES.BAD_REQUEST);
    if (file.data.byteLength === 0 || file.data.byteLength > rule.maxBytes) throw new TemplateError("VALIDATION", `A ${format.toLowerCase()} header sample must be a ${rule.label}.`, STATUS_CODES.BAD_REQUEST);
    if (!this.deps.meta.uploadExample) throw new TemplateError("NOT_CONFIGURED", "Uploading sample media is not available on this server.", STATUS_CODES.SERVICE_UNAVAILABLE);
    try {
      return await this.deps.meta.uploadExample(file);
    } catch (err) {
      throw this.metaFailure(err, "Sample media upload");
    }
  }
}

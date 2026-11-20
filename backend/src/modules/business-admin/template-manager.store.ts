import { randomBytes } from "node:crypto";
import type { ParameterFormat, TemplateDraft } from "./template-manager.validation.js";

export interface TemplateRecord {
  id: string;
  name: string;
  language: string;
  category: string;
  parameterFormat: ParameterFormat;
  /** "DRAFT" = local only. Everything else is a status Meta reported. */
  status: string;
  metaTemplateId: string | null;
  draft: TemplateDraft;
  rejectedReason: string | null;
  lastError: string | null;
  submittedAt: Date | null;
  lastSyncedAt: Date | null;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export type NewTemplate = Pick<TemplateRecord, "name" | "language" | "category" | "parameterFormat" | "draft"> &
  Partial<Pick<TemplateRecord, "status" | "metaTemplateId" | "rejectedReason" | "lastSyncedAt" | "submittedAt" | "createdByUserId">>;
export type TemplatePatch = Partial<Omit<TemplateRecord, "id" | "createdAt" | "updatedAt">>;

export class DuplicateTemplateError extends Error {
  constructor() {
    super("duplicate template");
    this.name = "DuplicateTemplateError";
  }
}

export interface TemplateStore {
  list(): Promise<TemplateRecord[]>;
  get(id: string): Promise<TemplateRecord | null>;
  findByNameLanguage(name: string, language: string): Promise<TemplateRecord | null>;
  /** Throws DuplicateTemplateError when (name, language) already exists. */
  create(data: NewTemplate): Promise<TemplateRecord>;
  update(id: string, patch: TemplatePatch): Promise<TemplateRecord>;
  delete(id: string): Promise<void>;
}

/** The slice of the Prisma client this store needs (injectable). */
export interface TemplateDb {
  whatsappTemplate: {
    findMany(args?: any): Promise<any[]>;
    findUnique(args: any): Promise<any | null>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
    delete(args: any): Promise<any>;
  };
}

const fromRow = (r: any): TemplateRecord => ({
  id: r.id,
  name: r.name,
  language: r.language,
  category: r.category,
  parameterFormat: r.parameterFormat === "NAMED" ? "NAMED" : "POSITIONAL",
  status: r.status,
  metaTemplateId: r.metaTemplateId ?? null,
  draft: r.draft as TemplateDraft,
  rejectedReason: r.rejectedReason ?? null,
  lastError: r.lastError ?? null,
  submittedAt: r.submittedAt ?? null,
  lastSyncedAt: r.lastSyncedAt ?? null,
  createdByUserId: r.createdByUserId ?? null,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt ?? null,
});

export class PrismaTemplateStore implements TemplateStore {
  constructor(private readonly db: TemplateDb) {}
  async list() {
    return (await this.db.whatsappTemplate.findMany({ orderBy: [{ name: "asc" }, { language: "asc" }], take: 2000 })).map(fromRow);
  }
  async get(id: string) {
    const r = await this.db.whatsappTemplate.findUnique({ where: { id } });
    return r ? fromRow(r) : null;
  }
  async findByNameLanguage(name: string, language: string) {
    const r = await this.db.whatsappTemplate.findUnique({ where: { name_language: { name, language } } });
    return r ? fromRow(r) : null;
  }
  async create(data: NewTemplate) {
    try {
      return fromRow(await this.db.whatsappTemplate.create({ data: { status: "DRAFT", ...data, draft: data.draft as unknown as object } }));
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") throw new DuplicateTemplateError();
      throw err;
    }
  }
  async update(id: string, patch: TemplatePatch) {
    const { draft, ...rest } = patch;
    return fromRow(await this.db.whatsappTemplate.update({ where: { id }, data: { ...rest, ...(draft ? { draft: draft as unknown as object } : {}) } }));
  }
  async delete(id: string) {
    await this.db.whatsappTemplate.delete({ where: { id } });
  }
}

/** In-memory store for tests and the dev-only sandbox (never touches a database). */
export class MemoryTemplateStore implements TemplateStore {
  rows: TemplateRecord[] = [];
  clock = () => new Date();
  async list() {
    return [...this.rows].sort((a, b) => a.name.localeCompare(b.name) || a.language.localeCompare(b.language)).map((r) => structuredClone(r));
  }
  async get(id: string) {
    const r = this.rows.find((x) => x.id === id);
    return r ? structuredClone(r) : null;
  }
  async findByNameLanguage(name: string, language: string) {
    const r = this.rows.find((x) => x.name === name && x.language === language);
    return r ? structuredClone(r) : null;
  }
  async create(data: NewTemplate) {
    if (this.rows.some((x) => x.name === data.name && x.language === data.language)) throw new DuplicateTemplateError();
    const row: TemplateRecord = {
      id: `t${randomBytes(10).toString("hex")}`,
      status: "DRAFT",
      metaTemplateId: null,
      rejectedReason: null,
      lastError: null,
      submittedAt: null,
      lastSyncedAt: null,
      createdByUserId: null,
      createdAt: this.clock(),
      updatedAt: null,
      ...structuredClone(data),
    };
    this.rows.push(row);
    return structuredClone(row);
  }
  async update(id: string, patch: TemplatePatch) {
    const r = this.rows.find((x) => x.id === id);
    if (!r) throw new Error("not found");
    Object.assign(r, structuredClone(patch), { updatedAt: this.clock() });
    return structuredClone(r);
  }
  async delete(id: string) {
    this.rows = this.rows.filter((x) => x.id !== id);
  }
}

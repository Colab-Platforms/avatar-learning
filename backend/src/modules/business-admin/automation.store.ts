import { randomBytes } from "node:crypto";

export type VariableSource = { source: "field"; key: string; fallback?: string } | { source: "static"; value: string };
export type VariableMapping = Record<string, VariableSource>;

export interface RuleRecord {
  id: string;
  name: string;
  triggerEvent: string;
  templateName: string;
  templateLanguage: string;
  variableMapping: VariableMapping;
  isActive: boolean;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}
export type NewRule = Pick<RuleRecord, "name" | "triggerEvent" | "templateName" | "templateLanguage" | "variableMapping"> & Partial<Pick<RuleRecord, "isActive" | "createdByUserId" | "updatedByUserId">>;

export type ExecStatus = "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "SKIPPED";
export interface HistoryEntry {
  at: string;
  event: string;
  detail?: string;
}
export interface ExecutionRecord {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  eventId: string;
  idempotencyKey: string;
  contactWaId: string;
  templateName: string;
  templateLanguage: string;
  params: string[];
  status: ExecStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date | null;
  lockedAt: Date | null;
  expiresAt: Date;
  messageId: string | null;
  waMessageId: string | null;
  skipReason: string | null;
  lastErrorCode: number | null;
  lastError: string | null;
  history: HistoryEntry[];
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}
export type NewExecution = Pick<ExecutionRecord, "ruleId" | "ruleName" | "triggerEvent" | "eventId" | "idempotencyKey" | "contactWaId" | "templateName" | "templateLanguage" | "params" | "expiresAt"> &
  Partial<Pick<ExecutionRecord, "status" | "nextAttemptAt" | "skipReason" | "history" | "maxAttempts">>;
export type ExecutionPatch = Partial<Omit<ExecutionRecord, "id" | "createdAt" | "updatedAt" | "idempotencyKey">>;

export interface ExecutionFilter {
  status?: ExecStatus;
  ruleId?: string;
  page: number;
  pageSize: number;
}

export interface AutomationStore {
  listRules(): Promise<RuleRecord[]>;
  getRule(id: string): Promise<RuleRecord | null>;
  activeRulesFor(triggerEvent: string): Promise<RuleRecord[]>;
  createRule(data: NewRule): Promise<RuleRecord>;
  updateRule(id: string, patch: Partial<NewRule>): Promise<RuleRecord>;
  deleteRule(id: string): Promise<void>;

  /** Atomic on idempotencyKey: a repeat returns the existing row with created=false. */
  createExecution(data: NewExecution): Promise<{ execution: ExecutionRecord; created: boolean }>;
  getExecution(id: string): Promise<ExecutionRecord | null>;
  listExecutions(f: ExecutionFilter): Promise<{ items: ExecutionRecord[]; total: number }>;
  /** QUEUED rows whose nextAttemptAt has passed, oldest first. */
  dueExecutions(now: Date, limit: number): Promise<ExecutionRecord[]>;
  /** SENDING rows locked before `before` (a worker died mid-send). */
  staleSending(before: Date, limit: number): Promise<ExecutionRecord[]>;
  /** Moves QUEUED -> SENDING for exactly one caller. Returns null if someone else got it. */
  claim(id: string, now: Date): Promise<ExecutionRecord | null>;
  updateExecution(id: string, patch: ExecutionPatch): Promise<ExecutionRecord>;
  /** Executions that were handed to WhatsApp and whose delivery state may still change. */
  inFlight(limit: number): Promise<ExecutionRecord[]>;
  countsByStatus(): Promise<Record<string, number>>;
}

export interface AutomationDb {
  automationRule: { findMany(a?: any): Promise<any[]>; findUnique(a: any): Promise<any | null>; create(a: any): Promise<any>; update(a: any): Promise<any>; delete(a: any): Promise<any> };
  automationExecution: {
    findMany(a?: any): Promise<any[]>;
    findUnique(a: any): Promise<any | null>;
    create(a: any): Promise<any>;
    update(a: any): Promise<any>;
    updateMany(a: any): Promise<{ count: number }>;
    count(a?: any): Promise<number>;
    groupBy(a: any): Promise<any[]>;
  };
}

const ruleFrom = (r: any): RuleRecord => ({ ...r, variableMapping: (r.variableMapping ?? {}) as VariableMapping, createdByUserId: r.createdByUserId ?? null, updatedByUserId: r.updatedByUserId ?? null, updatedAt: r.updatedAt ?? null });
const execFrom = (r: any): ExecutionRecord => ({
  ...r,
  params: Array.isArray(r.params) ? r.params.map(String) : [],
  history: Array.isArray(r.history) ? r.history : [],
  nextAttemptAt: r.nextAttemptAt ?? null,
  lockedAt: r.lockedAt ?? null,
  messageId: r.messageId ?? null,
  waMessageId: r.waMessageId ?? null,
  skipReason: r.skipReason ?? null,
  lastErrorCode: r.lastErrorCode ?? null,
  lastError: r.lastError ?? null,
  sentAt: r.sentAt ?? null,
  updatedAt: r.updatedAt ?? null,
});

export class PrismaAutomationStore implements AutomationStore {
  constructor(private readonly db: AutomationDb) {}
  async listRules() {
    return (await this.db.automationRule.findMany({ orderBy: { createdAt: "desc" }, take: 500 })).map(ruleFrom);
  }
  async getRule(id: string) {
    const r = await this.db.automationRule.findUnique({ where: { id } });
    return r ? ruleFrom(r) : null;
  }
  async activeRulesFor(triggerEvent: string) {
    return (await this.db.automationRule.findMany({ where: { triggerEvent, isActive: true }, take: 100 })).map(ruleFrom);
  }
  async createRule(data: NewRule) {
    return ruleFrom(await this.db.automationRule.create({ data: { ...data, variableMapping: data.variableMapping as object } }));
  }
  async updateRule(id: string, patch: Partial<NewRule>) {
    const { variableMapping, ...rest } = patch;
    return ruleFrom(await this.db.automationRule.update({ where: { id }, data: { ...rest, ...(variableMapping ? { variableMapping: variableMapping as object } : {}) } }));
  }
  async deleteRule(id: string) {
    await this.db.automationRule.delete({ where: { id } });
  }
  async createExecution(data: NewExecution) {
    try {
      const row = await this.db.automationExecution.create({ data: { ...data, params: data.params as unknown as object, history: (data.history ?? []) as unknown as object } });
      return { execution: execFrom(row), created: true };
    } catch (err) {
      if ((err as { code?: string }).code !== "P2002") throw err;
      const existing = await this.db.automationExecution.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
      if (!existing) throw err;
      return { execution: execFrom(existing), created: false };
    }
  }
  async getExecution(id: string) {
    const r = await this.db.automationExecution.findUnique({ where: { id } });
    return r ? execFrom(r) : null;
  }
  async listExecutions(f: ExecutionFilter) {
    const where = { ...(f.status ? { status: f.status } : {}), ...(f.ruleId ? { ruleId: f.ruleId } : {}) };
    const [rows, total] = await Promise.all([
      this.db.automationExecution.findMany({ where, orderBy: { createdAt: "desc" }, skip: (f.page - 1) * f.pageSize, take: f.pageSize }),
      this.db.automationExecution.count({ where }),
    ]);
    return { items: rows.map(execFrom), total };
  }
  async dueExecutions(now: Date, limit: number) {
    return (await this.db.automationExecution.findMany({ where: { status: "QUEUED", nextAttemptAt: { lte: now } }, orderBy: { nextAttemptAt: "asc" }, take: limit })).map(execFrom);
  }
  async staleSending(before: Date, limit: number) {
    return (await this.db.automationExecution.findMany({ where: { status: "SENDING", lockedAt: { lt: before } }, take: limit })).map(execFrom);
  }
  async claim(id: string, now: Date) {
    const r = await this.db.automationExecution.updateMany({ where: { id, status: "QUEUED" }, data: { status: "SENDING", lockedAt: now } });
    return r.count === 1 ? this.getExecution(id) : null;
  }
  async updateExecution(id: string, patch: ExecutionPatch) {
    const { params, history, ...rest } = patch;
    return execFrom(await this.db.automationExecution.update({ where: { id }, data: { ...rest, ...(params ? { params: params as unknown as object } : {}), ...(history ? { history: history as unknown as object } : {}) } }));
  }
  async inFlight(limit: number) {
    return (await this.db.automationExecution.findMany({ where: { status: { in: ["SENT", "DELIVERED"] }, messageId: { not: null } }, orderBy: { updatedAt: "asc" }, take: limit })).map(execFrom);
  }
  async countsByStatus() {
    const rows = await this.db.automationExecution.groupBy({ by: ["status"], _count: { _all: true } });
    return Object.fromEntries(rows.map((r: any) => [r.status, r._count._all]));
  }
}

const id = (p: string) => `${p}${randomBytes(10).toString("hex")}`;

/** In-memory store for tests and the dev sandbox. */
export class MemoryAutomationStore implements AutomationStore {
  rules: RuleRecord[] = [];
  execs: ExecutionRecord[] = [];
  clock = () => new Date();
  async listRules() {
    return [...this.rules].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((r) => structuredClone(r));
  }
  async getRule(i: string) {
    const r = this.rules.find((x) => x.id === i);
    return r ? structuredClone(r) : null;
  }
  async activeRulesFor(ev: string) {
    return this.rules.filter((r) => r.triggerEvent === ev && r.isActive).map((r) => structuredClone(r));
  }
  async createRule(d: NewRule) {
    const r: RuleRecord = { id: id("r"), isActive: false, createdByUserId: null, updatedByUserId: null, createdAt: this.clock(), updatedAt: null, ...structuredClone(d) };
    this.rules.push(r);
    return structuredClone(r);
  }
  async updateRule(i: string, patch: Partial<NewRule>) {
    const r = this.rules.find((x) => x.id === i);
    if (!r) throw new Error("not found");
    Object.assign(r, structuredClone(patch), { updatedAt: this.clock() });
    return structuredClone(r);
  }
  async deleteRule(i: string) {
    this.rules = this.rules.filter((r) => r.id !== i);
  }
  async createExecution(d: NewExecution) {
    const existing = this.execs.find((e) => e.idempotencyKey === d.idempotencyKey);
    if (existing) return { execution: structuredClone(existing), created: false };
    const e: ExecutionRecord = {
      id: id("e"), status: "QUEUED", attempts: 0, maxAttempts: 4, nextAttemptAt: this.clock(), lockedAt: null, messageId: null, waMessageId: null, skipReason: null,
      lastErrorCode: null, lastError: null, history: [], sentAt: null, createdAt: this.clock(), updatedAt: null, ...structuredClone(d),
    };
    this.execs.push(e);
    return { execution: structuredClone(e), created: true };
  }
  async getExecution(i: string) {
    const e = this.execs.find((x) => x.id === i);
    return e ? structuredClone(e) : null;
  }
  async listExecutions(f: ExecutionFilter) {
    const all = this.execs.filter((e) => (!f.status || e.status === f.status) && (!f.ruleId || e.ruleId === f.ruleId)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: all.slice((f.page - 1) * f.pageSize, f.page * f.pageSize).map((e) => structuredClone(e)), total: all.length };
  }
  async dueExecutions(now: Date, limit: number) {
    return this.execs.filter((e) => e.status === "QUEUED" && e.nextAttemptAt && e.nextAttemptAt <= now).sort((a, b) => a.nextAttemptAt!.getTime() - b.nextAttemptAt!.getTime()).slice(0, limit).map((e) => structuredClone(e));
  }
  async staleSending(before: Date, limit: number) {
    return this.execs.filter((e) => e.status === "SENDING" && e.lockedAt && e.lockedAt < before).slice(0, limit).map((e) => structuredClone(e));
  }
  async claim(i: string, now: Date) {
    const e = this.execs.find((x) => x.id === i);
    if (!e || e.status !== "QUEUED") return null;
    e.status = "SENDING";
    e.lockedAt = now;
    return structuredClone(e);
  }
  async updateExecution(i: string, patch: ExecutionPatch) {
    const e = this.execs.find((x) => x.id === i);
    if (!e) throw new Error("not found");
    Object.assign(e, structuredClone(patch), { updatedAt: this.clock() });
    return structuredClone(e);
  }
  async inFlight(limit: number) {
    return this.execs.filter((e) => (e.status === "SENT" || e.status === "DELIVERED") && e.messageId).slice(0, limit).map((e) => structuredClone(e));
  }
  async countsByStatus() {
    const out: Record<string, number> = {};
    for (const e of this.execs) out[e.status] = (out[e.status] ?? 0) + 1;
    return out;
  }
}

import type { BusinessAdminStore, WhatsappOverview } from "./business-admin.types.js";

/** The small slice of the Prisma client this module uses (lets tests pass a fake). */
export interface BusinessDb {
  whatsappMessage: {
    count(args?: any): Promise<number>;
    findFirst(args?: any): Promise<any | null>;
    findMany(args?: any): Promise<any[]>;
    groupBy(args: any): Promise<any[]>;
  };
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export class PrismaBusinessAdminStore implements BusinessAdminStore {
  constructor(private readonly db: BusinessDb) {}

  async overview(now: Date = new Date()): Promise<WhatsappOverview> {
    const m = this.db.whatsappMessage;
    const since = (ms: number) => new Date(now.getTime() - ms);
    const [totalInbound, totalOutbound, inboundLast24h, inboundLast7d, last, contacts] = await Promise.all([
      m.count({ where: { direction: "INBOUND" } }),
      m.count({ where: { direction: "OUTBOUND" } }),
      m.count({ where: { direction: "INBOUND", createdAt: { gte: since(24 * 3600 * 1000) } } }),
      m.count({ where: { direction: "INBOUND", createdAt: { gte: since(7 * 24 * 3600 * 1000) } } }),
      m.findFirst({ where: { direction: "INBOUND" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      m.groupBy({ by: ["contactWaId"] }),
    ]);
    return {
      totalInbound,
      totalOutbound,
      inboundLast24h,
      inboundLast7d,
      lastInboundAt: iso(last?.createdAt),
      contacts: contacts.length,
    };
  }
}

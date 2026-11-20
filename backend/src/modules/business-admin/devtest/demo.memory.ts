import { randomBytes } from "node:crypto";

type Row = Record<string, any>;

/** In-memory stand-in for the `demoBooking` table (dev sandbox and tests). Enforces the unique request key like Postgres. */
export class MemoryDemoBookings {
  rows: Row[] = [];
  /** Tests set this to make the next create() fail (e.g. a database outage). */
  failNextCreate: Error | null = null;

  async findUnique({ where }: { where: { requestKey?: string; id?: string } }): Promise<Row | null> {
    const r = this.rows.find((x) => (where.requestKey !== undefined ? x.requestKey === where.requestKey : x.id === where.id));
    return r ? { ...r } : null;
  }

  async create({ data }: { data: Row }): Promise<Row> {
    if (this.failNextCreate) {
      const e = this.failNextCreate;
      this.failNextCreate = null;
      throw e;
    }
    if (this.rows.some((x) => x.requestKey === data.requestKey)) throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    const row = { id: `c${randomBytes(12).toString("hex")}`, status: "REQUESTED", createdAt: new Date(), ...data };
    this.rows.push(row);
    return { ...row };
  }
}

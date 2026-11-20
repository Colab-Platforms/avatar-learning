import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrismaWhatsappStore, type WhatsappPrismaClient } from "../../src/modules/whatsapp/whatsapp.store.js";
import type { InboundMessageEvent, StatusEvent } from "../../src/modules/whatsapp/whatsapp.types.js";

/** Tiny fake of the Prisma delegate: enforces the unique wa_message_id like Postgres would. */
function fakeDb() {
  const rows: any[] = [];
  let seq = 0;
  const log: string[] = [];
  const uniqueViolation = () => Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
  const db: WhatsappPrismaClient = {
    whatsappMessage: {
      async findUnique({ where }) {
        log.push("findUnique");
        return rows.find((r) => r.waMessageId === where.waMessageId) ?? null;
      },
      async create({ data }) {
        log.push("create");
        if (rows.some((r) => r.waMessageId === data.waMessageId)) throw uniqueViolation();
        const row = { id: `row${++seq}`, ...data };
        rows.push(row);
        return row;
      },
      async update({ where, data }) {
        log.push("update");
        Object.assign(rows.find((r) => r.id === where.id), data);
        return null;
      },
    },
  };
  return { db, rows, log };
}

const inbound = (over: Partial<InboundMessageEvent> = {}): InboundMessageEvent => ({
  waMessageId: "wamid.S1",
  from: "919876543210",
  type: "text",
  textBody: "hello",
  raw: { id: "wamid.S1" },
  ...over,
});
const status = (s: string, over: Partial<StatusEvent> = {}): StatusEvent => ({
  waMessageId: "wamid.S2",
  status: s,
  recipientId: "919876543210",
  timestamp: new Date(1000 * 1000),
  ...over,
});

describe("PrismaWhatsappStore (fake Prisma client — no database)", () => {
  it("creates an INBOUND/RECEIVED row, then reports a replay as duplicate via the unique constraint", async () => {
    const { db, rows } = fakeDb();
    const store = new PrismaWhatsappStore(db);
    assert.equal(await store.saveInboundMessage(inbound()), "created");
    assert.equal(await store.saveInboundMessage(inbound()), "duplicate");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].direction, "INBOUND");
    assert.equal(rows[0].status, "RECEIVED");
    assert.equal(rows[0].contactWaId, "919876543210");
  });

  it("propagates unexpected database errors (so the webhook answers 500 and Meta retries)", async () => {
    const { db } = fakeDb();
    db.whatsappMessage.create = async () => {
      throw new Error("connection refused");
    };
    await assert.rejects(() => new PrismaWhatsappStore(db).saveInboundMessage(inbound()), /connection refused/);
  });

  it("creates an OUTBOUND row from the first status, updates it on later ones, ignores replays", async () => {
    const { db, rows } = fakeDb();
    const store = new PrismaWhatsappStore(db);
    assert.equal(await store.applyStatusEvent(status("sent")), "applied");
    assert.equal(rows[0].direction, "OUTBOUND");
    assert.equal(await store.applyStatusEvent(status("delivered")), "applied");
    assert.equal(rows[0].status, "DELIVERED");
    assert.equal(await store.applyStatusEvent(status("delivered")), "duplicate");
    assert.equal(await store.applyStatusEvent(status("sent")), "duplicate");
    assert.equal(rows.length, 1);
  });

  it("returns 'ignored' for an unsupported status on an unknown message and writes nothing", async () => {
    const { db, rows } = fakeDb();
    assert.equal(await new PrismaWhatsappStore(db).applyStatusEvent(status("deleted")), "ignored");
    assert.equal(rows.length, 0);
  });

  it("recovers when a concurrent delivery creates the row between our read and create", async () => {
    const { db, rows } = fakeDb();
    const realFind = db.whatsappMessage.findUnique;
    let first = true;
    db.whatsappMessage.findUnique = async (args) => {
      const found = await realFind(args);
      if (first) {
        first = false;
        // a parallel request wins the race right after our (empty) read
        rows.push({ id: "raced", waMessageId: "wamid.S2", status: "SENT", direction: "OUTBOUND", sentAt: new Date(1), deliveredAt: null, readAt: null, failedAt: null, errorCode: null, errorTitle: null, errorDetails: null });
        return null;
      }
      return found;
    };
    const result = await new PrismaWhatsappStore(db).applyStatusEvent(status("delivered"));
    assert.equal(result, "applied");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "DELIVERED");
  });
});

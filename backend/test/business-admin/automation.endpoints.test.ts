import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ENDPOINTS } from "../../src/modules/business-admin/automation.endpoints.js";
import { EVENTS } from "../../src/modules/business-admin/automation.events.js";
import { validateTemplate } from "../../src/modules/business-admin/template-manager.validation.js";
import { automationSwitchOn, emitAutomationEvent, setAutomationTrigger, toWaPhone } from "../../src/modules/business-admin/automation.emit.js";

const SRC = path.resolve(import.meta.dirname, "../../src");
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel.replace(/^backend\/src\//, "")), "utf8");
const mounts = read("routes.ts");
const ROUTE_FILE: Record<string, string> = { auth: "modules/auth/auth.route.ts", webinar: "modules/webinar/webinar.route.ts", payment: "modules/payment/payment.route.ts", courses: "modules/course/course.route.ts", contact: "modules/contact/contact.route.ts", demo: "modules/demo/demo.route.ts" };

describe("activity catalog", () => {
  it("has exactly the nine requested activities, each with endpoint info", () => {
    const keys = ["demo.requested", "user.registered", "demo.scheduled", "demo.rescheduled", "demo.cancelled", "contact.submitted", "webinar.registered", "payment.succeeded", "course.enrolled"];
    assert.deepEqual(EVENTS.map((e) => e.key), keys);
    assert.deepEqual(ENDPOINTS.map((e) => e.event), keys);
  });
  it("every suggested template is valid for Meta's rules and maps real event fields", () => {
    for (const e of EVENTS) {
      const s = e.suggested;
      const v = validateTemplate({ name: s.name, language: "en", category: s.category, parameterFormat: "POSITIONAL", draft: { body: { text: s.body }, examples: Object.fromEntries(s.examples.map((x, i) => [String(i + 1), x])), buttons: [] } });
      assert.ok(v.ok, `${e.key}: ${v.ok ? "" : v.errors.map((x) => x.message).join("; ")}`);
      assert.equal(s.mapping.length, s.examples.length);
      for (const k of s.mapping) assert.ok(e.fields.some((f) => f.key === k), `${e.key} maps unknown field ${k}`);
    }
  });
});

describe("endpoint-to-event mapping is real", () => {
  for (const ep of ENDPOINTS.filter((e) => e.status === "connected")) {
    it(`${ep.event}: ${ep.method} ${ep.route} exists and its success calls the automation hook`, () => {
      const m = /^\/api\/([^/]+)(\/.*)$/.exec(ep.route!)!;
      assert.match(mounts, new RegExp(`router\\.use\\("/${m[1]}",`), "mount prefix exists in routes.ts");
      const routeSrc = read(ROUTE_FILE[m[1]]);
      const sub = m[2].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      assert.match(routeSrc, new RegExp(`router\\.${ep.method!.toLowerCase()}\\("${sub}"`), `route ${ep.route} not found`);
      const src = read(ep.source!);
      assert.match(src, new RegExp(`event: "${ep.event.replace(".", "\\.")}"|"${ep.event.replace(".", "\\.")}"`), "source emits this event");
    });
  }
  it("activities without an endpoint really have none (only demo.requested has a route; contact form has no phone)", () => {
    const routeFiles: string[] = [];
    const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((f) => (f.isDirectory() ? walk(path.join(d, f.name)) : /\.route\.ts$/.test(f.name) && routeFiles.push(path.join(d, f.name))));
    walk(path.join(SRC, "modules"));
    // Exactly one public demo route exists (Book a demo -> demo.requested). Scheduling/rescheduling/cancelling have none.
    const demo = routeFiles.filter((f) => !f.includes("business-admin") && /demo/i.test(fs.readFileSync(f, "utf8"))).map((f) => path.basename(f));
    assert.deepEqual(demo, ["demo.route.ts"], "another demo route now exists: connect it in automation.endpoints.ts");
    assert.ok(ENDPOINTS.filter((e) => e.event.startsWith("demo.") && e.event !== "demo.requested").every((e) => e.status === "missing" && e.route === null && e.needs));
    const requested = ENDPOINTS.find((e) => e.event === "demo.requested")!;
    assert.deepEqual([requested.status, requested.method, requested.route], ["connected", "POST", "/api/demo/book"]);
    const contact = ENDPOINTS.find((e) => e.event === "contact.submitted")!;
    assert.equal(contact.status, "no_phone");
    assert.ok(!/phone/i.test(read("modules/contact/contact.validators.ts")), "contact form gained a phone field: connect it");
    assert.ok(!read("modules/contact/contact.controller.ts").includes("emitAutomationEvent"));
  });
});

describe("hooks fire only after the activity succeeded", () => {
  const after = (file: string, anchor: string, hook: string) => {
    const s = read(file);
    const a = s.indexOf(anchor);
    const h = s.indexOf(hook);
    assert.ok(a > 0 && h > 0, `${file}: anchor or hook missing`);
    assert.ok(h > a, `${file}: hook must come after "${anchor}"`);
    assert.equal(s.split(hook).length - 1, 1, `${file}: hook appears more than once`);
  };
  it("demo booking: only after the booking row is saved", () => after("modules/demo/demo.service.ts", "row = await this.db.demoBooking.create", 'event: "demo.requested"'));
  it("registration: only after the email is verified", () => after("modules/auth/auth.service.ts", "data: { isEmailVerified: true }", 'event: "user.registered"'));
  it("webinar: only after the registration was saved as PAID", () => after("modules/webinar/webinar.service.ts", 'status: "PAID"', 'event: "webinar.registered"'));
  it("course enrolment: only after the enrolment row is created", () => after("modules/course/course.service.ts", "const enrollment = await prisma.courseUserMapper.create", '"course.enrolled"'));
  it("payment: only after the payment transaction committed (not for failed or already-recorded payments)", () => {
    const s = read("modules/payment/payment.service.ts");
    const body = s.slice(s.indexOf("async function completePayment"));
    assert.ok(body.indexOf("emitPaymentAutomation(order") > body.indexOf("await prisma.$transaction"));
    // the early returns for an already-recorded payment come before the hook
    assert.ok(body.indexOf("emitPaymentAutomation(order") > body.indexOf("if (existingTx)"));
    assert.ok(body.indexOf("emitPaymentAutomation(order") > body.indexOf('if (order.status === "PAID")'));
  });
});

describe("emitAutomationEvent", () => {
  const saved = process.env.WHATSAPP_AUTOMATION_ENABLED;
  afterEach(() => {
    setAutomationTrigger(null);
    if (saved === undefined) delete process.env.WHATSAPP_AUTOMATION_ENABLED;
    else process.env.WHATSAPP_AUTOMATION_ENABLED = saved;
  });
  const flush = () => new Promise((r) => setTimeout(r, 10));

  it("does nothing while WHATSAPP_AUTOMATION_ENABLED is off (the default)", async () => {
    delete process.env.WHATSAPP_AUTOMATION_ENABLED;
    const calls: unknown[] = [];
    setAutomationTrigger(async (i) => void calls.push(i));
    emitAutomationEvent({ event: "user.registered", eventId: "u1", phone: "9876543210" });
    await flush();
    assert.deepEqual(calls, []);
    assert.equal(automationSwitchOn({ WHATSAPP_AUTOMATION_ENABLED: "yes" } as never), false);
  });
  it("when on, passes the event with the customer's phone (91 added to a 10-digit number)", async () => {
    process.env.WHATSAPP_AUTOMATION_ENABLED = "true";
    const calls: any[] = [];
    setAutomationTrigger(async (i) => void calls.push(i));
    emitAutomationEvent({ event: "webinar.registered", eventId: "r1", phone: "98765 43210", fields: { name: "Asha" } });
    emitAutomationEvent({ event: "webinar.registered", eventId: "r2", phone: null });
    await flush();
    assert.equal(calls.length, 1, "no phone = nothing to send");
    assert.deepEqual(calls[0], { event: "webinar.registered", eventId: "r1", phone: "919876543210", fields: { name: "Asha" } });
    assert.equal(toWaPhone("+91 98765-43210"), "919876543210");
    assert.equal(toWaPhone("09876543210"), "919876543210");
  });
  it("a failing engine never throws into the website action", async () => {
    process.env.WHATSAPP_AUTOMATION_ENABLED = "true";
    setAutomationTrigger(async () => {
      throw new Error("database down");
    });
    assert.doesNotThrow(() => emitAutomationEvent({ event: "user.registered", eventId: "u1", phone: "9876543210" }));
    await flush();
  });
});

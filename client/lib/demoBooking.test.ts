// Run with: npm run test:logic   (Node's built-in test runner; no browser, no network)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDemoPayload, confirmationLines, describeBookingError, formatPreferred, istInstant, todayInIst, validateDemoForm, type DemoFormValues } from "./demoBooking";

const NOW = new Date("2026-11-20T08:00:00Z"); // 13:30 IST
const form = (over: Partial<DemoFormValues> = {}): DemoFormValues => ({
  name: "  Asha Verma ",
  company: " Acme ",
  email: " asha@example.com ",
  phone: " 98765 43210 ",
  role: "Founder / Business Owner",
  companySize: "11–50 employees",
  preferredDate: "2026-11-25",
  preferredTime: "16:00",
  interestedTools: ["crm"],
  customRequirements: "should be dropped",
  message: "  ",
  whatsappConsent: false,
  ...over,
});

describe("demo form: dates and times (India time)", () => {
  it("today is the IST calendar day, even late in the UTC evening", () => {
    assert.equal(todayInIst(new Date("2026-11-20T08:00:00Z")), "2026-11-20");
    assert.equal(todayInIst(new Date("2026-11-20T20:00:00Z")), "2026-11-21", "01:30 IST next day");
  });
  it("converts an IST date and time to the right instant and rejects impossible ones", () => {
    assert.equal(istInstant("2026-11-25", "16:00")?.toISOString(), "2026-11-25T10:30:00.000Z");
    assert.equal(istInstant("2026-02-31", "10:00"), null);
    assert.equal(istInstant("2026-11-25", "24:00"), null);
    assert.equal(istInstant("", ""), null);
  });
  it("formats the preferred time the way a customer reads it", () => {
    assert.equal(formatPreferred("2026-11-25", "16:00"), "25 Nov 2026, 4:00 PM");
    assert.equal(formatPreferred("nope", "16:00"), "");
  });
});

describe("demo form: instant validation (the server repeats every check)", () => {
  it("passes a valid phone, date and time", () => {
    assert.deepEqual(validateDemoForm(form(), NOW), {});
  });
  it("requires a phone number and says why", () => {
    assert.match(validateDemoForm(form({ phone: "" }), NOW).phone ?? "", /phone number/);
    assert.match(validateDemoForm(form({ phone: "   " }), NOW).phone ?? "", /phone number/);
    assert.ok(validateDemoForm(form({ phone: "12345" }), NOW).phone);
    assert.ok(validateDemoForm(form({ phone: "1".repeat(16) }), NOW).phone);
  });
  it("requires a future date and time", () => {
    assert.ok(validateDemoForm(form({ preferredDate: "" }), NOW).preferredAt);
    assert.ok(validateDemoForm(form({ preferredTime: "" }), NOW).preferredAt);
    assert.match(validateDemoForm(form({ preferredDate: "2026-11-19" }), NOW).preferredAt ?? "", /future/);
    assert.match(validateDemoForm(form({ preferredDate: "2026-02-31" }), NOW).preferredAt ?? "", /not valid/);
    assert.match(validateDemoForm(form({ preferredDate: "2026-11-20", preferredTime: "13:00" }), NOW).preferredAt ?? "", /future/, "30 minutes ago");
    assert.deepEqual(validateDemoForm(form({ preferredDate: "2026-11-20", preferredTime: "18:00" }), NOW), {}, "later today is fine");
  });
});

describe("demo form: the request that is sent", () => {
  it("trims values, drops empties, and keeps custom requirements only when Custom Tools is chosen", () => {
    const p = buildDemoPayload(form());
    assert.equal(p.name, "Asha Verma");
    assert.equal(p.email, "asha@example.com");
    assert.equal(p.phone, "98765 43210");
    assert.equal(p.company, "Acme");
    assert.equal(p.message, undefined);
    assert.equal(p.customRequirements, undefined);
    assert.equal(buildDemoPayload(form({ interestedTools: ["crm", "custom"], customRequirements: " ERP " })).customRequirements, "ERP");
    assert.equal(p.preferredDate, "2026-11-25");
    assert.equal(p.preferredTime, "16:00");
  });
  it("WhatsApp consent is only ever an explicit true: unchecked is false, never assumed", () => {
    assert.equal(buildDemoPayload(form()).whatsappConsent, false);
    assert.equal(buildDemoPayload(form({ whatsappConsent: true })).whatsappConsent, true);
    assert.equal(buildDemoPayload(form({ whatsappConsent: "on" as unknown as boolean })).whatsappConsent, false);
  });
});

describe("demo form: what the customer is told", () => {
  it("a refused form shows the server's specific message; anything else is a plain, honest failure", () => {
    assert.equal(describeBookingError({ response: { status: 400, data: { message: "Please enter a valid email address." } } }), "Please enter a valid email address.");
    assert.match(describeBookingError({ response: { status: 429 } }), /Too many requests/);
    for (const e of [{ response: { status: 500, data: { message: "relation demo_bookings does not exist" } } }, new Error("Network Error"), undefined]) {
      const m = describeBookingError(e);
      assert.match(m, /could not save your request/);
      assert.doesNotMatch(m, /relation|demo_bookings|Network Error/, "no internal details");
    }
  });
  it("the confirmation speaks about the booking; WhatsApp is only 'we will try', and only if the customer asked", () => {
    const withWa = confirmationLines({ whatsappConsent: true, when: "25 Nov 2026, 4:00 PM" });
    assert.equal(withWa.title, "Your demo request is booked");
    assert.ok(withWa.lines.includes("Preferred time: 25 Nov 2026, 4:00 PM."));
    assert.ok(withWa.lines.some((l) => /try to confirm on WhatsApp/.test(l)));
    assert.ok(!withWa.lines.some((l) => /sent|delivered/i.test(l)), "never claims a WhatsApp message was sent");
    const without = confirmationLines({ whatsappConsent: false, when: "x" });
    assert.ok(!without.lines.some((l) => /WhatsApp/.test(l)), "no WhatsApp promise without consent");
    assert.equal(confirmationLines({ whatsappConsent: false, when: "x", duplicate: true }).title, "We already have your demo request");
  });
});

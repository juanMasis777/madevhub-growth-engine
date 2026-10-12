import { describe, it, expect } from "vitest";
import {
  buildContactMessage,
  buildAudit,
  buildOutreachMessages,
} from "./templates.js";

const LEAD = {
  name: "Ocean Drive Barbers",
  city: "Miami",
  category: "Barbershop",
  website: "No Website",
  websiteUrl: "",
  phone: "(305) 555-0142",
  email: "hello@oceandrivebarbers.example",
  instagram: "https://instagram.com/oceandrivebarbers",
  rating: 4.8,
  reviews: 312,
  opportunityScore: 95,
  address: "1120 Ocean Dr, Miami Beach, FL",
  followUpDate: "",
};

describe("buildContactMessage", () => {
  it("returns nothing without a lead", () => {
    expect(buildContactMessage(null, "email")).toBe("");
  });

  it("writes an email with a subject line and the lead's numbers", () => {
    const message = buildContactMessage(LEAD, "email");
    expect(message).toMatch(/^Subject: /);
    expect(message).toContain("Ocean Drive Barbers");
    expect(message).toContain("4.8 stars");
    expect(message).toContain("312 reviews");
    expect(message).toContain("No Website");
  });

  it("writes a shorter DM for instagram, with no subject line", () => {
    const message = buildContactMessage(LEAD, "instagram");
    expect(message).not.toMatch(/^Subject: /);
    expect(message).toContain("Ocean Drive Barbers");
    expect(message.length).toBeLessThan(
      buildContactMessage(LEAD, "email").length
    );
  });

  it("falls back to the call script for any other channel", () => {
    expect(buildContactMessage(LEAD, "call")).toContain("Call Script for");
    expect(buildContactMessage(LEAD, "whatever")).toContain("Call Script for");
  });
});

describe("buildAudit", () => {
  it("returns nothing without a lead", () => {
    expect(buildAudit(null)).toBe("");
  });

  it("reports the business details", () => {
    const audit = buildAudit(LEAD);
    expect(audit).toContain("Ocean Drive Barbers");
    expect(audit).toContain("Barbershop");
    expect(audit).toContain("1120 Ocean Dr, Miami Beach, FL");
    expect(audit).toContain("95%");
    expect(audit).toContain("Hot Lead");
  });

  it("names the missing website as the main problem", () => {
    expect(buildAudit(LEAD)).toContain("does not have a professional website");
    expect(buildAudit({ ...LEAD, website: "Old Website" })).toContain(
      "outdated website"
    );
    expect(buildAudit({ ...LEAD, website: "Facebook Only" })).toContain(
      "depends mostly on Facebook"
    );
  });

  it("picks the outreach channel from what was actually found", () => {
    expect(buildAudit(LEAD)).toContain("email outreach is possible");
    expect(buildAudit({ ...LEAD, email: "" })).toContain(
      "Instagram and phone outreach"
    );
    expect(buildAudit({ ...LEAD, email: "", instagram: "" })).toContain(
      "phone outreach may be the best option"
    );
  });

  it("says so when a field was not found instead of leaving a blank", () => {
    const audit = buildAudit({ ...LEAD, address: "", googleMapsUrl: "" });
    expect(audit).toContain("Address: Not found");
    expect(audit).toContain("Google Maps: Not found");
    expect(audit).toContain("Follow-up: Not scheduled");
  });
});

describe("buildOutreachMessages", () => {
  it("returns nothing without a lead", () => {
    expect(buildOutreachMessages(null)).toEqual({});
  });

  it("covers all five steps, each with a title and a body", () => {
    const messages = buildOutreachMessages(LEAD);
    expect(Object.keys(messages).sort()).toEqual([
      "call",
      "email",
      "followup1",
      "followup2",
      "instagram",
    ]);

    for (const [step, message] of Object.entries(messages)) {
      expect(message.title, step).toBeTruthy();
      expect(message.body, step).toContain("Ocean Drive Barbers");
    }
  });

  it("falls back gracefully when the lead has no rating or reviews", () => {
    const messages = buildOutreachMessages({
      ...LEAD,
      rating: 0,
      reviews: 0,
      city: "",
      category: "",
    });
    expect(messages.email.body).toContain("strong local presence");
    expect(messages.email.body).toContain("customer reviews");
    expect(messages.email.body).toContain("your area");
    expect(messages.email.body).not.toContain("undefined");
  });

  it("never leaves an undefined in any message", () => {
    for (const message of Object.values(buildOutreachMessages({ name: "X" }))) {
      expect(message.body).not.toContain("undefined");
    }
  });
});

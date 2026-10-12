import { describe, it, expect } from "vitest";
import {
  getLeadQuality,
  getOpportunityScoreFromWebsite,
  getDefaultContactMode,
  getActionLabel,
  convertLeadToForm,
  createSafeFileName,
  getTodayDateKey,
  isLeadStillOpen,
} from "./leads.js";

describe("getLeadQuality", () => {
  it("handles a missing lead without throwing", () => {
    const quality = getLeadQuality(null);
    expect(quality.score).toBe(0);
    expect(quality.level).toBe("low");
  });

  it("marks a reachable, high-opportunity business as hot", () => {
    const quality = getLeadQuality({
      opportunityScore: 95,
      email: "hi@shop.com",
      phone: "(305) 555-0100",
      instagram: "@shop",
      rating: 4.8,
      reviews: 300,
      website: "No Website",
    });
    expect(quality.level).toBe("hot");
    expect(quality.label).toBe("Hot Lead");
    expect(quality.score).toBeGreaterThanOrEqual(75);
  });

  it("marks an unreachable business as low priority", () => {
    const quality = getLeadQuality({
      opportunityScore: 40,
      rating: 3.1,
      reviews: 2,
      website: "Has Website",
    });
    expect(quality.level).toBe("low");
  });

  it("never goes above 100", () => {
    const quality = getLeadQuality({
      opportunityScore: 100,
      email: "hi@shop.com",
      phone: "(305) 555-0100",
      instagram: "@shop",
      googleMapsUrl: "https://maps.google.com/?cid=1",
      rating: 5,
      reviews: 5000,
      website: "No Website",
    });
    expect(quality.score).toBe(100);
  });

  it("rates a reachable lead above an identical unreachable one", () => {
    const base = {
      opportunityScore: 95,
      rating: 4.6,
      reviews: 120,
      website: "No Website",
    };
    const reachable = getLeadQuality({ ...base, email: "hi@shop.com" });
    const unreachable = getLeadQuality(base);
    expect(reachable.score).toBeGreaterThan(unreachable.score);
  });

  it("treats numeric strings like numbers", () => {
    const fromStrings = getLeadQuality({
      opportunityScore: "95",
      rating: "4.8",
      reviews: "300",
      website: "No Website",
    });
    const fromNumbers = getLeadQuality({
      opportunityScore: 95,
      rating: 4.8,
      reviews: 300,
      website: "No Website",
    });
    expect(fromStrings.score).toBe(fromNumbers.score);
  });
});

describe("getOpportunityScoreFromWebsite", () => {
  it("ranks a missing website as the biggest opportunity", () => {
    expect(getOpportunityScoreFromWebsite("No Website")).toBe(95);
    expect(getOpportunityScoreFromWebsite("Facebook Only")).toBe(90);
    expect(getOpportunityScoreFromWebsite("Old Website")).toBe(82);
    expect(getOpportunityScoreFromWebsite("Has Website")).toBe(70);
  });

  it("falls back for an unknown status", () => {
    expect(getOpportunityScoreFromWebsite("Anything else")).toBe(70);
  });
});

describe("getDefaultContactMode", () => {
  it("prefers email, then instagram, then a call", () => {
    expect(getDefaultContactMode({ email: "a@b.com", instagram: "@x" })).toBe(
      "email"
    );
    expect(getDefaultContactMode({ instagram: "@x" })).toBe("instagram");
    expect(getDefaultContactMode({})).toBe("call");
    expect(getDefaultContactMode(null)).toBe("call");
  });
});

describe("getActionLabel", () => {
  it("names the action for each channel", () => {
    expect(getActionLabel("email")).toBe("Send Email");
    expect(getActionLabel("instagram")).toBe("Copy Instagram DM");
    expect(getActionLabel("call")).toBe("Save Call Script");
  });
});

describe("convertLeadToForm", () => {
  it("turns numbers into strings the inputs can hold", () => {
    const form = convertLeadToForm({ name: "Shop", rating: 4.8, reviews: 212 });
    expect(form.rating).toBe("4.8");
    expect(form.reviews).toBe("212");
  });

  it("fills in defaults for a sparse lead", () => {
    const form = convertLeadToForm({});
    expect(form.name).toBe("");
    expect(form.city).toBe("Miami");
    expect(form.website).toBe("No Website");
    expect(form.rating).toBe("4.5");
  });

  it("keeps a zero instead of replacing it with the default", () => {
    expect(convertLeadToForm({ reviews: 0 }).reviews).toBe("0");
  });
});

describe("createSafeFileName", () => {
  it("slugifies a business name", () => {
    expect(createSafeFileName("Maria's Barber Shop")).toBe(
      "maria-s-barber-shop"
    );
    expect(createSafeFileName("  Ocean   Cuts  ")).toBe("ocean-cuts");
  });

  it("falls back when nothing survives", () => {
    expect(createSafeFileName("***")).toBe("business");
    expect(createSafeFileName("")).toBe("business");
  });
});

describe("getTodayDateKey", () => {
  it("returns a zero-padded YYYY-MM-DD key", () => {
    expect(getTodayDateKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("isLeadStillOpen", () => {
  it("counts everything that is not closed or lost", () => {
    expect(isLeadStillOpen({ status: "New" })).toBe(true);
    expect(isLeadStillOpen({ status: "Proposal Sent" })).toBe(true);
    expect(isLeadStillOpen({ status: "Closed" })).toBe(false);
    expect(isLeadStillOpen({ status: "Lost" })).toBe(false);
  });
});

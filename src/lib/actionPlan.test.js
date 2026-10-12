import { describe, it, expect } from "vitest";
import { buildTodayActionGroups } from "./actionPlan.js";
import { DEMO_LEADS } from "./demoLeads.js";
import { getTodayDateKey } from "./leads.js";

const TODAY = "2026-03-10";
const YESTERDAY = "2026-03-09";
const TOMORROW = "2026-03-11";

function groupById(groups, id) {
  return groups.find((group) => group.id === id);
}

describe("buildTodayActionGroups", () => {
  it("returns the five groups even with no leads", () => {
    const groups = buildTodayActionGroups([], TODAY);
    expect(groups.map((group) => group.id)).toEqual([
      "overdue",
      "due-today",
      "hot",
      "waiting",
      "proposals",
    ]);
    expect(groups.every((group) => group.leads.length === 0)).toBe(true);
  });

  it("puts a past follow-up in overdue and a today one in due today", () => {
    const leads = [
      { id: "a", status: "Contacted", followUpDate: YESTERDAY },
      { id: "b", status: "Contacted", followUpDate: TODAY },
      { id: "c", status: "Contacted", followUpDate: TOMORROW },
    ];
    const groups = buildTodayActionGroups(leads, TODAY);

    expect(groupById(groups, "overdue").leads.map((l) => l.id)).toEqual(["a"]);
    expect(groupById(groups, "due-today").leads.map((l) => l.id)).toEqual(["b"]);
  });

  it("leaves closed and lost leads out of every group", () => {
    const leads = [
      { id: "closed", status: "Closed", followUpDate: YESTERDAY },
      { id: "lost", status: "Lost", followUpDate: TODAY },
    ];
    const groups = buildTodayActionGroups(leads, TODAY);
    expect(groups.every((group) => group.leads.length === 0)).toBe(true);
  });

  it("lists untouched hot leads best-first", () => {
    const weakerHot = {
      id: "weaker",
      status: "New",
      opportunityScore: 95,
      email: "a@b.com",
      phone: "1",
      rating: 4.4,
      reviews: 80,
      website: "No Website",
    };
    const strongerHot = {
      ...weakerHot,
      id: "stronger",
      instagram: "@x",
      googleMapsUrl: "https://maps.google.com/?cid=1",
      rating: 4.9,
      reviews: 500,
    };

    const groups = buildTodayActionGroups([weakerHot, strongerHot], TODAY);
    expect(groupById(groups, "hot").leads.map((l) => l.id)).toEqual([
      "stronger",
      "weaker",
    ]);
  });

  it("counts a contacted lead with no next step as waiting on reply", () => {
    const leads = [
      { id: "no-date", status: "Contacted", followUpDate: "" },
      { id: "interested", status: "Interested", followUpDate: "" },
      { id: "scheduled", status: "Contacted", followUpDate: TOMORROW },
      { id: "new", status: "New", followUpDate: "" },
    ];
    const groups = buildTodayActionGroups(leads, TODAY);

    expect(groupById(groups, "waiting").leads.map((l) => l.id)).toEqual([
      "no-date",
      "interested",
    ]);
  });

  it("collects the sent proposals", () => {
    const leads = [
      { id: "p1", status: "Proposal Sent" },
      { id: "n1", status: "New" },
    ];
    const groups = buildTodayActionGroups(leads, TODAY);
    expect(groupById(groups, "proposals").leads.map((l) => l.id)).toEqual([
      "p1",
    ]);
  });
});

describe("the demo pipeline", () => {
  it("fills every action group, so the demo dashboard is never empty", () => {
    const groups = buildTodayActionGroups(DEMO_LEADS, getTodayDateKey());

    for (const group of groups) {
      expect(
        group.leads.length,
        `demo data leaves "${group.title}" empty`
      ).toBeGreaterThan(0);
    }
  });

  it("covers every pipeline stage", () => {
    const stages = new Set(DEMO_LEADS.map((lead) => lead.status));
    expect(stages).toEqual(
      new Set([
        "New",
        "Contacted",
        "Interested",
        "Proposal Sent",
        "Closed",
        "Lost",
      ])
    );
  });

  it("marks every demo lead so it can be cleared", () => {
    expect(DEMO_LEADS.every((lead) => lead.isDemo)).toBe(true);
    expect(new Set(DEMO_LEADS.map((lead) => lead.id)).size).toBe(
      DEMO_LEADS.length
    );
  });

  it("keeps the sample contact details obviously fake", () => {
    for (const lead of DEMO_LEADS) {
      if (lead.email) expect(lead.email).toMatch(/\.example$/);
      if (lead.websiteUrl) expect(lead.websiteUrl).toMatch(/\.example$/);
      if (lead.phone) expect(lead.phone).toMatch(/\(\d{3}\) 555-\d{4}/);
    }
  });
});

import { describe, it, expect } from "vitest";
import { leadsToCsv } from "./exports.js";

const LEAD = {
  name: "Ocean Drive Barbers",
  city: "Miami",
  category: "Barbershop",
  website: "No Website",
  websiteUrl: "",
  phone: "(305) 555-0142",
  email: "hello@oceandrivebarbers.example",
  instagram: "",
  facebook: "",
  linkedin: "",
  rating: 4.8,
  reviews: 312,
  opportunityScore: 95,
  status: "New",
  followUpDate: "",
  proposalSentDate: "",
  notes: [],
  address: "1120 Ocean Dr",
  googleMapsUrl: "",
};

function parseRow(line) {
  return line.slice(1, -1).split('","');
}

describe("leadsToCsv", () => {
  it("writes a header row and one row per lead", () => {
    const lines = leadsToCsv([LEAD, { ...LEAD, name: "Second" }]).split("\n");
    expect(lines).toHaveLength(3);
    expect(parseRow(lines[0])[0]).toBe("Business");
    expect(parseRow(lines[1])[0]).toBe("Ocean Drive Barbers");
    expect(parseRow(lines[2])[0]).toBe("Second");
  });

  it("writes only the header for an empty list", () => {
    expect(leadsToCsv([]).split("\n")).toHaveLength(1);
  });

  it("keeps the columns aligned when a value contains a comma", () => {
    const lines = leadsToCsv([
      { ...LEAD, name: "Barbers, Inc." },
    ]).split("\n");
    const row = parseRow(lines[1]);
    expect(row[0]).toBe("Barbers, Inc.");
    expect(row).toHaveLength(parseRow(lines[0]).length);
  });

  it("escapes quotes by doubling them", () => {
    const csv = leadsToCsv([{ ...LEAD, name: 'The "Best" Cuts' }]);
    expect(csv).toContain('"The ""Best"" Cuts"');
  });

  it("flattens notes into one cell", () => {
    const csv = leadsToCsv([
      {
        ...LEAD,
        notes: [
          { date: "2026-01-02", text: "Called" },
          { date: "2026-01-03", text: "Emailed" },
        ],
      },
    ]);
    expect(csv).toContain("2026-01-02: Called | 2026-01-03: Emailed");
  });

  it("writes empty cells, not the word undefined, for missing fields", () => {
    const csv = leadsToCsv([{ name: "Sparse" }]);
    expect(csv).not.toContain("undefined");
    expect(csv).not.toContain("null");
  });
});

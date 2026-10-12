import { describe, it, expect } from "vitest";
import {
  isUsableEmail,
  extractEmailFromResult,
  extractSocialsFromResult,
  flattenOutscraperData,
  normalizeText,
  isAllUsaSearch,
  getCitySearchConfig,
  getCityNameOnly,
  isLeadInRequestedLocation,
  mapPlaceToLead,
  SAFE_LIMITS,
} from "./lib.js";

describe("isUsableEmail", () => {
  it("accepts a normal business address", () => {
    expect(isUsableEmail("info@mariasbarbershop.com")).toBe(true);
    expect(isUsableEmail("contact@clinic.co.uk")).toBe(true);
  });

  it("rejects anything that is not a string with an @", () => {
    expect(isUsableEmail("")).toBe(false);
    expect(isUsableEmail(null)).toBe(false);
    expect(isUsableEmail(undefined)).toBe(false);
    expect(isUsableEmail(42)).toBe(false);
    expect(isUsableEmail("not-an-email")).toBe(false);
  });

  it("rejects unattended mailboxes nobody reads", () => {
    expect(isUsableEmail("noreply@shop.com")).toBe(false);
    expect(isUsableEmail("no-reply@shop.com")).toBe(false);
    expect(isUsableEmail("donotreply@shop.com")).toBe(false);
    expect(isUsableEmail("postmaster@shop.com")).toBe(false);
    expect(isUsableEmail("webmaster@shop.com")).toBe(false);
    expect(isUsableEmail("abuse@shop.com")).toBe(false);
  });

  it("rejects platform and vendor domains that are not the business", () => {
    expect(isUsableEmail("someone@sentry.io")).toBe(false);
    expect(isUsableEmail("hi@wixpress.com")).toBe(false);
    expect(isUsableEmail("hi@squarespace.com")).toBe(false);
    expect(isUsableEmail("hi@godaddy.com")).toBe(false);
    expect(isUsableEmail("test@example.com")).toBe(false);
  });

  it("rejects image filenames that the scraper mistakes for emails", () => {
    expect(isUsableEmail("logo@2x.png")).toBe(false);
    expect(isUsableEmail("icon@3x.svg")).toBe(false);
  });
});

describe("extractEmailFromResult", () => {
  it("returns an empty string when there is nothing to read", () => {
    expect(extractEmailFromResult(null)).toBe("");
    expect(extractEmailFromResult({})).toBe("");
  });

  it("prefers a direct field", () => {
    expect(extractEmailFromResult({ email: "owner@gym.com" })).toBe(
      "owner@gym.com"
    );
    expect(extractEmailFromResult({ email_1: "owner@gym.com" })).toBe(
      "owner@gym.com"
    );
  });

  it("trims whitespace around a direct field", () => {
    expect(extractEmailFromResult({ email: "  owner@gym.com  " })).toBe(
      "owner@gym.com"
    );
  });

  it("skips an unusable direct field and keeps looking", () => {
    const result = {
      email: "noreply@gym.com",
      emails: [{ value: "owner@gym.com" }],
    };
    expect(extractEmailFromResult(result)).toBe("owner@gym.com");
  });

  it("reads the emails array in several shapes", () => {
    expect(extractEmailFromResult({ emails: ["owner@gym.com"] })).toBe(
      "owner@gym.com"
    );
    expect(
      extractEmailFromResult({ emails: [{ value: "owner@gym.com" }] })
    ).toBe("owner@gym.com");
  });

  it("falls back to scanning the payload, still filtering junk", () => {
    const result = { nested: { deep: { contact: "hello@salon.com" } } };
    expect(extractEmailFromResult(result)).toBe("hello@salon.com");

    const onlyJunk = { nested: { contact: "noreply@sentry.io" } };
    expect(extractEmailFromResult(onlyJunk)).toBe("");
  });
});

describe("extractSocialsFromResult", () => {
  it("reads explicit fields", () => {
    const socials = extractSocialsFromResult({
      instagram: "https://instagram.com/mybarbers",
      facebook_url: "https://facebook.com/mybarbers",
    });
    expect(socials.instagram).toBe("https://instagram.com/mybarbers");
    expect(socials.facebook).toBe("https://facebook.com/mybarbers");
  });

  it("finds profiles buried anywhere in the payload", () => {
    const socials = extractSocialsFromResult({
      page: { footer: "Follow us at https://www.instagram.com/thegym here" },
    });
    expect(socials.instagram).toBe("https://www.instagram.com/thegym");
  });

  it("treats x.com as twitter", () => {
    const socials = extractSocialsFromResult({
      html: "see https://x.com/thegym",
    });
    expect(socials.twitter).toBe("https://x.com/thegym");
  });

  it("returns empty strings when there is nothing", () => {
    const socials = extractSocialsFromResult({});
    expect(socials).toEqual({
      instagram: "",
      facebook: "",
      linkedin: "",
      twitter: "",
      youtube: "",
      whatsapp: "",
    });
  });
});

describe("flattenOutscraperData", () => {
  it("flattens the nested array Outscraper returns", () => {
    expect(flattenOutscraperData({ data: [[{ name: "A" }, { name: "B" }]] }))
      .toEqual([{ name: "A" }, { name: "B" }]);
  });

  it("passes a flat array straight through", () => {
    expect(flattenOutscraperData({ data: [{ name: "A" }] })).toEqual([
      { name: "A" },
    ]);
  });

  it("wraps a single object", () => {
    expect(flattenOutscraperData({ name: "A" })).toEqual([{ name: "A" }]);
  });

  it("returns an empty array for nothing usable", () => {
    expect(flattenOutscraperData(null)).toEqual([]);
    expect(flattenOutscraperData({ data: null })).toEqual([]);
  });
});

describe("city helpers", () => {
  it("strips accents and case", () => {
    expect(normalizeText("Bogotá")).toBe("bogota");
    expect(normalizeText(null)).toBe("");
  });

  it("recognises the nationwide search in its several spellings", () => {
    expect(isAllUsaSearch("All USA")).toBe(true);
    expect(isAllUsaSearch("usa")).toBe(true);
    expect(isAllUsaSearch("United States")).toBe(true);
    expect(isAllUsaSearch("all")).toBe(true);
    expect(isAllUsaSearch("Miami")).toBe(false);
  });

  it("maps a known city to its full query", () => {
    expect(getCitySearchConfig("Miami")).toEqual({
      label: "Miami",
      query: "Miami, FL",
    });
  });

  it("passes an unknown city through unchanged", () => {
    expect(getCitySearchConfig("Boise")).toEqual({
      label: "Boise",
      query: "Boise",
    });
  });

  it("keeps only the city name", () => {
    expect(getCityNameOnly("Miami, FL")).toBe("miami");
  });
});

describe("isLeadInRequestedLocation", () => {
  it("accepts every lead on a nationwide search", () => {
    expect(isLeadInRequestedLocation({ address: "Reno, NV" }, "All USA")).toBe(
      true
    );
  });

  it("keeps a lead whose address matches the city", () => {
    const lead = { address: "123 Ocean Dr, Miami, FL", name: "Ocean Cuts" };
    expect(isLeadInRequestedLocation(lead, "Miami")).toBe(true);
  });

  it("drops a lead from a different city", () => {
    const lead = { address: "500 Peachtree St, Atlanta, GA", name: "Cuts" };
    expect(isLeadInRequestedLocation(lead, "Miami")).toBe(false);
  });
});

describe("mapPlaceToLead", () => {
  const place = {
    name: "Ocean Cuts",
    phone: "(305) 555-0100",
    rating: 4.8,
    reviews: 212,
    full_address: "123 Ocean Dr, Miami, FL",
    site: "https://oceancuts.com",
    email_1: "hello@oceancuts.com",
  };

  it("maps the fields the CRM needs", () => {
    const lead = mapPlaceToLead(place, "Miami", "Barbershop");
    expect(lead.name).toBe("Ocean Cuts");
    expect(lead.city).toBe("Miami");
    expect(lead.phone).toBe("(305) 555-0100");
    expect(lead.email).toBe("hello@oceancuts.com");
    expect(lead.address).toBe("123 Ocean Dr, Miami, FL");
    expect(lead.status).toBe("New");
  });

  it("scores a business without a website as the bigger opportunity", () => {
    const withSite = mapPlaceToLead(place, "Miami", "Barbershop");
    const withoutSite = mapPlaceToLead(
      { ...place, site: "" },
      "Miami",
      "Barbershop"
    );
    expect(withSite.website).toBe("Has Website");
    expect(withSite.opportunityScore).toBe(70);
    expect(withoutSite.website).toBe("No Website");
    expect(withoutSite.opportunityScore).toBe(95);
  });

  it("drops an unusable email instead of storing it", () => {
    const lead = mapPlaceToLead(
      { ...place, email_1: "noreply@oceancuts.com" },
      "Miami",
      "Barbershop"
    );
    expect(lead.email).toBe("");
  });

  it("gives every lead its own id", () => {
    const ids = new Set(
      Array.from({ length: 50 }, () =>
        mapPlaceToLead(place, "Miami", "Barbershop").id
      )
    );
    expect(ids.size).toBe(50);
  });

  it("falls back to a placeholder name", () => {
    expect(mapPlaceToLead({}, "Miami", "Barbershop").name).toBe(
      "Unknown Business"
    );
  });
});

describe("SAFE_LIMITS", () => {
  it("keeps the expensive email search tighter than the plain one", () => {
    expect(SAFE_LIMITS.singleCityEmailLimit).toBeLessThan(
      SAFE_LIMITS.normalSearchLimit
    );
    expect(SAFE_LIMITS.allUsaEmailLimit).toBeLessThan(
      SAFE_LIMITS.allUsaNormalSearchLimit
    );
  });
});

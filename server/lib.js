// ============================================================
// Pure helpers shared by the API routes.
//
// Everything in this file is side-effect free: no Express, no network,
// no env vars. That is what makes it unit-testable (see server/lib.test.js)
// and what keeps server/index.js focused on wiring routes together.
// ============================================================

import crypto from "crypto";


export const SAFE_LIMITS = {
  singleCityEmailLimit: 3,
  allUsaEmailLimit: 5,
  normalSearchLimit: 8,
  allUsaNormalSearchLimit: 12,
};

// ============================================================
// FIX 1: Filtro de emails inservibles.
// Evita mandar outreach a agencias, noreply, o dominios de plataformas.
// ============================================================
export const BAD_EMAIL_PREFIX =
  /^(noreply|no-reply|donotreply|do-not-reply|postmaster|mailer-daemon|webmaster|hostmaster|abuse|admin@wordpress)/i;

export const BAD_EMAIL_DOMAIN =
  /(sentry\.io|wixpress\.com|wix\.com|squarespace\.com|godaddy\.com|shopify\.com|example\.com|example\.org|sentry\.wixpress|cloudflare|googlemail|schema\.org|w3\.org)/i;

export function isUsableEmail(email) {
  if (!email || typeof email !== "string") return false;
  if (!email.includes("@")) return false;
  if (BAD_EMAIL_PREFIX.test(email)) return false;
  if (BAD_EMAIL_DOMAIN.test(email)) return false;
  // Rechaza emails con imágenes/hashes que a veces salen del scraping
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email)) return false;
  return true;
}

export const USA_MARKET_CITIES = [
  { label: "Miami", query: "Miami, FL" },
  { label: "Orlando", query: "Orlando, FL" },
  { label: "Tampa", query: "Tampa, FL" },
  { label: "Atlanta", query: "Atlanta, GA" },
  { label: "Dallas", query: "Dallas, TX" },
  { label: "Houston", query: "Houston, TX" },
  { label: "Austin", query: "Austin, TX" },
  { label: "New York", query: "New York, NY" },
  { label: "Los Angeles", query: "Los Angeles, CA" },
  { label: "Chicago", query: "Chicago, IL" },
  { label: "Phoenix", query: "Phoenix, AZ" },
  { label: "Las Vegas", query: "Las Vegas, NV" },
  { label: "Denver", query: "Denver, CO" },
  { label: "Seattle", query: "Seattle, WA" },
  { label: "Boston", query: "Boston, MA" },
  { label: "San Diego", query: "San Diego, CA" },
  { label: "Nashville", query: "Nashville, TN" },
  { label: "Charlotte", query: "Charlotte, NC" },
  { label: "Raleigh", query: "Raleigh, NC" },
  { label: "Washington DC", query: "Washington, DC" },
];

export function getWebsiteUrl(place) {
  return (
    place.website ||
    place.site ||
    place.website_url ||
    place.business_site ||
    place.domain ||
    ""
  );
}

export function getGoogleMapsUrl(place) {
  return (
    place.location_link ||
    place.google_maps_url ||
    place.google_maps_link ||
    place.place_link ||
    place.url ||
    ""
  );
}

export function getAddress(place) {
  return (
    place.full_address ||
    place.address ||
    place.formatted_address ||
    place.street_address ||
    ""
  );
}

export function flattenOutscraperData(data) {
  // Outscraper wraps results in { data: [...] }. When a search comes back
  // empty that envelope can be { data: null } — unwrap it either way, so an
  // empty response never gets mistaken for a single result.
  const hasEnvelope =
    data && typeof data === "object" && !Array.isArray(data) && "data" in data;
  const rawResults = hasEnvelope ? data.data : data;

  if (Array.isArray(rawResults?.[0])) {
    return rawResults.flat();
  }

  if (Array.isArray(rawResults)) {
    return rawResults;
  }

  if (rawResults && typeof rawResults === "object") {
    return [rawResults];
  }

  return [];
}

export function extractFirstString(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractFirstString(item);
      if (found) return found;
    }
  }

  if (typeof value === "object") {
    const possibleKeys = [
      "value",
      "email",
      "address",
      "text",
      "url",
      "link",
      "href",
      "profile",
    ];

    for (const key of possibleKeys) {
      if (value[key]) {
        const found = extractFirstString(value[key]);
        if (found) return found;
      }
    }
  }

  return "";
}

// ============================================================
// FIX 1 (cont.): extractEmailFromResult ahora valida cada candidato
// con isUsableEmail antes de devolverlo.
// ============================================================
export function extractEmailFromResult(result) {
  if (!result) return "";

  const directCandidates = [
    result.email,
    result.email_1,
    result.email1,
    result.contact_email,
    result.business_email,
    result.emails_found,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && isUsableEmail(candidate.trim())) {
      return candidate.trim();
    }
  }

  const emails = Array.isArray(result.emails) ? result.emails : [];

  for (const item of emails) {
    const possibleEmail = extractFirstString(item).trim();
    if (isUsableEmail(possibleEmail)) {
      return possibleEmail;
    }
  }

  // Último recurso: regex sobre el JSON completo, PERO validado.
  const text = JSON.stringify(result);
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];

  for (const match of matches) {
    if (isUsableEmail(match)) {
      return match;
    }
  }

  return "";
}

export function extractValueByKeys(source, keys) {
  if (!source) return "";

  for (const key of keys) {
    if (source[key]) {
      const value = extractFirstString(source[key]);
      if (value) return value;
    }
  }

  if (source.socials) {
    for (const key of keys) {
      if (source.socials[key]) {
        const value = extractFirstString(source.socials[key]);
        if (value) return value;
      }
    }
  }

  if (source.links) {
    for (const key of keys) {
      if (source.links[key]) {
        const value = extractFirstString(source.links[key]);
        if (value) return value;
      }
    }
  }

  return "";
}

export function extractSocialFromText(result, platform) {
  if (!result) return "";

  const text = JSON.stringify(result);

  const patterns = {
    instagram: /https?:\/\/(?:www\.)?instagram\.com\/[^"'\\\s,)]+/i,
    facebook: /https?:\/\/(?:www\.)?facebook\.com\/[^"'\\\s,)]+/i,
    linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/[^"'\\\s,)]+/i,
    twitter: /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^"'\\\s,)]+/i,
    youtube: /https?:\/\/(?:www\.)?youtube\.com\/[^"'\\\s,)]+/i,
    whatsapp: /https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^"'\\\s,)]+/i,
  };

  const match = text.match(patterns[platform]);
  return match ? match[0] : "";
}

export function extractSocialsFromResult(result) {
  const instagram =
    extractValueByKeys(result, ["instagram", "instagram_url"]) ||
    extractSocialFromText(result, "instagram");

  const facebook =
    extractValueByKeys(result, ["facebook", "facebook_url"]) ||
    extractSocialFromText(result, "facebook");

  const linkedin =
    extractValueByKeys(result, ["linkedin", "linkedin_url"]) ||
    extractSocialFromText(result, "linkedin");

  const twitter =
    extractValueByKeys(result, ["twitter", "twitter_url", "x", "x_url"]) ||
    extractSocialFromText(result, "twitter");

  const youtube =
    extractValueByKeys(result, ["youtube", "youtube_url"]) ||
    extractSocialFromText(result, "youtube");

  const whatsapp =
    extractValueByKeys(result, ["whatsapp", "whatsapp_url"]) ||
    extractSocialFromText(result, "whatsapp");

  return {
    instagram,
    facebook,
    linkedin,
    twitter,
    youtube,
    whatsapp,
  };
}

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isAllUsaSearch(city) {
  const requestedCity = normalizeText(city);
  return (
    requestedCity === "all usa" ||
    requestedCity === "usa" ||
    requestedCity === "united states" ||
    requestedCity === "all"
  );
}

export function getCitySearchConfig(city) {
  const normalizedCity = normalizeText(city);

  return (
    USA_MARKET_CITIES.find(
      (item) =>
        normalizeText(item.label) === normalizedCity ||
        normalizeText(item.query) === normalizedCity
    ) || {
      label: city,
      query: city,
    }
  );
}

export function getCityNameOnly(city) {
  return normalizeText(String(city || "").split(",")[0]);
}

export function isLeadInRequestedLocation(lead, city) {
  if (isAllUsaSearch(city)) return true;

  const requestedCity = getCityNameOnly(city);

  const combinedLocationText = normalizeText(
    [lead.address, lead.googleMapsUrl, lead.name, lead.city].join(" ")
  );

  return combinedLocationText.includes(requestedCity);
}

// ============================================================
// FIX 1 (cont.): el email de mapPlaceToLead también se valida.
// FIX 2: id ahora usa crypto.randomUUID() en vez de Date.now() + index.
// ============================================================
export function mapPlaceToLead(place, city, category) {
  const websiteUrl = getWebsiteUrl(place);
  const address = getAddress(place);
  const googleMapsUrl = getGoogleMapsUrl(place);

  const rawEmail =
    place.email_1 ||
    place.email ||
    place.emails?.[0]?.value ||
    place.emails?.[0] ||
    "";

  const email = isUsableEmail(String(rawEmail).trim())
    ? String(rawEmail).trim()
    : "";

  return {
    id: crypto.randomUUID(), // FIX 2
    name: place.name || "Unknown Business",
    city,
    category: place.category || place.type || category,
    website: websiteUrl ? "Has Website" : "No Website",
    websiteUrl,
    phone: place.phone || "",
    email,
    instagram:
      place.instagram || place.instagram_url || place.socials?.instagram || "",
    facebook:
      place.facebook || place.facebook_url || place.socials?.facebook || "",
    linkedin:
      place.linkedin || place.linkedin_url || place.socials?.linkedin || "",
    twitter:
      place.twitter || place.twitter_url || place.socials?.twitter || "",
    youtube:
      place.youtube || place.youtube_url || place.socials?.youtube || "",
    whatsapp:
      place.whatsapp || place.whatsapp_url || place.socials?.whatsapp || "",
    rating: place.rating || 0,
    reviews: place.reviews || 0,
    opportunityScore: websiteUrl ? 70 : 95,
    status: "New",
    address,
    googleMapsUrl,
  };
}

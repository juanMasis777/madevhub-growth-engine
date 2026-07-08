import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================================
// FIX 4: Restringe CORS al frontend en producción.
// En local deja abierto; en producción pon FRONTEND_URL en .env
// ============================================================
const FRONTEND_URL = process.env.FRONTEND_URL || "";
app.use(
  cors(
    FRONTEND_URL
      ? { origin: FRONTEND_URL }
      : {} // sin FRONTEND_URL = abierto (solo para desarrollo local)
  )
);
app.use(express.json());

const SAFE_LIMITS = {
  singleCityEmailLimit: 3,
  allUsaEmailLimit: 5,
  normalSearchLimit: 8,
  allUsaNormalSearchLimit: 12,
};

// ============================================================
// FIX 3: Timeout para todas las llamadas a Outscraper.
// Si Outscraper cuelga, tu request ya no se queda colgada para siempre.
// ============================================================
const OUTSCRAPER_TIMEOUT_MS = 25000;

async function outscraperFetch(url, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OUTSCRAPER_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "X-API-KEY": apiKey },
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        "Outscraper request timed out. Try again or reduce the limit."
      );
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// FIX 1: Filtro de emails inservibles.
// Evita mandar outreach a agencias, noreply, o dominios de plataformas.
// ============================================================
const BAD_EMAIL_PREFIX =
  /^(noreply|no-reply|donotreply|do-not-reply|postmaster|mailer-daemon|webmaster|hostmaster|abuse|admin@wordpress)/i;

const BAD_EMAIL_DOMAIN =
  /(sentry\.io|wixpress\.com|wix\.com|squarespace\.com|godaddy\.com|shopify\.com|example\.com|example\.org|sentry\.wixpress|cloudflare|googlemail|schema\.org|w3\.org)/i;

function isUsableEmail(email) {
  if (!email || typeof email !== "string") return false;
  if (!email.includes("@")) return false;
  if (BAD_EMAIL_PREFIX.test(email)) return false;
  if (BAD_EMAIL_DOMAIN.test(email)) return false;
  // Rechaza emails con imágenes/hashes que a veces salen del scraping
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email)) return false;
  return true;
}

const USA_MARKET_CITIES = [
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

app.get("/", (req, res) => {
  res.send("MADEVHUB backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend connected successfully",
  });
});

app.get("/api/safe-mode", (req, res) => {
  res.json({
    success: true,
    safeMode: true,
    limits: SAFE_LIMITS,
  });
});

function getWebsiteUrl(place) {
  return (
    place.website ||
    place.site ||
    place.website_url ||
    place.business_site ||
    place.domain ||
    ""
  );
}

function getGoogleMapsUrl(place) {
  return (
    place.location_link ||
    place.google_maps_url ||
    place.google_maps_link ||
    place.place_link ||
    place.url ||
    ""
  );
}

function getAddress(place) {
  return (
    place.full_address ||
    place.address ||
    place.formatted_address ||
    place.street_address ||
    ""
  );
}

function flattenOutscraperData(data) {
  const rawResults = Array.isArray(data?.data) ? data.data : data;

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

function extractFirstString(value) {
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
function extractEmailFromResult(result) {
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

function extractValueByKeys(source, keys) {
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

function extractSocialFromText(result, platform) {
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

function extractSocialsFromResult(result) {
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

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isAllUsaSearch(city) {
  const requestedCity = normalizeText(city);
  return (
    requestedCity === "all usa" ||
    requestedCity === "usa" ||
    requestedCity === "united states" ||
    requestedCity === "all"
  );
}

function getCitySearchConfig(city) {
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

function getCityNameOnly(city) {
  return normalizeText(String(city || "").split(",")[0]);
}

function isLeadInRequestedLocation(lead, city) {
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
function mapPlaceToLead(place, index, city, category) {
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

async function searchGoogleMapsLeads({ apiKey, city, category, limit }) {
  const cityConfig = getCitySearchConfig(city);
  const query = `${category} in ${cityConfig.query}, United States`;

  const url = new URL("https://api.outscraper.cloud/google-maps-search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", limit);
  url.searchParams.set("async", "false");

  // FIX: logging para que veas cuántas llamadas reales haces a Outscraper
  console.log(`[OUTSCRAPER] Maps search: "${query}" (limit ${limit})`);

  const response = await outscraperFetch(url, apiKey);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error("Outscraper Google Maps API error");
    error.status = response.status;
    error.details = data;
    throw error;
  }

  const flatResults = flattenOutscraperData(data);

  return {
    query,
    leads: flatResults.map((place, index) =>
      mapPlaceToLead(place, index, cityConfig.label, category)
    ),
  };
}

async function enrichWebsiteWithContacts({ apiKey, websiteUrl }) {
  if (!websiteUrl) {
    return {
      email: "",
      instagram: "",
      facebook: "",
      linkedin: "",
      twitter: "",
      youtube: "",
      whatsapp: "",
      raw: {},
    };
  }

  const url = new URL("https://api.outscraper.cloud/emails-and-contacts");
  url.searchParams.set("query", websiteUrl);
  url.searchParams.set("async", "false");

  console.log(`[OUTSCRAPER] Enrich: ${websiteUrl}`);

  const response = await outscraperFetch(url, apiKey);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error("Outscraper enrichment API error");
    error.status = response.status;
    error.details = data;
    throw error;
  }

  const flatResults = flattenOutscraperData(data);
  const result = flatResults[0] || {};

  const email = extractEmailFromResult(result); // ya validado
  const socials = extractSocialsFromResult(result);

  return {
    email,
    ...socials,
    socials,
    raw: result,
  };
}

// ============================================================
// FIX 3 (cont.): loguea el total de llamadas gastadas en All USA,
// para que el Safe Mode sea auditable y no una fuga silenciosa.
// ============================================================
async function searchAllUsaLeads({
  apiKey,
  category,
  totalLimit,
  requireWebsite = false,
}) {
  const collectedLeads = [];
  const queries = [];
  let citiesSearched = 0;

  for (const cityConfig of USA_MARKET_CITIES) {
    if (collectedLeads.length >= totalLimit) break;

    try {
      citiesSearched += 1;
      const result = await searchGoogleMapsLeads({
        apiKey,
        city: cityConfig.label,
        category,
        limit: requireWebsite ? 5 : 3,
      });

      queries.push(result.query);

      const matchingLeads = result.leads
        .filter((lead) => isLeadInRequestedLocation(lead, cityConfig.label))
        .filter((lead) => (requireWebsite ? Boolean(lead.websiteUrl) : true));

      for (const lead of matchingLeads) {
        if (collectedLeads.length >= totalLimit) break;
        collectedLeads.push(lead);
      }
    } catch (error) {
      console.error(`Error searching ${cityConfig.label}:`, error.message);
    }
  }

  console.log(
    `[SAFE MODE] All USA search hit ${citiesSearched} cities to collect ${collectedLeads.length}/${totalLimit} leads.`
  );

  return {
    query: `All USA ${category} search`,
    queries,
    leads: collectedLeads,
  };
}

app.get("/api/search-leads", async (req, res) => {
  try {
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Outscraper API key is missing in .env",
      });
    }

    const city = req.query.city || "Miami";
    const category = req.query.category || "Restaurant";
    const rawLimit = Number(req.query.limit) || SAFE_LIMITS.normalSearchLimit;
    const limit = isAllUsaSearch(city)
      ? Math.min(rawLimit, SAFE_LIMITS.allUsaNormalSearchLimit)
      : Math.min(rawLimit, SAFE_LIMITS.normalSearchLimit);

    if (isAllUsaSearch(city)) {
      const usaResult = await searchAllUsaLeads({
        apiKey,
        category,
        totalLimit: Number(limit) || 15,
        requireWebsite: false,
      });

      return res.json({
        success: true,
        query: usaResult.query,
        queries: usaResult.queries,
        count: usaResult.leads.length,
        safeMode: true,
        leads: usaResult.leads,
      });
    }

    const result = await searchGoogleMapsLeads({
      apiKey,
      city,
      category,
      limit: Number(limit) * 3,
    });

    const filteredLeads = result.leads
      .filter((lead) => isLeadInRequestedLocation(lead, city))
      .slice(0, Number(limit));

    res.json({
      success: true,
      query: result.query,
      count: filteredLeads.length,
      safeMode: true,
      leads: filteredLeads,
    });
  } catch (error) {
    console.error("Search leads error:", error);

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error while searching leads",
      details: error.details,
    });
  }
});

app.post("/api/enrich-lead", async (req, res) => {
  try {
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Outscraper API key is missing in .env",
      });
    }

    const { websiteUrl } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        message: "websiteUrl is required to enrich this lead.",
      });
    }

    const result = await enrichWebsiteWithContacts({
      apiKey,
      websiteUrl,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Enrich lead error:", error);

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error while enriching lead",
      details: error.details,
    });
  }
});

app.get("/api/search-leads-with-emails", async (req, res) => {
  try {
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Outscraper API key is missing in .env",
      });
    }

    const city = req.query.city || "Miami";
    const category = req.query.category || "Restaurant";
    const rawRequestedLimit =
      Number(req.query.limit) || SAFE_LIMITS.singleCityEmailLimit;
    const maxAllowedEmailLimit = isAllUsaSearch(city)
      ? SAFE_LIMITS.allUsaEmailLimit
      : SAFE_LIMITS.singleCityEmailLimit;
    const requestedLimit = Math.min(rawRequestedLimit, maxAllowedEmailLimit);
    const googleMapsLimit = Math.max(requestedLimit * 4, 12);

    if (isAllUsaSearch(city)) {
      const usaSearchResult = await searchAllUsaLeads({
        apiKey,
        category,
        totalLimit: requestedLimit,
        requireWebsite: true,
      });

      const enrichedUsaLeads = [];

      for (const lead of usaSearchResult.leads) {
        try {
          const enrichment = await enrichWebsiteWithContacts({
            apiKey,
            websiteUrl: lead.websiteUrl,
          });

          enrichedUsaLeads.push({
            ...lead,
            email: enrichment.email || lead.email || "",
            instagram: enrichment.instagram || lead.instagram || "",
            facebook: enrichment.facebook || lead.facebook || "",
            linkedin: enrichment.linkedin || lead.linkedin || "",
            twitter: enrichment.twitter || lead.twitter || "",
            youtube: enrichment.youtube || lead.youtube || "",
            whatsapp: enrichment.whatsapp || lead.whatsapp || "",
          });
        } catch (error) {
          console.error(`Error enriching ${lead.name}:`, error.message);

          enrichedUsaLeads.push({
            ...lead,
            enrichmentError: true,
          });
        }
      }

      return res.json({
        success: true,
        query: usaSearchResult.query,
        queries: usaSearchResult.queries,
        searched: usaSearchResult.leads.length,
        cityFiltered: usaSearchResult.leads.length,
        enriched: enrichedUsaLeads.length,
        withEmail: enrichedUsaLeads.filter((lead) => lead.email).length,
        safeMode: true,
        leads: enrichedUsaLeads,
      });
    }

    const searchResult = await searchGoogleMapsLeads({
      apiKey,
      city,
      category,
      limit: googleMapsLimit,
    });

    const leadsWithWebsites = searchResult.leads
      .filter((lead) => isLeadInRequestedLocation(lead, city))
      .filter((lead) => lead.websiteUrl)
      .slice(0, requestedLimit);

    const enrichedLeads = [];

    for (const lead of leadsWithWebsites) {
      try {
        const enrichment = await enrichWebsiteWithContacts({
          apiKey,
          websiteUrl: lead.websiteUrl,
        });

        enrichedLeads.push({
          ...lead,
          email: enrichment.email || lead.email || "",
          instagram: enrichment.instagram || lead.instagram || "",
          facebook: enrichment.facebook || lead.facebook || "",
          linkedin: enrichment.linkedin || lead.linkedin || "",
          twitter: enrichment.twitter || lead.twitter || "",
          youtube: enrichment.youtube || lead.youtube || "",
          whatsapp: enrichment.whatsapp || lead.whatsapp || "",
        });
      } catch (error) {
        console.error(`Error enriching ${lead.name}:`, error.message);

        enrichedLeads.push({
          ...lead,
          enrichmentError: true,
        });
      }
    }

    res.json({
      success: true,
      query: searchResult.query,
      searched: searchResult.leads.length,
      cityFiltered: leadsWithWebsites.length,
      enriched: enrichedLeads.length,
      withEmail: enrichedLeads.filter((lead) => lead.email).length,
      safeMode: true,
      leads: enrichedLeads,
    });
  } catch (error) {
    console.error("Search leads with emails error:", error);

    res.status(error.status || 500).json({
      success: false,
      message:
        error.message || "Server error while searching leads with emails",
      details: error.details,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
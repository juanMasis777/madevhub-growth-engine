import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import crypto from "crypto";
import {
  SAFE_LIMITS,
  USA_MARKET_CITIES,
  flattenOutscraperData,
  extractEmailFromResult,
  extractSocialsFromResult,
  isAllUsaSearch,
  getCitySearchConfig,
  isLeadInRequestedLocation,
  mapPlaceToLead,
} from "./lib.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Detrás de un proxy (Render, Railway, Fly, Nginx) para que el rate-limit
// lea la IP real del cliente en lugar de la del proxy.
app.set("trust proxy", 1);

// ============================================================
// SECURITY: helmet añade cabeceras HTTP seguras por defecto.
// ============================================================
app.use(helmet());

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
app.use(express.json({ limit: "1mb" }));

// ============================================================
// SECURITY: Rate limiting. Cada llamada a /api gasta créditos
// reales de Outscraper, así que limitamos por IP para evitar
// que alguien vacíe tu cuenta. Ajusta con las env vars.
// ============================================================
const RATE_LIMIT_WINDOW_MS =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 60;

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down and try again later.",
  },
});
app.use("/api/", apiLimiter);

// ============================================================
// SECURITY: Token de acceso opcional para los endpoints caros.
// Si defines API_ACCESS_TOKEN en .env, cada request a los
// endpoints de scraping debe enviar ese token en la cabecera
// "x-access-token" (o "Authorization: Bearer <token>").
// Si NO lo defines, los endpoints quedan abiertos (solo dev local).
// ============================================================
const API_ACCESS_TOKEN = process.env.API_ACCESS_TOKEN || "";

function requireAccessToken(req, res, next) {
  if (!API_ACCESS_TOKEN) return next(); // sin token configurado = abierto (dev)

  const headerToken =
    req.get("x-access-token") ||
    (req.get("authorization") || "").replace(/^Bearer\s+/i, "");

  // Comparación en tiempo constante para evitar timing attacks.
  const expected = Buffer.from(API_ACCESS_TOKEN);
  const provided = Buffer.from(headerToken || "");

  if (
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: missing or invalid access token.",
    });
  }

  return next();
}

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
    leads: flatResults.map((place) =>
      mapPlaceToLead(place, cityConfig.label, category)
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

app.get("/api/search-leads", requireAccessToken, async (req, res) => {
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

app.post("/api/enrich-lead", requireAccessToken, async (req, res) => {
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

app.get(
  "/api/search-leads-with-emails",
  requireAccessToken,
  async (req, res) => {
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
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// ============================================================
// Pure lead helpers: scoring, formatting and small derivations.
//
// No React, no browser APIs, no network — so these can be unit-tested
// directly (see src/lib/leads.test.js).
// ============================================================

import { CLOSED_STATUSES } from "./constants.js";

export function getDefaultContactMode(lead) {
  if (lead?.email) return "email";
  if (lead?.instagram) return "instagram";
  return "call";
}

export function getActionLabel(contactMode) {
  if (contactMode === "email") return "Send Email";
  if (contactMode === "instagram") return "Copy Instagram DM";
  return "Save Call Script";
}

export function convertLeadToForm(lead) {
  return {
    name: lead.name || "",
    city: lead.city || "Miami",
    category: lead.category || "Barbershop",
    website: lead.website || "No Website",
    phone: lead.phone || "",
    email: lead.email || "",
    instagram: lead.instagram || "",
    rating: String(lead.rating ?? "4.5"),
    reviews: String(lead.reviews ?? "0"),
    opportunityScore: String(lead.opportunityScore ?? "90"),
  };
}

export function createSafeFileName(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "business"
  );
}

export function getTodayDateKey() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

export function isLeadStillOpen(lead) {
  return !CLOSED_STATUSES.includes(lead?.status);
}

export function getOpportunityScoreFromWebsite(websiteStatus) {
  if (websiteStatus === "No Website") return 95;
  if (websiteStatus === "Facebook Only") return 90;
  if (websiteStatus === "Old Website") return 82;
  return 70;
}

export function getLeadQuality(lead) {
  if (!lead) {
    return {
      score: 0,
      label: "Low Priority",
      emoji: "❄️",
      level: "low",
      className: "low",
    };
  }

  let score = 0;

  const opportunityScore = Number(lead.opportunityScore) || 0;
  const rating = Number(lead.rating) || 0;
  const reviews = Number(lead.reviews) || 0;

  if (opportunityScore >= 90) score += 25;
  else if (opportunityScore >= 80) score += 18;
  else if (opportunityScore >= 70) score += 10;

  if (lead.email) score += 25;
  if (lead.phone) score += 15;
  if (lead.instagram) score += 10;
  if (lead.googleMapsUrl) score += 5;

  if (reviews >= 200) score += 15;
  else if (reviews >= 75) score += 10;
  else if (reviews >= 25) score += 6;

  if (rating >= 4.7) score += 10;
  else if (rating >= 4.3) score += 7;
  else if (rating >= 4.0) score += 4;

  if (lead.website === "No Website") score += 15;
  else if (lead.website === "Facebook Only") score += 12;
  else if (lead.website === "Old Website") score += 10;
  else if (lead.website === "Has Website") score += 4;

  const finalScore = Math.min(score, 100);

  if (finalScore >= 75) {
    return {
      score: finalScore,
      label: "Hot Lead",
      emoji: "🔥",
      level: "hot",
      className: "hot",
    };
  }

  if (finalScore >= 50) {
    return {
      score: finalScore,
      label: "Good Lead",
      emoji: "⭐",
      level: "good",
      className: "good",
    };
  }

  return {
    score: finalScore,
    label: "Low Priority",
    emoji: "❄️",
    level: "low",
    className: "low",
  };
}

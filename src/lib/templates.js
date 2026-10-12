// ============================================================
// Message and audit copy.
//
// Every function here takes a lead and returns text — no state, no DOM —
// so the wording can be reviewed and tested on its own (templates.test.js).
// ============================================================

import { getLeadQuality } from "./leads.js";

// The first message for a lead, written for the channel being used.
export function buildContactMessage(lead, contactMode) {
      if (!lead) return "";

      if (contactMode === "email") {
        return `Subject: Quick idea for ${lead.name}

  Hi ${lead.name},

  I found your business online and noticed that your digital presence could be improved. You already have a strong reputation with ${lead.rating} stars and ${lead.reviews} reviews, but I noticed your website status is: ${lead.website}.

  At MADEVHUB, we help local businesses get professional websites, better visibility, and more customers.

  Would you like me to send you a free digital audit for your business?

  Best,
  Juan
  MADEVHUB`;
      }

      if (contactMode === "instagram") {
        return `Hi ${lead.name}, I found your business online and noticed you have a strong local presence with ${lead.rating} stars and ${lead.reviews} reviews.

  I also noticed your website status is: ${lead.website}.

  I help local businesses get professional websites and attract more customers online. Would you like me to send you a free quick digital audit?`;
      }

      return `Call Script for ${lead.name}

  Hi, my name is Juan from MADEVHUB. I found your business online and noticed you have great reviews.

  I help local businesses improve their online presence with professional websites, better visibility, and simple automation.

  I wanted to ask if you already have someone helping you with your website or online presence?

  If not, I can send you a free digital audit showing a few ways your business could attract more local customers.`;
}

// The digital-presence audit shown in the Audits view and exported to
// TXT and PDF.
export function buildAudit(lead) {
  if (!lead) return "";

          const websiteProblem =
        lead.website === "No Website"
          ? "The business does not have a professional website."
          : lead.website === "Old Website"
          ? "The business may have an outdated website that needs improvement."
          : lead.website === "Facebook Only"
          ? "The business depends mostly on Facebook instead of having a professional website."
          : "The business has a website, but it can still improve its online presence.";

      const contactProblem = lead.email
        ? "The business has an email available, so email outreach is possible."
        : lead.instagram
        ? "No public email was found, but Instagram and phone outreach are possible."
        : "No public email or Instagram was found, so phone outreach may be the best option.";

      const addressInfo = lead.address
        ? `Address: ${lead.address}`
        : "Address: Not found";

      const websiteInfo = lead.websiteUrl
        ? `Website URL: ${lead.websiteUrl}`
        : "Website URL: Not found";

      const googleMapsInfo = lead.googleMapsUrl
        ? `Google Maps: ${lead.googleMapsUrl}`
        : "Google Maps: Not found";

      const audit = `Digital Presence Audit for ${lead.name}

  Business Type: ${lead.category}
  Location: ${lead.city}
  ${addressInfo}
  ${websiteInfo}
  ${googleMapsInfo}
  Rating: ${lead.rating} stars
  Reviews: ${lead.reviews}
  Opportunity Score: ${lead.opportunityScore}%
  Lead Quality: ${getLeadQuality(lead).emoji} ${getLeadQuality(lead).label} (${getLeadQuality(lead).score}/100)
  Follow-up: ${lead.followUpDate || "Not scheduled"}

  Main Problems Found:
  1. ${websiteProblem}
  2. ${contactProblem}
  3. The business may be missing a stronger online sales system.
  4. There is an opportunity to improve trust, booking, and local visibility.
  5. The business could convert more visitors with a better call-to-action.

  Recommended Improvements:
  1. Create a modern professional website.
  2. Add a clear call-to-action such as "Book Now", "Call Now", or "Get a Quote".
  3. Add services, prices, location, photos, and customer reviews.
  4. Add a contact form connected to email.
  5. Improve local SEO for customers searching in ${lead.city}.
  6. Add simple automation for follow-ups, appointments, or quotes.

  MADEVHUB Opportunity:
  This business could benefit from a professional landing page, mobile-friendly design, local SEO setup, and simple automation to help convert visitors into customers.

  Suggested Offer:
  Website Setup: $299 - $799
  Monthly Maintenance: $49 - $149/month
  Optional SEO / Automation: $99 - $299/month

  Next Step:
  Send a personalized message offering a free digital audit and a quick website improvement idea.`;

  return audit;
}

// The five-step outreach sequence, keyed by step id.
export function buildOutreachMessages(lead) {
  if (!lead) return {};

              const businessName = lead.name;
      const cityName = lead.city || "your area";
      const businessCategory = lead.category || "business";
      const ratingText = lead.rating
        ? `${lead.rating} stars`
        : "strong local presence";
      const reviewsText = lead.reviews
        ? `${lead.reviews} reviews`
        : "customer reviews";

      const websiteObservation =
        lead.website === "No Website"
          ? "I noticed your business may not have a professional website yet."
          : lead.website === "Old Website"
          ? "I noticed your website may be due for a more modern and conversion-focused upgrade."
          : lead.website === "Facebook Only"
          ? "I noticed your business may be relying heavily on Facebook instead of a dedicated website."
          : "I noticed there may be room to improve your website conversion and local visibility.";

      const messages = {
        email: {
          title: "Initial Email",
          body: `Subject: Quick digital growth idea for ${businessName}

  Hi ${businessName},

  I found your business online while looking at ${businessCategory} businesses in ${cityName}. You already have a strong reputation with ${ratingText} and ${reviewsText}.

  ${websiteObservation}

  At MADEVHUB, we help local businesses improve their website, local SEO, and lead capture so more visitors become real customers.

  I prepared a quick digital growth idea for your business.

  Would you like me to send it over?

  Best,
  Juan
  MADEVHUB`,
        },

        instagram: {
          title: "Instagram DM",
          body: `Hi ${businessName}, I found your business online and noticed you have a strong local presence in ${cityName}.

  ${websiteObservation}

  I help local businesses get better websites, stronger local visibility, and more customer inquiries online.

  I prepared a quick digital growth idea for your business. Would you like me to send it over?`,
        },

        followup1: {
          title: "Follow-up 1",
          body: `Hi ${businessName},

  Just wanted to follow up on my previous message.

  I noticed a few simple improvements that could help your online presence convert more visitors into customers, especially for people searching for ${businessCategory} services in ${cityName}.

  I can send you the quick audit idea if you would like to see it.

  Best,
  Juan
  MADEVHUB`,
        },

        followup2: {
          title: "Follow-up 2",
          body: `Hi ${businessName},

  Last quick follow-up from me.

  I know you are probably busy, so I will keep it simple: I found a few opportunities to improve trust, visibility, and lead capture for your business online.

  No pressure — I can send the quick idea over if it is useful.

  Best,
  Juan
  MADEVHUB`,
        },

        call: {
          title: "Call Script",
          body: `Call Script for ${businessName}

  Hi, my name is Juan from MADEVHUB.

  I found your business online and noticed you have a strong reputation with ${ratingText} and ${reviewsText}.

  The reason for my call is that I help local businesses improve their website, local visibility, and lead capture system.

  I noticed one quick opportunity: ${websiteObservation}

  I wanted to ask: do you currently have someone helping you with your website or online marketing?

  If not, I can send you a free quick digital audit with a few improvement ideas.`,
        },
      };


  return messages;
}

// Textos que se le mandan al cliente: mensajes, secuencia de outreach,
// auditoría y propuesta. Español por defecto, inglés opcional por lead.

import {
  CARE_PLAN_FEATURES,
  OFFER,
  PACKAGE_FEATURES,
  formatPrice,
} from "./offer";

export const LANGUAGES = [
  { id: "es", label: "ES" },
  { id: "en", label: "EN" },
];

export function getLeadLanguage(lead) {
  return lead?.language === "en" ? "en" : "es";
}

// Rubros de Google Maps vienen en inglés y con variaciones ("Barber shop",
// "Mexican restaurant"). Los agrupamos por palabra clave.
const CATEGORY_RULES = [
  { key: "barbershop", match: /barber/i, es: "barbería", en: "barbershop" },
  {
    key: "salon",
    match: /beauty|salon|nail|spa|lash|brow|hair/i,
    es: "salón de belleza",
    en: "beauty salon",
  },
  {
    key: "cleaning",
    match: /clean|maid|janitor/i,
    es: "compañía de limpieza",
    en: "cleaning company",
  },
  {
    key: "restaurant",
    match: /restaurant|cafe|café|bakery|food|grill|pizza|taco|kitchen|bar\b/i,
    es: "restaurante",
    en: "restaurant",
  },
  {
    key: "dentist",
    match: /dent|orthodont/i,
    es: "consultorio dental",
    en: "dental office",
  },
  {
    key: "contractor",
    match: /contract|construct|roof|plumb|electric|remodel|hvac|paint/i,
    es: "contratista",
    en: "contractor",
  },
  {
    key: "realestate",
    match: /real estate|realtor|realty|property/i,
    es: "bienes raíces",
    en: "real estate",
  },
];

export function getCategoryKey(category = "") {
  return CATEGORY_RULES.find((rule) => rule.match.test(category))?.key || "default";
}

export function getCategoryLabel(category, lang) {
  const rule = CATEGORY_RULES.find((item) => item.match.test(category || ""));
  if (rule) return rule[lang];
  if (category) return category.toLowerCase();
  return lang === "es" ? "negocio" : "business";
}

function websiteObservation(lead, lang) {
  const es = {
    "No Website": "Vi que tu negocio todavía no tiene página web propia.",
    "Facebook Only":
      "Vi que tu negocio depende sobre todo de Facebook y no tiene página web propia.",
    "Old Website":
      "Vi que tu página web podría verse más moderna y funcionar mejor en el celular.",
    "Has Website":
      "Vi que tu página web podría traerte más clientes desde Google.",
  };
  const en = {
    "No Website": "I noticed your business doesn't have its own website yet.",
    "Facebook Only":
      "I noticed your business relies mostly on Facebook instead of its own website.",
    "Old Website":
      "I noticed your website could look more modern and work better on mobile.",
    "Has Website":
      "I noticed your website could be bringing you more customers from Google.",
  };
  const table = lang === "es" ? es : en;
  return table[lead.website] || table["Has Website"];
}

function reputationLine(lead, lang) {
  const rating = Number(lead.rating) || 0;
  const reviews = Number(lead.reviews) || 0;

  if (rating >= 4 && reviews > 0) {
    return lang === "es"
      ? `Tu negocio tiene muy buena reputación: ${rating} estrellas con ${reviews} reseñas en Google.`
      : `You have a great reputation: ${rating} stars from ${reviews} Google reviews.`;
  }

  return lang === "es"
    ? "Se nota que tu negocio tiene clientes fieles en la zona."
    : "It's clear you have loyal customers in the area.";
}

function signature(lang) {
  return lang === "es"
    ? `Saludos,\n${OFFER.ownerFirstName}\n${OFFER.agency} · Agencia web en Miami`
    : `Best,\n${OFFER.ownerFirstName}\n${OFFER.agency} · Miami web agency`;
}

// ---------------------------------------------------------------------------
// Mensaje rápido por canal (vista Messages → Contact Actions)
// ---------------------------------------------------------------------------

export const CONTACT_MODES = ["whatsapp", "email", "instagram", "call"];

export function buildContactMessage(lead, mode, lang) {
  if (!lead) return "";
  const name = lead.name;
  const observation = websiteObservation(lead, lang);
  const reputation = reputationLine(lead, lang);

  if (lang === "es") {
    if (mode === "email") {
      return `Subject: Una idea para ${name}

Hola, equipo de ${name}:

Encontré tu negocio en Google. ${reputation}

${observation} Muchos clientes buscan en el celular antes de llamar, y sin una buena página web terminan encontrando a la competencia.

En ${OFFER.agency} hacemos páginas web profesionales para negocios de Miami: ${formatPrice(OFFER.packagePrice)}, un solo pago, lista en ${OFFER.deliveryDays} días y la página es 100% tuya.

Te preparé una muestra de cómo podría verse tu página. ¿Te la mando?

${signature(lang)}`;
    }

    if (mode === "whatsapp") {
      return `¡Hola! 👋 Soy ${OFFER.ownerFirstName}, de ${OFFER.agency}, una agencia web aquí en Miami.

Encontré ${name} en Google. ${reputation}

${observation}

Te preparé una muestra gratis de cómo podría verse tu página web, sin compromiso. ¿Te la mando por aquí?`;
    }

    if (mode === "instagram") {
      return `¡Hola! Soy ${OFFER.ownerFirstName}, de ${OFFER.agency} (agencia web en Miami). ${reputation}

${observation}

Te preparé una muestra gratis de cómo podría verse tu página web. ¿Te la mando?`;
    }

    return `Guion de llamada para ${name}

Hola, buenos días. ¿Hablo con el dueño o encargado de ${name}?

Mi nombre es ${OFFER.ownerFirstName}, de ${OFFER.agency}, una agencia web aquí en Miami. Encontré tu negocio en Google y vi que tiene muy buenas reseñas.

${observation}

Te llamo porque te preparé una muestra de cómo podría verse tu página web, sin compromiso. ¿Ya tienes a alguien que te ayude con tu página o con Google?

[Si dice que no] Perfecto. ¿Te puedo mandar la muestra por WhatsApp a este número? Así la ves con calma.

[Si pregunta el precio] La página completa son ${formatPrice(OFFER.packagePrice)}, un solo pago. Incluye dominio y hosting el primer año y está lista en ${OFFER.deliveryDays} días.`;
  }

  if (mode === "email") {
    return `Subject: A quick idea for ${name}

Hi ${name} team,

I found your business on Google. ${reputation}

${observation} Most customers search on their phone before calling, and without a strong website they end up finding a competitor.

At ${OFFER.agency} we build professional websites for Miami businesses: ${formatPrice(OFFER.packagePrice)}, one payment, ready in ${OFFER.deliveryDays} days, and you own it.

I put together a preview of what your website could look like. Want me to send it?

${signature(lang)}`;
  }

  if (mode === "whatsapp") {
    return `Hi! 👋 I'm ${OFFER.ownerFirstName} from ${OFFER.agency}, a web agency here in Miami.

I found ${name} on Google. ${reputation}

${observation}

I made a free preview of what your website could look like, no strings attached. Want me to send it here?`;
  }

  if (mode === "instagram") {
    return `Hi! I'm ${OFFER.ownerFirstName} from ${OFFER.agency} (Miami web agency). ${reputation}

${observation}

I made a free preview of what your website could look like. Want me to send it?`;
  }

  return `Call script for ${name}

Hi, good morning. Am I speaking with the owner or manager of ${name}?

My name is ${OFFER.ownerFirstName} from ${OFFER.agency}, a web agency here in Miami. I found you on Google and saw your great reviews.

${observation}

I'm calling because I put together a free preview of what your website could look like. Do you already have someone helping you with your website or Google?

[If no] Great. Can I send you the preview on WhatsApp at this number so you can look at it?

[If they ask the price] The full website is ${formatPrice(OFFER.packagePrice)}, one payment. It includes domain and hosting for the first year and it's ready in ${OFFER.deliveryDays} days.`;
}

// ---------------------------------------------------------------------------
// Secuencia de outreach de 6 pasos
// ---------------------------------------------------------------------------

export const OUTREACH_STEPS = [
  { id: "whatsapp", es: "WhatsApp inicial", en: "Initial WhatsApp" },
  { id: "email", es: "Email inicial", en: "Initial Email" },
  { id: "instagram", es: "DM de Instagram", en: "Instagram DM" },
  { id: "followup1", es: "Seguimiento 1", en: "Follow-up 1" },
  { id: "followup2", es: "Seguimiento 2", en: "Follow-up 2" },
  { id: "call", es: "Guion de llamada", en: "Call Script" },
];

export function getOutreachStepLabel(stepId, lang) {
  const step = OUTREACH_STEPS.find((item) => item.id === stepId);
  return step ? step[lang] : stepId;
}

export function buildOutreachMessage(lead, stepId, lang) {
  if (!lead) return { title: "", body: "", channel: "" };
  const title = getOutreachStepLabel(stepId, lang);

  if (["whatsapp", "email", "instagram", "call"].includes(stepId)) {
    return { title, body: buildContactMessage(lead, stepId, lang), channel: stepId };
  }

  const name = lead.name;
  const categoryLabel = getCategoryLabel(lead.category, lang);
  const city = lead.city || "Miami";

  if (stepId === "followup1") {
    return {
      title,
      channel: "whatsapp",
      body:
        lang === "es"
          ? `Hola, ¿cómo estás? Te escribo de nuevo por la muestra de página web que preparé para ${name}.

La armé con tus datos reales para que veas cómo te encontrarían los clientes que buscan ${categoryLabel} en ${city} desde el celular.

¿Te la mando? Son 30 segundos verla.

${OFFER.ownerFirstName} · ${OFFER.agency}`
          : `Hi, how are you? Just following up on the website preview I made for ${name}.

I built it with your real business info so you can see how customers searching for a ${categoryLabel} in ${city} would find you on their phone.

Want me to send it? It takes 30 seconds to look at.

${OFFER.ownerFirstName} · ${OFFER.agency}`,
    };
  }

  return {
    title,
    channel: "whatsapp",
    body:
      lang === "es"
        ? `Hola, último mensaje de mi parte para no molestarte.

Si en algún momento quieres tu página web, el paquete completo es ${formatPrice(OFFER.packagePrice)} en un solo pago: hasta ${OFFER.maxPages} páginas, dominio y hosting gratis el primer año, y lista en ${OFFER.deliveryDays} días. La página queda 100% tuya.

La muestra de ${name} sigue aquí si la quieres ver. ¡Mucho éxito!

${OFFER.ownerFirstName} · ${OFFER.agency}`
        : `Hi, last message from me so I don't bother you.

If you ever want your website, the full package is ${formatPrice(OFFER.packagePrice)} one-time: up to ${OFFER.maxPages} pages, free domain and hosting for the first year, ready in ${OFFER.deliveryDays} days. You own it 100%.

The preview for ${name} is still here if you want to see it. Best of luck!

${OFFER.ownerFirstName} · ${OFFER.agency}`,
  };
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

// Devuelve el número en formato internacional (solo dígitos) o "".
export function getWhatsappNumber(lead) {
  const source = lead?.whatsapp || lead?.phone || "";
  const fromLink = source.match(/wa\.me\/(\d+)/i) || source.match(/phone=(\d+)/i);
  let digits = fromLink ? fromLink[1] : source.replace(/\D/g, "");

  if (digits.length === 10) digits = `1${digits}`; // número de EE. UU. sin código
  return digits.length >= 11 ? digits : "";
}

export function buildWhatsappUrl(number, text = "") {
  if (!number) return "";
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${number}${query}`;
}

// ---------------------------------------------------------------------------
// Auditoría
// ---------------------------------------------------------------------------

export function buildAudit(lead, lang, quality) {
  const observation = websiteObservation(lead, lang);
  const notFound = lang === "es" ? "No encontrado" : "Not found";
  const categoryLabel = getCategoryLabel(lead.category, lang);
  const city = lead.city || "Miami";
  const packageLines = PACKAGE_FEATURES[lang].map((item) => `- ${item}`).join("\n");

  if (lang === "es") {
    return `Auditoría de presencia digital: ${lead.name}

Rubro: ${categoryLabel}
Ciudad: ${city}
Dirección: ${lead.address || notFound}
Página web: ${lead.websiteUrl || notFound}
Google Maps: ${lead.googleMapsUrl || notFound}
Calificación: ${lead.rating} estrellas · ${lead.reviews} reseñas
Oportunidad: ${lead.opportunityScore}%
Calidad del lead: ${quality.label} (${quality.score}/100)
Seguimiento: ${lead.followUpDate || "Sin agendar"}

Problemas encontrados:
1. ${observation}
2. ${
      lead.email
        ? "Tiene email público: se puede contactar por correo."
        : lead.instagram
        ? "No tiene email público, pero se puede contactar por Instagram o teléfono."
        : "No tiene email ni Instagram públicos: lo mejor es WhatsApp o llamada."
    }
3. Los clientes que buscan ${categoryLabel} en ${city} desde el celular no encuentran una página clara con servicios, precios y botón para llamar.
4. Sin página propia, el negocio depende de redes sociales que no controla.

Lo que recomendamos:
1. Página web moderna, rápida y pensada para el celular.
2. Botón claro de "Llamar", "Escribir por WhatsApp" o "Reservar".
3. Servicios, fotos, ubicación con mapa y reseñas reales.
4. Configuración básica para aparecer en Google en ${city}.

Oferta ${OFFER.agency}:
Página web profesional: ${formatPrice(OFFER.packagePrice)}, un solo pago
${packageLines}

Mantenimiento opcional: ${formatPrice(OFFER.carePlanMonthly)}/mes

Siguiente paso:
Mandarle la página demo por WhatsApp y ofrecer una llamada de 10 minutos.`;
  }

  return `Digital presence audit: ${lead.name}

Category: ${categoryLabel}
City: ${city}
Address: ${lead.address || notFound}
Website: ${lead.websiteUrl || notFound}
Google Maps: ${lead.googleMapsUrl || notFound}
Rating: ${lead.rating} stars · ${lead.reviews} reviews
Opportunity: ${lead.opportunityScore}%
Lead quality: ${quality.label} (${quality.score}/100)
Follow-up: ${lead.followUpDate || "Not scheduled"}

Problems found:
1. ${observation}
2. ${
    lead.email
      ? "Public email available: email outreach is possible."
      : lead.instagram
      ? "No public email, but Instagram or phone outreach is possible."
      : "No public email or Instagram: WhatsApp or a call is the best option."
  }
3. Customers searching for a ${categoryLabel} in ${city} on their phone don't find a clear page with services, prices and a call button.
4. Without its own website, the business depends on social networks it doesn't control.

What we recommend:
1. A modern, fast, mobile-first website.
2. A clear "Call", "WhatsApp us" or "Book" button.
3. Services, photos, location with a map and real reviews.
4. Basic setup to show up on Google in ${city}.

${OFFER.agency} offer:
Professional website: ${formatPrice(OFFER.packagePrice)}, one payment
${packageLines}

Optional care plan: ${formatPrice(OFFER.carePlanMonthly)}/month

Next step:
Send the demo website on WhatsApp and offer a 10-minute call.`;
}

// ---------------------------------------------------------------------------
// Propuesta en PDF
// ---------------------------------------------------------------------------

export function buildProposalContent(lead, lang) {
  const categoryLabel = getCategoryLabel(lead.category, lang);
  const city = lead.city || "Miami";
  const observation = websiteObservation(lead, lang);

  if (lang === "es") {
    return {
      header: "Propuesta de página web",
      generated: "Fecha",
      labels: {
        category: "Rubro",
        location: "Ciudad",
        rating: "Google",
        ratingValue: `${lead.rating} estrellas · ${lead.reviews} reseñas`,
        website: "Página web actual",
        websiteValue:
          lead.websiteUrl ||
          {
            "No Website": "No tiene",
            "Facebook Only": "Solo Facebook",
            "Old Website": "Desactualizada",
            "Has Website": "Sí tiene",
          }[lead.website] ||
          lead.website,
      },
      sections: [
        {
          title: "1. Situación actual",
          bullets: [
            observation,
            `Los clientes que buscan ${categoryLabel} en ${city} comparan opciones en el celular antes de llamar.`,
            "Una página propia da confianza y no depende de las reglas de Facebook o Instagram.",
          ],
        },
        {
          title: "2. Lo que vamos a construir",
          bullets: [
            "Página principal con tu propuesta, servicios y botón para llamar o escribir por WhatsApp.",
            "Secciones de servicios, fotos, reseñas y ubicación con mapa.",
            "Diseño rápido y perfecto en el celular.",
            `Configuración básica para que te encuentren en Google en ${city}.`,
          ],
        },
      ],
      packageTitle: `3. Inversión: ${formatPrice(OFFER.packagePrice)}, un solo pago`,
      packageFeatures: PACKAGE_FEATURES.es,
      careTitle: `Mantenimiento opcional: ${formatPrice(OFFER.carePlanMonthly)}/mes`,
      careFeatures: CARE_PLAN_FEATURES.es,
      nextTitle: "4. Siguiente paso",
      nextText: `Para reservar tu fecha de entrega, haz el pago en este enlace seguro:\n${OFFER.paymentLink}\n\nDespués del pago te pido logo, fotos y textos, y en ${OFFER.deliveryDays} días tienes tu página lista.`,
      preparedBy: "Preparado por",
      tagline: "Páginas web · Google · Automatización",
    };
  }

  return {
    header: "Website proposal",
    generated: "Date",
    labels: {
      category: "Category",
      location: "City",
      rating: "Google",
      ratingValue: `${lead.rating} stars · ${lead.reviews} reviews`,
      website: "Current website",
      websiteValue: lead.websiteUrl || lead.website,
    },
    sections: [
      {
        title: "1. Current situation",
        bullets: [
          observation,
          `Customers looking for a ${categoryLabel} in ${city} compare options on their phone before calling.`,
          "Your own website builds trust and doesn't depend on Facebook or Instagram rules.",
        ],
      },
      {
        title: "2. What we will build",
        bullets: [
          "Home page with your offer, services and a call or WhatsApp button.",
          "Services, photos, reviews and location with a map.",
          "Fast design that looks perfect on mobile.",
          `Basic setup so customers find you on Google in ${city}.`,
        ],
      },
    ],
    packageTitle: `3. Investment: ${formatPrice(OFFER.packagePrice)}, one payment`,
    packageFeatures: PACKAGE_FEATURES.en,
    careTitle: `Optional care plan: ${formatPrice(OFFER.carePlanMonthly)}/month`,
    careFeatures: CARE_PLAN_FEATURES.en,
    nextTitle: "4. Next step",
    nextText: `To reserve your delivery date, pay through this secure link:\n${OFFER.paymentLink}\n\nAfter payment I'll ask for your logo, photos and texts, and your website is ready in ${OFFER.deliveryDays} days.`,
    preparedBy: "Prepared by",
    tagline: "Websites · Google · Automation",
  };
}

// Mensaje para mandar la página demo una vez generada.
export function buildDemoShareMessage(lead, lang, demoUrl = "") {
  const link = demoUrl ? `\n\n${demoUrl}` : "";
  return lang === "es"
    ? `¡Hola! Te preparé esta muestra de cómo podría verse la página web de ${lead.name}.${link}

Es solo una idea con tus datos de Google: colores, fotos y textos se cambian a tu gusto. La página completa son ${formatPrice(OFFER.packagePrice)}, un solo pago, y queda lista en ${OFFER.deliveryDays} días.

¿Qué te parece?`
    : `Hi! I made this preview of what the website for ${lead.name} could look like.${link}

It's just an idea using your Google info: colors, photos and texts can all be changed. The full website is ${formatPrice(OFFER.packagePrice)}, one payment, ready in ${OFFER.deliveryDays} days.

What do you think?`;
}

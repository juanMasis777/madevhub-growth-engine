// Genera una página web de muestra (un solo archivo HTML) con los datos
// reales del lead. Sirve de gancho: "te preparé cómo se vería tu página".

import { OFFER } from "./offer";
import {
  buildWhatsappUrl,
  getCategoryKey,
  getCategoryLabel,
  getWhatsappNumber,
} from "./templates";

const ICONS = {
  scissors:
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  sparkle:
    '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/>',
  star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  utensils:
    '<path d="M4 3v8a3 3 0 0 0 6 0V3M7 3v18M17 3c-2 2-3 4-3 7h3v11"/>',
  truck:
    '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  heart:
    '<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  map: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  phone:
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',
};

function icon(name, size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.star}</svg>`;
}

// Estilo y contenido por rubro.
const PRESETS = {
  barbershop: {
    font: "Bebas+Neue",
    display: "'Bebas Neue', sans-serif",
    displayCase: "uppercase",
    bg: "#111111",
    surface: "#1b1b1b",
    ink: "#f5f1e8",
    muted: "#b8b2a6",
    accent: "#c9a14a",
    accentInk: "#111111",
    dark: true,
    es: {
      headline: "Cortes que hablan por ti",
      sub: "Fades, barba y estilo clásico con la atención de siempre.",
      services: [
        ["scissors", "Corte clásico", "Tijera y máquina, a tu estilo."],
        ["sparkle", "Fade / Degradado", "Low, mid o high, bien definido."],
        ["star", "Barba y perfilado", "Toalla caliente y navaja."],
        ["heart", "Corte para niños", "Paciencia y buen trato."],
        ["clock", "Sin esperas", "Reserva tu turno por WhatsApp."],
        ["shield", "Higiene total", "Herramientas desinfectadas siempre."],
      ],
    },
    en: {
      headline: "Cuts that speak for you",
      sub: "Fades, beards and classic style with personal attention.",
      services: [
        ["scissors", "Classic cut", "Scissors and clippers, your style."],
        ["sparkle", "Fade", "Low, mid or high, sharp lines."],
        ["star", "Beard & line-up", "Hot towel and straight razor."],
        ["heart", "Kids' cuts", "Patient and friendly."],
        ["clock", "No waiting", "Book your spot on WhatsApp."],
        ["shield", "Spotless tools", "Everything disinfected, always."],
      ],
    },
  },
  salon: {
    font: "Playfair+Display:wght@500;700",
    display: "'Playfair Display', serif",
    displayCase: "none",
    bg: "#fbf6f3",
    surface: "#ffffff",
    ink: "#2b1d1f",
    muted: "#7a6466",
    accent: "#b5577a",
    accentInk: "#ffffff",
    dark: false,
    es: {
      headline: "Tu momento de verte y sentirte increíble",
      sub: "Cabello, uñas y belleza con manos expertas.",
      services: [
        ["scissors", "Corte y peinado", "Para el día a día o una ocasión especial."],
        ["sparkle", "Color y mechas", "Balayage, tintes y tonos naturales."],
        ["heart", "Uñas", "Manicure, pedicure, gel y acrílico."],
        ["star", "Tratamientos", "Keratina e hidratación profunda."],
        ["sparkle", "Cejas y pestañas", "Diseño, tinte y lifting."],
        ["clock", "Citas por WhatsApp", "Reserva en segundos."],
      ],
    },
    en: {
      headline: "Your time to look and feel amazing",
      sub: "Hair, nails and beauty by expert hands.",
      services: [
        ["scissors", "Cut & style", "Everyday looks or special occasions."],
        ["sparkle", "Color & highlights", "Balayage, dyes and natural tones."],
        ["heart", "Nails", "Manicure, pedicure, gel and acrylic."],
        ["star", "Treatments", "Keratin and deep conditioning."],
        ["sparkle", "Brows & lashes", "Shaping, tint and lifts."],
        ["clock", "Book on WhatsApp", "Reserve in seconds."],
      ],
    },
  },
  cleaning: {
    font: "Poppins:wght@600;700",
    display: "'Poppins', sans-serif",
    displayCase: "none",
    bg: "#f3f9fb",
    surface: "#ffffff",
    ink: "#0f2a36",
    muted: "#5b7380",
    accent: "#0e9aa7",
    accentInk: "#ffffff",
    dark: false,
    es: {
      headline: "Tu casa y tu oficina, impecables",
      sub: "Limpieza profesional, confiable y a tiempo.",
      services: [
        ["home", "Limpieza de casas", "Semanal, quincenal o una sola vez."],
        ["sparkle", "Limpieza profunda", "Cocina, baños y cada rincón."],
        ["truck", "Mudanzas", "Entrada y salida de apartamentos."],
        ["shield", "Oficinas", "Espacios limpios para tu equipo."],
        ["star", "Post-construcción", "Retiramos polvo y residuos."],
        ["clock", "Cotización rápida", "Te respondemos el mismo día."],
      ],
    },
    en: {
      headline: "Your home and office, spotless",
      sub: "Professional, reliable and on-time cleaning.",
      services: [
        ["home", "House cleaning", "Weekly, biweekly or one-time."],
        ["sparkle", "Deep cleaning", "Kitchen, bathrooms and every corner."],
        ["truck", "Move in / out", "Apartments ready for keys."],
        ["shield", "Offices", "Clean spaces for your team."],
        ["star", "Post-construction", "Dust and debris removed."],
        ["clock", "Fast quotes", "Same-day response."],
      ],
    },
  },
  restaurant: {
    font: "Fraunces:opsz,wght@9..144,600;9..144,800",
    display: "'Fraunces', serif",
    displayCase: "none",
    bg: "#fff8ef",
    surface: "#ffffff",
    ink: "#2a1a10",
    muted: "#7b6250",
    accent: "#c2410c",
    accentInk: "#ffffff",
    dark: false,
    es: {
      headline: "Sabor de casa, todos los días",
      sub: "Comida hecha con cariño, para comer aquí o llevar.",
      services: [
        ["utensils", "Menú del día", "Platos frescos y caseros."],
        ["truck", "Para llevar y delivery", "Pide por teléfono o WhatsApp."],
        ["heart", "Catering", "Fiestas, oficinas y eventos."],
        ["star", "Especialidades", "Los platos que nos hicieron famosos."],
        ["clock", "Horario amplio", "Desayuno, almuerzo y cena."],
        ["map", "Fácil de llegar", "Estacionamiento cerca."],
      ],
    },
    en: {
      headline: "Home-style flavor, every day",
      sub: "Food made with love, dine in or take out.",
      services: [
        ["utensils", "Daily menu", "Fresh, home-cooked plates."],
        ["truck", "Takeout & delivery", "Order by phone or WhatsApp."],
        ["heart", "Catering", "Parties, offices and events."],
        ["star", "House specials", "The dishes we're known for."],
        ["clock", "Open long hours", "Breakfast, lunch and dinner."],
        ["map", "Easy to reach", "Parking nearby."],
      ],
    },
  },
  dentist: {
    font: "Manrope:wght@700;800",
    display: "'Manrope', sans-serif",
    displayCase: "none",
    bg: "#f4f8fc",
    surface: "#ffffff",
    ink: "#0f2238",
    muted: "#5a6b80",
    accent: "#2563eb",
    accentInk: "#ffffff",
    dark: false,
    es: {
      headline: "Sonrisas sanas, atención cercana",
      sub: "Odontología para toda la familia, en tu idioma.",
      services: [
        ["shield", "Limpieza y chequeo", "Prevención para toda la familia."],
        ["sparkle", "Blanqueamiento", "Una sonrisa más brillante."],
        ["star", "Ortodoncia", "Brackets y alineadores."],
        ["heart", "Odontopediatría", "Niños tranquilos y felices."],
        ["tool", "Implantes y coronas", "Recupera tu sonrisa."],
        ["clock", "Emergencias", "Te atendemos lo antes posible."],
      ],
    },
    en: {
      headline: "Healthy smiles, personal care",
      sub: "Dentistry for the whole family.",
      services: [
        ["shield", "Cleanings & checkups", "Prevention for everyone."],
        ["sparkle", "Whitening", "A brighter smile."],
        ["star", "Orthodontics", "Braces and aligners."],
        ["heart", "Kids' dentistry", "Calm, happy kids."],
        ["tool", "Implants & crowns", "Get your smile back."],
        ["clock", "Emergencies", "Seen as soon as possible."],
      ],
    },
  },
  contractor: {
    font: "Archivo:wght@700;800",
    display: "'Archivo', sans-serif",
    displayCase: "none",
    bg: "#f6f5f2",
    surface: "#ffffff",
    ink: "#1c1c1a",
    muted: "#6b6a64",
    accent: "#e29d0b",
    accentInk: "#1c1c1a",
    dark: false,
    es: {
      headline: "Trabajo bien hecho, a tiempo y con garantía",
      sub: "Remodelaciones y reparaciones con licencia y seguro.",
      services: [
        ["home", "Remodelaciones", "Cocinas, baños y más."],
        ["tool", "Reparaciones", "Rápidas y bien hechas."],
        ["shield", "Techos", "Inspección y reparación."],
        ["star", "Pisos y pintura", "Acabados que duran."],
        ["clock", "Presupuesto gratis", "Visitamos tu propiedad."],
        ["key", "Proyectos comerciales", "Locales y oficinas."],
      ],
    },
    en: {
      headline: "Quality work, on time and guaranteed",
      sub: "Licensed and insured remodeling and repairs.",
      services: [
        ["home", "Remodeling", "Kitchens, bathrooms and more."],
        ["tool", "Repairs", "Fast and done right."],
        ["shield", "Roofing", "Inspection and repair."],
        ["star", "Floors & paint", "Finishes that last."],
        ["clock", "Free estimates", "We visit your property."],
        ["key", "Commercial", "Stores and offices."],
      ],
    },
  },
  realestate: {
    font: "Cormorant+Garamond:wght@600;700",
    display: "'Cormorant Garamond', serif",
    displayCase: "none",
    bg: "#f7f6f3",
    surface: "#ffffff",
    ink: "#1d2424",
    muted: "#677070",
    accent: "#0f5b4f",
    accentInk: "#ffffff",
    dark: false,
    es: {
      headline: "Encontremos el lugar perfecto para ti",
      sub: "Compra, venta y renta con un asesor que habla tu idioma.",
      services: [
        ["key", "Comprar casa", "Te acompañamos en cada paso."],
        ["home", "Vender tu propiedad", "Al mejor precio del mercado."],
        ["map", "Rentas", "Apartamentos y casas en la zona."],
        ["star", "Inversión", "Propiedades con buen retorno."],
        ["shield", "Primera vivienda", "Programas y asesoría."],
        ["clock", "Respuesta rápida", "Escríbenos por WhatsApp."],
      ],
    },
    en: {
      headline: "Let's find the perfect place for you",
      sub: "Buying, selling and renting with a trusted advisor.",
      services: [
        ["key", "Buy a home", "We guide you every step."],
        ["home", "Sell your property", "Top market price."],
        ["map", "Rentals", "Apartments and homes nearby."],
        ["star", "Investment", "Properties with strong returns."],
        ["shield", "First-time buyers", "Programs and guidance."],
        ["clock", "Fast response", "Message us on WhatsApp."],
      ],
    },
  },
  default: {
    font: "Sora:wght@600;700",
    display: "'Sora', sans-serif",
    displayCase: "none",
    bg: "#f5f7fa",
    surface: "#ffffff",
    ink: "#111827",
    muted: "#5f6b7a",
    accent: "#6c5ce7",
    accentInk: "#ffffff",
    dark: false,
    es: {
      headline: "El servicio que tu familia merece",
      sub: "Atención personal y resultados que se notan.",
      services: [
        ["star", "Servicio principal", "Lo que mejor hacemos."],
        ["shield", "Calidad garantizada", "Clientes que regresan."],
        ["clock", "Respuesta rápida", "Te atendemos el mismo día."],
        ["heart", "Trato familiar", "Te conocemos por tu nombre."],
        ["map", "En tu zona", "Cerca de ti."],
        ["chat", "Hablamos tu idioma", "Español e inglés."],
      ],
    },
    en: {
      headline: "The service your family deserves",
      sub: "Personal attention and results you can see.",
      services: [
        ["star", "Main service", "What we do best."],
        ["shield", "Quality guaranteed", "Customers who come back."],
        ["clock", "Fast response", "Same-day service."],
        ["heart", "Personal touch", "We know you by name."],
        ["map", "Local", "Right in your area."],
        ["chat", "Bilingual", "Spanish and English."],
      ],
    },
  },
};

const COPY = {
  es: {
    lang: "es",
    preview: "Vista previa · Diseño de muestra creado por",
    call: "Llamar",
    whatsapp: "WhatsApp",
    contact: "Contáctanos",
    services: "Nuestros servicios",
    servicesSub: "Todo lo que necesitas en un solo lugar.",
    why: "Por qué nos eligen",
    reviews: "reseñas en Google",
    seeReviews: "Ver reseñas en Google",
    visit: "Visítanos",
    ctaTitle: "¿Listo para empezar?",
    ctaSub: "Escríbenos o llámanos. Te respondemos hoy mismo.",
    whyItems: (lead, label) => [
      [
        "star",
        "Clientes felices",
        Number(lead.reviews) > 0
          ? `${lead.reviews} reseñas y ${lead.rating} estrellas en Google.`
          : "La confianza de nuestros vecinos.",
      ],
      ["map", `${label.charAt(0).toUpperCase()}${label.slice(1)} local`, `Orgullosamente en ${lead.city || "Miami"}.`],
      ["chat", "Hablamos tu idioma", "Te atendemos en español e inglés."],
    ],
    rights: "Todos los derechos reservados.",
  },
  en: {
    lang: "en",
    preview: "Preview · Sample design created by",
    call: "Call",
    whatsapp: "WhatsApp",
    contact: "Contact us",
    services: "Our services",
    servicesSub: "Everything you need in one place.",
    why: "Why customers choose us",
    reviews: "Google reviews",
    seeReviews: "See reviews on Google",
    visit: "Visit us",
    ctaTitle: "Ready to get started?",
    ctaSub: "Message or call us. We'll reply today.",
    whyItems: (lead, label) => [
      [
        "star",
        "Happy customers",
        Number(lead.reviews) > 0
          ? `${lead.reviews} reviews and ${lead.rating} stars on Google.`
          : "Trusted by our neighbors.",
      ],
      ["map", `Local ${label}`, `Proudly serving ${lead.city || "Miami"}.`],
      ["chat", "Bilingual", "We speak English and Spanish."],
    ],
    rights: "All rights reserved.",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stars(rating) {
  const full = Math.round(Number(rating) || 0);
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

export function buildDemoSiteHtml(lead, lang = "es") {
  const preset = PRESETS[getCategoryKey(lead.category)] || PRESETS.default;
  const copy = COPY[lang] || COPY.es;
  const content = preset[lang] || preset.es;
  const categoryLabel = getCategoryLabel(lead.category, lang);

  const name = escapeHtml(lead.name || "Tu negocio");
  const city = escapeHtml(lead.city || "Miami");
  const phone = (lead.phone || "").trim();
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#contacto";
  const waNumber = getWhatsappNumber(lead);
  const waGreeting =
    lang === "es"
      ? `Hola ${lead.name}, vi su página web y quiero información.`
      : `Hi ${lead.name}, I saw your website and would like more info.`;
  const waHref = waNumber ? buildWhatsappUrl(waNumber, waGreeting) : "";
  const address = (lead.address || "").trim();
  const mapQuery = encodeURIComponent(address || `${lead.name} ${lead.city || ""}`);
  const rating = Number(lead.rating) || 0;
  const reviews = Number(lead.reviews) || 0;
  const year = new Date().getFullYear();

  const callButton = phone
    ? `<a class="btn btn-primary" href="${escapeHtml(telHref)}">${icon("phone", 18)} ${copy.call}</a>`
    : `<a class="btn btn-primary" href="#contacto">${copy.contact}</a>`;
  const waButton = waHref
    ? `<a class="btn btn-ghost" href="${escapeHtml(waHref)}" target="_blank" rel="noopener">${icon("chat", 18)} ${copy.whatsapp}</a>`
    : "";

  const servicesHtml = content.services
    .map(
      ([ico, title, text]) => `
        <article class="service">
          <div class="service-icon">${icon(ico)}</div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(text)}</p>
        </article>`
    )
    .join("");

  const whyHtml = copy
    .whyItems(lead, categoryLabel)
    .map(
      ([ico, title, text]) => `
        <div class="why-item">
          <div class="why-icon">${icon(ico)}</div>
          <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>
        </div>`
    )
    .join("");

  const ratingBadge =
    rating > 0
      ? `<div class="rating"><span class="stars">${stars(rating)}</span><strong>${rating.toFixed(1)}</strong><span>· ${reviews} ${copy.reviews}</span></div>`
      : "";

  const reviewsLink = lead.googleMapsUrl
    ? `<a class="text-link" href="${escapeHtml(lead.googleMapsUrl)}" target="_blank" rel="noopener">${copy.seeReviews} →</a>`
    : "";

  const agencyLink = OFFER.website
    ? `<a href="${escapeHtml(OFFER.website)}" target="_blank" rel="noopener">${OFFER.agency}</a>`
    : OFFER.agency;

  return `<!doctype html>
<html lang="${copy.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} · ${city}</title>
<meta name="description" content="${escapeHtml(content.sub)} ${city}.">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${preset.font}&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:${preset.bg};--surface:${preset.surface};--ink:${preset.ink};--muted:${preset.muted};--accent:${preset.accent};--accent-ink:${preset.accentInk};--line:${preset.dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.08)"};--display:${preset.display}}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.preview-bar{background:#0b0b12;color:#e8e8f0;font-size:12.5px;text-align:center;padding:8px 16px;letter-spacing:.01em}
.preview-bar a{color:#a99bff;font-weight:600}
header{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;height:68px;gap:16px}
.brand{font-family:var(--display);font-size:24px;text-transform:${preset.displayCase};letter-spacing:${preset.displayCase === "uppercase" ? ".04em" : "-.01em"};font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nav-links{display:flex;gap:28px;font-size:14.5px;color:var(--muted)}
.nav-links a:hover{color:var(--ink)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:999px;font-weight:600;font-size:15px;transition:transform .15s,box-shadow .15s;white-space:nowrap}
.btn:hover{transform:translateY(-1px)}
.btn-primary{background:var(--accent);color:var(--accent-ink);box-shadow:0 8px 24px -10px var(--accent)}
.btn-ghost{border:1.5px solid var(--line);background:var(--surface)}
.btn-sm{padding:9px 16px;font-size:14px}
.hero{position:relative;overflow:hidden;padding:96px 0 88px}
.hero::before{content:"";position:absolute;inset:-30% -10% auto auto;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 28%,transparent),transparent 65%);pointer-events:none}
.eyebrow{display:inline-block;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:18px}
.hero h1{font-family:var(--display);font-size:clamp(42px,7vw,80px);line-height:1.02;letter-spacing:${preset.displayCase === "uppercase" ? ".01em" : "-.02em"};text-transform:${preset.displayCase};max-width:13ch;font-weight:700}
.hero p.lead{font-size:clamp(17px,2vw,20px);color:var(--muted);max-width:46ch;margin:22px 0 32px}
.hero-actions{display:flex;flex-wrap:wrap;gap:12px}
.rating{display:inline-flex;align-items:center;gap:8px;margin-top:30px;padding:10px 16px;background:var(--surface);border:1px solid var(--line);border-radius:999px;font-size:14px;color:var(--muted)}
.rating .stars{color:#f5b301;letter-spacing:1px}
.rating strong{color:var(--ink)}
section{padding:84px 0}
.section-head{max-width:620px;margin-bottom:44px}
.section-head h2{font-family:var(--display);font-size:clamp(32px,4.4vw,48px);line-height:1.1;text-transform:${preset.displayCase};letter-spacing:${preset.displayCase === "uppercase" ? ".02em" : "-.015em"};font-weight:700}
.section-head p{color:var(--muted);margin-top:10px;font-size:17px}
.services{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.service{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:28px;transition:transform .2s,border-color .2s}
.service:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
.service-icon,.why-icon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);margin-bottom:18px}
.service h3,.why-item h3{font-size:18px;margin-bottom:6px}
.service p,.why-item p{color:var(--muted);font-size:15px}
.why{background:var(--surface);border-block:1px solid var(--line)}
.why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.why-item{display:flex;gap:16px}
.why-item .why-icon{flex:none;margin:0}
.visit-grid{display:grid;grid-template-columns:1fr 1.3fr;gap:28px;align-items:stretch}
.visit-card{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:30px;display:flex;flex-direction:column;gap:18px}
.visit-row{display:flex;gap:12px;align-items:flex-start;color:var(--muted)}
.visit-row svg{color:var(--accent);flex:none;margin-top:3px}
.visit-row strong{display:block;color:var(--ink)}
.text-link{color:var(--accent);font-weight:600;font-size:15px}
.map{border-radius:20px;overflow:hidden;border:1px solid var(--line);min-height:320px;background:var(--surface)}
.map iframe{width:100%;height:100%;min-height:320px;border:0;display:block}
.cta{background:var(--accent);color:var(--accent-ink);border-radius:28px;padding:56px 40px;text-align:center}
.cta h2{font-family:var(--display);font-size:clamp(32px,4.4vw,48px);text-transform:${preset.displayCase};line-height:1.1}
.cta p{opacity:.85;margin:12px 0 28px;font-size:17px}
.cta .btn-primary{background:var(--accent-ink);color:var(--accent);box-shadow:none}
.cta .btn-ghost{background:transparent;border-color:currentColor;color:var(--accent-ink)}
.cta .hero-actions{justify-content:center}
footer{padding:36px 0 110px;color:var(--muted);font-size:14px;text-align:center}
.mobile-bar{display:none}
@media (max-width:860px){
  .nav-links{display:none}
  .services,.why-grid{grid-template-columns:1fr 1fr}
  .visit-grid{grid-template-columns:1fr}
}
@media (max-width:560px){
  .hero{padding:64px 0 56px}
  section{padding:60px 0}
  .services,.why-grid{grid-template-columns:1fr}
  .nav .btn{display:none}
  .cta{padding:42px 22px;border-radius:22px}
  .mobile-bar{display:flex;position:fixed;left:12px;right:12px;bottom:12px;z-index:30;gap:10px;padding:10px;background:var(--surface);border:1px solid var(--line);border-radius:999px;box-shadow:0 12px 30px -12px rgba(0,0,0,.35)}
  .mobile-bar .btn{flex:1;padding:12px}
}
</style>
</head>
<body>
<div class="preview-bar">${copy.preview} ${agencyLink}</div>
<header>
  <div class="wrap nav">
    <a class="brand" href="#">${name}</a>
    <nav class="nav-links"><a href="#servicios">${copy.services}</a><a href="#nosotros">${copy.why}</a><a href="#contacto">${copy.visit}</a></nav>
    ${phone ? `<a class="btn btn-primary btn-sm" href="${escapeHtml(telHref)}">${icon("phone", 16)} ${escapeHtml(phone)}</a>` : ""}
  </div>
</header>

<main>
  <section class="hero">
    <div class="wrap">
      <span class="eyebrow">${escapeHtml(categoryLabel)} · ${city}</span>
      <h1>${escapeHtml(content.headline)}</h1>
      <p class="lead">${escapeHtml(content.sub)}</p>
      <div class="hero-actions">${callButton}${waButton}</div>
      ${ratingBadge}
    </div>
  </section>

  <section id="servicios">
    <div class="wrap">
      <div class="section-head"><h2>${copy.services}</h2><p>${copy.servicesSub}</p></div>
      <div class="services">${servicesHtml}</div>
    </div>
  </section>

  <section class="why" id="nosotros">
    <div class="wrap">
      <div class="section-head"><h2>${copy.why}</h2></div>
      <div class="why-grid">${whyHtml}</div>
    </div>
  </section>

  <section id="contacto">
    <div class="wrap">
      <div class="section-head"><h2>${copy.visit}</h2></div>
      <div class="visit-grid">
        <div class="visit-card">
          <div class="visit-row">${icon("map", 20)}<div><strong>${name}</strong>${escapeHtml(address || lead.city || "Miami")}</div></div>
          ${phone ? `<div class="visit-row">${icon("phone", 20)}<div><strong>${copy.call}</strong><a href="${escapeHtml(telHref)}">${escapeHtml(phone)}</a></div></div>` : ""}
          ${ratingBadge ? `<div class="visit-row">${icon("star", 20)}<div><strong>${rating.toFixed(1)} / 5</strong>${reviews} ${copy.reviews}</div></div>` : ""}
          ${reviewsLink}
        </div>
        <div class="map"><iframe title="Mapa" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${mapQuery}&output=embed"></iframe></div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="cta">
        <h2>${copy.ctaTitle}</h2>
        <p>${copy.ctaSub}</p>
        <div class="hero-actions">${callButton}${waButton}</div>
      </div>
    </div>
  </section>
</main>

<footer><div class="wrap">© ${year} ${name} · ${city}. ${copy.rights}</div></footer>

<div class="mobile-bar">${callButton}${waButton}</div>
</body>
</html>`;
}

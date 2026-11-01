// Oferta comercial de MADEVHUB. Todo lo que muestra precios (auditoría,
// propuesta PDF, mensajes y página demo) lee de aquí, para que un cambio de
// precio se haga en un solo lugar.

export const OFFER = {
  agency: "MADEVHUB",
  owner: "Juan Masis",
  ownerFirstName: "Juan",
  website: "https://madevhub.com",
  // Link de pago del paquete (Stripe). Se puede cambiar con VITE_PAYMENT_LINK.
  paymentLink:
    import.meta.env.VITE_PAYMENT_LINK ||
    "https://buy.stripe.com/00wcN7fDg7Vc19z71k1wY0a",

  packagePrice: 697,
  carePlanMonthly: 97,
  maxPages: 4,
  deliveryDays: 10,
  revisionRounds: 3,
};

export const PACKAGE_FEATURES = {
  es: [
    `Hasta ${OFFER.maxPages} páginas con diseño a la medida (no plantilla)`,
    "Dominio y hosting GRATIS el primer año",
    "Se ve perfecta en el celular",
    "Hecha para que te encuentren en Google",
    `${OFFER.revisionRounds} rondas de revisiones`,
    `Lista en ${OFFER.deliveryDays} días`,
    "La página es 100% tuya, sin mensualidades obligatorias",
  ],
  en: [
    `Up to ${OFFER.maxPages} custom-designed pages (no templates)`,
    "FREE domain and hosting for the first year",
    "Looks perfect on mobile",
    "Built so customers find you on Google",
    `${OFFER.revisionRounds} rounds of revisions`,
    `Ready in ${OFFER.deliveryDays} days`,
    "You own 100% of the site, no required monthly fees",
  ],
};

export const CARE_PLAN_FEATURES = {
  es: [
    "Cambios pequeños de texto, fotos y precios",
    "Monitoreo y copias de seguridad",
    "Soporte directo por WhatsApp",
  ],
  en: [
    "Small text, photo and price updates",
    "Monitoring and backups",
    "Direct support on WhatsApp",
  ],
};

export function formatPrice(amount) {
  return `$${amount.toLocaleString("en-US")}`;
}

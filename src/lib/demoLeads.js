// ============================================================
// Sample data for the public demo.
//
// The CRM keeps everything in localStorage, so a first-time visitor would
// otherwise land on an empty dashboard with nothing to click. These leads
// seed a realistic pipeline instead: every Today's Action Plan group has
// something in it, the metrics are non-zero, and audits, messages and PDF
// export all have a business to run against.
//
// They are fictional. Names, phones, emails and sites do not belong to real
// businesses. Every one carries `isDemo: true`, which is what the banner
// keys off and what "Clear demo data" removes.
// ============================================================

// Follow-up dates are generated relative to today, so the demo still shows
// an overdue item and a due-today item however long after release it runs.
function dateKeyOffsetByDays(dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function note(text, dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);

  return {
    id: `demo-note-${text.slice(0, 12).replace(/\W+/g, "-")}-${dayOffset}`,
    text,
    date: date.toLocaleString(),
  };
}

const DEMO_LEAD_SEEDS = [
  {
    id: "demo-ocean-drive-barbers",
    name: "Ocean Drive Barbers",
    city: "Miami",
    category: "Barbershop",
    website: "No Website",
    websiteUrl: "",
    phone: "(305) 555-0142",
    email: "hello@oceandrivebarbers.example",
    instagram: "https://instagram.com/oceandrivebarbers",
    rating: 4.8,
    reviews: 312,
    opportunityScore: 95,
    status: "New",
    address: "1120 Ocean Dr, Miami Beach, FL",
    notes: [],
    followUpDate: "",
  },
  {
    id: "demo-little-havana-dental",
    name: "Little Havana Dental Care",
    city: "Miami",
    category: "Dental Clinic",
    website: "No Website",
    websiteUrl: "",
    phone: "(305) 555-0198",
    email: "frontdesk@lhdentalcare.example",
    instagram: "",
    rating: 4.9,
    reviews: 207,
    opportunityScore: 95,
    status: "New",
    address: "1455 SW 8th St, Miami, FL",
    notes: [],
    followUpDate: "",
  },
  {
    id: "demo-wynwood-nails",
    name: "Wynwood Nails & Spa",
    city: "Miami",
    category: "Beauty Salon",
    website: "Facebook Only",
    websiteUrl: "",
    phone: "(305) 555-0177",
    email: "",
    instagram: "https://instagram.com/wynwoodnailsspa",
    facebook: "https://facebook.com/wynwoodnailsspa",
    rating: 4.7,
    reviews: 189,
    opportunityScore: 90,
    status: "New",
    address: "2250 NW 2nd Ave, Miami, FL",
    notes: [],
    followUpDate: "",
  },
  {
    id: "demo-coral-gables-fitness",
    name: "Coral Gables Fitness Club",
    city: "Miami",
    category: "Fitness",
    website: "Old Website",
    websiteUrl: "https://coralgablesfitness.example",
    phone: "(305) 555-0123",
    email: "info@coralgablesfitness.example",
    instagram: "https://instagram.com/cgfitnessclub",
    rating: 4.5,
    reviews: 143,
    opportunityScore: 82,
    status: "Contacted",
    address: "2800 Ponce de Leon Blvd, Coral Gables, FL",
    notes: [note("Sent the initial email. No reply yet.", -4)],
    followUpDate: "",
  },
  {
    id: "demo-brickell-thai",
    name: "Brickell Thai Kitchen",
    city: "Miami",
    category: "Restaurant",
    website: "Facebook Only",
    websiteUrl: "",
    phone: "(305) 555-0164",
    email: "orders@brickellthai.example",
    instagram: "https://instagram.com/brickellthaikitchen",
    rating: 4.6,
    reviews: 421,
    opportunityScore: 90,
    status: "Interested",
    address: "1101 Brickell Ave, Miami, FL",
    notes: [
      note("Replied on Instagram — wants to see pricing.", -2),
      note("Asked about online ordering too.", -2),
    ],
    followUpDate: "",
  },
  {
    id: "demo-doral-auto-detailing",
    name: "Doral Auto Detailing",
    city: "Miami",
    category: "Auto Services",
    website: "No Website",
    websiteUrl: "",
    phone: "(305) 555-0115",
    email: "book@doralautodetail.example",
    instagram: "",
    rating: 4.4,
    reviews: 96,
    opportunityScore: 95,
    status: "Contacted",
    address: "8300 NW 36th St, Doral, FL",
    notes: [note("Called, left a voicemail. Try again this week.", -6)],
    followUpDate: dateKeyOffsetByDays(-2),
  },
  {
    id: "demo-sunset-cleaning",
    name: "Sunset Cleaning Co.",
    city: "Miami",
    category: "Cleaning Company",
    website: "No Website",
    websiteUrl: "",
    phone: "(305) 555-0109",
    email: "hello@sunsetcleaningco.example",
    instagram: "https://instagram.com/sunsetcleaningco",
    rating: 4.9,
    reviews: 158,
    opportunityScore: 95,
    status: "Proposal Sent",
    address: "7300 SW 57th Ct, South Miami, FL",
    notes: [
      note("Sent the $899 starter site proposal.", -3),
      note("Owner asked to review it with her partner.", -1),
    ],
    followUpDate: dateKeyOffsetByDays(0),
  },
  {
    id: "demo-kendall-pet-grooming",
    name: "Kendall Pet Grooming",
    city: "Miami",
    category: "Pet Services",
    website: "Old Website",
    websiteUrl: "https://kendallpetgrooming.example",
    phone: "(305) 555-0188",
    email: "care@kendallpetgrooming.example",
    instagram: "https://instagram.com/kendallpetgrooming",
    rating: 4.7,
    reviews: 264,
    opportunityScore: 82,
    status: "Proposal Sent",
    address: "12200 N Kendall Dr, Miami, FL",
    notes: [note("Proposal sent with the booking add-on.", -5)],
    followUpDate: dateKeyOffsetByDays(3),
  },
  {
    id: "demo-south-beach-yoga",
    name: "South Beach Yoga Studio",
    city: "Miami",
    category: "Fitness",
    website: "Old Website",
    websiteUrl: "https://southbeachyoga.example",
    phone: "(305) 555-0151",
    email: "studio@southbeachyoga.example",
    instagram: "https://instagram.com/southbeachyogastudio",
    rating: 4.6,
    reviews: 118,
    opportunityScore: 82,
    status: "New",
    address: "1680 Meridian Ave, Miami Beach, FL",
    notes: [],
    followUpDate: "",
  },
  {
    id: "demo-hialeah-tire",
    name: "Hialeah Tire & Brakes",
    city: "Miami",
    category: "Auto Services",
    website: "No Website",
    websiteUrl: "",
    phone: "(305) 555-0133",
    email: "",
    instagram: "",
    rating: 4.1,
    reviews: 47,
    opportunityScore: 95,
    status: "New",
    address: "900 E 25th St, Hialeah, FL",
    notes: [],
    followUpDate: "",
  },
  {
    id: "demo-aventura-law",
    name: "Aventura Law Office",
    city: "Miami",
    category: "Professional Services",
    website: "No Website",
    websiteUrl: "",
    phone: "(305) 555-0172",
    email: "contact@aventuralawoffice.example",
    instagram: "",
    rating: 4.8,
    reviews: 76,
    opportunityScore: 95,
    status: "Closed",
    address: "20900 NE 30th Ave, Aventura, FL",
    notes: [note("Closed — $1,400 site + monthly care plan.", -9)],
    followUpDate: "",
  },
  {
    id: "demo-pinecrest-bakery",
    name: "Pinecrest Bakery House",
    city: "Miami",
    category: "Restaurant",
    website: "Has Website",
    websiteUrl: "https://pinecrestbakeryhouse.example",
    phone: "(305) 555-0160",
    email: "hello@pinecrestbakeryhouse.example",
    instagram: "",
    rating: 4.3,
    reviews: 388,
    opportunityScore: 70,
    status: "Lost",
    address: "12590 S Dixie Hwy, Pinecrest, FL",
    notes: [note("Just rebuilt their site with an agency. Revisit in 2026.", -12)],
    followUpDate: "",
  },
];

// Fill in the fields every lead is expected to carry, so demo leads behave
// exactly like scraped ones everywhere in the app.
export const DEMO_LEADS = DEMO_LEAD_SEEDS.map((lead) => ({
  websiteUrl: "",
  phone: "",
  email: "",
  instagram: "",
  facebook: "",
  linkedin: "",
  twitter: "",
  youtube: "",
  whatsapp: "",
  address: "",
  googleMapsUrl: "",
  notes: [],
  followUpDate: "",
  proposalSentDate: "",
  ...lead,
  isDemo: true,
}));

export function isDemoLead(lead) {
  return Boolean(lead?.isDemo);
}

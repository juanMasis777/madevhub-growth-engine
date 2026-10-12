// ============================================================
// Static configuration shared across the app: storage keys, safe-mode
// defaults, pipeline stages, navigation and per-view copy.
// ============================================================

export const STORAGE_KEYS = {
  leads: "madevhub_growth_engine_leads",
  activityLog: "madevhub_growth_engine_activity_log",
};

export const SAFE_MODE_CONFIG = {
  enabled: true,
  singleCityEmailLimit: 3,
  allUsaEmailLimit: 5,
  normalSearchLimit: 8,
  allUsaNormalSearchLimit: 12,
};

export const CITY_OPTIONS = [
  "Miami",
  "All USA",
  "Orlando",
  "Tampa",
  "Atlanta",
  "Dallas",
  "Houston",
  "Austin",
  "New York",
  "Los Angeles",
  "Chicago",
  "Phoenix",
  "Las Vegas",
  "Denver",
  "Seattle",
  "Boston",
  "San Diego",
  "Nashville",
  "Charlotte",
  "Raleigh",
  "Washington DC",
];

export const VIEW_META = {
  dashboard: {
    title: "Welcome back, Juan 👋",
    subtitle: "Find local businesses that need websites and automation.",
  },
  search: {
    title: "Search Leads",
    subtitle: "Discover businesses with weak online presence, ready to close.",
  },
  leads: {
    title: "Businesses",
    subtitle: "Your full lead list. Select a business to work it.",
  },
  audits: {
    title: "AI Audits",
    subtitle: "Generate a digital-presence audit and proposal.",
  },
  messages: {
    title: "Outreach",
    subtitle: "Craft and send the perfect first message.",
  },
  pipeline: {
    title: "Pipeline",
    subtitle: "Move leads from New to Closed and track follow-ups.",
  },
  settings: {
    title: "Settings",
    subtitle: "Manage this lead, your data, and app preferences.",
  },
};

export const PIPELINE_STAGES = [
  "New",
  "Contacted",
  "Interested",
  "Proposal Sent",
  "Closed",
  "Lost",
];

export const emptyLeadForm = {
  name: "",
  city: "Miami",
  category: "Barbershop",
  website: "No Website",
  phone: "",
  email: "",
  instagram: "",
  rating: "4.5",
  reviews: "0",
  opportunityScore: "90",
};

export const OUTREACH_STEPS = [
  { id: "email", label: "Initial Email" },
  { id: "instagram", label: "Instagram DM" },
  { id: "followup1", label: "Follow-up 1" },
  { id: "followup2", label: "Follow-up 2" },
  { id: "call", label: "Call Script" },
];

export const CLOSED_STATUSES = ["Closed", "Lost"];

// ============================================================
// localStorage access, guarded so a disabled/!full quota storage never
// takes the whole app down.
// ============================================================

import { STORAGE_KEYS } from "./constants.js";
import { DEMO_LEADS } from "./demoLeads.js";

export function loadFromLocalStorage(key, fallbackValue) {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : fallbackValue;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return fallbackValue;
  }
}

// Resolved once per page load. Several useState initialisers call this, and
// seeding writes a flag — without the cache the first call would seed and the
// later ones would read the flag back as "already seeded" and return nothing,
// leaving the app with no selected lead.
let resolvedInitialLeads = null;

// First visit with nothing stored: seed the sample pipeline so the CRM has
// something to show. The seed is marked so it happens exactly once per
// browser — after someone resets their data, the demo leads stay gone.
export function loadInitialLeads() {
  if (resolvedInitialLeads) return resolvedInitialLeads;

  const savedLeads = loadFromLocalStorage(STORAGE_KEYS.leads, null);

  if (Array.isArray(savedLeads)) {
    resolvedInitialLeads = savedLeads;
    return resolvedInitialLeads;
  }

  try {
    resolvedInitialLeads = localStorage.getItem(STORAGE_KEYS.demoSeeded)
      ? []
      : DEMO_LEADS;
    localStorage.setItem(STORAGE_KEYS.demoSeeded, "1");
  } catch (error) {
    console.error("Error reading demo seed flag:", error);
    resolvedInitialLeads = DEMO_LEADS;
  }

  return resolvedInitialLeads;
}

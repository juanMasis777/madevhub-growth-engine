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

// First visit with nothing stored: seed the sample pipeline so the CRM has
// something to show. The seed is marked so it happens exactly once per
// browser — after someone resets their data, the demo leads stay gone.
export function loadInitialLeads() {
  const savedLeads = loadFromLocalStorage(STORAGE_KEYS.leads, null);

  if (Array.isArray(savedLeads)) return savedLeads;

  try {
    if (localStorage.getItem(STORAGE_KEYS.demoSeeded)) return [];
    localStorage.setItem(STORAGE_KEYS.demoSeeded, "1");
  } catch (error) {
    console.error("Error reading demo seed flag:", error);
    return DEMO_LEADS;
  }

  return DEMO_LEADS;
}

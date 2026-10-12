// ============================================================
// localStorage access, guarded so a disabled/!full quota storage never
// takes the whole app down.
// ============================================================

export function loadFromLocalStorage(key, fallbackValue) {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : fallbackValue;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return fallbackValue;
  }
}

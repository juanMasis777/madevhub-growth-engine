import { useEffect, useState } from "react";

// ============================================================
// Hook de tema: guarda la preferencia y la aplica al <html>
// vía data-theme. El CSS reacciona con [data-theme="dark"].
// ============================================================

const THEME_KEY = "madevhub_theme";

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);

    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch (error) {
    // Si localStorage falla, usamos el default.
  }

  // Respeta la preferencia del sistema la primera vez.
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Si falla el guardado, no rompemos la app.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  };

  return {
    theme,
    toggleTheme,
  };
}
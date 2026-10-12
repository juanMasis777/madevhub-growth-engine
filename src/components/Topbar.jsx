// ============================================================
// Page header: view title, Safe Mode badge and the global actions.
// ============================================================

import { Sun, Moon } from "lucide-react";

export default function Topbar({
  currentMeta,
  editingLeadId,
  exportLeadsCsv,
  safeModeLimits,
  showLeadForm,
  startAddLead,
  theme,
  toggleTheme,
}) {
  return (
    <header className="topbar">
      <div>
        <h2>{currentMeta.title}</h2>
        <p>{currentMeta.subtitle}</p>
        <div className="safe-mode-badge">
          Safe Mode ON · City emails: {safeModeLimits.singleCityEmailLimit}{" "}
          · All USA emails: {safeModeLimits.allUsaEmailLimit}
        </div>
      </div>

      <div className="topbar-actions">
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {theme === "dark" ? "Claro" : "Oscuro"}
        </button>

        <button className="primary-btn" onClick={startAddLead}>
          {showLeadForm && editingLeadId === null ? "Close Form" : "Add Lead"}
        </button>

        <button className="secondary-btn" onClick={exportLeadsCsv}>
          Export CSV
        </button>
      </div>
    </header>
  );
}

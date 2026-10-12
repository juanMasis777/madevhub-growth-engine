// ============================================================
// Lead editing, backup and restore, backend connection status
// and the theme switch.
// ============================================================

export default function SettingsView({
  backendStatus,
  checkBackendConnection,
  clearSavedData,
  deleteSelectedLead,
  exportLeadsCsv,
  exportPrivateBackup,
  notify,
  safeModeLimits,
  selectedLead,
  startEditLead,
  syncSafeModeLimits,
  theme,
  toggleTheme,
  triggerImportBackup,
}) {
  return (
    <section className="view-grid">
      <div className="card">
        <h3>Lead Management</h3>
        <p className="muted">
          {selectedLead
            ? `Edit or remove ${selectedLead.name}.`
            : "Select a lead to edit or remove it."}
        </p>

        <div className="lead-management-actions">
          <button
            className="secondary-btn full"
            onClick={startEditLead}
            disabled={!selectedLead}
          >
            Edit Lead
          </button>

          <button
            className="danger-btn full"
            onClick={deleteSelectedLead}
            disabled={!selectedLead}
          >
            Delete Lead
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Data &amp; Backup</h3>
        <p className="muted">
          Your leads live in this browser. Back them up or move them to
          another device.
        </p>

        <div className="lead-management-actions">
          <button className="secondary-btn full" onClick={exportLeadsCsv}>
            Export CSV
          </button>
          <button
            className="secondary-btn full"
            onClick={exportPrivateBackup}
          >
            Export Full Backup
          </button>
          <button
            className="secondary-btn full"
            onClick={triggerImportBackup}
          >
            Import Backup
          </button>
          <button className="danger-btn full" onClick={clearSavedData}>
            Reset All Data
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Backend Connection</h3>
        <p className="muted">
          The Express server proxies every Outscraper call. Searching and
          enrichment only work while it is running.
        </p>

        <div className={`backend-status ${backendStatus.state}`}>
          <span className="backend-status-dot" aria-hidden="true" />
          <span>
            {backendStatus.state === "online"
              ? "Online"
              : backendStatus.state === "offline"
              ? "Offline"
              : "Checking"}{" "}
            — {backendStatus.message}
          </span>
        </div>

        <div className="lead-management-actions">
          <button
            type="button"
            className="secondary-btn full"
            onClick={async () => {
              const isOnline = await checkBackendConnection();
              if (isOnline) {
                await syncSafeModeLimits();
                notify("Backend connected.", "success");
              } else {
                notify("Backend is not responding.", "error");
              }
            }}
            disabled={backendStatus.state === "checking"}
          >
            {backendStatus.state === "checking"
              ? "Checking..."
              : "Test Connection"}
          </button>
        </div>

        <div className="backend-status">
          <span>
            Safe Mode limits in use — city emails:{" "}
            {safeModeLimits.singleCityEmailLimit} · All USA emails:{" "}
            {safeModeLimits.allUsaEmailLimit} · city search:{" "}
            {safeModeLimits.normalSearchLimit} · All USA search:{" "}
            {safeModeLimits.allUsaNormalSearchLimit}
          </span>
        </div>
      </div>

      <div className="card">
        <h3>Appearance</h3>
        <p className="muted">Switch between light and dark mode.</p>
        <div className="lead-management-actions">
          <button
            type="button"
            className="secondary-btn full"
            onClick={toggleTheme}
          >
            {theme === "dark"
              ? "Switch to Light Mode"
              : "Switch to Dark Mode"}
          </button>
        </div>
      </div>
    </section>
  );
}

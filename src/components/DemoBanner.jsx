// ============================================================
// Tells a first-time visitor that the loaded pipeline is sample data,
// and lets them clear it in one click.
// ============================================================

export default function DemoBanner({ demoLeadCount, clearDemoLeads }) {
  return (
    <div className="demo-banner" role="status">
      <div className="demo-banner-text">
        <strong>Demo data</strong>
        <span>
          {demoLeadCount} sample {demoLeadCount === 1 ? "lead" : "leads"}{" "}
          are loaded so you can try the CRM right away. Searching real
          businesses needs the backend running with your Outscraper key.
        </span>
      </div>
      <button
        type="button"
        className="secondary-btn"
        onClick={clearDemoLeads}
      >
        Clear demo data
      </button>
    </div>
  );
}

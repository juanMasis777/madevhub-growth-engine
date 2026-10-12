// ============================================================
// Google Maps search form, Safe Mode controls and the manual
// 'add a lead by hand' entry point.
// ============================================================

import { CITY_OPTIONS } from "../lib/constants.js";

export default function SearchView({
  category,
  city,
  handleFindLeads,
  handleFindLeadsWithEmails,
  hotLeadsOnly,
  isSearching,
  isSearchingEmails,
  setActiveView,
  setCategory,
  setCity,
  setHotLeadsOnly,
  setWebsiteStatus,
  startAddLead,
  websiteStatus,
}) {
  return (
    <section className="view-grid single">
      <div className="card" id="search-leads">
        <div className="card-header">
          <div>
            <h3>Search Businesses</h3>
            <p>
              Find businesses that need a website or better online
              presence.
            </p>
          </div>
        </div>

        <div className="safe-mode-card">
          <strong>Safe Mode ON:</strong> normal searches are limited, and
          email enrichment is capped to protect your Outscraper credits.
        </div>

        <div className="filters">
          <label>
            City
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {CITY_OPTIONS.map((cityOption) => (
                <option key={cityOption}>{cityOption}</option>
              ))}
            </select>
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>All</option>
              <option>Barbershop</option>
              <option>Beauty Salon</option>
              <option>Cleaning Company</option>
              <option>Restaurant</option>
              <option>Dentist</option>
              <option>Contractor</option>
              <option>Real Estate</option>
            </select>
          </label>

          <label>
            Website Status
            <select
              value={websiteStatus}
              onChange={(e) => setWebsiteStatus(e.target.value)}
            >
              <option>Any</option>
              <option>No Website</option>
              <option>Old Website</option>
              <option>Facebook Only</option>
              <option>Has Website</option>
            </select>
          </label>

          <div className="filter-actions">
            <button
              className="primary-btn"
              onClick={handleFindLeads}
              disabled={isSearching || isSearchingEmails}
            >
              {isSearching ? "Searching..." : "Find Leads"}
            </button>

            <button
              className="secondary-btn"
              onClick={handleFindLeadsWithEmails}
              disabled={isSearching || isSearchingEmails}
            >
              {isSearchingEmails
                ? "Finding Emails..."
                : "Find Leads With Emails"}
            </button>
          </div>
        </div>

        <div className="quality-filter-row">
          <button
            type="button"
            className={`secondary-btn ${
              hotLeadsOnly ? "active-filter" : ""
            }`}
            onClick={() => setHotLeadsOnly((current) => !current)}
          >
            {hotLeadsOnly ? "Showing Hot Leads Only" : "Show Hot Leads Only"}
          </button>

          <span>Hot Leads are the best prospects to contact first.</span>
        </div>
      </div>

      <div className="card private-tools-card">
        <h3>Add a Lead Manually</h3>
        <p className="muted">
          Don't want to spend credits? Add a business by hand and work it
          like any other lead.
        </p>
        <div className="private-tools-grid">
          <button className="primary-btn" onClick={startAddLead}>
            Add Lead Manually
          </button>
          <button
            className="secondary-btn"
            onClick={() => setActiveView("leads")}
          >
            View Businesses
          </button>
        </div>
      </div>
    </section>
  );
}

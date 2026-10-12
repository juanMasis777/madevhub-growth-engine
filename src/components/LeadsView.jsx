// ============================================================
// The full lead list with its search box, and the lead form when
// it is open.
// ============================================================

import { getLeadQuality } from "../lib/leads.js";

export default function LeadsView({
  filteredLeads,
  getFollowUpStatus,
  handleSelectLead,
  leadFormCard,
  leadSearch,
  leads,
  selectedLead,
  setActiveView,
  setLeadSearch,
}) {
  return (
    <section className="main-grid">
      <div className="left-panel">
        {leadFormCard}

        <div className="card" id="businesses">
          <div className="card-header with-search">
            <h3>
              {filteredLeads.length}{" "}
              {filteredLeads.length === 1 ? "Lead" : "Leads"} Found
            </h3>
            {leadSearch && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setLeadSearch("")}
              >
                Clear search
              </button>
            )}
          </div>

          <div className="filters lead-search-row">
            <label>
              Search
              <input
                type="search"
                value={leadSearch}
                onChange={(event) => setLeadSearch(event.target.value)}
                placeholder="Search by name, email, phone, city or category"
              />
            </label>
          </div>

          <div className="table">
            <div className="table-row table-head">
              <span>Business</span>
              <span>Quality</span>
              <span>Website</span>
              <span>Email</span>
              <span>Rating</span>
              <span>Score</span>
              <span>Status</span>
            </div>

            {filteredLeads.map((lead) => (
              <button
                key={lead.id}
                className={`table-row lead-row ${
                  selectedLead?.id === lead.id ? "selected" : ""
                }`}
                onClick={() => handleSelectLead(lead)}
              >
                <span>
                  <strong>{lead.name}</strong>
                  <small>
                    {lead.category} · {lead.city}
                  </small>
                  {lead.followUpDate && (
                    <small
                      className={`followup-inline ${getFollowUpStatus(lead)
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      Follow-up: {lead.followUpDate} ·{" "}
                      {getFollowUpStatus(lead)}
                    </small>
                  )}
                </span>

                <span
                  className={`quality-badge ${
                    getLeadQuality(lead).className
                  }`}
                >
                  {getLeadQuality(lead).emoji} {getLeadQuality(lead).label}
                </span>

                <span>{lead.website}</span>
                <span
                  className={lead.email ? "email-found" : "email-missing"}
                >
                  {lead.email ? lead.email : "No email"}
                </span>
                <span>{lead.rating} ⭐</span>
                <span className="score">{lead.opportunityScore}%</span>
                <span className="status">{lead.status}</span>
              </button>
            ))}

            {filteredLeads.length === 0 && (
              <div className="empty-state">
                {leads.length === 0
                  ? "No leads yet. Head to Search Leads to find businesses, or add one manually."
                  : "No leads match these filters. Try clearing the search or the filters in Search Leads."}
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="right-panel">
        {selectedLead ? (
          <div className="card lead-detail-card">
            <div className="lead-detail-head">
              <div>
                <h3>{selectedLead.name}</h3>
                <p className="muted">
                  {selectedLead.category} · {selectedLead.city}
                </p>
              </div>
              <span
                className={`quality-badge ${
                  getLeadQuality(selectedLead).className
                }`}
              >
                {getLeadQuality(selectedLead).emoji}{" "}
                {getLeadQuality(selectedLead).label}
              </span>
            </div>

            <div className="score-circle">
              {selectedLead.opportunityScore}%
            </div>

            <ul className="detail-facts">
              <li>
                <span>Website</span>
                <strong>{selectedLead.website}</strong>
              </li>
              <li>
                <span>Email</span>
                <strong>{selectedLead.email || "Not found"}</strong>
              </li>
              <li>
                <span>Phone</span>
                <strong>{selectedLead.phone || "Not found"}</strong>
              </li>
              <li>
                <span>Rating</span>
                <strong>
                  {selectedLead.rating} ⭐ ({selectedLead.reviews})
                </strong>
              </li>
              <li>
                <span>Status</span>
                <strong>{selectedLead.status}</strong>
              </li>
            </ul>

            <div className="detail-actions">
              <button
                className="primary-btn full"
                onClick={() => setActiveView("audits")}
              >
                Open Audit
              </button>
              <button
                className="secondary-btn full"
                onClick={() => setActiveView("messages")}
              >
                Write Message
              </button>
              <button
                className="secondary-btn full"
                onClick={() => setActiveView("pipeline")}
              >
                Update Pipeline
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <h3>No Lead Selected</h3>
            <p className="muted">Add or select a lead to see details.</p>
          </div>
        )}
      </aside>
    </section>
  );
}

// ============================================================
// Digital-presence audit for the selected lead, contact
// enrichment, and the TXT / PDF / proposal exports.
// ============================================================

import { getLeadQuality } from "../lib/leads.js";

export default function AuditsView({
  createClientProposalPdf,
  exportAudit,
  exportAuditPdf,
  generateAudit,
  generatedAudit,
  getFollowUpStatus,
  handleEnrichLead,
  isEnriching,
  noLeadState,
  selectedLead,
}) {
  return (
    <section className="view-grid single">
      {selectedLead ? (
        <div className="card" id="audits">
          <h3>AI Audit Preview</h3>
          <p className="muted">{selectedLead.name}</p>

          <div className="score-circle">
            {selectedLead.opportunityScore}%
          </div>

          <ul className="audit-list">
            <li>
              Lead quality:{" "}
              <span
                className={`quality-badge ${
                  getLeadQuality(selectedLead).className
                }`}
              >
                {getLeadQuality(selectedLead).emoji}{" "}
                {getLeadQuality(selectedLead).label} (
                {getLeadQuality(selectedLead).score}/100)
              </span>
            </li>

            <li>
              Follow-up:{" "}
              {selectedLead.followUpDate
                ? `${selectedLead.followUpDate} · ${getFollowUpStatus(
                    selectedLead
                  )}`
                : "Not scheduled"}
            </li>

            <li>
              Proposal sent:{" "}
              {selectedLead.proposalSentDate
                ? selectedLead.proposalSentDate
                : "Not sent"}
            </li>

            <li>Website status: {selectedLead.website}</li>
            <li>Google rating: {selectedLead.rating}</li>
            <li>Reviews: {selectedLead.reviews}</li>

            <li>
              Phone: {selectedLead.phone ? selectedLead.phone : "Not found"}
            </li>

            <li>
              Email: {selectedLead.email ? selectedLead.email : "Not found"}
            </li>

            <li>
              Instagram:{" "}
              {selectedLead.instagram
                ? selectedLead.instagram
                : "Not found"}
            </li>

            <li>
              Address:{" "}
              {selectedLead.address ? selectedLead.address : "Not found"}
            </li>

            <li>
              Website URL:{" "}
              {selectedLead.websiteUrl ? (
                <a
                  href={selectedLead.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Website
                </a>
              ) : (
                "Not found"
              )}
            </li>

            <li>
              Google Maps:{" "}
              {selectedLead.googleMapsUrl ? (
                <a
                  href={selectedLead.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Maps
                </a>
              ) : (
                "Not found"
              )}
            </li>

            <li>
              Facebook:{" "}
              {selectedLead.facebook ? (
                <a
                  href={selectedLead.facebook}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Facebook
                </a>
              ) : (
                "Not found"
              )}
            </li>

            <li>
              LinkedIn:{" "}
              {selectedLead.linkedin ? (
                <a
                  href={selectedLead.linkedin}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open LinkedIn
                </a>
              ) : (
                "Not found"
              )}
            </li>

            <li>
              WhatsApp:{" "}
              {selectedLead.whatsapp ? selectedLead.whatsapp : "Not found"}
            </li>
          </ul>

          <div className="audit-buttons">
            <button className="primary-btn full" onClick={generateAudit}>
              Generate Audit
            </button>

            <button
              className="secondary-btn full"
              onClick={handleEnrichLead}
              disabled={isEnriching || !selectedLead.websiteUrl}
            >
              {isEnriching ? "Finding..." : "Find Email / Socials"}
            </button>

            <button className="secondary-btn full" onClick={exportAudit}>
              Export TXT
            </button>

            <button className="secondary-btn full" onClick={exportAuditPdf}>
              Export PDF
            </button>

            <button
              className="primary-btn full"
              onClick={createClientProposalPdf}
            >
              Create Client Proposal
            </button>
          </div>

          {generatedAudit && (
            <div className="audit-report">
              <h4>Generated Audit</h4>
              <p>{generatedAudit}</p>
            </div>
          )}
        </div>
      ) : (
        noLeadState
      )}
    </section>
  );
}

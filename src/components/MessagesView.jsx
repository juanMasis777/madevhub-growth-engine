// ============================================================
// Per-channel outreach message plus the five-step outreach
// sequence for the selected lead.
// ============================================================

import {
  Copy,
  Mail,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { OUTREACH_STEPS } from "../lib/constants.js";
import { getActionLabel, getLeadQuality } from "../lib/leads.js";

export default function MessagesView({
  contactMessage,
  contactMode,
  copyMessage,
  copyOutreachMessage,
  generateOutreachSequence,
  handleSendAction,
  markOutreachContacted,
  noLeadState,
  outreachMessage,
  outreachTitle,
  selectedLead,
  setContactMode,
}) {
  return (
    <section className="view-grid single">
      {selectedLead ? (
        <>
          <div className="card">
            <h3>Contact Actions</h3>
            <p className="muted">
              Choose the best way to contact {selectedLead.name}.
            </p>

            <div className="contact-actions">
              <button
                className={contactMode === "email" ? "active" : ""}
                disabled={!selectedLead.email}
                onClick={() => setContactMode("email")}
              >
                <Mail size={16} />
                Email
              </button>

              <button
                className={contactMode === "instagram" ? "active" : ""}
                disabled={!selectedLead.instagram}
                onClick={() => setContactMode("instagram")}
              >
                <MessageCircle size={16} />
                Instagram
              </button>

              <button
                className={contactMode === "call" ? "active" : ""}
                disabled={!selectedLead.phone}
                onClick={() => setContactMode("call")}
              >
                <Phone size={16} />
                Call
              </button>
            </div>

            <div className="contact-info">
              <strong>Selected channel:</strong> {contactMode}
            </div>
          </div>

          <div className="card" id="messages">
            <h3>Generated Message</h3>
            <p className="message-box">{contactMessage}</p>

            <div className="actions">
              <button className="secondary-btn" onClick={copyMessage}>
                <Copy size={16} />
                Copy
              </button>

              <button className="primary-btn" onClick={handleSendAction}>
                <Send size={16} />
                {getActionLabel(contactMode)}
              </button>
            </div>
          </div>

          <div className="card" id="outreach">
            <div className="card-header">
              <div>
                <h3>Outreach Sequence</h3>
                <p className="muted">
                  Five ready-to-send steps for {selectedLead.name}. Pick
                  one, copy it, and mark the lead as contacted.
                </p>
              </div>
            </div>

            <div className="outreach-grid">
              {OUTREACH_STEPS.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  className={
                    outreachTitle === step.label
                      ? "primary-btn"
                      : "secondary-btn"
                  }
                  onClick={() => generateOutreachSequence(step.id)}
                >
                  {step.label}
                </button>
              ))}
            </div>

            {outreachMessage ? (
              <div className="outreach-preview">
                <div className="outreach-preview-header">
                  <strong>{outreachTitle}</strong>
                  <span>
                    {getLeadQuality(selectedLead).emoji}{" "}
                    {getLeadQuality(selectedLead).label}
                  </span>
                </div>

                <p>{outreachMessage}</p>

                <div className="actions">
                  <button
                    className="secondary-btn"
                    onClick={copyOutreachMessage}
                  >
                    <Copy size={16} />
                    Copy Message
                  </button>

                  <button
                    className="primary-btn"
                    onClick={markOutreachContacted}
                  >
                    <Send size={16} />
                    Mark as Contacted
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                Pick a step above to generate a personalized message for
                this lead.
              </div>
            )}
          </div>
        </>
      ) : (
        noLeadState
      )}
    </section>
  );
}

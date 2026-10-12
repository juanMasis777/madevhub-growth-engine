// ============================================================
// Pipeline stage, follow-up date and notes for the selected
// lead.
// ============================================================

import { PIPELINE_STAGES } from "../lib/constants.js";

export default function PipelineView({
  addLeadNote,
  deleteLeadNote,
  followUpDate,
  getFollowUpStatus,
  leadNoteText,
  markProposalSent,
  noLeadState,
  saveFollowUpDate,
  selectedLead,
  setFollowUpDate,
  setLeadNoteText,
  updateLeadStatus,
}) {
  return (
    <section className="view-grid single">
      {selectedLead ? (
        <>
          <div className="card" id="pipeline">
            <h3>Pipeline Status — {selectedLead.name}</h3>
            <p className="muted">Move this lead through your sales stages.</p>

            <div className="pipeline-buttons">
              {PIPELINE_STAGES.map((status) => (
                <button
                  key={status}
                  className={
                    selectedLead.status === status ? "active" : ""
                  }
                  onClick={() => updateLeadStatus(selectedLead.id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="card" id="follow-up">
            <h3>Lead Notes &amp; Follow-up</h3>
            <p className="muted">
              Save notes and schedule the next follow-up for this lead.
            </p>

            <div className="followup-summary">
              <div>
                <strong>Next Follow-up</strong>
                <span>
                  {selectedLead.followUpDate
                    ? `${selectedLead.followUpDate} · ${getFollowUpStatus(
                        selectedLead
                      )}`
                    : "Not scheduled"}
                </span>
              </div>

              <div>
                <strong>Proposal</strong>
                <span>
                  {selectedLead.proposalSentDate
                    ? `Sent ${selectedLead.proposalSentDate}`
                    : "Not sent"}
                </span>
              </div>
            </div>

            <div className="followup-controls">
              <label>
                Next Follow-up Date
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                />
              </label>

              <button
                className="secondary-btn full"
                onClick={saveFollowUpDate}
              >
                Save Follow-up
              </button>

              <button
                className="primary-btn full"
                onClick={markProposalSent}
              >
                Mark Proposal Sent
              </button>
            </div>

            <div className="notes-box">
              <label>
                Add Note
                <textarea
                  value={leadNoteText}
                  onChange={(event) => setLeadNoteText(event.target.value)}
                  placeholder="Example: Sent email today. Follow up Friday. Interested in a $899 website package."
                  rows="4"
                />
              </label>

              <button className="primary-btn full" onClick={addLeadNote}>
                Add Note
              </button>
            </div>

            <div className="notes-list">
              {(selectedLead.notes || []).length === 0 && (
                <div className="empty-state">
                  No notes yet for this lead.
                </div>
              )}

              {(selectedLead.notes || []).map((note) => (
                <div className="note-item" key={note.id}>
                  <div>
                    <strong>{note.date}</strong>
                    <p>{note.text}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteLeadNote(note.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        noLeadState
      )}
    </section>
  );
}

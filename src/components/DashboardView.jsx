// ============================================================
// Today's Action Plan, the headline metrics, the pipeline
// breakdown and the recent activity log.
// ============================================================

import { Clock } from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function DashboardView({
  activityLog,
  emailRate,
  leads,
  leadsWithEmail,
  openLeadInView,
  pipelineCounts,
  setActiveView,
  stats,
  todayActionCount,
  todayActionGroups,
}) {
  return (
    <>
      <section className="daily-dashboard">
        <div className="daily-dashboard-header">
          <div>
            <h3>Today's Action Plan</h3>
            <p>
              The leads that need you right now, grouped by what to do
              next.
            </p>
          </div>
          <span>
            {todayActionCount}{" "}
            {todayActionCount === 1 ? "action" : "actions"} pending
          </span>
        </div>

        <div className="daily-action-grid">
          {todayActionGroups.map((group) => (
            <div className="daily-action-card" key={group.id}>
              <div className="daily-action-card-header">
                <span aria-hidden="true">{group.icon}</span>
                <div>
                  <strong>{group.title}</strong>
                  <small>
                    {group.leads.length} · {group.subtitle}
                  </small>
                </div>
              </div>

              <div className="daily-action-list">
                {group.leads.length === 0 && <p>{group.emptyText}</p>}

                {group.leads.slice(0, 4).map((lead) => (
                  <button
                    type="button"
                    key={lead.id}
                    onClick={() => openLeadInView(lead, group.view)}
                  >
                    <span>
                      <strong>{lead.name}</strong>
                      <small>
                        {lead.category} · {lead.city}
                      </small>
                    </span>
                    <em>{group.tag(lead)}</em>
                  </button>
                ))}

                {group.leads.length > 4 && (
                  <button
                    type="button"
                    className="daily-more"
                    onClick={() => setActiveView("leads")}
                  >
                    <span>
                      <strong>
                        +{group.leads.length - 4} more
                      </strong>
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-grid">
        <StatCard title="Total Leads" value={stats.total} />
        <StatCard title="Hot Leads" value={stats.hotLeads} />
        <StatCard title="Contacted" value={stats.contacted} />
        <StatCard title="Closed Deals" value={stats.closed} />
      </section>

      <section className="view-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Pipeline Overview</h3>
              <p className="muted">
                {leadsWithEmail} of {leads.length} leads have an email (
                {emailRate}%).
              </p>
            </div>
          </div>

          <div className="pipeline-board">
            {pipelineCounts.map(({ stage, count }) => (
              <div className="pipeline-stat" key={stage}>
                <span className="pipeline-stat-count">{count}</span>
                <span className="pipeline-stat-label">{stage}</span>
              </div>
            ))}
          </div>

          <div className="quick-actions">
            <button
              className="primary-btn"
              onClick={() => setActiveView("search")}
            >
              Search New Leads
            </button>
            <button
              className="secondary-btn"
              onClick={() => setActiveView("leads")}
            >
              View All Businesses
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Activity Log</h3>
          <p className="muted">
            Recent messages, calls, and outreach actions.
          </p>

          <div className="log-list">
            {activityLog.length === 0 && (
              <div className="empty-state">
                No activity yet. Add a lead, send a message, or generate an
                audit to create a log.
              </div>
            )}

            {activityLog.slice(0, 12).map((item) => (
              <div className="log-item" key={item.id}>
                <div>
                  <strong>{item.businessName}</strong>
                  <p>{item.action}</p>
                </div>
                <small>
                  <Clock size={14} />
                  {item.date}
                </small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

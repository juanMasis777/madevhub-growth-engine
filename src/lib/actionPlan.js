// ============================================================
// Today's Action Plan.
//
// Groups the open leads into the five moves that advance the pipeline, so
// the dashboard shows what to do next instead of the whole list. Pure on
// purpose: it takes the leads plus today's date key and returns the groups,
// which makes it directly testable (see actionPlan.test.js).
// ============================================================

import { getLeadQuality, isLeadStillOpen } from "./leads.js";

export function buildTodayActionGroups(leads, todayKey) {
  const openLeads = leads.filter(isLeadStillOpen);

  const overdue = openLeads.filter(
    (lead) => lead.followUpDate && lead.followUpDate < todayKey
  );

  const dueToday = openLeads.filter((lead) => lead.followUpDate === todayKey);

  const hotToContact = openLeads
    .filter(
      (lead) => lead.status === "New" && getLeadQuality(lead).level === "hot"
    )
    .sort((a, b) => getLeadQuality(b).score - getLeadQuality(a).score);

  const waitingReply = openLeads.filter(
    (lead) =>
      ["Contacted", "Interested"].includes(lead.status) &&
      (!lead.followUpDate || lead.followUpDate < todayKey)
  );

  const proposalsToClose = openLeads.filter(
    (lead) => lead.status === "Proposal Sent"
  );

  return [
    {
      id: "overdue",
      icon: "⏰",
      title: "Overdue follow-ups",
      subtitle: "Past their date",
      view: "pipeline",
      emptyText: "Nothing overdue. Good job.",
      tag: () => "Overdue",
      leads: overdue,
    },
    {
      id: "due-today",
      icon: "📅",
      title: "Due today",
      subtitle: "Scheduled for today",
      view: "pipeline",
      emptyText: "No follow-ups scheduled for today.",
      tag: () => "Today",
      leads: dueToday,
    },
    {
      id: "hot",
      icon: "🔥",
      title: "Hot leads to contact",
      subtitle: "Still marked as New",
      view: "messages",
      emptyText: "No untouched hot leads. Search for more.",
      tag: (lead) => `${getLeadQuality(lead).score}/100`,
      leads: hotToContact,
    },
    {
      id: "waiting",
      icon: "💬",
      title: "Waiting on reply",
      subtitle: "Contacted, no follow-up set",
      view: "pipeline",
      emptyText: "Every contacted lead has a next step.",
      tag: (lead) => lead.status,
      leads: waitingReply,
    },
    {
      id: "proposals",
      icon: "📄",
      title: "Proposals to close",
      subtitle: "Proposal already sent",
      view: "pipeline",
      emptyText: "No open proposals yet.",
      tag: () => "Close",
      leads: proposalsToClose,
    },
  ];
}

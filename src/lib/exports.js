// ============================================================
// Taking data out of the CRM: CSV rows and browser downloads.
// ============================================================

// Quote every field and double any inner quote, so a note containing a
// comma or a quote cannot shift the columns.
function escapeCsvValue(value) {
  const safeValue = String(value ?? "");
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export function leadsToCsv(leads) {

  const headers = [
    "Business",
    "City",
    "Category",
    "Website Status",
    "Website URL",
    "Phone",
    "Email",
    "Instagram",
    "Facebook",
    "LinkedIn",
    "Rating",
    "Reviews",
    "Opportunity Score",
    "Status",
    "Follow-up Date",
    "Proposal Sent Date",
    "Notes",
    "Address",
    "Google Maps",
  ];

  const rows = leads.map((lead) => [
    lead.name,
    lead.city,
    lead.category,
    lead.website,
    lead.websiteUrl,
    lead.phone,
    lead.email,
    lead.instagram,
    lead.facebook,
    lead.linkedin,
    lead.rating,
    lead.reviews,
    lead.opportunityScore,
    lead.status,
    lead.followUpDate,
    lead.proposalSentDate,
    Array.isArray(lead.notes)
      ? lead.notes.map((note) => `${note.date}: ${note.text}`).join(" | ")
      : "",
    lead.address,
    lead.googleMapsUrl,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  return csvContent;
}

// Hand the browser a generated file. Kept here so the views never touch
// the DOM directly.
export function downloadTextFile(content, fileName, mimeType = "text/plain") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = url;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();

  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

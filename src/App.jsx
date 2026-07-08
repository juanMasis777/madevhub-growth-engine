import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  LayoutDashboard,
  Search,
  Building2,
  Mail,
  Settings,
  BarChart3,
  Sparkles,
  Send,
  MessageCircle,
  Phone,
  Copy,
  Clock,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "./useTheme";
import "./App.css";

const STORAGE_KEYS = {
  leads: "madevhub_growth_engine_leads",
  activityLog: "madevhub_growth_engine_activity_log",
};

const INITIAL_LEADS = [];

const SAFE_MODE_CONFIG = {
  enabled: true,
  singleCityEmailLimit: 3,
  allUsaEmailLimit: 5,
  normalSearchLimit: 8,
  allUsaNormalSearchLimit: 12,
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const CITY_OPTIONS = [
  "Miami",
  "All USA",
  "Orlando",
  "Tampa",
  "Atlanta",
  "Dallas",
  "Houston",
  "Austin",
  "New York",
  "Los Angeles",
  "Chicago",
  "Phoenix",
  "Las Vegas",
  "Denver",
  "Seattle",
  "Boston",
  "San Diego",
  "Nashville",
  "Charlotte",
  "Raleigh",
  "Washington DC",
];

const emptyLeadForm = {
  name: "",
  city: "Miami",
  category: "Barbershop",
  website: "No Website",
  phone: "",
  email: "",
  instagram: "",
  rating: "4.5",
  reviews: "0",
  opportunityScore: "90",
};

function loadFromLocalStorage(key, fallbackValue) {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : fallbackValue;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return fallbackValue;
  }
}

function getDefaultContactMode(lead) {
  if (lead?.email) return "email";
  if (lead?.instagram) return "instagram";
  return "call";
}

function getActionLabel(contactMode) {
  if (contactMode === "email") return "Send Email";
  if (contactMode === "instagram") return "Copy Instagram DM";
  return "Save Call Script";
}

function convertLeadToForm(lead) {
  return {
    name: lead.name || "",
    city: lead.city || "Miami",
    category: lead.category || "Barbershop",
    website: lead.website || "No Website",
    phone: lead.phone || "",
    email: lead.email || "",
    instagram: lead.instagram || "",
    rating: String(lead.rating ?? "4.5"),
    reviews: String(lead.reviews ?? "0"),
    opportunityScore: String(lead.opportunityScore ?? "90"),
  };
}

function createSafeFileName(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "business"
  );
}

function getOpportunityScoreFromWebsite(websiteStatus) {
  if (websiteStatus === "No Website") return 95;
  if (websiteStatus === "Facebook Only") return 90;
  if (websiteStatus === "Old Website") return 82;
  return 70;
}

function getLeadQuality(lead) {
  if (!lead) {
    return {
      score: 0,
      label: "Low Priority",
      emoji: "❄️",
      level: "low",
      className: "low",
    };
  }

  let score = 0;

  const opportunityScore = Number(lead.opportunityScore) || 0;
  const rating = Number(lead.rating) || 0;
  const reviews = Number(lead.reviews) || 0;

  if (opportunityScore >= 90) score += 25;
  else if (opportunityScore >= 80) score += 18;
  else if (opportunityScore >= 70) score += 10;

  if (lead.email) score += 25;
  if (lead.phone) score += 15;
  if (lead.instagram) score += 10;
  if (lead.googleMapsUrl) score += 5;

  if (reviews >= 200) score += 15;
  else if (reviews >= 75) score += 10;
  else if (reviews >= 25) score += 6;

  if (rating >= 4.7) score += 10;
  else if (rating >= 4.3) score += 7;
  else if (rating >= 4.0) score += 4;

  if (lead.website === "No Website") score += 15;
  else if (lead.website === "Facebook Only") score += 12;
  else if (lead.website === "Old Website") score += 10;
  else if (lead.website === "Has Website") score += 4;

  const finalScore = Math.min(score, 100);

  if (finalScore >= 75) {
    return {
      score: finalScore,
      label: "Hot Lead",
      emoji: "🔥",
      level: "hot",
      className: "hot",
    };
  }

  if (finalScore >= 50) {
    return {
      score: finalScore,
      label: "Good Lead",
      emoji: "⭐",
      level: "good",
      className: "good",
    };
  }

  return {
    score: finalScore,
    label: "Low Priority",
    emoji: "❄️",
    level: "low",
    className: "low",
  };
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const backupFileInputRef = useRef(null);

  const [leads, setLeads] = useState(() =>
    loadFromLocalStorage(STORAGE_KEYS.leads, INITIAL_LEADS)
  );

  const [selectedLead, setSelectedLead] = useState(() => {
    const savedLeads = loadFromLocalStorage(STORAGE_KEYS.leads, INITIAL_LEADS);
    return savedLeads[0] || null;
  });

  const [city, setCity] = useState("Miami");
  const [category, setCategory] = useState("All");
  const [websiteStatus, setWebsiteStatus] = useState("Any");
  const [hotLeadsOnly, setHotLeadsOnly] = useState(false);

  const [contactMode, setContactMode] = useState(() => {
    const savedLeads = loadFromLocalStorage(STORAGE_KEYS.leads, INITIAL_LEADS);
    return getDefaultContactMode(savedLeads[0]);
  });

  const [activityLog, setActivityLog] = useState(() =>
    loadFromLocalStorage(STORAGE_KEYS.activityLog, [])
  );

  const [generatedAudit, setGeneratedAudit] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingEmails, setIsSearchingEmails] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [outreachTitle, setOutreachTitle] = useState("");
  const [outreachMessage, setOutreachMessage] = useState("");
  const [leadNoteText, setLeadNoteText] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activityLog, JSON.stringify(activityLog));
  }, [activityLog]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesCity =
        city === "All" || city === "All USA" || lead.city === city;
      const matchesCategory = category === "All" || lead.category === category;
      const matchesWebsite =
        websiteStatus === "Any" || lead.website === websiteStatus;
      const leadQuality = getLeadQuality(lead);
      const matchesQuality = !hotLeadsOnly || leadQuality.level === "hot";

      return matchesCity && matchesCategory && matchesWebsite && matchesQuality;
    });
  }, [leads, city, category, websiteStatus, hotLeadsOnly]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      hotLeads: leads.filter((lead) => getLeadQuality(lead).level === "hot")
        .length,
      contacted: leads.filter((lead) => lead.status === "Contacted").length,
      closed: leads.filter((lead) => lead.status === "Closed").length,
    };
  }, [leads]);

  const addActivityLog = (businessName, action, channel = "system") => {
    const newLog = {
      id: crypto.randomUUID(),
      businessName,
      channel,
      date: new Date().toLocaleString(),
      action,
    };

    setActivityLog((currentLog) => [newLog, ...currentLog]);
  };

  const updateSelectedLeadData = (updates) => {
    if (!selectedLead) return;

    const updatedLead = {
      ...selectedLead,
      ...updates,
    };

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === selectedLead.id ? updatedLead : lead
      )
    );

    setSelectedLead(updatedLead);
  };

  const getFollowUpStatus = (lead) => {
    if (!lead?.followUpDate) return "No follow-up";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followUp = new Date(`${lead.followUpDate}T00:00:00`);

    if (followUp < today) return "Overdue";
    if (followUp.getTime() === today.getTime()) return "Due today";

    return "Scheduled";
  };

  const scrollToSection = (sectionId) => {
    if (sectionId === "dashboard") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      return;
    }

    if (
      sectionId === "audits" ||
      sectionId === "messages" ||
      sectionId === "pipeline" ||
      sectionId === "settings"
    ) {
      alert("Please select a lead first to open this section.");
    }
  };

  const resetLeadForm = () => {
    setLeadForm(emptyLeadForm);
    setEditingLeadId(null);
    setShowLeadForm(false);
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setContactMode(getDefaultContactMode(lead));
    setGeneratedAudit("");
    setOutreachTitle("");
    setOutreachMessage("");
    setLeadNoteText("");
    setFollowUpDate(lead.followUpDate || "");
  };

  const updateLeadStatus = (leadId, newStatus) => {
    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }

    if (selectedLead?.id === leadId) {
      addActivityLog(selectedLead.name, `Status updated to ${newStatus}`, "pipeline");
    }
  };

  const startAddLead = () => {
    if (showLeadForm && editingLeadId === null) {
      resetLeadForm();
      return;
    }

    setLeadForm(emptyLeadForm);
    setEditingLeadId(null);
    setShowLeadForm(true);
  };

  const startEditLead = () => {
    if (!selectedLead) return;

    setLeadForm(convertLeadToForm(selectedLead));
    setEditingLeadId(selectedLead.id);
    setShowLeadForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteSelectedLead = () => {
    if (!selectedLead) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedLead.name}?`
    );

    if (!confirmDelete) return;

    const deletedLeadName = selectedLead.name;
    const remainingLeads = leads.filter((lead) => lead.id !== selectedLead.id);

    setLeads(remainingLeads);

    const nextSelectedLead = remainingLeads[0] || null;
    setSelectedLead(nextSelectedLead);
    setContactMode(getDefaultContactMode(nextSelectedLead));
    setGeneratedAudit("");
    setOutreachTitle("");
    setOutreachMessage("");
    setLeadNoteText("");
    setFollowUpDate("");
    resetLeadForm();

    addActivityLog(deletedLeadName, "Lead deleted", "delete");
  };

  const handleLeadFormChange = (event) => {
    const { name, value } = event.target;

    setLeadForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSaveLead = (event) => {
    event.preventDefault();

    if (!leadForm.name.trim()) {
      alert("Please enter the business name.");
      return;
    }

    const leadData = {
      name: leadForm.name.trim(),
      city: leadForm.city.trim() || "Miami",
      category: leadForm.category,
      website: leadForm.website,
      phone: leadForm.phone.trim(),
      email: leadForm.email.trim(),
      instagram: leadForm.instagram.trim(),
      rating: Number(leadForm.rating) || 0,
      reviews: Number(leadForm.reviews) || 0,
      opportunityScore: Number(leadForm.opportunityScore) || 0,
    };

    if (editingLeadId) {
      const updatedLead = {
        ...selectedLead,
        ...leadData,
      };

      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === editingLeadId ? updatedLead : lead
        )
      );

      setSelectedLead(updatedLead);
      setContactMode(getDefaultContactMode(updatedLead));
      setGeneratedAudit("");
      addActivityLog(updatedLead.name, "Lead updated", "edit");
      resetLeadForm();
      return;
    }

    const newLead = {
      id: crypto.randomUUID(),
      ...leadData,
      status: "New",
      address: "",
      googleMapsUrl: "",
      websiteUrl: "",
      facebook: "",
      linkedin: "",
      twitter: "",
      youtube: "",
      whatsapp: "",
      notes: [],
      followUpDate: "",
      proposalSentDate: "",
    };

    setLeads((currentLeads) => [newLead, ...currentLeads]);
    setSelectedLead(newLead);
    setContactMode(getDefaultContactMode(newLead));
    setGeneratedAudit("");
    resetLeadForm();

    setCity("All USA");
    setCategory("All");
    setWebsiteStatus("Any");

    addActivityLog(newLead.name, "New lead added manually", "lead");
  };

  const handleFindLeads = async () => {
    const searchCity = city === "All" ? "All USA" : city;
    const searchCategory = category === "All" ? "Restaurant" : category;
    const searchWebsiteStatus =
      websiteStatus === "Any" ? "Any" : websiteStatus;

    const searchLimit =
      searchCity === "All USA"
        ? SAFE_MODE_CONFIG.allUsaNormalSearchLimit
        : SAFE_MODE_CONFIG.normalSearchLimit;

    setIsSearching(true);

    try {
      const url = `${API_URL}/api/search-leads?city=${encodeURIComponent(
        searchCity
      )}&category=${encodeURIComponent(
        searchCategory
      )}&limit=${searchLimit}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log(data);
        alert(data.message || "Error searching real leads.");
        return;
      }

      const apiLeads = data.leads || [];

      if (apiLeads.length === 0) {
        alert("No leads found from Outscraper.");
        addActivityLog(
          "Search Leads",
          `No leads found for ${searchCategory} in ${searchCity}`,
          "search"
        );
        return;
      }

      const normalizedLeads = apiLeads.map((lead, index) => {
        const normalizedWebsite = lead.website || "No Website";

        return {
          id: lead.id || crypto.randomUUID(),
          name: lead.name || "Unknown Business",
          city: searchCity,
          category: searchCategory,
          website: normalizedWebsite,
          websiteUrl: lead.websiteUrl || "",
          phone: lead.phone || "",
          email: lead.email || "",
          instagram: lead.instagram || "",
          rating: Number(lead.rating) || 0,
          reviews: Number(lead.reviews) || 0,
          opportunityScore:
            Number(lead.opportunityScore) ||
            getOpportunityScoreFromWebsite(normalizedWebsite),
          status: "New",
          address: lead.address || "",
          googleMapsUrl: lead.googleMapsUrl || "",
          facebook: lead.facebook || "",
          linkedin: lead.linkedin || "",
          twitter: lead.twitter || "",
          youtube: lead.youtube || "",
          whatsapp: lead.whatsapp || "",
          notes: lead.notes || [],
          followUpDate: lead.followUpDate || "",
          proposalSentDate: lead.proposalSentDate || "",
        };
      });

      const filteredByWebsite =
        searchWebsiteStatus === "Any"
          ? normalizedLeads
          : normalizedLeads.filter(
              (lead) => lead.website === searchWebsiteStatus
            );

      if (filteredByWebsite.length === 0) {
        alert(
          `No leads matched: ${searchWebsiteStatus}. Try Website Status: Any or another category like Dentist, Contractor, Beauty Salon, or Real Estate.`
        );

        addActivityLog(
          "Search Leads",
          `No ${searchWebsiteStatus} leads found for ${searchCategory} in ${searchCity}`,
          "search"
        );
        return;
      }

      const existingLeadNames = leads.map(
        (lead) => `${lead.name.toLowerCase()}-${lead.city.toLowerCase()}`
      );

      const newLeads = filteredByWebsite.filter(
        (lead) =>
          !existingLeadNames.includes(
            `${lead.name.toLowerCase()}-${lead.city.toLowerCase()}`
          )
      );

      if (newLeads.length === 0) {
        alert("No new leads found. These real leads already exist.");

        addActivityLog(
          "Search Leads",
          `No new real leads found for ${searchCategory} in ${searchCity}`,
          "search"
        );
        return;
      }

      setLeads((currentLeads) => [...newLeads, ...currentLeads]);

      setSelectedLead(newLeads[0]);
      setContactMode(getDefaultContactMode(newLeads[0]));
      setGeneratedAudit("");

      setCity(searchCity);
      setCategory(searchCategory);
      setWebsiteStatus(searchWebsiteStatus);

      addActivityLog(
        "Search Leads",
        `${newLeads.length} real ${searchCategory} leads found in ${searchCity}`,
        "search"
      );
    } catch (error) {
      console.error("Find leads error:", error);
      alert(
        "Server error while searching leads. Make sure the backend is running."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const normalizeApiLeads = (apiLeads, searchCity, searchCategory) => {
    return apiLeads.map((lead, index) => {
      const normalizedWebsite = lead.website || "No Website";

      return {
        id: lead.id || crypto.randomUUID(),
        name: lead.name || "Unknown Business",
        city: lead.city || searchCity,
        category: searchCategory,
        website: normalizedWebsite,
        websiteUrl: lead.websiteUrl || "",
        phone: lead.phone || "",
        email: lead.email || "",
        instagram: lead.instagram || "",
        rating: Number(lead.rating) || 0,
        reviews: Number(lead.reviews) || 0,
        opportunityScore:
          Number(lead.opportunityScore) ||
          getOpportunityScoreFromWebsite(normalizedWebsite),
        status: lead.status || "New",
        address: lead.address || "",
        googleMapsUrl: lead.googleMapsUrl || "",
        facebook: lead.facebook || "",
        linkedin: lead.linkedin || "",
        twitter: lead.twitter || "",
        youtube: lead.youtube || "",
        whatsapp: lead.whatsapp || "",
        notes: lead.notes || [],
        followUpDate: lead.followUpDate || "",
        proposalSentDate: lead.proposalSentDate || "",
      };
    });
  };

  const addNewLeadsToDashboard = (newApiLeads, searchCity, searchCategory, sourceLabel) => {
    const normalizedLeads = normalizeApiLeads(
      newApiLeads,
      searchCity,
      searchCategory
    );

    const existingLeadNames = leads.map(
      (lead) => `${lead.name.toLowerCase()}-${lead.city.toLowerCase()}`
    );

    const newLeads = normalizedLeads.filter(
      (lead) =>
        !existingLeadNames.includes(
          `${lead.name.toLowerCase()}-${lead.city.toLowerCase()}`
        )
    );

    if (newLeads.length === 0) {
      alert("No new leads found. These real leads already exist.");

      addActivityLog(
        "Search Leads",
        `No new ${sourceLabel} leads found for ${searchCategory} in ${searchCity}`,
        "search"
      );

      return;
    }

    setLeads((currentLeads) => [...newLeads, ...currentLeads]);
    setSelectedLead(newLeads[0]);
    setContactMode(getDefaultContactMode(newLeads[0]));
    setGeneratedAudit("");

    setCity(searchCity);
    setCategory(searchCategory);
    setWebsiteStatus("Any");

    const leadsWithEmails = newLeads.filter((lead) => lead.email).length;

    addActivityLog(
      "Search Leads",
      `${newLeads.length} ${sourceLabel} leads found in ${searchCity}. ${leadsWithEmails} with email.`,
      "search"
    );

    alert(
      `${newLeads.length} leads added.\n${leadsWithEmails} leads include email.\n\nSafe Mode is ON to protect your Outscraper credits.`
    );
  };

  const handleFindLeadsWithEmails = async () => {
    const searchCity = city === "All" ? "All USA" : city;
    const searchCategory = category === "All" ? "Restaurant" : category;
    const enrichmentLimit =
      searchCity === "All USA"
        ? SAFE_MODE_CONFIG.allUsaEmailLimit
        : SAFE_MODE_CONFIG.singleCityEmailLimit;

    const confirmSearch = window.confirm(
      `SAFE MODE is ON. This will search real businesses and enrich up to ${enrichmentLimit} websites with email/social data. This can use Outscraper credits. Continue?`
    );

    if (!confirmSearch) return;

    setIsSearchingEmails(true);

    try {
      const url = `${API_URL}/api/search-leads-with-emails?city=${encodeURIComponent(
        searchCity
      )}&category=${encodeURIComponent(searchCategory)}&limit=${enrichmentLimit}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log(data);
        alert(data.message || "Error searching leads with emails.");
        return;
      }

      const apiLeads = data.leads || [];

      if (apiLeads.length === 0) {
        alert("No leads with websites were found to enrich.");

        addActivityLog(
          "Search Leads",
          `No enriched leads found for ${searchCategory} in ${searchCity}`,
          "search"
        );

        return;
      }

      addNewLeadsToDashboard(
        apiLeads,
        searchCity,
        searchCategory,
        "enriched"
      );
    } catch (error) {
      console.error("Find leads with emails error:", error);
      alert(
        "Server error while searching leads with emails. Make sure the backend is running."
      );
    } finally {
      setIsSearchingEmails(false);
    }
  };

  const exportLeadsCsv = () => {
    if (leads.length === 0) {
      alert("No leads to export.");
      return;
    }

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

    const escapeCsvValue = (value) => {
      const safeValue = String(value ?? "");
      return `"${safeValue.replace(/"/g, '""')}"`;
    };

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

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = "madevhub-leads.csv";
    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    addActivityLog("Export Leads", "Leads exported as CSV", "export");
  };

  const handleEnrichLead = async () => {
    if (!selectedLead) return;

    if (!selectedLead.websiteUrl) {
      alert("This lead does not have a website URL to enrich.");
      return;
    }

    setIsEnriching(true);

    try {
      const response = await fetch(`${API_URL}/api/enrich-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl: selectedLead.websiteUrl,
        }),
      });

      const data = await response.json();

      console.log("ENRICH DATA:", data);

      if (!response.ok || !data.success) {
        console.log(data);
        alert(data.message || "Error enriching this lead.");
        return;
      }

      const rawEmails = data.raw?.emails || [];
      let emailFound = "";

      if (typeof data.email === "string") {
        emailFound = data.email;
      }

      if (!emailFound && Array.isArray(rawEmails) && rawEmails.length > 0) {
        const firstEmail = rawEmails[0];

        if (typeof firstEmail === "string") {
          emailFound = firstEmail;
        } else if (typeof firstEmail === "object") {
          emailFound =
            firstEmail.value ||
            firstEmail.email ||
            firstEmail.address ||
            firstEmail.text ||
            "";
        }
      }

      const updatedLead = {
        ...selectedLead,
        email: emailFound || selectedLead.email || "",
        instagram:
          data.instagram ||
          data.raw?.instagram ||
          data.raw?.instagram_url ||
          data.raw?.socials?.instagram ||
          data.raw?.socials?.instagram_url ||
          selectedLead.instagram ||
          "",
        facebook:
          data.facebook ||
          data.raw?.facebook ||
          data.raw?.facebook_url ||
          data.raw?.socials?.facebook ||
          data.raw?.socials?.facebook_url ||
          selectedLead.facebook ||
          "",
        linkedin:
          data.linkedin ||
          data.raw?.linkedin ||
          data.raw?.linkedin_url ||
          data.raw?.socials?.linkedin ||
          data.raw?.socials?.linkedin_url ||
          selectedLead.linkedin ||
          "",
        twitter:
          data.twitter ||
          data.raw?.twitter ||
          data.raw?.twitter_url ||
          data.raw?.socials?.twitter ||
          data.raw?.socials?.twitter_url ||
          selectedLead.twitter ||
          "",
        youtube:
          data.youtube ||
          data.raw?.youtube ||
          data.raw?.youtube_url ||
          data.raw?.socials?.youtube ||
          data.raw?.socials?.youtube_url ||
          selectedLead.youtube ||
          "",
        whatsapp:
          data.whatsapp ||
          data.raw?.whatsapp ||
          data.raw?.whatsapp_url ||
          data.raw?.socials?.whatsapp ||
          data.raw?.socials?.whatsapp_url ||
          selectedLead.whatsapp ||
          "",
      };

      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === selectedLead.id ? updatedLead : lead
        )
      );

      setSelectedLead(updatedLead);
      setContactMode(getDefaultContactMode(updatedLead));

      const foundItems = [];

      if (updatedLead.email) foundItems.push(`Email: ${updatedLead.email}`);
      if (updatedLead.instagram) foundItems.push("Instagram");
      if (updatedLead.facebook) foundItems.push("Facebook");
      if (updatedLead.linkedin) foundItems.push("LinkedIn");
      if (updatedLead.twitter) foundItems.push("Twitter");
      if (updatedLead.youtube) foundItems.push("YouTube");
      if (updatedLead.whatsapp) foundItems.push("WhatsApp");

      if (foundItems.length === 0) {
        alert("No public email or social profiles found for this website.");

        addActivityLog(
          selectedLead.name,
          "Enrichment completed, but no email or socials were found",
          "enrich"
        );

        return;
      }

      alert(`Found:\n${foundItems.join("\n")}`);

      addActivityLog(
        selectedLead.name,
        `Lead enriched. Found: ${foundItems.join(", ")}`,
        "enrich"
      );
    } catch (error) {
      console.error("Enrich lead error:", error);
      alert("Server error while enriching lead.");
    } finally {
      setIsEnriching(false);
    }
  };

  const exportPrivateBackup = () => {
    const backupData = {
      app: "MADEVHUB Growth Engine",
      type: "private-crm-backup",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      leads,
      activityLog,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const dateLabel = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = `madevhub-private-backup-${dateLabel}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    addActivityLog(
      "Private Backup",
      `Backup exported with ${leads.length} leads`,
      "backup"
    );
  };

  const triggerImportBackup = () => {
    backupFileInputRef.current?.click();
  };

  const importPrivateBackup = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const confirmImport = window.confirm(
      "This will replace your current leads and activity log with the backup file. Continue?"
    );

    if (!confirmImport) {
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsedBackup = JSON.parse(reader.result);

        if (
          parsedBackup?.type !== "private-crm-backup" ||
          !Array.isArray(parsedBackup.leads) ||
          !Array.isArray(parsedBackup.activityLog)
        ) {
          alert("Invalid MADEVHUB backup file.");
          return;
        }

        const importedLeads = parsedBackup.leads;
        const importedActivityLog = parsedBackup.activityLog;

        setLeads(importedLeads);
        setActivityLog(importedActivityLog);

        const firstLead = importedLeads[0] || null;

        setSelectedLead(firstLead);
        setContactMode(getDefaultContactMode(firstLead));
        setGeneratedAudit("");
        setOutreachTitle("");
        setOutreachMessage("");
        setLeadNoteText("");
        setFollowUpDate(firstLead?.followUpDate || "");
        setHotLeadsOnly(false);
        resetLeadForm();

        addActivityLog(
          "Private Backup",
          `Backup imported with ${importedLeads.length} leads`,
          "backup"
        );

        alert(`Backup imported. ${importedLeads.length} leads restored.`);
      } catch (error) {
        console.error("Import backup error:", error);
        alert("Could not import this backup file.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  };


  const clearSavedData = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to reset all saved leads and activity logs?"
    );

    if (!confirmClear) return;

    localStorage.removeItem(STORAGE_KEYS.leads);
    localStorage.removeItem(STORAGE_KEYS.activityLog);

    setLeads(INITIAL_LEADS);
    setSelectedLead(null);
    setContactMode("call");
    setActivityLog([]);
    setGeneratedAudit("");
    setOutreachTitle("");
    setOutreachMessage("");
    setLeadNoteText("");
    setFollowUpDate("");
    setCity("Miami");
    setCategory("All");
    setWebsiteStatus("Any");
    setHotLeadsOnly(false);
    resetLeadForm();
  };

  const generateContactMessage = () => {
    if (!selectedLead) return "";

    if (contactMode === "email") {
      return `Subject: Quick idea for ${selectedLead.name}

Hi ${selectedLead.name},

I found your business online and noticed that your digital presence could be improved. You already have a strong reputation with ${selectedLead.rating} stars and ${selectedLead.reviews} reviews, but I noticed your website status is: ${selectedLead.website}.

At MADEVHUB, we help local businesses get professional websites, better visibility, and more customers.

Would you like me to send you a free digital audit for your business?

Best,
Juan
MADEVHUB`;
    }

    if (contactMode === "instagram") {
      return `Hi ${selectedLead.name}, I found your business online and noticed you have a strong local presence with ${selectedLead.rating} stars and ${selectedLead.reviews} reviews.

I also noticed your website status is: ${selectedLead.website}.

I help local businesses get professional websites and attract more customers online. Would you like me to send you a free quick digital audit?`;
    }

    return `Call Script for ${selectedLead.name}

Hi, my name is Juan from MADEVHUB. I found your business online and noticed you have great reviews.

I help local businesses improve their online presence with professional websites, better visibility, and simple automation.

I wanted to ask if you already have someone helping you with your website or online presence?

If not, I can send you a free digital audit showing a few ways your business could attract more local customers.`;
  };

  const generateAudit = () => {
    if (!selectedLead) return;

    const websiteProblem =
      selectedLead.website === "No Website"
        ? "The business does not have a professional website."
        : selectedLead.website === "Old Website"
        ? "The business may have an outdated website that needs improvement."
        : selectedLead.website === "Facebook Only"
        ? "The business depends mostly on Facebook instead of having a professional website."
        : "The business has a website, but it can still improve its online presence.";

    const contactProblem = selectedLead.email
      ? "The business has an email available, so email outreach is possible."
      : selectedLead.instagram
      ? "No public email was found, but Instagram and phone outreach are possible."
      : "No public email or Instagram was found, so phone outreach may be the best option.";

    const addressInfo = selectedLead.address
      ? `Address: ${selectedLead.address}`
      : "Address: Not found";

    const websiteInfo = selectedLead.websiteUrl
      ? `Website URL: ${selectedLead.websiteUrl}`
      : "Website URL: Not found";

    const googleMapsInfo = selectedLead.googleMapsUrl
      ? `Google Maps: ${selectedLead.googleMapsUrl}`
      : "Google Maps: Not found";

    const audit = `Digital Presence Audit for ${selectedLead.name}

Business Type: ${selectedLead.category}
Location: ${selectedLead.city}
${addressInfo}
${websiteInfo}
${googleMapsInfo}
Rating: ${selectedLead.rating} stars
Reviews: ${selectedLead.reviews}
Opportunity Score: ${selectedLead.opportunityScore}%
Lead Quality: ${getLeadQuality(selectedLead).emoji} ${getLeadQuality(selectedLead).label} (${getLeadQuality(selectedLead).score}/100)
Follow-up: ${selectedLead.followUpDate || "Not scheduled"}

Main Problems Found:
1. ${websiteProblem}
2. ${contactProblem}
3. The business may be missing a stronger online sales system.
4. There is an opportunity to improve trust, booking, and local visibility.
5. The business could convert more visitors with a better call-to-action.

Recommended Improvements:
1. Create a modern professional website.
2. Add a clear call-to-action such as "Book Now", "Call Now", or "Get a Quote".
3. Add services, prices, location, photos, and customer reviews.
4. Add a contact form connected to email.
5. Improve local SEO for customers searching in ${selectedLead.city}.
6. Add simple automation for follow-ups, appointments, or quotes.

MADEVHUB Opportunity:
This business could benefit from a professional landing page, mobile-friendly design, local SEO setup, and simple automation to help convert visitors into customers.

Suggested Offer:
Website Setup: $299 - $799
Monthly Maintenance: $49 - $149/month
Optional SEO / Automation: $99 - $299/month

Next Step:
Send a personalized message offering a free digital audit and a quick website improvement idea.`;

    setGeneratedAudit(audit);
    addActivityLog(selectedLead.name, "Digital audit generated", "audit");
  };

  const exportAudit = () => {
    if (!selectedLead) return;

    if (!generatedAudit) {
      alert("Please generate an audit first.");
      return;
    }

    const fileName = `${createSafeFileName(selectedLead.name)}-audit.txt`;

    const fileContent = `MADEVHUB AI Growth Engine
Generated Audit
Business: ${selectedLead.name}
Date: ${new Date().toLocaleString()}

${generatedAudit}`;

    const blob = new Blob([fileContent], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    addActivityLog(selectedLead.name, `Audit exported as ${fileName}`, "export");
  };

  const exportAuditPdf = () => {
    if (!selectedLead) return;

    if (!generatedAudit) {
      alert("Please generate an audit first.");
      return;
    }

    const fileName = `${createSafeFileName(selectedLead.name)}-audit.pdf`;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const maxLineWidth = pageWidth - margin * 2;

    let y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("MADEVHUB AI Growth Engine", margin, y);

    y += 8;
    doc.setFontSize(13);
    doc.text("Digital Presence Audit", margin, y);

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Business: ${selectedLead.name}`, margin, y);

    y += 6;
    doc.text(`Location: ${selectedLead.city}`, margin, y);

    y += 6;
    doc.text(`Category: ${selectedLead.category}`, margin, y);

    y += 6;
    doc.text(`Opportunity Score: ${selectedLead.opportunityScore}%`, margin, y);

    y += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);

    y += 10;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const lines = doc.splitTextToSize(generatedAudit, maxLineWidth);

    lines.forEach((line) => {
      if (y > pageHeight - 18) {
        doc.addPage();
        y = 18;
      }

      doc.text(line, margin, y);
      y += 6;
    });

    doc.save(fileName);

    addActivityLog(
      selectedLead.name,
      `Audit exported as PDF: ${fileName}`,
      "export"
    );
  };

  const createClientProposalPdf = () => {
    if (!selectedLead) {
      alert("Please select a lead first.");
      return;
    }

    const fileName = `${createSafeFileName(selectedLead.name)}-proposal.pdf`;
    const leadQuality = getLeadQuality(selectedLead);
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const maxLineWidth = pageWidth - margin * 2;

    let y = 18;

    const addNewPageIfNeeded = (extraSpace = 14) => {
      if (y > pageHeight - extraSpace) {
        doc.addPage();
        y = 18;
      }
    };

    const addSectionTitle = (title) => {
      addNewPageIfNeeded(20);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20, 30, 55);
      doc.text(title, margin, y);
      y += 7;
    };

    const addTextBlock = (text, fontSize = 10, lineHeight = 6) => {
      addNewPageIfNeeded(18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(55, 65, 85);

      const lines = doc.splitTextToSize(text, maxLineWidth);

      lines.forEach((line) => {
        addNewPageIfNeeded(12);
        doc.text(line, margin, y);
        y += lineHeight;
      });
    };

    const addBullet = (text) => {
      addNewPageIfNeeded(12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 85);

      const lines = doc.splitTextToSize(text, maxLineWidth - 8);
      doc.text("•", margin, y);
      doc.text(lines[0], margin + 6, y);
      y += 6;

      lines.slice(1).forEach((line) => {
        addNewPageIfNeeded(12);
        doc.text(line, margin + 6, y);
        y += 6;
      });
    };

    const websiteProblem =
      selectedLead.website === "No Website"
        ? "This business does not appear to have a professional website."
        : selectedLead.website === "Old Website"
        ? "This business may have an outdated website that can be improved."
        : selectedLead.website === "Facebook Only"
        ? "This business appears to depend mostly on Facebook instead of a dedicated website."
        : "This business has a website, but it can still improve conversion, trust, and local visibility.";

    const contactInfo = selectedLead.email
      ? `Email available: ${selectedLead.email}`
      : selectedLead.instagram
      ? `No public email found, but Instagram is available: ${selectedLead.instagram}`
      : selectedLead.phone
      ? `No email or Instagram found, but phone outreach is available: ${selectedLead.phone}`
      : "No strong contact channel was found yet.";

    doc.setFillColor(8, 15, 35);
    doc.rect(0, 0, pageWidth, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MADEVHUB", margin, 18);

    doc.setFontSize(12);
    doc.text("Digital Growth Proposal", margin, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 36);

    y = 54;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(selectedLead.name, margin, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Category: ${selectedLead.category}`, margin, y);
    y += 6;
    doc.text(`Location: ${selectedLead.city}`, margin, y);
    y += 6;
    doc.text(`Opportunity Score: ${selectedLead.opportunityScore}%`, margin, y);
    y += 6;
    doc.text(`Lead Quality: ${leadQuality.emoji} ${leadQuality.label} (${leadQuality.score}/100)`, margin, y);
    y += 6;
    doc.text(`Website Status: ${selectedLead.website}`, margin, y);
    y += 6;
    doc.text(`Follow-up: ${selectedLead.followUpDate || "Not scheduled"}`, margin, y);
    y += 6;
    doc.text(`Rating: ${selectedLead.rating} stars / ${selectedLead.reviews} reviews`, margin, y);
    y += 8;

    doc.setDrawColor(220, 226, 235);
    doc.line(margin, y, pageWidth - margin, y);

    addSectionTitle("1. Current Digital Situation");
    addBullet(websiteProblem);
    addBullet(contactInfo);
    addBullet(
      selectedLead.websiteUrl
        ? `Website reviewed: ${selectedLead.websiteUrl}`
        : "Website URL was not found."
    );
    addBullet(
      selectedLead.googleMapsUrl
        ? `Google Maps profile available: ${selectedLead.googleMapsUrl}`
        : "Google Maps profile link was not found."
    );

    addSectionTitle("2. Main Problems Found");
    addBullet("The business may be losing customers because visitors do not see a clear and modern conversion path.");
    addBullet("The website or online presence can be improved with stronger trust signals, service details, calls-to-action, and contact options.");
    addBullet("Local SEO can be improved so more customers find the business when searching nearby.");
    addBullet("There is an opportunity to add follow-up automation for quotes, appointments, or service requests.");

    addSectionTitle("3. Recommended MADEVHUB Solution");
    addBullet("Create or improve a premium mobile-friendly website or landing page.");
    addBullet("Add a clear call-to-action such as Book Now, Call Now, Request a Quote, or Schedule Consultation.");
    addBullet("Add services, location, testimonials, photos, contact forms, and Google Maps integration.");
    addBullet("Set up a simple lead capture and follow-up system to help convert visitors into customers.");
    addBullet(`Improve local SEO around ${selectedLead.city} and the selected business category: ${selectedLead.category}.`);

    addSectionTitle("4. Suggested Packages");
    addTextBlock(
      `Starter Website Package: $499
- Premium landing page
- Mobile responsive design
- Contact form
- Basic local SEO setup

Growth Website + SEO Package: $899
- Multi-section business website
- Services and trust sections
- Google Maps integration
- Local SEO improvement
- Lead capture optimization

Premium Website + Automation Package: $1,499
- Premium website
- Lead capture funnel
- Basic automation / follow-up flow
- Conversion-focused copy
- SEO and analytics setup

Monthly Maintenance: $99/month
- Basic updates
- Monitoring
- Small changes
- Support`,
      10,
      6
    );

    addSectionTitle("5. Next Step");
    addTextBlock(
      `Send this business a short personalized message offering a free digital audit and one clear improvement idea. The goal is to start a conversation, not sell everything in the first message.

Suggested opening:
"Hi ${selectedLead.name}, I found your business online and prepared a quick digital growth idea that could help improve your website conversions and local visibility. Would you like me to send it over?"`
    );

    addSectionTitle("Prepared by");
    addTextBlock(
      `Juan Masis
MADEVHUB
Websites • Local SEO • Automation • Digital Growth`
    );

    doc.save(fileName);

    addActivityLog(
      selectedLead.name,
      `Client proposal exported as PDF: ${fileName}`,
      "proposal"
    );
  };

  const generateOutreachSequence = (type) => {
    if (!selectedLead) return;

    const leadQuality = getLeadQuality(selectedLead);
    const businessName = selectedLead.name;
    const cityName = selectedLead.city || "your area";
    const businessCategory = selectedLead.category || "business";
    const ratingText = selectedLead.rating
      ? `${selectedLead.rating} stars`
      : "strong local presence";
    const reviewsText = selectedLead.reviews
      ? `${selectedLead.reviews} reviews`
      : "customer reviews";

    const websiteObservation =
      selectedLead.website === "No Website"
        ? "I noticed your business may not have a professional website yet."
        : selectedLead.website === "Old Website"
        ? "I noticed your website may be due for a more modern and conversion-focused upgrade."
        : selectedLead.website === "Facebook Only"
        ? "I noticed your business may be relying heavily on Facebook instead of a dedicated website."
        : "I noticed there may be room to improve your website conversion and local visibility.";

    const messages = {
      email: {
        title: "Initial Email",
        body: `Subject: Quick digital growth idea for ${businessName}

Hi ${businessName},

I found your business online while looking at ${businessCategory} businesses in ${cityName}. You already have a strong reputation with ${ratingText} and ${reviewsText}.

${websiteObservation}

At MADEVHUB, we help local businesses improve their website, local SEO, and lead capture so more visitors become real customers.

I prepared a quick digital growth idea for your business.

Would you like me to send it over?

Best,
Juan
MADEVHUB`,
      },

      instagram: {
        title: "Instagram DM",
        body: `Hi ${businessName}, I found your business online and noticed you have a strong local presence in ${cityName}.

${websiteObservation}

I help local businesses get better websites, stronger local visibility, and more customer inquiries online.

I prepared a quick digital growth idea for your business. Would you like me to send it over?`,
      },

      followup1: {
        title: "Follow-up 1",
        body: `Hi ${businessName},

Just wanted to follow up on my previous message.

I noticed a few simple improvements that could help your online presence convert more visitors into customers, especially for people searching for ${businessCategory} services in ${cityName}.

I can send you the quick audit idea if you would like to see it.

Best,
Juan
MADEVHUB`,
      },

      followup2: {
        title: "Follow-up 2",
        body: `Hi ${businessName},

Last quick follow-up from me.

I know you are probably busy, so I will keep it simple: I found a few opportunities to improve trust, visibility, and lead capture for your business online.

No pressure — I can send the quick idea over if it is useful.

Best,
Juan
MADEVHUB`,
      },

      call: {
        title: "Call Script",
        body: `Call Script for ${businessName}

Hi, my name is Juan from MADEVHUB.

I found your business online and noticed you have a strong reputation with ${ratingText} and ${reviewsText}.

The reason for my call is that I help local businesses improve their website, local visibility, and lead capture system.

I noticed one quick opportunity: ${websiteObservation}

I wanted to ask: do you currently have someone helping you with your website or online marketing?

If not, I can send you a free quick digital audit with a few improvement ideas.`,
      },
    };

    const selectedMessage = messages[type];

    setOutreachTitle(selectedMessage.title);
    setOutreachMessage(selectedMessage.body);

    addActivityLog(
      businessName,
      `${selectedMessage.title} generated. Lead quality: ${leadQuality.label}`,
      "outreach"
    );
  };

  const copyOutreachMessage = async () => {
    if (!outreachMessage) {
      alert("Generate an outreach message first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(outreachMessage);
      alert("Outreach message copied!");

      addActivityLog(
        selectedLead.name,
        `${outreachTitle || "Outreach message"} copied`,
        "copy"
      );
    } catch (error) {
      alert("Could not copy the outreach message.");
    }
  };

  const markOutreachContacted = () => {
    if (!selectedLead) return;

    updateLeadStatus(selectedLead.id, "Contacted");

    addActivityLog(
      selectedLead.name,
      "Marked as contacted from Outreach Sequence",
      "outreach"
    );

    alert(`${selectedLead.name} marked as Contacted.`);
  };

  const saveFollowUpDate = () => {
    if (!selectedLead) return;

    updateSelectedLeadData({
      followUpDate,
    });

    addActivityLog(
      selectedLead.name,
      followUpDate
        ? `Follow-up scheduled for ${followUpDate}`
        : "Follow-up date cleared",
      "follow-up"
    );

    alert(
      followUpDate
        ? `Follow-up saved for ${followUpDate}.`
        : "Follow-up date cleared."
    );
  };

  const addLeadNote = () => {
    if (!selectedLead) return;

    const cleanNote = leadNoteText.trim();

    if (!cleanNote) {
      alert("Write a note first.");
      return;
    }

    const newNote = {
      id: crypto.randomUUID(),
      text: cleanNote,
      date: new Date().toLocaleString(),
    };

    updateSelectedLeadData({
      notes: [newNote, ...(selectedLead.notes || [])],
    });

    setLeadNoteText("");

    addActivityLog(selectedLead.name, "New lead note added", "note");
  };

  const deleteLeadNote = (noteId) => {
    if (!selectedLead) return;

    const updatedNotes = (selectedLead.notes || []).filter(
      (note) => note.id !== noteId
    );

    updateSelectedLeadData({
      notes: updatedNotes,
    });

    addActivityLog(selectedLead.name, "Lead note deleted", "note");
  };

  const markProposalSent = () => {
    if (!selectedLead) return;

    const proposalDate = new Date().toLocaleDateString();

    updateSelectedLeadData({
      status: "Proposal Sent",
      proposalSentDate: proposalDate,
    });

    addActivityLog(
      selectedLead.name,
      `Proposal marked as sent on ${proposalDate}`,
      "proposal"
    );

    alert(`${selectedLead.name} marked as Proposal Sent.`);
  };


  const contactMessage = generateContactMessage();

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(contactMessage);
      alert("Message copied!");
    } catch (error) {
      alert("Could not copy the message.");
    }
  };

  const handleSendAction = async () => {
    if (!selectedLead) return;

    if (contactMode === "email" && !selectedLead.email) {
      alert("This business does not have an email.");
      return;
    }

    if (contactMode === "instagram" && !selectedLead.instagram) {
      alert("This business does not have Instagram.");
      return;
    }

    if (contactMode === "call" && !selectedLead.phone) {
      alert("This business does not have a phone number.");
      return;
    }

    if (contactMode === "instagram" || contactMode === "call") {
      await copyMessage();
    }

    updateLeadStatus(selectedLead.id, "Contacted");

    const action =
      contactMode === "email"
        ? `Email sent to ${selectedLead.email}`
        : contactMode === "instagram"
        ? `Instagram DM copied for ${selectedLead.instagram}`
        : `Call script saved for ${selectedLead.phone}`;

    addActivityLog(selectedLead.name, action, contactMode);

    if (contactMode === "email") {
      const subject = encodeURIComponent(`Quick idea for ${selectedLead.name}`);
      const body = encodeURIComponent(
        contactMessage.replace(/^Subject:.*\n\n/, "")
      );
      window.open(
        `mailto:${selectedLead.email}?subject=${subject}&body=${body}`
      );
    }
  };

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">M</div>
          <div>
            <h1>MADEVHUB</h1>
            <p>AI Growth Engine</p>
          </div>
        </div>

        <nav className="nav">
          <button
            type="button"
            className="active"
            onClick={() => scrollToSection("dashboard")}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button type="button" onClick={() => scrollToSection("search-leads")}>
            <Search size={18} /> Search Leads
          </button>

          <button type="button" onClick={() => scrollToSection("businesses")}>
            <Building2 size={18} /> Businesses
          </button>

          <button type="button" onClick={() => scrollToSection("audits")}>
            <Sparkles size={18} /> Audits
          </button>

          <button type="button" onClick={() => scrollToSection("messages")}>
            <Mail size={18} /> Messages
          </button>

          <button type="button" onClick={() => scrollToSection("pipeline")}>
            <BarChart3 size={18} /> Pipeline
          </button>

          <button type="button" onClick={() => scrollToSection("settings")}>
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div className="sidebar-box">
          <p>Find businesses. Generate audits. Close more clients.</p>
          <button>Create Demo Website</button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar" id="dashboard">
          <div>
            <h2>Welcome back, Juan 👋</h2>
            <p>Find local businesses that need websites and automation.</p>
            <div className="safe-mode-badge">
              Safe Mode ON · City emails: {SAFE_MODE_CONFIG.singleCityEmailLimit} · All USA emails: {SAFE_MODE_CONFIG.allUsaEmailLimit}
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              {theme === "dark" ? "Claro" : "Oscuro"}
            </button>

            <button className="primary-btn" onClick={startAddLead}>
              {showLeadForm && editingLeadId === null
                ? "Close Form"
                : "Add Lead"}
            </button>

            <button className="secondary-btn" onClick={exportLeadsCsv}>
              Export CSV
            </button>

            <button className="secondary-btn" onClick={exportPrivateBackup}>
              Export Backup
            </button>

            <button className="secondary-btn" onClick={triggerImportBackup}>
              Import Backup
            </button>

            <input
              ref={backupFileInputRef}
              className="hidden-file-input"
              type="file"
              accept="application/json,.json"
              onChange={importPrivateBackup}
            />

            <button className="secondary-btn" onClick={clearSavedData}>
              Reset Data
            </button>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard title="Total Leads" value={stats.total} />
          <StatCard title="Hot Leads" value={stats.hotLeads} />
          <StatCard title="Contacted" value={stats.contacted} />
          <StatCard title="Closed Deals" value={stats.closed} />
        </section>

        <section className="main-grid">
          <div className="left-panel">
            {showLeadForm && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>{editingLeadId ? "Edit Lead" : "Add New Lead"}</h3>
                    <p>
                      {editingLeadId
                        ? "Update the selected business information."
                        : "Add a business manually before connecting real lead sources."}
                    </p>
                  </div>
                </div>

                <form className="add-lead-form" onSubmit={handleSaveLead}>
                  <div className="form-grid">
                    <label>
                      Business Name
                      <input
                        type="text"
                        name="name"
                        value={leadForm.name}
                        onChange={handleLeadFormChange}
                        placeholder="Example: Miami Fresh Cuts"
                      />
                    </label>

                    <label>
                      City
                      <input
                        type="text"
                        name="city"
                        value={leadForm.city}
                        onChange={handleLeadFormChange}
                        placeholder="Miami"
                      />
                    </label>

                    <label>
                      Category
                      <select
                        name="category"
                        value={leadForm.category}
                        onChange={handleLeadFormChange}
                      >
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
                        name="website"
                        value={leadForm.website}
                        onChange={handleLeadFormChange}
                      >
                        <option>No Website</option>
                        <option>Old Website</option>
                        <option>Facebook Only</option>
                        <option>Has Website</option>
                      </select>
                    </label>

                    <label>
                      Phone
                      <input
                        type="text"
                        name="phone"
                        value={leadForm.phone}
                        onChange={handleLeadFormChange}
                        placeholder="(305) 555-0000"
                      />
                    </label>

                    <label>
                      Email
                      <input
                        type="email"
                        name="email"
                        value={leadForm.email}
                        onChange={handleLeadFormChange}
                        placeholder="info@business.com"
                      />
                    </label>

                    <label>
                      Instagram
                      <input
                        type="text"
                        name="instagram"
                        value={leadForm.instagram}
                        onChange={handleLeadFormChange}
                        placeholder="@business"
                      />
                    </label>

                    <label>
                      Rating
                      <input
                        type="number"
                        name="rating"
                        value={leadForm.rating}
                        onChange={handleLeadFormChange}
                        min="0"
                        max="5"
                        step="0.1"
                      />
                    </label>

                    <label>
                      Reviews
                      <input
                        type="number"
                        name="reviews"
                        value={leadForm.reviews}
                        onChange={handleLeadFormChange}
                        min="0"
                      />
                    </label>

                    <label>
                      Opportunity Score
                      <input
                        type="number"
                        name="opportunityScore"
                        value={leadForm.opportunityScore}
                        onChange={handleLeadFormChange}
                        min="0"
                        max="100"
                      />
                    </label>
                  </div>

                  <div className="actions">
                    <button type="submit" className="primary-btn">
                      {editingLeadId ? "Save Changes" : "Save Lead"}
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={resetLeadForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

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
                <strong>Safe Mode ON:</strong> normal searches are limited, and email enrichment is capped to protect your Outscraper credits.
              </div>

              <div className="filters">
                <label>
                  City
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
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
                  onClick={() => setHotLeadsOnly((currentValue) => !currentValue)}
                >
                  {hotLeadsOnly ? "Showing Hot Leads Only" : "Show Hot Leads Only"}
                </button>

                <span>
                  Hot Leads are the best prospects to contact first.
                </span>
              </div>
            </div>

            <div className="card private-tools-card">
              <h3>Private Data Backup</h3>
              <p className="muted">
                Export a full JSON backup to save your leads, notes, follow-ups,
                proposal status, and activity log outside the browser.
              </p>

              <div className="private-tools-grid">
                <button className="secondary-btn" onClick={exportPrivateBackup}>
                  Export Full Backup
                </button>

                <button className="secondary-btn" onClick={triggerImportBackup}>
                  Import Backup
                </button>
              </div>
            </div>

            <div className="card" id="businesses">
              <div className="card-header">
                <h3>{filteredLeads.length} Leads Found</h3>
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
                        <small className={`followup-inline ${getFollowUpStatus(lead).toLowerCase().replace(" ", "-")}`}>
                          Follow-up: {lead.followUpDate} · {getFollowUpStatus(lead)}
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
                    <span className={lead.email ? "email-found" : "email-missing"}>
                      {lead.email ? lead.email : "No email"}
                    </span>
                    <span>{lead.rating} ⭐</span>
                    <span className="score">{lead.opportunityScore}%</span>
                    <span className="status">{lead.status}</span>
                  </button>
                ))}

                {filteredLeads.length === 0 && (
                  <div className="empty-state">
                    No leads found with these filters.
                  </div>
                )}
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

                {activityLog.map((item) => (
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
          </div>

          <aside className="right-panel">
            {selectedLead ? (
              <>
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
                        ? `${selectedLead.followUpDate} · ${getFollowUpStatus(selectedLead)}`
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
                      Phone:{" "}
                      {selectedLead.phone ? selectedLead.phone : "Not found"}
                    </li>

                    <li>
                      Email:{" "}
                      {selectedLead.email ? selectedLead.email : "Not found"}
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
                      {selectedLead.whatsapp
                        ? selectedLead.whatsapp
                        : "Not found"}
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

                    <button
                      className="secondary-btn full"
                      onClick={exportAuditPdf}
                    >
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

                <div className="card">
                  <h3>Contact Actions</h3>
                  <p className="muted">
                    Choose the best way to contact this business.
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

                <div className="card" id="pipeline">
                  <h3>Pipeline Status</h3>

                  <div className="pipeline-buttons">
                    {[
                      "New",
                      "Contacted",
                      "Interested",
                      "Proposal Sent",
                      "Closed",
                      "Lost",
                    ].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            updateLeadStatus(selectedLead.id, status)
                          }
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="card" id="follow-up">
                  <h3>Lead Notes & Follow-up</h3>
                  <p className="muted">
                    Save notes and schedule the next follow-up for this lead.
                  </p>

                  <div className="followup-summary">
                    <div>
                      <strong>Next Follow-up</strong>
                      <span>
                        {selectedLead.followUpDate
                          ? `${selectedLead.followUpDate} · ${getFollowUpStatus(selectedLead)}`
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

                    <button className="secondary-btn full" onClick={saveFollowUpDate}>
                      Save Follow-up
                    </button>

                    <button className="primary-btn full" onClick={markProposalSent}>
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

                <div className="card" id="settings">
                  <h3>Lead Management</h3>
                  <p className="muted">Edit or remove this lead.</p>

                  <div className="lead-management-actions">
                    <button
                      className="secondary-btn full"
                      onClick={startEditLead}
                    >
                      Edit Lead
                    </button>

                    <button
                      className="danger-btn full"
                      onClick={deleteSelectedLead}
                    >
                      Delete Lead
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="card">
                <h3>No Lead Selected</h3>
                <p className="muted">Add or select a lead to see details.</p>
              </div>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}

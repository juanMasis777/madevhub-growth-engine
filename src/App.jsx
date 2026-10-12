import { useEffect, useMemo, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { useTheme } from "./useTheme";
import {
  STORAGE_KEYS,
  SAFE_MODE_CONFIG,
  VIEW_META,
  PIPELINE_STAGES,
  emptyLeadForm,
} from "./lib/constants.js";
import {
  getDefaultContactMode,
  convertLeadToForm,
  createSafeFileName,
  getTodayDateKey,
  getOpportunityScoreFromWebsite,
  getLeadQuality,
} from "./lib/leads.js";
import { buildTodayActionGroups } from "./lib/actionPlan.js";
import { loadFromLocalStorage, loadInitialLeads } from "./lib/storage.js";
import { isDemoLead } from "./lib/demoLeads.js";
import { API_URL, authHeaders } from "./lib/api.js";
import {
  buildAudit,
  buildContactMessage,
  buildOutreachMessages,
} from "./lib/templates.js";
import { leadsToCsv, downloadTextFile } from "./lib/exports.js";
import { loadJsPdf } from "./lib/pdf.js";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import DemoBanner from "./components/DemoBanner.jsx";
import ToastStack from "./components/ToastStack.jsx";
import DashboardView from "./components/DashboardView.jsx";
import SearchView from "./components/SearchView.jsx";
import LeadsView from "./components/LeadsView.jsx";
import AuditsView from "./components/AuditsView.jsx";
import MessagesView from "./components/MessagesView.jsx";
import PipelineView from "./components/PipelineView.jsx";
import SettingsView from "./components/SettingsView.jsx";
import "./App.css";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const backupFileInputRef = useRef(null);

  const [leads, setLeads] = useState(() =>
    loadInitialLeads()
  );

  const [selectedLead, setSelectedLead] = useState(() => {
    const savedLeads = loadInitialLeads();
    return savedLeads[0] || null;
  });

  const [city, setCity] = useState("Miami");
  const [category, setCategory] = useState("All");
  const [websiteStatus, setWebsiteStatus] = useState("Any");
  const [hotLeadsOnly, setHotLeadsOnly] = useState(false);

  const [contactMode, setContactMode] = useState(() => {
    const savedLeads = loadInitialLeads();
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
  const [activeView, setActiveView] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [safeModeLimits, setSafeModeLimits] = useState(SAFE_MODE_CONFIG);
  const [backendStatus, setBackendStatus] = useState({
    state: "checking",
    message: "Checking backend connection...",
  });

  const notify = (message, tone = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activityLog, JSON.stringify(activityLog));
  }, [activityLog]);

  // El backend expone /api/health y /api/safe-mode. Los consultamos al
  // arrancar para saber si el servidor responde y para usar SUS límites de
  // Safe Mode en lugar de los valores por defecto del frontend.
  const checkBackendConnection = async () => {
    setBackendStatus({
      state: "checking",
      message: "Checking backend connection...",
    });

    try {
      const response = await fetch(`${API_URL}/api/health`, {
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setBackendStatus({
          state: "offline",
          message: data.message || "Backend responded with an error.",
        });
        return false;
      }

      setBackendStatus({
        state: "online",
        message: `Connected to ${API_URL}`,
      });
      return true;
    } catch {
      setBackendStatus({
        state: "offline",
        message: `No response from ${API_URL}. Run "npm run server".`,
      });
      return false;
    }
  };

  const syncSafeModeLimits = async () => {
    try {
      const response = await fetch(`${API_URL}/api/safe-mode`, {
        headers: authHeaders(),
      });
      const data = await response.json();

      if (response.ok && data.success && data.limits) {
        setSafeModeLimits((currentLimits) => ({
          ...currentLimits,
          ...data.limits,
        }));
      }
    } catch {
      // Sin backend nos quedamos con los límites por defecto del frontend.
    }
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrapBackend = async () => {
      const isOnline = await checkBackendConnection();

      if (!cancelled && isOnline) {
        await syncSafeModeLimits();
      }
    };

    bootstrapBackend();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLeads = useMemo(() => {
    const searchTerm = leadSearch.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesCity =
        city === "All" || city === "All USA" || lead.city === city;
      const matchesCategory = category === "All" || lead.category === category;
      const matchesWebsite =
        websiteStatus === "Any" || lead.website === websiteStatus;
      const leadQuality = getLeadQuality(lead);
      const matchesQuality = !hotLeadsOnly || leadQuality.level === "hot";

      const matchesSearch =
        !searchTerm ||
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.city,
          lead.category,
          lead.instagram,
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm);

      return (
        matchesCity &&
        matchesCategory &&
        matchesWebsite &&
        matchesQuality &&
        matchesSearch
      );
    });
  }, [leads, city, category, websiteStatus, hotLeadsOnly, leadSearch]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      hotLeads: leads.filter((lead) => getLeadQuality(lead).level === "hot")
        .length,
      contacted: leads.filter((lead) => lead.status === "Contacted").length,
      closed: leads.filter((lead) => lead.status === "Closed").length,
    };
  }, [leads]);

  // Plan del día: agrupa los leads en las cinco acciones que realmente
  // mueven el pipeline, para no tener que revisar la lista entera a mano.
  const todayActionGroups = useMemo(
    () => buildTodayActionGroups(leads, getTodayDateKey()),
    [leads]
  );

  // The sample pipeline that ships with the public demo. Shown as a banner
  // so nobody mistakes these for real leads they scraped.
  const demoLeadCount = useMemo(
    () => leads.filter(isDemoLead).length,
    [leads]
  );

  const todayActionCount = useMemo(
    () =>
      todayActionGroups.reduce((total, group) => total + group.leads.length, 0),
    [todayActionGroups]
  );

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

  const openLeadInView = (lead, view) => {
    handleSelectLead(lead);
    setActiveView(view);
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
    setActiveView("leads");
  };

  const startEditLead = () => {
    if (!selectedLead) return;

    setLeadForm(convertLeadToForm(selectedLead));
    setEditingLeadId(selectedLead.id);
    setShowLeadForm(true);
    setActiveView("leads");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const clearDemoLeads = () => {
    const realLeads = leads.filter((lead) => !isDemoLead(lead));

    setLeads(realLeads);

    const nextSelectedLead = realLeads[0] || null;
    setSelectedLead(nextSelectedLead);
    setContactMode(getDefaultContactMode(nextSelectedLead));
    setGeneratedAudit("");
    setOutreachTitle("");
    setOutreachMessage("");
    setLeadNoteText("");
    setFollowUpDate(nextSelectedLead?.followUpDate || "");
    resetLeadForm();

    notify("Demo leads removed. The CRM is yours now.", "success");
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
      notify("Please enter the business name.");
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
        ? safeModeLimits.allUsaNormalSearchLimit
        : safeModeLimits.normalSearchLimit;

    setIsSearching(true);

    try {
      const url = `${API_URL}/api/search-leads?city=${encodeURIComponent(
        searchCity
      )}&category=${encodeURIComponent(
        searchCategory
      )}&limit=${searchLimit}`;

      const response = await fetch(url, { headers: authHeaders() });
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log(data);
        notify(data.message || "Error searching real leads.", "error");
        return;
      }

      const apiLeads = data.leads || [];

      if (apiLeads.length === 0) {
        notify("No leads found from Outscraper.");
        addActivityLog(
          "Search Leads",
          `No leads found for ${searchCategory} in ${searchCity}`,
          "search"
        );
        return;
      }

      const normalizedLeads = apiLeads.map((lead) => {
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
        notify(
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
        notify("No new leads found. These real leads already exist.");

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
      notify(
        "Server error while searching leads. Make sure the backend is running."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const normalizeApiLeads = (apiLeads, searchCity, searchCategory) => {
    return apiLeads.map((lead) => {
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
      notify("No new leads found. These real leads already exist.");

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

    notify(
      `${newLeads.length} leads added.\n${leadsWithEmails} leads include email.\n\nSafe Mode is ON to protect your Outscraper credits.`
    );
  };

  const handleFindLeadsWithEmails = async () => {
    const searchCity = city === "All" ? "All USA" : city;
    const searchCategory = category === "All" ? "Restaurant" : category;
    const enrichmentLimit =
      searchCity === "All USA"
        ? safeModeLimits.allUsaEmailLimit
        : safeModeLimits.singleCityEmailLimit;

    const confirmSearch = window.confirm(
      `SAFE MODE is ON. This will search real businesses and enrich up to ${enrichmentLimit} websites with email/social data. This can use Outscraper credits. Continue?`
    );

    if (!confirmSearch) return;

    setIsSearchingEmails(true);

    try {
      const url = `${API_URL}/api/search-leads-with-emails?city=${encodeURIComponent(
        searchCity
      )}&category=${encodeURIComponent(searchCategory)}&limit=${enrichmentLimit}`;

      const response = await fetch(url, { headers: authHeaders() });
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log(data);
        notify(data.message || "Error searching leads with emails.", "error");
        return;
      }

      const apiLeads = data.leads || [];

      if (apiLeads.length === 0) {
        notify("No leads with websites were found to enrich.");

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
      notify(
        "Server error while searching leads with emails. Make sure the backend is running."
      );
    } finally {
      setIsSearchingEmails(false);
    }
  };

  const exportLeadsCsv = () => {
    if (leads.length === 0) {
      notify("No leads to export.");
      return;
    }

    downloadTextFile(leadsToCsv(leads), "madevhub-leads.csv", "text/csv");

    addActivityLog("Export Leads", "Leads exported as CSV", "export");
  };

  const handleEnrichLead = async () => {
    if (!selectedLead) return;

    if (!selectedLead.websiteUrl) {
      notify("This lead does not have a website URL to enrich.");
      return;
    }

    setIsEnriching(true);

    try {
      const response = await fetch(`${API_URL}/api/enrich-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          websiteUrl: selectedLead.websiteUrl,
        }),
      });

      const data = await response.json();

      console.log("ENRICH DATA:", data);

      if (!response.ok || !data.success) {
        console.log(data);
        notify(data.message || "Error enriching this lead.", "error");
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
        notify("No public email or social profiles found for this website.");

        addActivityLog(
          selectedLead.name,
          "Enrichment completed, but no email or socials were found",
          "enrich"
        );

        return;
      }

      notify(`Found: ${foundItems.join(", ")}`, "success");

      addActivityLog(
        selectedLead.name,
        `Lead enriched. Found: ${foundItems.join(", ")}`,
        "enrich"
      );
    } catch (error) {
      console.error("Enrich lead error:", error);
      notify("Server error while enriching lead.", "error");
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
          notify("Invalid MADEVHUB backup file.");
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

        notify(`Backup imported. ${importedLeads.length} leads restored.`);
      } catch (error) {
        console.error("Import backup error:", error);
        notify("Could not import this backup file.");
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

    setLeads([]);
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

  const generateContactMessage = () =>
    buildContactMessage(selectedLead, contactMode);

  const generateAudit = () => {
    if (!selectedLead) return;

    setGeneratedAudit(buildAudit(selectedLead));
    addActivityLog(selectedLead.name, "Digital audit generated", "audit");
  };

  const exportAudit = () => {
    if (!selectedLead) return;

    if (!generatedAudit) {
      notify("Please generate an audit first.");
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

  const exportAuditPdf = async () => {
    if (!selectedLead) return;

    if (!generatedAudit) {
      notify("Please generate an audit first.");
      return;
    }

    const fileName = `${createSafeFileName(selectedLead.name)}-audit.pdf`;
    let JsPdf;

    try {
      JsPdf = await loadJsPdf();
    } catch {
      notify("Could not load the PDF export module.", "error");
      return;
    }

    const doc = new JsPdf();

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

  const createClientProposalPdf = async () => {
    if (!selectedLead) {
      notify("Please select a lead first.");
      return;
    }

    const fileName = `${createSafeFileName(selectedLead.name)}-proposal.pdf`;
    const leadQuality = getLeadQuality(selectedLead);
    let JsPdf;

    try {
      JsPdf = await loadJsPdf();
    } catch {
      notify("Could not load the PDF export module.", "error");
      return;
    }

    const doc = new JsPdf();

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

    const selectedMessage = buildOutreachMessages(selectedLead)[type];

    if (!selectedMessage) return;

    setOutreachTitle(selectedMessage.title);
    setOutreachMessage(selectedMessage.body);

    addActivityLog(
      selectedLead.name,
      `${selectedMessage.title} generated. Lead quality: ${
        getLeadQuality(selectedLead).label
      }`,
      "outreach"
    );
  };

  const copyOutreachMessage = async () => {
    if (!outreachMessage) {
      notify("Generate an outreach message first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(outreachMessage);
      notify("Outreach message copied!", "success");

      addActivityLog(
        selectedLead.name,
        `${outreachTitle || "Outreach message"} copied`,
        "copy"
      );
    } catch {
      notify("Could not copy the outreach message.");
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

    notify(`${selectedLead.name} marked as Contacted.`);
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

    notify(
      followUpDate
        ? `Follow-up saved for ${followUpDate}.`
        : "Follow-up date cleared."
    );
  };

  const addLeadNote = () => {
    if (!selectedLead) return;

    const cleanNote = leadNoteText.trim();

    if (!cleanNote) {
      notify("Write a note first.");
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

    notify(`${selectedLead.name} marked as Proposal Sent.`);
  };

  const contactMessage = generateContactMessage();

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(contactMessage);
      notify("Message copied!", "success");
    } catch {
      notify("Could not copy the message.");
    }
  };

  const handleSendAction = async () => {
    if (!selectedLead) return;

    if (contactMode === "email" && !selectedLead.email) {
      notify("This business does not have an email.");
      return;
    }

    if (contactMode === "instagram" && !selectedLead.instagram) {
      notify("This business does not have Instagram.");
      return;
    }

    if (contactMode === "call" && !selectedLead.phone) {
      notify("This business does not have a phone number.");
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

  const currentMeta = VIEW_META[activeView] || VIEW_META.dashboard;
  const pipelineCounts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: leads.filter((lead) => lead.status === stage).length,
  }));
  const leadsWithEmail = leads.filter((lead) => lead.email).length;
  const emailRate = leads.length
    ? Math.round((leadsWithEmail / leads.length) * 100)
    : 0;

  const leadFormCard = showLeadForm ? (
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
  ) : null;

  const noLeadState = (
    <div className="card view-empty">
      <div className="view-empty-icon">
        <Building2 size={30} />
      </div>
      <h3>No lead selected</h3>
      <p className="muted">
        Pick a business from your list to work on it here.
      </p>
      <button className="primary-btn" onClick={() => setActiveView("leads")}>
        Go to Businesses
      </button>
    </div>
  );

  return (
    <main className="app">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <section className="content">
        <input
          ref={backupFileInputRef}
          className="hidden-file-input"
          type="file"
          accept="application/json,.json"
          onChange={importPrivateBackup}
        />

        <Topbar
          currentMeta={currentMeta}
          safeModeLimits={safeModeLimits}
          theme={theme}
          toggleTheme={toggleTheme}
          startAddLead={startAddLead}
          showLeadForm={showLeadForm}
          editingLeadId={editingLeadId}
          exportLeadsCsv={exportLeadsCsv}
        />

        {demoLeadCount > 0 && (
          <DemoBanner
            demoLeadCount={demoLeadCount}
            clearDemoLeads={clearDemoLeads}
          />
        )}

        {/* ===================== DASHBOARD ===================== */}
        {activeView === "dashboard" && (
          <DashboardView
            activityLog={activityLog}
            emailRate={emailRate}
            leads={leads}
            leadsWithEmail={leadsWithEmail}
            openLeadInView={openLeadInView}
            pipelineCounts={pipelineCounts}
            setActiveView={setActiveView}
            stats={stats}
            todayActionCount={todayActionCount}
            todayActionGroups={todayActionGroups}
          />
        )}
        {/* ===================== SEARCH ===================== */}
        {activeView === "search" && (
          <SearchView
            category={category}
            city={city}
            handleFindLeads={handleFindLeads}
            handleFindLeadsWithEmails={handleFindLeadsWithEmails}
            hotLeadsOnly={hotLeadsOnly}
            isSearching={isSearching}
            isSearchingEmails={isSearchingEmails}
            setActiveView={setActiveView}
            setCategory={setCategory}
            setCity={setCity}
            setHotLeadsOnly={setHotLeadsOnly}
            setWebsiteStatus={setWebsiteStatus}
            startAddLead={startAddLead}
            websiteStatus={websiteStatus}
          />
        )}
        {/* ===================== BUSINESSES / LEADS ===================== */}
        {activeView === "leads" && (
          <LeadsView
            filteredLeads={filteredLeads}
            getFollowUpStatus={getFollowUpStatus}
            handleSelectLead={handleSelectLead}
            leadFormCard={leadFormCard}
            leadSearch={leadSearch}
            leads={leads}
            selectedLead={selectedLead}
            setActiveView={setActiveView}
            setLeadSearch={setLeadSearch}
          />
        )}
        {/* ===================== AUDITS ===================== */}
        {activeView === "audits" && (
          <AuditsView
            createClientProposalPdf={createClientProposalPdf}
            exportAudit={exportAudit}
            exportAuditPdf={exportAuditPdf}
            generateAudit={generateAudit}
            generatedAudit={generatedAudit}
            getFollowUpStatus={getFollowUpStatus}
            handleEnrichLead={handleEnrichLead}
            isEnriching={isEnriching}
            noLeadState={noLeadState}
            selectedLead={selectedLead}
          />
        )}
        {/* ===================== MESSAGES ===================== */}
        {activeView === "messages" && (
          <MessagesView
            contactMessage={contactMessage}
            contactMode={contactMode}
            copyMessage={copyMessage}
            copyOutreachMessage={copyOutreachMessage}
            generateOutreachSequence={generateOutreachSequence}
            handleSendAction={handleSendAction}
            markOutreachContacted={markOutreachContacted}
            noLeadState={noLeadState}
            outreachMessage={outreachMessage}
            outreachTitle={outreachTitle}
            selectedLead={selectedLead}
            setContactMode={setContactMode}
          />
        )}
        {/* ===================== PIPELINE ===================== */}
        {activeView === "pipeline" && (
          <PipelineView
            addLeadNote={addLeadNote}
            deleteLeadNote={deleteLeadNote}
            followUpDate={followUpDate}
            getFollowUpStatus={getFollowUpStatus}
            leadNoteText={leadNoteText}
            markProposalSent={markProposalSent}
            noLeadState={noLeadState}
            saveFollowUpDate={saveFollowUpDate}
            selectedLead={selectedLead}
            setFollowUpDate={setFollowUpDate}
            setLeadNoteText={setLeadNoteText}
            updateLeadStatus={updateLeadStatus}
          />
        )}
        {/* ===================== SETTINGS ===================== */}
        {activeView === "settings" && (
          <SettingsView
            backendStatus={backendStatus}
            checkBackendConnection={checkBackendConnection}
            clearSavedData={clearSavedData}
            deleteSelectedLead={deleteSelectedLead}
            exportLeadsCsv={exportLeadsCsv}
            exportPrivateBackup={exportPrivateBackup}
            notify={notify}
            safeModeLimits={safeModeLimits}
            selectedLead={selectedLead}
            startEditLead={startEditLead}
            syncSafeModeLimits={syncSafeModeLimits}
            theme={theme}
            toggleTheme={toggleTheme}
            triggerImportBackup={triggerImportBackup}
          />
        )}
      </section>

      {/* ===================== TOASTS ===================== */}
      <ToastStack toasts={toasts} />
    </main>
  );
}


// ============================================================
// Sidebar navigation. Kept apart from constants.js so that module stays
// free of React/icon imports and can be used from plain Node tests.
// ============================================================

import {
  LayoutDashboard,
  Search,
  Building2,
  Sparkles,
  Mail,
  Settings,
  BarChart3,
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "search", label: "Search Leads", icon: Search },
  { id: "leads", label: "Businesses", icon: Building2 },
  { id: "audits", label: "Audits", icon: Sparkles },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "pipeline", label: "Pipeline", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

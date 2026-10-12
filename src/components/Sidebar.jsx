// ============================================================
// Left navigation: brand, view switcher and the shortcut to lead search.
// ============================================================

import { NAV_ITEMS } from "../lib/navigation.js";

export default function Sidebar({ activeView, setActiveView }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">M</div>
        <div>
          <h1>MADEVHUB</h1>
          <p>AI Growth Engine</p>
        </div>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? "active" : ""}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={18} /> {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-box">
        <p>Find businesses. Generate audits. Close more clients.</p>
        <button onClick={() => setActiveView("search")}>Find New Leads</button>
      </div>
    </aside>
  );
}

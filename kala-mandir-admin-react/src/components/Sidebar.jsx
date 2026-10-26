import { useEffect, useState } from "react";
import logo from "../images/Kalamandir Lotus Logo on Deep Plum.png";

export default function Sidebar({ currentPage, onNavigate, onLogout, open, onClose, user }) {
  const [galleryExpanded, setGalleryExpanded] = useState(
    ["gallery", "categories", "subcategories"].includes(currentPage),
  );
  const [eventsExpanded, setEventsExpanded] = useState(
    currentPage === "events" || currentPage === "event-categories",
  );

  useEffect(() => {
    if (["gallery", "categories", "subcategories"].includes(currentPage)) {
      setGalleryExpanded(true);
    }
    if (currentPage === "events" || currentPage === "event-categories") {
      setEventsExpanded(true);
    }
  }, [currentPage]);

  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? "show" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img className="sidebar-logo" src={logo} alt="Kala Mandir — Art, Dance, Creativity" />
          <small>Admin</small>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Overview</div>
          <button
            type="button"
            className={`nav-item ${currentPage === "dashboard" ? "active" : ""}`}
            onClick={() => onNavigate("dashboard")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </button>

          <div className="nav-section">Media</div>
          <button
            type="button"
            className={`nav-item nav-group-toggle ${["gallery", "categories", "subcategories"].includes(currentPage) ? "active" : ""}`}
            onClick={() => setGalleryExpanded((expanded) => !expanded)}
            aria-expanded={galleryExpanded}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Gallery
            <span className="nav-group-indicator" aria-hidden="true">{galleryExpanded ? "−" : "+"}</span>
          </button>
          {galleryExpanded && (
            <div className="nav-submenu">
              <button
                type="button"
                className={`nav-item ${currentPage === "gallery" ? "active" : ""}`}
                onClick={() => onNavigate("gallery")}
              >
                All Media
              </button>
              <button
                type="button"
                className={`nav-item ${currentPage === "categories" ? "active" : ""}`}
                onClick={() => onNavigate("categories")}
              >
                Categories
              </button>
              <button
                type="button"
                className={`nav-item ${currentPage === "subcategories" ? "active" : ""}`}
                onClick={() => onNavigate("subcategories")}
              >
                Subcategories
              </button>
            </div>
          )}

          <div className="nav-section">Event Management</div>
          <button
            type="button"
            className={`nav-item nav-group-toggle ${currentPage === "events" || currentPage === "event-categories" ? "active" : ""}`}
            onClick={() => setEventsExpanded((expanded) => !expanded)}
            aria-expanded={eventsExpanded}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18M10 14l5 3-5 3z" />
            </svg>
            Events
            <span className="nav-group-indicator" aria-hidden="true">{eventsExpanded ? "−" : "+"}</span>
          </button>
          {eventsExpanded && (
            <div className="nav-submenu">
              <button
                type="button"
                className={`nav-item ${currentPage === "events" ? "active" : ""}`}
                onClick={() => onNavigate("events")}
              >
                Event Media
              </button>
              <button
                type="button"
                className={`nav-item ${currentPage === "event-categories" ? "active" : ""}`}
                onClick={() => onNavigate("event-categories")}
              >
                Event Categories
              </button>
            </div>
          )}

          <div className="nav-section">Inbox</div>
          <button
            type="button"
            className={`nav-item ${currentPage === "enquiries" ? "active" : ""}`}
            onClick={() => onNavigate("enquiries")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="m3 7 9 6 9-6M3 15h5l2 2h4l2-2h5" />
            </svg>
            Enquiries
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <strong>{user?.username || "Admin"}</strong>
              <span>{user?.email || ""}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{
                padding: "6px 10px",
                color: "rgba(255,255,255,0.7)",
                borderColor: "rgba(255,255,255,0.15)",
              }}
              onClick={onLogout}
              title="Logout"
            >
              ↩
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

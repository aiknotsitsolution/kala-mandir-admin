import logo from "../images/Kalamandir Lotus Logo on Deep Plum.png";

export default function Sidebar({ currentPage, onNavigate, onLogout, open, onClose, user }) {
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
            className={`nav-item ${currentPage === "gallery" ? "active" : ""}`}
            onClick={() => onNavigate("gallery")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Gallery
          </button>
          <button
            type="button"
            className={`nav-item ${currentPage === "categories" ? "active" : ""}`}
            onClick={() => onNavigate("categories")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            Categories
          </button>
          <button
            type="button"
            className={`nav-item ${currentPage === "subcategories" ? "active" : ""}`}
            onClick={() => onNavigate("subcategories")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 5h16M4 12h10M4 19h7" />
              <circle cx="19" cy="12" r="2" />
              <circle cx="16" cy="19" r="2" />
            </svg>
            Subcategories
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

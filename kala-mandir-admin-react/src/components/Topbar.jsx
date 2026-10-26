export default function Topbar({ title, onMenuToggle, user, onProfileClick }) {
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" className="menu-toggle" onClick={onMenuToggle}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div className="topbar-title">{title}</div>
      </div>
      <button
        type="button"
        className="topbar-profile"
        onClick={onProfileClick}
        aria-label="Edit admin profile"
        title="Edit profile"
      >
        {user?.profilePhotoUrl ? (
          <img src={user.profilePhotoUrl} alt="" className="topbar-avatar-image" />
        ) : (
          <span className="topbar-avatar-fallback" aria-hidden="true">
            {(user?.username || "A").charAt(0).toUpperCase()}
          </span>
        )}
        <span className="topbar-profile-name">{user?.username || "Admin"}</span>
      </button>
    </header>
  );
}

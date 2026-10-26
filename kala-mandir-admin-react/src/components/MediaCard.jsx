export default function MediaCard({ item, categoryName, onEdit, onDelete, onOpen }) {
  const isVideo = item.type === "video";
  const canOpen = Boolean(isVideo && onOpen);

  return (
    <div className="gallery-item">
      <div
        className={`gallery-thumb${canOpen ? " video-thumb" : ""}`}
        onClick={canOpen ? () => onOpen(item) : undefined}
        onKeyDown={
          canOpen
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(item);
                }
              }
            : undefined
        }
        role={canOpen ? "button" : undefined}
        tabIndex={canOpen ? 0 : undefined}
        aria-label={canOpen ? `Play ${item.title}` : undefined}
      >
        <img src={item.thumb} alt={item.title} loading="lazy" />
        {isVideo && (
          <div className="video-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>
      <div className="gallery-meta">
        <h4 title={item.title}>{item.title}</h4>
        <div className="cats">
          {categoryName}
          {item.subcategory ? ` · ${item.subcategory}` : ""}
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(item)}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(item)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

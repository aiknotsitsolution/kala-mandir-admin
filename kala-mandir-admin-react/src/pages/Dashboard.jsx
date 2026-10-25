import MediaCard from "../components/MediaCard";

export default function Dashboard({ media, categories, onNavigate, onEdit, onDelete }) {
  const photoCount = media.filter((m) => m.type === "photo").length;
  const videoCount = media.filter((m) => m.type === "video").length;
  const subcatCount = categories.reduce((s, c) => s + c.subcategories.length, 0);
  const recent = media.slice(0, 4);

  const getCatName = (id) => categories.find((c) => c.id === id)?.name || "—";

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your gallery content</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="label">Total Photos</div>
          <div className="value">{photoCount}</div>
          <div className="hint">Across all categories</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Videos</div>
          <div className="value">{videoCount}</div>
          <div className="hint">Uploaded & published</div>
        </div>
        <div className="stat-card">
          <div className="label">Categories</div>
          <div className="value">{categories.length}</div>
          <div className="hint">Photo + Video</div>
        </div>
        <div className="stat-card">
          <div className="label">Subcategories</div>
          <div className="value">{subcatCount}</div>
          <div className="hint">Active groups</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Uploads</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("gallery")}>
            View all →
          </button>
        </div>
        <div className="card-body">
          <div className="gallery-grid">
            {recent.map((m) => (
              <MediaCard
                key={m.id}
                item={m}
                categoryName={getCatName(m.categoryId)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

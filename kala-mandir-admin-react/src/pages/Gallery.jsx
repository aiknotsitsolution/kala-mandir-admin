import { useState, useMemo } from "react";
import MediaCard from "../components/MediaCard";
import VideoPlayerModal from "../components/VideoPlayerModal";

export default function Gallery({ media, categories, onAdd, onEdit, onDelete }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [preview, setPreview] = useState(null); // { item, categoryName }

  const getCatName = (id) => categories.find((c) => c.id === id)?.name || "—";

  const filtered = useMemo(() => {
    let list = media;
    if (typeFilter !== "all") list = list.filter((m) => m.type === typeFilter);
    if (catFilter) list = list.filter((m) => String(m.categoryId) === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(q));
    }
    return list;
  }, [media, typeFilter, catFilter, search]);

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Gallery</h2>
          <p>Manage photos & videos with titles, categories</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          + Add Media
        </button>
      </div>

      <div className="tabs">
        {["all", "photo", "video"].map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${typeFilter === t ? "active" : ""}`}
            onClick={() => setTypeFilter(t)}
          >
            {t === "all" ? "All" : t === "photo" ? "Photos" : "Videos"}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select-field"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <h4>No media found</h4>
          <p>Try a different filter or add new media.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.map((m) => (
            <MediaCard
              key={m.id}
              item={m}
              categoryName={getCatName(m.categoryId)}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpen={(item) =>
                setPreview({ item, categoryName: getCatName(item.categoryId) })
              }
            />
          ))}
        </div>
      )}

      <VideoPlayerModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        item={preview?.item}
        categoryName={preview?.categoryName}
      />
    </div>
  );
}

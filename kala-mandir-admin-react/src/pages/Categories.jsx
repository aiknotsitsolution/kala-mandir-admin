import { useState } from "react";

export default function Categories({
  categories,
  onAdd,
  onEdit,
  onDelete,
}) {
  const [typeFilter, setTypeFilter] = useState("photo");

  const list = categories.filter((c) => c.type === typeFilter);

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Categories</h2>
          <p>Organize photos & videos into categories and subcategories</p>
        </div>
        <button className="btn btn-primary" onClick={() => onAdd(typeFilter)}>
          + Add Category
        </button>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${typeFilter === "photo" ? "active" : ""}`}
          onClick={() => setTypeFilter("photo")}
        >
          Photo Categories
        </button>
        <button
          type="button"
          className={`tab ${typeFilter === "video" ? "active" : ""}`}
          onClick={() => setTypeFilter("video")}
        >
          Video Categories
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <h4>No categories yet</h4>
          <p>Add a {typeFilter} category to get started.</p>
        </div>
      ) : (
        <div className="cat-list">
          {list.map((c) => (
            <div key={c.id}>
              <div className="cat-row">
                <div className={`cat-icon ${c.type}`}>
                  {c.type === "photo" ? "🖼" : "▶"}
                </div>
                <div className="cat-info">
                  <h4>{c.name}</h4>
                  <span>
                    {c.subcategories.length} subcategor
                    {c.subcategories.length === 1 ? "y" : "ies"} · {c.type}
                  </span>
                </div>
                <div className="cat-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => onEdit(c)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(c)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

export default function Subcategories({ categories, onAdd, onEdit, onDelete }) {
  const [typeFilter, setTypeFilter] = useState("photo");
  const [categoryFilter, setCategoryFilter] = useState("");
  const availableCategories = categories.filter((item) => item.type === typeFilter);
  const rows = availableCategories.flatMap((category) =>
    category.subcategories
      .filter(() => !categoryFilter || category.id === categoryFilter)
      .map((name) => ({ id: `${category.id}:${name}`, category, name })),
  );

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Subcategories</h2>
          <p>Create and manage subcategories under an existing category</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => onAdd(typeFilter)}
          disabled={!availableCategories.length}
        >
          + Add Subcategory
        </button>
      </div>

      <div className="toolbar">
        <div className="tabs" style={{ marginBottom: 0 }}>
          {["photo", "video"].map((type) => (
            <button
              key={type}
              type="button"
              className={`tab ${typeFilter === type ? "active" : ""}`}
              onClick={() => {
                setTypeFilter(type);
                setCategoryFilter("");
              }}
            >
              {type === "photo" ? "Photo Subcategories" : "Video Subcategories"}
            </button>
          ))}
        </div>
        <select
          className="select-field"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="">All {typeFilter} categories</option>
          {availableCategories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      {!availableCategories.length ? (
        <div className="empty">
          <h4>Create a category first</h4>
          <p>Add a {typeFilter} category before creating its subcategories.</p>
        </div>
      ) : !rows.length ? (
        <div className="empty">
          <h4>No subcategories yet</h4>
          <p>Add a subcategory under one of your {typeFilter} categories.</p>
        </div>
      ) : (
        <div className="cat-list">
          {rows.map(({ id, category, name }) => (
            <div className="cat-row" key={id}>
              <div className={`cat-icon ${category.type}`}>{category.type === "photo" ? "🖼" : "▶"}</div>
              <div className="cat-info">
                <h4>{name}</h4>
                <span>{category.name} · {category.type}</span>
              </div>
              <div className="cat-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onEdit(category, name)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onDelete(category, name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

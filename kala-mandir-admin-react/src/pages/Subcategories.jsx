import { useState } from "react";

export default function Subcategories({ categories, onAdd, onEdit, onDelete }) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const rows = categories.flatMap((category) =>
    category.subcategories
      .filter(() => !categoryFilter || category.id === categoryFilter)
      .map((name) => ({ id: `${category.id}:${name}`, category, name })),
  );

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Subcategories</h2>
          <p>Manage subcategories shared by photos and videos</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={onAdd}
          disabled={!categories.length}
        >
          + Add Subcategory
        </button>
      </div>

      <div className="toolbar">
        <select
          className="select-field"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      {!categories.length ? (
        <div className="empty">
          <h4>Create a category first</h4>
          <p>Add a category before creating its subcategories.</p>
        </div>
      ) : !rows.length ? (
        <div className="empty">
          <h4>No subcategories yet</h4>
          <p>Add a subcategory under one of your categories.</p>
        </div>
      ) : (
        <div className="cat-list">
          {rows.map(({ id, category, name }) => (
            <div className="cat-row" key={id}>
              <div className="cat-icon">↳</div>
              <div className="cat-info">
                <h4>{name}</h4>
                <span>{category.name}</span>
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

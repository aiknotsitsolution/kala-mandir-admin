export default function Categories({
  categories,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Categories</h2>
          <p>Organize photos and videos using the same categories</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          + Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="empty">
          <h4>No categories yet</h4>
          <p>Add a category to get started.</p>
        </div>
      ) : (
        <div className="cat-list">
          {categories.map((c) => (
            <div key={c.id}>
              <div className="cat-row">
                <div className="cat-icon">▦</div>
                <div className="cat-info">
                  <h4>{c.name}</h4>
                  <span>
                    {c.subcategories.length} subcategor
                    {c.subcategories.length === 1 ? "y" : "ies"}
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

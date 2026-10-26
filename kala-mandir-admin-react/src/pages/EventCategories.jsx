export default function EventCategories({ categories, onAdd, onEdit, onDelete }) {
  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Event Categories</h2>
          <p>Create categories to organize website events and workshops</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Add Category</button>
      </div>

      {!categories.length ? (
        <div className="empty">
          <h4>No event categories yet</h4>
          <p>Add an event category before creating events.</p>
        </div>
      ) : (
        <div className="cat-list">
          {categories.map((category) => (
            <div className="cat-row" key={category.id}>
              <div className="cat-icon">▦</div>
              <div className="cat-info"><h4>{category.name}</h4></div>
              <div className="cat-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(category)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(category)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

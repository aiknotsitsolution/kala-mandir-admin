export default function AdminEvents({ events, categories, onAdd, onEdit, onDelete }) {
  const categoryName = (category) =>
    categories.find((item) => item.id === (category?._id || category))?.name || "—";

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Events</h2>
          <p>Publish event details and a photo or video to the public website</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd} disabled={!categories.length}>
          + Add Event
        </button>
      </div>

      {!categories.length ? (
        <div className="empty">
          <h4>Create an event category first</h4>
          <p>Event media needs a category before it can be published.</p>
        </div>
      ) : !events.length ? (
        <div className="empty">
          <h4>No events yet</h4>
          <p>Add an event to publish it on the website.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {events.map((event) => (
            <div className="gallery-item" key={event.id}>
              <div className="gallery-thumb">
                {event.type === "video" ? (
                  <video src={event.url} poster={event.thumbnailUrl} controls preload="metadata" />
                ) : (
                  <img src={event.thumbnailUrl || event.url} alt={event.title} loading="lazy" />
                )}
              </div>
              <div className="gallery-meta">
                <h4 title={event.title}>{event.title}</h4>
                <div className="cats">{categoryName(event.categoryId)} · {event.type}</div>
                <p className="event-description-preview">{event.description}</p>
                <div className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => onEdit(event)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(event)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

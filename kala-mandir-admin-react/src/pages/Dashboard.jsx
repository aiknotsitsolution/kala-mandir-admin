import MediaCard from "../components/MediaCard";

const getCategoryId = (category) => category?._id || category;

export default function Dashboard({
  media,
  categories,
  events,
  eventCategories,
  onNavigate,
  onEdit,
  onDelete,
}) {
  const photoCount = media.filter((m) => m.type === "photo").length;
  const videoCount = media.filter((m) => m.type === "video").length;
  const subcatCount = categories.reduce((s, c) => s + c.subcategories.length, 0);
  const recent = media.slice(0, 4);
  const recentEvents = events.slice(0, 4);
  const totalMedia = photoCount + videoCount;
  const photoPercent = totalMedia ? (photoCount / totalMedia) * 100 : 0;
  const videoPercent = totalMedia ? (videoCount / totalMedia) * 100 : 0;
  const eventCategoryCounts = eventCategories
    .map((category) => ({
      ...category,
      count: events.filter((event) => getCategoryId(event.categoryId) === category.id).length,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const maxEventCategoryCount = Math.max(1, ...eventCategoryCounts.map((item) => item.count));

  const getCatName = (id) => categories.find((c) => c.id === id)?.name || "—";

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Your gallery and event activity at a glance</p>
        </div>
        <div className="dashboard-quick-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("events")}>Manage events</button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("gallery")}>Open gallery</button>
        </div>
      </div>

      <div className="stats-row">
        <button type="button" className="stat-card stat-card-button" onClick={() => onNavigate("gallery")}>
          <div className="label">Total Photos</div>
          <div className="value">{photoCount}</div>
          <div className="hint">Across all categories</div>
        </button>
        <button type="button" className="stat-card stat-card-button" onClick={() => onNavigate("gallery")}>
          <div className="label">Total Videos</div>
          <div className="value">{videoCount}</div>
          <div className="hint">Uploaded & published</div>
        </button>
        <button type="button" className="stat-card stat-card-button" onClick={() => onNavigate("categories")}>
          <div className="label">Categories</div>
          <div className="value">{categories.length}</div>
          <div className="hint">Gallery categories</div>
        </button>
        <button type="button" className="stat-card stat-card-button" onClick={() => onNavigate("subcategories")}>
          <div className="label">Subcategories</div>
          <div className="value">{subcatCount}</div>
          <div className="hint">Active groups</div>
        </button>
        <button type="button" className="stat-card stat-card-event stat-card-button" onClick={() => onNavigate("events")}>
          <div className="label">Events</div>
          <div className="value">{events.length}</div>
          <div className="hint">{eventCategories.length} event categories</div>
        </button>
      </div>

      <div className="dashboard-insights">
        <section className="card dashboard-chart-card">
          <div className="card-header">
            <div>
              <h3>Gallery breakdown</h3>
              <p className="dashboard-card-hint">Photos and videos in your library</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("gallery")}>View gallery →</button>
          </div>
          <div className="dashboard-chart-body">
            <div
              className="dashboard-donut"
              role="img"
              aria-label={`${photoCount} photos and ${videoCount} videos`}
              style={{
                "--photo-share": `${photoPercent}%`,
                "--video-share": `${photoPercent + videoPercent}%`,
              }}
            >
              <div className="dashboard-donut-center">
                <strong>{totalMedia}</strong>
                <span>Total media</span>
              </div>
            </div>
            <div className="dashboard-legend">
              <div className="dashboard-legend-item">
                <span className="dashboard-legend-dot photo-dot" />
                <span>Photos</span>
                <strong>{photoCount}</strong>
              </div>
              <div className="dashboard-legend-item">
                <span className="dashboard-legend-dot video-dot" />
                <span>Videos</span>
                <strong>{videoCount}</strong>
              </div>
              <div className="dashboard-stacked-track" aria-hidden="true">
                <span className="photo-segment" style={{ width: `${photoPercent}%` }} />
                <span className="video-segment" style={{ width: `${videoPercent}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="card dashboard-chart-card">
          <div className="card-header">
            <div>
              <h3>Events by category</h3>
              <p className="dashboard-card-hint">{events.length} events across {eventCategories.length} categories</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("event-categories")}>Manage →</button>
          </div>
          <div className="dashboard-category-chart">
            {!eventCategoryCounts.length ? (
              <div className="dashboard-chart-empty">
                <p>No event categories yet</p>
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("event-categories")}>
                  Add event category
                </button>
              </div>
            ) : (
              eventCategoryCounts.map((category) => (
                <div className="dashboard-bar-row" key={category.id}>
                  <div className="dashboard-bar-label" title={category.name}>{category.name}</div>
                  <div
                    className="dashboard-bar-track"
                    role="img"
                    aria-label={`${category.name}: ${category.count} events`}
                  >
                    <span style={{ width: `${(category.count / maxEventCategoryCount) * 100}%` }} />
                  </div>
                  <strong className="dashboard-bar-count">{category.count}</strong>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="dashboard-recent-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent uploads</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("gallery")}>View all →</button>
          </div>
          <div className="card-body">
            {recent.length ? (
              <div className="gallery-grid dashboard-recent-media">
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
            ) : <p className="dashboard-empty-note">No gallery uploads yet.</p>}
          </div>
        </div>

        <section className="card dashboard-recent-events">
          <div className="card-header">
            <h3>Recent events</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("events")}>View all →</button>
          </div>
          <div className="dashboard-event-list">
            {recentEvents.length ? recentEvents.map((event) => {
              const categoryId = getCategoryId(event.categoryId);
              const categoryName = eventCategories.find((item) => item.id === categoryId)?.name || "—";
              return (
                <div className="dashboard-event-row" key={event.id}>
                  <img src={event.thumbnailUrl || event.url} alt="" loading="lazy" />
                  <div>
                    <strong title={event.title}>{event.title}</strong>
                    <span>{categoryName} · {event.type}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="dashboard-chart-empty">
                <p>No events published yet</p>
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("events")}>Add event</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Enquiries({ enquiries, onDelete }) {
  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Enquiries</h2>
          <p>Website contact requests and class enquiries</p>
        </div>
        <div className="enquiry-count">{enquiries.length} total</div>
      </div>

      {!enquiries.length ? (
        <div className="empty">
          <h4>No enquiries yet</h4>
          <p>Website enquiries will appear here after visitors submit the contact form.</p>
        </div>
      ) : (
        <div className="enquiry-list">
          {enquiries.map((enquiry) => (
            <article className="enquiry-card" key={enquiry._id}>
              <div className="enquiry-card-header">
                <div>
                  <h3>{enquiry.username || enquiry.name || "Website enquiry"}</h3>
                  <p>{new Date(enquiry.createdAt).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => onDelete(enquiry)}
                  aria-label={`Delete enquiry from ${enquiry.username || enquiry.name || "visitor"}`}
                >
                  Delete
                </button>
              </div>
              <div className="enquiry-details">
                <div><span>Phone</span><a href={`tel:${enquiry.phone}`}>{enquiry.phone || "—"}</a></div>
                {enquiry.email && <div><span>Email</span><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a></div>}
                <div><span>Interested in</span><strong>{enquiry.interest || enquiry.subject || "—"}</strong></div>
                {enquiry.ageGroup && <div><span>Age group</span><strong>{enquiry.ageGroup}</strong></div>}
              </div>
              <p className="enquiry-message">{enquiry.message || "No message provided."}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

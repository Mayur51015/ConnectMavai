import toast from 'react-hot-toast';

/**
 * ContactRequestsModal - View and manage incoming contact requests
 */
const ContactRequestsModal = ({ pendingRequests, onClose, onAccept, onReject }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card contact-requests-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Contact Requests</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="contact-requests-list">
          {pendingRequests.length === 0 ? (
            <div className="no-requests">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <p>No pending requests</p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req._id} className="contact-request-item">
                <div className="contact-request-avatar">
                  {req.from?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="contact-request-info">
                  <span className="contact-request-name">{req.from?.username}</span>
                  <span className="contact-request-time">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="contact-request-actions">
                  <button
                    className="contact-accept-btn"
                    onClick={() => onAccept(req._id, req.from)}
                    title="Accept"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button
                    className="contact-reject-btn"
                    onClick={() => onReject(req._id)}
                    title="Reject"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactRequestsModal;

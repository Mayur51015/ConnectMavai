import { useState } from 'react';

/**
 * CallsTab component - WhatsApp-style calls dashboard
 * Shows favourites section, recent call history, and search
 */
const CallsTab = ({
  callHistory,
  favourites,
  onlineUsers,
  onCallUser,
  onToggleFavourite,
  currentUser,
  users,
  contactStatuses,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFavourites, setShowAllFavourites] = useState(false);

  const getAvatarColor = (name) => {
    const colors = [
      '#6C63FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatCallTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Filter contacts for search (only accepted contacts)
  const acceptedContacts = (users || []).filter(
    (u) => contactStatuses?.[u._id]?.status === 'accepted'
  );

  const filteredContacts = searchQuery
    ? acceptedContacts.filter((u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const isFavourite = (userId) => {
    return (favourites || []).some((f) => (f._id || f) === userId);
  };

  const displayedFavourites = showAllFavourites
    ? (favourites || [])
    : (favourites || []).slice(0, 3);

  // Filter call history by search
  const filteredHistory = searchQuery
    ? (callHistory || []).filter((call) => {
        const name = call.otherUser?.username || call.otherUser?.displayName || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : (callHistory || []);

  return (
    <div className="calls-tab">
      {/* Header */}
      <div className="calls-tab-header">
        <h3 className="calls-tab-title">Calls</h3>
        <button className="calls-new-call-btn" title="New call">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="calls-plus-icon">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="calls-search">
        <div className="search-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search name or number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="calls-content">
        {/* Search results */}
        {searchQuery && filteredContacts.length > 0 && (
          <div className="calls-search-results">
            <h4 className="calls-section-title">Contacts</h4>
            {filteredContacts.map((u) => {
              const isOnline = onlineUsers.includes(u._id);
              return (
                <div key={u._id} className="call-contact-item">
                  <div className="call-avatar" style={{ backgroundColor: getAvatarColor(u.username) }}>
                    {u.username.charAt(0).toUpperCase()}
                    <span className={`call-status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="call-contact-info">
                    <span className="call-contact-name">{u.displayName || u.username}</span>
                    <span className="call-contact-status">{isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  <div className="call-action-buttons">
                    <button
                      className="call-action-btn"
                      onClick={() => onCallUser(u._id, u.username, 'video')}
                      title="Video call"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </button>
                    <button
                      className="call-action-btn"
                      onClick={() => onCallUser(u._id, u.username, 'voice')}
                      title="Voice call"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Favourites Section */}
        {!searchQuery && (favourites || []).length > 0 && (
          <div className="calls-favourites-section">
            <h4 className="calls-section-title">Favourites</h4>
            {displayedFavourites.map((fav) => {
              const favId = fav._id || fav;
              const name = fav.username || 'Unknown';
              const isOnline = onlineUsers.includes(favId);
              return (
                <div key={favId} className="favourite-item">
                  <div className="favourite-avatar" style={{ backgroundColor: getAvatarColor(name) }}>
                    {name.charAt(0).toUpperCase()}
                    <span className={`call-status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="favourite-info">
                    <span className="favourite-name">{fav.displayName || name}</span>
                  </div>
                  <div className="call-action-buttons">
                    <button
                      className="call-action-btn"
                      onClick={() => onCallUser(favId, name, 'video')}
                      title="Video call"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </button>
                    <button
                      className="call-action-btn"
                      onClick={() => onCallUser(favId, name, 'voice')}
                      title="Voice call"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                  </div>
                  <button
                    className="favourite-remove-btn"
                    onClick={() => onToggleFavourite(favId, true)}
                    title="Remove from favourites"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {(favourites || []).length > 3 && (
              <button
                className="calls-view-all-btn"
                onClick={() => setShowAllFavourites(!showAllFavourites)}
              >
                {showAllFavourites ? 'Show less' : 'View all'}
              </button>
            )}
            <div className="calls-section-divider"></div>
          </div>
        )}

        {/* Recent Calls Section */}
        {!searchQuery && (
          <div className="calls-recent-section">
            <h4 className="calls-section-title">Recent</h4>
            {filteredHistory.length === 0 ? (
              <div className="calls-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <p>No recent calls</p>
                <span>Your call history will appear here</span>
              </div>
            ) : (
              filteredHistory.map((call) => {
                const otherUser = call.otherUser || {};
                const name = otherUser.displayName || otherUser.username || 'Unknown';
                const isOutgoing = call.direction === 'outgoing';
                const isMissed = call.status === 'missed' || call.status === 'rejected';
                const isAnswered = call.status === 'answered';
                const isOnline = onlineUsers.includes(otherUser._id);

                return (
                  <div key={call._id} className="call-log-item">
                    <div className="call-log-avatar" style={{ backgroundColor: getAvatarColor(name) }}>
                      {name.charAt(0).toUpperCase()}
                      <span className={`call-status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                    </div>
                    <div className="call-log-info">
                      <span className={`call-log-name ${isMissed ? 'missed' : ''}`}>
                        {name}
                      </span>
                      <div className="call-log-detail">
                        <span className={`call-direction-icon ${isMissed ? 'missed' : isOutgoing ? 'outgoing' : 'incoming'}`}>
                          {isMissed ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                              <line x1="23" y1="1" x2="1" y2="23" />
                            </svg>
                          ) : isOutgoing ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="7 17 17 7" />
                              <polyline points="7 7 17 7 17 17" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="17 7 7 17" />
                              <polyline points="17 17 7 17 7 7" />
                            </svg>
                          )}
                        </span>
                        <span className="call-log-type">
                          {isMissed ? 'Missed' : isOutgoing ? 'Outgoing' : 'Incoming'}
                        </span>
                        {isAnswered && call.duration > 0 && (
                          <span className="call-log-duration"> · {formatDuration(call.duration)}</span>
                        )}
                      </div>
                    </div>
                    <div className="call-log-right">
                      <span className="call-log-time">{formatCallTime(call.createdAt)}</span>
                      <div className="call-log-actions">
                        {call.callType === 'video' ? (
                          <button
                            className="call-action-btn-sm"
                            onClick={() => onCallUser(otherUser._id, name, 'video')}
                            title="Video call"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="23 7 16 12 23 17 23 7" />
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            className="call-action-btn-sm"
                            onClick={() => onCallUser(otherUser._id, name, 'voice')}
                            title="Voice call"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                          </button>
                        )}
                        <button
                          className={`call-fav-btn ${isFavourite(otherUser._id) ? 'active' : ''}`}
                          onClick={() => onToggleFavourite(otherUser._id, isFavourite(otherUser._id))}
                          title={isFavourite(otherUser._id) ? 'Remove from favourites' : 'Add to favourites'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavourite(otherUser._id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallsTab;

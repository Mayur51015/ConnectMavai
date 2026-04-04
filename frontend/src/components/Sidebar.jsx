import { useState } from 'react';
import CallsTab from './CallsTab';

/**
 * Sidebar component - displays list of users/rooms/calls with search, online status, unread badges
 * Supports tabs: Users | Rooms | Calls
 */
const Sidebar = ({
  users, onlineUsers, selectedUser, onSelectUser, unreadCounts, currentUser,
  rooms, selectedRoom, onSelectRoom, onCreateRoom,
  contactStatuses, onSendContactRequest,
  pendingRequestCount, onShowContactRequests,
  // Calls props
  callHistory, favourites, onCallUser, onToggleFavourite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = (rooms || []).filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getContactLabel = (userId) => {
    const cs = contactStatuses?.[userId];
    if (!cs) return 'none';
    return cs.status;
  };

  return (
    <div className="sidebar">
      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Chats
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Rooms
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'calls' ? 'active' : ''}`}
          onClick={() => setActiveTab('calls')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Calls
        </button>
        {pendingRequestCount > 0 && (
          <button className="sidebar-requests-btn" onClick={onShowContactRequests} title="Contact Requests">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            <span className="requests-badge">{pendingRequestCount}</span>
          </button>
        )}
      </div>

      {/* Search bar (for users and rooms tabs) */}
      {activeTab !== 'calls' && (
        <div className="sidebar-search">
          <div className="search-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder={activeTab === 'users' ? 'Search users...' : 'Search rooms...'}
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
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="user-list">
          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>{searchQuery ? 'No users found' : 'No users available'}</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isOnline = onlineUsers.includes(u._id);
              const isSelected = selectedUser?._id === u._id;
              const unread = unreadCounts[u._id] || 0;
              const contactLabel = getContactLabel(u._id);

              return (
                <div
                  key={u._id}
                  className={`user-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectUser(u)}
                >
                  <div className="user-avatar" style={{ backgroundColor: getAvatarColor(u.username) }}>
                    {u.username.charAt(0).toUpperCase()}
                    <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="user-info">
                    <div className="user-name-row">
                      <span className="user-name">{u.username}</span>
                      {!isOnline && u.lastSeen && (
                        <span className="last-seen">{formatLastSeen(u.lastSeen)}</span>
                      )}
                    </div>
                    <span className={`user-status ${isOnline ? 'online' : 'offline'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {unread > 0 && (
                    <div className="unread-badge">
                      {unread > 99 ? '99+' : unread}
                    </div>
                  )}
                  {contactLabel === 'none' && (
                    <button
                      className="add-contact-btn"
                      onClick={(e) => { e.stopPropagation(); onSendContactRequest(u._id); }}
                      title="Send contact request"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                    </button>
                  )}
                  {contactLabel === 'pending' && (
                    <span className="contact-pending-badge">Pending</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="user-list">
          <button className="create-room-btn" onClick={onCreateRoom}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Room
          </button>
          {filteredRooms.length === 0 ? (
            <div className="no-users">
              <p>{searchQuery ? 'No rooms found' : 'No rooms yet'}</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isSelected = selectedRoom?._id === room._id;
              return (
                <div
                  key={room._id}
                  className={`user-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectRoom(room)}
                >
                  <div className="user-avatar room-avatar" style={{ backgroundColor: getAvatarColor(room.name) }}>
                    {room.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name-row">
                      <span className="user-name">{room.name}</span>
                    </div>
                    <span className="user-status">
                      {room.members?.length || 0} member{(room.members?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Calls Tab */}
      {activeTab === 'calls' && (
        <CallsTab
          callHistory={callHistory}
          favourites={favourites}
          onlineUsers={onlineUsers}
          onCallUser={onCallUser}
          onToggleFavourite={onToggleFavourite}
          currentUser={currentUser}
          users={users}
          contactStatuses={contactStatuses}
        />
      )}
    </div>
  );
};

export default Sidebar;


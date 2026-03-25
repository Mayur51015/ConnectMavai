import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * UserProfileModal - View another user's profile (read-only)
 */
const UserProfileModal = ({ userId, onClose, onlineUsers }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/users/${userId}`);
        setProfile(res.data);
      } catch {
        toast.error('Failed to load profile');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  const isOnline = onlineUsers?.includes(userId);

  const getAvatarSrc = (avatarPath) => {
    if (avatarPath && avatarPath.startsWith('/uploads')) return `${API_URL}${avatarPath}`;
    return null;
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {loading ? (
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <span>Loading profile...</span>
          </div>
        ) : profile ? (
          <div className="user-profile-content">
            <div className="user-profile-avatar-section">
              <div className="user-profile-avatar-large">
                {getAvatarSrc(profile.avatar) ? (
                  <img src={getAvatarSrc(profile.avatar)} alt="" className="profile-avatar-img" />
                ) : (
                  profile.username?.charAt(0).toUpperCase()
                )}
              </div>
              <div className={`user-profile-status-dot ${isOnline ? 'online' : 'offline'}`}></div>
            </div>

            <h2 className="user-profile-display-name">
              {profile.displayName || profile.username}
            </h2>
            <span className="user-profile-username">@{profile.username}</span>

            <div className={`user-profile-online-status ${isOnline ? 'online' : 'offline'}`}>
              <span className="user-profile-status-indicator"></span>
              {isOnline ? 'Online' : `Last seen ${formatLastSeen(profile.lastSeen)}`}
            </div>

            {profile.bio && (
              <div className="user-profile-bio">
                <h4>About</h4>
                <p>{profile.bio}</p>
              </div>
            )}

            <div className="user-profile-joined">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UserProfileModal;

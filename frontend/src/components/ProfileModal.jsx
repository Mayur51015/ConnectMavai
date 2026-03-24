import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * ProfileModal - Edit user profile (displayName, bio, avatar picture, password)
 * Username is read-only
 */
const ProfileModal = ({ user, onClose, onProfileUpdate }) => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/users/profile');
        setDisplayName(res.data.displayName || '');
        setBio(res.data.bio || '');
        setAvatarUrl(res.data.avatar || '');
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(res.data.avatar);
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Failed to upload picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const data = { displayName, bio, avatar: avatarUrl };
      if (password) data.password = password;
      const res = await api.put('/api/users/profile', data);
      toast.success('Profile updated!');
      if (onProfileUpdate) onProfileUpdate(res.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSrc = () => {
    if (avatarUrl && avatarUrl.startsWith('/uploads')) {
      return `${API_URL}${avatarUrl}`;
    }
    return avatarUrl || null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loadingProfile ? (
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <span>Loading profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {/* Avatar with upload */}
            <div className="profile-avatar-section">
              <div
                className="profile-avatar-large clickable"
                onClick={() => fileInputRef.current?.click()}
                title="Click to change picture"
              >
                {getAvatarSrc() ? (
                  <img src={getAvatarSrc()} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  user?.username?.charAt(0).toUpperCase()
                )}
                <div className="avatar-upload-overlay">
                  {uploading ? (
                    <div className="loading-spinner" style={{ width: 20, height: 20 }}></div>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <span className="form-hint" style={{ textAlign: 'center', marginTop: 6 }}>Click to upload photo</span>
            </div>

            {/* Username (read-only) */}
            <div className="form-group">
              <label>Username</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input type="text" value={user?.username || ''} disabled className="input-disabled" />
              </div>
              <span className="form-hint">Username cannot be changed</span>
            </div>

            {/* Display Name */}
            <div className="form-group">
              <label>Display Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <input
                  type="text"
                  placeholder="Enter display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="form-group">
              <label>Bio</label>
              <textarea
                className="profile-bio-input"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <span className="form-hint">{bio.length}/200</span>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>New Password (optional)</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {password && (
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <div className="btn-loader"></div> : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;

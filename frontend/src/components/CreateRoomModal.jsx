import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * CreateRoomModal - Create a new group chat room
 * Select members from user list and set room name
 */
const CreateRoomModal = ({ users, onClose, onRoomCreated, api }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Room name is required');
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error('Select at least one member');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/rooms', {
        name: name.trim(),
        description: description.trim(),
        members: selectedMembers,
      });
      toast.success('Room created!');
      onRoomCreated(res.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card create-room-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Room</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Room Name</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <input
                type="text"
                placeholder="Enter room name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              className="profile-bio-input"
              placeholder="What's this room about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Add Members ({selectedMembers.length} selected)</label>
            <div className="member-search-wrapper">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="member-search-input"
              />
            </div>
            <div className="member-select-list">
              {filteredUsers.map((u) => {
                const isSelected = selectedMembers.includes(u._id);
                return (
                  <div
                    key={u._id}
                    className={`member-select-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleMember(u._id)}
                  >
                    <div className="member-select-avatar">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="member-select-name">{u.username}</span>
                    <div className={`member-select-check ${isSelected ? 'checked' : ''}`}>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading || !name.trim() || selectedMembers.length === 0}>
            {loading ? <div className="btn-loader"></div> : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;

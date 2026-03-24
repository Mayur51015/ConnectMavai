import { useRef, useEffect, useCallback, useState } from 'react';
import TypingIndicator from './TypingIndicator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * ChatWindow - messages with editing, deletion, room sender names
 */
const ChatWindow = ({ messages, currentUserId, typingUser, selectedUser, loadingMessages, hasMore, onLoadMore, onEditMessage, onDeleteMessage, isRoom }) => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUser]);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 50 && hasMore && !loadingMessages) {
      prevScrollHeight.current = container.scrollHeight;
      onLoadMore();
    }
  }, [hasMore, loadingMessages, onLoadMore]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container && prevScrollHeight.current > 0) {
      const heightDiff = container.scrollHeight - prevScrollHeight.current;
      container.scrollTop = heightDiff;
      prevScrollHeight.current = 0;
    }
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shouldShowDate = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    return new Date(currentMsg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="status-icon sent"><polyline points="20 6 9 17 4 12" /></svg>);
      case 'delivered':
        return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="status-icon delivered"><polyline points="18 6 7 17 2 12" /><polyline points="23 6 12 17" /></svg>);
      case 'seen':
        return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="status-icon seen"><polyline points="18 6 7 17 2 12" /><polyline points="23 6 12 17" /></svg>);
      default: return null;
    }
  };

  const startEditing = (msg) => { setEditingId(msg._id); setEditText(msg.message); };
  const cancelEditing = () => { setEditingId(null); setEditText(''); };
  const submitEdit = () => {
    if (editText.trim() && onEditMessage) onEditMessage(editingId, editText.trim());
    cancelEditing();
  };
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(); }
    if (e.key === 'Escape') cancelEditing();
  };

  return (
    <div className="chat-messages" ref={chatContainerRef} onScroll={handleScroll}>
      {loadingMessages && (
        <div className="loading-messages"><div className="loading-spinner"></div><span>Loading messages...</span></div>
      )}
      {hasMore && !loadingMessages && (
        <div className="load-more-area"><button className="load-more-btn" onClick={onLoadMore}>Load older messages</button></div>
      )}

      {messages.map((msg, index) => {
        const isSent = msg.senderId === currentUserId || msg.senderId?._id === currentUserId;
        const showDate = shouldShowDate(msg, messages[index - 1]);
        const isEditing = editingId === msg._id;

        return (
          <div key={msg._id || index}>
            {showDate && (<div className="date-separator"><span>{formatDate(msg.timestamp)}</span></div>)}

            <div className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
              <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
                {isRoom && !isSent && (
                  <span className="room-sender-name">{msg.senderUsername || msg.senderId?.username || 'User'}</span>
                )}

                {isEditing ? (
                  <div className="message-edit-mode">
                    <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={handleEditKeyDown} className="message-edit-input" autoFocus />
                    <div className="message-edit-actions">
                      <button className="edit-confirm-btn" onClick={submitEdit} title="Save">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      </button>
                      <button className="edit-cancel-btn" onClick={cancelEditing} title="Cancel">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="message-text">{msg.message}</p>
                    <div className="message-meta">
                      {msg.edited && <span className="message-edited-label">edited</span>}
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                      {isSent && !isRoom && getStatusIcon(msg.status)}
                    </div>
                  </>
                )}

                {/* Action buttons for sent messages */}
                {isSent && !isEditing && (
                  <div className="message-action-btns">
                    {onEditMessage && !isRoom && (
                      <button className="message-edit-btn" onClick={() => startEditing(msg)} title="Edit">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    {onDeleteMessage && (
                      <button className="message-delete-btn" onClick={() => onDeleteMessage(msg._id)} title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {typingUser && (
        <div className="message-wrapper received">
          <TypingIndicator username={selectedUser?.username || selectedUser?.name} />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;

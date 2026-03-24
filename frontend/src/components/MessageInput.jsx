import { useState, useRef, useEffect } from 'react';
import EmojiPickerComponent from './EmojiPicker';

/**
 * MessageInput component - text input with emoji picker and send button
 * Shows blocked state when users are not contacts
 */
const MessageInput = ({ onSendMessage, onTyping, onStopTyping, isContact, onSendContactRequest, contactStatus }) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isContact !== false) {
      inputRef.current?.focus();
    }
  }, [isContact]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage('');
    setShowEmoji(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onStopTyping();
    inputRef.current?.focus();
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    onTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1500);
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Show contact request banner if not contacts
  if (isContact === false) {
    return (
      <div className="message-input-container">
        <div className="not-contact-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {contactStatus?.status === 'pending' && contactStatus?.direction === 'sent' ? (
            <span>Contact request sent — waiting for acceptance</span>
          ) : contactStatus?.status === 'pending' && contactStatus?.direction === 'received' ? (
            <span>This user sent you a request — check your contact requests</span>
          ) : (
            <>
              <span>Send a contact request to start chatting</span>
              <button className="send-request-inline-btn" onClick={onSendContactRequest}>
                Send Request
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="message-input-container">
      {showEmoji && (
        <div className="emoji-picker-wrapper">
          <EmojiPickerComponent onEmojiClick={handleEmojiClick} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="message-form">
        <button
          type="button"
          className={`emoji-toggle-btn ${showEmoji ? 'active' : ''}`}
          onClick={() => setShowEmoji(!showEmoji)}
          title="Emoji"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="message-input"
          autoComplete="off"
        />

        <button
          type="submit"
          className="send-btn"
          disabled={!message.trim()}
          title="Send"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;

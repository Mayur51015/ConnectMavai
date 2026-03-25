import { useState, useRef, useEffect } from 'react';
import EmojiPickerComponent from './EmojiPicker';
import api from '../utils/api';
import toast from 'react-hot-toast';

/**
 * MessageInput component - text input with emoji picker, file attachment, voice recording, and send button
 * Shows blocked state when users are not contacts
 */
const MessageInput = ({ onSendMessage, onTyping, onStopTyping, isContact, onSendContactRequest, contactStatus }) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    if (isContact !== false) {
      inputRef.current?.focus();
    }
  }, [isContact]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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

  // File upload handler
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File must be under 25MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Send message with file attachment
      onSendMessage('', res.data.fileUrl, res.data.fileType, res.data.fileName);
      toast.success('File sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size < 1000) {
          // Too short recording, skip
          return;
        }

        setUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, `voice-${Date.now()}.webm`);
          const res = await api.post('/api/messages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          onSendMessage('', res.data.fileUrl, 'voice', res.data.fileName);
          toast.success('Voice message sent!');
        } catch {
          toast.error('Failed to send voice message');
        } finally {
          setUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // Recording mode
  if (isRecording) {
    return (
      <div className="message-input-container">
        <div className="message-form recording-mode">
          <button type="button" className="recording-cancel-btn" onClick={cancelRecording} title="Cancel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
          </div>
          <button type="button" className="recording-stop-btn" onClick={stopRecording} title="Send voice message">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
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

        {/* File attachment button */}
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          disabled={uploading}
        >
          {uploading ? (
            <div className="btn-loader-small"></div>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

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

        {message.trim() ? (
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
        ) : (
          <button
            type="button"
            className="mic-btn"
            onClick={startRecording}
            title="Record voice message"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;

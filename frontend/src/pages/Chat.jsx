import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import ThemeToggle from '../components/ThemeToggle';
import ProfileModal from '../components/ProfileModal';
import CreateRoomModal from '../components/CreateRoomModal';
import ContactRequestsModal from '../components/ContactRequestsModal';
import UserProfileModal from '../components/UserProfileModal';
import VideoCall from '../components/VideoCall';
import api from '../utils/api';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Main Chat page
 */
const Chat = () => {
  const { user, logout, updateUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChat, setShowChat] = useState(false);

  // Feature state
  const [rooms, setRooms] = useState([]);
  const [contactStatuses, setContactStatuses] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showContactRequestsModal, setShowContactRequestsModal] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  // User Profile Viewing
  const [viewProfileUserId, setViewProfileUserId] = useState(null);

  // Video Call state
  const [activeCall, setActiveCall] = useState(null); // { remoteUserId, remoteUserName, isIncoming, offer }
  const [incomingCall, setIncomingCall] = useState(null); // { from, callerName, offer }

  // Responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) setShowChat(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch users, rooms, contact statuses, pending requests
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, roomsRes, statusesRes, pendingRes] = await Promise.allSettled([
          api.get('/api/users'),
          api.get('/api/rooms'),
          api.get('/api/contacts/statuses'),
          api.get('/api/contacts/pending'),
        ]);
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
        if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data);
        if (statusesRes.status === 'fulfilled') setContactStatuses(statusesRes.value.data);
        if (pendingRes.status === 'fulfilled') setPendingRequests(pendingRes.value.data);
      } catch { /* ignore */ }
    };
    fetchAll();
  }, []);

  // Fetch DM messages
  useEffect(() => { if (selectedUser) fetchMessages(1); }, [selectedUser]);
  // Fetch room messages
  useEffect(() => { if (selectedRoom) fetchRoomMessages(1); }, [selectedRoom]);

  const fetchMessages = async (pageNum) => {
    if (!selectedUser) return;
    setLoadingMessages(true);
    try {
      const res = await api.get(`/api/messages/${selectedUser._id}?page=${pageNum}&limit=50`);
      if (pageNum === 1) setMessages(res.data.messages);
      else setMessages((prev) => [...res.data.messages, ...prev]);
      setPage(pageNum);
      setHasMore(res.data.pagination.hasMore);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoadingMessages(false); }
  };

  const fetchRoomMessages = async (pageNum) => {
    if (!selectedRoom) return;
    setLoadingMessages(true);
    try {
      const res = await api.get(`/api/rooms/${selectedRoom._id}/messages?page=${pageNum}&limit=50`);
      if (pageNum === 1) setMessages(res.data.messages);
      else setMessages((prev) => [...res.data.messages, ...prev]);
      setPage(pageNum);
      setHasMore(res.data.pagination.hasMore);
    } catch { toast.error('Failed to load room messages'); }
    finally { setLoadingMessages(false); }
  };

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loadingMessages) {
      if (selectedRoom) fetchRoomMessages(page + 1);
      else fetchMessages(page + 1);
    }
  }, [hasMore, loadingMessages, page, selectedUser, selectedRoom]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (selectedUser && (message.senderId === selectedUser._id || message.receiverId === selectedUser._id)) {
        setMessages((prev) => [...prev, message]);
        if (message.senderId === selectedUser._id) socket.emit('messageSeen', { senderId: selectedUser._id });
      } else if (message.senderId !== user.id) {
        setUnreadCounts((prev) => ({ ...prev, [message.senderId]: (prev[message.senderId] || 0) + 1 }));
        toast(`New message from ${message.senderUsername || 'someone'}`, { icon: '💬', duration: 3000 });
      }
    };

    const handleNewRoomMessage = (message) => {
      if (selectedRoom && message.roomId === selectedRoom._id) {
        if (message.senderId !== user.id) setMessages((prev) => [...prev, message]);
      } else if (message.senderId !== user.id) {
        toast(`New message in room`, { icon: '👥', duration: 3000 });
      }
    };

    const handleMessageEdited = (editData) => {
      setMessages((prev) => prev.map((msg) =>
        msg._id === editData._id ? { ...msg, message: editData.message, edited: editData.edited, editedAt: editData.editedAt } : msg
      ));
    };

    const handleUserTyping = ({ userId: typerId }) => {
      if (selectedUser && typerId === selectedUser._id) setTypingUser(typerId);
    };
    const handleUserStopTyping = ({ userId: typerId }) => {
      if (typerId === typingUser) setTypingUser(null);
    };
    const handleMessagesDelivered = ({ by }) => {
      setMessages((prev) => prev.map((msg) => msg.receiverId === by && msg.status === 'sent' ? { ...msg, status: 'delivered' } : msg));
    };
    const handleMessagesSeen = ({ by }) => {
      setMessages((prev) => prev.map((msg) => msg.receiverId === by && msg.status !== 'seen' ? { ...msg, status: 'seen' } : msg));
    };
    const handleContactRequestReceived = (request) => {
      setPendingRequests((prev) => [request, ...prev]);
      toast(`${request.from?.username || 'Someone'} sent you a contact request`, { icon: '👤', duration: 4000 });
    };
    const handleContactAccepted = ({ by, username }) => {
      setContactStatuses((prev) => ({ ...prev, [by]: { status: 'accepted', direction: 'sent' } }));
      toast(`${username} accepted your contact request!`, { icon: '✅', duration: 3000 });
    };

    // Incoming video call handler
    const handleIncomingCall = ({ from, callerName, offer }) => {
      // Don't show if already in a call
      if (activeCall) {
        socket.emit('callRejected', { to: from, reason: 'User is busy' });
        return;
      }
      setIncomingCall({ from, callerName, offer });
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('newRoomMessage', handleNewRoomMessage);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStopTyping', handleUserStopTyping);
    socket.on('messagesDelivered', handleMessagesDelivered);
    socket.on('messagesSeen', handleMessagesSeen);
    socket.on('contactRequestReceived', handleContactRequestReceived);
    socket.on('contactAcceptedNotification', handleContactAccepted);
    socket.on('incomingCall', handleIncomingCall);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('newRoomMessage', handleNewRoomMessage);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStopTyping', handleUserStopTyping);
      socket.off('messagesDelivered', handleMessagesDelivered);
      socket.off('messagesSeen', handleMessagesSeen);
      socket.off('contactRequestReceived', handleContactRequestReceived);
      socket.off('contactAcceptedNotification', handleContactAccepted);
      socket.off('incomingCall', handleIncomingCall);
    };
  }, [socket, selectedUser, selectedRoom, user, typingUser, activeCall]);

  // --- Handlers ---

  const handleSelectUser = (u) => {
    setSelectedUser(u); setSelectedRoom(null); setMessages([]); setPage(1); setHasMore(false); setTypingUser(null); setShowRoomInfo(false);
    setUnreadCounts((prev) => ({ ...prev, [u._id]: 0 }));
    if (socket) socket.emit('messageSeen', { senderId: u._id });
    if (isMobileView) setShowChat(true);
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room); setSelectedUser(null); setMessages([]); setPage(1); setHasMore(false); setTypingUser(null); setShowRoomInfo(false);
    if (isMobileView) setShowChat(true);
  };

  const handleSendMessage = (messageText, fileUrl, fileType, fileName) => {
    if (!socket) return;
    if (!messageText?.trim() && !fileUrl) return;
    
    if (selectedRoom) {
      socket.emit('sendRoomMessage', {
        roomId: selectedRoom._id,
        message: messageText?.trim() || '',
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        fileName: fileName || null,
      }, (res) => {
        if (res.error) toast.error(res.error);
        else setMessages((prev) => [...prev, res]);
      });
    } else if (selectedUser) {
      socket.emit('sendMessage', {
        receiverId: selectedUser._id,
        message: messageText?.trim() || '',
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        fileName: fileName || null,
      }, (res) => {
        if (res.error) toast.error(res.error);
        else setMessages((prev) => [...prev, res]);
      });
    }
  };

  const handleEditMessage = (messageId, newText) => {
    if (!socket) return;
    socket.emit('editMessage', { messageId, newText }, (res) => {
      if (res.error) toast.error(res.error);
      else setMessages((prev) => prev.map((msg) => msg._id === res._id ? { ...msg, message: res.message, edited: true, editedAt: res.editedAt } : msg));
    });
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/api/messages/${messageId}`);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedUser) return;
    if (!confirm('Delete entire chat with this user? This cannot be undone.')) return;
    try {
      await api.delete(`/api/messages/chat/${selectedUser._id}`);
      setMessages([]);
      toast.success('Chat deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    if (!confirm(`Delete room "${selectedRoom.name}"? All messages will be lost.`)) return;
    try {
      await api.delete(`/api/rooms/${selectedRoom._id}`);
      setRooms((prev) => prev.filter((r) => r._id !== selectedRoom._id));
      setSelectedRoom(null);
      setMessages([]);
      setShowRoomInfo(false);
      toast.success('Room deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;
    if (!confirm(`Leave room "${selectedRoom.name}"?`)) return;
    try {
      await api.post(`/api/rooms/${selectedRoom._id}/leave`);
      setRooms((prev) => prev.filter((r) => r._id !== selectedRoom._id));
      setSelectedRoom(null);
      setMessages([]);
      setShowRoomInfo(false);
      if (socket) socket.emit('leaveRoom', { roomId: selectedRoom._id });
      toast.success('Left room');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave room');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedRoom) return;
    const member = selectedRoom.members?.find(m => (m._id || m) === memberId);
    const memberName = member?.username || 'this user';
    if (!confirm(`Remove ${memberName} from the room?`)) return;
    try {
      const res = await api.delete(`/api/rooms/${selectedRoom._id}/members/${memberId}`);
      setSelectedRoom(res.data);
      setRooms((prev) => prev.map((r) => r._id === res.data._id ? res.data : r));
      toast.success(`${memberName} removed`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleTyping = () => { if (socket && selectedUser) socket.emit('typing', { receiverId: selectedUser._id }); };
  const handleStopTyping = () => { if (socket && selectedUser) socket.emit('stopTyping', { receiverId: selectedUser._id }); };

  const handleBack = () => { setShowChat(false); setSelectedUser(null); setSelectedRoom(null); setShowRoomInfo(false); };

  const handleSendContactRequest = async (toUserId) => {
    try {
      const res = await api.post('/api/contacts/request', { toUserId });
      setContactStatuses((prev) => ({ ...prev, [toUserId]: { status: 'pending', requestId: res.data._id, direction: 'sent' } }));
      toast.success('Contact request sent!');
      if (socket) socket.emit('contactRequestSent', { toUserId, request: res.data });
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to send request'); }
  };

  const handleAcceptRequest = async (requestId, fromUser) => {
    try {
      await api.put(`/api/contacts/accept/${requestId}`);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      const fromUserId = fromUser?._id || fromUser;
      setContactStatuses((prev) => ({ ...prev, [fromUserId]: { status: 'accepted', requestId, direction: 'received' } }));
      toast.success('Contact request accepted!');
      if (socket) socket.emit('contactAccepted', { toUserId: fromUserId });
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to accept request'); }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.put(`/api/contacts/reject/${requestId}`);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      toast.success('Contact request rejected');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to reject request'); }
  };

  const handleRoomCreated = (room) => {
    setRooms((prev) => [room, ...prev]);
    if (socket) socket.emit('joinRoom', { roomId: room._id });
  };

  const handleProfileUpdate = (updatedData) => { updateUser(updatedData); };

  // Video call handlers
  const handleStartCall = () => {
    if (!selectedUser || !socket) return;
    setActiveCall({
      remoteUserId: selectedUser._id,
      remoteUserName: selectedUser.username,
      isIncoming: false,
      offer: null,
    });
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      remoteUserId: incomingCall.from,
      remoteUserName: incomingCall.callerName,
      isIncoming: true,
      offer: incomingCall.offer,
    });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall || !socket) return;
    socket.emit('callRejected', { to: incomingCall.from, reason: 'Call rejected' });
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  const isContact = selectedUser ? contactStatuses[selectedUser._id]?.status === 'accepted' : true;
  const selectedContactStatus = selectedUser ? contactStatuses[selectedUser._id] : null;
  const isRoomAdmin = selectedRoom && selectedRoom.admin && (selectedRoom.admin._id || selectedRoom.admin) === user.id;

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const getAvatarSrc = (avatarPath) => {
    if (avatarPath && avatarPath.startsWith('/uploads')) return `${API_URL}${avatarPath}`;
    return null;
  };

  return (
    <div className="chat-page">
      <div className="chat-layout">
        {/* Sidebar */}
        <div className={`sidebar-container ${isMobileView && showChat ? 'hidden' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-header-left">
              <div className="user-avatar-small clickable" onClick={() => setShowProfileModal(true)} title="Edit Profile">
                {getAvatarSrc(user?.avatar) ? (
                  <img src={getAvatarSrc(user.avatar)} alt="" className="sidebar-avatar-img" />
                ) : (
                  user?.username?.charAt(0).toUpperCase()
                )}
              </div>
              <h2>Chats</h2>
            </div>
            <div className="sidebar-header-right">
              <ThemeToggle />
              <button className="logout-btn" onClick={logout} title="Logout">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
          <Sidebar
            users={users} onlineUsers={onlineUsers} selectedUser={selectedUser} onSelectUser={handleSelectUser}
            unreadCounts={unreadCounts} currentUser={user} rooms={rooms} selectedRoom={selectedRoom}
            onSelectRoom={handleSelectRoom} onCreateRoom={() => setShowCreateRoomModal(true)}
            contactStatuses={contactStatuses} onSendContactRequest={handleSendContactRequest}
            pendingRequestCount={pendingRequests.length} onShowContactRequests={() => setShowContactRequestsModal(true)}
          />
        </div>

        {/* Chat area */}
        <div className={`chat-container ${isMobileView && !showChat ? 'hidden' : ''}`}>
          {selectedUser || selectedRoom ? (
            <>
              {/* Chat header */}
              <div className="chat-header">
                {isMobileView && (
                  <button className="back-btn" onClick={handleBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                  </button>
                )}
                <div
                  className="chat-header-info"
                  onClick={() => {
                    if (selectedRoom) setShowRoomInfo(!showRoomInfo);
                    else if (selectedUser) setViewProfileUserId(selectedUser._id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="chat-user-avatar">
                    {selectedRoom
                      ? selectedRoom.name.charAt(0).toUpperCase()
                      : getAvatarSrc(selectedUser?.avatar)
                        ? <img src={getAvatarSrc(selectedUser.avatar)} alt="" className="chat-header-avatar-img" />
                        : selectedUser.username.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="chat-header-text">
                    <h3>{selectedRoom ? selectedRoom.name : selectedUser.username}</h3>
                    {selectedRoom ? (
                      <span className="status-text">{selectedRoom.members?.length || 0} members · tap for info</span>
                    ) : (
                      <span className={`status-text ${onlineUsers.includes(selectedUser._id) ? 'online' : 'offline'}`}>
                        {onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="chat-header-actions">
                  {/* Video call button (DM only) */}
                  {selectedUser && isContact && (
                    <button className="header-action-btn video-call-btn" onClick={handleStartCall} title="Video Call">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </button>
                  )}
                  {/* Delete chat button for DMs */}
                  {selectedUser && (
                    <button className="header-action-btn" onClick={handleDeleteChat} title="Delete Chat">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                  {!selectedRoom && (
                    <div className="encryption-badge" title="Messages are encrypted">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Encrypted</span>
                    </div>
                  )}
                  {selectedRoom && (
                    <button className="header-action-btn" onClick={() => setShowRoomInfo(!showRoomInfo)} title="Room Info">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Room Info Panel */}
              {showRoomInfo && selectedRoom && (
                <div className="room-info-panel">
                  <div className="room-info-header">
                    <h3>{selectedRoom.name}</h3>
                    {selectedRoom.description && <p className="room-info-desc">{selectedRoom.description}</p>}
                  </div>

                  <div className="room-info-members">
                    <h4>Members ({selectedRoom.members?.length || 0})</h4>
                    {selectedRoom.members?.map((member) => {
                      const memberId = member._id || member;
                      const memberName = member.username || 'Unknown';
                      const isAdmin = (selectedRoom.admin?._id || selectedRoom.admin) === memberId;
                      return (
                        <div key={memberId} className="room-member-item">
                          <div
                            className="room-member-avatar clickable"
                            onClick={() => setViewProfileUserId(memberId)}
                          >
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className="room-member-name clickable-name"
                            onClick={() => setViewProfileUserId(memberId)}
                          >
                            {memberName}
                          </span>
                          {isAdmin && <span className="room-admin-badge">Admin</span>}
                          {isRoomAdmin && !isAdmin && memberId !== user.id && (
                            <button className="room-remove-member-btn" onClick={() => handleRemoveMember(memberId)} title="Remove">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="room-info-actions">
                    {isRoomAdmin ? (
                      <button className="room-danger-btn" onClick={handleDeleteRoom}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete Room
                      </button>
                    ) : (
                      <button className="room-danger-btn" onClick={handleLeaveRoom}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Leave Room
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Chat messages */}
              <ChatWindow
                messages={messages} currentUserId={user.id} typingUser={typingUser}
                selectedUser={selectedUser || selectedRoom} loadingMessages={loadingMessages}
                hasMore={hasMore} onLoadMore={loadMoreMessages}
                onEditMessage={selectedRoom ? null : handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                isRoom={!!selectedRoom}
                onViewProfile={(userId) => setViewProfileUserId(userId)}
              />

              {/* Message input */}
              <MessageInput
                onSendMessage={handleSendMessage} onTyping={handleTyping} onStopTyping={handleStopTyping}
                isContact={selectedRoom ? true : isContact} contactStatus={selectedContactStatus}
                onSendContactRequest={() => selectedUser && handleSendContactRequest(selectedUser._id)}
              />
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <div className="no-chat-icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2>Welcome to ConnectMavai</h2>
                <p>Select a conversation from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showProfileModal && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onProfileUpdate={handleProfileUpdate} />}
      {showCreateRoomModal && <CreateRoomModal users={users} onClose={() => setShowCreateRoomModal(false)} onRoomCreated={handleRoomCreated} api={api} />}
      {showContactRequestsModal && <ContactRequestsModal pendingRequests={pendingRequests} onClose={() => setShowContactRequestsModal(false)} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />}

      {/* User Profile View Modal */}
      {viewProfileUserId && (
        <UserProfileModal
          userId={viewProfileUserId}
          onClose={() => setViewProfileUserId(null)}
          onlineUsers={onlineUsers}
        />
      )}

      {/* Incoming Call Modal */}
      {incomingCall && !activeCall && (
        <div className="video-call-overlay">
          <div className="video-call-incoming">
            <div className="incoming-call-pulse"></div>
            <div className="incoming-call-avatar">
              {incomingCall.callerName?.charAt(0).toUpperCase() || '?'}
            </div>
            <h2 className="incoming-call-name">{incomingCall.callerName || 'Unknown'}</h2>
            <p className="incoming-call-label">Incoming video call...</p>
            <div className="incoming-call-actions">
              <button className="call-reject-btn" onClick={handleRejectCall} title="Reject">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                  <line x1="23" y1="1" x2="1" y2="23" />
                </svg>
              </button>
              <button className="call-accept-btn" onClick={handleAcceptCall} title="Accept">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Video Call */}
      {activeCall && (
        <VideoCall
          socket={socket}
          currentUserId={user.id}
          remoteUserId={activeCall.remoteUserId}
          remoteUserName={activeCall.remoteUserName}
          isIncoming={activeCall.isIncoming}
          incomingOffer={activeCall.offer}
          onClose={handleEndCall}
        />
      )}
    </div>
  );
};

export default Chat;

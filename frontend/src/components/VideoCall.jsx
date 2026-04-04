import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * VideoCall component - WebRTC peer-to-peer video calling
 * Handles both outgoing and incoming calls
 */
const VideoCall = ({ socket, currentUserId, remoteUserId, remoteUserName, isIncoming, incomingOffer, callType = 'video', callLogId: initialCallLogId, onClose }) => {
  const [callState, setCallState] = useState(isIncoming ? 'ringing' : 'calling'); // calling | ringing | connected | ended
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(callType === 'voice');
  const [callDuration, setCallDuration] = useState(0);
  const isVoiceOnly = callType === 'voice';

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const callLogIdRef = useRef(initialCallLogId || null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  // Start call timer
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', { to: remoteUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleEndCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, remoteUserId]);

  // Initiate outgoing call
  const initiateCall = useCallback(async () => {
    try {
      const constraints = isVoiceOnly
        ? { video: false, audio: true }
        : { video: true, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current && !isVoiceOnly) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('callUser', {
        to: remoteUserId,
        offer: pc.localDescription,
        callerName: undefined,
        callType,
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
        toast.error(isVoiceOnly ? 'Microphone access denied' : 'Camera/Microphone access denied');
      } else {
        toast.error('Failed to start call');
      }
      handleEndCall();
    }
  }, [socket, remoteUserId, createPeerConnection, isVoiceOnly, callType]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    try {
      setCallState('connected');
      const constraints = isVoiceOnly
        ? { video: false, audio: true }
        : { video: true, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current && !isVoiceOnly) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('callAccepted', { to: remoteUserId, answer: pc.localDescription, callLogId: callLogIdRef.current });
      startTimer();
    } catch (error) {
      console.error('Failed to accept call:', error);
      handleEndCall();
    }
  }, [socket, remoteUserId, incomingOffer, createPeerConnection, startTimer, isVoiceOnly]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    socket.emit('callRejected', { to: remoteUserId, reason: 'Call rejected', callLogId: callLogIdRef.current });
    cleanup();
    onClose();
  }, [socket, remoteUserId, cleanup, onClose]);

  // End call
  const handleEndCall = useCallback(() => {
    socket.emit('endCall', { to: remoteUserId, callLogId: callLogIdRef.current, duration: callDuration });
    setCallState('ended');
    cleanup();
    onClose();
  }, [socket, remoteUserId, cleanup, onClose, callDuration]);

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(prev => !prev);
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = async ({ answer, callLogId }) => {
      try {
        if (callLogId) callLogIdRef.current = callLogId;
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setCallState('connected');
          startTimer();
        }
      } catch (error) {
        console.error('Error handling call accepted:', error);
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };

    const handleCallRejected = ({ reason }) => {
      const msg = reason || 'Call rejected';
      toast.error(msg, { icon: '📵' });
      setCallState('ended');
      cleanup();
      // Short delay so user sees the 'ended' state
      setTimeout(() => onClose(), 1500);
    };

    const handleCallEnded = () => {
      setCallState('ended');
      cleanup();
      setTimeout(() => onClose(), 1000);
    };

    socket.on('callAccepted', handleCallAccepted);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callRejected', handleCallRejected);
    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.off('callAccepted', handleCallAccepted);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('callRejected', handleCallRejected);
      socket.off('callEnded', handleCallEnded);
    };
  }, [socket, cleanup, onClose, startTimer]);

  // Start outgoing call on mount
  useEffect(() => {
    if (!isIncoming) {
      initiateCall();
    }
    return () => cleanup();
  }, []);

  // Incoming call - ringing state
  if (callState === 'ringing') {
    return (
      <div className="video-call-overlay">
        <div className="video-call-incoming">
          <div className="incoming-call-pulse"></div>
          <div className="incoming-call-avatar">
            {remoteUserName?.charAt(0).toUpperCase() || '?'}
          </div>
          <h2 className="incoming-call-name">{remoteUserName || 'Unknown'}</h2>
          <p className="incoming-call-label">Incoming {isVoiceOnly ? 'voice' : 'video'} call...</p>
          <div className="incoming-call-actions">
            <button className="call-reject-btn" onClick={rejectCall} title="Reject">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="23" y1="1" x2="1" y2="23" />
              </svg>
            </button>
            <button className="call-accept-btn" onClick={acceptCall} title="Accept">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-overlay">
      <div className={`video-call-container ${isVoiceOnly ? 'voice-only' : ''}`}>
        {/* Remote video (full screen) — hidden in voice-only */}
        {!isVoiceOnly && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="video-call-remote"
          />
        )}

        {/* Remote audio element for voice-only calls */}
        {isVoiceOnly && (
          <>
            <audio ref={remoteVideoRef} autoPlay />
            <div className="voice-call-bg">
              <div className="voice-call-avatar-large">
                {remoteUserName?.charAt(0).toUpperCase() || '?'}
              </div>
            </div>
          </>
        )}

        {/* Local video (picture-in-picture) — hidden in voice calls */}
        {!isVoiceOnly && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="video-call-local"
          />
        )}

        {/* Call info */}
        <div className="video-call-info">
          <span className="video-call-name">{remoteUserName || 'Unknown'}</span>
          {callState === 'calling' && <span className="video-call-status">Calling...</span>}
          {callState === 'connected' && <span className="video-call-timer">{formatDuration(callDuration)}</span>}
        </div>

        {/* Controls */}
        <div className="video-call-controls">
          <button
            className={`video-call-control-btn ${isMuted ? 'active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.35 2.17" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          {!isVoiceOnly && (
            <button
              className={`video-call-control-btn ${isCameraOff ? 'active' : ''}`}
              onClick={toggleCamera}
              title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isCameraOff ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.5 7.5l5-3v15l-5-3" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M7.5 4.5h8a2 2 0 0 1 2 2v8m-2 2h-10a2 2 0 0 1-2-2v-10" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              )}
            </button>
          )}

          <button className="video-call-end-btn" onClick={handleEndCall} title="End call">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
              <line x1="23" y1="1" x2="1" y2="23" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;

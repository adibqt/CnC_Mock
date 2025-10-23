import React, { useState, useEffect, useCallback } from 'react';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  ConnectionState
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { liveKitAPI } from '../services/api';
import './VideoCall.css';

const VideoCall = ({ appointmentId, onLeave, userType = 'patient' }) => {
  const [token, setToken] = useState('');
  const [wsURL, setWsURL] = useState('');
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [shouldConnect, setShouldConnect] = useState(false);

  // Fetch access token from backend
  const fetchToken = useCallback(async () => {
    setConnecting(true);
    setError('');

    try {
      console.log('🎥 Fetching LiveKit token for appointment:', appointmentId, 'userType:', userType);
      
      const result = await liveKitAPI.joinAppointmentCall(appointmentId, 'consultation');
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get access token');
      }

      const data = result.data;
      console.log('✅ LiveKit token received:', {
        roomName: data.room_name,
        participantName: data.participant_name,
        url: data.url
      });

      setToken(data.token);
      setWsURL(data.url);
      setRoomName(data.room_name);
      setParticipantName(data.participant_name);
      
      // Add a small delay before connecting to ensure token is fully set
      setTimeout(() => {
        setShouldConnect(true);
      }, 100);

    } catch (err) {
      console.error('❌ Error fetching LiveKit token:', err);
      setError(err.message || 'Failed to connect to video call');
    } finally {
      setConnecting(false);
    }
  }, [appointmentId, userType]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Handle connection errors
  const handleError = useCallback((error) => {
    console.error('❌ LiveKit connection error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Check for specific peer connection errors
    if (error.message && error.message.includes('peer connection')) {
      console.error('🔴 PEER CONNECTION ERROR - This usually means:');
      console.error('   1. Network connectivity issues');
      console.error('   2. Firewall blocking WebRTC');
      console.error('   3. TURN server not accessible');
      console.error('   4. Multiple users trying to connect simultaneously');
    }
    
    setError(`Connection error: ${error.message || 'Unknown error'}`);
  }, []);

  // Handle connection state changes
  const handleConnectionQualityChanged = useCallback((quality) => {
    console.log('Connection quality changed:', quality);
  }, []);

  if (connecting) {
    return (
      <div className="video-call-loading">
        <div className="loading-spinner">
          <i className="icofont-spinner-alt-2 icofont-spin"></i>
        </div>
        <h3>Connecting to video call...</h3>
        <p>Please wait while we establish the connection.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-call-error">
        <div className="error-icon">
          <i className="icofont-warning"></i>
        </div>
        <h3>Connection Error</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={fetchToken} className="btn-retry">
            <i className="icofont-refresh"></i> Try Again
          </button>
          <button onClick={onLeave} className="btn-leave">
            <i className="icofont-close-line"></i> Leave Call
          </button>
        </div>
      </div>
    );
  }

  if (!token || !wsURL || !shouldConnect) {
    return (
      <div className="video-call-loading">
        <h3>Preparing video call...</h3>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={wsURL}
        data-lk-theme="default"
        style={{ height: '100vh' }}
        connect={shouldConnect}
        onError={handleError}
        onConnected={() => {
          console.log('✅ Successfully connected to room:', roomName);
          console.log('👤 Participant:', participantName);
        }}
        onDisconnected={(reason) => {
          console.log('❌ Disconnected from room. Reason:', reason);
          if (reason !== 'user-initiated') {
            console.error('⚠️ Unexpected disconnection:', reason);
          }
          onLeave?.();
        }}
        onConnectionQualityChanged={handleConnectionQualityChanged}
      >
        <VideoConference 
          chatMessageFormatter={(message, participant) => (
            <span className="chat-message">
              <strong>{participant?.name || 'Anonymous'}:</strong> {message}
            </span>
          )}
        />
        <RoomAudioRenderer />
        
        {/* Custom Leave Button */}
        <div className="video-call-header">
          <div className="room-info">
            <span className="room-name">Medical Consultation</span>
            <span className="participant-name">{participantName}</span>
          </div>
          <button onClick={onLeave} className="leave-call-btn">
            <i className="icofont-close-line"></i>
            End Call
          </button>
        </div>
      </LiveKitRoom>
    </div>
  );
};

// Custom hook to manage video call state
export const useVideoCall = () => {
  const [isInCall, setIsInCall] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [error, setError] = useState('');

  const joinRoom = useCallback((appointmentId, userType = 'patient') => {
    console.log('Joining room for appointment:', appointmentId, 'as', userType);
    setCurrentAppointmentId(appointmentId);
    setIsInCall(true);
    setError('');
  }, []);

  const leaveRoom = useCallback(() => {
    console.log('Leaving room');
    setIsInCall(false);
    setCurrentAppointmentId(null);
    setError('');
  }, []);

  // Legacy aliases for backwards compatibility
  const joinCall = joinRoom;
  const leaveCall = leaveRoom;

  return {
    isInCall,
    currentAppointmentId,
    joinRoom,
    leaveRoom,
    joinCall,
    leaveCall,
    error
  };
};

export default VideoCall;
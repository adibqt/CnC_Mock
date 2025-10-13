import React, { useEffect, useState } from 'react';
import './CallNotification.css';

const CallNotification = ({ callerName, callerType, appointmentId, onJoin, onDismiss }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setShow(true), 100);

    // Auto-dismiss after 30 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 30000);

    // Play notification sound (optional)
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio not available');
    }

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 300);
  };

  const handleJoin = () => {
    if (onJoin) onJoin();
    handleDismiss();
  };

  return (
    <div className={`call-notification-overlay ${show ? 'show' : ''}`}>
      <div className={`call-notification ${show ? 'show' : ''}`}>
        <div className="call-notification-header">
          <div className="caller-icon">
            <i className={`icofont-${callerType === 'doctor' ? 'doctor' : 'user'}`}></i>
          </div>
          <div className="call-notification-content">
            <h3>Incoming Video Call</h3>
            <p>
              <strong>{callerName}</strong> is waiting in the video room
            </p>
            <span className="appointment-id">Appointment #{appointmentId}</span>
          </div>
        </div>

        <div className="call-notification-actions">
          <button className="btn-join" onClick={handleJoin}>
            <i className="icofont-video-cam"></i>
            Join Call
          </button>
          <button className="btn-dismiss" onClick={handleDismiss}>
            <i className="icofont-close"></i>
            Dismiss
          </button>
        </div>

        <div className="notification-timer">
          <div className="timer-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default CallNotification;

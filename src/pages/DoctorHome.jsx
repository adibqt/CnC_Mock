import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI, authUtils, appointmentAPI, liveKitAPI } from '../services/api';
import VideoCall, { useVideoCall } from '../components/VideoCall';
import CallNotification from '../components/CallNotification';
import { useCallNotification } from '../hooks/useCallNotification';
import './DoctorHome.css';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function to handle image URLs (works with both absolute URLs from Vercel Blob and relative paths)
const getImageUrl = (url) => {
  if (!url) return '';
  // If URL already starts with http:// or https://, return as-is (Vercel Blob URLs)
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Otherwise prepend API_URL (relative paths)
  return `${API_URL}${url}`;
};


export default function DoctorHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [homeData, setHomeData] = useState(null);
  const [weekAppointments, setWeekAppointments] = useState([]);
  
  // Video call state
  const { 
    isInCall, 
    joinRoom, 
    leaveRoom, 
    error: videoError 
  } = useVideoCall();
  const [videoCallAppointment, setVideoCallAppointment] = useState(null);
  
  // Call notification state
  const {
    notification,
    dismissNotification,
    resetCheckedRooms
  } = useCallNotification('doctor', weekAppointments);

  useEffect(() => {
    loadHomeData();
    loadWeeklyAppointments();
  }, []);

  const loadHomeData = async () => {
    const result = await doctorAPI.getHomeData();
    if (result.success) {
      setHomeData(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const loadWeeklyAppointments = async () => {
    const result = await appointmentAPI.getDoctorAppointments('current');
    if (result.success) {
      setWeekAppointments(result.data || []);
    }
  };

  const handleLogout = () => {
    authUtils.logout('doctor');
  };

  // Video call functions
  const handleJoinVideoCall = async (appointment) => {
    try {
      setVideoCallAppointment(appointment);
      await joinRoom(appointment.id.toString(), 'doctor');
    } catch (error) {
      console.error('Failed to join video call:', error);
      alert('Failed to join video call. Please try again.');
    }
  };

  const handleLeaveVideoCall = async () => {
    try {
      await leaveRoom();
      setVideoCallAppointment(null);
    } catch (error) {
      console.error('Failed to leave video call:', error);
    }
  };

  const canJoinVideoCall = (appointment) => {
    if (!appointment) return false;
    
    // For testing: Allow video calls for any confirmed appointment
    const isConfirmed = appointment.status?.toLowerCase() === 'confirmed';
    
    return isConfirmed;
  };

  // Status management
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const result = await appointmentAPI.updateAppointmentStatus(appointmentId, newStatus);
      
      if (result.success) {
        // Reload appointments to show updated status
        await loadWeeklyAppointments();
        
        // Show success message (you can add a toast notification here)
        console.log(`Appointment ${appointmentId} status updated to ${newStatus}`);
      } else {
        alert(`Failed to update status: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <i className="icofont-warning"></i>
          <p>{error}</p>
          <button onClick={handleLogout} className="back-to-login-btn">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const { doctor, todayAppointments, stats } = homeData || {};

  return (
    <div className="doctor-home">
      {/* Header */}
      <header className="doctor-header">
        <div className="doctor-header-container">
          <div className="header-content">
            <div className="doctor-info">
              <div className="doctor-avatar">
                {doctor?.profile_picture_url ? (
                  <img 
                    src={getImageUrl(doctor.profile_picture_url)}
                    alt={doctor.name}
                    className="doctor-avatar-img"
                  />
                ) : (
                  <i className="icofont-doctor"></i>
                )}
              </div>
              <div className="doctor-details">
                <h1>Dr. {doctor?.name}</h1>
                <div className="doctor-meta">
                  <i className="icofont-stethoscope-alt"></i>
                  <span>{doctor?.specialization}</span>
                  {doctor?.is_verified && (
                    <span className="verified-badge">
                      <i className="icofont-verification-check"></i>
                      
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="header-actions">
              <button onClick={() => navigate('/doctor-profile-update')} className="header-btn">
                <i className="icofont-ui-edit"></i>
                <span className="header-btn-text">Edit Profile</span>
              </button>
              <button onClick={handleLogout} className="header-btn logout">
                <i className="icofont-logout"></i>
                <span className="header-btn-text">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="doctor-main">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-content">
              <div className="stat-info">
                <p>Appointments Remaining</p>
                <div className="stat-number">{stats?.total_patients || 0}</div>
              </div>
              <div className="stat-icon blue">
                <i className="icofont-calendar"></i>
              </div>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-content">
              <div className="stat-info">
                <p>Today's Appointments</p>
                <div className="stat-number">{stats?.today_appointments || 0}</div>
              </div>
              <div className="stat-icon green">
                <i className="icofont-clock-time"></i>
              </div>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-content">
              <div className="stat-info">
                <p>Prescriptions Pending</p>
                <div className="stat-number">{stats?.pending_reports || 0}</div>
              </div>
              <div className="stat-icon orange">
                <i className="icofont-prescription"></i>
              </div>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-content">
              <div className="stat-info">
                <p>Rating</p>
                <div className="stat-number">
                  {stats?.rating || 0}
                  <i className="icofont-star" style={{fontSize: '24px', color: '#eab308', marginLeft: '8px'}}></i>
                </div>
              </div>
              <div className="stat-icon purple">
                <i className="icofont-thumbs-up"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="content-grid">
          {/* This Week's Appointments */}
          <div>
            <div className="appointments-card">
              <div className="card-header">
                <h2 className="card-title">
                  <i className="icofont-calendar"></i>
                  This Week's Appointments
                </h2>
                <button onClick={() => navigate('/doctor-schedule')} className="new-appointment-btn">
                  <i className="icofont-clock-time"></i>
                  Manage Schedule
                </button>
              </div>

              {weekAppointments && weekAppointments.length > 0 ? (
                <div className="appointments-list">
                  {weekAppointments.map((appointment) => (
                    <div key={appointment.id} className="appointment-item">
                      <div className="appointment-content">
                        <div className="appointment-left">
                          <div className="patient-avatar">
                            {appointment.patient?.profile_picture_url ? (
                              <img 
                                src={getImageUrl(appointment.patient.profile_picture_url)}
                                alt={appointment.patient.name}
                              />
                            ) : (
                              <i className="icofont-user"></i>
                            )}
                          </div>
                          <div className="appointment-info">
                            <h3>{appointment.patient?.name || 'Patient'}</h3>
                            <div className="appointment-details">
                              <span>
                                <i className="icofont-calendar"></i>
                                {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <span>
                                <i className="icofont-clock-time"></i>
                                {appointment.time_slot}
                              </span>
                            </div>
                            {appointment.symptoms && (
                              <div className="appointment-symptoms">
                                <i className="icofont-prescription"></i>
                                <span>{appointment.symptoms.substring(0, 60)}{appointment.symptoms.length > 60 ? '...' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="appointment-right">
                          <div className="status-management">
                            <span className={`status-badge ${appointment.status}`}>{appointment.status}</span>
                            
                            {/* Status Action Buttons */}
                            <div className="status-actions">
                              {appointment.status?.toLowerCase() === 'pending' && (
                                <>
                                  <button
                                    className="status-action-btn confirm"
                                    onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                    title="Confirm Appointment"
                                  >
                                    <i className="icofont-check-circled"></i>
                                    Confirm
                                  </button>
                                  <button
                                    className="status-action-btn reject"
                                    onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                    title="Reject Appointment"
                                  >
                                    <i className="icofont-close-circled"></i>
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {appointment.status?.toLowerCase() === 'confirmed' && (
                                <button
                                  className="status-action-btn complete"
                                  onClick={() => handleStatusChange(appointment.id, 'completed')}
                                  title="Mark as Completed"
                                >
                                  <i className="icofont-check-circled"></i>
                                  Complete
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="appointment-actions">
                            {canJoinVideoCall(appointment) && (
                              <button
                                className="video-call-btn"
                                onClick={() => handleJoinVideoCall(appointment)}
                                disabled={isInCall}
                                title="Join Video Call"
                              >
                                <i className="icofont-video-cam"></i>
                                {isInCall && videoCallAppointment?.id === appointment.id ? 'In Call' : 'Video Call'}
                              </button>
                            )}
                            <button className="call-btn" onClick={() => window.location.href = `tel:${appointment.patient?.phone}`} title="Phone Call">
                              <i className="icofont-ui-call"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="icofont-calendar"></i>
                  <p>No appointments scheduled for this week</p>
                  <button onClick={() => navigate('/doctor-schedule')} className="schedule-btn">Manage Schedule</button>
                </div>
              )}
            </div>
          </div>

          {/* Schedule & Quick Actions */}
          <div className="sidebar-content">
            {/* Schedule Setup */}
            <div className="schedule-card">
              <div className="schedule-header">
                <i className="icofont-ui-calendar"></i>
                <h3>Weekly Schedule</h3>
              </div>
              <p>Set up your availability for appointments</p>
              <button onClick={() => navigate('/doctor-schedule')} className="setup-schedule-btn">
                <i className="icofont-ui-settings"></i>
                Setup Schedule
              </button>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-card">
              <h3>Quick Actions</h3>
              <div className="actions-list">
                <button className="action-btn" onClick={() => navigate('/write-prescription')}>
                  <i className="icofont-prescription"></i>
                  Write Prescription
                </button>
                <button className="action-btn">
                  <i className="icofont-patient-file"></i>
                  Patient Records
                </button>
                <button className="action-btn">
                  <i className="icofont-test-tube-alt"></i>
                  Lab Reports
                </button>
                <button className="action-btn">
                  <i className="icofont-chart-line"></i>
                  Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Video Call Component */}
      {isInCall && videoCallAppointment && (
        <VideoCall
          appointmentId={videoCallAppointment.id.toString()}
          participantType="doctor"
          patientName={videoCallAppointment.patient?.name}
          onLeave={handleLeaveVideoCall}
        />
      )}

      {/* Call Notification */}
      {notification && !isInCall && (
        <CallNotification
          callerName={notification.callerName}
          callerType={notification.callerType}
          appointmentId={notification.appointmentId}
          onJoin={() => handleJoinVideoCall(notification.appointment)}
          onDismiss={dismissNotification}
        />
      )}
    </div>
  );
}

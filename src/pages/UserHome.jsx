import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './UserHome.css';
import { userAPI, authUtils, appointmentAPI, liveKitAPI } from '../services/api';
import VideoCall, { useVideoCall } from '../components/VideoCall';
import CallNotification from '../components/CallNotification';
import { useCallNotification } from '../hooks/useCallNotification';

// Use environment variable for API URL (works with Vercel deployment)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Lightweight icon components using Icofont classes already included globally
const Icon = ({ name, className = '' }) => (
  <i className={`icofont-${name} ${className}`}></i>
);

const fallbackConcerns = [
  'Temperature',
  'Snuffle',
  'Weakness',
  'Viruses',
  'Syncytial Virus',
  'Adenoviruses',
  'Rhinoviruses',
  'Factors',
  'Infection',
];

export default function UserHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [home, setHome] = useState(null);
  const [selected, setSelected] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [concerns, setConcerns] = useState([]);
  const [symptomMeta, setSymptomMeta] = useState([]); // full objects from public API
  const [specById, setSpecById] = useState({}); // {id: name}
  const [showNotifications, setShowNotifications] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [showAppointments, setShowAppointments] = useState(false);
  
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
  } = useCallNotification('patient', appointments);

  // Sample notifications data
  const notifications = [
    {
      id: 1,
      type: 'appointment',
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Khalid Kashmiri is tomorrow at 09:00 AM',
      time: '2 hours ago',
      read: false,
      icon: 'calendar'
    },
    {
      id: 2,
      type: 'prescription',
      title: 'New Prescription',
      message: 'Dr. Sarah Ahmed has uploaded a new prescription for you',
      time: '5 hours ago',
      read: false,
      icon: 'prescription'
    },
    {
      id: 3,
      type: 'report',
      title: 'Lab Report Ready',
      message: 'Your blood test results are now available',
      time: '1 day ago',
      read: true,
      icon: 'test-tube'
    },
    {
      id: 4,
      type: 'reminder',
      title: 'Health Checkup',
      message: 'Time for your monthly health checkup',
      time: '2 days ago',
      read: true,
      icon: 'heart-beat'
    }
  ];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Load home data
        const data = await userAPI.getHomeData();
        if (!mounted) return;
        setHome(data);
        
        // Load public symptoms (concerns)
        try {
          const res = await fetch(`${API_URL}/api/public/symptoms`);
          if (res.ok) {
            const data = await res.json();
            setSymptomMeta(data || []);
            const names = (data || []).map(s => s.name);
            setConcerns(names.length ? names : fallbackConcerns);
          } else {
            setConcerns(fallbackConcerns);
          }
        } catch {
          setConcerns(fallbackConcerns);
        }

        // Load active specializations map for suggestion logic
        try {
          const resSpecs = await fetch(`${API_URL}/api/doctors/specializations`);
          if (resSpecs.ok) {
            const specs = await resSpecs.json();
            const map = {};
            (specs || []).forEach(s => { if (s && s.id != null) { map[s.id] = s.name; } });
            setSpecById(map);
          }
        } catch {}

        // Load available doctors
        setLoadingDoctors(true);
        const doctorsResult = await appointmentAPI.getAllDoctors();
        if (doctorsResult.success) {
          setDoctors(doctorsResult.data);
        }
        setLoadingDoctors(false);
        
        // Load user appointments
        const appointmentsResult = await appointmentAPI.getPatientAppointments();
        if (appointmentsResult.success) {
          setAppointments(appointmentsResult.data || []);
        }
        
        setError('');
      } catch (e) {
        console.error(e);
        setError('Failed to load home data.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleConcern = (c) => {
    setSelected((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  // Video call functions
  const handleJoinVideoCall = async (appointment) => {
    try {
      setVideoCallAppointment(appointment);
      await joinRoom(appointment.id.toString(), 'patient');
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

  const onSuggestDoctor = async () => {
    if (!selected.length) return;
    try {
      setSuggesting(true);
      
      // Derive preferred specialization based on symptom mapping from backend
      const mappedSpecs = selected.map(concern => {
        const s = symptomMeta.find(x => x.name === concern);
        if (s && s.suggested_specialization_id && specById[s.suggested_specialization_id]) {
          return specById[s.suggested_specialization_id];
        }
        return 'General Medicine';
      });
      // Determine the most common specialization, preferring non-General Medicine
      const counts = mappedSpecs.reduce((acc, n) => {
        const key = (n || '').toLowerCase();
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const topNonGeneral = sorted.find(([k]) => k !== 'general medicine');
      const prefLower = (topNonGeneral?.[0]) || 'general medicine';
      const preferredSpecName = prefLower === 'general medicine'
        ? 'General Medicine'
        : (mappedSpecs.find(n => n && n.toLowerCase() === prefLower) || 'General Medicine');
      
      // Find doctors matching the specialization
  const pref = preferredSpecName.toLowerCase();
      const matchingDoctors = doctors.filter(doctor => {
        const spec = (doctor.specialization || '').toLowerCase();
        if (pref === 'general medicine') {
          return spec.includes('general');
        }
        return spec.includes(pref);
      });
      
      // If no matching doctors, get any available doctor
      const availableDoctors = matchingDoctors.length > 0 ? matchingDoctors : doctors;
      
      if (availableDoctors.length > 0) {
        // Pick the first available doctor (or use more complex logic)
        const suggestedDoctor = availableDoctors[0];
        setSuggestion({
          id: suggestedDoctor.id,
          name: suggestedDoctor.full_name || suggestedDoctor.name,
          specialty: suggestedDoctor.specialization,
          photo_url: suggestedDoctor.profile_picture_url,
          experience_years: 8, // Default value, can be added to doctor model
          rating: 4.6, // Default value, can be added to doctor model
          concerns: selected
        });
      } else {
        setSuggestion(null);
        alert('No doctors available at the moment. Please try again later.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to suggest doctor. Please try again.');
    } finally {
      setSuggesting(false);
    }
  };

  // Filter today's appointments from the loaded appointments
  const todayAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    return appointments.filter(apt => {
      if (!apt.appointment_date) return false;
      
      // Handle both string dates and date objects
      let aptDateStr;
      if (typeof apt.appointment_date === 'string') {
        aptDateStr = apt.appointment_date.split('T')[0];
      } else {
        aptDateStr = apt.appointment_date;
      }
      
      return aptDateStr === todayStr;
    });
  }, [appointments]);

  // Get the first appointment for today (use this instead of todaysAppointment from home)
  const todayAppointment = todayAppointments.length > 0 ? todayAppointments[0] : null;

  if (loading) {
    return (
      <div className="userhome-loading">
        <Icon name="spinner-alt-6" className="spin" /> Loading Home...
      </div>
    );
  }

  if (error) {
    return (
      <div className="userhome-error">
        <Icon name="warning" /> {error}
      </div>
    );
  }

  const { user, activities } = home || {};

  return (
    <div className="userhome-container">
      {/* Header */}
      <header className="uh-header">
        <div className="uh-header-left">
          <div className="uh-logo-wrapper">
            <img src="/img/logo.png" alt="Click & Care Logo" className="uh-logo" />
          </div>
          <div className="uh-welcome">
            <div className="uh-welcome-sub">{greeting}, {user?.name || 'Patient'}</div>
            <h1 className="uh-title">How do you feel today?</h1>
          </div>
        </div>
        <div className="uh-header-actions">
          <button 
            className="uh-ai-btn" 
            onClick={() => navigate('/ai-consultation')}
            aria-label="AI Health Assistant"
          >
            <Icon name="robot" />
            <span>AI Doctor</span>
          </button>
          <button 
            className="uh-dashboard-btn" 
            onClick={() => navigate('/patient-dashboard')}
            aria-label="Go to Dashboard"
          >
            <Icon name="dashboard" />
            <span>Dashboard</span>
          </button>
          <button 
            className="uh-bell" 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Icon name="notification" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="uh-badge">{notifications.filter(n => !n.read).length}</span>
            )}
          </button>
          <button 
            className="uh-logout-btn" 
            onClick={() => {
              authUtils.logout('patient');
              navigate('/');
            }}
            aria-label="Logout"
          >
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Notification Sidebar */}
      <div className={`notification-sidebar ${showNotifications ? 'open' : ''}`}>
        <div className="notification-header">
          <h3>Notifications</h3>
          <button 
            className="notification-close" 
            onClick={() => setShowNotifications(false)}
            aria-label="Close notifications"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="notification-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              >
                <div className={`notification-icon ${notification.type}`}>
                  <Icon name={notification.icon} />
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{notification.time}</div>
                </div>
                {!notification.read && <span className="unread-dot"></span>}
              </div>
            ))
          ) : (
            <div className="notification-empty">
              <Icon name="bell-alt" />
              <p>No notifications</p>
            </div>
          )}
        </div>
        <div className="notification-footer">
          <button className="notification-clear">Mark all as read</button>
        </div>
      </div>

      {/* Overlay */}
      {showNotifications && (
        <div 
          className="notification-overlay" 
          onClick={() => setShowNotifications(false)}
        ></div>
      )}

      {/* Concerns Chips */}
      <section className="uh-concerns">
        <div className="uh-chip-scroll">
          <div className="uh-chip-grid">
            {(concerns.length ? concerns : (home?.concerns || fallbackConcerns)).map((c) => (
              <button
                key={c}
                className={`uh-chip ${selected.includes(c) ? 'active' : ''}`}
                onClick={() => toggleConcern(c)}
              >
                <img src="/img/section-img2.png" alt="" className="uh-chip-icon" />
                <span>{c}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="uh-chip-cta">
          <button
            className="btn-primary uh-suggest-btn"
            disabled={!selected.length || suggesting}
            onClick={onSuggestDoctor}
          >
            {suggesting ? 'Suggesting...' : 'Suggest Doctor'}
          </button>
        </div>
        {suggestion && (
          <div className="uh-suggestion">
            <div className="uh-doc-avatar">
              <img 
                src={suggestion.photo_url ? `${API_URL}${suggestion.photo_url}` : '/img/doctor-detail.jpg'} 
                alt="Doctor" 
              />
            </div>
            <div className="uh-doc-info">
              <div className="uh-doc-name">{suggestion.name}</div>
              <div className="uh-doc-spec">{suggestion.specialty}</div>
              <div className="uh-doc-meta">Experience: {suggestion.experience_years} yrs · Rating {suggestion.rating.toFixed(1)}</div>
              <div className="uh-doc-concerns">
                <span>For: {suggestion.concerns.join(', ')}</span>
              </div>
            </div>
            <button 
              className="uh-book-appointment" 
              onClick={() => navigate(`/doctor/${suggestion.id}`)}
            >
              <Icon name="calendar" />
              Book Appointment
            </button>
          </div>
        )}
      </section>

      {/* Today's appointment */}
      <section className="uh-today">
        <h2 className="section-title">Today's Appointment</h2>
        {todayAppointment ? (
          <div className="uh-appointment-card">
            <div className="uh-appointment-doc">
              {todayAppointment.doctor?.profile_picture_url ? (
                <img 
                  src={`${API_URL}${todayAppointment.doctor.profile_picture_url}`}
                  alt={todayAppointment.doctor.name}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div className="uh-doctor-placeholder" style={{ width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white' }}>
                  <Icon name="doctor-alt" />
                </div>
              )}
              <div>
                <div className="uh-appointment-docname">Dr. {todayAppointment.doctor?.name}</div>
                <div className="uh-appointment-spec">
                  <Icon name="stethoscope-alt" /> {todayAppointment.doctor?.specialization || 'General Physician'}
                </div>
              </div>
            </div>
            <button className="uh-doc-arrow" onClick={() => navigate(`/doctor/${todayAppointment.doctor_id}`)}>
              <Icon name="rounded-right" />
            </button>
            <div className="uh-appointment-meta">
              <div>
                <Icon name="calendar" /> 
                {new Date(todayAppointment.appointment_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div>
                <Icon name="clock-time" /> {todayAppointment.appointment_time || 'Time TBD'}
              </div>
              <div>
                <Icon name="info-circle" /> 
                <span className={`status-badge status-${todayAppointment.status?.toLowerCase()}`}>
                  {todayAppointment.status || 'Pending'}
                </span>
              </div>
            </div>
            {todayAppointment.reason && (
              <div className="uh-appointment-reason">
                <Icon name="medical-sign" /> <strong>Reason:</strong> {todayAppointment.reason}
              </div>
            )}
          </div>
        ) : (
          <div className="uh-empty">
            <Icon name="calendar" /> No appointment for today.
          </div>
        )}
      </section>

      {/* Available Doctors */}
      <section className="uh-doctors">
        <h2 className="section-title">Available Doctors</h2>
        {loadingDoctors ? (
          <div className="uh-loading">
            <Icon name="spinner-alt-6" className="spin" /> Loading doctors...
          </div>
        ) : doctors.length > 0 ? (
          <div className="uh-doctors-carousel">
            <Slider
              dots={true}
              infinite={true}
              slidesToShow={3}
              slidesToScroll={1}
              autoplay={true}
              speed={2000}
              autoplaySpeed={3000}
              cssEase="linear"
              responsive={[
                {
                  breakpoint: 1024,
                  settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                  }
                },
                {
                  breakpoint: 768,
                  settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                  }
                }
              ]}
            >
              {doctors.map((doctor) => (
                <div key={doctor.id} className="uh-carousel-slide">
                  <div className="uh-doctor-card">
                    <div className="uh-doctor-header">
                      <div className="uh-doctor-avatar">
                        {doctor.profile_picture_url ? (
                          <img 
                            src={`${API_URL}${doctor.profile_picture_url}`}
                            alt={doctor.full_name}
                          />
                        ) : (
                          <div className="uh-doctor-placeholder">
                            <Icon name="doctor-alt" />
                          </div>
                        )}
                      </div>
                      {doctor.is_verified && (
                        <span className="uh-verified-badge">
                          <Icon name="check-circled" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="uh-doctor-body">
                      <h3 className="uh-doctor-name">{doctor.full_name}</h3>
                      <p className="uh-doctor-spec">
                        <Icon name="stethoscope-alt" />
                        {doctor.specialization}
                      </p>
                      <button 
                        className="uh-doctor-book-btn"
                        onClick={() => navigate(`/doctor/${doctor.id}`)}
                      >
                        <Icon name="calendar" />
                        Book Appointment
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        ) : (
          <div className="uh-empty">
            <Icon name="stethoscope" /> No doctors available at the moment.
          </div>
        )}
      </section>

      {/* Activities */}
      <section className="uh-activities">
        <h2 className="section-title">My Activities</h2>
        <div className="uh-activity-grid">
          {(activities || [
            { key: 'prescriptions', label: 'Prescription', icon: 'prescription' },
            { key: 'doctors', label: 'Doctor', icon: 'stethoscope' },
            { key: 'schedule', label: 'Schedule', icon: 'calendar' },
          ]).map((a) => (
            <button 
              key={a.key} 
              className="uh-activity"
              onClick={() => {
                if (a.key === 'schedule') {
                  setShowAppointments(!showAppointments);
                } else if (a.key === 'prescriptions') {
                  navigate('/view-prescription');
                }
              }}
            >
              <div className="uh-activity-icon">
                <Icon name={a.icon || 'ui-rate-blank'} />
              </div>
              <div className="uh-activity-label">{a.label}</div>
            </button>
          ))}
        </div>

        <div className="uh-tip">
          <div className="uh-tip-icon"><Icon name="heartbeat" /></div>
          <div>
            <div className="uh-tip-title">Doctor consultation</div>
            <div className="uh-tip-desc">Immediately see a doctor and consult properly</div>
          </div>
        </div>
      </section>

      {/* Appointments Modal */}
      {showAppointments && (
        <>
          <div className="appointments-modal-overlay" onClick={() => setShowAppointments(false)}></div>
          <div className="appointments-modal">
            <div className="appointments-header">
              <h3>
                <Icon name="calendar" /> My Appointments
              </h3>
              <button 
                className="close-btn" 
                onClick={() => setShowAppointments(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            
            {appointments.length > 0 ? (
              <div className="appointments-list">
                {appointments.map((appointment) => {
                  const appointmentDate = new Date(appointment.appointment_date);
                  
                  return (
                    <div key={appointment.id} className={`appointment-item ${appointment.status}`}>
                      <div className="appointment-date">
                        <div className="date-day">{appointmentDate.getDate()}</div>
                        <div className="date-month">
                          {appointmentDate.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                      <div className="appointment-details">
                        <div className="doctor-info">
                          <div className="doctor-avatar-small">
                            {appointment.doctor?.profile_picture_url ? (
                              <img 
                                src={`${API_URL}${appointment.doctor.profile_picture_url}`}
                                alt={appointment.doctor.name}
                              />
                            ) : (
                              <Icon name="doctor" />
                            )}
                          </div>
                          <div>
                            <h4>{appointment.doctor?.name}</h4>
                            <p className="specialization">{appointment.doctor?.specialization}</p>
                          </div>
                        </div>
                        <div className="appointment-meta">
                          <span className="time">
                            <Icon name="clock-time" /> {appointment.time_slot}
                          </span>
                          <span className={`status-badge ${appointment.status}`}>
                            {appointment.status}
                          </span>
                        </div>
                        {appointment.symptoms && (
                          <p className="symptoms">
                            <Icon name="prescription" /> 
                            {appointment.symptoms.length > 80 
                              ? `${appointment.symptoms.substring(0, 80)}...` 
                              : appointment.symptoms
                            }
                          </p>
                        )}
                        <div className="appointment-actions">
                          {canJoinVideoCall(appointment) && (
                            <button
                              className="video-call-btn"
                              onClick={() => handleJoinVideoCall(appointment)}
                              disabled={isInCall}
                            >
                              <Icon name="video-cam" /> 
                              {isInCall && videoCallAppointment?.id === appointment.id 
                                ? 'In Call...' 
                                : 'Join Video Call'
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-appointments">
                <Icon name="calendar" />
                <p>No appointments scheduled</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowAppointments(false);
                    // Scroll to doctors section
                    document.querySelector('.uh-doctors')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Book an Appointment
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Video Call Component */}
      {isInCall && videoCallAppointment && (
        <VideoCall
          appointmentId={videoCallAppointment.id.toString()}
          participantType="patient"
          doctorName={videoCallAppointment.doctor?.name}
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

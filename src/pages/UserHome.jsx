import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './UserHome.css';
import { userAPI, authUtils, appointmentAPI } from '../services/api';

// Lightweight icon components using Icofont classes already included globally
const Icon = ({ name, className = '' }) => (
  <i className={`icofont-${name} ${className}`}></i>
);

const defaultConcerns = [
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [showAppointments, setShowAppointments] = useState(false);

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

  const onSuggestDoctor = async () => {
    if (!selected.length) return;
    try {
      setSuggesting(true);
      
      // Map concerns to medical specializations
      const concernMapping = {
        'Temperature': 'general',
        'Snuffle': 'ent',
        'Weakness': 'general',
        'Viruses': 'general',
        'Syncytial Virus': 'pulmonologist',
        'Adenoviruses': 'general',
        'Rhinoviruses': 'ent',
        'Factors': 'general',
        'Infection': 'dermatologist'
      };
      
      // Get preferred specialization based on concerns
      const specializations = selected.map(concern => concernMapping[concern] || 'general');
      const preferredSpec = specializations.find(spec => spec !== 'general') || 'general';
      
      // Find doctors matching the specialization
      const matchingDoctors = doctors.filter(doctor => 
        doctor.specialization.toLowerCase().includes(preferredSpec) ||
        (preferredSpec === 'general' && doctor.specialization.toLowerCase().includes('general'))
      );
      
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

  const { user, todaysAppointment, activities } = home || {};

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
        <div className="uh-chip-grid">
          {(home?.concerns?.length ? home.concerns : defaultConcerns).map((c) => (
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
                src={suggestion.photo_url ? `http://localhost:8000${suggestion.photo_url}` : '/img/doctor-detail.jpg'} 
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
        <h2 className="section-title">Today's appointment</h2>
        {todaysAppointment ? (
          <div className="uh-appointment-card">
            <div className="uh-appointment-doc">
              <img src="/img/team1.jpg" alt="Doctor" />
              <div>
                <div className="uh-appointment-docname">{todaysAppointment.doctor_name}</div>
                <div className="uh-appointment-spec">{todaysAppointment.specialty}</div>
              </div>
            </div>
            <button className="uh-doc-arrow" onClick={() => navigate('/contact')}>
              <Icon name="rounded-right" />
            </button>
            <div className="uh-appointment-meta">
              <div><Icon name="calendar" /> {todaysAppointment.date_label}</div>
              <div><Icon name="video" /> {todaysAppointment.mode}</div>
            </div>
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
                            src={`http://localhost:8000${doctor.profile_picture_url}`}
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
                                src={`http://localhost:8000${appointment.doctor.profile_picture_url}`}
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
    </div>
  );
}

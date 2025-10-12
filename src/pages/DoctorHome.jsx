import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI, authUtils } from '../services/api';
import './DoctorHome.css';

export default function DoctorHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [homeData, setHomeData] = useState(null);

  useEffect(() => {
    loadHomeData();
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

  const handleLogout = () => {
    authUtils.logout('doctor');
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
                <i className="icofont-doctor"></i>
              </div>
              <div className="doctor-details">
                <h1>Dr. {doctor?.name}</h1>
                <div className="doctor-meta">
                  <i className="icofont-stethoscope-alt"></i>
                  <span>{doctor?.specialization}</span>
                  {doctor?.is_verified && (
                    <span className="verified-badge">
                      <i className="icofont-verification-check"></i>
                      Verified
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
                <p>Total Patients</p>
                <div className="stat-number">{stats?.total_patients || 0}</div>
              </div>
              <div className="stat-icon blue">
                <i className="icofont-patient-file"></i>
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
                <i className="icofont-calendar"></i>
              </div>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-content">
              <div className="stat-info">
                <p>Pending Reports</p>
                <div className="stat-number">{stats?.pending_reports || 0}</div>
              </div>
              <div className="stat-icon orange">
                <i className="icofont-file-document"></i>
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
          {/* Today's Appointments */}
          <div>
            <div className="appointments-card">
              <div className="card-header">
                <h2 className="card-title">
                  <i className="icofont-clock-time"></i>
                  Today's Appointments
                </h2>
                <button className="new-appointment-btn">
                  <i className="icofont-plus-circle"></i>
                  New Appointment
                </button>
              </div>

              {todayAppointments && todayAppointments.length > 0 ? (
                <div className="appointments-list">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="appointment-item">
                      <div className="appointment-content">
                        <div className="appointment-left">
                          <div className="patient-avatar">
                            <i className="icofont-user"></i>
                          </div>
                          <div className="appointment-info">
                            <h3>{appointment.patient_name}</h3>
                            <div className="appointment-details">
                              <span>
                                <i className="icofont-clock-time"></i>
                                {appointment.time}
                              </span>
                              <span>
                                <i className="icofont-stethoscope"></i>
                                {appointment.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="appointment-right">
                          <span className="status-badge">{appointment.status}</span>
                          <button className="call-btn">
                            <i className="icofont-ui-call"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="icofont-calendar"></i>
                  <p>No appointments scheduled for today</p>
                  <button className="schedule-btn">Schedule Appointment</button>
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
                <button className="action-btn">
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
    </div>
  );
}

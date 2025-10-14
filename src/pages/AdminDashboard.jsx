import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, patients, doctors, specializations, symptoms

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_accessToken');
    const userData = localStorage.getItem('admin_userData');
    
    if (!token) {
      navigate('/admin');
      return;
    }

    if (userData) {
      setAdminData(JSON.parse(userData));
    }

    loadDashboardStats();
  }, [navigate]);

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch('http://localhost:8000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        // Token expired
        handleLogout();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('admin_accessToken_timestamp');
    localStorage.removeItem('admin_userData');
    localStorage.removeItem('admin_userType');
    navigate('/admin');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} />;
      case 'patients':
        return <PatientsTab />;
      case 'doctors':
        return <DoctorsTab />;
      case 'specializations':
        return <SpecializationsTab />;
      case 'symptoms':
        return <SymptomsTab />;
      default:
        return <OverviewTab stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="icofont-spinner icofont-spin"></i>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <img src="/img/logo.png" alt="Click & Care" className="admin-brand-logo" />
            <div className="admin-brand-text">
              <h3>Click & Care</h3>
              <span>Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="icofont-dashboard"></i>
            <span>Overview</span>
          </button>
          
          <button
            className={`admin-nav-item ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            <i className="icofont-users-alt-3"></i>
            <span>Patients</span>
          </button>
          
          <button
            className={`admin-nav-item ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            <i className="icofont-doctor-alt"></i>
            <span>Doctors</span>
            {stats?.pending?.unverified_doctors > 0 && (
              <span className="badge-count">{stats.pending.unverified_doctors}</span>
            )}
          </button>
          
          <button
            className={`admin-nav-item ${activeTab === 'specializations' ? 'active' : ''}`}
            onClick={() => setActiveTab('specializations')}
          >
            <i className="icofont-stethoscope-alt"></i>
            <span>Specializations</span>
          </button>
          
          <button
            className={`admin-nav-item ${activeTab === 'symptoms' ? 'active' : ''}`}
            onClick={() => setActiveTab('symptoms')}
          >
            <i className="icofont-prescription"></i>
            <span>Symptoms</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              <i className="icofont-user-alt-1"></i>
            </div>
            <div className="admin-user-details">
              <p className="admin-user-name">{adminData?.full_name || 'Admin'}</p>
              <p className="admin-user-role">{adminData?.role || 'admin'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            <i className="icofont-logout"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-main-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ stats }) {
  if (!stats) {
    return <div className="admin-empty">Loading statistics...</div>;
  }

  return (
    <div className="overview-content">
      <div className="admin-page-header">
        <h1>Dashboard Overview</h1>
        <p>Monitor your platform's performance and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card blue">
          <div className="stat-icon">
            <i className="icofont-users-alt-3"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totals.patients}</h3>
            <p>Total Patients</p>
            <span className="stat-badge green">+{stats.recent.new_patients_7d} this week</span>
          </div>
        </div>

        <div className="admin-stat-card purple">
          <div className="stat-icon">
            <i className="icofont-doctor-alt"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totals.doctors}</h3>
            <p>Total Doctors</p>
            <span className="stat-badge green">+{stats.recent.new_doctors_7d} this week</span>
          </div>
        </div>

        <div className="admin-stat-card orange">
          <div className="stat-icon">
            <i className="icofont-calendar"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totals.appointments}</h3>
            <p>Total Appointments</p>
            <span className="stat-badge blue">{stats.pending.confirmed_appointments} confirmed</span>
          </div>
        </div>

        <div className="admin-stat-card green">
          <div className="stat-icon">
            <i className="icofont-prescription"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totals.prescriptions}</h3>
            <p>Total Prescriptions</p>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      <div className="admin-section">
        <h2>Pending Actions</h2>
        <div className="admin-cards-grid">
          <div className="admin-action-card">
            <div className="action-card-header">
              <i className="icofont-verification-check"></i>
              <h3>Doctor Verifications</h3>
            </div>
            <p className="action-card-count">{stats.pending.unverified_doctors}</p>
            <p className="action-card-desc">Doctors pending verification</p>
          </div>

          <div className="admin-action-card">
            <div className="action-card-header">
              <i className="icofont-clock-time"></i>
              <h3>Pending Appointments</h3>
            </div>
            <p className="action-card-count">{stats.pending.pending_appointments}</p>
            <p className="action-card-desc">Appointments awaiting confirmation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Patients Tab Component (placeholder)
function PatientsTab() {
  const navigate = useNavigate();
  
  return (
    <div className="tab-content">
      <div className="admin-page-header">
        <h1>Patient Management</h1>
        <p>View and manage all registered patients</p>
      </div>
      <div className="coming-soon">
        <i className="icofont-users-alt-3"></i>
        <h3>Patient Management Interface</h3>
        
        <button 
          onClick={() => navigate('/admin/patients')} 
          className="admin-btn-primary"
        >
          Go to Full Patient Management
        </button>
      </div>
    </div>
  );
}

// Doctors Tab Component (placeholder)
function DoctorsTab() {
  const navigate = useNavigate();
  
  return (
    <div className="tab-content">
      <div className="admin-page-header">
        <h1>Doctor Management</h1>
        <p>Verify credentials and manage doctor accounts</p>
      </div>
      <div className="coming-soon">
        <i className="icofont-doctor-alt"></i>
        <h3>Doctor Management Interface</h3>
        
        <button 
          onClick={() => navigate('/admin/doctors')} 
          className="admin-btn-primary"
        >
          Go to Full Doctor Management
        </button>
      </div>
    </div>
  );
}

// Specializations Tab Component (placeholder)
function SpecializationsTab() {
  const navigate = useNavigate();
  
  return (
    <div className="tab-content">
      <div className="admin-page-header">
        <h1>Specialization Management</h1>
        <p>Manage medical specializations for doctor sign-up</p>
      </div>
      <div className="coming-soon">
        <i className="icofont-stethoscope-alt"></i>
        <h3>Specialization Management Interface</h3>
     
        <button 
          onClick={() => navigate('/admin/specializations')} 
          className="admin-btn-primary"
        >
          Go to Full Specialization Management
        </button>
      </div>
    </div>
  );
}

// Symptoms Tab Component (placeholder)
function SymptomsTab() {
  const navigate = useNavigate();
  
  return (
    <div className="tab-content">
      <div className="admin-page-header">
        <h1>Symptom Management</h1>
        <p>Manage symptoms for patient consultations</p>
      </div>
      <div className="coming-soon">
        <i className="icofont-prescription"></i>
        <h3>Symptom Management Interface</h3>
        
        <button 
          onClick={() => navigate('/admin/symptoms')} 
          className="admin-btn-primary"
        >
          Go to Full Symptom Management
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, patients, doctors, specializations, symptoms
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

    // Check if we're on mobile and set initial state
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setMobileOpen(false);
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const handleSidebarToggle = () => {
    if (window.innerWidth <= 1024) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

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
      case 'pharmacies':
        return <PharmaciesTab />;
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
      {/* Sidebar Toggle Button */}
      <button 
        className={`admin-sidebar-toggle ${sidebarCollapsed ? 'collapsed' : ''}`}
        onClick={handleSidebarToggle}
        title={mobileOpen || !sidebarCollapsed ? 'Close Menu' : 'Open Menu'}
      >
        <i className={`icofont-${mobileOpen || !sidebarCollapsed ? 'close-line' : 'navigation-menu'}`}></i>
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`admin-sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={handleSidebarToggle}
      ></div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
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
            onClick={() => {
              setActiveTab('overview');
              if (window.innerWidth <= 1024) setMobileOpen(false);
            }}
            title="Overview"
          >
            <i className="icofont-dashboard"></i>
            <span>Overview</span>
          </button>
          
          <button
            className={`admin-nav-item`}
            onClick={() => {
              navigate('/admin/patients');
              if (window.innerWidth <= 1024) setMobileOpen(false);
            }}
            title="Patients"
          >
            <i className="icofont-users-alt-3"></i>
            <span>Patients</span>
          </button>
          
          <button
            className={`admin-nav-item`}
            onClick={() => {
              navigate('/admin/doctors');
              if (window.innerWidth <= 1024) setMobileOpen(false);
            }}
            title="Doctors"
          >
            <i className="icofont-doctor-alt"></i>
            <span>Doctors</span>
            {stats?.pending?.unverified_doctors > 0 && (
              <span className="badge-count">{stats.pending.unverified_doctors}</span>
            )}
          </button>
          
          <button
            className={`admin-nav-item ${activeTab === 'pharmacies' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pharmacies');
              if (window.innerWidth <= 1024) setMobileOpen(false);
            }}
            title="Pharmacies"
          >
            <i className="icofont-pills"></i>
            <span>Pharmacies</span>
            {stats?.pending?.pending_pharmacy_verification > 0 && (
              <span className="badge-count">{stats.pending.pending_pharmacy_verification}</span>
            )}
          </button>
          
          <button
            className={`admin-nav-item ${activeTab === 'specializations' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('specializations');
              if (window.innerWidth <= 1024) setMobileOpen(false);
            }}
            title="Specializations"
          >
            <i className="icofont-stethoscope-alt"></i>
            <span>Specializations</span>
          </button>
          
          <button
            className={`admin-nav-item ${activeTab === 'symptoms' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('symptoms');
              if (window.innerWidth <= 1024) setMobileOpen(false);
            }}
            title="Symptoms"
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
          <button onClick={handleLogout} className="admin-logout-btn" title="Logout">
            <i className="icofont-logout"></i>
            <span>Logout</span>
          </button>
        </div>

        {/* Sidebar Toggle Button */}
        <button 
          className={`admin-sidebar-toggle ${sidebarCollapsed ? 'collapsed' : ''}`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <i className={`icofont-${sidebarCollapsed ? 'navigation-menu' : 'close-line'}`}></i>
        </button>
      </aside>

      {/* Main Content */}
      <main className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
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

// Specializations Tab Component
function SpecializationsTab() {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch('http://localhost:8000/api/admin/specializations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSpecializations(data);
      }
    } catch (error) {
      console.error('Error loading specializations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Specialization name is required');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch('http://localhost:8000/api/admin/specializations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Specialization added successfully!');
        setFormData({ name: '', description: '' });
        setShowAddModal(false);
        loadSpecializations();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to add specialization');
      }
    } catch (error) {
      console.error('Error adding specialization:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Specialization name is required');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`http://localhost:8000/api/admin/specializations/${selectedSpec.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Specialization updated successfully!');
        setShowEditModal(false);
        setSelectedSpec(null);
        loadSpecializations();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to update specialization');
      }
    } catch (error) {
      console.error('Error updating specialization:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (spec) => {
    const newStatus = !spec.is_active;
    const confirmMsg = newStatus 
      ? 'Activate this specialization? It will appear in doctor sign-up.' 
      : 'Deactivate this specialization? It will be hidden from doctor sign-up.';
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`http://localhost:8000/api/admin/specializations/${spec.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...spec, is_active: newStatus })
      });

      if (response.ok) {
        alert(`Specialization ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        loadSpecializations();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (spec) => {
    if (!window.confirm(`Delete "${spec.name}"? This action cannot be undone.`)) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`http://localhost:8000/api/admin/specializations/${spec.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Specialization deleted successfully!');
        loadSpecializations();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to delete specialization');
      }
    } catch (error) {
      console.error('Error deleting specialization:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (spec) => {
    setSelectedSpec(spec);
    setFormData({ name: spec.name, description: spec.description || '' });
    setShowEditModal(true);
  };

  const filteredSpecs = specializations.filter(spec =>
    spec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (spec.description && spec.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = specializations.filter(s => s.is_active).length;
  const inactiveCount = specializations.filter(s => !s.is_active).length;

  return (
    <div className="tab-content specializations-management">
      <div className="admin-page-header">
        <div>
          <h1>Specialization Management</h1>
          <p>Manage medical specializations for doctor sign-up dropdown</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', description: '' });
            setShowAddModal(true);
          }}
          className="admin-btn-primary"
        >
          <i className="icofont-plus"></i>
          Add Specialization
        </button>
      </div>

      {/* Stats */}
      <div className="spec-stats">
        <div className="spec-stat-card">
          <i className="icofont-stethoscope-alt"></i>
          <div>
            <h3>{specializations.length}</h3>
            <p>Total Specializations</p>
          </div>
        </div>
        <div className="spec-stat-card active">
          <i className="icofont-check-circled"></i>
          <div>
            <h3>{activeCount}</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="spec-stat-card inactive">
          <i className="icofont-close-circled"></i>
          <div>
            <h3>{inactiveCount}</h3>
            <p>Inactive</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="spec-search-box">
        <i className="icofont-search"></i>
        <input
          type="text"
          placeholder="Search specializations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Specializations Grid */}
      {loading ? (
        <div className="spec-loading">
          <i className="icofont-spinner icofont-spin"></i>
          <p>Loading specializations...</p>
        </div>
      ) : filteredSpecs.length === 0 ? (
        <div className="spec-empty">
          <i className="icofont-stethoscope-alt"></i>
          <h3>No Specializations Found</h3>
          <p>Add your first specialization to get started</p>
        </div>
      ) : (
        <div className="spec-grid">
          {filteredSpecs.map((spec) => (
            <div key={spec.id} className={`spec-card ${!spec.is_active ? 'inactive' : ''}`}>
              <div className="spec-card-header">
                <div className="spec-card-icon">
                  <i className="icofont-stethoscope-alt"></i>
                </div>
                <span className={`spec-status-badge ${spec.is_active ? 'active' : 'inactive'}`}>
                  {spec.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="spec-card-body">
                <h3>{spec.name}</h3>
                <p>{spec.description || 'No description provided'}</p>
              </div>
              <div className="spec-card-footer">
                <button
                  onClick={() => openEditModal(spec)}
                  className="spec-action-btn edit"
                  title="Edit"
                  disabled={actionLoading}
                >
                  <i className="icofont-edit"></i>
                </button>
                <button
                  onClick={() => handleToggleStatus(spec)}
                  className={`spec-action-btn ${spec.is_active ? 'deactivate' : 'activate'}`}
                  title={spec.is_active ? 'Deactivate' : 'Activate'}
                  disabled={actionLoading}
                >
                  <i className={`icofont-${spec.is_active ? 'close-circled' : 'check-circled'}`}></i>
                </button>
                <button
                  onClick={() => handleDelete(spec)}
                  className="spec-action-btn delete"
                  title="Delete"
                  disabled={actionLoading}
                >
                  <i className="icofont-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="spec-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="spec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="spec-modal-header">
              <h2><i className="icofont-plus"></i> Add New Specialization</h2>
              <button onClick={() => setShowAddModal(false)} className="spec-modal-close">
                <i className="icofont-close"></i>
              </button>
            </div>
            <form onSubmit={handleAdd} className="spec-form">
              <div className="spec-form-group">
                <label>Specialization Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cardiology"
                  required
                />
              </div>
              <div className="spec-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this specialization..."
                  rows="4"
                />
              </div>
              <div className="spec-form-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="spec-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="spec-btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Adding...' : 'Add Specialization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSpec && (
        <div className="spec-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="spec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="spec-modal-header">
              <h2><i className="icofont-edit"></i> Edit Specialization</h2>
              <button onClick={() => setShowEditModal(false)} className="spec-modal-close">
                <i className="icofont-close"></i>
              </button>
            </div>
            <form onSubmit={handleEdit} className="spec-form">
              <div className="spec-form-group">
                <label>Specialization Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cardiology"
                  required
                />
              </div>
              <div className="spec-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this specialization..."
                  rows="4"
                />
              </div>
              <div className="spec-form-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="spec-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="spec-btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Update Specialization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Symptoms Tab Component
function SymptomsTab() {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: '', suggested_specialization_id: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [specOptions, setSpecOptions] = useState([]);

  useEffect(() => {
    loadSymptoms();
    loadSpecs();
  }, []);

  const token = () => localStorage.getItem('admin_accessToken');

  const loadSymptoms = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/symptoms', {
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSymptoms(data);
      }
    } catch (err) {
      console.error('Error loading symptoms:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecs = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/specializations', { headers: { 'Authorization': `Bearer ${token()}` } });
      if (res.ok) {
        const data = await res.json();
        setSpecOptions(data.filter(s => s.is_active));
      }
    } catch (e) { console.error('Error loading specializations:', e); }
  };

  const openAdd = () => {
    setFormData({ name: '', description: '', category: '', suggested_specialization_id: null });
    setShowAddModal(true);
  };

  const openEdit = (sym) => {
    setSelectedSymptom(sym);
    setFormData({ name: sym.name || '', description: sym.description || '', category: sym.category || '', suggested_specialization_id: sym.suggested_specialization_id || null });
    setShowEditModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('Symptom name is required'); return; }
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/symptoms', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('Symptom added successfully');
        setShowAddModal(false);
        setFormData({ name: '', description: '', category: '', suggested_specialization_id: null });
        loadSymptoms();
      } else {
        const err = await response.json();
        alert(err.detail || 'Failed to add symptom');
      }
    } catch (err) {
      console.error('Error adding symptom:', err);
    } finally { setActionLoading(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedSymptom) return;
    if (!formData.name.trim()) { alert('Symptom name is required'); return; }
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/admin/symptoms/${selectedSymptom.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('Symptom updated');
        setShowEditModal(false);
        setSelectedSymptom(null);
        loadSymptoms();
      } else {
        const err = await response.json();
        alert(err.detail || 'Failed to update symptom');
      }
    } catch (err) { console.error('Error updating symptom:', err); }
    finally { setActionLoading(false); }
  };

  const handleToggleStatus = async (sym) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/symptoms/${sym.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !sym.is_active })
      });
      if (response.ok) {
        loadSymptoms();
      }
    } catch (err) { console.error('Error toggling status:', err); }
  };

  const handleDelete = async (sym) => {
    if (!window.confirm(`Delete symptom "${sym.name}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`http://localhost:8000/api/admin/symptoms/${sym.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      if (response.ok) {
        loadSymptoms();
      }
    } catch (err) { console.error('Error deleting symptom:', err); }
  };

  const filtered = symptoms.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesText = !q || s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || (s.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesText && matchesCategory;
  });

  const counts = {
    total: symptoms.length,
    active: symptoms.filter(s => s.is_active).length,
    inactive: symptoms.filter(s => !s.is_active).length,
  };

  // Helper list of specialization names for dropdown/display logic
  const specNames = specOptions.map(s => s.name);

  return (
    <div className="specializations-management">
      <div className="admin-page-header">
        <div>
          <h1>Symptom Management</h1>
          <p>Manage the quick concerns shown on the user home page</p>
        </div>
        <button className="admin-btn-primary" onClick={openAdd}>
          <i className="icofont-plus"></i> Add Symptom
        </button>
      </div>

      {/* Stats */}
      <div className="spec-stats">
        <div className="spec-stat-card">
          <i className="icofont-prescription"></i>
          <div>
            <h3>{counts.total}</h3>
            <p>Total Symptoms</p>
          </div>
        </div>
        <div className="spec-stat-card active">
          <i className="icofont-ui-check"></i>
          <div>
            <h3>{counts.active}</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="spec-stat-card inactive">
          <i className="icofont-ui-close"></i>
          <div>
            <h3>{counts.inactive}</h3>
            <p>Inactive</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="spec-search-box" style={{display:'grid', gridTemplateColumns:'1fr 220px', gap:'12px'}}>
        <div style={{position:'relative'}}>
          <i className="icofont-search-1"></i>
          <input placeholder="Search symptoms..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
        </div>
        <select className="admin-select" value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          <option value="General">General</option>
          <option value="Respiratory">Respiratory</option>
          <option value="Cardiovascular">Cardiovascular</option>
          <option value="Digestive">Digestive</option>
          <option value="Dermatological">Dermatological</option>
          <option value="Neurological">Neurological</option>
          <option value="Musculoskeletal">Musculoskeletal</option>
          <option value="Mental Health">Mental Health</option>
          <option value="Sleep Disorder">Sleep Disorder</option>
        </select>
      </div>

      {loading ? (
        <div className="spec-loading"><i className="icofont-spinner icofont-spin"></i> Loading symptoms...</div>
      ) : filtered.length === 0 ? (
        <div className="spec-empty">
          <i className="icofont-laboratory"></i>
          <h3>No Symptoms Found</h3>
          <p>Try adjusting search or add a new symptom</p>
        </div>
      ) : (
        <div className="spec-grid">
          {filtered.map(sym => (
            <div key={sym.id} className={`spec-card ${sym.is_active ? '' : 'inactive'}`}>
              <div className="spec-card-header">
                <div className="spec-card-icon"><i className="icofont-prescription"></i></div>
                <span className={`spec-status-badge ${sym.is_active ? 'active' : 'inactive'}`}>{sym.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="spec-card-body">
                <h3>{sym.name}</h3>
                {sym.category && <p><strong>Category:</strong> {sym.category}</p>}
                {sym.description && <p>{sym.description}</p>}
              </div>
              <div className="spec-card-footer">
                <button className="spec-action-btn edit" onClick={()=>openEdit(sym)}><i className="icofont-edit"></i> Edit</button>
                <button className={`spec-action-btn ${sym.is_active ? 'deactivate' : 'activate'}`} onClick={()=>handleToggleStatus(sym)}>
                  <i className={`icofont-toggle-${sym.is_active ? 'off' : 'on'}`}></i> {sym.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="spec-action-btn delete" onClick={()=>handleDelete(sym)}><i className="icofont-trash"></i> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="spec-modal-overlay">
          <div className="spec-modal">
            <div className="spec-modal-header">
              <h2><i className="icofont-plus"></i> Add Symptom</h2>
              <button className="spec-modal-close" onClick={()=>setShowAddModal(false)}><i className="icofont-close"></i></button>
            </div>
            <form className="spec-form" onSubmit={handleAdd}>
              <div className="spec-form-group">
                <label>Name</label>
                <input value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} placeholder="Symptom name" />
              </div>
              <div className="spec-form-group">
                <label>Category (Specialization)</label>
                <select
                  className="admin-select"
                  value={formData.category ?? ''}
                  onChange={(e)=>{
                    const val = e.target.value;
                    const sp = specOptions.find(s => s.name === val);
                    setFormData({
                      ...formData,
                      category: val,
                      // If a specialization is chosen, auto-set suggested_specialization_id to match
                      suggested_specialization_id: sp ? sp.id : null
                    });
                  }}
                >
                  <option value="">-- Select specialization --</option>
                  {specOptions.map(sp => (
                    <option key={sp.id} value={sp.name}>{sp.name}</option>
                  ))}
                </select>
              </div>
              {/** Suggested Specialization removed; Category now defines mapping */}
              <div className="spec-form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={(e)=>setFormData({...formData, description: e.target.value})} placeholder="Describe the symptom" />
              </div>
              <div className="spec-form-actions">
                <button type="button" className="spec-btn-secondary" onClick={()=>setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="spec-btn-primary" disabled={actionLoading}>{actionLoading ? 'Adding...' : 'Add Symptom'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSymptom && (
        <div className="spec-modal-overlay">
          <div className="spec-modal">
            <div className="spec-modal-header">
              <h2><i className="icofont-edit"></i> Edit Symptom</h2>
              <button className="spec-modal-close" onClick={()=>{setShowEditModal(false); setSelectedSymptom(null);}}><i className="icofont-close"></i></button>
            </div>
            <form className="spec-form" onSubmit={handleEdit}>
              <div className="spec-form-group">
                <label>Name</label>
                <input value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="spec-form-group">
                <label>Category (Specialization)</label>
                <select
                  className="admin-select"
                  value={formData.category ?? ''}
                  onChange={(e)=>{
                    const val = e.target.value;
                    const sp = specOptions.find(s => s.name === val);
                    setFormData({
                      ...formData,
                      category: val,
                      suggested_specialization_id: sp ? sp.id : null
                    });
                  }}
                >
                  {/* Preserve legacy/custom category if it exists and isn't a specialization */}
                  {formData.category && !specNames.includes(formData.category) && (
                    <option value={formData.category}>{formData.category} (legacy)</option>
                  )}
                  <option value="">-- Select specialization --</option>
                  {specOptions.map(sp => (
                    <option key={sp.id} value={sp.name}>{sp.name}</option>
                  ))}
                </select>
              </div>
              {/** Suggested Specialization removed; Category now defines mapping */}
              <div className="spec-form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={(e)=>setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="spec-form-actions">
                <button type="button" className="spec-btn-secondary" onClick={()=>{setShowEditModal(false); setSelectedSymptom(null);}}>Cancel</button>
                <button type="submit" className="spec-btn-primary" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Pharmacies Tab Component
function PharmaciesTab() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, verified, inactive
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, inactive: 0 });

  useEffect(() => {
    loadPharmacies();
    loadStats();
  }, [filterStatus]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch('http://localhost:8000/api/admin/pharmacies/stats/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.total_pharmacies,
          verified: data.verified_pharmacies,
          pending: data.pending_verification,
          inactive: data.inactive_pharmacies
        });
      }
    } catch (error) {
      console.error('Error loading pharmacy stats:', error);
    }
  };

  const loadPharmacies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      let url = 'http://localhost:8000/api/admin/pharmacies?limit=100';
      
      // Apply filters
      if (filterStatus === 'pending') {
        url += '&is_verified=false&is_active=true';
      } else if (filterStatus === 'verified') {
        url += '&is_verified=true&is_active=true';
      } else if (filterStatus === 'inactive') {
        url += '&is_active=false';
      }

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPharmacies(data);
      }
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadPharmacies();
  };

  const viewDetails = async (pharmacyId) => {
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`http://localhost:8000/api/admin/pharmacies/${pharmacyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPharmacy(data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error loading pharmacy details:', error);
      alert('Failed to load pharmacy details');
    }
  };

  const handleVerify = async (pharmacyId, isVerified) => {
    if (!confirm(`Are you sure you want to ${isVerified ? 'verify' : 'reject'} this pharmacy?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`http://localhost:8000/api/admin/pharmacies/${pharmacyId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_verified: isVerified })
      });

      if (response.ok) {
        alert(`Pharmacy ${isVerified ? 'verified' : 'rejected'} successfully!`);
        loadPharmacies();
        loadStats();
        if (showDetailsModal) {
          setShowDetailsModal(false);
          setSelectedPharmacy(null);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to update pharmacy: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating pharmacy:', error);
      alert('Failed to update pharmacy');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (pharmacyId, isActive) => {
    if (!confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this pharmacy?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`http://localhost:8000/api/admin/pharmacies/${pharmacyId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        alert(`Pharmacy ${isActive ? 'activated' : 'deactivated'} successfully!`);
        loadPharmacies();
        loadStats();
        if (showDetailsModal) {
          setShowDetailsModal(false);
          setSelectedPharmacy(null);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to update pharmacy: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating pharmacy:', error);
      alert('Failed to update pharmacy');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPharmacies = pharmacies;

  return (
    <div className="admin-content">
      <div className="admin-content-header">
        <div>
          <h2>Pharmacy Management</h2>
          <p>Manage pharmacy verifications and status</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="spec-stats-grid">
        <div className="spec-stat-card">
          <div className="spec-stat-icon" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <i className="icofont-pills"></i>
          </div>
          <div className="spec-stat-content">
            <div className="spec-stat-value">{stats.total}</div>
            <div className="spec-stat-label">Total Pharmacies</div>
          </div>
        </div>
        <div className="spec-stat-card">
          <div className="spec-stat-icon" style={{background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'}}>
            <i className="icofont-check-circled"></i>
          </div>
          <div className="spec-stat-content">
            <div className="spec-stat-value">{stats.verified}</div>
            <div className="spec-stat-label">Verified</div>
          </div>
        </div>
        <div className="spec-stat-card">
          <div className="spec-stat-icon" style={{background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)'}}>
            <i className="icofont-clock-time"></i>
          </div>
          <div className="spec-stat-content">
            <div className="spec-stat-value">{stats.pending}</div>
            <div className="spec-stat-label">Pending Verification</div>
          </div>
        </div>
        <div className="spec-stat-card">
          <div className="spec-stat-icon" style={{background: 'linear-gradient(135deg, #718096 0%, #4a5568 100%)'}}>
            <i className="icofont-ban"></i>
          </div>
          <div className="spec-stat-content">
            <div className="spec-stat-value">{stats.inactive}</div>
            <div className="spec-stat-label">Inactive</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="spec-controls">
        <div className="spec-search-wrapper">
          <input
            type="text"
            className="spec-search-input"
            placeholder="Search by name, license, phone, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="spec-search-button" onClick={handleSearch}>
            <i className="icofont-search-1"></i>
          </button>
        </div>
        <div className="spec-filter-group">
          <select 
            className="admin-select"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Pharmacies</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Pharmacies List */}
      {loading ? (
        <div className="spec-loading">
          <i className="icofont-spinner icofont-spin"></i>
          <p>Loading pharmacies...</p>
        </div>
      ) : filteredPharmacies.length === 0 ? (
        <div className="spec-empty">
          <i className="icofont-pills"></i>
          <p>No pharmacies found</p>
        </div>
      ) : (
        <div className="spec-table-wrapper">
          <table className="spec-table">
            <thead>
              <tr>
                <th>Pharmacy Name</th>
                <th>License Number</th>
                <th>Location</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPharmacies.map((pharmacy) => (
                <tr key={pharmacy.id}>
                  <td>
                    <div style={{fontWeight: 500}}>{pharmacy.pharmacy_name}</div>
                    {pharmacy.owner_name && (
                      <div style={{fontSize: '0.85em', color: '#64748b'}}>Owner: {pharmacy.owner_name}</div>
                    )}
                  </td>
                  <td>{pharmacy.license_number}</td>
                  <td>
                    <div>{pharmacy.city}, {pharmacy.state}</div>
                    <div style={{fontSize: '0.85em', color: '#64748b'}}>{pharmacy.postal_code}</div>
                  </td>
                  <td>{pharmacy.phone}</td>
                  <td>
                    <div style={{display: 'flex', gap: '5px', flexDirection: 'column', alignItems: 'flex-start'}}>
                      {pharmacy.is_verified ? (
                        <span className="spec-badge" style={{background: '#d4edda', color: '#155724'}}>
                          <i className="icofont-check"></i> Verified
                        </span>
                      ) : (
                        <span className="spec-badge" style={{background: '#fff3cd', color: '#856404'}}>
                          <i className="icofont-clock-time"></i> Pending
                        </span>
                      )}
                      {!pharmacy.is_active && (
                        <span className="spec-badge" style={{background: '#f8d7da', color: '#721c24'}}>
                          <i className="icofont-ban"></i> Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{new Date(pharmacy.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                      <button 
                        className="spec-btn-icon" 
                        title="View Details"
                        onClick={() => viewDetails(pharmacy.id)}
                        style={{borderColor: '#3b82f6', color: '#3b82f6'}}
                      >
                        <i className="icofont-eye"></i>
                      </button>
                      {!pharmacy.is_verified && pharmacy.is_active && (
                        <>
                          <button 
                            className="spec-btn-icon" 
                            style={{borderColor: '#10b981', color: '#10b981'}}
                            title="Verify Pharmacy"
                            onClick={() => handleVerify(pharmacy.id, true)}
                            disabled={actionLoading}
                          >
                            <i className="icofont-check-circled"></i>
                          </button>
                          <button 
                            className="spec-btn-icon" 
                            style={{borderColor: '#ef4444', color: '#ef4444'}}
                            title="Reject Pharmacy"
                            onClick={() => handleVerify(pharmacy.id, false)}
                            disabled={actionLoading}
                          >
                            <i className="icofont-close-circled"></i>
                          </button>
                        </>
                      )}
                      {pharmacy.is_verified && (
                        <button 
                          className="spec-btn-icon" 
                          style={{borderColor: '#f59e0b', color: '#f59e0b'}}
                          title="Revoke Verification"
                          onClick={() => handleVerify(pharmacy.id, false)}
                          disabled={actionLoading}
                        >
                          <i className="icofont-close-circled"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPharmacy && (
        <div className="spec-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="spec-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px'}}>
            <div className="spec-modal-header">
              <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '10px'}}>
                <i className="icofont-pills" style={{color: '#667eea'}}></i>
                Pharmacy Details
              </h3>
              <button className="spec-modal-close" onClick={() => setShowDetailsModal(false)}>
                <i className="icofont-close"></i>
              </button>
            </div>
            <div className="spec-modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
              {/* Status Overview */}
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                padding: '20px', 
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {selectedPharmacy.is_verified ? (
                  <span className="spec-badge" style={{background: '#d4edda', color: '#155724', fontSize: '14px', padding: '8px 16px'}}>
                    <i className="icofont-check-circled"></i> Verified Pharmacy
                  </span>
                ) : (
                  <span className="spec-badge" style={{background: '#fff3cd', color: '#856404', fontSize: '14px', padding: '8px 16px'}}>
                    <i className="icofont-clock-time"></i> Pending Verification
                  </span>
                )}
                {selectedPharmacy.is_active ? (
                  <span className="spec-badge" style={{background: '#d4edda', color: '#155724', fontSize: '14px', padding: '8px 16px'}}>
                    <i className="icofont-check"></i> Active
                  </span>
                ) : (
                  <span className="spec-badge" style={{background: '#f8d7da', color: '#721c24', fontSize: '14px', padding: '8px 16px'}}>
                    <i className="icofont-ban"></i> Inactive
                  </span>
                )}
              </div>

              {/* Basic Information */}
              <div style={{marginBottom: '24px'}}>
                <h4 style={{marginBottom: '16px', color: '#1e293b', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <i className="icofont-building" style={{color: '#667eea'}}></i>
                  Basic Information
                </h4>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px'}}>
                  <div style={{
                    background: 'white', 
                    padding: '16px', 
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <label style={{fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                      Pharmacy Name
                    </label>
                    <p style={{marginTop: '8px', fontSize: '15px', color: '#1e293b', fontWeight: 500, margin: '8px 0 0 0'}}>
                      {selectedPharmacy.pharmacy_name}
                    </p>
                  </div>
                  <div style={{
                    background: 'white', 
                    padding: '16px', 
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <label style={{fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                      License Number
                    </label>
                    <p style={{marginTop: '8px', fontSize: '15px', color: '#1e293b', fontWeight: 500, margin: '8px 0 0 0'}}>
                      {selectedPharmacy.license_number}
                    </p>
                  </div>
                  {selectedPharmacy.owner_name && (
                    <div style={{
                      background: 'white', 
                      padding: '16px', 
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <label style={{fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                        Owner Name
                      </label>
                      <p style={{marginTop: '8px', fontSize: '15px', color: '#1e293b', fontWeight: 500, margin: '8px 0 0 0'}}>
                        {selectedPharmacy.owner_name}
                      </p>
                    </div>
                  )}
                  <div style={{
                    background: 'white', 
                    padding: '16px', 
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <label style={{fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                      Registered Date
                    </label>
                    <p style={{marginTop: '8px', fontSize: '15px', color: '#1e293b', fontWeight: 500, margin: '8px 0 0 0'}}>
                      {new Date(selectedPharmacy.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{marginBottom: '24px'}}>
                <h4 style={{marginBottom: '16px', color: '#1e293b', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <i className="icofont-phone" style={{color: '#667eea'}}></i>
                  Contact Information
                </h4>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px'}}>
                  <div style={{
                    background: 'white', 
                    padding: '16px', 
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <label style={{fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                      Phone Number
                    </label>
                    <p style={{marginTop: '8px', fontSize: '15px', color: '#1e293b', fontWeight: 500, margin: '8px 0 0 0'}}>
                      {selectedPharmacy.phone}
                    </p>
                  </div>
                  {selectedPharmacy.alternate_phone && (
                    <div style={{
                      background: 'white', 
                      padding: '16px', 
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <label style={{fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                        Alternate Phone
                      </label>
                      <p style={{marginTop: '8px', fontSize: '15px', color: '#1e293b', fontWeight: 500, margin: '8px 0 0 0'}}>
                        {selectedPharmacy.alternate_phone}
                      </p>
                    </div>
                  )}
                  {selectedPharmacy.email && (
                    <div style={{
                      background: 'white', 
                      padding: '16px', 
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <label style={{fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                        Email Address
                      </label>
                      <p style={{marginTop: '8px', fontSize: '15px', color: '#1e293b', fontWeight: 500, margin: '8px 0 0 0'}}>
                        {selectedPharmacy.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div style={{marginBottom: '24px'}}>
                <h4 style={{marginBottom: '16px', color: '#1e293b', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <i className="icofont-location-pin" style={{color: '#667eea'}}></i>
                  Location
                </h4>
                <div style={{
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <p style={{fontSize: '15px', color: '#1e293b', lineHeight: '1.6', margin: 0}}>
                    <strong>{selectedPharmacy.street_address}</strong><br />
                    {selectedPharmacy.city}, {selectedPharmacy.state} {selectedPharmacy.postal_code}<br />
                    {selectedPharmacy.country}
                  </p>
                </div>
              </div>

              {/* Verification Details */}
              {selectedPharmacy.verified_at && (
                <div style={{
                  background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                  padding: '16px 20px',
                  borderRadius: '10px',
                  marginBottom: '24px',
                  border: '1px solid #b1dfbb'
                }}>
                  <p style={{margin: 0, fontSize: '14px', color: '#155724', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <i className="icofont-check-circled" style={{fontSize: '20px'}}></i>
                    <strong>Verified on:</strong> {new Date(selectedPharmacy.verified_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{
                marginTop: '30px', 
                paddingTop: '24px', 
                borderTop: '2px solid #e2e8f0',
                background: '#f8fafc',
                margin: '0 -24px -24px -24px',
                padding: '24px'
              }}>
                <h4 style={{marginBottom: '16px', color: '#1e293b', fontSize: '16px', fontWeight: 700}}>
                  Management Actions
                </h4>
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  {!selectedPharmacy.is_verified && selectedPharmacy.is_active && (
                    <button 
                      className="spec-btn-primary"
                      onClick={() => handleVerify(selectedPharmacy.id, true)}
                      disabled={actionLoading}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        flex: '1',
                        minWidth: '160px'
                      }}
                    >
                      <i className="icofont-check-circled"></i> Verify Pharmacy
                    </button>
                  )}
                  {selectedPharmacy.is_verified && selectedPharmacy.is_active && (
                    <button 
                      className="spec-btn-secondary"
                      onClick={() => handleVerify(selectedPharmacy.id, false)}
                      disabled={actionLoading}
                      style={{flex: '1', minWidth: '160px'}}
                    >
                      <i className="icofont-close-circled"></i> Revoke Verification
                    </button>
                  )}
                  {selectedPharmacy.is_active ? (
                    <button 
                      className="spec-btn-secondary"
                      onClick={() => handleToggleActive(selectedPharmacy.id, false)}
                      disabled={actionLoading}
                      style={{
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        flex: '1',
                        minWidth: '160px'
                      }}
                    >
                      <i className="icofont-ban"></i> Deactivate
                    </button>
                  ) : (
                    <button 
                      className="spec-btn-primary"
                      onClick={() => handleToggleActive(selectedPharmacy.id, true)}
                      disabled={actionLoading}
                      style={{flex: '1', minWidth: '160px'}}
                    >
                      <i className="icofont-check"></i> Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

 

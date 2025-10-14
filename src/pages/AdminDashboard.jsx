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

 

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import './PatientManagement.css';

export default function PatientManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState(null);
  
  const patientsPerPage = 20;

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_accessToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    loadPatients();
    loadStats();
  }, [currentPage, searchQuery, filterActive]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = () => {
    if (window.innerWidth <= 1024) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_accessToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    loadPatients();
    loadStats();
  }, [currentPage, searchQuery, filterActive]);

  const loadStats = async () => {
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
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      
      // Build query parameters
      let url = `http://localhost:8000/api/admin/patients?skip=${currentPage * patientsPerPage}&limit=${patientsPerPage}`;
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      if (filterActive !== 'all') {
        url += `&is_active=${filterActive === 'active'}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients);
        setTotalPatients(data.total);
      } else if (response.status === 401) {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patientId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`http://localhost:8000/api/admin/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPatient(data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
      alert('Failed to load patient details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (patientId, currentStatus) => {
    const confirmMsg = currentStatus 
      ? 'Are you sure you want to deactivate this patient account?' 
      : 'Are you sure you want to activate this patient account?';
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`http://localhost:8000/api/admin/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      if (response.ok) {
        alert(`Patient account ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        loadPatients(); // Reload the list
        if (selectedPatient && selectedPatient.patient.id === patientId) {
          setShowDetailsModal(false);
          setSelectedPatient(null);
        }
      } else {
        alert('Failed to update patient status');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('An error occurred while updating patient status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0); // Reset to first page on new search
  };

  const handleFilterChange = (filter) => {
    setFilterActive(filter);
    setCurrentPage(0); // Reset to first page on filter change
  };

  const totalPages = Math.ceil(totalPatients / patientsPerPage);

  return (
    <div className="admin-dashboard">
      {/* Mobile Toggle Button */}
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

      <AdminSidebar 
        stats={stats}
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileOpen}
      />
      
      <main className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="patient-management">
          {/* Header */}
          <div className="pm-header">
            <div className="pm-header-left">
              <div className="pm-title-section">
                <h1>Patient Management</h1>
                <p>View and manage all registered patients</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="pm-controls">
            <div className="pm-search-box">
          <i className="icofont-search"></i>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <div className="pm-filters">
          <button
            className={`pm-filter-btn ${filterActive === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Patients
          </button>
          <button
            className={`pm-filter-btn ${filterActive === 'active' ? 'active' : ''}`}
            onClick={() => handleFilterChange('active')}
          >
            <i className="icofont-check-circled"></i>
            Active
          </button>
          <button
            className={`pm-filter-btn ${filterActive === 'inactive' ? 'active' : ''}`}
            onClick={() => handleFilterChange('inactive')}
          >
            <i className="icofont-close-circled"></i>
            Inactive
          </button>
        </div>

        <div className="pm-stats">
          <span className="pm-stat-badge">
            Total: <strong>{totalPatients}</strong>
          </span>
        </div>
      </div>

      {/* Patients Table */}
      <div className="pm-content">
        {loading ? (
          <div className="pm-loading">
            <i className="icofont-spinner icofont-spin"></i>
            <p>Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="pm-empty">
            <i className="icofont-users-alt-3"></i>
            <h3>No Patients Found</h3>
            <p>No patients match your search criteria</p>
          </div>
        ) : (
          <>
            <div className="pm-table-container">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Blood Group</th>
                    <th>Location</th>
                    <th>Appointments</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>#{patient.id}</td>
                      <td>
                        <div className="pm-patient-info">
                          {patient.profile_picture_url ? (
                            <img 
                              src={`http://localhost:8000${patient.profile_picture_url}`} 
                              alt={patient.name || 'Patient'}
                              className="pm-patient-avatar"
                            />
                          ) : (
                            <div className="pm-patient-avatar-placeholder">
                              <i className="icofont-user-alt-3"></i>
                            </div>
                          )}
                          <span>{patient.name || 'Not Set'}</span>
                        </div>
                      </td>
                      <td>{patient.phone}</td>
                      <td>
                        {patient.blood_group ? (
                          <span className="pm-blood-badge">{patient.blood_group}</span>
                        ) : (
                          <span className="pm-text-muted">-</span>
                        )}
                      </td>
                      <td>{patient.city || 'Not Set'}</td>
                      <td>
                        <span className="pm-appointment-count">{patient.appointment_count}</span>
                      </td>
                      <td>
                        <span className={`pm-status-badge ${patient.is_active ? 'active' : 'inactive'}`}>
                          {patient.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(patient.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="pm-actions">
                          <button
                            className="pm-action-btn view"
                            onClick={() => loadPatientDetails(patient.id)}
                            title="View Details"
                          >
                            <i className="icofont-eye"></i>
                          </button>
                          <button
                            className={`pm-action-btn ${patient.is_active ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleStatus(patient.id, patient.is_active)}
                            title={patient.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`icofont-${patient.is_active ? 'close-circled' : 'check-circled'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pm-pagination">
                <button
                  className="pm-page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                >
                  <i className="icofont-arrow-left"></i>
                  Previous
                </button>
                
                <div className="pm-page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pm-page-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="pm-page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                  <i className="icofont-arrow-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Patient Details Modal */}
      {showDetailsModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPatient(null);
          }}
          onToggleStatus={handleToggleStatus}
          actionLoading={actionLoading}
        />
      )}
        </div>
      </main>
    </div>
  );
}

// Patient Details Modal Component
function PatientDetailsModal({ patient, onClose, onToggleStatus, actionLoading }) {
  const [activeTab, setActiveTab] = useState('info'); // info, appointments, prescriptions

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2>Patient Details</h2>
          <button className="pm-modal-close" onClick={onClose}>
            <i className="icofont-close"></i>
          </button>
        </div>

        <div className="pm-modal-body">
          {/* Patient Info Card */}
          <div className="pm-detail-card patient-card">
            <div className="pm-patient-header">
              {patient.patient.profile_picture_url ? (
                <img 
                  src={`http://localhost:8000${patient.patient.profile_picture_url}`} 
                  alt={patient.patient.name}
                  className="pm-detail-avatar"
                />
              ) : (
                <div className="pm-detail-avatar-placeholder">
                  <i className="icofont-user-alt-3"></i>
                </div>
              )}
              <div className="pm-patient-header-info">
                <h3>{patient.patient.name || 'Not Set'}</h3>
                <p>ID: #{patient.patient.id}</p>
                <span className={`pm-status-badge ${patient.patient.is_active ? 'active' : 'inactive'}`}>
                  {patient.patient.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button
                className={`pm-toggle-status-btn ${patient.patient.is_active ? 'deactivate' : 'activate'}`}
                onClick={() => onToggleStatus(patient.patient.id, patient.patient.is_active)}
                disabled={actionLoading}
              >
                <i className={`icofont-${patient.patient.is_active ? 'close-circled' : 'check-circled'}`}></i>
                {patient.patient.is_active ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>

            <div className="pm-info-grid">
              <div className="pm-info-item">
                <i className="icofont-phone"></i>
                <div>
                  <label>Phone</label>
                  <p>{patient.patient.phone}</p>
                </div>
              </div>
              <div className="pm-info-item">
                <i className="icofont-blood"></i>
                <div>
                  <label>Blood Group</label>
                  <p>{patient.patient.blood_group || 'Not Set'}</p>
                </div>
              </div>
              <div className="pm-info-item">
                <i className="icofont-calendar"></i>
                <div>
                  <label>Date of Birth</label>
                  <p>{patient.patient.date_of_birth || 'Not Set'}</p>
                </div>
              </div>
              <div className="pm-info-item">
                <i className="icofont-location-pin"></i>
                <div>
                  <label>Location</label>
                  <p>{[patient.patient.city, patient.patient.state, patient.patient.country].filter(Boolean).join(', ') || 'Not Set'}</p>
                </div>
              </div>
              <div className="pm-info-item">
                <i className="icofont-ruler-alt-2"></i>
                <div>
                  <label>Height</label>
                  <p>{patient.patient.height ? `${patient.patient.height} inches` : 'Not Set'}</p>
                </div>
              </div>
              <div className="pm-info-item">
                <i className="icofont-weight"></i>
                <div>
                  <label>Weight</label>
                  <p>{patient.patient.weight ? `${patient.patient.weight} kg` : 'Not Set'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="pm-stats-grid">
            <div className="pm-stat-card">
              <i className="icofont-calendar"></i>
              <div>
                <h4>{patient.stats.total_appointments}</h4>
                <p>Total Appointments</p>
              </div>
            </div>
            <div className="pm-stat-card">
              <i className="icofont-prescription"></i>
              <div>
                <h4>{patient.stats.total_prescriptions}</h4>
                <p>Total Prescriptions</p>
              </div>
            </div>
            <div className="pm-stat-card">
              <i className="icofont-clock-time"></i>
              <div>
                <h4>{new Date(patient.patient.created_at).toLocaleDateString()}</h4>
                <p>Member Since</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="pm-tabs">
            <button
              className={`pm-tab ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <i className="icofont-calendar"></i>
              Appointment History ({patient.appointments.length})
            </button>
            <button
              className={`pm-tab ${activeTab === 'prescriptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('prescriptions')}
            >
              <i className="icofont-prescription"></i>
              Prescriptions ({patient.stats.total_prescriptions})
            </button>
          </div>

          {/* Tab Content */}
          <div className="pm-tab-content">
            {activeTab === 'appointments' && (
              <AppointmentHistory appointments={patient.appointments} />
            )}
            {activeTab === 'prescriptions' && (
              <PrescriptionList patientId={patient.patient.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Appointment History Component
function AppointmentHistory({ appointments }) {
  if (appointments.length === 0) {
    return (
      <div className="pm-empty-state">
        <i className="icofont-calendar"></i>
        <p>No appointments found</p>
      </div>
    );
  }

  return (
    <div className="pm-appointment-list">
      {appointments.map((apt) => (
        <div key={apt.id} className="pm-appointment-card">
          <div className="pm-apt-header">
            <div>
              <h4>Appointment #{apt.id}</h4>
              <p className="pm-apt-date">
                <i className="icofont-calendar"></i>
                {apt.appointment_date} - {apt.time_slot}
              </p>
            </div>
            <span className={`pm-apt-status ${apt.status}`}>
              {apt.status}
            </span>
          </div>
          {apt.doctor && (
            <div className="pm-apt-doctor">
              <i className="icofont-doctor-alt"></i>
              <div>
                <strong>{apt.doctor.name || 'Dr. ' + apt.doctor.id}</strong>
                <p>{apt.doctor.specialization}</p>
              </div>
            </div>
          )}
          {apt.symptoms && (
            <div className="pm-apt-symptoms">
              <label>Symptoms:</label>
              <p>{apt.symptoms}</p>
            </div>
          )}
          <div className="pm-apt-footer">
            <span className="pm-apt-date-small">
              Created: {new Date(apt.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Prescription List Component
function PrescriptionList({ patientId }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, [patientId]);

  const loadPrescriptions = async () => {
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`http://localhost:8000/api/admin/patients/${patientId}/prescriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pm-loading-small">
        <i className="icofont-spinner icofont-spin"></i>
        <p>Loading prescriptions...</p>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="pm-empty-state">
        <i className="icofont-prescription"></i>
        <p>No prescriptions found</p>
      </div>
    );
  }

  return (
    <div className="pm-prescription-list">
      {prescriptions.map((presc) => (
        <div key={presc.id} className="pm-prescription-card">
          <div className="pm-presc-header">
            <div>
              <h4>Prescription {presc.prescription_id}</h4>
              <p className="pm-presc-date">
                <i className="icofont-calendar"></i>
                {new Date(presc.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {presc.doctor && (
            <div className="pm-presc-doctor">
              <i className="icofont-doctor-alt"></i>
              <div>
                <strong>{presc.doctor.name || 'Doctor'}</strong>
                <p>{presc.doctor.specialization}</p>
              </div>
            </div>
          )}
          <div className="pm-presc-diagnosis">
            <label>Diagnosis:</label>
            <p>{presc.diagnosis}</p>
          </div>
          <div className="pm-presc-medications">
            <label>Medications ({presc.medications.length}):</label>
            <ul>
              {presc.medications.slice(0, 3).map((med, idx) => (
                <li key={idx}>{med.name} - {med.dosage}</li>
              ))}
              {presc.medications.length > 3 && (
                <li className="pm-more">+{presc.medications.length - 3} more...</li>
              )}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}


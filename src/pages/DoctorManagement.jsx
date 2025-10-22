import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import './DoctorManagement.css';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function DoctorManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerified, setFilterVerified] = useState('all'); // all, verified, unverified
  const [currentPage, setCurrentPage] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState(null);
  
  const doctorsPerPage = 20;

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_accessToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    loadDoctors();
    loadStats();
  }, [currentPage, searchQuery, filterVerified]);

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

    loadDoctors();
    loadStats();
  }, [currentPage, searchQuery, filterVerified]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
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

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      
      // Build query parameters
      let url = `${API_URL}/api/admin/doctors?skip=${currentPage * doctorsPerPage}&limit=${doctorsPerPage}`;
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      if (filterVerified !== 'all') {
        url += `&is_verified=${filterVerified === 'verified'}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors);
        setTotalDoctors(data.total);
      } else if (response.status === 401) {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorDetails = async (doctorId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`${API_URL}/api/admin/doctors/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDoctor(data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error loading doctor details:', error);
      alert('Failed to load doctor details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorId, isVerified, verificationNotes = '') => {
    const confirmMsg = isVerified 
      ? 'Are you sure you want to verify and approve this doctor?' 
      : 'Are you sure you want to suspend this doctor?';
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_accessToken');
      const response = await fetch(`${API_URL}/api/admin/doctors/${doctorId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_verified: isVerified,
          verification_notes: verificationNotes
        })
      });

      if (response.ok) {
        alert(`Doctor ${isVerified ? 'verified and approved' : 'suspended'} successfully!`);
        loadDoctors(); // Reload the list
        if (selectedDoctor && selectedDoctor.doctor.id === doctorId) {
          setShowDetailsModal(false);
          setSelectedDoctor(null);
        }
      } else {
        alert('Failed to update doctor verification status');
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('An error occurred while updating doctor verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0); // Reset to first page on new search
  };

  const handleFilterChange = (filter) => {
    setFilterVerified(filter);
    setCurrentPage(0); // Reset to first page on filter change
  };

  const totalPages = Math.ceil(totalDoctors / doctorsPerPage);

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
        <div className="doctor-management">
          {/* Header */}
          <div className="dm-header">
            <div className="dm-header-left">
              <div className="dm-title-section">
                <h1>Doctor Management</h1>
                <p>Verify credentials and manage doctor accounts</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="dm-controls">
        <div className="dm-search-box">
          <i className="icofont-search"></i>
          <input
            type="text"
            placeholder="Search by name, specialization, or BMDC number..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <div className="dm-filters">
          <button
            className={`dm-filter-btn ${filterVerified === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Doctors
          </button>
          <button
            className={`dm-filter-btn ${filterVerified === 'verified' ? 'active' : ''}`}
            onClick={() => handleFilterChange('verified')}
          >
            <i className="icofont-verification-check"></i>
            Verified
          </button>
          <button
            className={`dm-filter-btn ${filterVerified === 'unverified' ? 'active' : ''}`}
            onClick={() => handleFilterChange('unverified')}
          >
            <i className="icofont-warning"></i>
            Unverified
          </button>
        </div>

        <div className="dm-stats">
          <span className="dm-stat-badge">
            Total: <strong>{totalDoctors}</strong>
          </span>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="dm-content">
        {loading ? (
          <div className="dm-loading">
            <i className="icofont-spinner icofont-spin"></i>
            <p>Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="dm-empty">
            <i className="icofont-doctor-alt"></i>
            <h3>No Doctors Found</h3>
            <p>No doctors match your search criteria</p>
          </div>
        ) : (
          <>
            <div className="dm-table-container">
              <table className="dm-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Specialization</th>
                    <th>BMDC Number</th>
                    <th>Phone</th>
                    <th>Experience</th>
                    <th>Documents</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>#{doctor.id}</td>
                      <td>
                        <div className="dm-doctor-info">
                          {doctor.profile_picture_url ? (
                            <img 
                              src={`${API_URL}${doctor.profile_picture_url}`} 
                              alt={doctor.name || 'Doctor'}
                              className="dm-doctor-avatar"
                            />
                          ) : (
                            <div className="dm-doctor-avatar-placeholder">
                              <i className="icofont-doctor-alt"></i>
                            </div>
                          )}
                          <span>{doctor.name || doctor.full_name || 'Not Set'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="dm-specialization-badge">
                          {doctor.specialization || 'Not Set'}
                        </span>
                      </td>
                      <td>
                        <span className="dm-bmdc-number">{doctor.bmdc_number || '-'}</span>
                      </td>
                      <td>{doctor.phone}</td>
                      <td>
                        {doctor.years_of_experience ? (
                          <span className="dm-experience">{doctor.years_of_experience} years</span>
                        ) : (
                          <span className="dm-text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="dm-document-indicators">
                          <DocumentIndicator 
                            label="MBBS" 
                            hasDocument={doctor.mbbs_certificate_url} 
                          />
                          <DocumentIndicator 
                            label="FCPS" 
                            hasDocument={doctor.fcps_certificate_url} 
                          />
                          <DocumentIndicator 
                            label="BMDC" 
                            hasDocument={doctor.bmdc_certificate_url} 
                          />
                        </div>
                      </td>
                      <td>
                        <span className={`dm-status-badge ${doctor.is_verified ? 'verified' : 'unverified'}`}>
                          {doctor.is_verified ? (
                            <>
                              <i className="icofont-verification-check"></i>
                              Verified
                            </>
                          ) : (
                            <>
                              <i className="icofont-warning"></i>
                              Unverified
                            </>
                          )}
                        </span>
                      </td>
                      <td>{new Date(doctor.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="dm-actions">
                          <button
                            className="dm-action-btn view"
                            onClick={() => loadDoctorDetails(doctor.id)}
                            title="View Details & Documents"
                          >
                            <i className="icofont-eye"></i>
                          </button>
                          <button
                            className={`dm-action-btn ${doctor.is_verified ? 'suspend' : 'verify'}`}
                            onClick={() => handleVerifyDoctor(doctor.id, !doctor.is_verified)}
                            title={doctor.is_verified ? 'Suspend Doctor' : 'Verify Doctor'}
                          >
                            <i className={`icofont-${doctor.is_verified ? 'close-circled' : 'check-circled'}`}></i>
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
              <div className="dm-pagination">
                <button
                  className="dm-page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                >
                  <i className="icofont-arrow-left"></i>
                  Previous
                </button>
                
                <div className="dm-page-numbers">
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
                        className={`dm-page-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="dm-page-btn"
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

      {/* Doctor Details Modal */}
      {showDetailsModal && selectedDoctor && (
        <DoctorDetailsModal
          doctor={selectedDoctor}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedDoctor(null);
          }}
          onVerify={handleVerifyDoctor}
          actionLoading={actionLoading}
        />
      )}
        </div>
      </main>
    </div>
  );
}

// Document Indicator Component
function DocumentIndicator({ label, hasDocument }) {
  return (
    <span 
      className={`dm-doc-indicator ${hasDocument ? 'uploaded' : 'missing'}`}
      title={hasDocument ? `${label} uploaded` : `${label} not uploaded`}
    >
      <i className={`icofont-${hasDocument ? 'check-circled' : 'close-circled'}`}></i>
      {label}
    </span>
  );
}

// Doctor Details Modal Component
function DoctorDetailsModal({ doctor, onClose, onVerify, actionLoading }) {
  const [activeTab, setActiveTab] = useState('info'); // info, documents, consultations
  const [verificationNotes, setVerificationNotes] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleVerifyWithNotes = (isVerified) => {
    onVerify(doctor.doctor.id, isVerified, verificationNotes);
    setVerificationNotes('');
  };

  return (
    <div className="dm-modal-overlay" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-header">
          <h2>Doctor Verification & Details</h2>
          <button className="dm-modal-close" onClick={onClose}>
            <i className="icofont-close"></i>
          </button>
        </div>

        <div className="dm-modal-body">
          {/* Doctor Info Card */}
          <div className="dm-detail-card doctor-card">
            <div className="dm-doctor-header">
              {doctor.doctor.profile_picture_url ? (
                <img 
                  src={`${API_URL}${doctor.doctor.profile_picture_url}`} 
                  alt={doctor.doctor.name}
                  className="dm-detail-avatar"
                />
              ) : (
                <div className="dm-detail-avatar-placeholder">
                  <i className="icofont-doctor-alt"></i>
                </div>
              )}
              <div className="dm-doctor-header-info">
                <h3>{doctor.doctor.name || doctor.doctor.full_name || 'Not Set'}</h3>
                <p className="dm-specialization">{doctor.doctor.specialization || 'Specialization not set'}</p>
                <p>ID: #{doctor.doctor.id} | BMDC: {doctor.doctor.bmdc_number || 'Not provided'}</p>
                <span className={`dm-status-badge ${doctor.doctor.is_verified ? 'verified' : 'unverified'}`}>
                  {doctor.doctor.is_verified ? (
                    <>
                      <i className="icofont-verification-check"></i>
                      Verified
                    </>
                  ) : (
                    <>
                      <i className="icofont-warning"></i>
                      Unverified
                    </>
                  )}
                </span>
              </div>
              <div className="dm-verification-actions">
                {!doctor.doctor.is_verified ? (
                  <button
                    className="dm-verify-btn approve"
                    onClick={() => handleVerifyWithNotes(true)}
                    disabled={actionLoading}
                  >
                    <i className="icofont-verification-check"></i>
                    Verify & Approve
                  </button>
                ) : (
                  <button
                    className="dm-verify-btn suspend"
                    onClick={() => handleVerifyWithNotes(false)}
                    disabled={actionLoading}
                  >
                    <i className="icofont-close-circled"></i>
                    Suspend Doctor
                  </button>
                )}
              </div>
            </div>

            <div className="dm-info-grid">
              <div className="dm-info-item">
                <i className="icofont-phone"></i>
                <div>
                  <label>Phone</label>
                  <p>{doctor.doctor.phone}</p>
                </div>
              </div>
              <div className="dm-info-item">
                <i className="icofont-email"></i>
                <div>
                  <label>Email</label>
                  <p>{doctor.doctor.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="dm-info-item">
                <i className="icofont-briefcase"></i>
                <div>
                  <label>Experience</label>
                  <p>{doctor.doctor.years_of_experience ? `${doctor.doctor.years_of_experience} years` : 'Not provided'}</p>
                </div>
              </div>
              <div className="dm-info-item">
                <i className="icofont-location-pin"></i>
                <div>
                  <label>Location</label>
                  <p>{doctor.doctor.city || 'Not provided'}</p>
                </div>
              </div>
              <div className="dm-info-item">
                <i className="icofont-ui-calendar"></i>
                <div>
                  <label>Consultation Fee</label>
                  <p>{doctor.doctor.consultation_fee ? `৳${doctor.doctor.consultation_fee}` : 'Not set'}</p>
                </div>
              </div>
              <div className="dm-info-item">
                <i className="icofont-clock-time"></i>
                <div>
                  <label>Member Since</label>
                  <p>{new Date(doctor.doctor.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {doctor.doctor.bio && (
              <div className="dm-bio-section">
                <label>Bio/Description</label>
                <p>{doctor.doctor.bio}</p>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="dm-stats-grid">
            <div className="dm-stat-card">
              <i className="icofont-calendar"></i>
              <div>
                <h4>{doctor.stats.total_appointments}</h4>
                <p>Total Appointments</p>
              </div>
            </div>
            <div className="dm-stat-card">
              <i className="icofont-prescription"></i>
              <div>
                <h4>{doctor.stats.total_prescriptions}</h4>
                <p>Prescriptions Written</p>
              </div>
            </div>
            <div className="dm-stat-card">
              <i className="icofont-users-alt-4"></i>
              <div>
                <h4>{doctor.stats.total_patients}</h4>
                <p>Patients Served</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="dm-tabs">
            <button
              className={`dm-tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <i className="icofont-file-document"></i>
              Credentials & Documents
            </button>
            <button
              className={`dm-tab ${activeTab === 'consultations' ? 'active' : ''}`}
              onClick={() => setActiveTab('consultations')}
            >
              <i className="icofont-stethoscope"></i>
              Recent Consultations ({doctor.appointments?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="dm-tab-content">
            {activeTab === 'documents' && (
              <DocumentsTab 
                doctor={doctor.doctor} 
                onDocumentClick={setSelectedDocument}
              />
            )}
            {activeTab === 'consultations' && (
              <ConsultationsTab appointments={doctor.appointments || []} />
            )}
          </div>

          {/* Verification Notes */}
          <div className="dm-notes-section">
            <label>Verification Notes (Optional)</label>
            <textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add notes about the verification decision..."
              rows="3"
            />
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewerModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}

// Documents Tab Component
function DocumentsTab({ doctor, onDocumentClick }) {
  const documents = [
    {
      type: 'MBBS Certificate',
      url: doctor.mbbs_certificate_url,
      icon: 'icofont-graduate-alt',
      color: 'blue'
    },
    {
      type: 'FCPS Certificate',
      url: doctor.fcps_certificate_url,
      icon: 'icofont-award',
      color: 'purple'
    },
    {
      type: 'BMDC Registration',
      url: doctor.bmdc_certificate_url,
      icon: 'icofont-id-card',
      color: 'green'
    }
  ];

  return (
    <div className="dm-documents-grid">
      {documents.map((doc, index) => (
        <DocumentCard 
          key={index}
          document={doc}
          onClick={() => doc.url && onDocumentClick(doc)}
        />
      ))}
    </div>
  );
}

// Document Card Component
function DocumentCard({ document, onClick }) {
  const hasDocument = !!document.url;

  return (
    <div 
      className={`dm-document-card ${hasDocument ? 'has-document' : 'no-document'} ${document.color}`}
      onClick={onClick}
      style={{ cursor: hasDocument ? 'pointer' : 'default' }}
    >
      <div className="dm-doc-card-icon">
        <i className={document.icon}></i>
      </div>
      <div className="dm-doc-card-content">
        <h4>{document.type}</h4>
        {hasDocument ? (
          <div className="dm-doc-status uploaded">
            <i className="icofont-check-circled"></i>
            <span>Uploaded</span>
          </div>
        ) : (
          <div className="dm-doc-status missing">
            <i className="icofont-close-circled"></i>
            <span>Not Uploaded</span>
          </div>
        )}
      </div>
      {hasDocument && (
        <div className="dm-doc-actions">
          <button className="dm-doc-view-btn">
            <i className="icofont-eye"></i>
            View Document
          </button>
        </div>
      )}
    </div>
  );
}

// Document Viewer Modal Component
function DocumentViewerModal({ document, onClose }) {
  const documentUrl = `${API_URL}${document.url}`;
  const isImage = document.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="dm-document-viewer-overlay" onClick={onClose}>
      <div className="dm-document-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="dm-document-viewer-header">
          <h3>{document.type}</h3>
          <div className="dm-document-viewer-actions">
            <a 
              href={documentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="dm-doc-action-btn"
              title="Open in new tab"
            >
              <i className="icofont-external-link"></i>
            </a>
            <a 
              href={documentUrl} 
              download
              className="dm-doc-action-btn"
              title="Download"
            >
              <i className="icofont-download"></i>
            </a>
            <button className="dm-doc-action-btn" onClick={onClose} title="Close">
              <i className="icofont-close"></i>
            </button>
          </div>
        </div>
        <div className="dm-document-viewer-content">
          {isImage ? (
            <img src={documentUrl} alt={document.type} />
          ) : (
            <iframe src={documentUrl} title={document.type} />
          )}
        </div>
      </div>
    </div>
  );
}

// Consultations Tab Component
function ConsultationsTab({ appointments }) {
  if (appointments.length === 0) {
    return (
      <div className="dm-empty-state">
        <i className="icofont-stethoscope"></i>
        <p>No consultation records found</p>
      </div>
    );
  }

  return (
    <div className="dm-consultation-list">
      {appointments.map((apt) => (
        <div key={apt.id} className="dm-consultation-card">
          <div className="dm-consultation-header">
            <div>
              <h4>Appointment #{apt.id}</h4>
              <p className="dm-consultation-date">
                <i className="icofont-calendar"></i>
                {apt.appointment_date} - {apt.time_slot}
              </p>
            </div>
            <span className={`dm-consultation-status ${apt.status}`}>
              {apt.status}
            </span>
          </div>
          {apt.patient && (
            <div className="dm-consultation-patient">
              <i className="icofont-user-alt-3"></i>
              <div>
                <strong>{apt.patient.name || 'Patient ' + apt.patient.id}</strong>
                <p>{apt.patient.phone}</p>
              </div>
            </div>
          )}
          {apt.symptoms && (
            <div className="dm-consultation-symptoms">
              <label>Symptoms:</label>
              <p>{apt.symptoms}</p>
            </div>
          )}
          <div className="dm-consultation-footer">
            <span className="dm-consultation-date-small">
              Created: {new Date(apt.created_at).toLocaleString()}
            </span>
            {apt.prescription_count > 0 && (
              <span className="dm-prescription-badge">
                <i className="icofont-prescription"></i>
                {apt.prescription_count} prescription(s)
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

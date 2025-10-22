import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { prescriptionAPI } from '../services/api';
import './ViewPrescription.css';

// Use environment variable for API URL (works with Vercel deployment)
const API_URL = import.meta.env.VITE_API_URL || '${API_URL}';

export default function ViewPrescription() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [error, setError] = useState('');
  
  // Quotation states
  const [quotationRequests, setQuotationRequests] = useState([]);
  const [quotationResponses, setQuotationResponses] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacyIds, setSelectedPharmacyIds] = useState([]);
  const [requestNotes, setRequestNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  // Lab test quotation states
  const [labQuotationRequests, setLabQuotationRequests] = useState([]);
  const [labQuotationResponses, setLabQuotationResponses] = useState([]);
  const [showLabRequestModal, setShowLabRequestModal] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [selectedClinicIds, setSelectedClinicIds] = useState([]);
  const [labRequestNotes, setLabRequestNotes] = useState('');
  const [submittingLab, setSubmittingLab] = useState(false);

  // Lab report states
  const [labReports, setLabReports] = useState([]);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const closeQuotationModal = () => {
    setShowRequestModal(false);
    setSelectedPharmacyIds([]);
    setRequestNotes('');
  };

  const closeLabQuotationModal = () => {
    setShowLabRequestModal(false);
    setSelectedClinicIds([]);
    setLabRequestNotes('');
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    setLoading(true);
    setError('');
    
    console.log('🔍 Loading patient prescriptions...');
    const result = await prescriptionAPI.getPatientPrescriptions();
    console.log('📋 Prescriptions result:', result);
    
    if (result.success) {
      setPrescriptions(result.data);
      console.log(`✅ Loaded ${result.data.length} prescription(s)`);
      
      // Check if there's a specific prescription to view (from navigation state)
      if (location.state?.appointmentId) {
        const prescription = result.data.find(
          p => p.appointment_id === location.state.appointmentId
        );
        if (prescription) {
          setSelectedPrescription(prescription);
        }
      }
    } else {
      console.error('❌ Failed to load prescriptions:', result.error);
      setError(result.error);
    }
    setLoading(false);
  };

  const handlePrescriptionSelect = (prescription) => {
    setSelectedPrescription(prescription);
    loadQuotationsForPrescription(prescription.id);
    loadLabQuotationsForPrescription(prescription.id);
    loadLabReportsForPrescription(prescription.id);
  };

  const loadQuotationsForPrescription = async (prescriptionId) => {
    setLoadingQuotations(true);
    
    try {
  const token = localStorage.getItem('patient_accessToken');
      if (!token) return;

      // Get quotation requests for this prescription
      const requestsResponse = await fetch('${API_URL}/api/quotations/my-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const prescriptionRequests = requestsData.filter(req => req.prescription_id === prescriptionId);
        setQuotationRequests(prescriptionRequests);

        // Load responses for each request
        if (prescriptionRequests.length > 0) {
          const responsesPromises = prescriptionRequests.map(req =>
            fetch(`${API_URL}/api/quotations/request/${req.id}/responses`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : [])
          );

          const allResponses = await Promise.all(responsesPromises);
          setQuotationResponses(allResponses.flat());
        } else {
          setQuotationResponses([]);
        }
      }
    } catch (error) {
      console.error('Error loading quotations:', error);
    } finally {
      setLoadingQuotations(false);
    }
  };

  const handleRequestQuotation = async () => {
  setShowRequestModal(true);
    setSelectedPharmacyIds([]);
    
    // Load verified pharmacies
    try {
      const response = await fetch('${API_URL}/api/quotations/pharmacies');
      if (response.ok) {
        const data = await response.json();
        setPharmacies(data);
      }
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    }
  };

  const togglePharmacySelection = (pharmacyId) => {
    setSelectedPharmacyIds((prev) =>
      prev.includes(pharmacyId)
        ? prev.filter((id) => id !== pharmacyId)
        : [...prev, pharmacyId]
    );
  };

  const handleSelectAllPharmacies = () => {
    if (selectedPharmacyIds.length === pharmacies.length) {
      setSelectedPharmacyIds([]);
    } else {
      setSelectedPharmacyIds(pharmacies.map((p) => p.id));
    }
  };

  const handleSubmitQuotationRequest = async () => {
    if (!selectedPrescription) return;
    if (selectedPharmacyIds.length === 0) {
      alert('Please select at least one pharmacy to send your request.');
      return;
    }

    setSubmitting(true);
    try {
  const token = localStorage.getItem('patient_accessToken');
      
      if (!token) {
        alert('You are not logged in. Please login first.');
        window.location.href = '/login';
        return;
      }
      
      console.log('🔍 Token being sent:', token.substring(0, 20) + '...');
      
      const response = await fetch('${API_URL}/api/quotations/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prescription_id: selectedPrescription.id,
          pharmacy_ids: selectedPharmacyIds,
          patient_notes: requestNotes
        })
      });

      if (response.ok) {
        alert('Quotation request sent successfully! Pharmacies will respond soon.');
        closeQuotationModal();
        loadQuotationsForPrescription(selectedPrescription.id);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || 'Failed to send quotation request'}`);
      }
    } catch (error) {
      console.error('Error submitting quotation request:', error);
      alert('Failed to send quotation request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuotation = async (quotationId) => {
    if (!window.confirm('Are you sure you want to accept this quotation?')) return;

    try {
  const token = localStorage.getItem('patient_accessToken');
      const response = await fetch(`${API_URL}/api/quotations/${quotationId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Quotation accepted successfully!');
        loadQuotationsForPrescription(selectedPrescription.id);
      } else {
        alert('Failed to accept quotation');
      }
    } catch (error) {
      console.error('Error accepting quotation:', error);
      alert('Failed to accept quotation. Please try again.');
    }
  };

  // Lab quotation functions
  const loadLabQuotationsForPrescription = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('patient_accessToken');
      if (!token) return;

      // Get lab quotation requests for this prescription
      const requestsResponse = await fetch('${API_URL}/api/lab-quotations/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const prescriptionRequests = requestsData.filter(req => req.prescription_id === prescriptionId);
        setLabQuotationRequests(prescriptionRequests);

        // Load responses for each request
        if (prescriptionRequests.length > 0) {
          const responsesPromises = prescriptionRequests.map(req =>
            fetch(`${API_URL}/api/lab-quotations/responses/${req.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : [])
          );

          const allResponses = await Promise.all(responsesPromises);
          setLabQuotationResponses(allResponses.flat());
        } else {
          setLabQuotationResponses([]);
        }
      }
    } catch (error) {
      console.error('Error loading lab quotations:', error);
    }
  };

  const loadLabReportsForPrescription = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('patient_accessToken');
      if (!token) return;

      const response = await fetch('${API_URL}/api/lab-reports/my-reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter reports for this prescription
        const prescriptionReports = data.filter(report => 
          report.quotation_response?.quotation_request?.prescription_id === prescriptionId
        );
        setLabReports(prescriptionReports);
      }
    } catch (error) {
      console.error('Error loading lab reports:', error);
    }
  };

  const handleRequestLabQuotation = async () => {
    setShowLabRequestModal(true);
    setSelectedClinicIds([]);
    
    // Load verified clinics
    try {
      const token = localStorage.getItem('patient_accessToken');
      
      if (!token) {
        alert('You are not logged in. Please login first.');
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch('${API_URL}/api/lab-quotations/verified-clinics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      } else {
        console.error('Failed to load clinics');
        alert('Failed to load clinics. Please try again.');
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
      alert('Failed to load clinics. Please try again.');
    }
  };

  const toggleClinicSelection = (clinicId) => {
    setSelectedClinicIds((prev) =>
      prev.includes(clinicId)
        ? prev.filter((id) => id !== clinicId)
        : [...prev, clinicId]
    );
  };

  const handleSelectAllClinics = () => {
    if (selectedClinicIds.length === clinics.length) {
      setSelectedClinicIds([]);
    } else {
      setSelectedClinicIds(clinics.map((c) => c.id));
    }
  };

  const handleSubmitLabQuotationRequest = async () => {
    if (!selectedPrescription) return;
    if (selectedClinicIds.length === 0) {
      alert('Please select at least one clinic to send your request.');
      return;
    }

    setSubmittingLab(true);
    try {
      const token = localStorage.getItem('patient_accessToken');
      
      if (!token) {
        alert('You are not logged in. Please login first.');
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch('${API_URL}/api/lab-quotations/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prescription_id: selectedPrescription.id,
          clinic_ids: selectedClinicIds,
          patient_notes: labRequestNotes
        })
      });

      if (response.ok) {
        alert('Lab test quotation request sent successfully! Clinics will respond soon.');
        closeLabQuotationModal();
        loadLabQuotationsForPrescription(selectedPrescription.id);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || 'Failed to send lab quotation request'}`);
      }
    } catch (error) {
      console.error('Error submitting lab quotation request:', error);
      alert('Failed to send lab quotation request. Please try again.');
    } finally {
      setSubmittingLab(false);
    }
  };

  const handleAcceptLabQuotation = async (quotationId) => {
    if (!window.confirm('Are you sure you want to accept this lab test quotation?')) return;

    try {
      const token = localStorage.getItem('patient_accessToken');
      const response = await fetch(`${API_URL}/api/lab-quotations/accept/${quotationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Lab quotation accepted successfully! The clinic will upload your report soon.');
        loadLabQuotationsForPrescription(selectedPrescription.id);
      } else {
        alert('Failed to accept lab quotation');
      }
    } catch (error) {
      console.error('Error accepting lab quotation:', error);
      alert('Failed to accept lab quotation. Please try again.');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportViewer(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} Years`;
  };

  if (loading) {
    return (
      <div className="view-prescription-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-prescription-container">
      {/* Header */}
      <header className="prescription-view-header no-print">
        <button onClick={() => navigate('/user-home')} className="back-btn">
          <i className="icofont-arrow-left"></i>
          Back
        </button>
        <h1>My Prescriptions</h1>
      </header>

      <div className="prescription-view-content">
        {/* Prescriptions List */}
        <aside className="prescriptions-sidebar no-print">
          <h2>All Prescriptions</h2>
          
          {error && (
            <div className="error-message">
              <i className="icofont-warning"></i>
              <p>{error}</p>
            </div>
          )}
          
          {prescriptions.length === 0 && !error ? (
            <div className="no-prescriptions">
              <i className="icofont-prescription"></i>
              <p>No prescriptions available</p>
            </div>
          ) : (
            <div className="prescriptions-list">
              {prescriptions.map(prescription => (
                <div 
                  key={prescription.id}
                  className={`prescription-card ${selectedPrescription?.id === prescription.id ? 'selected' : ''}`}
                  onClick={() => handlePrescriptionSelect(prescription)}
                >
                  <div className="prescription-header-card">
                    <h3>
                      <i className="icofont-prescription"></i>
                      {prescription.prescription_id}
                    </h3>
                    <span className="prescription-date">
                      {new Date(prescription.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="doctor-info-small">
                    <i className="icofont-doctor-alt"></i>
                    <span>Dr. {prescription.doctor.name}</span>
                  </div>
                  
                  <div className="diagnosis-preview">
                    {prescription.diagnosis.substring(0, 60)}
                    {prescription.diagnosis.length > 60 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Prescription Detail View */}
        <main className="prescription-detail-container">
          {!selectedPrescription ? (
            <div className="no-selection no-print">
              <i className="icofont-prescription"></i>
              <h2>Select a Prescription</h2>
              <p>Choose a prescription from the left to view details</p>
            </div>
          ) : (
            <div className="prescription-detail">
              {/* Print Button */}
              <div className="prescription-actions no-print">
                <button onClick={handlePrint} className="print-btn">
                  <i className="icofont-print"></i>
                  Print Prescription
                </button>
                
                <button 
                  onClick={handleRequestQuotation} 
                  className="request-quotation-btn"
                  disabled={quotationRequests.some(req => req.status === 'pending')}
                >
                  <i className="icofont-pills"></i>
                  {quotationRequests.some(req => req.status === 'pending') 
                    ? 'Request Pending' 
                    : 'Request Quotation'}
                </button>

                {/* Lab Test Quotation Button - Only show if prescription has lab tests */}
                {selectedPrescription.lab_tests && selectedPrescription.lab_tests.length > 0 && (
                  <button 
                    onClick={handleRequestLabQuotation} 
                    className="request-lab-quotation-btn"
                    disabled={labQuotationRequests.some(req => req.status === 'pending')}
                  >
                    <i className="icofont-laboratory"></i>
                    {labQuotationRequests.some(req => req.status === 'pending') 
                      ? 'Lab Request Pending' 
                      : 'Request Lab Test Quotation'}
                  </button>
                )}
              </div>

              {/* Prescription Document */}
              <div className="prescription-document">
                {/* Header */}
                <div className="prescription-doc-header">
                  <div className="clinic-info">
                    <h1>Click & Care </h1>
                    <p>Dhaka, Bangladesh</p>
                    <p>Phone: (+880) 1913511381| Email: info@click&care.com</p>
                  </div>
                  <div className="prescription-logo-wrapper">
                    <img src="/img/logo.png" alt="Click & Care Logo" className="prescription-logo-img" />
                  </div>
                </div>

                <div className="prescription-divider"></div>

                {/* Doctor & Patient Info */}
                <div className="info-grid">
                  <div className="info-section">
                    <h3><i className="icofont-doctor"></i> Doctor Information</h3>
                    <div className="info-content">
                      <p><strong>Name:</strong> Dr. {selectedPrescription.doctor.name}</p>
                      <p><strong>Specialization:</strong> {selectedPrescription.doctor.specialization || 'N/A'}</p>
                      <p><strong>License:</strong> {selectedPrescription.doctor.license_number || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="info-section">
                    <h3><i className="icofont-patient-file"></i> Patient Information</h3>
                    <div className="info-content">
                      <p><strong>Name:</strong> {selectedPrescription.patient.name}</p>
                      <p><strong>Age:</strong> {calculateAge(selectedPrescription.patient.date_of_birth)}</p>
                      <p><strong>Blood Group:</strong> {selectedPrescription.patient.blood_group || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="prescription-meta">
                  <p><strong>Prescription ID:</strong> {selectedPrescription.prescription_id}</p>
                  <p><strong>Date:</strong> {new Date(selectedPrescription.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}</p>
                </div>

                <div className="prescription-divider"></div>

                {/* Diagnosis */}
                <div className="prescription-section">
                  <h3><i className="icofont-stethoscope-alt"></i> Diagnosis</h3>
                  <div className="section-content">
                    <p>{selectedPrescription.diagnosis}</p>
                  </div>
                </div>

                {/* Medications */}
                <div className="prescription-section">
                  <h3><i className="icofont-pills"></i> Medications Prescribed</h3>
                  <div className="medications-table">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Medication Name</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescription.medications.map((med, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{med.name}</strong>
                              {med.notes && <div className="med-notes">{med.notes}</div>}
                            </td>
                            <td>{med.dosage}</td>
                            <td>{med.frequency}</td>
                            <td>{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Lab Tests */}
                {selectedPrescription.lab_tests && selectedPrescription.lab_tests.length > 0 && (
                  <div className="prescription-section">
                    <h3><i className="icofont-test-tube-alt"></i> Lab Tests Recommended</h3>
                    <div className="lab-tests-list">
                      <table className="medications-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Test Name</th>
                            <th>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPrescription.lab_tests.map((test, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td><strong>{test.test_name}</strong></td>
                              <td>{test.instructions || 'As per standard protocol'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* General Advice */}
                {selectedPrescription.advice && (
                  <div className="prescription-section">
                    <h3><i className="icofont-doctor"></i> General Advice</h3>
                    <div className="section-content">
                      <p>{selectedPrescription.advice}</p>
                    </div>
                  </div>
                )}

                {/* Follow Up */}
                {selectedPrescription.follow_up && (
                  <div className="prescription-section">
                    <h3><i className="icofont-calendar"></i> Follow Up</h3>
                    <div className="section-content">
                      <p>{selectedPrescription.follow_up}</p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="prescription-footer">
                  <div className="signature-section">
                    <div className="signature-line"></div>
                    <p>Dr. {selectedPrescription.doctor.name}</p>
                    <p className="signature-label">Doctor's Signature</p>
                  </div>
                  
                  <div className="footer-note">
                    <p><strong>Note:</strong> This is a digitally generated prescription. 
                    Please take medications as prescribed and consult your doctor if you experience any adverse effects.</p>
                  </div>
                </div>

                {/* Watermark */}
                <div className="prescription-watermark">Click & Care</div>
              </div>

              {/* Lab Reports Section */}
              {labReports.length > 0 && (
                <div className="lab-reports-section no-print">
                  <h2>
                    <i className="icofont-file-document"></i>
                    Lab Reports ({labReports.length})
                  </h2>
                  
                  <div className="lab-reports-grid">
                    {labReports.map(report => (
                      <div key={report.id} className="lab-report-card">
                        <div className="lab-report-header">
                          <div>
                            <h3>
                              <i className="icofont-laboratory"></i>
                              {report.report_id}
                            </h3>
                            <p className="clinic-name">
                              <i className="icofont-building"></i>
                              {report.clinic?.clinic_name || 'Clinic'}
                            </p>
                          </div>
                          <span className="report-date">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="lab-report-body">
                          <div className="pathologist-info-small">
                            <strong>Pathologist:</strong> {report.pathologist_name}
                          </div>

                          <div className="test-results-preview">
                            <strong>Tests Performed:</strong>
                            <div className="tests-preview-list">
                              {report.test_results?.slice(0, 3).map((test, idx) => (
                                <div key={idx} className="test-preview-item">
                                  <span>{test.test_name}</span>
                                  <span className={`status-indicator-small status-${test.status}`}>
                                    {test.result} {test.unit}
                                  </span>
                                </div>
                              ))}
                              {report.test_results?.length > 3 && (
                                <span className="more-tests">
                                  +{report.test_results.length - 3} more tests
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="lab-report-footer">
                          <button 
                            onClick={() => handleViewReport(report)}
                            className="btn-view-report"
                          >
                            <i className="icofont-eye-alt"></i>
                            View Full Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Quotation Responses Section */}
              {labQuotationResponses.length > 0 && (
                <div className="lab-quotations-section no-print">
                  <h2>
                    <i className="icofont-laboratory"></i>
                    Lab Test Quotations Received ({labQuotationResponses.length})
                  </h2>
                  
                  <div className="quotations-grid">
                    {labQuotationResponses.map(quotation => (
                      <div key={quotation.id} className="quotation-card lab-quotation-card">
                        <div className="quotation-card-header">
                          <div>
                            <h3>{quotation.clinic?.clinic_name || 'Clinic'}</h3>
                            <p className="clinic-location">
                              <i className="icofont-location-pin"></i>
                              {quotation.clinic?.address || 'Address not available'}
                            </p>
                          </div>
                          <span className={`quotation-status status-${quotation.is_accepted ? 'accepted' : 'pending'}`}>
                            {quotation.is_accepted ? 'Accepted' : 'Pending'}
                          </span>
                        </div>

                        <div className="quotation-card-body">
                          <div className="items-breakdown">
                            <h4>Lab Tests</h4>
                            <table className="items-table-small">
                              <thead>
                                <tr>
                                  <th>Test Name</th>
                                  <th>Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {quotation.test_items?.map((test, idx) => (
                                  <tr key={idx}>
                                    <td>{test.test_name}</td>
                                    <td>৳{parseFloat(test.price).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {quotation.estimated_delivery && (
                            <div className="delivery-info" style={{marginTop: '15px', marginBottom: '10px'}}>
                              <i className="icofont-clock-time"></i>
                              <span>Estimated Delivery: {quotation.estimated_delivery}</span>
                            </div>
                          )}

                          <div className="quotation-summary">
                            <div className="summary-row total">
                              <span>Total Amount:</span>
                              <strong>৳{parseFloat(quotation.total_amount).toFixed(2)}</strong>
                            </div>
                          </div>

                          {quotation.additional_notes && (
                            <div className="clinic-notes">
                              <strong>Clinic Notes:</strong>
                              <p>{quotation.additional_notes}</p>
                            </div>
                          )}

                          <div className="clinic-contact">
                            <p>
                              <i className="icofont-phone"></i>
                              {quotation.clinic?.phone || 'N/A'}
                            </p>
                            {quotation.clinic?.email && (
                              <p>
                                <i className="icofont-email"></i>
                                {quotation.clinic.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {!quotation.is_accepted && (
                          <div className="quotation-card-footer">
                            <button 
                              onClick={() => handleAcceptLabQuotation(quotation.id)}
                              className="btn-accept"
                            >
                              <i className="icofont-check-circled"></i>
                              Accept Quotation
                            </button>
                          </div>
                        )}

                        {quotation.is_accepted && (
                          <div className="accepted-badge">
                            <i className="icofont-check-circled"></i>
                            You accepted this quotation
                            {labReports.some(r => r.quotation_response?.id === quotation.id) && (
                              <span style={{marginLeft: '10px'}}>• Report Available</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotation Responses Section */}
              {quotationResponses.length > 0 && (
                <div className="quotations-section no-print">
                  <h2>
                    <i className="icofont-prescription"></i>
                    Pharmacy Quotations Received ({quotationResponses.length})
                  </h2>
                  
                  <div className="quotations-grid">
                    {quotationResponses.map(quotation => (
                      <div key={quotation.id} className="quotation-card">
                        <div className="quotation-card-header">
                          <div>
                            <h3>{quotation.pharmacy.pharmacy_name}</h3>
                            <p className="pharmacy-location">
                              <i className="icofont-location-pin"></i>
                              {quotation.pharmacy.city}, {quotation.pharmacy.state}
                            </p>
                          </div>
                          <span className={`quotation-status status-${quotation.status}`}>
                            {quotation.status}
                          </span>
                        </div>

                        <div className="quotation-card-body">
                          <div className="items-breakdown">
                            <h4>Items</h4>
                            <table className="items-table-small">
                              <thead>
                                <tr>
                                  <th>Medicine</th>
                                  <th>Qty</th>
                                  <th>Price</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {quotation.quoted_items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td>{item.medicine_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>৳{item.unit_price}</td>
                                    <td>৳{item.total_price}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="quotation-summary">
                            <div className="summary-row">
                              <span>Subtotal:</span>
                              <strong>৳{quotation.subtotal}</strong>
                            </div>
                            <div className="summary-row">
                              <span>Delivery Charge:</span>
                              <strong>৳{quotation.delivery_charge}</strong>
                            </div>
                            <div className="summary-row total">
                              <span>Total Amount:</span>
                              <strong>৳{quotation.total_amount}</strong>
                            </div>
                          </div>

                          {quotation.estimated_delivery_time && (
                            <div className="delivery-info">
                              <i className="icofont-clock-time"></i>
                              <span>Estimated Delivery: {quotation.estimated_delivery_time}</span>
                            </div>
                          )}

                          {quotation.notes && (
                            <div className="pharmacy-notes">
                              <strong>Pharmacy Notes:</strong>
                              <p>{quotation.notes}</p>
                            </div>
                          )}

                          <div className="pharmacy-contact">
                            <p>
                              <i className="icofont-phone"></i>
                              {quotation.pharmacy.phone}
                            </p>
                            {quotation.pharmacy.email && (
                              <p>
                                <i className="icofont-email"></i>
                                {quotation.pharmacy.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {quotation.status === 'quoted' && (
                          <div className="quotation-card-footer">
                            <button 
                              onClick={() => handleAcceptQuotation(quotation.id)}
                              className="btn-accept"
                            >
                              <i className="icofont-check-circled"></i>
                              Accept Quotation
                            </button>
                          </div>
                        )}

                        {quotation.status === 'accepted' && (
                          <div className="accepted-badge">
                            <i className="icofont-check-circled"></i>
                            You accepted this quotation
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Report Viewer Modal */}
              {showReportViewer && selectedReport && (
                <div className="modal-overlay" onClick={() => setShowReportViewer(false)}>
                  <div className="modal modal-large lab-report-viewer" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>
                        <i className="icofont-laboratory"></i>
                        Lab Report - {selectedReport.report_id}
                      </h3>
                      <button onClick={() => setShowReportViewer(false)} className="modal-close">
                        <i className="icofont-close"></i>
                      </button>
                    </div>

                    <div className="modal-body">
                      {/* Report Header */}
                      <div className="report-viewer-header">
                        <div className="report-info-grid">
                          <div className="report-info-item">
                            <label>Report ID:</label>
                            <span>{selectedReport.report_id}</span>
                          </div>
                          <div className="report-info-item">
                            <label>Clinic:</label>
                            <span>{selectedReport.clinic?.clinic_name || 'Clinic'}</span>
                          </div>
                          <div className="report-info-item">
                            <label>Date:</label>
                            <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
                          </div>
                          <div className="report-info-item">
                            <label>Pathologist:</label>
                            <span>{selectedReport.pathologist_name}</span>
                          </div>
                          {selectedReport.pathologist_signature && (
                            <div className="report-info-item">
                              <label>Signature:</label>
                              <span>{selectedReport.pathologist_signature}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Test Results */}
                      <div className="report-section">
                        <h4>
                          <i className="icofont-test-tube-alt"></i>
                          Test Results
                        </h4>
                        <div className="test-results-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Test Name</th>
                                <th>Value</th>
                                <th>Unit</th>
                                <th>Reference Range</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedReport.test_results?.map((test, idx) => (
                                <tr key={idx}>
                                  <td><strong>{test.test_name}</strong></td>
                                  <td>{test.result}</td>
                                  <td>{test.unit || '-'}</td>
                                  <td>{test.normal_range || '-'}</td>
                                  <td>
                                    <span className={`status-badge-large status-${test.status}`}>
                                      {test.status === 'normal' && <i className="icofont-check-circled"></i>}
                                      {test.status === 'abnormal' && <i className="icofont-warning"></i>}
                                      {test.status === 'critical' && <i className="icofont-close-circled"></i>}
                                      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Notes */}
                      {selectedReport.diagnosis_notes && (
                        <div className="report-section">
                          <h4>
                            <i className="icofont-listing-box"></i>
                            Diagnosis Notes
                          </h4>
                          <p className="report-notes">{selectedReport.diagnosis_notes}</p>
                        </div>
                      )}

                      {/* Attached Files */}
                      <div className="report-section">
                        <h4>
                          <i className="icofont-file-pdf"></i>
                          Attached Files
                        </h4>
                        <div className="report-files-grid">
                          {selectedReport.report_file_url && (
                            <a 
                              href={`${API_URL}${selectedReport.report_file_url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="report-file-link pdf-link"
                            >
                              <i className="icofont-file-pdf"></i>
                              <span>Lab Report PDF</span>
                              <i className="icofont-download"></i>
                            </a>
                          )}
                          {selectedReport.report_images?.map((url, idx) => (
                            <a 
                              key={idx}
                              href={`${API_URL}${url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="report-file-link image-link"
                            >
                              <i className="icofont-image"></i>
                              <span>Report Image {idx + 1}</span>
                              <i className="icofont-external-link"></i>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Clinic Contact */}
                      <div className="report-section">
                        <h4>
                          <i className="icofont-building"></i>
                          Clinic Information
                        </h4>
                        <div className="clinic-contact-info">
                          <p>
                            <i className="icofont-building"></i>
                            {selectedReport.clinic?.clinic_name || 'Clinic'}
                          </p>
                          <p>
                            <i className="icofont-location-pin"></i>
                            {selectedReport.clinic?.address || 'Address not available'}
                          </p>
                          <p>
                            <i className="icofont-phone"></i>
                            {selectedReport.clinic?.phone || 'N/A'}
                          </p>
                          {selectedReport.clinic?.email && (
                            <p>
                              <i className="icofont-email"></i>
                              {selectedReport.clinic.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button 
                        onClick={() => window.print()}
                        className="btn-secondary"
                      >
                        <i className="icofont-print"></i>
                        Print Report
                      </button>
                      <button 
                        onClick={() => setShowReportViewer(false)}
                        className="btn-primary"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lab Quotation Request Modal */}
              {showLabRequestModal && (
                <div className="modal-overlay" onClick={closeLabQuotationModal}>
                  <div className="modal quotation-request-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>Request Lab Test Quotation</h3>
                      <button onClick={closeLabQuotationModal} className="modal-close">
                        <i className="icofont-close"></i>
                      </button>
                    </div>

                    <div className="modal-body">
                      <div className="prescription-info-box">
                        <h4>Prescription: {selectedPrescription?.prescription_id}</h4>
                        <p>
                          <strong>Lab Tests:</strong> {selectedPrescription?.lab_tests?.length} tests
                        </p>
                        <div className="lab-tests-preview">
                          {selectedPrescription?.lab_tests?.map((test, idx) => (
                            <span key={idx} className="test-badge">
                              <i className="icofont-test-tube-alt"></i>
                              {test.test_name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="clinics-info">
                        <i className="icofont-info-circle"></i>
                        <p>
                          {clinics.length > 0
                            ? selectedClinicIds.length > 0
                              ? `You have selected ${selectedClinicIds.length} of ${clinics.length} available clinics.`
                              : `Select the clinics you want to receive a quotation from (${clinics.length} available).`
                            : 'No clinics available to receive your request right now.'}
                        </p>
                      </div>

                      {/* Clinic List */}
                      {clinics.length > 0 && (
                        <div className="clinics-list-container">
                          <h4 style={{marginBottom: '15px', fontSize: '16px', color: '#1e293b', fontWeight: '600'}}>
                            <i className="icofont-laboratory"></i> Participating Clinics
                          </h4>
                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                            <button
                              type="button"
                              onClick={handleSelectAllClinics}
                              className="select-all-btn"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#17a2b8',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600
                              }}
                            >
                              {selectedClinicIds.length === clinics.length ? 'Clear Selection' : 'Select All' }
                            </button>
                            <span style={{fontSize: '12px', color: '#64748b'}}>
                              {selectedClinicIds.length} selected
                            </span>
                          </div>
                          <div className="clinics-list" style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {clinics.map((clinic) => (
                              <div key={clinic.id} className={`clinic-item ${selectedClinicIds.includes(clinic.id) ? 'selected' : ''}`} style={{
                                background: 'white',
                                border: selectedClinicIds.includes(clinic.id) ? '1px solid #17a2b8' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                              }}
                               onClick={() => toggleClinicSelection(clinic.id)}
                            >
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  background: 'linear-gradient(135deg, #17a2b8 0%, #0e6ba8 100%)',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '20px',
                                  flexShrink: 0
                                }}>
                                  <i className="icofont-laboratory"></i>
                                </div>
                                <div style={{flex: 1, minWidth: 0}}>
                                  <h5 style={{margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b'}}>
                                    {clinic.clinic_name}
                                  </h5>
                                  <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#64748b'}}>
                                    <i className="icofont-location-pin"></i> {clinic.city}, {clinic.state}
                                    {clinic.phone && (
                                      <> • <i className="icofont-phone"></i> {clinic.phone}</>
                                    )}
                                  </p>
                                </div>
                                <div style={{
                                  padding: '4px 10px',
                                  background: '#d4edda',
                                  color: '#155724',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flexShrink: 0
                                }}>
                                  <i className="icofont-check-circled"></i>
                                  Verified
                                </div>
                                <div style={{marginLeft: '12px'}}>
                                  <input
                                    type="checkbox"
                                    checked={selectedClinicIds.includes(clinic.id)}
                                    onChange={() => toggleClinicSelection(clinic.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {clinics.length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '30px 20px',
                          background: '#fff3cd',
                          borderRadius: '8px',
                          border: '1px solid #ffeaa7',
                          marginBottom: '20px'
                        }}>
                          <i className="icofont-exclamation-circle" style={{fontSize: '36px', color: '#856404', marginBottom: '10px'}}></i>
                          <p style={{margin: 0, color: '#856404', fontWeight: '500'}}>
                            No verified clinics available at the moment.
                          </p>
                          <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#856404'}}>
                            Please check back later or contact support.
                          </p>
                        </div>
                      )}

                      <div className="form-group">
                        <label>Additional Notes (Optional)</label>
                        <textarea
                          value={labRequestNotes}
                          onChange={(e) => setLabRequestNotes(e.target.value)}
                          placeholder="Any specific requirements or questions for clinics..."
                          rows="4"
                        />
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button 
                        onClick={closeLabQuotationModal} 
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSubmitLabQuotationRequest}
                        className="btn-submit"
                        disabled={submittingLab || clinics.length === 0 || selectedClinicIds.length === 0}
                        title={
                          clinics.length === 0
                            ? 'No clinics available'
                            : selectedClinicIds.length === 0
                              ? 'Select at least one clinic'
                              : ''
                        }
                      >
                        {submittingLab ? (
                          <>
                            <i className="icofont-spinner-alt-2 icofont-spin"></i>
                            Sending...
                          </>
                        ) : (
                          <>
                            <i className="icofont-paper-plane"></i>
                            Send Request {selectedClinicIds.length > 0 && `to ${selectedClinicIds.length} Clinic${selectedClinicIds.length > 1 ? 's' : ''}`}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Quotation Modal */}
              {showRequestModal && (
                <div className="modal-overlay" onClick={closeQuotationModal}>
                  <div className="modal quotation-request-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>Request Pharmacy Quotation</h3>
                      <button onClick={closeQuotationModal} className="modal-close">
                        <i className="icofont-close"></i>
                      </button>
                    </div>

                    <div className="modal-body">
                      <div className="prescription-info-box">
                        <h4>Prescription: {selectedPrescription?.prescription_id}</h4>
                        <p>
                          <strong>Medications:</strong> {selectedPrescription?.medications.length} items
                        </p>
                      </div>

                      <div className="pharmacies-info">
                        <i className="icofont-info-circle"></i>
                        <p>
                          {pharmacies.length > 0
                            ? selectedPharmacyIds.length > 0
                              ? `You have selected ${selectedPharmacyIds.length} of ${pharmacies.length} available pharmacies.`
                              : `Select the pharmacies you want to receive a quotation from (${pharmacies.length} available).`
                            : 'No pharmacies available to receive your request right now.'}
                        </p>
                      </div>

                      {/* Pharmacy List */}
                      {pharmacies.length > 0 && (
                        <div className="pharmacies-list-container">
                          <h4 style={{marginBottom: '15px', fontSize: '16px', color: '#1e293b', fontWeight: '600'}}>
                            <i className="icofont-pills"></i> Participating Pharmacies
                          </h4>
                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                            <button
                              type="button"
                              onClick={handleSelectAllPharmacies}
                              className="select-all-btn"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#4f46e5',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600
                              }}
                            >
                              {selectedPharmacyIds.length === pharmacies.length ? 'Clear Selection' : 'Select All' }
                            </button>
                            <span style={{fontSize: '12px', color: '#64748b'}}>
                              {selectedPharmacyIds.length} selected
                            </span>
                          </div>
                          <div className="pharmacies-list" style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {pharmacies.map((pharmacy) => (
                              <div key={pharmacy.id} className={`pharmacy-item ${selectedPharmacyIds.includes(pharmacy.id) ? 'selected' : ''}`} style={{
                                background: 'white',
                                border: selectedPharmacyIds.includes(pharmacy.id) ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.3s ease'
                              }}
                               onClick={() => togglePharmacySelection(pharmacy.id)}
                            >
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '20px',
                                  flexShrink: 0
                                }}>
                                  <i className="icofont-pills"></i>
                                </div>
                                <div style={{flex: 1, minWidth: 0}}>
                                  <h5 style={{margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b'}}>
                                    {pharmacy.pharmacy_name}
                                  </h5>
                                  <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#64748b'}}>
                                    <i className="icofont-location-pin"></i> {pharmacy.city}, {pharmacy.state}
                                    {pharmacy.phone && (
                                      <> • <i className="icofont-phone"></i> {pharmacy.phone}</>
                                    )}
                                  </p>
                                </div>
                                <div style={{
                                  padding: '4px 10px',
                                  background: '#d4edda',
                                  color: '#155724',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flexShrink: 0
                                }}>
                                  <i className="icofont-check-circled"></i>
                                  Verified
                                </div>
                                <div style={{marginLeft: '12px'}}>
                                  <input
                                    type="checkbox"
                                    checked={selectedPharmacyIds.includes(pharmacy.id)}
                                    onChange={() => togglePharmacySelection(pharmacy.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pharmacies.length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '30px 20px',
                          background: '#fff3cd',
                          borderRadius: '8px',
                          border: '1px solid #ffeaa7',
                          marginBottom: '20px'
                        }}>
                          <i className="icofont-exclamation-circle" style={{fontSize: '36px', color: '#856404', marginBottom: '10px'}}></i>
                          <p style={{margin: 0, color: '#856404', fontWeight: '500'}}>
                            No verified pharmacies available at the moment.
                          </p>
                          <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#856404'}}>
                            Please check back later or contact support.
                          </p>
                        </div>
                      )}

                      <div className="form-group">
                        <label>Additional Notes (Optional)</label>
                        <textarea
                          value={requestNotes}
                          onChange={(e) => setRequestNotes(e.target.value)}
                          placeholder="Any specific requirements or questions for pharmacies..."
                          rows="4"
                        />
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button 
                        onClick={closeQuotationModal} 
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSubmitQuotationRequest}
                        className="btn-submit"
                        disabled={submitting || pharmacies.length === 0 || selectedPharmacyIds.length === 0}
                        title={
                          pharmacies.length === 0
                            ? 'No pharmacies available'
                            : selectedPharmacyIds.length === 0
                              ? 'Select at least one pharmacy'
                              : ''
                        }
                      >
                        {submitting ? (
                          <>
                            <i className="icofont-spinner-alt-2 icofont-spin"></i>
                            Sending...
                          </>
                        ) : (
                          <>
                            <i className="icofont-paper-plane"></i>
                            Send Request {selectedPharmacyIds.length > 0 && `to ${selectedPharmacyIds.length} Pharmacy${selectedPharmacyIds.length > 1 ? 'ies' : ''}`}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { prescriptionAPI } from '../services/api';
import './ViewPrescription.css';

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

  const closeQuotationModal = () => {
    setShowRequestModal(false);
    setSelectedPharmacyIds([]);
    setRequestNotes('');
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
  };

  const loadQuotationsForPrescription = async (prescriptionId) => {
    setLoadingQuotations(true);
    
    try {
  const token = localStorage.getItem('patient_accessToken');
      if (!token) return;

      // Get quotation requests for this prescription
      const requestsResponse = await fetch('http://localhost:8000/api/quotations/my-requests', {
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
            fetch(`http://localhost:8000/api/quotations/request/${req.id}/responses`, {
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
      const response = await fetch('http://localhost:8000/api/quotations/pharmacies');
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
      
      const response = await fetch('http://localhost:8000/api/quotations/request', {
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
      const response = await fetch(`http://localhost:8000/api/quotations/${quotationId}/accept`, {
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

              {/* Quotation Responses Section */}
              {quotationResponses.length > 0 && (
                <div className="quotations-section no-print">
                  <h2>
                    <i className="icofont-prescription"></i>
                    Quotations Received ({quotationResponses.length})
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

              {/* Request Quotation Modal */}
              {showRequestModal && (
                <div className="modal-overlay" onClick={closeQuotationModal}>
                  <div className="modal quotation-request-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>Request Quotation</h3>
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

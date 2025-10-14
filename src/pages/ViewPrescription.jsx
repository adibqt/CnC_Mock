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
                <div className="prescription-watermark">Care & Cure</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

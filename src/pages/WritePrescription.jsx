import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prescriptionAPI } from '../services/api';
import './WritePrescription.css';

export default function WritePrescription() {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '', duration: '', notes: '' }
  ]);
  const [labTests, setLabTests] = useState([
    { test_name: '', instructions: '' }
  ]);
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');

  useEffect(() => {
    loadCompletedAppointments();
  }, []);

  const loadCompletedAppointments = async () => {
    setLoading(true);
    const result = await prescriptionAPI.getCompletedAppointments();
    
    if (result.success) {
      setAppointments(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleAppointmentSelect = (appointment) => {
    if (appointment.has_prescription) {
      setError('Prescription already exists for this appointment');
      return;
    }
    
    setSelectedAppointment(appointment);
    setError('');
    setSuccess('');
    
    // Reset form
    setDiagnosis('');
    setMedications([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    setLabTests([{ test_name: '', instructions: '' }]);
    setAdvice('');
    setFollowUp('');
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index, field, value) => {
    const updatedMedications = medications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setMedications(updatedMedications);
  };

  const addLabTest = () => {
    setLabTests([...labTests, { test_name: '', instructions: '' }]);
  };

  const removeLabTest = (index) => {
    if (labTests.length > 1) {
      setLabTests(labTests.filter((_, i) => i !== index));
    } else {
      // If removing the last test, just clear it
      setLabTests([{ test_name: '', instructions: '' }]);
    }
  };

  const updateLabTest = (index, field, value) => {
    const updatedTests = labTests.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    );
    setLabTests(updatedTests);
  };

  const validateForm = () => {
    if (!selectedAppointment) {
      setError('Please select an appointment');
      return false;
    }
    
    if (!diagnosis.trim()) {
      setError('Diagnosis is required');
      return false;
    }
    
    if (medications.length === 0 || !medications[0].name.trim()) {
      setError('At least one medication is required');
      return false;
    }
    
    // Validate all medications
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med.name.trim() || !med.dosage.trim() || !med.frequency.trim() || !med.duration.trim()) {
        setError(`Please complete all fields for medication ${i + 1}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    setSaving(true);
    
    const prescriptionData = {
      appointment_id: selectedAppointment.id,
      diagnosis: diagnosis.trim(),
      medications: medications.filter(med => med.name.trim()),
      lab_tests: labTests.filter(test => test.test_name.trim()),
      advice: advice.trim() || null,
      follow_up: followUp.trim() || null
    };
    
    console.log('📝 Creating prescription:', prescriptionData);
    const result = await prescriptionAPI.createPrescription(prescriptionData);
    console.log('📋 Prescription result:', result);
    
    if (result.success) {
      console.log('✅ Prescription created successfully:', result.data.prescription_id);
      setSuccess('Prescription created successfully!');
      
      // Mark appointment as having prescription
      const updatedAppointments = appointments.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...apt, has_prescription: true, prescription_id: result.data.prescription_id }
          : apt
      );
      setAppointments(updatedAppointments);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSelectedAppointment(null);
        setDiagnosis('');
        setMedications([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
        setLabTests([{ test_name: '', instructions: '' }]);
        setAdvice('');
        setFollowUp('');
        setSuccess('');
      }, 2000);
    } else {
      console.error('❌ Failed to create prescription:', result.error);
      setError(result.error);
    }
    
    setSaving(false);
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
      <div className="write-prescription-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="write-prescription-container">
      {/* Header */}
      <header className="prescription-header">
        <button onClick={() => navigate('/doctor-home')} className="back-btn">
          <i className="icofont-arrow-left"></i>
          Back
        </button>
        <h1>Write Prescription</h1>
      </header>

      <div className="prescription-content">
        {/* Appointments List */}
        <aside className="appointments-sidebar">
          <h2>Completed Appointments</h2>
          
          {appointments.length === 0 ? (
            <div className="no-appointments">
              <i className="icofont-calendar"></i>
              <p>No completed appointments</p>
            </div>
          ) : (
            <div className="appointments-list">
              {appointments.map(appointment => (
                <div 
                  key={appointment.id}
                  className={`appointment-card ${selectedAppointment?.id === appointment.id ? 'selected' : ''} ${appointment.has_prescription ? 'has-prescription' : ''}`}
                  onClick={() => handleAppointmentSelect(appointment)}
                >
                  <div className="appointment-patient">
                    {appointment.patient.profile_picture_url ? (
                      <img 
                        src={`http://localhost:8000${appointment.patient.profile_picture_url}`}
                        alt={appointment.patient.name}
                        className="patient-avatar"
                      />
                    ) : (
                      <div className="patient-avatar-placeholder">
                        <i className="icofont-user"></i>
                      </div>
                    )}
                    <div>
                      <h3>{appointment.patient.name || 'Patient'}</h3>
                      <p className="appointment-date">
                        <i className="icofont-calendar"></i>
                        {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {appointment.has_prescription && (
                    <span className="prescription-badge">
                      <i className="icofont-check-circled"></i>
                      Prescription Done
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Prescription Form */}
        <main className="prescription-form-container">
          {!selectedAppointment ? (
            <div className="no-selection">
              <i className="icofont-prescription"></i>
              <h2>Select an Appointment</h2>
              <p>Choose a completed appointment from the left to write a prescription</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="prescription-form">
              {/* Messages */}
              {error && (
                <div className="alert alert-error">
                  <i className="icofont-warning"></i>
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert alert-success">
                  <i className="icofont-check-circled"></i>
                  {success}
                </div>
              )}

              {/* Patient Information Card */}
              <section className="patient-info-card">
                <h2><i className="icofont-patient-file"></i> Patient Information</h2>
                <div className="patient-details-grid">
                  <div className="detail-item">
                    <span className="label">Name:</span>
                    <span className="value">{selectedAppointment.patient.name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Age:</span>
                    <span className="value">{calculateAge(selectedAppointment.patient.date_of_birth)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Blood Group:</span>
                    <span className="value">{selectedAppointment.patient.blood_group || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Visit Date:</span>
                    <span className="value">{selectedAppointment.appointment_date}</span>
                  </div>
                </div>
                
                {selectedAppointment.symptoms && (
                  <div className="symptoms-section">
                    <h3><i className="icofont-prescription"></i> Symptoms</h3>
                    <p>{selectedAppointment.symptoms}</p>
                  </div>
                )}
              </section>

              {/* Diagnosis */}
              <section className="form-section">
                <label className="form-label">
                  <i className="icofont-stethoscope-alt"></i>
                  Diagnosis <span className="required">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis details..."
                  rows="3"
                  required
                />
              </section>

              {/* Medications */}
              <section className="form-section">
                <div className="section-header">
                  <label className="form-label">
                    <i className="icofont-pills"></i>
                    Medications <span className="required">*</span>
                  </label>
                  <button type="button" onClick={addMedication} className="add-medication-btn">
                    <i className="icofont-plus-circle"></i>
                    Add Medication
                  </button>
                </div>

                <div className="medications-list">
                  {medications.map((medication, index) => (
                    <div key={index} className="medication-item">
                      <div className="medication-header">
                        <span className="medication-number">Medication {index + 1}</span>
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="remove-medication-btn"
                          >
                            <i className="icofont-close-line"></i>
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="medication-fields">
                        <input
                          type="text"
                          placeholder="Drug Name *"
                          value={medication.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          className="form-input"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Dosage *"
                          value={medication.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          className="form-input"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Frequency *"
                          value={medication.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          className="form-input"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Duration *"
                          value={medication.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          className="form-input"
                          required
                        />
                        <textarea
                          placeholder="Notes (optional)"
                          value={medication.notes}
                          onChange={(e) => updateMedication(index, 'notes', e.target.value)}
                          className="form-textarea"
                          rows="2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Lab Tests */}
              <section className="form-section">
                <div className="section-header">
                  <label className="form-label">
                    <i className="icofont-test-tube-alt"></i>
                    Lab Tests (Optional)
                  </label>
                  <button type="button" onClick={addLabTest} className="add-medication-btn">
                    <i className="icofont-plus-circle"></i>
                    Add Lab Test
                  </button>
                </div>

                <div className="medications-list">
                  {labTests.map((test, index) => (
                    <div key={index} className="medication-item lab-test-item">
                      <div className="medication-header">
                        <span className="medication-number">Lab Test {index + 1}</span>
                        {labTests.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLabTest(index)}
                            className="remove-medication-btn"
                          >
                            <i className="icofont-close-line"></i>
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="lab-test-fields">
                        <input
                          type="text"
                          placeholder="Test Name (e.g., Complete Blood Count, Blood Sugar)"
                          value={test.test_name}
                          onChange={(e) => updateLabTest(index, 'test_name', e.target.value)}
                          className="form-input"
                        />
                        <textarea
                          placeholder="Instructions (optional)"
                          value={test.instructions}
                          onChange={(e) => updateLabTest(index, 'instructions', e.target.value)}
                          className="form-textarea"
                          rows="2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* General Advice */}
              <section className="form-section">
                <label className="form-label">
                  <i className="icofont-doctor"></i>
                  General Advice
                </label>
                <textarea
                  className="form-textarea"
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="Enter general advice for the patient..."
                  rows="4"
                />
              </section>

              {/* Follow Up */}
              <section className="form-section">
                <label className="form-label">
                  <i className="icofont-calendar"></i>
                  Follow Up
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="e.g., Follow up in 5 days or if symptoms worsen"
                />
              </section>

              {/* Submit Button */}
              <div className="form-actions">
                <button 
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="cancel-btn"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="icofont-save"></i>
                      Create Prescription
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

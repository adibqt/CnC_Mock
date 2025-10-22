import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentAPI, authUtils } from '../services/api';
import './DoctorDetails.css';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function to handle image URLs (works with both absolute URLs from Vercel Blob and relative paths)
const getImageUrl = (url) => {
  if (!url) return '';
  // If URL already starts with http:// or https://, return as-is (Vercel Blob URLs)
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Otherwise prepend API_URL (relative paths)
  return `${API_URL}${url}`;
};


const DoctorDetails = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Appointment form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (!authUtils.isAuthenticated('patient')) {
      navigate('/login');
      return;
    }
    loadDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadDoctorDetails = async () => {
    try {
      const result = await appointmentAPI.getAllDoctors();
      if (result.success) {
        const doctorData = result.data.find(d => d.id === parseInt(doctorId));
        if (doctorData) {
          setDoctor(doctorData);
        } else {
          setError('Doctor not found');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;
    
    setLoadingSlots(true);
    try {
      const result = await appointmentAPI.getAvailableSlots(doctorId, selectedDate);
      if (result.success) {
        setAvailableSlots(result.data.slots || []);
      } else {
        setError(result.error);
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Error loading slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedSlot) {
      setError('Please select date and time slot');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      const appointmentData = {
        doctor_id: parseInt(doctorId),
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        symptoms: symptoms || null,
        patient_notes: patientNotes || null
      };

      const result = await appointmentAPI.createAppointment(appointmentData);
      
      if (result.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          navigate('/user-home');
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // Allow booking up to 30 days ahead
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <i className="icofont-spinner-alt-2 icofont-spin"></i>
        <p>Loading doctor details...</p>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="error-container">
        <i className="icofont-warning"></i>
        <p>{error}</p>
        <button onClick={() => navigate('/user-home')} className="btn btn-primary">
          Back to Home
        </button>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="success-container">
        <i className="icofont-check-circled"></i>
        <h2>Appointment Booked Successfully!</h2>
        <p>Your appointment has been confirmed. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="doctor-details-page">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate('/user-home')} className="btn-back">
          <i className="icofont-arrow-left"></i> Back
        </button>
        <h1>Book Appointment</h1>
      </div>

      <div className="doctor-details-container">
        {/* Doctor Information Card */}
        <div className="doctor-info-card">
          <div className="doctor-card-header">
            <div className="doctor-avatar">
              {doctor?.profile_picture_url ? (
                <img 
                  src={getImageUrl(doctor.profile_picture_url)}
                  alt={doctor.full_name}
                />
              ) : (
                <div className="avatar-placeholder">
                  <i className="icofont-doctor"></i>
                </div>
              )}
            </div>
            <div className="doctor-info">
              <h2>{doctor?.full_name || doctor?.name}</h2>
              <p className="specialization">
                <i className="icofont-stethoscope-alt"></i> {doctor?.specialization}
              </p>
              <p className="phone">
                <i className="icofont-phone"></i> {doctor?.phone}
              </p>
              {doctor?.is_verified && (
                <span className="verified-badge">
                  <i className="icofont-verification-check"></i> 
                </span>
              )}
            </div>
          </div>

          {/* Schedule Information */}
          <div className="schedule-info">
            <h3><i className="icofont-clock-time"></i> Weekly Schedule</h3>
            {doctor?.schedule && Object.keys(doctor.schedule).length > 0 ? (
              <div className="schedule-grid">
                {Object.entries(doctor.schedule).map(([day, shifts]) => (
                  <div key={day} className="schedule-day">
                    <div className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                    <div className="day-shifts">
                      {shifts && shifts.length > 0 ? (
                        shifts.map((shift, idx) => (
                          <div key={idx} className="shift-time">
                            {shift.start} - {shift.end}
                          </div>
                        ))
                      ) : (
                        <span className="unavailable">Unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-schedule">Schedule not available. Please contact the doctor directly.</p>
            )}
          </div>
        </div>

        {/* Appointment Booking Form */}
        <div className="booking-form-card">
          <h3><i className="icofont-calendar"></i> Book Your Appointment</h3>
          
          {error && (
            <div className="alert alert-error">
              <i className="icofont-warning"></i> {error}
            </div>
          )}

          <form onSubmit={handleBookAppointment}>
            <div className="form-group">
              <label htmlFor="date">
                <i className="icofont-calendar"></i> Select Date *
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot('');
                }}
                min={getMinDate()}
                max={getMaxDate()}
                required
              />
            </div>

            {selectedDate && (
              <div className="form-group">
                <label>
                  <i className="icofont-clock-time"></i> Available Time Slots *
                </label>
                {loadingSlots ? (
                  <div className="loading-slots">
                    <i className="icofont-spinner-alt-2 icofont-spin"></i>
                    Loading available slots...
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="time-slots-grid">
                    {availableSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`time-slot ${selectedSlot === slot.time_slot ? 'selected' : ''} ${!slot.available ? 'booked' : ''}`}
                        onClick={() => slot.available && setSelectedSlot(slot.time_slot)}
                        disabled={!slot.available}
                      >
                        {slot.time_slot}
                        {!slot.available && <span className="booked-label">Booked</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="no-slots">No available slots for this date</p>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="symptoms">
                <i className="icofont-prescription"></i> Symptoms
              </label>
              <textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms..."
                rows="4"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="notes">
                <i className="icofont-note"></i> Additional Notes
              </label>
              <textarea
                id="notes"
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Any additional information..."
                rows="3"
              ></textarea>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/user-home')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={bookingLoading || !selectedDate || !selectedSlot}
              >
                {bookingLoading ? (
                  <>
                    <i className="icofont-spinner-alt-2 icofont-spin"></i> Booking...
                  </>
                ) : (
                  <>
                    <i className="icofont-check"></i> Confirm Appointment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetails;

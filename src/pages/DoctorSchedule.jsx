import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import './DoctorSchedule.css';

export default function DoctorSchedule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [schedule, setSchedule] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const result = await doctorAPI.getSchedule();
    if (result.success) {
      setSchedule(result.data.schedule);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const addTimeSlot = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: [...prev[day], { start: '09:00', end: '17:00' }]
    }));
  };

  const removeTimeSlot = (day, index) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const result = await doctorAPI.updateSchedule(schedule);
    
    if (result.success) {
      setSuccess('Schedule saved successfully!');
      setTimeout(() => {
        navigate('/doctor-home');
      }, 1500);
    } else {
      setError(result.error);
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="doctor-schedule">
        <div className="schedule-container">
          <div style={{textAlign: 'center', padding: '60px 20px'}}>
            <div className="loading-spinner"></div>
            <p style={{color: '#6b7280', fontSize: '16px', marginTop: '16px'}}>Loading schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-schedule">
      <div className="schedule-container">
        {/* Header */}
        <div className="schedule-header">
          <div className="header-left">
            <button onClick={() => navigate('/doctor-home')} className="back-btn">
              <i className="icofont-arrow-left"></i>
            </button>
            <div>
              <h1>Weekly Schedule</h1>
              <p>Set your availability for appointments</p>
            </div>
          </div>
        </div>

        {/* Schedule Card */}
        <div className="schedule-card">
          {error && (
            <div className="error-message">
              <i className="icofont-warning"></i>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="success-message">
              <i className="icofont-check-circled"></i>
              <p>{success}</p>
            </div>
          )}

          {/* Days */}
          <div className="days-list">
            {days.map(({ key, label }) => (
              <div key={key} className="day-section">
                <div className="day-header">
                  <div className="day-title">
                    <i className="icofont-calendar"></i>
                    <h3>{label}</h3>
                  </div>
                  <button 
                    onClick={() => addTimeSlot(key)} 
                    className="add-slot-btn"
                  >
                    <i className="icofont-plus-circle"></i>
                    Add Time Slot
                  </button>
                </div>

                {schedule[key].length === 0 ? (
                  <div className="no-slots">
                    <i className="icofont-clock-time"></i>
                    <p>No time slots set for this day</p>
                  </div>
                ) : (
                  <div className="time-slots">
                    {schedule[key].map((slot, index) => (
                      <div key={index} className="time-slot">
                        <div className="time-inputs">
                          <div className="input-group">
                            <label>Start Time</label>
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(key, index, 'start', e.target.value)}
                              className="time-input"
                            />
                          </div>
                          <span className="time-separator">to</span>
                          <div className="input-group">
                            <label>End Time</label>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(key, index, 'end', e.target.value)}
                              className="time-input"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeTimeSlot(key, index)}
                          className="remove-slot-btn"
                          title="Remove time slot"
                        >
                          <i className="icofont-close-line"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="schedule-actions">
            <button
              onClick={() => navigate('/doctor-home')}
              className="cancel-btn"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="save-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="icofont-save"></i>
                  Save Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

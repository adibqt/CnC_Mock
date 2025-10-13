## Patient Dashboard Integration - Quick Start

### Add Doctor Browsing Section to PatientDashboard.jsx

Add this code to your PatientDashboard component:

```jsx
import { appointmentAPI } from '../services/api';

// Add to state
const [doctors, setDoctors] = useState([]);
const [myAppointments, setMyAppointments] = useState([]);

// Add to useEffect
useEffect(() => {
  loadDoctors();
  loadMyAppointments();
}, []);

const loadDoctors = async () => {
  const result = await appointmentAPI.getAllDoctors();
  if (result.success) {
    setDoctors(result.data);
  }
};

const loadMyAppointments = async () => {
  const result = await appointmentAPI.getPatientAppointments();
  if (result.success) {
    setMyAppointments(result.data);
  }
};

// Add to JSX (after info-grid section):
```

```jsx
{/* My Appointments Section */}
<div className="section-card">
  <div className="section-header">
    <h3><i className="icofont-calendar"></i> My Appointments</h3>
    <button onClick={() => navigate('/user-home')} className="btn btn-sm">
      Book New Appointment
    </button>
  </div>
  
  {myAppointments && myAppointments.length > 0 ? (
    <div className="appointments-list">
      {myAppointments.slice(0, 5).map((apt) => (
        <div key={apt.id} className="appointment-card">
          <div className="appointment-doctor">
            {apt.doctor?.profile_picture_url ? (
              <img 
                src={`http://localhost:8000${apt.doctor.profile_picture_url}`}
                alt={apt.doctor.name}
                className="doctor-avatar-small"
              />
            ) : (
              <div className="doctor-avatar-small">
                <i className="icofont-doctor"></i>
              </div>
            )}
            <div className="doctor-info-small">
              <h4>Dr. {apt.doctor?.name}</h4>
              <p>{apt.doctor?.specialization}</p>
            </div>
          </div>
          <div className="appointment-details-small">
            <span className="date">
              <i className="icofont-calendar"></i>
              {new Date(apt.appointment_date).toLocaleDateString()}
            </span>
            <span className="time">
              <i className="icofont-clock-time"></i>
              {apt.time_slot}
            </span>
          </div>
          <span className={`status-badge-small ${apt.status}`}>
            {apt.status}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <div className="empty-state-small">
      <i className="icofont-calendar"></i>
      <p>No appointments yet</p>
      <button onClick={() => navigate('/user-home')} className="btn btn-primary">
        Book Your First Appointment
      </button>
    </div>
  )}
</div>

{/* Available Doctors Section */}
<div className="section-card">
  <div className="section-header">
    <h3><i className="icofont-doctor-alt"></i> Available Doctors</h3>
  </div>
  
  <div className="doctors-grid">
    {doctors.slice(0, 6).map((doctor) => (
      <div key={doctor.id} className="doctor-card-small">
        <div className="doctor-card-header-small">
          {doctor.profile_picture_url ? (
            <img 
              src={`http://localhost:8000${doctor.profile_picture_url}`}
              alt={doctor.full_name}
            />
          ) : (
            <div className="doctor-avatar-placeholder">
              <i className="icofont-doctor"></i>
            </div>
          )}
        </div>
        <div className="doctor-card-body">
          <h4>{doctor.full_name}</h4>
          <p className="specialization">
            <i className="icofont-stethoscope-alt"></i>
            {doctor.specialization}
          </p>
          {doctor.is_verified && (
            <span className="verified-badge-small">
              <i className="icofont-check-circled"></i> Verified
            </span>
          )}
        </div>
        <button 
          onClick={() => navigate(`/doctor/${doctor.id}`)}
          className="btn btn-book"
        >
          <i className="icofont-calendar"></i> Book Appointment
        </button>
      </div>
    ))}
  </div>
</div>
```

### Add CSS Styles to PatientDashboard.css

```css
/* Appointments Section */
.section-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.appointment-card {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.appointment-doctor {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.doctor-avatar-small {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.5rem;
}

.doctor-avatar-small img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.doctor-info-small h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #333;
}

.doctor-info-small p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.appointment-details-small {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.appointment-details-small span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #555;
}

.status-badge-small {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  text-transform: capitalize;
}

.status-badge-small.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge-small.confirmed {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge-small.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge-small.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.empty-state-small {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state-small i {
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 1rem;
}

/* Doctors Grid */
.doctors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.doctor-card-small {
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.doctor-card-small:hover {
  border-color: #667eea;
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
}

.doctor-card-header-small {
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.doctor-card-header-small img,
.doctor-avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
}

.doctor-avatar-placeholder {
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
}

.doctor-card-body {
  padding: 1.5rem 1rem;
  text-align: center;
}

.doctor-card-body h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.doctor-card-body .specialization {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.verified-badge-small {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #d4edda;
  color: #155724;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.btn-book {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0 0 13px 13px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-book:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

/* Responsive */
@media (max-width: 768px) {
  .appointment-card {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .appointment-doctor {
    flex-direction: column;
  }
  
  .doctors-grid {
    grid-template-columns: 1fr;
  }
}
```

### Integration with AI Consultation

In `AIConsultation.jsx`, when doctors are recommended:

```jsx
// After doctor recommendations are displayed
const handleBookWithDoctor = (doctorId) => {
  navigate(`/doctor/${doctorId}`);
};

// In your doctor recommendation cards
<button 
  onClick={() => handleBookWithDoctor(doctor.id)}
  className="btn-book-appointment"
>
  <i className="icofont-calendar"></i>
  Book Appointment
</button>
```

This creates a seamless flow from AI consultation → Doctor recommendation → Appointment booking!

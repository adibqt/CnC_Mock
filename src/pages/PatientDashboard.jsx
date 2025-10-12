import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authUtils } from '../services/api';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const result = await userAPI.getProfile();
    if (result.success) {
      setProfile(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    authUtils.logout('patient');
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/profile-update');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <i className="icofont-spinner-alt-2 icofont-spin"></i>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <i className="icofont-warning"></i>
        <p>{error}</p>
        <button onClick={handleLogout} className="btn btn-primary">
          Back to Login
        </button>
      </div>
    );
  }

  const isProfileComplete = profile?.name && profile?.date_of_birth && profile?.blood_group;

  return (
    <div className="patient-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <img src="/img/logo.png" alt="Click & Care" className="logo-img" />
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/user-home')} className="btn btn-home">
              <i className="icofont-home"></i> Home
            </button>
            <button onClick={handleLogout} className="btn btn-logout">
              <i className="icofont-logout"></i> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-container">
        {!isProfileComplete && (
          <div className="alert alert-warning">
            <i className="icofont-warning-alt"></i>
            <div>
              <strong>Complete Your Profile</strong>
              <p>Please complete your profile to get personalized healthcare services.</p>
            </div>
            <button onClick={handleEditProfile} className="btn btn-sm">
              Complete Now
            </button>
          </div>
        )}

        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-card">
            <div className="profile-header-card">
              <div className="profile-avatar">
                {profile?.profile_picture_url ? (
                  <img 
                    src={`http://localhost:8000${profile.profile_picture_url}`} 
                    alt={profile.name || 'Profile'} 
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <i className="icofont-user-alt-4"></i>
                  </div>
                )}
              </div>
              <div className="profile-info-header">
                <h2>{profile?.name || 'Patient User'}</h2>
                <p className="patient-id">ID: #{profile?.id}</p>
                <span className="status-badge active">
                  <i className="icofont-check-circled"></i> Active Account
                </span>
              </div>
              <button onClick={handleEditProfile} className="btn btn-edit">
                <i className="icofont-edit"></i> Edit Profile
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="info-grid">
            <div className="info-card">
              <div className="info-header">
                <i className="icofont-user"></i>
                <h3>Personal Information</h3>
              </div>
              <div className="info-content">
                <div className="info-item">
                  <span className="label">Full Name</span>
                  <span className="value">{profile?.name || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Phone Number</span>
                  <span className="value">{profile?.phone || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Date of Birth</span>
                  <span className="value">
                    {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not provided'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Account Created</span>
                  <span className="value">
                    {new Date(profile?.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="info-card">
              <div className="info-header">
                <i className="icofont-medical-sign"></i>
                <h3>Medical Information</h3>
              </div>
              <div className="info-content">
                <div className="info-item">
                  <span className="label">Blood Group</span>
                  <span className="value blood-group">
                    {profile?.blood_group || 'Not provided'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Height</span>
                  <span className="value">
                    {profile?.height ? `${profile.height} inches` : 'Not provided'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Weight</span>
                  <span className="value">
                    {profile?.weight ? `${profile.weight} kg` : 'Not provided'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">BMI</span>
                  <span className="value">
                    {profile?.height && profile?.weight 
                      ? (profile.weight / Math.pow(profile.height * 0.0254, 2)).toFixed(1)
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="info-card">
              <div className="info-header">
                <i className="icofont-location-pin"></i>
                <h3>Location</h3>
              </div>
              <div className="info-content">
                <div className="info-item">
                  <span className="label">Country</span>
                  <span className="value">{profile?.country || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <span className="label">State/Province</span>
                  <span className="value">{profile?.state || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <span className="label">City</span>
                  <span className="value">{profile?.city || 'Not provided'}</span>
                </div>
                <div className="info-item full-address">
                  <span className="label">Full Address</span>
                  <span className="value">
                    {profile?.city && profile?.state && profile?.country
                      ? `${profile.city}, ${profile.state}, ${profile.country}`
                      : 'Not provided'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button className="action-card">
                <i className="icofont-doctor-alt"></i>
                <span>Book Appointment</span>
              </button>
              <button className="action-card">
                <i className="icofont-prescription"></i>
                <span>View Prescriptions</span>
              </button>
              <button className="action-card">
                <i className="icofont-test-tube-alt"></i>
                <span>Lab Reports</span>
              </button>
              <button className="action-card">
                <i className="icofont-history"></i>
                <span>Medical History</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

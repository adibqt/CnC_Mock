import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import './DoctorProfileUpdate.css';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export default function DoctorProfileUpdate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    bmdc_number: '',
  });

  const [degrees, setDegrees] = useState([{ degree: '', institution: '', year: '' }]);
  const [mbbsCertificate, setMbbsCertificate] = useState(null);
  const [fcpsCertificate, setFcpsCertificate] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [mbbsPreview, setMbbsPreview] = useState('');
  const [fcpsPreview, setFcpsPreview] = useState('');
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [uploadingMbbs, setUploadingMbbs] = useState(false);
  const [uploadingFcps, setUploadingFcps] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  // Load existing profile data
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const result = await doctorAPI.getHomeData();
      if (result.success && result.data.doctor) {
        const doctor = result.data.doctor;
        
        // Set form data
        setFormData({
          name: doctor.name || '',
          bmdc_number: doctor.bmdc_number || '',
        });

        // Set degrees if they exist
        if (doctor.degrees && doctor.degrees.length > 0) {
          setDegrees(doctor.degrees);
        }

        // Set certificate previews if they exist
        if (doctor.mbbs_certificate_url) {
          setMbbsPreview(doctor.mbbs_certificate_url.endsWith('.pdf') ? 'pdf' : doctor.mbbs_certificate_url);
        }
        if (doctor.fcps_certificate_url) {
          setFcpsPreview(doctor.fcps_certificate_url.endsWith('.pdf') ? 'pdf' : doctor.fcps_certificate_url);
        }
        // Set profile picture preview if it exists
        if (doctor.profile_picture_url) {
          setProfilePicturePreview(doctor.profile_picture_url);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleDegreeChange = (index, field, value) => {
    const newDegrees = [...degrees];
    newDegrees[index][field] = value;
    setDegrees(newDegrees);
  };

  const addDegree = () => {
    setDegrees([...degrees, { degree: '', institution: '', year: '' }]);
  };

  const removeDegree = (index) => {
    if (degrees.length > 1) {
      setDegrees(degrees.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'profile') {
      // Validate file size (5MB max for profile pictures)
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture size must be less than 5MB');
        return;
      }

      // Validate file type (only images for profile)
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Only JPEG, PNG, GIF, and WebP images are allowed for profile picture');
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicturePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      // Validate file size (10MB max for certificates)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError('Only PDF, JPEG, and PNG files are allowed');
        return;
      }

      if (type === 'mbbs') {
        setMbbsCertificate(file);
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => setMbbsPreview(reader.result);
          reader.readAsDataURL(file);
        } else {
          setMbbsPreview('pdf');
        }
      } else {
        setFcpsCertificate(file);
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => setFcpsPreview(reader.result);
          reader.readAsDataURL(file);
        } else {
          setFcpsPreview('pdf');
        }
      }
    }
    setError('');
  };

  const removeFile = (type) => {
    if (type === 'mbbs') {
      setMbbsCertificate(null);
      setMbbsPreview(null);
    } else if (type === 'fcps') {
      setFcpsCertificate(null);
      setFcpsPreview(null);
    } else if (type === 'profile') {
      setProfilePicture(null);
      setProfilePicturePreview(null);
    }
  };

  const uploadCertificate = async (type, file) => {
    const result = await doctorAPI.uploadCertificate(type, file);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Upload profile picture first
      if (profilePicture) {
        setUploadingProfilePic(true);
        const result = await doctorAPI.uploadProfilePicture(profilePicture);
        setUploadingProfilePic(false);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // Upload certificates
      if (mbbsCertificate) {
        setUploadingMbbs(true);
        await uploadCertificate('mbbs', mbbsCertificate);
        setUploadingMbbs(false);
      }

      if (fcpsCertificate) {
        setUploadingFcps(true);
        await uploadCertificate('fcps', fcpsCertificate);
        setUploadingFcps(false);
      }

      // Filter out empty degrees
      const validDegrees = degrees.filter(d => d.degree && d.institution);

      // Update profile
      const profileData = {
        ...formData,
        degrees: validDegrees.length > 0 ? validDegrees : undefined,
      };

      const result = await doctorAPI.updateProfile(profileData);

      if (result.success) {
        setSuccess('Profile updated successfully! Redirecting...');
        setTimeout(() => {
          navigate('/doctor-home');
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/doctor-home');
  };

  if (initialLoading) {
    return (
      <div className="doctor-profile-update">
        <div className="profile-container">
          <div style={{textAlign: 'center', padding: '60px 20px'}}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#2563EB',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{color: '#6b7280', fontSize: '16px'}}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-profile-update">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-icon-wrapper">
            <i className="icofont-doctor-alt"></i>
          </div>
          <h1>Update Your Profile</h1>
          <p>Please provide your professional information to get started</p>
        </div>

        {/* Form Card */}
        <div className="profile-form-card">
          {error && (
            <div className="error-message">
              <i className="icofont-warning"></i>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="error-message" style={{background: '#dcfce7', color: '#166534', borderLeftColor: '#16a34a'}}>
              <i className="icofont-check-circled"></i>
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Profile Picture Upload */}
            <div className="form-group">
              <label>
                <i className="icofont-camera"></i>
                Profile Picture
              </label>
              <div className="profile-picture-section">
                <div className="profile-picture-preview">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview.startsWith('http') ? profilePicturePreview : `${API_URL}${profilePicturePreview}`} alt="Profile" className="profile-pic-img" />
                  ) : (
                    <div className="profile-pic-placeholder">
                      <i className="icofont-doctor-alt"></i>
                    </div>
                  )}
                  {uploadingProfilePic && (
                    <div className="uploading-overlay">
                      <i className="icofont-spinner-alt-6 spinner"></i>
                    </div>
                  )}
                </div>
                <div className="profile-picture-actions">
                  <button
                    type="button"
                    onClick={() => document.getElementById('profile-upload').click()}
                    className="upload-profile-btn"
                  >
                    <i className="icofont-upload-alt"></i>
                    {profilePicturePreview ? 'Change Picture' : 'Upload Picture'}
                  </button>
                  {profilePicture && !uploadingProfilePic && (
                    <button
                      type="button"
                      onClick={() => removeFile('profile')}
                      className="remove-profile-btn"
                    >
                      <i className="icofont-close-line"></i>
                      Remove
                    </button>
                  )}
                  <p className="upload-hint">JPEG, PNG, GIF or WebP (Max 5MB)</p>
                </div>
              </div>
              <input
                id="profile-upload"
                type="file"
                className="hidden-input"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={(e) => handleFileChange(e, 'profile')}
              />
            </div>

            {/* Basic Information */}
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <i className="icofont-user-alt-3"></i>
                  Preferred Name
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Dr. Ahmed Khan"
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="icofont-id"></i>
                  BMDC Registration Number
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="bmdc_number"
                  value={formData.bmdc_number}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="A-12345"
                />
              </div>
            </div>

            {/* MBBS Certificate Upload */}
            <div className="form-group">
              <label>
                <i className="icofont-file-document"></i>
                MBBS Certificate
                <span className="required-star">*</span>
              </label>
              <div className={`upload-section ${mbbsCertificate ? 'has-file' : ''}`}
                   onClick={() => !mbbsCertificate && document.getElementById('mbbs-upload').click()}>
                {!mbbsCertificate ? (
                  <>
                    <div className="upload-icon">
                      <i className="icofont-upload-alt"></i>
                    </div>
                    <h3>Upload MBBS Certificate</h3>
                    <p>Drag and drop or click to browse</p>
                    <button type="button" className="upload-button">
                      <i className="icofont-file-pdf"></i>
                      Choose File
                    </button>
                    <p className="upload-hint">PDF, JPEG or PNG (Max 10MB)</p>
                  </>
                ) : (
                  <div className="file-preview">
                    {uploadingMbbs && (
                      <div style={{textAlign: 'center', padding: '20px'}}>
                        <i className="icofont-spinner-alt-6 spinner"></i>
                        <p style={{marginTop: '10px', color: '#64748b'}}>Uploading...</p>
                      </div>
                    )}
                    {!uploadingMbbs && (
                      <>
                        {mbbsPreview === 'pdf' ? (
                          <div className="pdf-indicator">
                            <i className="icofont-file-pdf"></i>
                            <span>PDF Document</span>
                          </div>
                        ) : (
                          <img src={mbbsPreview} alt="MBBS Certificate" className="preview-image" />
                        )}
                        <p className="file-name">{mbbsCertificate.name}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile('mbbs'); }}
                          className="remove-file-btn"
                        >
                          <i className="icofont-close-line"></i> Remove File
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <input
                id="mbbs-upload"
                type="file"
                className="hidden-input"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'mbbs')}
              />
            </div>

            {/* FCPS Certificate Upload */}
            <div className="form-group">
              <label>
                <i className="icofont-file-document"></i>
                FCPS Certificate (Optional)
              </label>
              <div className={`upload-section ${fcpsCertificate ? 'has-file' : ''}`}
                   onClick={() => !fcpsCertificate && document.getElementById('fcps-upload').click()}>
                {!fcpsCertificate ? (
                  <>
                    <div className="upload-icon">
                      <i className="icofont-upload-alt"></i>
                    </div>
                    <h3>Upload FCPS Certificate</h3>
                    <p>Drag and drop or click to browse</p>
                    <button type="button" className="upload-button">
                      <i className="icofont-file-pdf"></i>
                      Choose File
                    </button>
                    <p className="upload-hint">PDF, JPEG or PNG (Max 10MB)</p>
                  </>
                ) : (
                  <div className="file-preview">
                    {uploadingFcps && (
                      <div style={{textAlign: 'center', padding: '20px'}}>
                        <i className="icofont-spinner-alt-6 spinner"></i>
                        <p style={{marginTop: '10px', color: '#64748b'}}>Uploading...</p>
                      </div>
                    )}
                    {!uploadingFcps && (
                      <>
                        {fcpsPreview === 'pdf' ? (
                          <div className="pdf-indicator">
                            <i className="icofont-file-pdf"></i>
                            <span>PDF Document</span>
                          </div>
                        ) : (
                          <img src={fcpsPreview} alt="FCPS Certificate" className="preview-image" />
                        )}
                        <p className="file-name">{fcpsCertificate.name}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile('fcps'); }}
                          className="remove-file-btn"
                        >
                          <i className="icofont-close-line"></i> Remove File
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <input
                id="fcps-upload"
                type="file"
                className="hidden-input"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'fcps')}
              />
            </div>

            {/* Degrees Section */}
            <div className="degrees-section">
              <div className="section-header">
                <h2 className="section-title">
                  <i className="icofont-graduate"></i>
                  Academic Degrees
                </h2>
                <button type="button" onClick={addDegree} className="add-degree-btn">
                  <i className="icofont-plus-circle"></i>
                  Add Degree
                </button>
              </div>

              <div className="degrees-list">
                {degrees.length === 0 ? (
                  <div className="no-degrees">
                    <i className="icofont-graduate"></i>
                    <p>No degrees added yet. Click "Add Degree" to begin.</p>
                  </div>
                ) : (
                  degrees.map((degree, index) => (
                    <div key={index} className="degree-card">
                      <div className="degree-header">
                        <span className="degree-number">
                          <i className="icofont-ui-copy"></i>
                          Degree {index + 1}
                        </span>
                        {degrees.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDegree(index)}
                            className="remove-degree-btn"
                          >
                            <i className="icofont-close-line"></i> Remove
                          </button>
                        )}
                      </div>
                      <div className="degree-inputs">
                        <input
                          type="text"
                          placeholder="Degree (e.g., MBBS)"
                          value={degree.degree}
                          onChange={(e) => handleDegreeChange(index, 'degree', e.target.value)}
                          className="form-input"
                        />
                        <input
                          type="text"
                          placeholder="Institution"
                          value={degree.institution}
                          onChange={(e) => handleDegreeChange(index, 'institution', e.target.value)}
                          className="form-input"
                        />
                        <input
                          type="text"
                          placeholder="Year"
                          value={degree.year}
                          onChange={(e) => handleDegreeChange(index, 'year', e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading || !formData.name || !formData.bmdc_number}
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Saving Profile...
                  </>
                ) : (
                  <>
                    <i className="icofont-save"></i>
                    Save Profile
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="skip-btn"
                disabled={loading}
              >
                <i className="icofont-arrow-right"></i>
                Skip for Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

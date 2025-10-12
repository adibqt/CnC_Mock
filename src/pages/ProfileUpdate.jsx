import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import './ProfileUpdate.css';

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date_of_birth: '',
    blood_group: '',
    height: '',
    weight: '',
    country: '',
    state: '',
    city: '',
  });

  useEffect(() => {
    // Load existing profile data
    const loadProfile = async () => {
      const result = await userAPI.getProfile();
      if (result.success) {
        const profile = result.data;
        setFormData({
          name: profile.name || '',
          phone: profile.phone || '',
          date_of_birth: profile.date_of_birth || '',
          blood_group: profile.blood_group || '',
          height: profile.height || '',
          weight: profile.weight || '',
          country: profile.country || '',
          state: profile.state || '',
          city: profile.city || '',
        });
        if (profile.profile_picture_url) {
          setPreviewImage(`http://localhost:8000${profile.profile_picture_url}`);
        }
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Upload profile picture if selected
      if (selectedFile) {
        const uploadResult = await userAPI.uploadProfilePicture(selectedFile);
        if (!uploadResult.success) {
          setError(uploadResult.error);
          setLoading(false);
          return;
        }
      }

      // Update profile data
      const profileData = {
        name: formData.name || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        blood_group: formData.blood_group || undefined,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        country: formData.country || undefined,
        state: formData.state || undefined,
        city: formData.city || undefined,
      };

      const result = await userAPI.updateProfile(profileData);

      if (result.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          navigate('/patient-dashboard');
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="profile-update-container">
      <div className="profile-update-wrapper">
        <div className="profile-update-header">
          <i className="icofont-user-alt-4"></i>
          <h2>Complete Your Profile</h2>
          <p>Please provide your information for better healthcare</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Profile Picture */}
          <div className="profile-picture-section">
            <div className="profile-picture-preview">
              {previewImage ? (
                <img src={previewImage} alt="Profile Preview" />
              ) : (
                <div className="no-image">
                  <i className="icofont-user-alt-4"></i>
                </div>
              )}
            </div>
            <div className="profile-picture-upload">
              <label htmlFor="profilePicture" className="upload-btn">
                <i className="icofont-camera"></i> Choose Photo
              </label>
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <p className="upload-hint">Max 5MB (JPG, PNG, GIF, WebP)</p>
            </div>
          </div>

          <div className="form-grid">
            {/* Name */}
            <div className="form-group full-width">
              <label htmlFor="name">
                <i className="icofont-user"></i> Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone (Read-only) */}
            <div className="form-group">
              <label htmlFor="phone">
                <i className="icofont-phone"></i> Phone Number
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="form-control"
                value={formData.phone}
                readOnly
                style={{ backgroundColor: '#f0f0f0' }}
              />
            </div>

            {/* Date of Birth */}
            <div className="form-group">
              <label htmlFor="date_of_birth">
                <i className="icofont-birthday-cake"></i> Date of Birth *
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                className="form-control"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
              />
            </div>

            {/* Blood Group */}
            <div className="form-group">
              <label htmlFor="blood_group">
                <i className="icofont-blood-drop"></i> Blood Group *
              </label>
              <select
                id="blood_group"
                name="blood_group"
                className="form-control"
                value={formData.blood_group}
                onChange={handleChange}
                required
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            {/* Height */}
            <div className="form-group">
              <label htmlFor="height">
                <i className="icofont-measuring"></i> Height (inches) *
              </label>
              <input
                type="number"
                id="height"
                name="height"
                className="form-control"
                placeholder="e.g., 68"
                value={formData.height}
                onChange={handleChange}
                min="0"
                max="300"
                required
              />
            </div>

            {/* Weight */}
            <div className="form-group">
              <label htmlFor="weight">
                <i className="icofont-weight"></i> Weight (kg) *
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                className="form-control"
                placeholder="e.g., 70"
                value={formData.weight}
                onChange={handleChange}
                min="0"
                max="500"
                required
              />
            </div>

            {/* Country */}
            <div className="form-group">
              <label htmlFor="country">
                <i className="icofont-globe"></i> Country *
              </label>
              <input
                type="text"
                id="country"
                name="country"
                className="form-control"
                placeholder="Enter your country"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </div>

            {/* State */}
            <div className="form-group">
              <label htmlFor="state">
                <i className="icofont-map-pins"></i> State/Province *
              </label>
              <input
                type="text"
                id="state"
                name="state"
                className="form-control"
                placeholder="Enter your state"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </div>

            {/* City */}
            <div className="form-group">
              <label htmlFor="city">
                <i className="icofont-location-pin"></i> City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="form-control"
                placeholder="Enter your city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="icofont-spinner-alt-2 icofont-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="icofont-check"></i> Save Profile
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/patient-dashboard')}
              disabled={loading}
            >
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileUpdate;

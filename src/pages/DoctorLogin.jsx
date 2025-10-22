import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../components/Login.css';
import { doctorAPI, authUtils } from '../services/api';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    specialization: '',
    licenseNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [specializations, setSpecializations] = useState([]);
  const [loadingSpecializations, setLoadingSpecializations] = useState(true);

  // Check if doctor is already logged in
  useEffect(() => {
    if (authUtils.isAuthenticated('doctor')) {
      navigate('/doctor-home');
    }
  }, [navigate]);

  // Fetch specializations from API
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await fetch(`${API_URL}/api/doctors/specializations`);
        const data = await response.json();
        setSpecializations(data);
      } catch (error) {
        console.error('Error fetching specializations:', error);
        // Fallback to default options if API fails
        setSpecializations([
          { id: 1, name: 'General Medicine', is_active: true },
          { id: 2, name: 'Cardiology', is_active: true },
          { id: 3, name: 'Dermatology', is_active: true },
        ]);
      } finally {
        setLoadingSpecializations(false);
      }
    };

    if (isSignup) {
      fetchSpecializations();
    }
  }, [isSignup]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 72) {
      newErrors.password = 'Password cannot be longer than 72 characters';
    }

    // Signup-specific validations
    if (isSignup) {
      // Full Name validation
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required';
      }

      // Specialization validation
      if (!formData.specialization) {
        newErrors.specialization = 'Specialization is required';
      }

      // License Number validation
      if (!formData.licenseNumber) {
        newErrors.licenseNumber = 'Medical license number is required';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        let result;
        if (isSignup) {
          result = await doctorAPI.signup({
            phone: formData.phone,
            password: formData.password,
            full_name: formData.fullName,
            specialization: formData.specialization,
            license_number: formData.licenseNumber
          });
        } else {
          result = await doctorAPI.login({
            phone: formData.phone,
            password: formData.password
          });
        }

        if (result.success) {
          if (isSignup) {
            alert('Registration successful! Your account will be verified by our team. You can now login.');
            toggleMode();
          } else {
            // Check if profile is complete
            const profileResult = await doctorAPI.getHomeData();
            if (profileResult.success) {
              const doctor = profileResult.data.doctor;
              // Check if name and BMDC number are filled
              if (doctor.name && doctor.bmdc_number) {
                // Profile complete, go to doctor home
                window.location.href = '/doctor-home';
              } else {
                // Profile incomplete, go to profile update
                window.location.href = '/doctor-profile-update';
              }
            } else {
              // If can't fetch profile, assume incomplete
              window.location.href = '/doctor-profile-update';
            }
          }
        } else {
          alert(result.error);
        }
      } catch (error) {
        alert('An unexpected error occurred. Please try again.');
        console.error('Error:', error);
      }
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Connect to Google OAuth API
    console.log('Google signup clicked for doctor');
    alert('Google signup for doctors will be integrated with API');
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setFormData({
      phone: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      specialization: '',
      licenseNumber: ''
    });
    setErrors({});
  };

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs overlay" style={{ background: 'linear-gradient(135deg, #2C2D3F 0%, #1A76D1 100%)' }}>
        <div className="container">
          <div className="bread-inner">
            <div className="row">
              <div className="col-12">
                <h2>Doctor {isSignup ? 'Registration' : 'Login'}</h2>
                <ul className="bread-list">
                  <li><Link to="/">Home</Link></li>
                  <li><i className="icofont-simple-right"></i></li>
                  <li className="active">Doctor {isSignup ? 'Sign Up' : 'Login'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Breadcrumbs */}

      {/* Login Section */}
      <section className="login-section section">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 offset-lg-3 col-md-8 offset-md-2 col-12">
              <div className="login-form-container" style={{ borderTop: '4px solid #2C2D3F' }}>
                <div className="login-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                    <i className="icofont-doctor" style={{ fontSize: '48px', color: '#2C2D3F' }}></i>
                  </div>
                  <h3>{isSignup ? 'Doctor Registration' : 'Doctor Portal'}</h3>
                  <p>
                    {isSignup 
                      ? 'Join our network of healthcare professionals' 
                      : 'Access your doctor dashboard and patient appointments'}
                  </p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                  {/* Full Name (Signup only) */}
                  {isSignup && (
                    <div className="form-group">
                      <label htmlFor="fullName">
                        <i className="icofont-user-alt-4"></i> Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className={`form-control ${errors.fullName ? 'error' : ''}`}
                        placeholder="Dr. John Doe"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                      {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                    </div>
                  )}

                  {/* Specialization (Signup only) */}
                  {isSignup && (
                    <div className="form-group">
                      <label htmlFor="specialization">
                        <i className="icofont-stethoscope-alt"></i> Specialization
                      </label>
                      <select
                        id="specialization"
                        name="specialization"
                        className={`form-control ignore ${errors.specialization ? 'error' : ''}`}
                        value={formData.specialization}
                        onChange={handleChange}
                        autoComplete="off"
                        data-native="true"
                        disabled={loadingSpecializations}
                        style={{
                          color: '#2c2d3f',
                          WebkitTextSecurity: 'none',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '14px',
                          letterSpacing: 'normal',
                          textTransform: 'none',
                          fontStyle: 'normal',
                          fontWeight: 'normal',
                          lineHeight: 'normal',
                          paddingTop: '14px',
                          paddingBottom: '14px',
                          height: '50px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <option value="" disabled style={{ color: '#999', fontSize: '14px' }}>
                          {loadingSpecializations ? 'Loading specializations...' : 'Select your specialization'}
                        </option>
                        {specializations.map((spec) => (
                          <option 
                            key={spec.id} 
                            value={spec.name} 
                            style={{ color: '#2c2d3f', fontSize: '14px' }}
                          >
                            {spec.name}
                          </option>
                        ))}
                      </select>
                      {errors.specialization && <span className="error-message">{errors.specialization}</span>}
                    </div>
                  )}

                  {/* License Number (Signup only) */}
                  {isSignup && (
                    <div className="form-group">
                      <label htmlFor="licenseNumber">
                        <i className="icofont-certificate"></i> Medical License Number
                      </label>
                      <input
                        type="text"
                        id="licenseNumber"
                        name="licenseNumber"
                        className={`form-control ${errors.licenseNumber ? 'error' : ''}`}
                        placeholder="Enter your medical license number"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                      />
                      {errors.licenseNumber && <span className="error-message">{errors.licenseNumber}</span>}
                    </div>
                  )}

                  {/* Phone Number Input */}
                  <div className="form-group">
                    <label htmlFor="phone">
                      <i className="icofont-phone"></i> Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className={`form-control ${errors.phone ? 'error' : ''}`}
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>

                  {/* Password Input */}
                  <div className="form-group">
                    <label htmlFor="password">
                      <i className="icofont-lock"></i> Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className={`form-control ${errors.password ? 'error' : ''}`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      maxLength={72}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                  </div>

                  {/* Confirm Password Input (Only for Signup) */}
                  {isSignup && (
                    <div className="form-group">
                      <label htmlFor="confirmPassword">
                        <i className="icofont-lock"></i> Confirm Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        maxLength={72}
                      />
                      {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                  )}

                  {/* Forgot Password (Only for Login) */}
                  {!isSignup && (
                    <div className="forgot-password">
                      <a href="#" onClick={(e) => { e.preventDefault(); alert('Password reset feature coming soon!'); }}>
                        Forgot Password?
                      </a>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="form-group">
                    <button type="submit" className="btn btn-primary btn-block" style={{ background: '#2C2D3F' }}>
                      {isSignup ? 'Register as Doctor' : 'Login to Dashboard'}
                    </button>
                  </div>

                  {/* Divider */}
                  {isSignup && (
                    <>
                      <div className="divider">
                        <span>OR</span>
                      </div>

                      {/* Google Signup Button */}
                      <div className="form-group">
                        <button 
                          type="button" 
                          className="btn btn-google btn-block"
                          onClick={handleGoogleSignup}
                        >
                          <img src="/img/googleLogo.png" alt="Google" className="google-logo" /> Sign up with Google
                        </button>
                      </div>
                    </>
                  )}

                  {/* Toggle between Login/Signup */}
                  <div className="form-footer">
                    <p>
                      {isSignup ? 'Already registered as a doctor? ' : "Don't have a doctor account? "}
                      <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>
                        {isSignup ? 'Login here' : 'Register here'}
                      </a>
                    </p>
                  </div>
                </form>

                {/* Features (Only for Signup) */}
                {isSignup && (
                  <div className="login-features">
                    <div className="feature-item">
                      <i className="icofont-check-circled"></i>
                      <span>Manage your appointments</span>
                    </div>
                    <div className="feature-item">
                      <i className="icofont-check-circled"></i>
                      <span>Access patient records securely</span>
                    </div>
                    <div className="feature-item">
                      <i className="icofont-check-circled"></i>
                      <span>Set your availability & schedule</span>
                    </div>
                  </div>
                )}

                {/* Patient Login Link */}
                <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Are you a patient? <Link to="/login" style={{ color: '#1A76D1', fontWeight: '600' }}>Login here</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Login Section */}
    </>
  );
};

export default DoctorLogin;

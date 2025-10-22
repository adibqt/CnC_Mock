import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../components/Login.css';
import { authUtils } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ClinicLogin = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    clinicName: '',
    contactPerson: '',
    licenseNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Bangladesh',
    email: '',
    alternatePhone: ''
  });
  const [errors, setErrors] = useState({});

  // Check if clinic is already logged in
  useEffect(() => {
    if (authUtils.isAuthenticated('clinic')) {
      navigate('/clinic-home');
    }
  }, [navigate]);

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
      // Clinic Name validation
      if (!formData.clinicName) {
        newErrors.clinicName = 'Clinic name is required';
      }

      // Contact Person validation
      if (!formData.contactPerson) {
        newErrors.contactPerson = 'Contact person name is required';
      }

      // License Number validation
      if (!formData.licenseNumber) {
        newErrors.licenseNumber = 'Clinic license number is required';
      }

      // Address validations
      if (!formData.streetAddress) {
        newErrors.streetAddress = 'Street address is required';
      }

      if (!formData.city) {
        newErrors.city = 'City is required';
      }

      if (!formData.state) {
        newErrors.state = 'State/Division is required';
      }

      if (!formData.postalCode) {
        newErrors.postalCode = 'Postal code is required';
      }

      // Email validation (optional but must be valid if provided)
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
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
    
    if (!validateForm()) {
      return;
    }

    if (isSignup) {
      // Signup logic
      try {
        const response = await fetch(`${API_URL}/api/clinic/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
            clinic_name: formData.clinicName,
            contact_person: formData.contactPerson,
            license_number: formData.licenseNumber,
            address: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode,
            email: formData.email || null
          }),
        });

        const result = await response.json();

        if (response.ok) {
          alert(result.message || 'Registration successful! Please wait for admin verification before logging in.');
          // Switch to login mode
          setIsSignup(false);
          setFormData({
            phone: formData.phone,
            password: '',
            confirmPassword: '',
            clinicName: '',
            contactPerson: '',
            licenseNumber: '',
            streetAddress: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Bangladesh',
            email: '',
            alternatePhone: ''
          });
        } else {
          alert(result.detail || 'Registration failed. Please try again.');
        }
      } catch (error) {
        alert('An unexpected error occurred. Please try again.');
        console.error('Error:', error);
      }
    } else {
      // Login logic
      try {
        const response = await fetch(`${API_URL}/api/clinic/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          // Store token and user data
          localStorage.setItem('clinic_accessToken', result.access_token);
          localStorage.setItem('clinic_userData', JSON.stringify(result.user_data));
          
          // Navigate to clinic dashboard
          navigate('/clinic-dashboard');
        } else {
          alert(result.detail || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        alert('An unexpected error occurred. Please try again.');
        console.error('Error:', error);
      }
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setFormData({
      phone: '',
      password: '',
      confirmPassword: '',
      clinicName: '',
      contactPerson: '',
      licenseNumber: '',
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Bangladesh',
      email: '',
      alternatePhone: ''
    });
    setErrors({});
  };

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs overlay" style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #0e6ba8 100%)' }}>
        <div className="container">
          <div className="bread-inner">
            <div className="row">
              <div className="col-12">
                <h2>Clinic {isSignup ? 'Registration' : 'Login'}</h2>
                <ul className="bread-list">
                  <li><Link to="/">Home</Link></li>
                  <li><i className="icofont-simple-right"></i></li>
                  <li className="active">Clinic {isSignup ? 'Sign Up' : 'Login'}</li>
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
            <div className="col-lg-8 offset-lg-2 col-md-10 offset-md-1 col-12">
              <div className="login-form-container" style={{ borderTop: '4px solid #17a2b8' }}>
                <div className="login-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                    <i className="icofont-laboratory" style={{ fontSize: '48px', color: '#17a2b8' }}></i>
                  </div>
                  <h3>{isSignup ? 'Clinic Registration' : 'Clinic Portal'}</h3>
                  <p>
                    {isSignup 
                      ? 'Join our network and start providing lab test quotations and reports to patients' 
                      : 'Access your clinic dashboard and manage lab test requests'}
                  </p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                  {/* Clinic Name (Signup only) */}
                  {isSignup && (
                    <div className="form-group">
                      <label htmlFor="clinicName">
                        <i className="icofont-building"></i> Clinic Name <span style={{color: 'red'}}>*</span>
                      </label>
                      <input
                        type="text"
                        id="clinicName"
                        name="clinicName"
                        className={`form-control ${errors.clinicName ? 'error' : ''}`}
                        placeholder="ABC Diagnostic Center"
                        value={formData.clinicName}
                        onChange={handleChange}
                      />
                      {errors.clinicName && <span className="error-message">{errors.clinicName}</span>}
                    </div>
                  )}

                  {/* Contact Person (Signup only) */}
                  {isSignup && (
                    <div className="form-group">
                      <label htmlFor="contactPerson">
                        <i className="icofont-user-alt-4"></i> Contact Person Name <span style={{color: 'red'}}>*</span>
                      </label>
                      <input
                        type="text"
                        id="contactPerson"
                        name="contactPerson"
                        className={`form-control ${errors.contactPerson ? 'error' : ''}`}
                        placeholder="John Doe"
                        value={formData.contactPerson}
                        onChange={handleChange}
                      />
                      {errors.contactPerson && <span className="error-message">{errors.contactPerson}</span>}
                    </div>
                  )}

                  {/* License Number (Signup only) */}
                  {isSignup && (
                    <div className="form-group">
                      <label htmlFor="licenseNumber">
                        <i className="icofont-id-card"></i> Clinic License Number <span style={{color: 'red'}}>*</span>
                      </label>
                      <input
                        type="text"
                        id="licenseNumber"
                        name="licenseNumber"
                        className={`form-control ${errors.licenseNumber ? 'error' : ''}`}
                        placeholder="CL-12345"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                      />
                      {errors.licenseNumber && <span className="error-message">{errors.licenseNumber}</span>}
                    </div>
                  )}

                  {/* Address Section (Signup only) */}
                  {isSignup && (
                    <>
                      <div style={{ marginTop: '25px', marginBottom: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', marginBottom: '15px' }}>
                          <i className="icofont-location-pin"></i> Clinic Address
                        </h4>
                      </div>

                      <div className="form-group">
                        <label htmlFor="streetAddress">
                          Street Address <span style={{color: 'red'}}>*</span>
                        </label>
                        <input
                          type="text"
                          id="streetAddress"
                          name="streetAddress"
                          className={`form-control ${errors.streetAddress ? 'error' : ''}`}
                          placeholder="123 Main Street"
                          value={formData.streetAddress}
                          onChange={handleChange}
                        />
                        {errors.streetAddress && <span className="error-message">{errors.streetAddress}</span>}
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="city">
                              City <span style={{color: 'red'}}>*</span>
                            </label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              className={`form-control ${errors.city ? 'error' : ''}`}
                              placeholder="Dhaka"
                              value={formData.city}
                              onChange={handleChange}
                            />
                            {errors.city && <span className="error-message">{errors.city}</span>}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="state">
                              State/Division <span style={{color: 'red'}}>*</span>
                            </label>
                            <input
                              type="text"
                              id="state"
                              name="state"
                              className={`form-control ${errors.state ? 'error' : ''}`}
                              placeholder="Dhaka Division"
                              value={formData.state}
                              onChange={handleChange}
                            />
                            {errors.state && <span className="error-message">{errors.state}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="postalCode">
                              Postal Code <span style={{color: 'red'}}>*</span>
                            </label>
                            <input
                              type="text"
                              id="postalCode"
                              name="postalCode"
                              className={`form-control ${errors.postalCode ? 'error' : ''}`}
                              placeholder="1200"
                              value={formData.postalCode}
                              onChange={handleChange}
                            />
                            {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="country">Country</label>
                            <input
                              type="text"
                              id="country"
                              name="country"
                              className="form-control"
                              value={formData.country}
                              onChange={handleChange}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '25px', marginBottom: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', marginBottom: '15px' }}>
                          <i className="icofont-phone"></i> Contact Information
                        </h4>
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">
                          <i className="icofont-email"></i> Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className={`form-control ${errors.email ? 'error' : ''}`}
                          placeholder="clinic@example.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="alternatePhone">
                          <i className="icofont-phone"></i> Alternate Phone
                        </label>
                        <input
                          type="tel"
                          id="alternatePhone"
                          name="alternatePhone"
                          className="form-control"
                          placeholder="+880 1234567890"
                          value={formData.alternatePhone}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {/* Phone Number */}
                  <div className="form-group">
                    <label htmlFor="phone">
                      <i className="icofont-phone"></i> Primary Phone Number <span style={{color: 'red'}}>*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className={`form-control ${errors.phone ? 'error' : ''}`}
                      placeholder="+880 1234567890"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label htmlFor="password">
                      <i className="icofont-lock"></i> Password <span style={{color: 'red'}}>*</span>
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

                  {/* Confirm Password (Signup only) */}
                  {isSignup && (
                    <div className="form-group">
                      <label htmlFor="confirmPassword">
                        <i className="icofont-lock"></i> Confirm Password <span style={{color: 'red'}}>*</span>
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
                    <button type="submit" className="btn btn-primary btn-block" style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #0e6ba8 100%)', border: 'none' }}>
                      {isSignup ? 'Register Clinic' : 'Login to Dashboard'}
                    </button>
                  </div>

                  {/* Toggle between Login/Signup */}
                  <div className="form-footer">
                    <p>
                      {isSignup ? 'Already registered? ' : "Don't have a clinic account? "}
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
                      <i className="icofont-check-circled" style={{color: '#17a2b8'}}></i>
                      <span style={{color: '#17a2b8'}}>Receive lab test quotation requests from patients</span>
                    </div>
                    <div className="feature-item">
                      <i className="icofont-check-circled" style={{color: '#17a2b8'}}></i>
                      <span style={{color: '#17a2b8'}}>Submit competitive quotations with itemized pricing</span>
                    </div>
                    <div className="feature-item">
                      <i className="icofont-check-circled" style={{color: '#17a2b8'}}></i>
                      <span style={{color: '#17a2b8'}}>Upload and manage lab reports with results</span>
                    </div>
                    <div className="feature-item">
                      <i className="icofont-check-circled" style={{color: '#17a2b8'}}></i>
                      <span style={{color: '#17a2b8'}}>Manage your clinic profile and credentials</span>
                    </div>
                    <div className="feature-item">
                      <i className="icofont-info-circle" style={{color: '#ed8936'}}></i>
                      <span style={{color: '#ed8936', fontWeight: '500'}}>Account will be verified by admin before activation</span>
                    </div>
                  </div>
                )}

                {/* Patient/Doctor/Pharmacy Login Links */}
                <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Are you a patient? <Link to="/login" style={{ color: '#17a2b8', fontWeight: '600' }}>Login here</Link>
                    {' | '}
                    Are you a doctor? <Link to="/doctor-login" style={{ color: '#17a2b8', fontWeight: '600' }}>Login here</Link>
                    {' | '}
                    Are you a pharmacy? <Link to="/pharmacy-login" style={{ color: '#17a2b8', fontWeight: '600' }}>Login here</Link>
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

export default ClinicLogin;

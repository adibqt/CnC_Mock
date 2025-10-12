import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../components/Login.css';
import { userAPI } from '../services/api';

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

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
    
    // Phone validation (basic)
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

    // Confirm password validation (only for signup)
    if (isSignup) {
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
          result = await userAPI.signup({
            phone: formData.phone,
            password: formData.password
          });
        } else {
          result = await userAPI.login({
            phone: formData.phone,
            password: formData.password
          });
        }

        if (result.success) {
          if (isSignup) {
            alert('Signup successful! You can now login.');
            // Switch to login mode after successful signup
            toggleMode();
          } else {
            // After login, check if profile is complete
            const profileResult = await userAPI.getProfile();
            if (profileResult.success) {
              const profile = profileResult.data;
              // Check if essential profile fields are filled
              const isProfileComplete = profile.name && profile.date_of_birth && profile.blood_group;
              
              if (isProfileComplete) {
                // Redirect to new user home page if profile is complete
                window.location.href = '/user-home';
              } else {
                // Redirect to profile update if profile is incomplete
                window.location.href = '/profile-update';
              }
            } else {
              // If can't fetch profile, redirect to profile update as safe default
              window.location.href = '/profile-update';
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
    console.log('Google signup clicked');
    alert('Google signup will be integrated with API');
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setFormData({
      phone: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs overlay">
        <div className="container">
          <div className="bread-inner">
            <div className="row">
              <div className="col-12">
                <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
                <ul className="bread-list">
                  <li><Link to="/">Home</Link></li>
                  <li><i className="icofont-simple-right"></i></li>
                  <li className="active">{isSignup ? 'Sign Up' : 'Login'}</li>
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
              <div className="login-form-container">
                <div className="login-header">
                  <h3>{isSignup ? 'Create Account' : 'Welcome Back'}</h3>
                  <p>
                    {isSignup 
                      ? 'Join us to access all our medical services' 
                      : 'Sign in to book appointments and manage your health'}
                  </p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
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
                        maxLength={72}
                        onChange={handleChange}
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
                    <button type="submit" className="btn btn-primary btn-block">
                      {isSignup ? 'Create Account' : 'Login'}
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
                      {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                      <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>
                        {isSignup ? 'Login here' : 'Sign up here'}
                      </a>
                    </p>
                  </div>
                </form>

                {/* Features (Only for Signup) */}
                {isSignup && (
                  <div className="login-features">
                    <div className="feature-item">
                      <i className="icofont-check-circled"></i>
                      <span>Book appointments easily</span>
                    </div>
                    <div className="feature-item">
                      <i className="icofont-check-circled"></i>
                      <span>Access medical records</span>
                    </div>
                    <div className="feature-item">
                      <i className="icofont-check-circled"></i>
                      <span>Get health tips & updates</span>
                    </div>
                  </div>
                )}

                {/* Doctor Login Link */}
                <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Are you a doctor? <Link to="/doctor-login" style={{ color: '#2C2D3F', fontWeight: '600' }}>Login here</Link>
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

export default Login;

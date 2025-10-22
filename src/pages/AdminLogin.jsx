import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

// Use environment variable for API URL (works with Vercel deployment)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store admin token and data
        localStorage.setItem('admin_accessToken', data.access_token);
        localStorage.setItem('admin_accessToken_timestamp', Date.now().toString());
        localStorage.setItem('admin_userData', JSON.stringify(data.admin_data));
        localStorage.setItem('admin_userType', 'admin');
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-background">
        <div className="admin-login-shape shape-1"></div>
        <div className="admin-login-shape shape-2"></div>
        <div className="admin-login-shape shape-3"></div>
      </div>

      <div className="admin-login-content">
        <div className="admin-login-card">
          {/* Logo Section */}
          <div className="admin-login-header">
            <div className="admin-logo-wrapper">
              <img src="/img/logo.png" alt="Click & Care" className="admin-logo" />
            </div>
            <h1>Click & Care</h1>
            <h2>Admin Portal</h2>
            <p>Manage your healthcare platform</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="admin-login-form">
            {error && (
              <div className="admin-error-message">
                <i className="icofont-warning"></i>
                {error}
              </div>
            )}

            <div className="admin-form-group">
              <label htmlFor="username">
                <i className="icofont-user-alt-3"></i>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="password">
                <i className="icofont-lock"></i>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              className="admin-login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="icofont-spinner icofont-spin"></i>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="icofont-sign-in"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="admin-login-footer">
            <p>
              <i className="icofont-info-circle"></i>
              Authorized personnel only
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="back-to-home-btn"
            >
              <i className="icofont-home"></i>
              Back to Home
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="admin-info-panel">
          <div className="info-content">
            <div className="info-icon">
              <i className="icofont-shield"></i>
            </div>
            <h3>Secure Admin Access</h3>
           
            
            <div className="info-features">
              <div className="feature-item">
                <i className="icofont-check-circled"></i>
                <span>User Management</span>
              </div>
              <div className="feature-item">
                <i className="icofont-check-circled"></i>
                <span>Doctor Verification</span>
              </div>
              <div className="feature-item">
                <i className="icofont-check-circled"></i>
                <span>Content Management</span>
              </div>
              <div className="feature-item">
                <i className="icofont-check-circled"></i>
                <span>Analytics & Reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

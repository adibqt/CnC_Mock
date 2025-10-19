import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar({ stats, collapsed, onToggle, onTabChange, mobileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('admin_userData');
    if (userData) {
      setAdminData(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('admin_accessToken_timestamp');
    localStorage.removeItem('admin_userData');
    localStorage.removeItem('admin_userType');
    navigate('/admin');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path, tab = null) => {
    if (path === '/admin/dashboard' && tab) {
      // For dashboard tabs, navigate to dashboard and change tab
      navigate('/admin/dashboard');
      if (onTabChange) {
        onTabChange(tab);
      }
    } else {
      // For separate pages, just navigate
      navigate(path);
    }
    // Close mobile sidebar after navigation
    if (window.innerWidth <= 1024 && onToggle) {
      onToggle();
    }
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="admin-sidebar-header">
        <div className="admin-brand">
          <img src="/img/logo.png" alt="Click & Care" className="admin-brand-logo" />
          <div className="admin-brand-text">
            <h3>Click & Care</h3>
            <span>Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
            onClick={() => handleNavigation('/admin/dashboard', 'overview')}
            title="Overview"
          >
            <i className="icofont-dashboard"></i>
            <span>Overview</span>
          </button>
          
          <button
            className={`admin-nav-item ${isActive('/admin/patients') ? 'active' : ''}`}
            onClick={() => navigate('/admin/patients')}
            title="Patients"
          >
            <i className="icofont-users-alt-3"></i>
            <span>Patients</span>
          </button>
          
          <button
            className={`admin-nav-item ${isActive('/admin/doctors') ? 'active' : ''}`}
            onClick={() => navigate('/admin/doctors')}
            title="Doctors"
          >
            <i className="icofont-doctor-alt"></i>
            <span>Doctors</span>
            {stats?.pending?.unverified_doctors > 0 && (
              <span className="badge-count">{stats.pending.unverified_doctors}</span>
            )}
          </button>
          
          <button
            className={`admin-nav-item ${isActive('/admin/dashboard') && location.hash === '#pharmacies' ? 'active' : ''}`}
            onClick={() => handleNavigation('/admin/dashboard', 'pharmacies')}
            title="Pharmacies"
          >
            <i className="icofont-pills"></i>
            <span>Pharmacies</span>
            {stats?.pending?.pending_pharmacy_verification > 0 && (
              <span className="badge-count">{stats.pending.pending_pharmacy_verification}</span>
            )}
          </button>
          
          <button
            className={`admin-nav-item ${isActive('/admin/dashboard') && location.hash === '#specializations' ? 'active' : ''}`}
            onClick={() => handleNavigation('/admin/dashboard', 'specializations')}
            title="Specializations"
          >
            <i className="icofont-stethoscope-alt"></i>
            <span>Specializations</span>
          </button>
          
          <button
            className={`admin-nav-item ${isActive('/admin/dashboard') && location.hash === '#symptoms' ? 'active' : ''}`}
            onClick={() => handleNavigation('/admin/dashboard', 'symptoms')}
            title="Symptoms"
          >
            <i className="icofont-prescription"></i>
            <span>Symptoms</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              <i className="icofont-user-alt-1"></i>
            </div>
            <div className="admin-user-details">
              <p className="admin-user-name">{adminData?.full_name || 'Admin'}</p>
              <p className="admin-user-role">{adminData?.role || 'admin'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn" title="Logout">
            <i className="icofont-logout"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
  );
}

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  
  // Function to check if current path matches the link
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      {/* Topbar */}
      <div className="topbar">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-5 col-12">
              {/* Contact */}
              <ul className="top-link">
                <li><a href="#"><i className="fa fa-phone"></i>+880 1234 56789</a></li>
                <li><a href="#"><i className="fa fa-envelope"></i>support@yourmail.com</a></li>
              </ul>
              {/* End Contact */}
            </div>
            <div className="col-lg-6 col-md-7 col-12">
              {/* Top Contact */}
              <ul className="top-contact">
                <li><i className="fa fa-phone"></i>Emergency Contact</li>
                <li><i className="fa fa-clock-o"></i>Mon - Sat: 8am - 5pm</li>
              </ul>
              {/* End Top Contact */}
            </div>
          </div>
        </div>
      </div>
      {/* End Topbar */}
      
      {/* Header Inner */}
      <div className="header-inner">
        <div className="container">
          <div className="inner">
            <div className="row">
              <div className="col-lg-2 col-md-3 col-12">
                {/* Start Logo */}
                <div className="logo">
                  <Link to="/">
                    <img 
                      src="/img/logo.png" 
                      alt="Click & Care" 
                      style={{ maxHeight: '50px', width: 'auto' }}
                    />
                  </Link>
                </div>
                {/* End Logo */}
                {/* Mobile Nav */}
                <div className="mobile-nav"></div>
                {/* End Mobile Nav */}
              </div>
              <div className="col-lg-6 col-md-9 col-12">
                {/* Main Menu */}
                <div className="main-menu">
                  <nav className="navigation">
                    <ul className="nav menu">
                      <li className={isActive('/')}><Link to="/">Home</Link></li>
                      <li className={isActive('/doctors')}><Link to="/doctors">Doctors</Link></li>
                      <li className={isActive('/services')}><Link to="/services">Services</Link></li>
                      
                      <li className={isActive('/contact')}><Link to="/contact">Contact Us</Link></li>
                    </ul>
                  </nav>
                </div>
                {/*/ End Main Menu */}
              </div>
              <div className="col-lg-4 col-12">
                <div className="get-quote">
                  <div className="login-buttons">
                    <Link to="/login" className="btn btn-user">
                      <i className="icofont-user-alt-4"></i>
                      <span className="btn-text">Patient</span>
                    </Link>
                    <Link to="/doctor-login" className="btn btn-doctor">
                      <i className="icofont-doctor"></i>
                      <span className="btn-text">Doctor</span>
                    </Link>
                    <Link to="/pharmacy-login" className="btn btn-pharmacy">
                      <i className="icofont-pills"></i>
                      <span className="btn-text">Pharmacy</span>
                    </Link>
                    <Link to="/clinic-login" className="btn btn-clinic">
                      <i className="icofont-hospital"></i>
                      <span className="btn-text">Clinic</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*/ End Header Inner */}
    </header>
  );
};

export default Header;

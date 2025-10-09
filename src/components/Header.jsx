import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
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
              <div className="col-lg-3 col-md-3 col-12">
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
              <div className="col-lg-7 col-md-9 col-12">
                {/* Main Menu */}
                <div className="main-menu">
                  <nav className="navigation">
                    <ul className="nav menu">
                      <li className="active"><Link to="/">Home</Link></li>
                      <li><Link to="/doctors">Doctors</Link></li>
                      <li><Link to="/services">Services</Link></li>
                      <li><Link to="/blog">Blog</Link></li>
                      <li><Link to="/contact">Contact Us</Link></li>
                    </ul>
                  </nav>
                </div>
                {/*/ End Main Menu */}
              </div>
              <div className="col-lg-2 col-12">
                <div className="get-quote">
                  <Link to="/appointment" className="btn">Book Appointment</Link>
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

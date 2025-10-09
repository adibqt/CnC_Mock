import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer id="footer" className="footer">
      {/* Footer Top */}
      <div className="footer-top">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-6 col-12">
              <div className="single-footer">
                <h2>About Us</h2>
                <p>Lorem ipsum dolor sit am consectetur adipisicing elit do eiusmod tempor incididunt ut labore dolore magna.</p>
                {/* Social */}
                <ul className="social">
                  <li><a href="#"><i className="icofont-facebook"></i></a></li>
                  <li><a href="#"><i className="icofont-google-plus"></i></a></li>
                  <li><a href="#"><i className="icofont-twitter"></i></a></li>
                  <li><a href="#"><i className="icofont-vimeo"></i></a></li>
                  <li><a href="#"><i className="icofont-pinterest"></i></a></li>
                </ul>
                {/* End Social */}
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="single-footer f-link">
                <h2>Quick Links</h2>
                <div className="row">
                  <div className="col-lg-6 col-md-6 col-12">
                    <ul>
                      <li><Link to="/"><i className="fa fa-caret-right" aria-hidden="true"></i>Home</Link></li>
                      <li><Link to="/about"><i className="fa fa-caret-right" aria-hidden="true"></i>About Us</Link></li>
                      <li><Link to="/services"><i className="fa fa-caret-right" aria-hidden="true"></i>Services</Link></li>
                      <li><Link to="/cases"><i className="fa fa-caret-right" aria-hidden="true"></i>Our Cases</Link></li>
                      <li><Link to="/other"><i className="fa fa-caret-right" aria-hidden="true"></i>Other Links</Link></li>
                    </ul>
                  </div>
                  <div className="col-lg-6 col-md-6 col-12">
                    <ul>
                      <li><Link to="/consultation"><i className="fa fa-caret-right" aria-hidden="true"></i>Consuling</Link></li>
                      <li><Link to="/finance"><i className="fa fa-caret-right" aria-hidden="true"></i>Finance</Link></li>
                      <li><Link to="/testimonials"><i className="fa fa-caret-right" aria-hidden="true"></i>Testimonials</Link></li>
                      <li><Link to="/faq"><i className="fa fa-caret-right" aria-hidden="true"></i>FAQ</Link></li>
                      <li><Link to="/contact"><i className="fa fa-caret-right" aria-hidden="true"></i>Contact Us</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="single-footer">
                <h2>Open Hours</h2>
                <p>Lorem ipsum dolor sit ame consectetur adipisicing elit do eiusmod tempor incididunt.</p>
                <ul className="time-sidual">
                  <li className="day">Monday - Friday <span>8.00-20.00</span></li>
                  <li className="day">Saturday <span>9.00-18.30</span></li>
                  <li className="day">Sunday <span>9.00-15.00</span></li>
                </ul>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="single-footer">
                <h2>Newsletter</h2>
                <p>Subscribe to our newsletter to get all our news in your inbox.</p>
                <form action="mail/mail.php" method="get" className="newsletter-inner">
                  <input name="email" placeholder="Email Address" className="common-input" type="email" required />
                  <button className="button"><i className="icofont icofont-paper-plane"></i></button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*/ End Footer Top */}
      
      {/* Copyright */}
      <div className="copyright">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 col-12">
              <div className="copyright-content">
                <p>© Copyright 2024 | All Rights Reserved by <a href="https://www.wpthemesgrid.com" target="_blank" rel="noopener noreferrer">wpthemesgrid.com</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*/ End Copyright */}
    </footer>
  );
};

export default Footer;

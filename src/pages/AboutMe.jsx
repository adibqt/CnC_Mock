import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adibImage from '../adib.jpg';
import './AboutMe.css';

export default function AboutMe() {
  const [displayText, setDisplayText] = useState('');
  const fullText = "Hello, I'm Adib Rahman";
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100); // Typing speed in milliseconds
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  return (
    <>
      

      {/* About Me Section */}
      <section className="about-me-section section">
        <div className="container">
          <div className="row align-items-center">
            {/* Profile Image */}
            <div className="col-lg-5 col-md-12 col-12">
              <div className="about-me-image">
                <div className="image-wrapper">
                  <img src={adibImage} alt="Adib Rahman" className="profile-image" />
                  <div className="image-overlay">
                    <div className="overlay-content">
                      <i className="icofont-ui-user"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="col-lg-7 col-md-12 col-12">
              <div className="about-me-content">
                <div className="section-title">
                  <h2 className="typewriter-text">
                    {displayText}
                    <span className="cursor">|</span>
                  </h2>
                  <h3 className="role-title">Full-Stack Developer</h3>
                  <div className="title-divider">
                    <span className="divider-line"></span>
                    <i className="icofont-code"></i>
                    <span className="divider-line"></span>
                  </div>
                </div>

                <p className="intro-text">
                  I'm a passionate Full-Stack Developer with expertise in building modern web applications. 
                  I specialize in creating seamless user experiences and robust backend solutions using the 
                  latest technologies and best practices.
                </p>

                <div className="skills-highlights">
                  <h4>What I Do</h4>
                  <div className="skills-grid">
                    <div className="skill-item">
                      <div className="skill-icon">
                        <i className="icofont-laptop-alt"></i>
                      </div>
                      <h5>Web Development</h5>
                      <p>Building responsive and dynamic web applications</p>
                    </div>
                    <div className="skill-item">
                      <div className="skill-icon">
                        <i className="icofont-database"></i>
                      </div>
                      <h5>Backend Solutions</h5>
                      <p>Developing scalable server-side applications</p>
                    </div>
                    <div className="skill-item">
                      <div className="skill-icon">
                        <i className="icofont-ui-touch-phone"></i>
                      </div>
                      <h5>UI/UX Design</h5>
                      <p>Creating intuitive and beautiful interfaces</p>
                    </div>
                    <div className="skill-item">
                      <div className="skill-icon">
                        <i className="icofont-brand-android-robot"></i>
                      </div>
                      <h5>API Development</h5>
                      <p>Designing RESTful APIs and integrations</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="contact-info-card">
                  <h4>Let's Connect</h4>
                  <div className="contact-items">
                    <a href="mailto:adibrahman44@gmail.com" className="contact-item">
                      <div className="contact-icon">
                        <i className="icofont-envelope"></i>
                      </div>
                      <div className="contact-details">
                        <span className="label">Email</span>
                        <span className="value">adibrahman44@gmail.com</span>
                      </div>
                    </a>
                    
                    <a href="https://www.linkedin.com/in/adib-rahman-1a8a502a6/" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="contact-item">
                      <div className="contact-icon">
                        <i className="icofont-linkedin"></i>
                      </div>
                      <div className="contact-details">
                        <span className="label">LinkedIn</span>
                        <span className="value">Adib Rahman</span>
                      </div>
                    </a>
                    
                    <a href="https://github.com/adibqt" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="contact-item">
                      <div className="contact-icon">
                        <i className="icofont-github"></i>
                      </div>
                      <div className="contact-details">
                        <span className="label">GitHub</span>
                        <span className="value">github.com/adibqt</span>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="cta-buttons">
                  <a href="mailto:adibrahman44@gmail.com" className="btn primary-btn">
                    <i className="icofont-paper-plane"></i> Get In Touch
                  </a>
                  <a href="https://github.com/adibqt" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="btn secondary-btn">
                    <i className="icofont-github"></i> View Projects
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End About Me Section */}

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-6 col-12">
              <div className="stat-item">
                <i className="icofont-code-alt"></i>
                <h3 className="counter">1000+</h3>
                <p>Lines of Code</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="stat-item">
                <i className="icofont-rocket-alt-2"></i>
                <h3 className="counter">10+</h3>
                <p>Projects Completed</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="stat-item">
                <i className="icofont-coffee-cup"></i>
                <h3 className="counter">500+</h3>
                <p>Cups of Coffee</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="stat-item">
                <i className="icofont-star"></i>
                <h3 className="counter">100%</h3>
                <p>Dedication</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Stats Section */}
    </>
  );
}

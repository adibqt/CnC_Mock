import React from 'react';
import { Link } from 'react-router-dom';
import './Services.css';

export default function Services() {
  const services = [
    {
      icon: 'icofont-doctor-alt',
      title: 'Online Doctor Consultations',
      description: 'Connect with certified doctors through our platform for virtual consultations. Get expert medical advice from the comfort of your home.',
      features: [
        'Video/Audio Consultations',
        'Chat with Doctors',
        'Verified Medical Professionals',
        'Appointment Scheduling'
      ],
      color: '#1a73e8'
    },
    {
      icon: 'icofont-robot',
      title: 'AI Health Assistant',
      description: 'Our advanced AI-powered health assistant provides instant preliminary health assessments and symptom analysis.',
      features: [
        'Symptom Checker',
        'Health Risk Assessment',
        '24/7 Availability',
        'Multilingual Support'
      ],
      color: '#2ec4b6'
    },
    {
      icon: 'icofont-prescription',
      title: 'Digital Prescriptions',
      description: 'Receive and manage digital prescriptions from doctors. All prescriptions are securely stored in your patient dashboard.',
      features: [
        'Electronic Prescriptions',
        'Prescription History',
        'Direct Pharmacy Integration',
        'Refill Reminders'
      ],
      color: '#ff6b6b'
    },
    {
      icon: 'icofont-pills',
      title: 'Pharmacy Services',
      description: 'Browse prescription quotations from multiple pharmacies and choose the best option for your medications.',
      features: [
        'Compare Medicine Prices',
        'Multiple Pharmacy Options',
        'Home Delivery Available',
        'Genuine Medicines'
      ],
      color: '#ffa502'
    },
    {
      icon: 'icofont-laboratory',
      title: 'Lab & Diagnostic Services',
      description: 'Book lab tests and get diagnostic services from certified clinical laboratories with easy report access.',
      features: [
        'Home Sample Collection',
        'Digital Lab Reports',
        'Multiple Test Options',
        'Quick Results'
      ],
      color: '#9b59b6'
    },
    {
      icon: 'icofont-ui-calendar',
      title: 'Appointment Management',
      description: 'Easily schedule, reschedule, and manage your medical appointments with our intuitive booking system.',
      features: [
        'Real-time Availability',
        'Appointment Reminders',
        'Easy Rescheduling',
        'Doctor Availability Check'
      ],
      color: '#3498db'
    },
    {
      icon: 'icofont-ui-user',
      title: 'Patient Dashboard',
      description: 'Comprehensive dashboard to manage all your health records, appointments, prescriptions, and medical history.',
      features: [
        'Medical History',
        'Prescription Records',
        'Lab Reports Access',
        'Appointment History'
      ],
      color: '#e74c3c'
    },
    {
      icon: 'icofont-shield-alt',
      title: 'Secure Health Records',
      description: 'All your medical data is encrypted and stored securely with HIPAA-compliant security measures.',
      features: [
        'End-to-End Encryption',
        'Secure Data Storage',
        'Privacy Protection',
        'HIPAA Compliant'
      ],
      color: '#27ae60'
    }
  ];

  return (
    <>
     

      {/* Services Hero Section */}
      <section className="services-hero section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="services-hero-content">
                <h2>Comprehensive Healthcare Services</h2>
                <p>Click & Care provides a complete suite of digital healthcare services designed to make medical care accessible, convenient, and efficient for everyone.</p>
                <div className="hero-stats">
                  <div className="stat-item">
                    <i className="icofont-doctor-alt"></i>
                    <h4>500+</h4>
                    <p>Verified Doctors</p>
                  </div>
                  <div className="stat-item">
                    <i className="icofont-users-alt-3"></i>
                    <h4>10,000+</h4>
                    <p>Happy Patients</p>
                  </div>
                  <div className="stat-item">
                    <i className="icofont-hospital"></i>
                    <h4>50+</h4>
                    <p>Partner Clinics</p>
                  </div>
                  <div className="stat-item">
                    <i className="icofont-star"></i>
                    <h4>4.8/5</h4>
                    <p>Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Services Hero */}

      {/* Services Grid Section */}
      <section className="services-grid section">
        <div className="container">
          <div className="row">
            {services.map((service, index) => (
              <div className="col-lg-6 col-md-6 col-12" key={index}>
                <div className="service-card" style={{ '--service-color': service.color }}>
                  <div className="service-icon">
                    <i className={service.icon}></i>
                  </div>
                  <div className="service-content">
                    <h3>{service.title}</h3>
                    <p className="service-description">{service.description}</p>
                    <ul className="service-features">
                      {service.features.map((feature, idx) => (
                        <li key={idx}>
                          <i className="icofont-check-circled"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="service-overlay"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* End Services Grid */}

      {/* Why Choose Us Section */}
      <section className="why-choose-us section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-title">
                <h2>Why Choose Click & Care?</h2>
                <p>We're committed to providing the best healthcare experience</p>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3 col-md-6 col-12">
              <div className="feature-box">
                <div className="feature-icon">
                  <i className="icofont-clock-time"></i>
                </div>
                <h4>24/7 Availability</h4>
                <p>Access healthcare services anytime, anywhere with our round-the-clock platform.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="feature-box">
                <div className="feature-icon">
                  <i className="icofont-shield-alt"></i>
                </div>
                <h4>Secure & Private</h4>
                <p>Your medical data is protected with bank-level encryption and security.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="feature-box">
                <div className="feature-icon">
                  <i className="icofont-money"></i>
                </div>
                <h4>Affordable Pricing</h4>
                <p>Compare prices and choose the most cost-effective healthcare options.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="feature-box">
                <div className="feature-icon">
                  <i className="icofont-ui-check"></i>
                </div>
                <h4>Verified Professionals</h4>
                <p>All doctors are thoroughly verified and certified.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Why Choose Us */}

      {/* CTA Section */}
      <section className="services-cta section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="cta-content">
                <h2>Ready to Get Started?</h2>
                <p>Join thousands of satisfied patients who trust Click & Care for their healthcare needs</p>
                <div className="cta-buttons">
                  <Link to="/login" className="btn primary">
                    <i className="icofont-user-alt-3"></i>
                    Sign Up as Patient
                  </Link>
                  <Link to="/doctor-login" className="btn secondary">
                    <i className="icofont-doctor-alt"></i>
                    Join as Doctor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End CTA Section */}
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Doctors.css';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function to handle image URLs (works with both absolute URLs from Vercel Blob and relative paths)
const getImageUrl = (url) => {
  if (!url) return '';
  // If URL already starts with http:// or https://, return as-is (Vercel Blob URLs)
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Otherwise prepend API_URL (relative paths)
  return `${API_URL}${url}`;
};


export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [specializations, setSpecializations] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // name, experience, rating
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchDoctors();
    fetchSpecializations();
  }, []);

  useEffect(() => {
    // Initialize Owl Carousel after doctors are loaded
    if (!loading && filteredAndSortedDoctors.length > 0 && carouselRef.current) {
      initializeCarousel();
    }
  }, [loading, doctors, searchQuery, selectedSpecialization, sortBy]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/doctors/all`);
      if (response.ok) {
        const data = await response.json();
        // Filter only verified doctors on frontend
        const verifiedDoctors = data.filter(doctor => doctor.is_verified === true);
        setDoctors(verifiedDoctors);
      } else {
        console.error('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/doctors/specializations`);
      if (response.ok) {
        const data = await response.json();
        setSpecializations(data);
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const handleDoctorClick = (doctorId) => {
    navigate(`/doctor/${doctorId}`);
  };

  const initializeCarousel = () => {
    // Destroy existing carousel if it exists
    if (window.$ && window.$.fn.owlCarousel) {
      const $carousel = window.$(carouselRef.current);
      if ($carousel.data('owl.carousel')) {
        $carousel.trigger('destroy.owl.carousel');
        $carousel.find('.owl-stage-outer').children().unwrap();
      }
      
      // Initialize new carousel
      setTimeout(() => {
        $carousel.owlCarousel({
          items: 3,
          loop: true,
          margin: 30,
          nav: true,
          dots: true,
          autoplay: true,
          autoplayTimeout: 5000,
          autoplayHoverPause: true,
          navText: [
            '<i class="icofont-simple-left"></i>',
            '<i class="icofont-simple-right"></i>'
          ],
          responsive: {
            0: {
              items: 1
            },
            768: {
              items: 2
            },
            992: {
              items: 3
            }
          }
        });
      }, 100);
    }
  };

  const filteredAndSortedDoctors = doctors
    .filter(doctor => {
      const matchesSearch = 
        doctor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialization = 
        selectedSpecialization === 'all' || 
        doctor.specialization === selectedSpecialization;
      
      return matchesSearch && matchesSpecialization;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'experience':
          // Since we don't have years_of_experience, sort by ID (older doctors first)
          return a.id - b.id;
        case 'rating':
          // Default rating for all
          return 0;
        default:
          return 0;
      }
    });

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs overlay">
        <div className="container">
          <div className="bread-inner">
            <div className="row">
              <div className="col-12">
                <h2>Our Doctors</h2>
                <ul className="bread-list">
                  <li><Link to="/">Home</Link></li>
                  <li><i className="icofont-simple-right"></i></li>
                  <li className="active">Doctors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Breadcrumbs */}

      {/* Doctors Hero Section */}
      <section className="doctors-hero section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="doctors-hero-content">
                <h2>Meet Our Expert Doctors</h2>
                <p>Consult with certified and experienced medical professionals from various specializations</p>
                <div className="hero-stats-row">
                  <div className="hero-stat">
                    <i className="icofont-doctor-alt"></i>
                    <h4>{doctors.length}+</h4>
                    <p>Expert Doctors</p>
                  </div>
                  <div className="hero-stat">
                    <i className="icofont-stethoscope-alt"></i>
                    <h4>{specializations.length}+</h4>
                    <p>Specializations</p>
                  </div>
                  <div className="hero-stat">
                    <i className="icofont-star"></i>
                    <h4>4.8/5</h4>
                    <p>Average Rating</p>
                  </div>
                  <div className="hero-stat">
                    <i className="icofont-users-alt-3"></i>
                    <h4>10K+</h4>
                    <p>Happy Patients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Doctors Hero */}

      {/* Search and Filter Section */}
      <section className="doctors-filter section">
        <div className="container">
          <div className="filter-wrapper">
            <div className="row align-items-center">
              <div className="col-lg-5 col-md-12">
                <div className="search-box">
                  <i className="icofont-search"></i>
                  <input
                    type="text"
                    placeholder="Search by name, specialization, or qualifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-4 col-md-6 col-12">
                <div className="filter-select">
                  <i className="icofont-stethoscope-alt"></i>
                  <select
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                  >
                    <option value="all">All Specializations</option>
                    {specializations.map((spec, index) => (
                      <option key={index} value={spec.name}>{spec.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-12">
                <div className="filter-select">
                  <i className="icofont-sort"></i>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="experience">Sort by Experience</option>
                    <option value="rating">Sort by Rating</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="results-count">
              <p>Showing <strong>{filteredAndSortedDoctors.length}</strong> doctors</p>
            </div>
          </div>
        </div>
      </section>
      {/* End Search and Filter */}

      {/* Doctors Grid Section */}
      <section className="doctors-grid section">
        <div className="container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading doctors...</p>
            </div>
          ) : filteredAndSortedDoctors.length > 0 ? (
            <div className="doctors-carousel-wrapper">
              <div className="owl-carousel owl-theme doctors-slider" ref={carouselRef}>
                {filteredAndSortedDoctors.map((doctor, index) => (
                  <div className="doctor-card-item" key={doctor.id || index}>
                    <div className="doctor-card" onClick={() => handleDoctorClick(doctor.id)}>
                      <div className="doctor-header">
                        <div className="doctor-image">
                          {doctor.profile_picture_url ? (
                            <img 
                              src={getImageUrl(doctor.profile_picture_url)} 
                              alt={doctor.full_name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                          <div className="doctor-placeholder" style={{ display: doctor.profile_picture_url ? 'none' : 'flex' }}>
                            <i className="icofont-doctor-alt"></i>
                          </div>
                          <div className="verified-badge">
                            <i className="icofont-verification-check"></i>
                          </div>
                        </div>
                        <div className="doctor-rating">
                          <i className="icofont-star"></i>
                          <span>{doctor.rating || '4.5'}</span>
                        </div>
                      </div>

                      <div className="doctor-info">
                        <h3>{doctor.full_name}</h3>
                        <div className="specialization-badge">
                          <i className="icofont-stethoscope-alt"></i>
                          <span>{doctor.specialization}</span>
                        </div>

                        <div className="qualifications">
                          <h5><i className="icofont-graduate"></i> Qualifications</h5>
                          <p>{doctor.license_number ? `License: ${doctor.license_number}` : 'Licensed Professional'}</p>
                        </div>

                        <div className="experience-info">
                          <div className="info-item">
                            <i className="icofont-phone"></i>
                            <div>
                              <span className="label">Contact</span>
                              <span className="value">{doctor.phone || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="info-item">
                            <i className="icofont-ui-check"></i>
                            <div>
                              <span className="label">Status</span>
                              <span className="value">{doctor.is_verified ? 'Verified' : 'Pending'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="doctor-actions">
                          <button className="btn-view-profile">
                            <i className="icofont-eye"></i>
                            View Profile
                          </button>
                          <button className="btn-book-appointment">
                            <i className="icofont-ui-calendar"></i>
                            Book Appointment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-results">
              <i className="icofont-search-document"></i>
              <h3>No Doctors Found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      </section>
      {/* End Doctors Grid */}

      {/* CTA Section */}
      <section className="doctors-cta section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="cta-content">
                <h2>Are You a Medical Professional?</h2>
                <p>Join our platform and connect with thousands of patients seeking quality healthcare</p>
                <Link to="/doctor-login" className="btn primary">
                  <i className="icofont-doctor-alt"></i>
                  Join as a Doctor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End CTA Section */}
    </>
  );
}

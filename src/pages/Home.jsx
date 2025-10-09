import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Slider Area */}
      <section className="slider">
        <div className="hero-slider">
          {/* Single Slider */}
          <div className="single-slider" style={{backgroundImage: "url('/img/slider.jpg')"}}>
            <div className="container">
              <div className="row">
                <div className="col-lg-7">
                  <div className="text">
                    <h1>We Provide <span>Medical</span> Services That You Can <span>Trust!</span></h1>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sed nisl pellentesque, faucibus libero eu, gravida quam.</p>
                    <div className="button">
                      <Link to="/appointment" className="btn">Get Appointment</Link>
                      <Link to="/about" className="btn primary">Learn More</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* End Single Slider */}
        </div>
      </section>
      {/*/ End Slider Area */}

      {/* Start Schedule Area */}
      <section className="schedule">
        <div className="container">
          <div className="schedule-inner">
            <div className="row">
              <div className="col-lg-4 col-md-6 col-12">
                {/* Single Schedule */}
                <div className="single-schedule first">
                  <div className="inner">
                    <div className="icon">
                      <i className="fa fa-ambulance"></i>
                    </div>
                    <div className="single-content">
                      <span>Lorem Amet</span>
                      <h4>Emergency Cases</h4>
                      <p>Lorem ipsum sit amet consectetur adipiscing elit. Vivamus et erat in lacus convallis sodales.</p>
                      <a href="#">LEARN MORE<i className="fa fa-long-arrow-right"></i></a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 col-12">
                {/* Single Schedule */}
                <div className="single-schedule middle">
                  <div className="inner">
                    <div className="icon">
                      <i className="icofont-prescription"></i>
                    </div>
                    <div className="single-content">
                      <span>Fusce Porttitor</span>
                      <h4>Doctors Timetable</h4>
                      <p>Lorem ipsum sit amet consectetur adipiscing elit. Vivamus et erat in lacus convallis sodales.</p>
                      <a href="#">LEARN MORE<i className="fa fa-long-arrow-right"></i></a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-12 col-12">
                {/* Single Schedule */}
                <div className="single-schedule last">
                  <div className="inner">
                    <div className="icon">
                      <i className="icofont-ui-clock"></i>
                    </div>
                    <div className="single-content">
                      <span>Donec luctus</span>
                      <h4>Opening Hours</h4>
                      <ul className="time-sidual">
                        <li className="day">Monday - Friday <span>8.00-20.00</span></li>
                        <li className="day">Saturday <span>9.00-18.30</span></li>
                        <li className="day">Sunday <span>9.00-15.00</span></li>
                      </ul>
                      <a href="#">LEARN MORE<i className="fa fa-long-arrow-right"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*/ End Schedule Area */}

      {/* Start Features */}
      <section className="features section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-title">
                <h2>We Are Always Ready to Help You & Your Family</h2>
                <img src="/img/section-img.png" alt="#" />
                <p>Lorem ipsum dolor sit amet consectetur adipiscing elit praesent aliquet. pretiumts</p>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-4 col-12">
              {/* Single Feature */}
              <div className="single-features">
                <div className="signle-icon">
                  <i className="icofont icofont-ambulance-cross"></i>
                </div>
                <h3>Emergency Help</h3>
                <p>Lorem ipsum sit amet, consectetur adipiscing lit. Etiam maximus nulla a nibh tempor.</p>
              </div>
              {/* End Single Feature */}
            </div>
            <div className="col-lg-4 col-12">
              {/* Single Feature */}
              <div className="single-features">
                <div className="signle-icon">
                  <i className="icofont icofont-medical-sign-alt"></i>
                </div>
                <h3>Enriched Pharmacy</h3>
                <p>Lorem ipsum sit amet, consectetur adipiscing lit. Etiam maximus nulla a nibh tempor.</p>
              </div>
              {/* End Single Feature */}
            </div>
            <div className="col-lg-4 col-12">
              {/* Single Feature */}
              <div className="single-features last">
                <div className="signle-icon">
                  <i className="icofont icofont-stethoscope"></i>
                </div>
                <h3>Medical Treatment</h3>
                <p>Lorem ipsum sit amet, consectetur adipiscing lit. Etiam maximus nulla a nibh tempor.</p>
              </div>
              {/* End Single Feature */}
            </div>
          </div>
        </div>
      </section>
      {/*/ End Features */}
    </div>
  );
};

export default Home;

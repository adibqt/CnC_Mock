import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Login from './pages/Login';
import DoctorLogin from './pages/DoctorLogin';
import ProfileUpdate from './pages/ProfileUpdate';
import PatientDashboard from './pages/PatientDashboard';
import NotFound from './pages/NotFound';
import UserHome from './pages/UserHome';
import DoctorProfileUpdate from './pages/DoctorProfileUpdate';
import DoctorHome from './pages/DoctorHome';
import DoctorSchedule from './pages/DoctorSchedule';
import AIConsultation from './pages/AIConsultation';

function App() {
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for window to fully load (including all CSS and images)
    const handleLoad = () => {
      setIsReady(true);
      // Small delay to ensure styles are applied
      setTimeout(() => {
        setLoading(false);
      }, 300);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <Router>
      <Routes>
        {/* Routes without Header/Footer */}
        <Route path="/profile-update" element={<ProfileUpdate />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/user-home" element={<UserHome />} />
        <Route path="/ai-consultation" element={<AIConsultation />} />
        <Route path="/doctor-profile-update" element={<DoctorProfileUpdate />} />
        <Route path="/doctor-home" element={<DoctorHome />} />
        <Route path="/doctor-schedule" element={<DoctorSchedule />} />
        
        {/* Routes with Header/Footer */}
        <Route path="/*" element={
          <>
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/doctor-login" element={<DoctorLogin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;

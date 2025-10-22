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
import DoctorDetails from './pages/DoctorDetails';
import WritePrescription from './pages/WritePrescription';
import ViewPrescription from './pages/ViewPrescription';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PatientManagement from './pages/PatientManagement';
import DoctorManagement from './pages/DoctorManagement';
import PharmacyLogin from './pages/PharmacyLogin';
import PharmacyDashboard from './pages/PharmacyDashboard';
import ClinicLogin from './pages/ClinicLogin';
import ClinicDashboard from './pages/ClinicDashboard';
import AboutMe from './pages/AboutMe';
import Services from './pages/Services';
import FAQ from './pages/FAQ';
import Doctors from './pages/Doctors';

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
        {/* Admin Routes (no Header/Footer) */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/patients" element={<PatientManagement />} />
        <Route path="/admin/doctors" element={<DoctorManagement />} />
        
        {/* Pharmacy Routes (no Header/Footer) */}
        <Route path="/pharmacy" element={<PharmacyLogin />} />
        <Route path="/pharmacy-login" element={<PharmacyLogin />} />
        <Route path="/pharmacy-dashboard" element={<PharmacyDashboard />} />
        
        {/* Clinic Routes (no Header/Footer) */}
        <Route path="/clinic" element={<ClinicLogin />} />
        <Route path="/clinic-login" element={<ClinicLogin />} />
        <Route path="/clinic-dashboard" element={<ClinicDashboard />} />
        
        {/* Routes without Header/Footer */}
        <Route path="/profile-update" element={<ProfileUpdate />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/user-home" element={<UserHome />} />
        <Route path="/ai-consultation" element={<AIConsultation />} />
        <Route path="/doctor-profile-update" element={<DoctorProfileUpdate />} />
        <Route path="/doctor-home" element={<DoctorHome />} />
        <Route path="/doctor-schedule" element={<DoctorSchedule />} />
        <Route path="/doctor/:doctorId" element={<DoctorDetails />} />
        <Route path="/write-prescription" element={<WritePrescription />} />
        <Route path="/view-prescription" element={<ViewPrescription />} />
        
        {/* Routes with Header/Footer */}
        <Route path="/*" element={
          <>
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<AboutMe />} />
              <Route path="/services" element={<Services />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/faq" element={<FAQ />} />
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

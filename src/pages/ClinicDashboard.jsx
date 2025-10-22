import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClinicDashboard.css';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


const ClinicDashboard = () => {
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quotationRequests, setQuotationRequests] = useState([]);
  const [myQuotations, setMyQuotations] = useState([]);
  const [acceptedQuotations, setAcceptedQuotations] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // pending, submitted, accepted, reports
  
  // Modal states
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedAcceptedQuotation, setSelectedAcceptedQuotation] = useState(null);
  
  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    testResults: [],
    estimatedDelivery: '',
    additionalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Report form state
  const [reportForm, setReportForm] = useState({
    pathologistName: '',
    pathologistSignature: '',
    testResults: [],
    notes: '',
    reportPdf: null,
    reportImages: []
  });
  const [uploadingReport, setUploadingReport] = useState(false);

  useEffect(() => {
    loadClinicData();
  }, []);

  useEffect(() => {
    if (clinic?.is_verified) {
      loadQuotationRequests();
      loadMyQuotations();
      loadAcceptedQuotations();
      loadMyReports();
    }
  }, [clinic]);

  const loadClinicData = async () => {
    try {
      const token = localStorage.getItem('clinic_accessToken');
      if (!token) {
        navigate('/clinic-login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/clinic/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClinic(data);
      } else if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('clinic_accessToken');
        localStorage.removeItem('clinic_userData');
        navigate('/clinic-login');
      } else {
        setError('Failed to load clinic data');
      }
    } catch (err) {
      console.error('Error loading clinic:', err);
      setError('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const loadQuotationRequests = async () => {
    try {
      const token = localStorage.getItem('clinic_accessToken');
      const response = await fetch('http://localhost:8000/api/lab-quotations/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQuotationRequests(data);
      }
    } catch (err) {
      console.error('Error loading quotation requests:', err);
    }
  };

  const loadMyQuotations = async () => {
    try {
      const token = localStorage.getItem('clinic_accessToken');
      const response = await fetch('http://localhost:8000/api/lab-quotations/my-responses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMyQuotations(data);
      }
    } catch (err) {
      console.error('Error loading my quotations:', err);
    }
  };

  const loadAcceptedQuotations = async () => {
    try {
      const token = localStorage.getItem('clinic_accessToken');
      const response = await fetch('http://localhost:8000/api/lab-reports/accepted-quotations/pending-reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAcceptedQuotations(data);
      }
    } catch (err) {
      console.error('Error loading accepted quotations:', err);
    }
  };

  const loadMyReports = async () => {
    try {
      const token = localStorage.getItem('clinic_accessToken');
      const response = await fetch('http://localhost:8000/api/lab-reports/clinic/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMyReports(data);
      }
    } catch (err) {
      console.error('Error loading my reports:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clinic_accessToken');
    localStorage.removeItem('clinic_userData');
    navigate('/clinic-login');
  };

  const openQuoteModal = (request) => {
    setSelectedRequest(request);
    
    // Initialize test results from prescription lab tests
    const labTests = request.prescription?.lab_tests || [];
    const testResults = labTests.map(test => ({
      testName: test.test_name || '',
      price: 0
    }));
    
    setQuoteForm({
      testResults: testResults.length > 0 ? testResults : [{ testName: '', price: 0 }],
      estimatedDelivery: '',
      additionalNotes: ''
    });
    setShowQuoteModal(true);
  };

  const handleTestResultChange = (index, field, value) => {
    const newResults = [...quoteForm.testResults];
    newResults[index][field] = value;
    setQuoteForm({ ...quoteForm, testResults: newResults });
  };

  const addTestResult = () => {
    setQuoteForm({
      ...quoteForm,
      testResults: [...quoteForm.testResults, { testName: '', price: 0 }]
    });
  };

  const removeTestResult = (index) => {
    const newResults = quoteForm.testResults.filter((_, i) => i !== index);
    setQuoteForm({ ...quoteForm, testResults: newResults });
  };

  const calculateTotalPrice = () => {
    return quoteForm.testResults.reduce((sum, test) => sum + (parseFloat(test.price) || 0), 0);
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    
    // Validation
    if (quoteForm.testResults.length === 0) {
      alert('Please add at least one test to the quotation');
      return;
    }

    const invalidTests = quoteForm.testResults.filter(test => 
      !test.testName.trim() || test.price <= 0
    );

    if (invalidTests.length > 0) {
      alert('Please fill in all test details with valid prices');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('clinic_accessToken');
      const response = await fetch('http://localhost:8000/api/lab-quotations/respond', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quotation_request_id: selectedRequest.id,
          test_items: quoteForm.testResults.map(test => ({
            test_name: test.testName,
            price: parseFloat(test.price),
            notes: test.notes || null
          })),
          estimated_delivery: quoteForm.estimatedDelivery || null,
          additional_notes: quoteForm.additionalNotes || null
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Quotation submitted successfully!');
        setShowQuoteModal(false);
        setSelectedRequest(null);
        loadQuotationRequests();
        loadMyQuotations();
      } else {
        alert(result.detail || 'Failed to submit quotation');
      }
    } catch (err) {
      console.error('Error submitting quotation:', err);
      alert('An error occurred while submitting quotation');
    } finally {
      setSubmitting(false);
    }
  };

  const openReportModal = (quotation) => {
    setSelectedAcceptedQuotation(quotation);
    
    // Initialize test results from quotation response
    const testResults = quotation.test_items?.map(test => ({
      testName: test.test_name || '',
      value: '',
      unit: '',
      referenceRange: '',
      status: 'normal' // normal, abnormal, critical
    })) || [];
    
    setReportForm({
      pathologistName: '',
      pathologistSignature: '',
      testResults: testResults.length > 0 ? testResults : [{ testName: '', value: '', unit: '', referenceRange: '', status: 'normal' }],
      notes: '',
      reportPdf: null,
      reportImages: []
    });
    setShowReportModal(true);
  };

  const handleReportTestChange = (index, field, value) => {
    const newResults = [...reportForm.testResults];
    newResults[index][field] = value;
    setReportForm({ ...reportForm, testResults: newResults });
  };

  const addReportTest = () => {
    setReportForm({
      ...reportForm,
      testResults: [...reportForm.testResults, { testName: '', value: '', unit: '', referenceRange: '', status: 'normal' }]
    });
  };

  const removeReportTest = (index) => {
    const newResults = reportForm.testResults.filter((_, i) => i !== index);
    setReportForm({ ...reportForm, testResults: newResults });
  };

  const handleFileChange = (e, field) => {
    const files = Array.from(e.target.files);
    
    if (field === 'reportPdf') {
      if (files[0] && files[0].type === 'application/pdf') {
        setReportForm({ ...reportForm, reportPdf: files[0] });
      } else {
        alert('Please select a valid PDF file');
        e.target.value = '';
      }
    } else if (field === 'reportImages') {
      const validImages = files.filter(file => 
        file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
      );
      
      if (validImages.length !== files.length) {
        alert('Some files were skipped. Only JPG, JPEG, and PNG images are allowed.');
      }
      
      setReportForm({ ...reportForm, reportImages: validImages });
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!reportForm.pathologistName.trim()) {
      alert('Please enter pathologist name');
      return;
    }

    if (reportForm.testResults.length === 0) {
      alert('Please add at least one test result');
      return;
    }

    const invalidTests = reportForm.testResults.filter(test => 
      !test.testName.trim() || !test.value.trim()
    );

    if (invalidTests.length > 0) {
      alert('Please fill in test name and value for all tests');
      return;
    }

    if (!reportForm.reportPdf) {
      alert('Please upload a PDF report');
      return;
    }

    setUploadingReport(true);
    try {
      const token = localStorage.getItem('clinic_accessToken');
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('quotation_response_id', selectedAcceptedQuotation.quotation_response_id);
      
      // Generate report title
      const reportTitle = `Lab Report for ${selectedAcceptedQuotation.patient?.name || 'Patient'}`;
      formData.append('report_title', reportTitle);
      
      // Transform test results to match backend schema
      const transformedTestResults = reportForm.testResults.map(test => ({
        test_name: test.testName,
        result: test.value,
        unit: test.unit || null,
        normal_range: test.referenceRange || null,
        status: test.status
      }));
      formData.append('test_results', JSON.stringify(transformedTestResults));
      
      if (reportForm.pathologistName) {
        formData.append('pathologist_name', reportForm.pathologistName);
      }
      if (reportForm.notes) {
        formData.append('diagnosis_notes', reportForm.notes);
      }
      formData.append('report_file', reportForm.reportPdf);
      
      // Add images
      reportForm.reportImages.forEach((image, index) => {
        formData.append('report_images', image);
      });

      const response = await fetch('http://localhost:8000/api/lab-reports/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Lab report uploaded successfully! Report ID: ${result.report_id}`);
        setShowReportModal(false);
        setSelectedAcceptedQuotation(null);
        loadAcceptedQuotations();
        loadMyReports();
      } else {
        alert(result.detail || 'Failed to upload lab report');
      }
    } catch (err) {
      console.error('Error uploading report:', err);
      alert('An error occurred while uploading report');
    } finally {
      setUploadingReport(false);
    }
  };

  const viewQuotationDetails = (quotation) => {
    setSelectedQuotation(quotation);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="clinic-loading">
        <i className="icofont-spinner-alt-2 icofont-spin"></i>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clinic-error">
        <i className="icofont-warning"></i>
        <p>{error}</p>
        <button onClick={handleLogout} className="btn btn-primary">
          Back to Login
        </button>
      </div>
    );
  }

  // Pending Verification View
  if (!clinic?.is_verified) {
    return (
      <div className="clinic-dashboard">
        {/* Header */}
        <div className="clinic-header">
          <div className="header-content">
            <div className="logo">
              <i className="icofont-laboratory"></i>
              <span>{clinic?.clinic_name}</span>
            </div>
            <div className="header-actions">
              <button onClick={handleLogout} className="btn btn-logout">
                <i className="icofont-logout"></i> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Pending Verification Message */}
        <div className="dashboard-container">
          <div className="verification-pending">
            <div className="verification-icon">
              <i className="icofont-clock-time"></i>
            </div>
            <h2>Verification Pending</h2>
            <p>Thank you for registering with Click & Care!</p>
            <p>Your clinic account is currently under review by our admin team.</p>
            <div className="verification-info">
              <div className="info-item">
                <i className="icofont-check-circled"></i>
                <span>Your application has been received</span>
              </div>
              <div className="info-item">
                <i className="icofont-clock-time"></i>
                <span>Verification typically takes 24-48 hours</span>
              </div>
              <div className="info-item">
                <i className="icofont-email"></i>
                <span>You'll be notified once your account is verified</span>
              </div>
            </div>
            <div className="clinic-details-card">
              <h3>Submitted Information</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Clinic Name:</label>
                  <span>{clinic?.clinic_name}</span>
                </div>
                <div className="detail-item">
                  <label>License Number:</label>
                  <span>{clinic?.license_number}</span>
                </div>
                <div className="detail-item">
                  <label>Contact Person:</label>
                  <span>{clinic?.contact_person}</span>
                </div>
                <div className="detail-item">
                  <label>Location:</label>
                  <span>{clinic?.city}, {clinic?.state}</span>
                </div>
                <div className="detail-item">
                  <label>Phone:</label>
                  <span>{clinic?.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verified Clinic Dashboard
  return (
    <div className="clinic-dashboard">
      {/* Header */}
      <div className="clinic-header">
        <div className="header-content">
          <div className="logo">
            <i className="icofont-laboratory"></i>
            <span>{clinic?.clinic_name}</span>
          </div>
          <div className="header-info">
            <span className="verified-badge">
              <i className="icofont-check-circled"></i> Verified
            </span>
            <span className="location">
              <i className="icofont-location-pin"></i> {clinic?.city}
            </span>
          </div>
          <div className="header-actions">
            <button onClick={handleLogout} className="btn btn-logout">
              <i className="icofont-logout"></i> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-container">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'linear-gradient(135deg, #17a2b8 0%, #0e6ba8 100%)'}}>
              <i className="icofont-test-tube-alt"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{quotationRequests.length}</div>
              <div className="stat-label">Pending Requests</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'}}>
              <i className="icofont-check-circled"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{myQuotations.length}</div>
              <div className="stat-label">Submitted Quotations</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)'}}>
              <i className="icofont-star"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{acceptedQuotations.length}</div>
              <div className="stat-label">Awaiting Reports</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)'}}>
              <i className="icofont-file-document"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{myReports.length}</div>
              <div className="stat-label">Uploaded Reports</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="icofont-clock-time"></i>
            Pending Requests ({quotationRequests.length})
          </button>
          <button
            className={`tab ${activeTab === 'submitted' ? 'active' : ''}`}
            onClick={() => setActiveTab('submitted')}
          >
            <i className="icofont-check-circled"></i>
            My Quotations ({myQuotations.length})
          </button>
          <button
            className={`tab ${activeTab === 'accepted' ? 'active' : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            <i className="icofont-upload-alt"></i>
            Upload Reports ({acceptedQuotations.length})
          </button>
          <button
            className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="icofont-file-document"></i>
            My Reports ({myReports.length})
          </button>
        </div>

        {/* Tab Content - Pending Requests */}
        {activeTab === 'pending' && (
          <div className="tab-content">
            {quotationRequests.length === 0 ? (
              <div className="empty-state">
                <i className="icofont-test-tube-alt"></i>
                <p>No pending quotation requests</p>
                <span>New lab test requests will appear here</span>
              </div>
            ) : (
              <div className="requests-grid">
                {quotationRequests.map(request => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <div>
                        <h3>Prescription #{request.prescription?.prescription_id}</h3>
                        <p className="patient-name">
                          <i className="icofont-user"></i> {request.patient?.name || 'Patient'}
                        </p>
                      </div>
                      <span className="request-date">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="request-body">
                      <div className="diagnosis">
                        <label>Diagnosis:</label>
                        <p>{request.prescription?.diagnosis}</p>
                      </div>
                      
                      <div className="lab-tests">
                        <label>Lab Tests Required:</label>
                        <ul>
                          {request.prescription?.lab_tests?.map((test, idx) => (
                            <li key={idx}>
                              <i className="icofont-test-tube-alt"></i>
                              <strong>{test.test_name}</strong>
                              {test.instructions && (
                                <>
                                  <br />
                                  <small>{test.instructions}</small>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {request.patient_notes && (
                        <div className="patient-notes">
                          <label>Patient Notes:</label>
                          <p>{request.patient_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="request-footer">
                      <button 
                        className="btn btn-primary"
                        onClick={() => openQuoteModal(request)}
                      >
                        <i className="icofont-plus"></i> Submit Quotation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content - My Quotations */}
        {activeTab === 'submitted' && (
          <div className="tab-content">
            {myQuotations.length === 0 ? (
              <div className="empty-state">
                <i className="icofont-file-text"></i>
                <p>No quotations submitted yet</p>
                <span>Submit your first quotation from pending requests</span>
              </div>
            ) : (
              <div className="quotations-list">
                {myQuotations.map(quotation => (
                  <div key={quotation.id} className="quotation-card">
                    <div className="quotation-header">
                      <div>
                        <h3>Quotation #{quotation.id}</h3>
                        <p className="patient-name">
                          <i className="icofont-user"></i> Patient: {quotation.quotation_request?.patient?.name || 'N/A'}
                        </p>
                        <p className="prescription-ref">
                          <i className="icofont-prescription"></i> Prescription: {quotation.quotation_request?.prescription?.prescription_id || 'N/A'}
                        </p>
                      </div>
                      <span className={`status-badge status-${quotation.is_accepted ? 'accepted' : 'pending'}`}>
                        {quotation.is_accepted ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="quotation-body">
                      <div className="tests-list">
                        <label>Tests Quoted:</label>
                        <ul>
                          {quotation.test_items?.map((test, idx) => (
                            <li key={idx}>
                              <span>{test.test_name}</span>
                              <span className="price">৳{parseFloat(test.price).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {quotation.estimated_delivery && (
                        <div className="delivery-info" style={{marginTop: '15px'}}>
                          <i className="icofont-clock-time"></i>
                          <span>Estimated Delivery: {quotation.estimated_delivery}</span>
                        </div>
                      )}

                      {quotation.additional_notes && (
                        <div className="notes-section" style={{marginTop: '10px'}}>
                          <label>Notes:</label>
                          <p>{quotation.additional_notes}</p>
                        </div>
                      )}
                      
                      <div className="amount-summary">
                        <div className="amount-row total">
                          <span>Total Amount:</span>
                          <span>৳{parseFloat(quotation.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="quotation-footer">
                      <span className="submitted-date">
                        Submitted: {new Date(quotation.created_at).toLocaleString()}
                      </span>
                      {quotation.is_accepted && quotation.accepted_at && (
                        <span className="accepted-date" style={{color: 'green', marginLeft: '10px'}}>
                          <i className="icofont-check-circled"></i> Accepted: {new Date(quotation.accepted_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Upload Reports */}
        {activeTab === 'accepted' && (
          <div className="tab-content">
            {acceptedQuotations.length === 0 ? (
              <div className="empty-state">
                <i className="icofont-upload-alt"></i>
                <p>No accepted quotations awaiting reports</p>
                <span>Accepted quotations requiring lab reports will appear here</span>
              </div>
            ) : (
              <div className="quotations-list">
                {acceptedQuotations.map(quotation => (
                  <div key={quotation.quotation_response_id} className="quotation-card urgent">
                    <div className="quotation-header">
                      <div>
                        <h3>Quotation #{quotation.quotation_response_id}</h3>
                        <p className="prescription-ref">
                          <i className="icofont-user"></i> Patient: {quotation.patient?.name || 'N/A'}
                        </p>
                        <p className="patient-contact">
                          <i className="icofont-phone"></i> {quotation.patient?.phone || 'N/A'}
                        </p>
                      </div>
                      <span className="status-badge status-accepted">
                        Accepted - Upload Report
                      </span>
                    </div>
                    
                    <div className="quotation-body">
                      <div className="tests-list">
                        <label>Tests to be Performed:</label>
                        <ul>
                          {quotation.test_items?.map((test, idx) => (
                            <li key={idx}>
                              <i className="icofont-test-tube-alt"></i>
                              <strong>{test.test_name}</strong>
                              <span className="price">৳{parseFloat(test.price).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="amount-summary">
                        <div className="amount-row">
                          <span>Amount Paid:</span>
                          <span>৳{parseFloat(quotation.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="quotation-footer">
                      <span className="accepted-date">
                        Accepted: {new Date(quotation.accepted_at).toLocaleString()}
                      </span>
                      <button 
                        className="btn btn-primary"
                        onClick={() => openReportModal(quotation)}
                      >
                        <i className="icofont-upload-alt"></i> Upload Lab Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content - My Reports */}
        {activeTab === 'reports' && (
          <div className="tab-content">
            {myReports.length === 0 ? (
              <div className="empty-state">
                <i className="icofont-file-document"></i>
                <p>No reports uploaded yet</p>
                <span>Upload your first lab report from accepted quotations</span>
              </div>
            ) : (
              <div className="reports-list">
                {myReports.map(report => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <div>
                        <h3>Report ID: {report.report_id}</h3>
                        <p className="patient-name">
                          <i className="icofont-user"></i> Patient: {report.patient?.name || 'N/A'}
                        </p>
                        <p className="report-title">
                          <i className="icofont-laboratory"></i> {report.report_title}
                        </p>
                      </div>
                      <span className="report-date">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="report-body">
                      {report.pathologist_name && (
                        <div className="pathologist-info">
                          <label>Pathologist:</label>
                          <p>{report.pathologist_name}</p>
                        </div>
                      )}
                      
                      {report.technician_name && (
                        <div className="technician-info">
                          <label>Technician:</label>
                          <p>{report.technician_name}</p>
                        </div>
                      )}

                      {report.diagnosis_notes && (
                        <div className="diagnosis-notes">
                          <label>Diagnosis Notes:</label>
                          <p>{report.diagnosis_notes}</p>
                        </div>
                      )}
                      
                      <div className="tests-results">
                        <label>Test Results:</label>
                        <div className="results-grid">
                          {report.test_results?.map((test, idx) => (
                            <div key={idx} className="result-item">
                              <strong>{test.test_name}</strong>
                              <span className={`status-indicator status-${test.status}`}>
                                {test.result} {test.unit}
                              </span>
                              {test.normal_range && (
                                <small>Normal: {test.normal_range}</small>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="report-files">
                        <label>Attached Files:</label>
                        <div className="files-list">
                          {report.report_file_url && (
                            <a 
                              href={`${API_URL}${report.report_file_url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              <i className="icofont-file-pdf"></i> View PDF Report
                            </a>
                          )}
                          {report.report_images?.map((url, idx) => (
                            <a 
                              key={idx}
                              href={`${API_URL}${url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              <i className="icofont-image"></i> Image {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="report-footer">
                      <span className="upload-date">
                        Uploaded: {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quote Submission Modal */}
      {showQuoteModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Lab Test Quotation</h3>
              <button className="modal-close" onClick={() => setShowQuoteModal(false)}>
                <i className="icofont-close"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmitQuote}>
              <div className="modal-body">
                <div className="prescription-summary">
                  <h4>Prescription Details</h4>
                  <p><strong>Patient:</strong> {selectedRequest.patient?.name}</p>
                  <p><strong>Diagnosis:</strong> {selectedRequest.prescription?.diagnosis}</p>
                </div>

                <h4 style={{marginTop: '20px', marginBottom: '15px'}}>Lab Tests Pricing</h4>
                
                <div className="items-list">
                  {quoteForm.testResults.map((test, index) => (
                    <div key={index} className="item-row">
                      <div className="item-fields">
                        <input
                          type="text"
                          placeholder="Test name"
                          value={test.testName}
                          onChange={(e) => handleTestResultChange(index, 'testName', e.target.value)}
                          required
                          style={{ flex: '2' }}
                        />
                        <input
                          type="number"
                          placeholder="Price (৳)"
                          value={test.price}
                          onChange={(e) => handleTestResultChange(index, 'price', e.target.value)}
                          min="0"
                          step="0.01"
                          required
                          style={{ flex: '1' }}
                        />
                      </div>
                      {quoteForm.testResults.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => removeTestResult(index)}
                        >
                          <i className="icofont-close"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-add-item"
                  onClick={addTestResult}
                >
                  <i className="icofont-plus"></i> Add Test
                </button>

                <div className="form-row">
                  <label>Estimated Delivery Time (Optional)</label>
                  <input
                    type="text"
                    value={quoteForm.estimatedDelivery}
                    onChange={(e) => setQuoteForm({...quoteForm, estimatedDelivery: e.target.value})}
                    placeholder="e.g., 24 hours, 2-3 days, Same day"
                  />
                </div>

                <div className="form-row">
                  <label>Additional Notes (Optional)</label>
                  <textarea
                    value={quoteForm.additionalNotes}
                    onChange={(e) => setQuoteForm({...quoteForm, additionalNotes: e.target.value})}
                    placeholder="Additional instructions or information for the patient..."
                    rows="3"
                  />
                </div>

                <div className="total-summary">
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <span>৳{calculateTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQuoteModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Upload Modal */}
      {showReportModal && selectedAcceptedQuotation && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Lab Report</h3>
              <button className="modal-close" onClick={() => setShowReportModal(false)}>
                <i className="icofont-close"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmitReport}>
              <div className="modal-body">
                <div className="quotation-summary">
                  <h4>Quotation Details</h4>
                  <p><strong>Patient:</strong> {selectedAcceptedQuotation.quotation_request?.patient?.name}</p>
                  <p><strong>Amount Paid:</strong> ৳{parseFloat(selectedAcceptedQuotation.total_price).toFixed(2)}</p>
                </div>

                <div style={{ marginTop: '25px', marginBottom: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <h4>Pathologist Information</h4>
                </div>

                <div className="form-row">
                  <label>Pathologist Name <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="text"
                    value={reportForm.pathologistName}
                    onChange={(e) => setReportForm({...reportForm, pathologistName: e.target.value})}
                    placeholder="Dr. John Doe"
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Pathologist Signature</label>
                  <input
                    type="text"
                    value={reportForm.pathologistSignature}
                    onChange={(e) => setReportForm({...reportForm, pathologistSignature: e.target.value})}
                    placeholder="Signature or credentials"
                  />
                </div>

                <div style={{ marginTop: '25px', marginBottom: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <h4>Test Results</h4>
                </div>
                
                <div className="items-list">
                  {reportForm.testResults.map((test, index) => (
                    <div key={index} className="test-result-row">
                      <div className="test-result-fields">
                        <input
                          type="text"
                          placeholder="Test name"
                          value={test.testName}
                          onChange={(e) => handleReportTestChange(index, 'testName', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={test.value}
                          onChange={(e) => handleReportTestChange(index, 'value', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={test.unit}
                          onChange={(e) => handleReportTestChange(index, 'unit', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Reference range"
                          value={test.referenceRange}
                          onChange={(e) => handleReportTestChange(index, 'referenceRange', e.target.value)}
                        />
                        <select
                          value={test.status}
                          onChange={(e) => handleReportTestChange(index, 'status', e.target.value)}
                        >
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      {reportForm.testResults.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => removeReportTest(index)}
                        >
                          <i className="icofont-close"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-add-item"
                  onClick={addReportTest}
                >
                  <i className="icofont-plus"></i> Add Test Result
                </button>

                <div style={{ marginTop: '25px', marginBottom: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <h4>Report Files</h4>
                </div>

                <div className="form-row">
                  <label>PDF Report <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'reportPdf')}
                    required
                  />
                  {reportForm.reportPdf && (
                    <small style={{color: '#48bb78', marginTop: '5px'}}>
                      <i className="icofont-check-circled"></i> {reportForm.reportPdf.name}
                    </small>
                  )}
                </div>

                <div className="form-row">
                  <label>Report Images (Optional)</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => handleFileChange(e, 'reportImages')}
                  />
                  {reportForm.reportImages.length > 0 && (
                    <small style={{color: '#48bb78', marginTop: '5px'}}>
                      <i className="icofont-check-circled"></i> {reportForm.reportImages.length} image(s) selected
                    </small>
                  )}
                </div>

                <div className="form-row">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={reportForm.notes}
                    onChange={(e) => setReportForm({...reportForm, notes: e.target.value})}
                    placeholder="Additional notes or recommendations..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReportModal(false)}
                  disabled={uploadingReport}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploadingReport}
                >
                  {uploadingReport ? 'Uploading...' : 'Upload Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quotation Details Modal */}
      {showDetailsModal && selectedQuotation && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quotation Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <i className="icofont-close"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Lab Tests</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuotation.test_results?.map((test, idx) => (
                      <tr key={idx}>
                        <td>{test.test_name}</td>
                        <td>৳{parseFloat(test.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="detail-section">
                <h4>Summary</h4>
                <div className="summary-details">
                  <div className="summary-item total">
                    <span>Total Amount:</span>
                    <span>৳{parseFloat(selectedQuotation.total_price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedQuotation.additional_notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedQuotation.additional_notes}</p>
                </div>
              )}

              <div className="detail-section">
                <h4>Status</h4>
                <span className={`status-badge status-${selectedQuotation.status}`}>
                  {selectedQuotation.status}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicDashboard;

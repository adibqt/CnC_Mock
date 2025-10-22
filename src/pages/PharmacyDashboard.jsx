import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PharmacyDashboard.css';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quotationRequests, setQuotationRequests] = useState([]);
  const [myQuotations, setMyQuotations] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // pending, submitted
  
  // Modal states
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  
  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    items: [],
    deliveryCharge: 0,
    notes: '',
    estimatedDeliveryTime: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPharmacyData();
  }, []);

  useEffect(() => {
    if (pharmacy?.is_verified) {
      loadQuotationRequests();
      loadMyQuotations();
    }
  }, [pharmacy]);

  const loadPharmacyData = async () => {
    try {
      const token = localStorage.getItem('pharmacy_accessToken');
      if (!token) {
        navigate('/pharmacy-login');
        return;
      }

      const response = await fetch(`${API_URL}/api/pharmacy/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPharmacy(data);
      } else if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('pharmacy_accessToken');
        localStorage.removeItem('pharmacy_userData');
        navigate('/pharmacy-login');
      } else {
        setError('Failed to load pharmacy data');
      }
    } catch (err) {
      console.error('Error loading pharmacy:', err);
      setError('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const loadQuotationRequests = async () => {
    try {
      const token = localStorage.getItem('pharmacy_accessToken');
      const response = await fetch(`${API_URL}/api/quotations/pending`, {
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
      const token = localStorage.getItem('pharmacy_accessToken');
      const response = await fetch(`${API_URL}/api/quotations/my-quotations`, {
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

  const handleLogout = () => {
    localStorage.removeItem('pharmacy_accessToken');
    localStorage.removeItem('pharmacy_userData');
    navigate('/pharmacy-login');
  };

  const openQuoteModal = (request) => {
    setSelectedRequest(request);
    
    // Initialize items from prescription medications
    const medications = request.prescription?.medications || [];
    const items = medications.map(med => ({
      medicine: med.name || '',
      quantity: parseInt(med.duration?.match(/\d+/)?.[0]) || 1,
      unit_price: 0,
      total_price: 0
    }));
    
    setQuoteForm({
      items: items.length > 0 ? items : [{ medicine: '', quantity: 1, unit_price: 0, total_price: 0 }],
      deliveryCharge: 0,
      notes: '',
      estimatedDeliveryTime: '2-3 hours'
    });
    setShowQuoteModal(true);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...quoteForm.items];
    newItems[index][field] = value;
    
    // Auto-calculate total_price
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unit_price) || 0;
      newItems[index].total_price = quantity * unitPrice;
    }
    
    setQuoteForm({ ...quoteForm, items: newItems });
  };

  const addItem = () => {
    setQuoteForm({
      ...quoteForm,
      items: [...quoteForm.items, { medicine: '', quantity: 1, unit_price: 0, total_price: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = quoteForm.items.filter((_, i) => i !== index);
    setQuoteForm({ ...quoteForm, items: newItems });
  };

  const calculateSubtotal = () => {
    return quoteForm.items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (parseFloat(quoteForm.deliveryCharge) || 0);
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    
    // Validation
    if (quoteForm.items.length === 0) {
      alert('Please add at least one item to the quotation');
      return;
    }

    const invalidItems = quoteForm.items.filter(item => 
      !item.medicine.trim() || item.quantity <= 0 || item.unit_price <= 0
    );

    if (invalidItems.length > 0) {
      alert('Please fill in all item details with valid values');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('pharmacy_accessToken');
      const response = await fetch(`${API_URL}/api/quotations/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quotation_request_id: selectedRequest.id,
          quoted_items: quoteForm.items.map(item => ({
            medicine: item.medicine,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.total_price)
          })),
          delivery_charge: parseFloat(quoteForm.deliveryCharge) || 0,
          notes: quoteForm.notes,
          estimated_delivery_time: quoteForm.estimatedDeliveryTime
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

  const viewQuotationDetails = (quotation) => {
    setSelectedQuotation(quotation);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="pharmacy-loading">
        <i className="icofont-spinner-alt-2 icofont-spin"></i>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pharmacy-error">
        <i className="icofont-warning"></i>
        <p>{error}</p>
        <button onClick={handleLogout} className="btn btn-primary">
          Back to Login
        </button>
      </div>
    );
  }

  // Pending Verification View
  if (!pharmacy?.is_verified) {
    return (
      <div className="pharmacy-dashboard">
        {/* Header */}
        <div className="pharmacy-header">
          <div className="header-content">
            <div className="logo">
              <i className="icofont-pills"></i>
              <span>{pharmacy?.pharmacy_name}</span>
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
            <p>Your pharmacy account is currently under review by our admin team.</p>
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
            <div className="pharmacy-details-card">
              <h3>Submitted Information</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Pharmacy Name:</label>
                  <span>{pharmacy?.pharmacy_name}</span>
                </div>
                <div className="detail-item">
                  <label>License Number:</label>
                  <span>{pharmacy?.license_number}</span>
                </div>
                <div className="detail-item">
                  <label>Location:</label>
                  <span>{pharmacy?.city}, {pharmacy?.state}</span>
                </div>
                <div className="detail-item">
                  <label>Phone:</label>
                  <span>{pharmacy?.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verified Pharmacy Dashboard
  return (
    <div className="pharmacy-dashboard">
      {/* Header */}
      <div className="pharmacy-header">
        <div className="header-content">
          <div className="logo">
            <i className="icofont-pills"></i>
            <span>{pharmacy?.pharmacy_name}</span>
          </div>
          <div className="header-info">
            <span className="verified-badge">
              <i className="icofont-check-circled"></i> Verified
            </span>
            <span className="location">
              <i className="icofont-location-pin"></i> {pharmacy?.city}
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
            <div className="stat-icon" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <i className="icofont-prescription"></i>
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
              <div className="stat-value">
                {myQuotations.filter(q => q.status === 'accepted').length}
              </div>
              <div className="stat-label">Accepted Quotations</div>
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
        </div>

        {/* Tab Content */}
        {activeTab === 'pending' && (
          <div className="tab-content">
            {quotationRequests.length === 0 ? (
              <div className="empty-state">
                <i className="icofont-prescription"></i>
                <p>No pending quotation requests</p>
                <span>New requests will appear here</span>
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
                      
                      <div className="medications">
                        <label>Medications:</label>
                        <ul>
                          {request.prescription?.medications?.map((med, idx) => (
                            <li key={idx}>
                              <strong>{med.name}</strong> - {med.dosage}
                              <br />
                              <small>{med.frequency} for {med.duration}</small>
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
                        <p className="prescription-ref">
                          Prescription: {quotation.quotation_request?.prescription?.prescription_id}
                        </p>
                      </div>
                      <span className={`status-badge status-${quotation.status}`}>
                        {quotation.status}
                      </span>
                    </div>
                    
                    <div className="quotation-body">
                      <div className="amount-summary">
                        <div className="amount-row">
                          <span>Subtotal:</span>
                          <span>৳{parseFloat(quotation.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="amount-row">
                          <span>Delivery Charge:</span>
                          <span>৳{parseFloat(quotation.delivery_charge).toFixed(2)}</span>
                        </div>
                        <div className="amount-row total">
                          <span>Total Amount:</span>
                          <span>৳{parseFloat(quotation.total_amount).toFixed(2)}</span>
                        </div>
                      </div>

                      {quotation.estimated_delivery_time && (
                        <div className="delivery-time">
                          <i className="icofont-clock-time"></i>
                          Estimated Delivery: {quotation.estimated_delivery_time}
                        </div>
                      )}
                    </div>

                    <div className="quotation-footer">
                      <span className="submitted-date">
                        Submitted: {new Date(quotation.created_at).toLocaleString()}
                      </span>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => viewQuotationDetails(quotation)}
                      >
                        View Details
                      </button>
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Quotation</h3>
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

                <h4 style={{marginTop: '20px', marginBottom: '15px'}}>Quoted Items</h4>
                
                <div className="items-list">
                  {quoteForm.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-fields">
                        <input
                          type="text"
                          placeholder="Medicine name"
                          value={item.medicine}
                          onChange={(e) => handleItemChange(index, 'medicine', e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Unit Price (৳)"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Total"
                          value={item.total_price}
                          readOnly
                          className="readonly"
                        />
                      </div>
                      {quoteForm.items.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => removeItem(index)}
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
                  onClick={addItem}
                >
                  <i className="icofont-plus"></i> Add Item
                </button>

                <div className="form-row">
                  <label>Delivery Charge (৳)</label>
                  <input
                    type="number"
                    value={quoteForm.deliveryCharge}
                    onChange={(e) => setQuoteForm({...quoteForm, deliveryCharge: e.target.value})}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-row">
                  <label>Estimated Delivery Time</label>
                  <input
                    type="text"
                    value={quoteForm.estimatedDeliveryTime}
                    onChange={(e) => setQuoteForm({...quoteForm, estimatedDeliveryTime: e.target.value})}
                    placeholder="e.g., 2-3 hours, Same day, Next day"
                  />
                </div>

                <div className="form-row">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({...quoteForm, notes: e.target.value})}
                    placeholder="Additional information for the patient..."
                    rows="3"
                  />
                </div>

                <div className="total-summary">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>৳{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery Charge:</span>
                    <span>৳{(parseFloat(quoteForm.deliveryCharge) || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <span>৳{calculateTotal().toFixed(2)}</span>
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
                <h4>Items</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuotation.quoted_items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.medicine}</td>
                        <td>{item.quantity}</td>
                        <td>৳{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td>৳{parseFloat(item.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="detail-section">
                <h4>Summary</h4>
                <div className="summary-details">
                  <div className="summary-item">
                    <span>Subtotal:</span>
                    <span>৳{parseFloat(selectedQuotation.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Delivery Charge:</span>
                    <span>৳{parseFloat(selectedQuotation.delivery_charge).toFixed(2)}</span>
                  </div>
                  <div className="summary-item total">
                    <span>Total Amount:</span>
                    <span>৳{parseFloat(selectedQuotation.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedQuotation.estimated_delivery_time && (
                <div className="detail-section">
                  <h4>Delivery</h4>
                  <p><i className="icofont-clock-time"></i> {selectedQuotation.estimated_delivery_time}</p>
                </div>
              )}

              {selectedQuotation.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedQuotation.notes}</p>
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

export default PharmacyDashboard;

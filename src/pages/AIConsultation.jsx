import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI, authUtils } from '../services/api';
import './AIConsultation.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AIConsultation() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const conversationHistoryRef = useRef([]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load consultation history
  useEffect(() => {
    loadHistory();
    
    // Add welcome message
    setMessages([{
      type: 'ai',
      text: "Hello! I'm your AI Health Assistant. I'm here to help you understand your symptoms and recommend suitable doctors. Please describe what you're experiencing, and I'll do my best to assist you.",
      timestamp: new Date()
    }]);
  }, []);

  const loadHistory = async () => {
    const result = await aiAPI.getConsultationHistory(10);
    if (result.success) {
      setHistory(result.data);
    }
  };

  const loadConsultationDetails = async (consultationId) => {
    try {
      const result = await aiAPI.getConsultation(consultationId);
      if (result.success) {
        const consultation = result.data;
        
        // Clear current messages and start fresh
        const loadedMessages = [];
        
        // Add user message
        loadedMessages.push({
          type: 'user',
          text: consultation.message,
          timestamp: new Date(consultation.created_at)
        });
        
        // Add AI response with symptoms
        if (consultation.symptoms_extracted) {
          loadedMessages.push({
            type: 'ai',
            text: consultation.symptoms_extracted.ai_response || "Here's what I found from your previous consultation:",
            symptoms: consultation.symptoms_extracted,
            emergency: consultation.symptoms_extracted.emergency || false,
            timestamp: new Date(consultation.created_at)
          });
        }
        
        setMessages(loadedMessages);
        
        // Set recommendations if available
        if (consultation.recommended_doctors && consultation.recommended_doctors.recommendations) {
          setRecommendations(consultation.recommended_doctors);
        } else {
          setRecommendations(null);
        }
        
        // Close history sidebar on mobile
        if (window.innerWidth < 1200) {
          setShowHistory(false);
        }
        
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error loading consultation:', err);
      setError('Failed to load consultation details');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      type: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsAnalyzing(true);
    setError('');

    // Add to conversation history
    conversationHistoryRef.current.push({
      role: 'user',
      message: inputText
    });

    try {
      // Analyze symptoms
      const result = await aiAPI.analyzeSymptoms(
        inputText,
        conversationHistoryRef.current.length > 0 ? conversationHistoryRef.current : null
      );

      if (result.success) {
        const data = result.data;
        
        // Add AI response
        const aiMessage = {
          type: 'ai',
          text: data.ai_response || "I've analyzed your symptoms.",
          symptoms: data.symptoms,
          emergency: data.emergency,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Add to conversation history
        conversationHistoryRef.current.push({
          role: 'ai',
          message: data.ai_response,
          symptoms: data.symptoms
        });

        // Set recommendations
        if (data.recommendations && data.recommendations.recommendations) {
          setRecommendations(data.recommendations);
        }

        // Show emergency warning if needed
        if (data.emergency) {
          const emergencyMessage = {
            type: 'emergency',
            text: '⚠️ Based on your symptoms, this might be an emergency. Please seek immediate medical attention or call emergency services!',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, emergencyMessage]);
        }

        // Reload history
        loadHistory();
      } else {
        setError(result.error);
        const errorMessage = {
          type: 'error',
          text: `Sorry, I encountered an error: ${result.error}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Error:', err);
    }

    setIsAnalyzing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Process audio
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
    } catch (error) {
      console.error('Microphone access denied:', error);
      setError('Microphone access denied. Please allow microphone access to use voice input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsAnalyzing(true);
    
    const audioMessage = {
      type: 'user',
      text: '🎤 Voice message',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, audioMessage]);

    try {
      const result = await aiAPI.analyzeAudio(audioBlob);

      if (result.success) {
        const data = result.data;
        
        // Show transcription
        const transcriptionMessage = {
          type: 'transcription',
          text: `Transcription: "${data.transcription || data.symptoms?.ai_response}"`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, transcriptionMessage]);

        // Add AI response
        const aiMessage = {
          type: 'ai',
          text: data.ai_response || data.symptoms?.ai_response || "I've analyzed your voice message.",
          symptoms: data.symptoms,
          emergency: data.emergency,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);

        // Set recommendations
        if (data.recommendations && data.recommendations.recommendations) {
          setRecommendations(data.recommendations);
        }

        // Emergency warning
        if (data.emergency) {
          const emergencyMessage = {
            type: 'emergency',
            text: '⚠️ Based on your symptoms, this might be an emergency. Please seek immediate medical attention!',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, emergencyMessage]);
        }

        loadHistory();
      } else {
        setError(result.error);
        const errorMessage = {
          type: 'error',
          text: `Sorry, I couldn't process your voice message: ${result.error}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      setError('Failed to process audio.');
      console.error('Audio error:', err);
    }

    setIsAnalyzing(false);
  };

  const handleLogout = () => {
    authUtils.logout('patient');
    navigate('/');
  };

  const handleNewConsultation = () => {
    setMessages([{
      type: 'ai',
      text: "Hello! I'm ready to help you with a new consultation. Please describe your symptoms.",
      timestamp: new Date()
    }]);
    setRecommendations(null);
    conversationHistoryRef.current = [];
    setError('');
  };

  return (
    <div className="ai-consultation-page">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-content">
          <div className="ai-header-left">
            <button className="back-btn" onClick={() => navigate('/user-home')}>
              <i className="icofont-arrow-left"></i>
            </button>
            <div className="ai-header-info">
              <h1>🤖 AI Health Assistant</h1>
              <p>Get instant symptom analysis and doctor recommendations</p>
            </div>
          </div>
          <div className="ai-header-right">
            <button 
              className="history-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              <i className="icofont-history"></i>
              History
            </button>
            <button className="new-chat-btn" onClick={handleNewConsultation}>
              <i className="icofont-plus"></i>
              New Chat
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="icofont-logout"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="ai-consultation-container">
        {/* History Sidebar */}
        {showHistory && (
          <div className="history-sidebar">
            <h3>
              <i className="icofont-history"></i>
              Recent Consultations
            </h3>
            <div className="history-list">
              {history.length > 0 ? (
                history.map((item, index) => (
                  <div 
                    key={index} 
                    className="history-item"
                    onClick={() => loadConsultationDetails(item.id)}
                  >
                    <div className="history-date">
                      <i className="icofont-calendar"></i>
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <div className="history-message">{item.message.substring(0, 50)}...</div>
                    {item.symptoms_extracted && item.symptoms_extracted.symptoms && (
                      <div className="history-symptoms">
                        <i className="icofont-stethoscope"></i>
                        {item.symptoms_extracted.symptoms.slice(0, 2).join(', ')}
                        {item.symptoms_extracted.symptoms.length > 2 && '...'}
                      </div>
                    )}
                    <div className="history-view-more">
                      <i className="icofont-eye"></i>
                      View Details
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-history">No previous consultations</p>
              )}
            </div>
          </div>
        )}

        {/* Main Chat Section */}
        <div className="chat-main">
          <div className="chat-section">
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.type}`}>
                  <div className={`message ${msg.type}`}>
                    <div className="message-content">
                      {msg.text}
                      
                      {/* Display symptoms if available */}
                      {msg.symptoms && msg.symptoms.symptoms && msg.symptoms.symptoms.length > 0 && (
                        <div className="symptoms-box">
                          <h4>
                            <i className="icofont-stethoscope"></i>
                            Identified Symptoms:
                          </h4>
                          <ul className="symptoms-list">
                            {msg.symptoms.symptoms.map((symptom, i) => (
                              <li key={i}>{symptom}</li>
                            ))}
                          </ul>
                          <div className="symptom-details">
                            <span className={`severity ${msg.symptoms.severity}`}>
                              Severity: {msg.symptoms.severity}
                            </span>
                            <span className="specialty">
                              Recommended: {msg.symptoms.specialty_needed}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="message-time">
                      {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {isAnalyzing && (
                <div className="message-wrapper ai">
                  <div className="message ai">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <div className="input-section">
              {error && (
                <div className="error-banner">
                  <i className="icofont-warning"></i>
                  {error}
                </div>
              )}
              
              <div className="input-container">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your symptoms... (Press Enter to send)"
                  disabled={isAnalyzing || isRecording}
                  rows="2"
                />
                <div className="input-actions">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`voice-btn ${isRecording ? 'recording' : ''}`}
                    disabled={isAnalyzing}
                    title={isRecording ? 'Stop recording' : 'Start voice input'}
                  >
                    <i className={`icofont-${isRecording ? 'stop' : 'mic'}`}></i>
                    {isRecording && <span className="recording-text">Recording...</span>}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="send-btn"
                    disabled={!inputText.trim() || isAnalyzing || isRecording}
                  >
                    <i className="icofont-paper-plane"></i>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          {recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 && (
            <div className="recommendations-section">
              <h3>
                <i className="icofont-doctor"></i>
                Recommended Doctors
              </h3>
              
              {recommendations.general_advice && (
                <div className="general-advice">
                  <i className="icofont-info-circle"></i>
                  {recommendations.general_advice}
                </div>
              )}

              <div className="doctors-list">
                {recommendations.recommendations.map((doctor, index) => (
                  <div key={index} className="doctor-card">
                    <div className="doctor-header">
                      <div className="doctor-avatar">
                        {doctor.profile_picture_url ? (
                          <img 
                            src={`${API_URL}${doctor.profile_picture_url}`} 
                            alt={doctor.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="avatar-placeholder" style={{ display: doctor.profile_picture_url ? 'none' : 'flex' }}>
                          <i className="icofont-doctor-alt"></i>
                        </div>
                      </div>
                      <div className="doctor-info">
                        <h4>Dr. {doctor.name || 'Not Available'}</h4>
                        <p className="specialization">
                          <i className="icofont-stethoscope"></i>
                          {doctor.specialization}
                        </p>
                        <div className="relevance-badge-inline">
                          <i className="icofont-star"></i>
                          <span className="score">{doctor.relevance_score}</span>
                          <span className="label">/10 Match</span>
                        </div>
                        {doctor.license_number && (
                          <p className="license">
                            <i className="icofont-id-card"></i>
                            License: {doctor.license_number}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {doctor.degrees && doctor.degrees.length > 0 && (
                      <div className="doctor-degrees">
                        <i className="icofont-graduate"></i>
                        {doctor.degrees.map((deg, i) => (
                          <span key={i} className="degree-badge">
                            {deg.degree}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="doctor-reason">
                      <i className="icofont-check-circled"></i>
                      {doctor.reason}
                    </div>

                    <button 
                      className="book-btn"
                      onClick={() => navigate(`/doctor/${doctor.id}`)}
                    >
                      <i className="icofont-ui-calendar"></i>
                      Book Appointment
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

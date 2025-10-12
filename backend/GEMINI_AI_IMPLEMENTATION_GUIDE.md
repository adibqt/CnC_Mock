# Gemini AI Implementation Guide

## 🎯 Project Goal
Integrate Google Gemini AI to:
1. Listen to user health problems (text or audio)
2. Extract and identify symptoms
3. Recommend doctors from database based on symptoms
4. Maintain conversation context for follow-up questions

---

## 📋 Architecture Overview

```
User Input (Text/Audio)
    ↓
Frontend (React)
    ↓
Backend API (FastAPI)
    ↓
Gemini AI Service
    ├── Symptom Analysis
    ├── Specialty Mapping
    └── Doctor Recommendation
    ↓
PostgreSQL Database
    ↓
Return Results to User
```

---

## 🚀 Implementation Steps

### **Phase 1: Backend Setup**

#### Step 1.1: Install Required Packages

```bash
cd backend
.\venv\Scripts\Activate.ps1
pip install google-generativeai
pip install speechrecognition  # For audio transcription
pip install pydub  # For audio processing
pip freeze > requirements.txt
```

#### Step 1.2: Configure Environment Variables

Add to `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

#### Step 1.3: Create AI Service Module

**File: `backend/services/__init__.py`**
```python
# Services package initialization
```

**File: `backend/services/gemini_service.py`**
```python
import google.generativeai as genai
from config import settings
import json

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
    async def analyze_symptoms(self, user_message: str, conversation_history: list = None):
        """
        Analyze user's health description and extract symptoms
        """
        prompt = f'''
        You are a medical AI assistant. Analyze the following patient description 
        and extract structured information.
        
        Patient says: "{user_message}"
        
        Provide response in JSON format:
        {{
            "symptoms": ["symptom1", "symptom2", ...],
            "severity": "mild/moderate/severe",
            "specialty_needed": "cardiology/dermatology/general/etc",
            "follow_up_questions": ["question1", "question2"],
            "emergency": true/false
        }}
        '''
        
        response = self.model.generate_content(prompt)
        return json.loads(response.text)
    
    async def recommend_doctors(self, symptoms_data: dict, available_doctors: list):
        """
        Match symptoms to doctors and rank recommendations
        """
        prompt = f'''
        Based on these symptoms: {symptoms_data}
        And these available doctors: {available_doctors}
        
        Rank the doctors by relevance (1-10) and explain why.
        Return JSON format:
        {{
            "recommendations": [
                {{
                    "doctor_id": 1,
                    "relevance_score": 9,
                    "reason": "specialist in..."
                }}
            ]
        }}
        '''
        
        response = self.model.generate_content(prompt)
        return json.loads(response.text)
```

#### Step 1.4: Update Database Models

**File: `backend/models.py`** - Add consultation table:
```python
class AIConsultation(Base):
    __tablename__ = "ai_consultations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    message_type = Column(String)  # 'text' or 'audio'
    symptoms_extracted = Column(JSON)
    recommended_doctors = Column(JSON)
    conversation_context = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="consultations")
```

#### Step 1.5: Create Migration Script

**File: `backend/migrations/migrate_ai_consultations.py`**
```python
import psycopg2
from psycopg2 import sql

DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "click_and_care"
DB_USER = "postgres"
DB_PASSWORD = "admin"

def create_ai_consultations_table():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        migration = """
        CREATE TABLE IF NOT EXISTS ai_consultations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            message TEXT,
            message_type VARCHAR(50),
            symptoms_extracted JSON,
            recommended_doctors JSON,
            conversation_context JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        cursor.execute(migration)
        print("✅ ai_consultations table created successfully!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    create_ai_consultations_table()
```

#### Step 1.6: Create AI Router

**File: `backend/routers/ai.py`**
```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import User, Doctor, AIConsultation
from schemas import AIConsultationRequest, AIConsultationResponse
from services.gemini_service import GeminiService
import speech_recognition as sr
from io import BytesIO

router = APIRouter(prefix="/api/ai", tags=["AI Consultation"])
gemini_service = GeminiService()

@router.post("/analyze-symptoms", response_model=AIConsultationResponse)
async def analyze_symptoms(
    request: AIConsultationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze user's text input for symptoms and recommend doctors
    """
    # Extract symptoms using Gemini
    symptoms_data = await gemini_service.analyze_symptoms(request.message)
    
    # Query available doctors based on specialty
    specialty = symptoms_data.get("specialty_needed")
    doctors = db.query(Doctor).filter(
        Doctor.specialization == specialty,
        Doctor.is_verified == True,
        Doctor.is_active == True
    ).all()
    
    # Get recommendations
    doctor_list = [{"id": d.id, "name": d.name, "specialization": d.specialization} 
                   for d in doctors]
    recommendations = await gemini_service.recommend_doctors(symptoms_data, doctor_list)
    
    # Save consultation to database
    consultation = AIConsultation(
        user_id=current_user.id,
        message=request.message,
        message_type="text",
        symptoms_extracted=symptoms_data,
        recommended_doctors=recommendations
    )
    db.add(consultation)
    db.commit()
    
    return {
        "symptoms": symptoms_data,
        "recommendations": recommendations,
        "emergency": symptoms_data.get("emergency", False)
    }

@router.post("/analyze-audio")
async def analyze_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Transcribe audio and analyze symptoms
    """
    # Read audio file
    audio_data = await audio.read()
    
    # Transcribe using speech recognition
    recognizer = sr.Recognizer()
    audio_file = sr.AudioFile(BytesIO(audio_data))
    
    with audio_file as source:
        audio_content = recognizer.record(source)
        text = recognizer.recognize_google(audio_content)
    
    # Now analyze the transcribed text
    return await analyze_symptoms(
        AIConsultationRequest(message=text),
        current_user,
        db
    )

@router.get("/consultation-history")
async def get_consultation_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's past AI consultations
    """
    consultations = db.query(AIConsultation).filter(
        AIConsultation.user_id == current_user.id
    ).order_by(AIConsultation.created_at.desc()).limit(10).all()
    
    return {"consultations": consultations}
```

#### Step 1.7: Create Schemas

**File: `backend/schemas.py`** - Add these schemas:
```python
class AIConsultationRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = None

class AIConsultationResponse(BaseModel):
    symptoms: dict
    recommendations: dict
    emergency: bool
```

#### Step 1.8: Update config.py

**File: `backend/config.py`**
```python
# Add to Settings class
gemini_api_key: str = Field(..., env="GEMINI_API_KEY")
```

#### Step 1.9: Register Router in main.py

**File: `backend/main.py`**
```python
from routers import users_router, doctors_router, ai_router

app.include_router(ai_router)
```

---

### **Phase 2: Frontend Implementation**

#### Step 2.1: Create AI Service

**File: `src/services/api.js`** - Add:
```javascript
export const aiAPI = {
  // Analyze text symptoms
  analyzeSymptoms: async (message) => {
    try {
      const response = await api.post('/api/ai/analyze-symptoms', { message });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Analysis failed'
      };
    }
  },

  // Analyze audio
  analyzeAudio: async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await api.post('/api/ai/analyze-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Audio analysis failed'
      };
    }
  },

  // Get consultation history
  getConsultationHistory: async () => {
    try {
      const response = await api.get('/api/ai/consultation-history');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Failed to load history' };
    }
  }
};
```

#### Step 2.2: Create AI Consultation Component

**File: `src/pages/AIConsultation.jsx`**
```javascript
import React, { useState, useRef } from 'react';
import { aiAPI } from '../services/api';
import './AIConsultation.css';

export default function AIConsultation() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = { type: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsAnalyzing(true);

    // Analyze symptoms
    const result = await aiAPI.analyzeSymptoms(inputText);
    
    if (result.success) {
      // Add AI response
      const aiMessage = {
        type: 'ai',
        text: 'I\'ve analyzed your symptoms. Here are my findings:',
        symptoms: result.data.symptoms,
        emergency: result.data.emergency
      };
      setMessages(prev => [...prev, aiMessage]);
      setRecommendations(result.data.recommendations);
    }
    
    setIsAnalyzing(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setIsAnalyzing(true);

        // Send audio for analysis
        const result = await aiAPI.analyzeAudio(audioBlob);
        
        if (result.success) {
          const aiMessage = {
            type: 'ai',
            text: result.data.transcription,
            symptoms: result.data.symptoms
          };
          setMessages(prev => [...prev, aiMessage]);
          setRecommendations(result.data.recommendations);
        }
        
        setIsAnalyzing(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="ai-consultation-container">
      <div className="chat-section">
        <h2>AI Health Consultation</h2>
        
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.text}
              {msg.symptoms && (
                <div className="symptoms-list">
                  <h4>Extracted Symptoms:</h4>
                  <ul>
                    {msg.symptoms.symptoms?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {isAnalyzing && <div className="typing-indicator">AI is analyzing...</div>}
        </div>

        <div className="input-section">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Describe your symptoms..."
          />
          <button onClick={handleSendMessage}>Send</button>
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={isRecording ? 'recording' : ''}
          >
            {isRecording ? '⏹ Stop' : '🎤 Record'}
          </button>
        </div>
      </div>

      {recommendations && (
        <div className="recommendations-section">
          <h3>Recommended Doctors</h3>
          {recommendations.recommendations?.map((rec, index) => (
            <div key={index} className="doctor-card">
              <h4>Dr. {rec.doctor_name}</h4>
              <p>Specialty: {rec.specialization}</p>
              <p>Relevance: {rec.relevance_score}/10</p>
              <p>{rec.reason}</p>
              <button>Book Appointment</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Step 2.3: Create CSS

**File: `src/pages/AIConsultation.css`**
```css
.ai-consultation-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.chat-section {
  flex: 2;
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.messages-container {
  height: 500px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 10px;
}

.message {
  margin: 10px 0;
  padding: 15px;
  border-radius: 10px;
  max-width: 70%;
}

.message.user {
  background: #1A76D1;
  color: white;
  margin-left: auto;
}

.message.ai {
  background: #f0f0f0;
  color: #333;
}

.input-section {
  display: flex;
  gap: 10px;
}

.input-section input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.input-section button {
  padding: 12px 20px;
  background: #1A76D1;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.input-section button.recording {
  background: #ff4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.recommendations-section {
  flex: 1;
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.doctor-card {
  border: 1px solid #ddd;
  padding: 15px;
  margin: 10px 0;
  border-radius: 8px;
}
```

#### Step 2.4: Add Route

**File: `src/App.jsx`**
```javascript
import AIConsultation from './pages/AIConsultation';

// Add route
<Route path="/ai-consultation" element={<AIConsultation />} />
```

---

## 🔧 Configuration Checklist

- [ ] Get Gemini API key from Google
- [ ] Add `GEMINI_API_KEY` to `.env`
- [ ] Install Python packages
- [ ] Create `services/` folder
- [ ] Run migration for `ai_consultations` table
- [ ] Test API endpoints with Swagger
- [ ] Test audio recording in browser
- [ ] Test symptom extraction
- [ ] Test doctor recommendations

---

## 📊 Database Schema

```sql
ai_consultations
├── id (PK)
├── user_id (FK → users)
├── message (TEXT)
├── message_type (VARCHAR)
├── symptoms_extracted (JSON)
├── recommended_doctors (JSON)
├── conversation_context (JSON)
└── created_at (TIMESTAMP)
```

---

## 🧪 Testing Steps

1. **Backend API Test:**
   ```bash
   curl -X POST http://localhost:8000/api/ai/analyze-symptoms \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "I have a headache and fever"}'
   ```

2. **Frontend Test:**
   - Navigate to `/ai-consultation`
   - Type symptoms in chat
   - Click record and speak
   - Verify recommendations appear

---

## 🚀 Next Steps

1. Start with Phase 1, Step 1.1 (Install packages)
2. Get Gemini API key
3. Implement backend step-by-step
4. Test each endpoint
5. Build frontend components
6. Polish UI/UX

Let me know when you're ready to start, and I'll guide you through each step!

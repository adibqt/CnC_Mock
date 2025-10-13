"""
Gemini AI Service for symptom analysis and doctor recommendations
"""

import os
os.environ['GOOGLE_API_KEY'] = ""  # Will be set from config

import google.generativeai as genai
from config import settings
import json
import re
from typing import Dict, List, Optional
from pathlib import Path

class GeminiService:
    """Service for interacting with Google Gemini AI"""
    
    def __init__(self):
        """Initialize Gemini AI with API key"""
        api_key = settings.GEMINI_API_KEY
        
        # Debug: Check if API key is loaded
        if not api_key or api_key == "":
            error_msg = """
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  ERROR: GEMINI_API_KEY NOT FOUND                         ║
╠══════════════════════════════════════════════════════════════╣
║  The Gemini API key is not configured in the .env file.     ║
║                                                              ║
║  Please add this line to backend/.env:                      ║
║  GEMINI_API_KEY=your_api_key_here                          ║
║                                                              ║
║  Current .env file location:                                ║
║  """ + str(Path(__file__).resolve().parent.parent / ".env") + """
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"""
            print(error_msg)
            raise ValueError("GEMINI_API_KEY is required for AI features. Please configure it in the .env file.")
        
        print(f"\nGemini API Key loaded successfully")
        print(f"   • Key length: {len(api_key)} characters")
        print(f"   • Key starts with: {api_key[:15]}...")
        
        # Set environment variable for Google AI
        os.environ['GOOGLE_API_KEY'] = api_key
        
        # Configure genai with API key explicitly
        genai.configure(api_key=api_key)
        
        # Use the 'gemini-pro-latest' model
        model_id = 'gemini-pro-latest'
        self.model = genai.GenerativeModel(model_id)
        print(f"✅ Using Gemini model: {model_id}\n")
        
    def _extract_json_from_response(self, text: str) -> dict:
        """Extract JSON from Gemini response, handling markdown code blocks"""
        try:
            # Try direct JSON parse first
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code block
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Try to find JSON object in text
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            
            # If all fails, return error structure
            return {
                "error": "Could not parse AI response",
                "raw_response": text
            }
    
    async def analyze_symptoms(
        self, 
        user_message: str, 
        conversation_history: Optional[List[dict]] = None
    ) -> Dict:
        """
        Analyze user's health description and extract symptoms
        
        Args:
            user_message: The user's description of their health issue
            conversation_history: Previous messages for context (optional)
            
        Returns:
            Dictionary containing extracted symptoms, severity, specialty, etc.
        """
        
        context = ""
        if conversation_history:
            context = "Previous conversation:\n"
            for msg in conversation_history[-3:]:  # Last 3 messages for context
                context += f"- {msg.get('role', 'user')}: {msg.get('message', '')}\n"
        
        prompt = f'''You are a medical AI assistant analyzing patient symptoms. Be thorough and specific.

{context}

Current patient message: "{user_message}"

CRITICAL: Analyze the ACTUAL symptoms mentioned by the patient. Do NOT give generic responses.

Examples:
- If patient says "headache and fever" → symptoms should be ["headache", "fever"]
- If patient says "chest pain" → symptoms should be ["chest pain"], emergency should be true
- If patient says "I have cancer" → symptoms should be ["suspected cancer diagnosis"], specialty should be "oncology", emergency should be true

Provide your response as PURE JSON (no markdown, no ```json blocks):
{{
    "symptoms": ["list ACTUAL specific symptoms from the message - be specific!"],
    "severity": "mild|moderate|severe",
    "specialty_needed": "general|cardiology|dermatology|neurology|orthopedics|pediatrics|psychiatry|gynecology|ent|ophthalmology|oncology",
    "follow_up_questions": ["relevant questions"],
    "emergency": true|false,
    "ai_response": "Empathetic response acknowledging their SPECIFIC symptoms"
}}

Rules:
- Extract REAL symptoms from the message, not generic ones
- emergency=true for: chest pain, severe bleeding, difficulty breathing, loss of consciousness, suspected cancer, stroke symptoms
- Be SPECIFIC in symptoms list - never use "General health concern"
- In ai_response, mention the actual symptoms they described
'''

        try:
            response = self.model.generate_content(prompt)
            
            # Debug logging
            print(f"\n=== GEMINI RAW RESPONSE ===")
            print(response.text)
            print(f"=== END RAW RESPONSE ===\n")
            
            result = self._extract_json_from_response(response.text)
            
            # Debug logging
            print(f"=== PARSED RESULT ===")
            print(json.dumps(result, indent=2))
            print(f"=== END PARSED RESULT ===\n")
            
            # Validate required fields
            if "symptoms" not in result:
                result["symptoms"] = []
            if "severity" not in result:
                result["severity"] = "moderate"
            if "specialty_needed" not in result:
                result["specialty_needed"] = "general"
            if "emergency" not in result:
                result["emergency"] = False
            if "ai_response" not in result:
                result["ai_response"] = "I understand you're experiencing some health concerns. Let me help you find the right doctor."
                
            return result
            
        except Exception as e:
            print(f"\n!!! GEMINI API ERROR !!!")
            print(f"Error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            print(f"!!! END ERROR !!!\n")
            
            # Return a safe default response
            return {
                "symptoms": ["General health concern"],
                "severity": "moderate",
                "specialty_needed": "general",
                "follow_up_questions": ["Can you describe your symptoms in more detail?"],
                "emergency": False,
                "ai_response": "I'm here to help. Could you tell me more about what you're experiencing?",
                "error": str(e)
            }
    
    async def recommend_doctors(
        self, 
        symptoms_data: Dict, 
        available_doctors: List[Dict]
    ) -> Dict:
        """
        Match symptoms to doctors and rank recommendations
        
        Args:
            symptoms_data: Dictionary containing symptoms and specialty info
            available_doctors: List of available doctors with their details
            
        Returns:
            Dictionary containing ranked doctor recommendations
        """
        
        if not available_doctors:
            return {
                "recommendations": [],
                "message": "No doctors available for this specialty at the moment."
            }
        
        # Create a detailed description of doctors
        doctors_description = "\n".join([
            f"- Doctor ID {d['id']}: {d.get('name', 'Unknown')}, "
            f"Specialization: {d.get('specialization', 'general')}, "
            f"Degrees: {', '.join(d.get('degrees', []))}"
            for d in available_doctors
        ])
        
        prompt = f'''You are a medical recommendation AI. Based on the patient's symptoms and available doctors, rank the doctors by relevance.

Patient Symptoms:
{json.dumps(symptoms_data, indent=2)}

Available Doctors:
{doctors_description}

Provide ONLY valid JSON (no markdown, no code blocks) ranking ALL doctors with this structure:
{{
    "recommendations": [
        {{
            "doctor_id": 1,
            "relevance_score": 9,
            "reason": "Brief explanation of why this doctor is suitable"
        }}
    ],
    "general_advice": "Brief advice for the patient"
}}

Rank ALL available doctors from most to least relevant. Relevance score should be 1-10.
'''

        try:
            response = self.model.generate_content(prompt)
            result = self._extract_json_from_response(response.text)
            
            # Validate structure
            if "recommendations" not in result:
                # Fallback: rank all doctors equally
                result["recommendations"] = [
                    {
                        "doctor_id": d["id"],
                        "relevance_score": 7,
                        "reason": f"Qualified {d.get('specialization', 'general')} specialist"
                    }
                    for d in available_doctors
                ]
            
            # Merge doctor details into recommendations
            doctor_map = {d["id"]: d for d in available_doctors}
            for rec in result["recommendations"]:
                doctor_id = rec["doctor_id"]
                if doctor_id in doctor_map:
                    rec.update(doctor_map[doctor_id])
                    
            return result
            
        except Exception as e:
            print(f"Gemini API Error in recommendations: {str(e)}")
            # Return all doctors with basic ranking
            return {
                "recommendations": [
                    {
                        "doctor_id": d["id"],
                        "name": d.get("name", "Unknown"),
                        "specialization": d.get("specialization", "general"),
                        "relevance_score": 7,
                        "reason": f"Qualified {d.get('specialization', 'general')} specialist",
                        "degrees": d.get("degrees", [])
                    }
                    for d in available_doctors
                ],
                "general_advice": "Please consult with any of these qualified doctors for your condition.",
                "error": str(e)
            }
    
    async def generate_followup(
        self, 
        conversation_history: List[dict]
    ) -> str:
        """
        Generate a follow-up question or response based on conversation history
        
        Args:
            conversation_history: List of previous messages
            
        Returns:
            String with the AI's follow-up response
        """
        
        context = "\n".join([
            f"{msg.get('role', 'user')}: {msg.get('message', '')}"
            for msg in conversation_history[-5:]  # Last 5 messages
        ])
        
        prompt = f'''Based on this medical consultation conversation, generate a helpful follow-up question or response.

Conversation:
{context}

Provide a short, empathetic follow-up question or statement (1-2 sentences) to continue helping the patient.
'''

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return "Is there anything else you'd like to tell me about your symptoms?"

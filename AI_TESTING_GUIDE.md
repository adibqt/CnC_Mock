# AI Consultation Testing Guide

## 🐛 Issue Fixed

**Problem**: AI was giving generic "General health concern" responses for all queries.

**Root Causes**:
1. ❌ Using old model name `gemini-pro` instead of `gemini-1.5-flash`
2. ❌ Prompt wasn't explicit enough about being specific
3. ❌ No debug logging to see what Gemini was returning

**Solutions Applied**:
1. ✅ Updated model to `gemini-1.5-flash`
2. ✅ Enhanced prompt with explicit examples and instructions
3. ✅ Added detailed debug logging to terminal

## 🧪 How to Test

### 1. Check Backend Terminal
The backend server is now running with debug logging. You should see output like:
```
=== GEMINI RAW RESPONSE ===
{actual response from Gemini}
=== END RAW RESPONSE ===

=== PARSED RESULT ===
{parsed JSON result}
=== END PARSED RESULT ===
```

### 2. Test Cases to Try

**Test 1: Simple Symptoms**
- Input: "I have a headache and fever"
- Expected: Should identify "headache" and "fever" as symptoms
- Specialty: "general" or "neurology"

**Test 2: Emergency Case**
- Input: "I have chest pain and difficulty breathing"
- Expected: Should mark emergency=true
- Should show red emergency banner

**Test 3: Serious Condition**
- Input: "I have cancer"
- Expected: Should identify "suspected cancer diagnosis"
- Specialty: "oncology" 
- Emergency: true

**Test 4: Specific Condition**
- Input: "My back hurts when I bend over"
- Expected: Should identify "back pain"
- Specialty: "orthopedics"

**Test 5: Skin Issue**
- Input: "I have a rash on my arm"
- Expected: Should identify "rash"
- Specialty: "dermatology"

### 3. What to Watch For

✅ **Good Signs**:
- Symptoms list shows ACTUAL symptoms you mentioned
- AI response mentions your specific symptoms
- Appropriate doctors are recommended
- Emergency banner appears for serious symptoms

❌ **Bad Signs**:
- "General health concern" in symptoms
- Generic responses
- Check backend terminal for errors

### 4. Common Issues & Fixes

**If you see errors in terminal**:
- Check if Gemini API key is valid
- Check internet connection
- Check API quota/limits

**If still getting generic responses**:
- Copy the "RAW RESPONSE" from terminal
- Check if it contains actual JSON
- Look for any error messages

**If no doctors appear**:
- Check database has doctors with the matching specialty
- Try a condition that matches your database doctors

## 🔧 Backend Changes Made

### File: `backend/services/gemini_service.py`

**Line 14**: Changed model
```python
# OLD: self.model = genai.GenerativeModel('gemini-pro')
# NEW:
self.model = genai.GenerativeModel('gemini-1.5-flash')
```

**Lines 60-90**: Enhanced prompt with specific instructions
```python
prompt = f'''You are a medical AI assistant analyzing patient symptoms. Be thorough and specific.

CRITICAL: Analyze the ACTUAL symptoms mentioned by the patient. Do NOT give generic responses.

Examples:
- If patient says "headache and fever" → symptoms should be ["headache", "fever"]
- If patient says "chest pain" → symptoms should be ["chest pain"], emergency should be true
- If patient says "I have cancer" → symptoms should be ["suspected cancer diagnosis"], specialty should be "oncology"
...
'''
```

**Lines 95-115**: Added comprehensive debug logging

## 📊 Expected Terminal Output

When you send "I have cancer", you should see something like:

```
=== GEMINI RAW RESPONSE ===
{
  "symptoms": ["suspected cancer diagnosis", "general health concern"],
  "severity": "severe",
  "specialty_needed": "oncology",
  "follow_up_questions": ["What type of cancer have you been diagnosed with?", ...],
  "emergency": true,
  "ai_response": "I understand you're dealing with a cancer diagnosis. This is a serious situation that requires immediate attention from an oncology specialist..."
}
=== END RAW RESPONSE ===
```

## 🎯 Next Steps

1. **Test with different symptoms** - Try all test cases above
2. **Check terminal output** - Look for the debug logs
3. **Verify database** - Make sure you have doctors with various specialties
4. **Report results** - Let me know what you see in the terminal

## 💡 Tips

- The backend server auto-reloads when files change
- Terminal shows real-time debug info
- Frontend shows processed results
- Compare terminal output with frontend display

---

**Server Status**: ✅ Running at http://127.0.0.1:8000
**Frontend**: Should be at http://localhost:5174
**API Docs**: http://127.0.0.1:8000/docs

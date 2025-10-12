import google.generativeai as genai
from config import settings
import os

# The settings object from config.py has already loaded the API key
api_key = settings.GEMINI_API_KEY

if not api_key:
    raise ValueError("GEMINI_API_KEY not found. Please ensure it is set in the .env file.")

# Set the API key for the library
os.environ['GOOGLE_API_KEY'] = api_key
genai.configure(api_key=api_key)

print("Querying for available Gemini models...")

try:
    print("Models with 'generateContent' support:")
    for m in genai.list_models():
      if 'generateContent' in m.supported_generation_methods:
        print(f"- {m.name}")
except Exception as e:
    print(f"An error occurred while trying to list the models: {e}")


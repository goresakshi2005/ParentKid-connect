import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load .env from backend
load_dotenv('e:/Orderocks/ParentKid-Connect/parentkid-connect/backend/.env')

api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

try:
    print("Listing available models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Failed to list models: {e}")

import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load .env from backend
load_dotenv('e:/Orderocks/ParentKid-Connect/parentkid-connect/backend/.env')

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key: {api_key[:5]}...{api_key[-5:]}")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-1.5-flash') # Testing known good model
    response = model.generate_content("Hello, say 'Test successful'")
    print(f"1.5-flash response: {response.text}")
except Exception as e:
    print(f"1.5-flash failed: {e}")

try:
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content("Hello, say 'Test successful'")
    print(f"2.5-flash response: {response.text}")
except Exception as e:
    print(f"2.5-flash failed: {e}")

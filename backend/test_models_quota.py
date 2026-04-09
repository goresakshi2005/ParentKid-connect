import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv('e:/Orderocks/ParentKid-Connect/parentkid-connect/backend/.env')
api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

models_to_try = [
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash'
]

for model_name in models_to_try:
    try:
        print(f"Trying {model_name}...")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say hello")
        print(f"Success with {model_name}: {response.text}")
    except Exception as e:
        print(f"Failed with {model_name}: {e}")

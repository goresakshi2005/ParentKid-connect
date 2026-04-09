import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv('e:/Orderocks/ParentKid-Connect/parentkid-connect/backend/.env')
api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

def test_model(model_name):
    try:
        print(f"Testing model: {model_name}")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello, respond in one word.")
        print(f"Success! Response: {response.text}")
        return True
    except Exception as e:
        print(f"Failed: {e}")
        return False

test_model('gemini-2.5-flash')
test_model('gemini-2.0-flash')
test_model('gemini-3-flash-preview')

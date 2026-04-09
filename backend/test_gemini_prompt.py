import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv

# Load .env from backend
load_dotenv('e:/Orderocks/ParentKid-Connect/parentkid-connect/backend/.env')

api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

parent_data = {
    'mood': 'Concerned',
    'thoughts': 'My child is spending too much time on phone',
    'problem': 'Screen time conflict'
}
child_data = {
    'mood': 'Frustrated',
    'thoughts': 'My parent is always nagging me about phone',
    'problem': 'Lack of freedom'
}

prompt = f"""
You are an expert Relationship Intelligence AI specializing in parent–teen communication.
Your role is to deeply analyze inputs from BOTH parent and child, detect emotional gaps, and generate practical, real-world communication guidance separately for each.
INPUT:
Parent:
- Mood: {parent_data.get('mood')}
- Thoughts: {parent_data.get('thoughts')}
- Problem: {parent_data.get('problem')}
Child:
- Mood: {child_data.get('mood')}
- Thoughts: {child_data.get('thoughts')}
- Problem: {child_data.get('problem')}

OUTPUT FORMAT (STRICT JSON):
{{
  "emotion_analysis": {{
    "parent": {{ "emotion": "", "intensity": "" }},
    "child": {{ "emotion": "", "intensity": "" }}
  }},
  "parent_guidance": {{ "child_feelings": "", "avoid": "", "say_this": "", "tone": "", "timing": "" }},
  "child_guidance": {{ "parent_intent": "", "avoid": "", "say_this": "", "approach": "", "timing": "" }},
  "insights": {{
    "root_cause": "",
    "mismatch": "",
    "communication_styles": {{ "parent": "", "child": "" }},
    "alignment_score": 0,
    "summary": ""
  }},
  "conversation_preview": [
    {{"parent": ""}},
    {{"child": ""}}
  ],
  "actions": [],
  "confidence_score": 0
}}
"""

try:
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content(prompt)
    print(f"Response text: {response.text}")
    json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
    if json_match:
        data = json.loads(json_match.group(0))
        print("Successfully parsed JSON")
    else:
        print("Could not parse AI response")
except Exception as e:
    print(f"Failed: {e}")

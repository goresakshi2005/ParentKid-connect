import google.generativeai as genai
from django.conf import settings
import json
import re

genai.configure(api_key=settings.GEMINI_API_KEY)

class EarlyChildhoodAIEngine:
    @staticmethod
    def analyze_childhood_data(data, historical_data=None):
        prompt = f"""
        You are an expert early childhood development AI (0–6 years).

        Your goal is to analyze the child's DEFICIENCY and provide:
        - What to do
        - How to do (step-by-step)
        - Why it is happening
        - Personalized plan based on EXISTING DATA

        INPUT:
        - Age: {data.get('age', 'N/A')}
        - Problem: {data.get('problem_selected', 'N/A')}
        - Symptoms: {data.get('symptoms', data.get('parent_text', 'N/A'))}

        EXISTING DATA:
        - Screen Time: {data.get('screen_time', 'N/A')} hours
        - Sleep: {data.get('sleep_hours', 'N/A')} hours
        - Emotional Score: {data.get('emotional_score', 'N/A')}
        - Routine Score: {data.get('routine_score', 'N/A')}
        - Behavior Score: {data.get('behavior_score', 'N/A')}

        DEVELOPMENTAL OBSERVATIONS:
        - Speech ability: {data.get('speech_status', 'N/A')}
        - Responds to name: {data.get('response_name', 'N/A')}
        - Eye contact: {data.get('eye_contact', 'N/A')}
        - Motor skills: {data.get('motor_skills', 'N/A')}
        - Social interaction: {data.get('social_behavior', 'N/A')}
        - Eating pattern: {data.get('eating_habit', 'N/A')}

        TASK:
        1. Identify deficiency
        2. Explain WHY it is happening (based on existing data)
        3. Suggest WHAT TO DO
        4. Give HOW TO DO (step-by-step actionable)
        5. Analyze existing good/bad habits
        6. Provide daily routine plan
        7. Give expected improvement timeline

        OUTPUT FORMAT (STRICT JSON):
        {{
            "deficiency": "Identify the primary deficiency or concern",
            "why_it_is_happening": "Explain WHY it is happening based on existing data",
            "what_to_do": "Suggest WHAT TO DO (Overall strategy)",
            "how_to_do": ["Step 1", "Step 2", "Step 3", "Step 4"],
            "good_habits": ["Good habit 1", "Good habit 2"],
            "bad_habits": ["Bad habit 1", "Bad habit 2"],
            "daily_routine_plan": {{
                "morning": "Morning routine suggestion",
                "afternoon": "Afternoon routine suggestion",
                "evening": "Evening routine suggestion"
            }},
            "expected_improvement_timeline": "Give expected improvement timeline (e.g., '2-4 weeks')"
        }}

        IMPORTANT RULES:
        - Output strictly as parsing-friendly JSON without triple backticks if possible.
        - Give only practical, real-life advice.
        - Adapt advice for standard households (low-cost, accessible).
        - Use simple, warm, and highly encouraging language tailored for parents.
        - The language of response/output MUST be extremely easy to understand for early childhood tracking.
        - Avoid technical or medical jargon; write at an easy reading level.
        """
        
        try:
            model = genai.GenerativeModel('gemini-3-flash-preview')
            response = model.generate_content(prompt)
            
            if not response or not response.text:
                return {"error": "AI returned an empty response. Please try with more descriptive input."}
                
            raw_text = response.text.strip()
            raw_text = re.sub(r'^```json\s*', '', raw_text)
            raw_text = re.sub(r'\s*```$', '', raw_text)
            
            json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError as je:
                    return {"error": "Failed to parse AI insights.", "details": str(je)}
            else:
                return {"error": "AI response format was invalid.", "raw": raw_text[:500]}
                
        except Exception as e:
            error_msg = str(e)
            return {"error": f"Analysis failed: {error_msg}"}

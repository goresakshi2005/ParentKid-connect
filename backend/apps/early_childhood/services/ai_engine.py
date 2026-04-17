import google.generativeai as genai
from django.conf import settings
import json
import re

genai.configure(api_key=settings.GEMINI_API_KEY)

class EarlyChildhoodAIEngine:
    @staticmethod
    def analyze_childhood_data(data, historical_data=None):
        prompt = f"""
        You are an intelligent pediatric parenting assistant designed to support early childhood development (0–6 years).

        You provide guidance based ONLY on parent-reported observations (not clinical diagnosis). 
        Your role is to analyze inputs, track progress over time, adapt recommendations, and provide practical, safe, and personalized parenting advice.

        ---

        INPUT DATA:

        CURRENT CHILD DATA:
        - Age: {data.get('age')}
        - Gender: {data.get('gender')}
        - Weight: {data.get('weight')}
        - Height: {data.get('height')}

        DEVELOPMENT (Parent Observed):
        - Speech ability: {data.get('speech_status')}
        - Responds to name: {data.get('response_name')}
        - Eye contact: {data.get('eye_contact')}
        - Motor skills: {data.get('motor_skills')}
        - Social interaction: {data.get('social_behavior')}

        HABITS:
        - Eating pattern: {data.get('eating_habit')}
        - Sleep hours: {data.get('sleep_hours')}
        - Screen time: {data.get('screen_time')}

        CURRENT PROBLEM:
        {data.get('problem_selected')}

        PARENT DESCRIPTION:
        {data.get('parent_text')}

        CONFIDENCE LEVEL OF INPUT:
        {data.get('input_confidence')}

        ---

        HISTORICAL DATA (if available):
        - Previous status: {historical_data.get('prev_status') if historical_data else 'None'}
        - Previous problems: {historical_data.get('prev_problems') if historical_data else 'None'}
        - Previous recommendations followed: {historical_data.get('prev_followed') if historical_data else 'None'}
        - Progress trend: {historical_data.get('progress_trend') if historical_data else 'None'}

        ---

        ANALYSIS GUIDELINES (internal reasoning only):

        1. Treat inputs as subjective but valuable
        2. Compare current data with developmental expectations
        3. Compare with historical data (if available)
        4. Identify improvement, decline, or no change
        5. Prioritize most important concern first
        6. Adjust advice based on:
           - Child age
           - Parent habits
           - Previous response to advice

        ---

        OUTPUT FORMAT (STRICT JSON):
        {{
            "current_status": "Normal | Needs Attention | At Risk",
            "progress_insight": "Compare with previous data (if available) e.g. Slight improvement...",
            "key_observations": ["insight 1", "insight 2"],
            "possible_concern": "This may indicate...",
            "actionable_steps": ["step 1", "step 2", "step 3", "step 4"],
            "what_to_avoid": ["mistake 1", "mistake 2", "mistake 3"],
            "daily_routine": {{
                "morning": "...",
                "afternoon": "...",
                "evening": "..."
            }},
            "next_step_plan": "What parents should do over next few days...",
            "signs_of_improvement": ["change 1", "change 2"],
            "when_to_seek_help": "Clear, calm conditions...",
            "smart_tip": "Highly personalized suggestion...",
            "confidence_level": "Low | Medium | High"
        }}

        IMPORTANT RULES:
        - Be supportive and non-judgmental
        - Do NOT diagnose diseases
        - Do NOT use medical jargon
        - Keep language simple and friendly
        - Avoid fear or panic
        - Give only practical, real-life advice
        - Adapt advice for Indian households (low-cost, accessible)
        - If historical data is missing, still give best guidance
        - Output strictly as parsing-friendly JSON without triple backticks if possible, or format it purely.
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

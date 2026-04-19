# backend/apps/screen_monitor/ai_service.py

import google.generativeai as genai
from django.conf import settings
import json
import re
import logging

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

class ScreenTimeIntelligenceEngine:
    @staticmethod
    def analyze_usage(child_name, age, apps_data):
        """
        Analyzes app-wise screen time data and returns structured insights.
        apps_data should be a dict: {"AppName": minutes, ...}
        """
        prompt = f"""
        You are an advanced AI-powered Parenting Intelligence System integrated into a real-time Parent Dashboard.
        Your task is to analyze a teenager's app-wise screen time data and generate structured, UI-friendly insights.

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📥 INPUT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Child:
        * Name: {child_name}
        * Age: {age}

        App Usage Data (minutes):
        {json.dumps(apps_data, indent=2)}

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🧠 ANALYSIS STEPS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        1. Calculate:
           * Total screen time
           * Top app

        2. Categorize apps:
           * Education
           * Social Media
           * Entertainment
           * Productivity (if applicable)

        3. For EACH app:
           * Keep ORIGINAL usage time (VERY IMPORTANT)
           * Classify usage level:
             * low (<30)
             * moderate (30–60)
             * high (60–120)
             * excessive (>120)
           * Assign status:
             * Good / Warning / Risk
           * Generate:
             * short insight (1 line only)
             * risk reason (if any)
             * actionable suggestion

        4. Overall analysis:
           * Risk level (low / medium / high)
           * Behavior pattern
           * Positive signals

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📤 OUTPUT (STRICT JSON)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        {{
          "child_name": "{child_name}",
          "total_screen_time": 0,
          "apps_usage": [
            {{
              "app_name": "",
              "usage_time_minutes": 0,
              "category": "",
              "usage_level": "low | moderate | high | excessive",
              "status": "Good | Warning | Risk",
              "insight": "",
              "risk_reason": "",
              "suggestion": ""
            }}
          ],
          "top_app": "",
          "overall": {{
            "risk_level": "low | medium | high",
            "summary": "",
            "main_issue": "",
            "positive_note": ""
          }},
          "alert": {{
            "show": true,
            "message": ""
          }},
          "parent_action": {{
            "primary_action": "",
            "extra_action": ""
          }},
          "ui_flags": {{
            "color": "green | yellow | red"
          }}
        }}

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📏 RULES (VERY IMPORTANT)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        * MUST include "usage_time_minutes" for EVERY app
        * DO NOT remove or modify actual usage numbers
        * Keep responses SHORT (UI friendly)
        * Insight must be 1 line only
        * Summary must be 10–15 words max
        * Output ONLY JSON (no extra text)
        """

        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            if not response or not response.text:
                return {"error": "AI returned an empty response."}
                
            raw_text = response.text.strip()
            # Remove markdown formatting if present
            raw_text = re.sub(r'^```json\s*', '', raw_text)
            raw_text = re.sub(r'\s*```$', '', raw_text)
            
            json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                return {"error": "AI response format was invalid.", "raw": raw_text[:500]}
                
        except Exception as e:
            logger.error(f"Screen Intelligence AI Error: {str(e)}")
            return {"error": f"Analysis failed: {str(e)}"}
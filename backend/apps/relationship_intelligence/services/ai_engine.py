import google.generativeai as genai
from django.conf import settings
import json
import re

genai.configure(api_key=settings.GEMINI_API_KEY)

class RelationshipIntelligenceEngine:
    @staticmethod
    def analyze_communication(parent_data, child_data):
        prompt = f"""
        You are an expert Relationship Intelligence AI specializing in parent–teen communication.

        Your role is to deeply analyze inputs from BOTH parent and child, detect emotional gaps, and generate practical, real-world communication guidance separately for each.

        --------------------------------------------------

        INPUT:

        Parent:
        - Mood: {parent_data.get('mood')}
        - Thoughts: {parent_data.get('thoughts')}
        - Problem: {parent_data.get('problem')}

        Child:
        - Mood: {child_data.get('mood')}
        - Thoughts: {child_data.get('thoughts')}
        - Problem: {child_data.get('problem')}

        --------------------------------------------------

        TASKS:

        1. Emotion Detection
        - Identify clear and hidden emotions for both parent and child
        - Use labels like: stress, frustration, fear, pressure, care, confusion, anger, sadness

        2. Emotion Intensity
        - Assign intensity (Low / Medium / High)

        3. Mismatch Detection
        - Identify misunderstanding between parent and child
        - Highlight mismatch between intention vs perception

        4. Root Cause Identification
        - Identify the deeper issue (not surface-level)
        (e.g., pressure, lack of trust, communication gap, expectations mismatch, emotional disconnect)

        5. Communication Style Analysis
        Classify:
        - Parent: (strict / emotional / logical / reactive / supportive)
        - Child: (defensive / expressive / sensitive / avoidant / confused)

        6. Generate SEPARATE Guidance:

        For Parent:
        - What child is actually feeling (clear insight)
        - What NOT to say (1–2 lines)
        - What TO say (2–3 exact sentences, calm & supportive)
        - Tone to use
        - Best timing to talk

        For Child:
        - What parent actually means (clear insight)
        - What NOT to say
        - What TO say (2–3 respectful sentences)
        - How to express feelings properly
        - Best approach to start conversation

        7. Conversation Preview
        - Generate a short ideal conversation (3–4 exchanges)

        8. Alignment Score
        - Score from 0–100
        - Based on emotional alignment + understanding

        9. Actionable Suggestions
        - Give 2–3 specific real-life actions (not generic advice)

        10. Confidence Score
        - Score from 0–100
        - Based on:
          - clarity of inputs
          - completeness of emotional data

        --------------------------------------------------

        OUTPUT FORMAT (STRICT JSON):

        {{
          "emotion_analysis": {{
            "parent": {{
              "emotion": "",
              "intensity": ""
            }},
            "child": {{
              "emotion": "",
              "intensity": ""
            }}
          }},
          "parent_guidance": {{
            "child_feelings": "",
            "avoid": "",
            "say_this": "",
            "tone": "",
            "timing": ""
          }},
          "child_guidance": {{
            "parent_intent": "",
            "avoid": "",
            "say_this": "",
            "approach": "",
            "timing": ""
          }},
          "insights": {{
            "root_cause": "",
            "mismatch": "",
            "communication_styles": {{
              "parent": "",
              "child": ""
            }},
            "alignment_score": "",
            "summary": ""
          }},
          "conversation_preview": [
            {{"parent": ""}},
            {{"child": ""}},
            {{"parent": ""}},
            {{"child": ""}}
          ],
          "actions": [],
          "confidence_score": ""
        }}

        --------------------------------------------------

        RULES:

        - Be practical and realistic (no theory)
        - Use simple, human-friendly language
        - Do NOT blame parent or child
        - Focus on resolving communication gap
        - Avoid generic advice
        - Keep suggestions emotionally safe and actionable
        - Ensure "say_this" outputs are natural and usable in real life
        """
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                return {"error": "Could not parse AI response", "raw": response.text}
        except Exception as e:
            return {"error": str(e)}


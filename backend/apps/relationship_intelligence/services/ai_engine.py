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
            model = genai.GenerativeModel('gemini-3-flash-preview')
            response = model.generate_content(prompt)
            
            if not response or not response.text:
                return {"error": "AI returned an empty response. Please try with more descriptive input."}
                
            # Extract JSON from response
            raw_text = response.text.strip()
            
            # Remove markdown formatting if present
            raw_text = re.sub(r'^```json\s*', '', raw_text)
            raw_text = re.sub(r'\s*```$', '', raw_text)
            
            json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError as je:
                    return {"error": "Failed to parse AI insights. Please try again.", "details": str(je), "raw": raw_text[:500]}
            else:
                return {"error": "AI response format was invalid. Please try again.", "raw": raw_text[:500]}
                
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                return {"error": "AI Service is temporarily busy due to high demand. Please wait 30-60 seconds and try again."}
            print(f"Relationship AI Error: {error_msg}")
            return {"error": f"Communication analysis failed: {error_msg}"}


class MagicFixEngine:
    @staticmethod
    def get_magic_fix(problem, behavior, age, mood, context):
        prompt = f"""
        You are the core engine behind a "Magic Fix" parenting tool.
        You generate instant, swipeable solution cards that feel magical, fast, and easy.
        
        ========================
        🪄 CORE GOAL:
        ========================
        - Instantly fix parent-child conflict
        - Give super quick, practical actions
        - Make it feel like magic (effortless, smooth, helpful)
        - Zero thinking required from parent
        
        ========================
        ⚠️ STRICT RULES:
        ========================
        - NO explanations or theory
        - NO long text
        - ONLY actions
        - Max response length: 60-80 words
        - Use very simple, friendly language
        - Tone: calm, warm, reassuring
        - NEVER suggest punishment or harsh discipline
        - Focus on calming and resolving immediately
        
        ========================
        🧠 SMART ADAPTATION:
        ========================
        - Age-aware response (6-18)
        - Mood-aware:
          Angry -> de-escalate
          Sad -> comfort
          Silent -> gentle approach
          Resistant -> indirect approach
        - Identify root cause in 1 short line
        
        ========================
        ✨ MAGIC EXPERIENCE STYLE:
        ========================
        - Feels like: "I’ve got this 🤝"
        - Each step should feel easy and natural
        - Use soft action words (pause, sit, say, listen)
        - No pressure, no judgment
        
        ========================
        ⚡ OUTPUT FORMAT (STRICT JSON ONLY):
        ========================
        {{
          "why": "1 very short reason",
          "step1": "instant calming action",
          "step2": "exact sentence parent should say",
          "step3": "simple bonding action",
          "next": "what to do after a few minutes",
          "avoid": ["mistake 1", "mistake 2"]
        }}
        
        ========================
        📥 INPUT:
        ========================
        Parent Problem: {problem}
        Child Behavior: {behavior}
        Child Age: {age}
        Child Mood: {mood}
        Situation: {context}
        
        ========================
        🎯 FINAL INSTRUCTION:
        ========================
        Return output like magical action cards. Keep it ultra-short, smooth, and instantly usable. Make the parent feel guided without thinking.
        Ensure your response is valid JSON format.
        """
        
        try:
            # Using standard recommended model
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
                    return {"error": "Failed to parse Magic Fix response. Please try again.", "details": str(je), "raw": raw_text[:500]}
            else:
                return {"error": "AI response format was invalid. Please try again.", "raw": raw_text[:500]}
                
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                return {"error": "AI Service is temporarily busy due to high demand. Please wait 30-60 seconds and try again."}
            print(f"Magic Fix AI Error: {error_msg}")
            return {"error": f"Magic Fix failed: {error_msg}"}


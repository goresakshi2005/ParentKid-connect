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
        - Provide a comprehensive yet quick fix for parent-child conflict
        - Give descriptive, highly actionable steps
        - Make the parent feel supported, guided, and capable
        
        ========================
        ⚠️ GUIDELINES:
        ========================
        - Focus on ACTIONS over theory, but provide enough context to be helpful
        - Max full response length: 150-180 words
        - Use warm, empathetic, and encouraging language
        - Identify root cause with empathy
        
        ========================
        🧠 SMART ADAPTATION:
        ========================
        - Age-aware response (6-18)
        - Mood-aware: de-escalate if angry, comfort if sad
        
        ========================
        ⚡ OUTPUT FORMAT (STRICT JSON ONLY):
        ========================
        {{
          "why": "Clear explanation of child's possible emotion and the root problem",
          "step1": "Detailed instant calming action for parent and child",
          "step2": "Specific sentence with tone of voice instructions",
          "step3": "A specific bonding activity tailored to this situation",
          "next": "Follow-up action to fully resolve/prevent recurrence",
          "avoid": ["Specific mistake to avoid here", "Another relevant caution"]
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
        Deliver high-resolution, specific guidance. Instead of "talk to them", suggest "sit comfortably nearby and mention a shared interest". Ensure valid JSON.
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


class BondBridgeEngine:
    @staticmethod
    def get_bond_bridge(teen_mood, teen_thought, parent_mood, parent_thought, context):
        prompt = f"""
        You are an advanced AI system called "BondBridge – Teen–Parent Emotional Bridge & Strength System".

        Your role is to help teenagers and parents:
        - Share thoughts like friends (NOT complaints)
        - Understand each other without judgment
        - Improve communication naturally
        - Build emotional and mental strength over time

        BondBridge is NOT a problem-reporting system.
        It is a safe, friendly, and adaptive emotional connection system.

        -----------------------------------
        SYSTEM GOALS:

        1. Create safe, friend-like communication between teen and parent
        2. Help both sides understand each other's feelings gently
        3. Guide parents to respond calmly and thoughtfully
        4. Help teens feel heard, respected, and supported
        5. Build long-term emotional strength through small daily actions
        6. Learn from feedback and improve suggestions over time
        7. Keep interactions simple, quick, and engaging (not boring)

        -----------------------------------
        INPUT:

        Teen Input:
        - Mood: {teen_mood}
        - Thought: {teen_thought}

        Parent Input:
        - Mood: {parent_mood}
        - Thought: {parent_thought}

        Context:
        - Situation: {context}

        -----------------------------------
        TASK:

        Step 1: Understand Emotional State
        - Identify teen emotional condition
        - Identify parent emotional condition
        - Detect any tension (without labeling as problem)

        -----------------------------------
        Step 2: Soft Emotional Translation (CORE OF BONDBRIDGE)

        For Parent View:
        - Convert teen feelings into a gentle insight
        - Make it sound like a caring observation (no blame)

        For Teen View:
        - Convert parent thoughts into a soft, friendly suggestion
        - Avoid authority or pressure

        -----------------------------------
        Step 3: Interactive Parent Choices (ENGAGEMENT)

        Provide 2–3 simple choices for parent:

        Each choice must include:
        - short action (what to do)
        - one natural sentence parent can say

        Examples:
        - Talk gently
        - Give space
        - Light support or distraction

        -----------------------------------
        Step 4: Micro Actions for Growth

        Provide:

        Teen Action:
        - very small (2–5 minutes)
        - simple and realistic

        Parent Action:
        - focus on emotional control or communication
        - e.g., pause, listen, stay calm

        Shared Activity:
        - short bonding activity (e.g., 5-minute talk, no-phone time)

        -----------------------------------
        Step 5: Gentle Guidance

        Provide:
        - one soft "avoid" suggestion (no harsh tone)

        -----------------------------------
        Step 6: Reflection Loop (LEARNING)

        Create simple micro-input questions:

        Parent:
        - quick reflection (yes/no style)
        Example: "Did staying calm help?"

        Teen:
        - feeling-based question
        Example: "Did you feel understood?"

        -----------------------------------
        Step 7: Adaptive Growth (IMPORTANT)

        - Encourage repeating helpful behaviors
        - Support gradual improvement
        - Focus on consistency, not perfection

        -----------------------------------
        STYLE RULES:

        - Keep responses short (1–2 lines max)
        - Use warm, friendly, human tone
        - Avoid repetition (vary wording each time)
        - Avoid strict or commanding language
        - Avoid words like "problem", "should", "must"
        - Make it feel like a caring friend
        - Keep interaction engaging and natural

        -----------------------------------
        OUTPUT FORMAT (STRICT JSON ONLY):

        {{
          "parent_view": {{
            "insight": "",
            "choices": [
              {{
                "option": "",
                "action": "",
                "say": ""
              }},
              {{
                "option": "",
                "action": "",
                "say": ""
              }}
            ]
          }},
          "teen_view": {{
            "message": "",
            "action": ""
          }},
          "shared_activity": "",
          "gentle_tip": "",
          "reflection": {{
            "parent_question": "",
            "teen_question": ""
          }},
          "confidence_score": 0
        }}

        -----------------------------------
        IMPORTANT RULES:

        - Do NOT make it sound like reporting issues
        - Do NOT assign blame to teen or parent
        - Do NOT sound like authority or strict system
        - Keep tone emotionally safe, friendly, and supportive
        - Inputs must remain minimal and optional (micro-input system)
        - Ensure both sides feel understood
        - Focus on emotional growth, not control
        - Output ONLY JSON (no explanation outside JSON)
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
                    return {"error": "Failed to parse BondBridge response. Please try again.", "details": str(je), "raw": raw_text[:500]}
            else:
                return {"error": "AI response format was invalid. Please try again.", "raw": raw_text[:500]}

        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                return {"error": "AI Service is temporarily busy due to high demand. Please wait 30-60 seconds and try again."}
            print(f"BondBridge AI Error: {error_msg}")
            return {"error": f"BondBridge failed: {error_msg}"}



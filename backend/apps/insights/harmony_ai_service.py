# backend/apps/insights/harmony_ai_service.py

import json
import re
import logging
import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)
genai.configure(api_key=settings.GEMINI_API_KEY)


class HarmonyAIEngine:
    """
    Parent-Child Harmony AI – Decision Intelligence Engine.
    Combines structured summaries from multiple subsystems and produces
    actionable parenting guidance in a strict JSON schema.
    """

    SYSTEM_PROMPT = """
You are an advanced AI system called "Parent-Child Harmony AI".

You act as a decision intelligence engine for parents by combining outputs from multiple systems:
- Screen Behavior Analysis
- Voice Emotion Detection
- Psychological Assessment
- Relationship Intelligence

You DO NOT analyze raw data.
You ONLY use structured summaries provided below.

Your goal is to help parents understand their child's current state and guide them on what action to take RIGHT NOW.

-----------------------------------
INPUT:

Screen Behavior Summary:
{screen_summary}

Emotional Analysis:
{emotion_summary}

Assessment Summary:
{assessment_summary}

Relationship Summary:
{relationship_summary}

Behavior Flags:
{behavior_flags}

Recent Pattern:
{recent_pattern}

-----------------------------------
TASK:

Step 1: Understand the Child's Current State
- Combine all inputs
- Identify behavior type (addicted / balanced / resistant / stressed)
- Identify emotional condition (frustrated / calm / overwhelmed / angry / sad)

Step 2: Predict Conflict Risk (0-100)
- Consider:
  - Screen overuse
  - Emotional disturbance
  - Relationship quality
  - Assessment risk level
- Classify level:
  LOW (0-40), MEDIUM (41-70), HIGH (71-100)

Step 3: Simulate Parenting Actions

Simulate realistic outcomes for each:

A. Restrict Phone (strict control)
B. Calm Talk (empathetic conversation)
C. Ignore Behavior (no action)

For EACH:
- Predict child reaction
- Predict conflict level (LOW / MEDIUM / HIGH)
- Keep realistic (child may resist or react emotionally)

Step 4: Select Best Strategy
- Choose the most effective parenting approach
- Must be realistic and situation-based
- Explain WHY it is best

Step 5: Provide Parent Guidance
- Give exact sentence parent should say (natural, human-like)
- Tone (calm / supportive / firm)
- Timing (when to approach child)
- What to avoid saying

-----------------------------------
OUTPUT FORMAT (STRICT JSON ONLY):

{{
  "child_state": {{
    "summary": "",
    "behavior_type": "",
    "emotional_condition": ""
  }},
  "conflict_prediction": {{
    "score": 0,
    "level": "LOW | MEDIUM | HIGH",
    "reason": ""
  }},
  "simulations": {{
    "restrict_phone": {{
      "reaction": "",
      "conflict_level": ""
    }},
    "calm_talk": {{
      "reaction": "",
      "conflict_level": ""
    }},
    "ignore": {{
      "reaction": "",
      "conflict_level": ""
    }}
  }},
  "best_strategy": {{
    "recommended_action": "",
    "why": ""
  }},
  "parent_guidance": {{
    "what_to_say": "",
    "tone": "",
    "timing": "",
    "avoid": ""
  }},
  "confidence_score": 0
}}

-----------------------------------
IMPORTANT RULES:

- Use ALL inputs together (not individually)
- Be realistic (children may argue, resist, or react emotionally)
- Avoid generic parenting advice
- Focus on practical, real-life situations
- Keep language simple and human-like
- Do NOT output anything outside JSON
- Do NOT include explanations outside JSON
- Ensure valid JSON format

-----------------------------------
Now analyze the input and return the result.
"""

    @staticmethod
    def _build_screen_summary(screen_data):
        """Converts raw screen intelligence data into a structured summary."""
        if not screen_data:
            return "No screen time data available for this child."

        parts = []
        total = screen_data.get("total_screen_time", 0)
        top_app = screen_data.get("top_app", "Unknown")
        overall = screen_data.get("overall", {})
        risk = overall.get("risk_level", "unknown")
        summary = overall.get("summary", "")
        main_issue = overall.get("main_issue", "")

        parts.append(f"Total screen time today: {total} minutes.")
        parts.append(f"Top app: {top_app}.")
        parts.append(f"Risk level: {risk}.")
        if summary:
            parts.append(f"Summary: {summary}")
        if main_issue:
            parts.append(f"Main issue: {main_issue}")

        apps_usage = screen_data.get("apps_usage", [])
        if apps_usage:
            heavy = [a for a in apps_usage if a.get("usage_level") in ("high", "excessive")]
            if heavy:
                names = ", ".join(a.get("app_name", "") for a in heavy)
                parts.append(f"Heavy usage apps: {names}.")

        alert = screen_data.get("alert", {})
        if alert.get("show"):
            parts.append(f"ALERT: {alert.get('message', '')}")

        return " ".join(parts)

    @staticmethod
    def _build_emotion_summary(voice_data):
        """Converts voice assessment results into an emotion summary."""
        if not voice_data:
            return "No voice emotion data available."

        parts = []
        stress = voice_data.get("stress_score", 0)
        confidence = voice_data.get("confidence_score", 0)
        fatigue = voice_data.get("fatigue_score", 0)
        stress_level = voice_data.get("stress_level", "unknown")

        parts.append(f"Stress score: {stress}/100 ({stress_level}).")
        parts.append(f"Confidence score: {confidence}/100.")
        parts.append(f"Fatigue score: {fatigue}/100.")

        insights = voice_data.get("insights", [])
        if insights:
            parts.append(f"Voice insights: {'; '.join(insights[:3])}")

        return " ".join(parts)

    @staticmethod
    def _build_assessment_summary(assessment_data):
        """Converts assessment results into a summary."""
        if not assessment_data:
            return "No psychological assessment data available."

        parts = []
        final_score = assessment_data.get("final_score", 0)
        risk_level = assessment_data.get("risk_level", "unknown")
        health = assessment_data.get("health_score", 0)
        behavior = assessment_data.get("behavior_score", 0)
        emotional = assessment_data.get("emotional_score", 0)
        routine = assessment_data.get("routine_score", 0)

        parts.append(f"Overall assessment score: {final_score}/100.")
        parts.append(f"Risk level: {risk_level}.")
        parts.append(f"Health: {health}, Behavior: {behavior}, Emotional: {emotional}, Routine: {routine}.")

        strengths = assessment_data.get("strengths", [])
        improvements = assessment_data.get("improvements", [])
        if strengths:
            parts.append(f"Strengths: {', '.join(strengths[:3])}")
        if improvements:
            parts.append(f"Areas to improve: {', '.join(improvements[:3])}")

        return " ".join(parts)

    @staticmethod
    def _build_relationship_summary(relationship_data):
        """Converts relationship intelligence data into a summary."""
        if not relationship_data:
            return "No relationship intelligence data available."

        parts = []
        analysis = relationship_data.get("analysis_result", {})

        if isinstance(analysis, dict):
            bond_score = analysis.get("bond_score") or analysis.get("relationship_score", "N/A")
            parts.append(f"Relationship/Bond score: {bond_score}.")

            comm_style = analysis.get("communication_style", "")
            if comm_style:
                parts.append(f"Communication style: {comm_style}.")

            tension = analysis.get("tension_areas") or analysis.get("conflict_areas", [])
            if tension:
                areas = tension if isinstance(tension, list) else [tension]
                parts.append(f"Tension areas: {', '.join(str(a) for a in areas[:3])}")

            positives = analysis.get("positive_signals") or analysis.get("strengths", [])
            if positives:
                pos = positives if isinstance(positives, list) else [positives]
                parts.append(f"Positive signals: {', '.join(str(p) for p in pos[:3])}")
        else:
            parts.append(str(analysis)[:300])

        return " ".join(parts) if parts else "Relationship data format unrecognized."

    @staticmethod
    def _build_behavior_flags(screen_data, voice_data, assessment_data):
        """Generates behavior flags from all data sources."""
        flags = []

        # Screen-based flags
        if screen_data:
            total = screen_data.get("total_screen_time", 0)
            if total > 180:
                flags.append("EXCESSIVE_SCREEN_TIME")
            elif total > 120:
                flags.append("HIGH_SCREEN_TIME")

            apps = screen_data.get("apps_usage", [])
            social_heavy = [a for a in apps
                            if a.get("category", "").lower() in ("social media", "social")
                            and a.get("usage_level") in ("high", "excessive")]
            if social_heavy:
                flags.append("SOCIAL_MEDIA_OVERUSE")

            if screen_data.get("alert", {}).get("show"):
                flags.append("SCREEN_ALERT_ACTIVE")

        # Voice-based flags
        if voice_data:
            if voice_data.get("stress_score", 0) > 70:
                flags.append("HIGH_STRESS")
            if voice_data.get("fatigue_score", 0) > 70:
                flags.append("HIGH_FATIGUE")
            if voice_data.get("confidence_score", 0) < 30:
                flags.append("LOW_CONFIDENCE")

        # Assessment-based flags
        if assessment_data:
            if assessment_data.get("risk_level") == "high":
                flags.append("HIGH_RISK_ASSESSMENT")
            if assessment_data.get("emotional_score", 100) < 40:
                flags.append("EMOTIONAL_DISTRESS")
            if assessment_data.get("behavior_score", 100) < 40:
                flags.append("BEHAVIOR_CONCERN")

        return ", ".join(flags) if flags else "No critical flags detected."

    @staticmethod
    def _build_recent_pattern(screen_data, voice_data, assessment_data):
        """Generates a recent pattern description from all sources."""
        patterns = []

        if screen_data:
            overall = screen_data.get("overall", {})
            positive = overall.get("positive_note", "")
            if positive:
                patterns.append(f"Screen: {positive}")
            main_issue = overall.get("main_issue", "")
            if main_issue:
                patterns.append(f"Screen concern: {main_issue}")

        if voice_data:
            level = voice_data.get("stress_level", "")
            if level:
                patterns.append(f"Emotional state: {level} stress detected via voice analysis.")

        if assessment_data:
            risk = assessment_data.get("risk_level", "")
            score = assessment_data.get("final_score", 0)
            if risk:
                patterns.append(f"Assessment: {risk} risk (score: {score}/100).")

        return " ".join(patterns) if patterns else "Insufficient historical data to determine patterns."

    @classmethod
    def generate_harmony_report(cls, screen_data, voice_data, assessment_data, relationship_data):
        """
        Main entry point. Aggregates all structured data into summaries,
        sends to Gemini, and returns the Harmony AI JSON response.
        """
        screen_summary = cls._build_screen_summary(screen_data)
        emotion_summary = cls._build_emotion_summary(voice_data)
        assessment_summary = cls._build_assessment_summary(assessment_data)
        relationship_summary = cls._build_relationship_summary(relationship_data)
        behavior_flags = cls._build_behavior_flags(screen_data, voice_data, assessment_data)
        recent_pattern = cls._build_recent_pattern(screen_data, voice_data, assessment_data)

        prompt = cls.SYSTEM_PROMPT.format(
            screen_summary=screen_summary,
            emotion_summary=emotion_summary,
            assessment_summary=assessment_summary,
            relationship_summary=relationship_summary,
            behavior_flags=behavior_flags,
            recent_pattern=recent_pattern,
        )

        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)

            if not response or not response.text:
                return {"error": "AI returned an empty response."}

            raw_text = response.text.strip()
            # Strip markdown formatting
            raw_text = re.sub(r"^```json\s*", "", raw_text)
            raw_text = re.sub(r"\s*```$", "", raw_text)

            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(0))
                # Inject the structured summaries for frontend context
                result["_meta"] = {
                    "screen_summary": screen_summary,
                    "emotion_summary": emotion_summary,
                    "assessment_summary": assessment_summary,
                    "relationship_summary": relationship_summary,
                    "behavior_flags": behavior_flags,
                    "recent_pattern": recent_pattern,
                }
                return result
            else:
                return {"error": "AI response format was invalid.", "raw": raw_text[:500]}

        except Exception as e:
            logger.error(f"Harmony AI Error: {str(e)}")
            return {"error": f"Analysis failed: {str(e)}"}

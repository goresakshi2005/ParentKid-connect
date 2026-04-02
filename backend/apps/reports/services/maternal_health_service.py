"""
backend/apps/reports/services/maternal_health_service.py

Generates a simple, friendly maternal health guide from extracted report text.
Uses Gemini (already wired in the project) to produce both a human-readable
guide AND a structured JSON object in one call.
"""

import json
import re
import logging

import google.generativeai as genai
from django.conf import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

logger = logging.getLogger(__name__)

MATERNAL_HEALTH_PROMPT = """
You are a maternal health assistant AI.
Analyze the pregnancy medical report below and generate a SHORT, SIMPLE, and EASY-TO-UNDERSTAND health guide.

{trimester_hint}

OUTPUT — return ONLY a single valid JSON object (no markdown fences, no extra text) in this exact shape:

{{
  "guide_text": "<full plain-text guide starting with: Hi, based on your report, here is your simple health guide.>",
  "overall_status": "<1-2 line summary>",
  "positives": ["<good finding 1>", "<good finding 2>"],
  "issues": [
    {{
      "parameter": "<Hb / Calcium / Sugar / BP / etc.>",
      "status": "<Low | Normal | High>",
      "severity": "<Mild | Moderate | High>",
      "meaning": "<one simple sentence explanation>"
    }}
  ],
  "recommendations": {{
    "food": ["<Indian food tip 1>", "<tip 2>", "<tip 3>"],
    "water": "<daily water intake advice>",
    "exercise": ["<safe activity 1>", "<safe activity 2>"],
    "sleep": "<sleep advice>",
    "mental_health": ["<tip 1>", "<tip 2>"],
    "avoid": ["<avoid 1>", "<avoid 2>", "<avoid 3>"]
  }},
  "care_goals": [
    {{
      "goal": "<e.g. Increase Hemoglobin>",
      "steps": ["<step 1>", "<step 2>", "<step 3>"]
    }}
  ],
  "alerts": "<serious alert or empty string>"
}}

Rules for guide_text:
- Very short sentences. Bullet points only.
- Max 220 words total.
- Very simple English.
- Include sections: OVERALL STATUS, POSITIVE POINTS, KEY ISSUES, DAILY HEALTH GUIDE (Food / Water / Exercise / Rest & Sleep / Mental Well-being / Daily Care Goals / Avoid), ALERT (only if serious).
- End with: "This is general guidance. Please consult your doctor."
- Tone: caring, supportive, friendly.
- Focus on Indian context (foods like spinach, dal, roti, curd, paneer, dates, coconut water).

Medical Report Text:
\"\"\"
{report_text}
\"\"\"
"""


def generate_maternal_health_guide(report_text: str, trimester: str = None) -> dict:
    """
    Accepts extracted report text and optional trimester string.
    Returns a dict with keys: guide_text, overall_status, positives,
    issues, recommendations, care_goals, alerts.
    """
    trimester_hint = ""
    if trimester:
        trimester_hint = f"Note: The patient is currently in {trimester}.\n"

    prompt = MATERNAL_HEALTH_PROMPT.format(
        report_text=report_text[:5000],
        trimester_hint=trimester_hint,
    )

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip markdown fences if model wraps in ```json ... ```
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Attempt to salvage a JSON object from the response
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            logger.error("Gemini returned non-JSON for maternal health guide: %s", raw[:300])
            raise ValueError("Could not parse maternal health guide from AI response.")

    # Ensure all expected keys exist with defaults
    data.setdefault("guide_text", "Hi, based on your report, here is your simple health guide.\n\nPlease consult your doctor.")
    data.setdefault("overall_status", "")
    data.setdefault("positives", [])
    data.setdefault("issues", [])
    data.setdefault("recommendations", {
        "food": [], "water": "", "exercise": [],
        "sleep": "", "mental_health": [], "avoid": []
    })
    data.setdefault("care_goals", [])
    data.setdefault("alerts", "")

    return data
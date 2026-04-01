import json
import re
import google.generativeai as genai
from django.conf import settings


genai.configure(api_key=settings.GEMINI_API_KEY)


EXTRACTION_PROMPT = """
You are a medical assistant AI. Read the following medical report text carefully.

Extract:
1. The next appointment date
2. The next appointment time (if available)
3. The doctor's name (if mentioned)

Return ONLY a valid JSON object in this exact format, with no extra text:
{{
  "date": "YYYY-MM-DD or empty string",
  "time": "HH:MM AM/PM or empty string",
  "doctor": "Doctor name or empty string"
}}

Medical Report Text:
\"\"\"
{report_text}
\"\"\"
"""


def extract_appointment_from_text(report_text: str) -> dict:
    """
    Sends report text to Gemini and extracts appointment details.
    Returns a dict: { date, time, doctor }
    """
    model = genai.GenerativeModel("gemini-2.5-flash")  # ✅ updated model name

    prompt = EXTRACTION_PROMPT.format(report_text=report_text[:4000])

    response = model.generate_content(prompt)
    raw_text = response.text.strip()

    # Strip markdown code fences if present
    raw_text = re.sub(r"^```json\s*", "", raw_text)
    raw_text = re.sub(r"\s*```$", "", raw_text)

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*?\}', raw_text, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise ValueError(f"Gemini returned non-JSON response: {raw_text}")

    return {
        "date": data.get("date", "").strip(),
        "time": data.get("time", "").strip(),
        "doctor": data.get("doctor", "").strip(),
    }
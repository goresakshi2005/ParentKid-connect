import google.generativeai as genai
from django.conf import settings
import json
import re

genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPTS = {
    "normal": """
You are a relationship intelligence assistant for a parent of a growing child (age 6-12 or teen). 
The current mode is NORMAL – communication is healthy, trust is good.
Generate a very light, daily conversation prompt that maintains connection without pressure.
Keep it short, positive, and open-ended.
Return ONLY a JSON object with these keys:
{
  "recommended_action": "string (e.g., 'Ask about their day', 'Share a fun fact')",
  "conversation_prompts": ["string", "string"],
  "alternative_actions": ["string"],
  "do": "string (one tip)",
  "dont": "string",
  "parent_micro_tip": "string (very short actionable tip)",
  "escalation_alert": "string (empty unless needed)"
}
""",
    "trust_rebuilding": """
Mode: TRUST REBUILDING – trust score is low (<40) or there have been repeated failed conversations.
Strategy: NO direct questioning. Focus on presence-based bonding. Actions should be non‑intrusive.
Generate a suggestion that does NOT ask the child to talk. Instead, suggest silent parallel activities or very low‑pressure shared presence.
Return JSON:
{
  "recommended_action": "e.g., 'Sit together without talking while watching a short video'",
  "conversation_prompts": ["No need to talk, just wanted to be around you", ...],
  "alternative_actions": ["...", "..."],
  "do": "Focus on being present, not on extracting information",
  "dont": "Avoid asking 'why' or 'what happened'",
  "parent_micro_tip": "One tiny action to rebuild safety",
  "escalation_alert": "empty unless severe"
}
""",
    "resistance_handling": """
Mode: RESISTANCE HANDLING – engagement level is low (one‑word replies, no interaction).
Strategy: Replace conversation with low‑effort interactions. Suggest sharing a meme, a funny video, or a casual observation.
Avoid emotional or heavy topics.
Return JSON:
{
  "recommended_action": "e.g., 'Send them a funny meme without any text'",
  "conversation_prompts": ["Check this out, made me laugh", ...],
  "alternative_actions": ["Leave a note on their desk", "Play a short game together silently"],
  "do": "Keep it light, no expectations of reply",
  "dont": "Do not ask for explanations or opinions",
  "parent_micro_tip": "One low‑effort bonding idea",
  "escalation_alert": "empty"
}
"""
}

def get_ai_recommendation(mode, trust_score, engagement_level, parent_style, child_history, best_time):
    prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["normal"])
    user_context = f"""
Parent style: {parent_style}
Child recent response history: {child_history}
Best time of day for interaction: {best_time}
Trust score: {trust_score}, Engagement: {engagement_level}
"""
    full_prompt = f"{prompt}\n\nContext:\n{user_context}\n\nGenerate JSON output only, no extra text."
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(full_prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
    except Exception as e:
        # Fallback static responses
        data = {
            "recommended_action": "Spend 10 minutes together without screens.",
            "conversation_prompts": ["I'm here if you want to talk, no pressure."],
            "alternative_actions": ["Cook together", "Take a short walk"],
            "do": "Listen more than you speak.",
            "dont": "Don't interrupt.",
            "parent_micro_tip": "Smile and maintain eye contact.",
            "escalation_alert": ""
        }
    return data
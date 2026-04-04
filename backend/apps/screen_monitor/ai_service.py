"""
screen_monitor/ai_service.py

Calls the Anthropic Claude API to analyse a teen's screen session
and return a structured BehaviorAnalysis JSON payload.
"""
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are an AI Teen Behavior Monitoring System embedded in a parental-care app.
You analyze a teenager's screen usage data and return ONLY a valid JSON object — no markdown, no explanation.

OUTPUT FORMAT (strict JSON, nothing else):
{
  "detected_state": "normal|stressed|fatigued|distracted|overuse",
  "intensity": "low|medium|high",
  "confidence": <float 0.0-1.0>,
  "behavior_pattern": "<short explanation, e.g. excessive social media at night>",
  "risk_level": "none|low|medium|high",
  "auto_action": {
    "action_type": "focus_mode|digital_detox|rest_mode|none",
    "description": "<what the system should automatically do>",
    "duration": "<e.g. 30 minutes, or empty string>"
  },
  "system_changes": ["<change 1>", "<change 2>"],
  "user_message": "<short friendly 1-line message for the teen>",
  "parent_alert": "none|consider|required"
}

RULES:
- Focus on automation, not advice.
- Night usage + high social media = higher risk.
- Continuous usage > 90 min = fatigue or distraction.
- Detect patterns from recent logs, not just single events.
- Keep user_message friendly and non-alarming.
- Avoid medical language.
"""


def _build_user_prompt(session_data: dict, recent_logs: list[dict]) -> str:
    recent_text = "\n".join(
        f"- [{log.get('recorded_at', '')}] state={log.get('detected_state', 'unknown')} "
        f"social={log.get('social_time', 0)}min study={log.get('study_time', 0)}min "
        f"continuous={log.get('continuous_usage', 0)}min"
        for log in recent_logs[-5:]
    ) or "No recent logs."

    return f"""
Screen Data:
- Total Screen Time (minutes): {session_data['total_time']}
- Social Media Usage (minutes): {session_data['social_time']}
- Study App Usage (minutes): {session_data['study_time']}
- Time of Usage: {session_data['time_of_day']}
- Continuous Usage Duration (minutes): {session_data['continuous_usage']}
- App Categories Used: {', '.join(session_data.get('apps_list', []))}

Recent Context (last few logs):
{recent_text}

Analyze this data and return the JSON object.
"""


def analyze_session(session_data: dict, recent_logs: list[dict]) -> dict:
    """
    Calls Claude and returns the parsed analysis dict.
    Falls back to a safe default if the API call fails.
    """
    try:
        # Lazy import to avoid importing heavy third-party libs at module import time
        import anthropic

        client = anthropic.Anthropic()

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": _build_user_prompt(session_data, recent_logs)}
            ],
        )
        raw_text = message.content[0].text.strip()
        return json.loads(raw_text)
    except Exception as exc:
        logger.error("Screen monitor AI analysis failed: %s", exc)
        return _fallback_result()


def _fallback_result() -> dict:
    return {
        "detected_state": "normal",
        "intensity": "low",
        "confidence": 0.5,
        "behavior_pattern": "Unable to analyze at this time.",
        "risk_level": "none",
        "auto_action": {"action_type": "none", "description": "", "duration": ""},
        "system_changes": [],
        "user_message": "Keep up the good work! 😊",
        "parent_alert": "none",
    }
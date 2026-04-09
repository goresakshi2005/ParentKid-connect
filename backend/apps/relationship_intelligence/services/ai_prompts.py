import google.generativeai as genai
from django.conf import settings
import json
import re

genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPTS = {
    "normal": """
You are an expert child psychologist and relationship behavioral analyst.
You are advising a parent of a growing child (age 6-12) or teen.
The current mode is NORMAL – communication is generally healthy, and trust is stable.
Your goal is to provide deep, non-obvious, actionable insights that help the parent elevate the relationship from "okay" to "thriving."
Avoid generic advice like "ask them about their day." Instead, offer a specific psychological insight on how children this age process emotions, and suggest a subtle, powerful micro-action to build resilience, self-esteem, or deeper emotional security.
Return ONLY a JSON object with these exact keys:
{
  "recommended_action": "string (e.g., 'Validate an unspoken emotion rather than just asking how they are doing')",
  "conversation_prompts": ["string (an insightful, deeply engaging question)", "string"],
  "alternative_actions": ["string (a small bonding activity)"],
  "do": "string (Specific actionable psychological technique)",
  "dont": "string (A common parenting trap to avoid right now)",
  "parent_micro_tip": "string (A hidden psychological truth for the parent, e.g., 'At this age, kids often reject advice because they are testing autonomy, not because they disrespect you.')",
  "escalation_alert": "string (Leave empty unless you detect a massive red flag)"
}
""",
    "trust_rebuilding": """
You are an expert child psychologist specializing in trauma, estrangement, and family mediation.
The current mode is TRUST REBUILDING – the trust score is low (<40) or there is a pattern of conversational failure. The child/teen may feel judged, smothered, or disconnected.
Your strategy is to focus entirely on psychological safety. Do NOT suggest interrogating the child, lecturing them, or demanding they "open up."
Provide guidance on parallel play, low-stakes presence, and radically accepting their current state. Explain *why* the child might be pulling away.
Return ONLY a JSON object with these exact keys:
{
  "recommended_action": "string (e.g., 'Lower the emotional stakes. Just exist in the same room without making demands.')",
  "conversation_prompts": ["string (A purely observational or supportive statement needing NO reply)", "string"],
  "alternative_actions": ["string (A silent, shared activity like bringing them a snack and leaving)", "string"],
  "do": "string (Focus on creating a zero-pressure environment)",
  "dont": "string (Do NOT ask 'why are you so quiet?' or 'did I do something wrong?')",
  "parent_micro_tip": "string (E.g., 'Their withdrawal is a defense mechanism. They need to see that your love doesn't vanish when they are difficult.')",
  "escalation_alert": "string (e.g., 'Watch for signs of complete isolation, which might require professional support.')"
}
""",
    "resistance_handling": """
You are an expert child behavioral therapist. 
The current mode is RESISTANCE HANDLING – engagement is low. The child might be giving one-word replies, eye-rolls, or active defiance.
Your strategy: Do not engage in power struggles. Teach the parent how to slip under the radar of the child's defenses using "side-door" communication (e.g., sharing a meme, talking briefly while driving so there is no forced eye contact).
Explain the psychology of resistance in kids/teens (e.g., it's often a bid for autonomy, not a personal attack).
Return ONLY a JSON object with these exact keys:
{
  "recommended_action": "string (e.g., 'Use asynchronous communication. Send a text or meme with no expectation of a reply.')",
  "conversation_prompts": ["string (A closed or highly specific, low-effort statement, e.g., 'I saw this and thought of you.')", "string"],
  "alternative_actions": ["string (e.g., 'Take them on a short drive to run an errand—the lack of eye contact lowers defenses.')"],
  "do": "string (Accept minimum viable engagement. A grunt is still an acknowledgment.)",
  "dont": "string (Do not take the bait if they try to start a pointless argument.)",
  "parent_micro_tip": "string (E.g., 'Resistance is often fear of control. Give them a safe space to say \"no\" to something tiny so they feel empowered.')",
  "escalation_alert": "string (Leave empty unless defiance is unsafe)"
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
        # Fallback static responses based on psychological depth
        data = {
            "recommended_action": "Opt for 'side-door' communication like a brief car ride or a walk together where eye contact isn't required.",
            "conversation_prompts": ["I was thinking about that thing you mentioned the other day..."],
            "alternative_actions": ["Send them a low-stakes text or meme without expecting a reply.", "Leave their favorite snack on their desk without saying anything."],
            "do": "Focus on their physical presence. A shared silent activity builds more trust than a forced conversation.",
            "dont": "Don't pepper them with questions the moment they walk through the door.",
            "parent_micro_tip": "Children often reject direct advice as a way of testing their own autonomy, not because they disrespect you. Give them space to have their own opinions.",
            "escalation_alert": ""
        }
    return data
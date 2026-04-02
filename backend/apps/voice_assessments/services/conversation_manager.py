import google.generativeai as genai
from django.conf import settings
import json
import re

genai.configure(api_key=settings.GEMINI_API_KEY)

INITIAL_QUESTION = "How are you feeling today emotionally and physically?"

QUESTION_GENERATION_PROMPT = """
You are a gentle, supportive assistant for expecting mothers. Based on the conversation history and the user's latest answer (transcript) and vocal features, decide the next question.

Previous conversation:
{history}

Latest answer: "{answer_text}"
Vocal features: pitch={pitch_mean}Hz, speaking rate={speaking_rate} words/sec, energy={energy_mean}, hesitation={hesitation_ratio}

Current turn number: {turn} (max 5 total turns)

Rules:
- If stress detected (high pitch >200Hz, fast speaking rate >3, negative words, high energy), ask about worries.
- If fatigue detected (slow speaking rate <2, low energy <0.02, hesitation >0.3), ask about sleep or tiredness.
- If low confidence detected (hesitation >0.4, broken speech), ask about emotional support.
- If calm/positive, ask about daily routine.
- Ensure at least one question about sleep, one about emotional stress, one about energy level across the conversation.
- Keep questions short, simple, and emotionally supportive.

Return a JSON object with:
{{
    "next_question": "string",
    "is_complete": false  // set true if turn >= 5 or enough info collected
}}
"""

FINAL_SCORING_PROMPT = """
You are analyzing a voice-based wellness check for an expecting mother. Based on the full conversation history (questions and transcribed answers) and the vocal features from each turn, compute scores.

Conversation history:
{history}

Output a JSON object exactly as:
{{
    "stress_score": integer 0-100,
    "confidence_score": integer 0-100,
    "fatigue_score": integer 0-100,
    "stress_level": "Low" or "Moderate" or "High",
    "insights": ["observation1", "observation2", "observation3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}}

Guidelines:
- Stress: high if fast speech, high pitch, high energy, negative words.
- Confidence: high if clear, steady, low hesitation.
- Fatigue: high if slow speech, low pitch, low energy.
- Insights: combine vocal and textual cues.
- Recommendations: gentle, actionable suggestions for relaxation, sleep, social support, prenatal care.
"""

def get_initial_question():
    return INITIAL_QUESTION

def process_response_and_get_next(audio_path, vocal_features, history, current_turn):
    # Transcribe using Gemini
    model = genai.GenerativeModel('gemini-2.5-flash')
    # For transcription, we can use a simple prompt
    audio_file = genai.upload_file(audio_path, mime_type="audio/webm")
    transcript_response = model.generate_content(
        ["Transcribe the following audio response from an expecting mother:", audio_file]
    )
    transcript = transcript_response.text.strip()

    # Build history string
    history_str = ""
    for idx, entry in enumerate(history, 1):
        history_str += f"Q{idx}: {entry['question']}\nA{idx}: {entry['answer_text']}\n"

    # Decide next question
    prompt = QUESTION_GENERATION_PROMPT.format(
        history=history_str,
        answer_text=transcript,
        pitch_mean=vocal_features.get('pitch_mean', 0),
        speaking_rate=vocal_features.get('speaking_rate', 0),
        energy_mean=vocal_features.get('energy_mean', 0),
        hesitation_ratio=vocal_features.get('hesitation_ratio', 0),
        turn=current_turn + 1
    )

    response = model.generate_content(prompt)
    raw = response.text.strip()
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    try:
        data = json.loads(raw)
    except:
        # Fallback
        if current_turn + 1 >= 5:
            data = {'next_question': "Thank you for sharing. Let me analyze your responses.", 'is_complete': True}
        else:
            data = {'next_question': "How has your sleep been recently?", 'is_complete': False}

    return {
        'transcript': transcript,
        'next_question': data.get('next_question', "Can you tell me more about how you're feeling?"),
        'is_complete': data.get('is_complete', False) or (current_turn + 1 >= 5),
        'current_question': history[-1]['question'] if history else INITIAL_QUESTION
    }


def is_conversation_complete(history):
    """Return True if the conversation has reached the max number of turns.

    We consider a conversation complete when there are 5 or more turns recorded.
    This mirrors the logic used elsewhere (max 5 turns).
    """
    try:
        return len(history) >= 5
    except Exception:
        return False

def compute_final_report(conversation_history):
    # Build detailed history for scoring
    history_str = ""
    for idx, entry in enumerate(conversation_history, 1):
        vf = entry.get('vocal_features', {})
        history_str += f"Turn {idx}:\nQuestion: {entry['question']}\nAnswer: {entry['answer_text']}\nVocal features: pitch={vf.get('pitch_mean',0)}Hz, rate={vf.get('speaking_rate',0)} wps, energy={vf.get('energy_mean',0)}, hesitation={vf.get('hesitation_ratio',0)}\n\n"

    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = FINAL_SCORING_PROMPT.format(history=history_str)
    response = model.generate_content(prompt)
    raw = response.text.strip()
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    try:
        data = json.loads(raw)
    except:
        # Fallback defaults
        data = {
            'stress_score': 50,
            'confidence_score': 50,
            'fatigue_score': 50,
            'stress_level': 'Moderate',
            'insights': ['Unable to fully analyze. Please consult a healthcare provider.'],
            'recommendations': ['Rest when needed', 'Talk to someone you trust', 'Stay hydrated']
        }
    return data
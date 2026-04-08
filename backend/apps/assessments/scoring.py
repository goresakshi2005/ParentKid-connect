import json
import google.generativeai as genai
from django.conf import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

class AssessmentScorer:
    CATEGORY_WEIGHTS = {
        'health': 0.3,
        'behavior': 0.25,
        'routine': 0.25,
        'emotional': 0.2,
    }
    
    CATEGORY_KEYWORDS = {
        'health': ['sleep', 'diet', 'exercise', 'physical', 'nutrition', 'activity'],
        'behavior': ['habits', 'discipline', 'screen', 'behavior', 'manners', 'conduct'],
        'routine': ['schedule', 'routine', 'consistent', 'timing', 'time', 'morning', 'bedtime'],
        'emotional': ['stress', 'mood', 'communication', 'feelings', 'anxiety', 'happy', 'sad'],
    }
    
    def __init__(self, answers, questions):
        self.answers = answers
        self.questions = questions
        self.category_scores = {}
        self.scores_by_category = {
            'health': [],
            'behavior': [],
            'routine': [],
            'emotional': [],
        }
    
    def categorize_question(self, question_text):
        text_lower = question_text.lower()
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        return 'emotional'
    
    def score_answer(self, answer, question_data):
        question_type = question_data.get('type', 'mcq')
        
        if question_type == 'mcq':
            return min(answer.get('value', 0), 4)
        
        elif question_type == 'msq':
            total_options = len(question_data.get('options', []))
            selected_count = len(answer.get('selected', []))
            return (selected_count / total_options) * 4 if total_options > 0 else 0
        
        elif question_type == 'text':
            text = answer.get('text', '').lower()
            positive_keywords = ['yes', 'good', 'excellent', 'very', 'always', 'often']
            negative_keywords = ['no', 'poor', 'never', 'rarely', 'bad']
            
            pos_count = sum(1 for kw in positive_keywords if kw in text)
            neg_count = sum(1 for kw in negative_keywords if kw in text)
            
            if pos_count > neg_count:
                return 3 + (pos_count / 5)
            elif neg_count > pos_count:
                return 1 - (neg_count / 5)
            else:
                return 2
        
        return 0
    
    def calculate_scores(self):
        for idx, answer in enumerate(self.answers):
            question = self.questions[idx]
            category = self.categorize_question(question.get('text', ''))
            score = self.score_answer(answer, question)
            self.scores_by_category[category].append(score)
        
        for category, scores in self.scores_by_category.items():
            if scores:
                percentage = (sum(scores) / (len(scores) * 4)) * 100
                self.category_scores[category] = round(percentage, 2)
            else:
                self.category_scores[category] = 0
        
        return self.category_scores
    
    def calculate_final_score(self):
        if not self.category_scores:
            self.calculate_scores()
        
        scores = list(self.category_scores.values())
        final = sum(scores) / len(scores) if scores else 0
        return round(final, 2)
    
    def calculate_weighted_score(self):
        if not self.category_scores:
            self.calculate_scores()
        
        weighted = (
            self.CATEGORY_WEIGHTS['health'] * self.category_scores['health'] +
            self.CATEGORY_WEIGHTS['behavior'] * self.category_scores['behavior'] +
            self.CATEGORY_WEIGHTS['routine'] * self.category_scores['routine'] +
            self.CATEGORY_WEIGHTS['emotional'] * self.category_scores['emotional']
        )
        return round(weighted, 2)
    
    def detect_risk_level(self, final_score):
        if final_score > 75:
            return 'low'
        elif 50 <= final_score <= 75:
            return 'moderate'
        else:
            return 'high'
    
    def get_strengths(self):
        if not self.category_scores:
            self.calculate_scores()
        
        threshold = 70
        return [
            category.capitalize() 
            for category, score in self.category_scores.items() 
            if score >= threshold
        ]
    
    def get_improvements(self):
        if not self.category_scores:
            self.calculate_scores()
        
        threshold = 50
        return [
            category.capitalize() 
            for category, score in self.category_scores.items() 
            if score < threshold
        ]
    
    def generate_ai_recommendations(self, assessment_type, risk_level):
        try:
            prompt = f"""
Based on the following assessment results, provide 2-3 specific, actionable recommendations:

Assessment Type: {assessment_type}
Risk Level: {risk_level}
Category Scores:
- Health: {self.category_scores.get('health', 0)}%
- Behavior: {self.category_scores.get('behavior', 0)}%
- Routine: {self.category_scores.get('routine', 0)}%
- Emotional: {self.category_scores.get('emotional', 0)}%

Strengths: {', '.join(self.get_strengths())}
Areas for Improvement: {', '.join(self.get_improvements())}

Please provide:
1. Personalized insights
2. Specific action items
3. Expected outcomes

Keep it brief, practical, and encouraging.
            """
            
            model = genai.GenerativeModel('gemini-2.5-flash')  # ✅ updated model name
            response = model.generate_content(prompt)
            return response.text
        
        except Exception as e:
            print(f"Error generating AI recommendations: {str(e)}")
            default_list = self.get_default_recommendations(assessment_type, risk_level)
            return "\n".join(default_list)
    
    def get_default_recommendations(self, assessment_type, risk_level):
        if risk_level == 'high':
            return [
                "Schedule a consultation with a child development specialist",
                "Implement structured daily routines",
                "Focus on areas with lowest scores first"
            ]
        elif risk_level == 'moderate':
            return [
                "Monitor progress closely over the next month",
                "Implement targeted improvements in weak areas",
                "Celebrate improvements in strong areas"
            ]
        else:
            return [
                "Maintain current habits and routines",
                "Continue positive reinforcement",
                "Periodic check-ins to ensure continued progress"
            ]
    
    def get_complete_report(self, assessment_type):
        final_score = self.calculate_final_score()
        weighted_score = self.calculate_weighted_score()
        risk_level = self.detect_risk_level(final_score)
        recommendations_text = self.generate_ai_recommendations(assessment_type, risk_level)
        recommendations = [line.strip() for line in recommendations_text.split('\n') if line.strip()][:3]
        
        return {
            'health_score': self.category_scores.get('health', 0),
            'behavior_score': self.category_scores.get('behavior', 0),
            'routine_score': self.category_scores.get('routine', 0),
            'emotional_score': self.category_scores.get('emotional', 0),
            'final_score': final_score,
            'weighted_score': weighted_score,
            'risk_level': risk_level,
            'strengths': self.get_strengths(),
            'improvements': self.get_improvements(),
            'recommendations': recommendations,
        }

class CareerDiscoveryEngine:
    @staticmethod
    def generate_career_path(trait_labels, scores):
        try:
            prompt = f"""
You are an advanced AI career discovery engine designed specifically for teenagers.
Your goal is to analyze a teenager's personality traits and scores and recommend the most suitable career path from ALL POSSIBLE FIELDS in the real world.
You MUST follow a deep exploration approach, not shallow suggestions.

INPUT:
* Trait labels: {trait_labels}
* Trait scores: {scores}

STEP 1: TRAIT ANALYSIS
* Identify top 4 dominant traits
* Identify hidden/secondary traits
* Understand personality pattern (analytical, creative, social, practical, etc.)

STEP 2: BROAD DOMAIN MAPPING
* Map traits to ALL possible domains

STEP 3: Niche Career Identification
* Find specific real-world roles.

Important: Return ONLY a valid JSON object matching this schema exactly, and nothing else (no markdown wrappers like ```json ... ```, just the raw JSON object string):
{{
    "best_career_title": "string",
    "best_career_emoji": "emoji string",
    "best_career_why": "string explaining why based on traits",
    "task": "A Try-It-Now Challenge string to let the teen practically try out the career",
    "alternatives": ["emoji string 1", "emoji string 2", "emoji string 3"]
}}
"""
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            # Remove any markdown formatting if present
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            return json.loads(response_text)
            
        except Exception as e:
            print(f"Error generating career recommendations: {str(e)}")
            return None
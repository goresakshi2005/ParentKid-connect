# backend/apps/assessments/management/commands/seed_assessments.py

import json
from django.core.management.base import BaseCommand
from apps.assessments.models import Assessment

class Command(BaseCommand):
    help = 'Seed all assessments from the structured data'

    def handle(self, *args, **options):
        assessments_data = [
            # ==================== PREGNANCY (Parent only) ====================
            {
                "stage": "pregnancy",
                "assessment_type": "parent",
                "tier": "free",
                "title": "Pregnancy Health & Well-being (Free)",
                "description": "Understand your pregnancy journey and identify areas for support.",
                "questions": [
                    {"text": "What is your current pregnancy week?", "type": "text"},
                    {"text": "How often do you follow a balanced diet?", "type": "mcq", "options": [{"label": "Never", "score": 0}, {"label": "Sometimes", "score": 1}, {"label": "Often", "score": 2}, {"label": "Always", "score": 3}]},
                    {"text": "Which symptoms do you experience regularly?", "type": "msq", "options": [{"label": "Nausea", "value": "nausea"}, {"label": "Fatigue", "value": "fatigue"}, {"label": "Stress", "value": "stress"}, {"label": "None", "value": "none"}]},
                    {"text": "How many hours do you sleep daily?", "type": "mcq", "options": [{"label": "<5", "score": 0}, {"label": "5-7", "score": 1}, {"label": "7-9", "score": 2}, {"label": ">9", "score": 3}]},
                    {"text": "Do you attend regular doctor checkups?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}, {"label": "Sometimes", "score": 1}]},
                    {"text": "What improvements do you want in your daily routine?", "type": "text"},
                    {"text": "Which activities do you follow for health?", "type": "msq", "options": [{"label": "Walking", "value": "walking"}, {"label": "Yoga", "value": "yoga"}, {"label": "Exercise", "value": "exercise"}, {"label": "None", "value": "none"}]},
                    {"text": "How often do you feel stressed?", "type": "mcq", "options": [{"label": "Rarely", "score": 3}, {"label": "Sometimes", "score": 2}, {"label": "Often", "score": 1}, {"label": "Always", "score": 0}]},
                    {"text": "Do you track your health regularly?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What support do you need most?", "type": "text"},
                ]
            },
            {
                "stage": "pregnancy",
                "assessment_type": "parent",
                "tier": "paid",
                "title": "Pregnancy Health & Well-being (Paid)",
                "description": "Get detailed insights and personalized recommendations for your pregnancy.",
                "questions": [
                    {"text": "Do you have any medical conditions?", "type": "text"},
                    {"text": "Which areas need improvement most?", "type": "msq", "options": [{"label": "Diet", "value": "diet"}, {"label": "Sleep", "value": "sleep"}, {"label": "Stress", "value": "stress"}, {"label": "Routine", "value": "routine"}]},
                    {"text": "Do you want a personalized health plan?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How confident are you in managing pregnancy?", "type": "mcq", "options": [{"label": "Low", "score": 0}, {"label": "Medium", "score": 2}, {"label": "High", "score": 4}]},
                    {"text": "Do you need expert consultation?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Which risks are you concerned about?", "type": "text"},
                    {"text": "Do you want detailed health reports?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How often do you miss medical routines?", "type": "mcq", "options": [{"label": "Never", "score": 3}, {"label": "Sometimes", "score": 1}, {"label": "Often", "score": 0}]},
                    {"text": "Do you want AI-based monitoring?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What improvement do you expect from the system?", "type": "text"},
                ]
            },

            # ==================== EARLY CHILDHOOD (Parent & Child) ====================
            {
                "stage": "early_childhood",
                "assessment_type": "parent",
                "tier": "free",
                "title": "Early Childhood Parenting Assessment (Free)",
                "description": "Assess your child's growth in early years.",
                "questions": [
                    {"text": "How many hours does your child sleep daily?", "type": "mcq", "options": [{"label": "<6", "score": 0}, {"label": "6-8", "score": 1}, {"label": "8-10", "score": 2}, {"label": ">10", "score": 3}]},
                    {"text": "What type of food does your child consume regularly?", "type": "msq", "options": [{"label": "Milk", "value": "milk"}, {"label": "Solid", "value": "solid"}, {"label": "Junk", "value": "junk"}, {"label": "Balanced", "value": "balanced"}]},
                    {"text": "Has your child achieved milestones like walking or speaking?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}, {"label": "Not Sure", "score": 1}]},
                    {"text": "How often does your child play?", "type": "mcq", "options": [{"label": "Rarely", "score": 0}, {"label": "Sometimes", "score": 1}, {"label": "Often", "score": 2}]},
                    {"text": "What improvements do you want in your child's routine?", "type": "text"},
                    {"text": "Does your child follow a daily routine?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How much screen time does your child have?", "type": "mcq", "options": [{"label": "<1hr", "score": 3}, {"label": "1-2hr", "score": 2}, {"label": ">2hr", "score": 0}]},
                    {"text": "Which activities does your child enjoy?", "type": "msq", "options": [{"label": "Toys", "value": "toys"}, {"label": "Music", "value": "music"}, {"label": "Drawing", "value": "drawing"}, {"label": "Outdoor", "value": "outdoor"}]},
                    {"text": "Do you track your child's growth?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What concerns do you have about your child?", "type": "text"},
                ]
            },
            {
                "stage": "early_childhood",
                "assessment_type": "parent",
                "tier": "paid",
                "title": "Early Childhood Parenting Assessment (Paid)",
                "description": "Advanced insights and personalized activity plans.",
                "questions": [
                    {"text": "Do you observe any developmental delay?", "type": "mcq", "options": [{"label": "Yes", "score": 0}, {"label": "No", "score": 3}, {"label": "Not Sure", "score": 1}]},
                    {"text": "Which areas need improvement?", "type": "msq", "options": [{"label": "Speech", "value": "speech"}, {"label": "Motor Skills", "value": "motor"}, {"label": "Behavior", "value": "behavior"}, {"label": "Routine", "value": "routine"}]},
                    {"text": "Do you want personalized activity plans?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How consistent is your child's routine?", "type": "mcq", "options": [{"label": "Poor", "score": 0}, {"label": "Average", "score": 2}, {"label": "Good", "score": 4}]},
                    {"text": "Do you need expert parenting advice?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How often does your child show unusual behavior?", "type": "mcq", "options": [{"label": "Never", "score": 3}, {"label": "Sometimes", "score": 1}, {"label": "Often", "score": 0}]},
                    {"text": "Do you want detailed progress reports?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Which habits need improvement most?", "type": "text"},
                    {"text": "Do you want early risk detection?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What improvement do you expect for your child?", "type": "text"},
                ]
            },
            # ---- CHILD SELF-ASSESSMENTS (FIRST-PERSON) ----
            {
                "stage": "early_childhood",
                "assessment_type": "child",
                "tier": "free",
                "title": "My Fun Questions (Free)",
                "description": "Answer these fun questions about yourself!",
                "questions": [
                    {"text": "Do you like playing every day?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What do you like to play?", "type": "msq", "options": [{"label": "Toys", "value": "toys"}, {"label": "Drawing", "value": "drawing"}, {"label": "Music", "value": "music"}, {"label": "Outdoor", "value": "outdoor"}]},
                    {"text": "Do you like playing with your parent?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you like listening to stories?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What do you enjoy the most?", "type": "text"},
                    {"text": "Do you like playing outside?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you follow a daily routine?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you like learning new things?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What new activity do you want to try?", "type": "text"},
                    {"text": "Do you feel happy when you play?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                ]
            },
            {
                "stage": "early_childhood",
                "assessment_type": "child",
                "tier": "paid",
                "title": "My Fun Questions (Paid)",
                "description": "More advanced fun activities to help you grow!",
                "questions": [
                    {"text": "Do you want more fun learning games?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What type of activities do you want more of?", "type": "msq", "options": [{"label": "Games", "value": "games"}, {"label": "Puzzles", "value": "puzzles"}, {"label": "Drawing", "value": "drawing"}, {"label": "Music", "value": "music"}]},
                    {"text": "Do you like challenges?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want rewards for doing activities?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What do you want to improve?", "type": "text"},
                    {"text": "Do you want to learn new skills?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you like creative activities?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want more fun tasks?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Which activity do you enjoy most?", "type": "text"},
                    {"text": "Do you want to try new games?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                ]
            },

            # ==================== GROWING STAGE (Parent & Child) ====================
            {
                "stage": "growing_stage",
                "assessment_type": "parent",
                "tier": "free",
                "title": "Growing Stage Parenting Assessment (Free)",
                "description": "Track your child's progress in school and daily life.",
                "questions": [
                    {"text": "How many hours does your child study daily?", "type": "mcq", "options": [{"label": "<1", "score": 0}, {"label": "1-2", "score": 1}, {"label": ">2", "score": 2}]},
                    {"text": "How much screen time does your child use?", "type": "mcq", "options": [{"label": "<1", "score": 3}, {"label": "1-3", "score": 1}, {"label": ">3", "score": 0}]},
                    {"text": "Does your child complete tasks on time?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}, {"label": "Sometimes", "score": 1}]},
                    {"text": "Does your child play outdoor games?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What improvements are needed?", "type": "text"},
                    {"text": "Does your child follow routine?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Which habits need improvement?", "type": "msq", "options": [{"label": "Study", "value": "study"}, {"label": "Sleep", "value": "sleep"}, {"label": "Food", "value": "food"}, {"label": "Activity", "value": "activity"}]},
                    {"text": "Do you track performance?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Does your child get distracted?", "type": "mcq", "options": [{"label": "Yes", "score": 0}, {"label": "No", "score": 3}]},
                    {"text": "What is your main concern?", "type": "text"},
                ]
            },
            {
                "stage": "growing_stage",
                "assessment_type": "parent",
                "tier": "paid",
                "title": "Growing Stage Parenting Assessment (Paid)",
                "description": "Advanced analytics and personalized learning plans.",
                "questions": [
                    {"text": "Do you want detailed performance analysis?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Which areas need improvement most?", "type": "msq", "options": [{"label": "Focus", "value": "focus"}, {"label": "Discipline", "value": "discipline"}, {"label": "Skills", "value": "skills"}, {"label": "Routine", "value": "routine"}]},
                    {"text": "Do you need personalized learning plans?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want behavior insights?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How serious is screen addiction?", "type": "mcq", "options": [{"label": "Low", "score": 3}, {"label": "Medium", "score": 2}, {"label": "High", "score": 0}]},
                    {"text": "Do you want expert guidance?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want progress tracking reports?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What long-term goals do you have?", "type": "text"},
                    {"text": "Do you want AI recommendations?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What improvement do you expect?", "type": "text"},
                ]
            },
            # ---- CHILD SELF-ASSESSMENTS (FIRST-PERSON) ----
            {
                "stage": "growing_stage",
                "assessment_type": "child",
                "tier": "free",
                "title": "My Daily Fun (Free)",
                "description": "Tell us about your day!",
                "questions": [
                    {"text": "Do you finish your homework every day?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How many hours do you study?", "type": "mcq", "options": [{"label": "<1", "score": 0}, {"label": "1-2", "score": 2}, {"label": ">2", "score": 3}]},
                    {"text": "Do you play outdoor games?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What do you like to learn?", "type": "text"},
                    {"text": "Do you follow a daily routine?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you feel distracted sometimes?", "type": "mcq", "options": [{"label": "Yes", "score": 0}, {"label": "No", "score": 3}]},
                    {"text": "What do you enjoy most?", "type": "text"},
                    {"text": "Do you help your parent at home?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you like challenges?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What do you want to improve?", "type": "text"},
                ]
            },
            {
                "stage": "growing_stage",
                "assessment_type": "child",
                "tier": "paid",
                "title": "My Daily Fun (Paid)",
                "description": "Fun challenges and skill development for you!",
                "questions": [
                    {"text": "Do you want personalized learning help?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Which skill do you want to improve?", "type": "msq", "options": [{"label": "Study", "value": "study"}, {"label": "Sports", "value": "sports"}, {"label": "Creativity", "value": "creativity"}, {"label": "Logic", "value": "logic"}]},
                    {"text": "Do you want rewards for completing tasks?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you need help managing your time?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What goals do you want to achieve?", "type": "text"},
                    {"text": "Do you want fun learning modules?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want daily challenges?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want to track your progress?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want skill suggestions?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What improvement do you want?", "type": "text"},
                ]
            },

            # ==================== TEEN (Parent, Child, and Teen) ====================
            {
                "stage": "teen_age",
                "assessment_type": "parent",
                "tier": "free",
                "title": "Teen Parenting Assessment (Free)",
                "description": "Understand your teen's well-being and communication.",
                "questions": [
                    {"text": "Does your teen share thoughts with you?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you notice mood changes?", "type": "mcq", "options": [{"label": "Yes", "score": 0}, {"label": "No", "score": 3}]},
                    {"text": "How many hours does your teen sleep?", "type": "mcq", "options": [{"label": "<5", "score": 0}, {"label": "5-7", "score": 1}, {"label": ">7", "score": 3}]},
                    {"text": "Does your teen have clear goals?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What concerns you most?", "type": "text"},
                    {"text": "Does your teen follow a routine?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you know their interests?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Does your teen feel stressed?", "type": "mcq", "options": [{"label": "Yes", "score": 0}, {"label": "No", "score": 3}]},
                    {"text": "Do you communicate regularly?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What improvement do you want?", "type": "text"},
                ]
            },
            {
                "stage": "teen_age",
                "assessment_type": "parent",
                "tier": "paid",
                "title": "Teen Parenting Assessment (Paid)",
                "description": "Advanced mental health insights and career guidance.",
                "questions": [
                    {"text": "Do you want mental health insights?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Which area needs improvement?", "type": "msq", "options": [{"label": "Mood", "value": "mood"}, {"label": "Career", "value": "career"}, {"label": "Routine", "value": "routine"}, {"label": "Communication", "value": "communication"}]},
                    {"text": "Do you want career guidance?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you need expert counseling?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want risk alerts?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How serious are your concerns?", "type": "mcq", "options": [{"label": "Low", "score": 3}, {"label": "Medium", "score": 2}, {"label": "High", "score": 0}]},
                    {"text": "Do you want detailed reports?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want AI insights?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What long-term goals do you have for your teen?", "type": "text"},
                    {"text": "What improvement do you expect?", "type": "text"},
                ]
            },
            # ---- CHILD SELF-ASSESSMENTS (FIRST-PERSON) for TEEN (they are also 'child' type) ----
            {
                "stage": "teen_age",
                "assessment_type": "child",
                "tier": "free",
                "title": "My Teen Self‑Check (Free)",
                "description": "Answer these questions about your well-being and habits.",
                "questions": [
                    {"text": "Do you share your thoughts with your parents?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you notice mood changes in yourself?", "type": "mcq", "options": [{"label": "Yes", "score": 0}, {"label": "No", "score": 3}]},
                    {"text": "How many hours do you sleep?", "type": "mcq", "options": [{"label": "<5", "score": 0}, {"label": "5-7", "score": 1}, {"label": ">7", "score": 3}]},
                    {"text": "Do you have clear goals?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What concerns you most about yourself?", "type": "text"},
                    {"text": "Do you follow a daily routine?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you know your interests?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you often feel stressed?", "type": "mcq", "options": [{"label": "Yes", "score": 0}, {"label": "No", "score": 3}]},
                    {"text": "Do you communicate regularly with your parents?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What improvement do you want for yourself?", "type": "text"},
                ]
            },
            {
                "stage": "teen_age",
                "assessment_type": "child",
                "tier": "paid",
                "title": "My Teen Self‑Check (Paid)",
                "description": "Advanced insights for your mental health and career.",
                "questions": [
                    {"text": "Do you want mental health insights for yourself?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Which area do you want to improve?", "type": "msq", "options": [{"label": "Mood", "value": "mood"}, {"label": "Career", "value": "career"}, {"label": "Routine", "value": "routine"}, {"label": "Communication", "value": "communication"}]},
                    {"text": "Do you want career guidance?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you need expert counseling?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want risk alerts?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How serious are your concerns?", "type": "mcq", "options": [{"label": "Low", "score": 3}, {"label": "Medium", "score": 2}, {"label": "High", "score": 0}]},
                    {"text": "Do you want detailed reports?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want AI insights?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What long-term goals do you have?", "type": "text"},
                    {"text": "What improvement do you expect?", "type": "text"},
                ]
            },
            # ---- TEEN SELF-ASSESSMENTS (type='teen') remain unchanged ----
            {
                "stage": "teen_age",
                "assessment_type": "teen",
                "tier": "free",
                "title": "Teen Self-Assessment (Free)",
                "description": "Reflect on your feelings and habits.",
                "questions": [
                    {"text": "How do you feel most of the time?", "type": "mcq", "options": [{"label": "Happy", "score": 3}, {"label": "Neutral", "score": 2}, {"label": "Stressed", "score": 0}]},
                    {"text": "Do you have goals?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "How many hours do you sleep?", "type": "mcq", "options": [{"label": "<5", "score": 0}, {"label": "5-7", "score": 1}, {"label": ">7", "score": 3}]},
                    {"text": "Do you feel stressed?", "type": "mcq", "options": [{"label": "Yes", "score": 0}, {"label": "No", "score": 3}]},
                    {"text": "What do you want to improve?", "type": "text"},
                    {"text": "Do you follow a routine?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you talk to your parents?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What are your interests?", "type": "text"},
                    {"text": "Do you manage your time well?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you track your progress?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                ]
            },
            {
                "stage": "teen_age",
                "assessment_type": "teen",
                "tier": "paid",
                "title": "Teen Self-Assessment (Paid)",
                "description": "Deep insights for career, stress, and productivity.",
                "questions": [
                    {"text": "Do you want help with stress management?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Which area do you want to improve?", "type": "msq", "options": [{"label": "Mood", "value": "mood"}, {"label": "Career", "value": "career"}, {"label": "Goals", "value": "goals"}, {"label": "Habits", "value": "habits"}]},
                    {"text": "Do you want career guidance?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want mentoring support?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What career interests you?", "type": "text"},
                    {"text": "Do you want AI guidance?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want to improve productivity?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want goal tracking?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "Do you want emotional support tools?", "type": "mcq", "options": [{"label": "Yes", "score": 3}, {"label": "No", "score": 0}]},
                    {"text": "What improvement do you expect?", "type": "text"},
                ]
            },
        ]

        for item in assessments_data:
            assessment, created = Assessment.objects.update_or_create(
                assessment_type=item['assessment_type'],
                stage=item['stage'],
                tier=item['tier'],
                defaults={
                    'title': item['title'],
                    'description': item['description'],
                    'questions': item['questions'],
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created: {assessment}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Updated: {assessment}'))

        self.stdout.write(self.style.SUCCESS('✓ All assessments seeded successfully.'))
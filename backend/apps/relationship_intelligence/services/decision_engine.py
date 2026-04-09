import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Avg, Count
from apps.relationship_intelligence.models import RelationshipState, MoodCheckIn, BehaviorSignal, InteractionLog
from apps.relationship_intelligence.services.ai_prompts import get_ai_recommendation

logger = logging.getLogger(__name__)

class DecisionEngine:
    def __init__(self, parent, child):
        self.parent = parent
        self.child = child
        self.state, _ = RelationshipState.objects.get_or_create(parent=parent, child=child)

    def update_state_from_signals(self):
        """Recalculate trust_score and engagement_level based on recent signals."""
        # Engagement from mood check-ins last 7 days
        recent_moods = MoodCheckIn.objects.filter(child=self.child, timestamp__gte=timezone.now() - timedelta(days=7))
        if recent_moods.exists():
            mood_map = {'happy': 3, 'neutral': 2, 'low': 1, 'stressed': 0}
            avg_mood = sum(mood_map[m.mood] for m in recent_moods) / len(recent_moods)
            self.state.trust_score = int(avg_mood * 33)  # 0-100
        else:
            self.state.trust_score = max(0, self.state.trust_score - 5)

        # Engagement from interaction logs last 7 days
        interactions = InteractionLog.objects.filter(parent=self.parent, child=self.child, created_at__gte=timezone.now() - timedelta(days=7))
        followed = interactions.filter(action_taken='followed', outcome='positive').count()
        total = interactions.count()
        if total == 0:
            self.state.engagement_level = 'low'
        else:
            ratio = followed / total
            if ratio >= 0.6:
                self.state.engagement_level = 'high'
            elif ratio >= 0.3:
                self.state.engagement_level = 'medium'
            else:
                self.state.engagement_level = 'low'

        # Mode determination
        if self.state.trust_score < 40:
            self.state.current_mode = 'trust_rebuilding'
        elif self.state.engagement_level == 'low':
            self.state.current_mode = 'resistance_handling'
        else:
            self.state.current_mode = 'normal'

        # Save history
        self.state.trust_history.append({'date': timezone.now().isoformat(), 'score': self.state.trust_score})
        self.state.engagement_history.append({'date': timezone.now().isoformat(), 'level': self.state.engagement_level})
        if len(self.state.trust_history) > 30:
            self.state.trust_history = self.state.trust_history[-30:]
        if len(self.state.engagement_history) > 30:
            self.state.engagement_history = self.state.engagement_history[-30:]
        self.state.save()
        return self.state

    def get_recommendation(self):
        """Generate structured output for the parent."""
        self.update_state_from_signals()
        # Gather personalization data
        parent_style = self._infer_parent_style()
        child_response_history = self._get_child_response_history()
        best_time = self._best_time_of_day()

        # Call AI prompt (see ai_prompts.py)
        ai_output = get_ai_recommendation(
            mode=self.state.current_mode,
            trust_score=self.state.trust_score,
            engagement_level=self.state.engagement_level,
            parent_style=parent_style,
            child_history=child_response_history,
            best_time=best_time,
        )
        # Combine with deterministic fields
        recommendation = {
            "mode": self.state.current_mode,
            "emotional_state": self._detect_emotional_state(),
            "confidence": self._calculate_confidence(),
            "best_time_to_interact": best_time,
            "recommended_action": ai_output.get("recommended_action", ""),
            "conversation_prompts": ai_output.get("conversation_prompts", []),
            "alternative_actions": ai_output.get("alternative_actions", []),
            "do": ai_output.get("do", ""),
            "dont": ai_output.get("dont", ""),
            "parent_micro_tip": ai_output.get("parent_micro_tip", ""),
            "escalation_alert": ai_output.get("escalation_alert", ""),
        }
        return recommendation

    def _infer_parent_style(self):
        interactions = InteractionLog.objects.filter(parent=self.parent, child=self.child)[:10]
        if not interactions:
            return "casual"
        # Count types of actions taken
        actions = [i.action_taken for i in interactions if i.action_taken]
        if actions.count('followed') / len(actions) > 0.7:
            return "soft"
        elif actions.count('ignored') / len(actions) > 0.3:
            return "direct"
        return "casual"

    def _get_child_response_history(self):
        interactions = InteractionLog.objects.filter(parent=self.parent, child=self.child, outcome__isnull=False)[:20]
        return [{"outcome": i.outcome, "mode_before": i.mode_before} for i in interactions]

    def _detect_emotional_state(self):
        last_mood = MoodCheckIn.objects.filter(child=self.child).order_by('-timestamp').first()
        if last_mood:
            return last_mood.mood
        return "neutral"

    def _calculate_confidence(self):
        interactions = InteractionLog.objects.filter(parent=self.parent, child=self.child)
        if interactions.count() < 5:
            return 0.6
        success_rate = interactions.filter(outcome='positive').count() / interactions.count()
        return min(0.95, 0.5 + success_rate * 0.5)

    def _best_time_of_day(self):
        # Analyze past successful interactions by hour
        successes = InteractionLog.objects.filter(parent=self.parent, child=self.child, outcome='positive')
        if successes.count() < 3:
            return "Evening (7-9 PM)"
        hour_counts = {}
        for log in successes:
            hour = log.created_at.hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        if hour_counts:
            best_hour = max(hour_counts, key=hour_counts.get)
            return f"{best_hour}:00 - {best_hour+1}:00"
        return "Evening (7-9 PM)"
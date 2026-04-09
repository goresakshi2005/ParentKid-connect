from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.children.models import Child
from .models import MoodCheckIn, InteractionLog, ParentActionFeedback, BehaviorSignal
from .serializers import MoodCheckInSerializer, InteractionLogSerializer, ParentActionFeedbackSerializer, RelationshipStateSerializer
from .services.decision_engine import DecisionEngine
from .services.ai_prompts import get_ai_recommendation

class RelationshipStateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        child_id = request.query_params.get('child_id')
        child = get_object_or_404(Child, id=child_id, parent=request.user)
        engine = DecisionEngine(request.user, child)
        state = engine.state
        serializer = RelationshipStateSerializer(state)
        return Response(serializer.data)

class RecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        child_id = request.query_params.get('child_id')
        child = get_object_or_404(Child, id=child_id, parent=request.user)
        engine = DecisionEngine(request.user, child)
        rec = engine.get_recommendation()
        return Response(rec)

class MoodCheckInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MoodCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        # Optionally update relationship state
        child_id = request.data.get('child')
        if child_id:
            child = Child.objects.get(id=child_id, parent=request.user)
            engine = DecisionEngine(request.user, child)
            engine.update_state_from_signals()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class InteractionFeedbackView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Expects: { interaction_id, followed, outcome_rating, corrective_tip_given? }
        data = request.data
        interaction = get_object_or_404(InteractionLog, id=data['interaction_id'], parent=request.user)
        feedback = ParentActionFeedback.objects.create(
            parent=request.user,
            child=interaction.child,
            interaction=interaction,
            followed=data.get('followed', False),
            outcome_rating=data.get('outcome_rating'),
            corrective_tip_given=data.get('corrective_tip_given', '')
        )
        # Update interaction outcome if provided
        if data.get('outcome'):
            interaction.outcome = data['outcome']
            interaction.save()
        # Recalculate state
        engine = DecisionEngine(request.user, interaction.child)
        engine.update_state_from_signals()
        return Response({'status': 'ok'})

class BehaviorSignalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Can be called internally or by other apps (e.g., when a teen ignores a message)
        child_id = request.data.get('child_id')
        signal_type = request.data.get('signal_type')
        value = request.data.get('value', {})
        child = get_object_or_404(Child, id=child_id, parent=request.user)
        BehaviorSignal.objects.create(
            parent=request.user,
            child=child,
            signal_type=signal_type,
            value=value
        )
        engine = DecisionEngine(request.user, child)
        engine.update_state_from_signals()
        return Response({'status': 'recorded'})
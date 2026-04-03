import os
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.conf import settings
from .models import VoiceAssessmentSession
from .serializers import StartSessionSerializer, RespondSerializer, VoiceResultSerializer
from .services.audio_analyzer import analyze_audio
from .services.conversation_manager import (
    get_initial_question,
    process_response_and_get_next,
    is_conversation_complete,
    compute_final_report
)
import logging

logger = logging.getLogger(__name__)

class StartSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session = VoiceAssessmentSession.objects.create(user=request.user)
        first_question = get_initial_question()
        return Response({
            'session_id': session.session_id,
            'question': first_question,
            'question_number': 1,
            'max_questions': 5
        })

class RespondView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = RespondSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        session_id = serializer.validated_data['session_id']
        audio_file = serializer.validated_data['audio']

        try:
            session = VoiceAssessmentSession.objects.get(session_id=session_id, user=request.user)
        except VoiceAssessmentSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            vocal_features = analyze_audio(tmp_path)
            logger.info(f"Vocal features: {vocal_features}")

            history = session.conversation_history

            result = process_response_and_get_next(
                audio_path=tmp_path,
                vocal_features=vocal_features,
                history=history,
                current_turn=len(history)
            )

            new_entry = {
                'question': result['current_question'],
                'answer_text': result['transcript'],
                'vocal_features': vocal_features
            }
            session.conversation_history.append(new_entry)
            session.save()

            if result.get('is_complete', False):
                final_report = compute_final_report(session.conversation_history)
                session.stress_score = final_report['stress_score']
                session.confidence_score = final_report['confidence_score']
                session.fatigue_score = final_report['fatigue_score']
                session.stress_level = final_report['stress_level']
                session.insights = final_report['insights']
                session.recommendations = final_report['recommendations']
                session.status = 'completed'
                session.save()
                return Response({
                    'is_complete': True,
                    'result': VoiceResultSerializer(session).data
                })

            return Response({
                'is_complete': False,
                'question': result['next_question'],
                'question_number': len(session.conversation_history) + 1,
                'max_questions': 5
            })

        except Exception as e:
            logger.exception("Error processing voice response")
            return Response({'error': str(e)}, status=500)
        finally:
            os.unlink(tmp_path)

class ResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = VoiceAssessmentSession.objects.get(session_id=session_id, user=request.user)
        except VoiceAssessmentSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        if session.status != 'completed':
            return Response({'error': 'Assessment not completed yet'}, status=400)

        return Response(VoiceResultSerializer(session).data)


class LatestResultView(APIView):
    """
    GET /voice-assessments/latest/
    Returns the most recent completed voice assessment session for the
    logged-in user, or 404 if the user has never completed one.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = (
            VoiceAssessmentSession.objects
            .filter(user=request.user, status='completed')
            .order_by('-updated_at')
            .first()
        )
        if not session:
            return Response({'detail': 'No completed session found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(VoiceResultSerializer(session).data)
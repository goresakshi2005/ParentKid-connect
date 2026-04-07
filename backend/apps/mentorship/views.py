from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count

from .models import Mentor, MentorAssignment, ChatMessage
from .serializers import (
    MentorSerializer,
    MentorAssignmentSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
)


class MentorViewSet(viewsets.ViewSet):
    """List mentors and browse by specialization."""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """GET /api/mentorship/mentors/ — list all available mentors."""
        stage = request.query_params.get('stage')
        qs = Mentor.objects.filter(is_available=True)
        if stage:
            qs = qs.filter(specialization=stage)
        serializer = MentorSerializer(qs, many=True)
        return Response(serializer.data)


class MentorAssignmentViewSet(viewsets.ViewSet):
    """Assign / change / list mentor assignments."""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/mentorship/assignments/
        Returns the logged-in user's active assignments.
        If user is a mentor, also returns their client assignments.
        """
        user = request.user
        qs = MentorAssignment.objects.filter(
            Q(user=user) | Q(mentor__user=user),
            is_active=True,
        ).select_related('mentor__user', 'user')
        serializer = MentorAssignmentSerializer(
            qs, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def auto_assign(self, request):
        """
        POST /api/mentorship/assignments/auto_assign/
        Body: { "stage": "pregnancy" | "early_childhood" | ... }
        Auto-assigns the best mentor for the given stage.
        """
        stage = request.data.get('stage')
        if not stage:
            return Response(
                {'error': 'stage is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user already has an active assignment for this stage
        existing = MentorAssignment.objects.filter(
            user=request.user, stage=stage, is_active=True
        ).first()
        if existing:
            return Response(
                MentorAssignmentSerializer(
                    existing, context={'request': request}
                ).data
            )

        # Find mentors for this stage, ordered by least workload
        mentors = (
            Mentor.objects
            .filter(specialization=stage, is_available=True)
            .annotate(client_count=Count(
                'assignments',
                filter=Q(assignments__is_active=True),
            ))
            .order_by('client_count')
        )

        mentor = None
        for m in mentors:
            if m.client_count < m.max_clients:
                mentor = m
                break

        if not mentor:
            return Response(
                {'error': 'No mentors available for this stage right now.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        assignment = MentorAssignment.objects.create(
            user=request.user,
            mentor=mentor,
            stage=stage,
        )
        return Response(
            MentorAssignmentSerializer(
                assignment, context={'request': request}
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['post'])
    def change_mentor(self, request):
        """
        POST /api/mentorship/assignments/change_mentor/
        Body: { "assignment_id": 1, "new_mentor_id": 5 }
        Deactivates old assignment and creates a new one.
        """
        assignment_id = request.data.get('assignment_id')
        new_mentor_id = request.data.get('new_mentor_id')

        try:
            old = MentorAssignment.objects.get(
                id=assignment_id, user=request.user, is_active=True
            )
        except MentorAssignment.DoesNotExist:
            return Response(
                {'error': 'Assignment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            new_mentor = Mentor.objects.get(
                id=new_mentor_id, is_available=True
            )
        except Mentor.DoesNotExist:
            return Response(
                {'error': 'Mentor not found or unavailable'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not new_mentor.has_capacity:
            return Response(
                {'error': 'This mentor has reached their client limit.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deactivate old
        old.is_active = False
        old.deactivated_at = timezone.now()
        old.save()

        # Create new
        new_assignment = MentorAssignment.objects.create(
            user=request.user,
            mentor=new_mentor,
            stage=old.stage,
        )
        return Response(
            MentorAssignmentSerializer(
                new_assignment, context={'request': request}
            ).data,
            status=status.HTTP_201_CREATED,
        )


class ChatViewSet(viewsets.ViewSet):
    """Send / receive messages and mark-as-read."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='history/(?P<assignment_id>[0-9]+)')
    def history(self, request, assignment_id=None):
        """
        GET /api/mentorship/chat/history/<assignment_id>/
        Returns all messages for an assignment, oldest first.
        """
        try:
            assignment = MentorAssignment.objects.get(
                id=assignment_id,
            )
        except MentorAssignment.DoesNotExist:
            return Response(
                {'error': 'Assignment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only the user or mentor should see messages
        if request.user != assignment.user and request.user != assignment.mentor.user:
            return Response(
                {'error': 'Forbidden'},
                status=status.HTTP_403_FORBIDDEN,
            )

        messages = assignment.messages.order_by('timestamp')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def send(self, request):
        """
        POST /api/mentorship/chat/send/
        Body: { "assignment_id": 1, "message": "Hello mentor!" }
        """
        ser = SendMessageSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            assignment = MentorAssignment.objects.get(
                id=ser.validated_data['assignment_id'],
                is_active=True,
            )
        except MentorAssignment.DoesNotExist:
            return Response(
                {'error': 'Assignment not found or inactive'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Determine sender / receiver
        sender = request.user
        if sender == assignment.user:
            receiver = assignment.mentor.user
        elif sender == assignment.mentor.user:
            receiver = assignment.user
        else:
            return Response(
                {'error': 'You are not part of this assignment'},
                status=status.HTTP_403_FORBIDDEN,
            )

        msg = ChatMessage.objects.create(
            assignment=assignment,
            sender=sender,
            receiver=receiver,
            message=ser.validated_data['message'],
        )
        return Response(
            ChatMessageSerializer(msg).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """
        POST /api/mentorship/chat/mark_read/
        Body: { "assignment_id": 1 }
        Marks all messages sent TO the current user as read.
        """
        assignment_id = request.data.get('assignment_id')
        updated = ChatMessage.objects.filter(
            assignment_id=assignment_id,
            receiver=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response({'marked_read': updated})

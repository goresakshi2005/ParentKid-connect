from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Mentor, MentorAssignment, ChatMessage

User = get_user_model()


class MentorUserSerializer(serializers.ModelSerializer):
    """Minimal user info embedded in mentor responses."""
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'avatar']


class MentorSerializer(serializers.ModelSerializer):
    user = MentorUserSerializer(read_only=True)
    active_client_count = serializers.IntegerField(read_only=True)
    specialization_display = serializers.CharField(
        source='get_specialization_display', read_only=True
    )

    class Meta:
        model = Mentor
        fields = [
            'id', 'user', 'specialization', 'specialization_display',
            'bio', 'is_available', 'max_clients', 'active_client_count',
            'created_at',
        ]


class MentorAssignmentSerializer(serializers.ModelSerializer):
    mentor_detail = MentorSerializer(source='mentor', read_only=True)
    user_detail = MentorUserSerializer(source='user', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = MentorAssignment
        fields = [
            'id', 'user', 'mentor', 'mentor_detail', 'user_detail',
            'stage', 'is_active', 'assigned_at',
            'last_message', 'unread_count',
        ]

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-timestamp').first()
        if msg:
            return {
                'id': msg.id,
                'message': msg.message[:80],
                'sender_id': msg.sender_id,
                'timestamp': msg.timestamp.isoformat(),
                'is_read': msg.is_read,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(
                is_read=False
            ).exclude(sender=request.user).count()
        return 0


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'assignment', 'sender', 'receiver',
            'message', 'timestamp', 'is_read', 'sender_name',
        ]
        read_only_fields = ['sender', 'receiver', 'timestamp', 'is_read']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.email


class SendMessageSerializer(serializers.Serializer):
    """Input serializer for sending a message."""
    assignment_id = serializers.IntegerField()
    message = serializers.CharField(max_length=5000)

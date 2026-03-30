from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser, ParentTeenLink
from .serializers import UserSerializer, UserDetailSerializer
import secrets

class UserViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def signup(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'parent')
        invite_code = request.data.get('invite_code')
        
        if CustomUser.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Verify invite code for teens before account creation
        child_profile = None
        if role == 'teen':
            if not invite_code:
                return Response({'error': 'Invite code is required for Teen signup'}, status=400)
            
            from apps.children.models import Child
            child_profile = Child.objects.filter(invite_code=invite_code, stage='teen_age').first()
            if not child_profile:
                return Response({'error': 'Invalid invite code. Ask your parent for the code.'}, status=400)

        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            username=email,
        )
        
        # If Teen, link to parent immediately
        if role == 'teen' and child_profile:
            ParentTeenLink.objects.create(
                parent=child_profile.parent,
                teen=user,
                child=child_profile
            )

        # Auto-create free subscription for parents
        if role == 'parent':
            from apps.subscriptions.models import SubscriptionPlan, Subscription
            try:
                free_plan = SubscriptionPlan.objects.get(plan_name='free')
                Subscription.objects.create(user=user, plan=free_plan)
            except SubscriptionPlan.DoesNotExist:
                pass
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserDetailSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(username=email, password=password)
        
        if user is None:
            return Response({'error': 'Invalid credentials'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserDetailSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(UserDetailSerializer(request.user).data)
    
    @action(detail=False, methods=['post'])
    def generate_invite_code(self, request):
        if request.user.role != 'parent':
            return Response({'error': 'Only parents can generate invite codes'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        teen_email = request.data.get('teen_email')
        
        try:
            teen = CustomUser.objects.get(email=teen_email, role='teen')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Teen not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        invite_code = secrets.token_hex(5).upper()
        
        link, created = ParentTeenLink.objects.get_or_create(
            parent=request.user,
            teen=teen,
            defaults={'invite_code': invite_code}
        )
        
        return Response({
            'invite_code': link.invite_code,
            'message': f'Share this code with {teen_email}'
        })
    
    @action(detail=False, methods=['post'])
    def accept_invite(self, request):
        invite_code = request.data.get('invite_code')
        
        try:
            link = ParentTeenLink.objects.get(invite_code=invite_code)
        except ParentTeenLink.DoesNotExist:
            return Response({'error': 'Invalid invite code'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        if request.user != link.teen:
            return Response({'error': 'This invite is for a different user'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        from django.utils import timezone
        link.accepted_at = timezone.now()
        link.save()
        
        return Response({'message': 'Invite accepted'})
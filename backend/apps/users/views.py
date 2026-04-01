from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings
from .models import CustomUser, ParentTeenLink
from .serializers import UserSerializer, UserDetailSerializer
import secrets
import requests as http_requests
from urllib.parse import urlencode

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
        expecting = request.data.get('expecting', False)

        if CustomUser.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # Verify invite code for teens
        child_profile = None
        if role == 'teen':
            if not invite_code:
                return Response({'error': 'Invite code is required for Teen signup'}, status=400)
            from apps.children.models import Child
            child_profile = Child.objects.filter(invite_code=invite_code, stage='teen_age').first()
            if not child_profile:
                return Response({'error': 'Invalid invite code. Ask your parent for the code.'}, status=400)

        # Create user with standard fields only
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            username=email,
        )

        # Set is_expecting separately to avoid create_user() kwarg rejection
        if role == 'parent' and expecting:
            user.is_expecting = True
            user.save()

        # If Teen, link to parent
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

        # If expecting parent, create a pregnancy child
        if role == 'parent' and expecting:
            from apps.children.models import Child
            from datetime import date
            Child.objects.create(
                parent=user,
                name='Pregnancy Journey',
                date_of_birth=date.today(),
                stage='pregnancy'
            )

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

    # ✅ NEW: Returns Google OAuth URL for the frontend to redirect to
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def google_oauth_url(self, request):
        """Returns the Google OAuth2 authorization URL."""
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": (
                "https://www.googleapis.com/auth/calendar.events "
                "openid email profile"
            ),
            "access_type": "offline",
            "prompt": "consent",
        }
        url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
        return Response({"url": url})

    # ✅ NEW: Exchanges the Google auth code for tokens and saves them on the user
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def google_oauth_callback(self, request):
        """Exchange auth code for tokens and store on user."""
        code = request.data.get("code")
        if not code:
            return Response({"error": "No authorization code provided."}, status=400)

        token_response = http_requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
        )

        tokens = token_response.json()

        if "error" in tokens:
            return Response(
                {"error": f"Google token exchange failed: {tokens['error']}"},
                status=400
            )

        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        if not access_token:
            return Response({"error": "No access token returned by Google."}, status=400)

        # Save tokens on the user
        request.user.google_access_token = access_token
        if refresh_token:
            # refresh_token is only returned on first authorization or after consent
            request.user.google_refresh_token = refresh_token
        request.user.save()

        return Response({
            "message": "Google Calendar connected successfully!",
            "has_refresh_token": bool(refresh_token),
        })

    # ✅ NEW: Let frontend check whether this user has Google Calendar connected
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def google_status(self, request):
        """Returns whether the user has connected Google Calendar."""
        has_token = bool(
            getattr(request.user, 'google_access_token', None) and
            getattr(request.user, 'google_refresh_token', None)
        )
        return Response({"connected": has_token})

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
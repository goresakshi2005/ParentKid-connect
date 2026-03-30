from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SubscriptionPlan, Subscription
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer
import razorpay
from django.conf import settings

class SubscriptionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def plans(self, request):
        plans = SubscriptionPlan.objects.all()
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_subscription(self, request):
        try:
            subscription = Subscription.objects.get(user=request.user)
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response({'error': 'No active subscription'}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def create_order(self, request):
        plan_id = request.data.get('plan_id')
        
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        
        amount = int(plan.price * 100)
        
        order_data = {
            'amount': amount,
            'currency': plan.currency,
            'receipt': f'receipt_{request.user.id}_{plan.id}',
        }
        
        try:
            order = client.order.create(data=order_data)
            return Response({
                'order_id': order['id'],
                'amount': amount,
                'currency': plan.currency,
            })
        except Exception as e:
            return Response({'error': str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        plan_id = request.data.get('plan_id')
        
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        
        try:
            params = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            }
            
            client.utility.verify_payment_signature(params)
            
            plan = SubscriptionPlan.objects.get(id=plan_id)
            subscription, created = Subscription.objects.get_or_create(user=request.user)
            
            subscription.plan = plan
            subscription.razorpay_order_id = razorpay_order_id
            subscription.razorpay_payment_id = razorpay_payment_id
            subscription.status = 'active'
            subscription.save()
            
            return Response({
                'message': 'Payment verified and subscription activated',
                'subscription': SubscriptionSerializer(subscription).data
            })
        
        except Exception as e:
            return Response({'error': f'Payment verification failed: {str(e)}'}, 
                          status=status.HTTP_400_BAD_REQUEST)
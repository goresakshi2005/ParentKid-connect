import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';

function PricingCard({ plan }) {
  const { user } = useAuth();
  const { createOrder, verifyPayment } = useSubscription();
  const navigate = useNavigate();

  const handleSelectPlan = async () => {
    if (!user) {
      navigate('/login/parent');
      return;
    }

    if (plan.plan_name === 'free') return;

    try {
      const order = await createOrder(plan.id);

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: 'ParentKid Connect',
        description: `Upgrade to ${plan.plan_name} plan`,
        order_id: order.order_id,
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id
            });
            alert('Success! Your subscription is now active.');
            navigate('/dashboard/parent');
          } catch (err) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.first_name + ' ' + user.last_name,
          email: user.email,
        },
        theme: {
          color: '#ec4899', // Pink theme
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  return (
    <div className={`relative border rounded-3xl p-8 shadow-xl transition-all duration-500 hover:scale-[1.02] ${
      plan.plan_name === 'growth' || plan.plan_name === 'family' 
        ? 'bg-gradient-to-b from-white to-indigo-50/30 dark:from-slate-800 dark:to-slate-900 border-indigo-200 dark:border-indigo-900' 
        : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'
    }`}>
      {plan.plan_name === 'family' && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
          Most Popular
        </span>
      )}
      
      <h3 className="text-3xl font-black mb-1 dark:text-white capitalize">{plan.plan_name}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-5xl font-black dark:text-white">₹{Math.round(plan.price)}</span>
        <span className="text-gray-500 dark:text-slate-400 font-medium">/month</span>
      </div>

      <ul className="space-y-4 mb-10 min-h-[200px]">
        {plan.features && plan.features.map((feat, idx) => (
          <li key={idx} className="text-gray-600 dark:text-slate-300 flex items-start gap-3">
            <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium capitalize">{feat.replace(/_/g, ' ')}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSelectPlan}
        className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300 transform active:scale-[0.98] shadow-lg ${
          plan.plan_name === 'free'
            ? 'bg-gray-100 text-gray-500 cursor-default'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25 hover:shadow-indigo-500/40'
        }`}
      >
        {plan.plan_name === 'free' ? 'Current Plan' : 'Choose Plan'}
      </button>
    </div>
  );
}

export default PricingCard;
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

  const planDetails = {
    free: { name: 'Free', price: 0, features: ['Basic assessment', 'Basic tracking', '1 child profile', 'Limited insights'] },
    starter: { name: 'Starter', price: 500, features: ['Limited assessments', 'Basic tracking', '1 child profile'] },
    growth: { name: 'Growth', price: 1000, features: ['Unlimited assessments', 'Detailed insights', 'Personalized recommendations', 'Up to 3 child profiles', 'Progress comparison'] },
    family: { name: 'Family+', price: 2000, features: ['Unlimited child profiles', 'Advanced analytics', 'Downloadable reports', 'Priority features'] },
  };

  const details = planDetails[plan.plan_name] || planDetails.free;

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm hover:shadow-md dark:bg-slate-800 transition-all duration-300">
      <h3 className="text-2xl font-bold mb-2 dark:text-white">{details.name}</h3>
      <p className="text-4xl font-black mb-6 dark:text-white">₹{details.price}<span className="text-sm font-normal text-gray-500 dark:text-slate-400">/month</span></p>
      <ul className="space-y-3 mb-8">
        {details.features.map((feat, idx) => (
          <li key={idx} className="text-gray-600 dark:text-slate-300 flex items-center gap-2">
            <span className="text-green-500 dark:text-pink-500 font-bold">✓</span>
            {feat}
          </li>
        ))}
      </ul>
      <button
        onClick={handleSelectPlan}
        className={`w-full px-4 py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 transform active:scale-[0.98] ${plan.plan_name === 'free'
            ? 'bg-gray-100 text-gray-500 dark:bg-slate-700/50 dark:text-pink-400 border-2 border-pink-500 dark:border-pink-500'
            : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 dark:shadow-pink-500/25'
          }`}
      >
        {plan.plan_name === 'free' ? 'Default Plan' : 'Go Premium'}
      </button>
    </div>
  );
}

export default PricingCard;
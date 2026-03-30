import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';

function PricingCard({ plan }) {
  const { user } = useAuth();
  const { fetchSubscription } = useSubscription();
  const navigate = useNavigate();

  const handleSelectPlan = () => {
    if (!user) {
      navigate('/login/parent');
      return;
    }
    // Open payment modal (implement using Razorpay)
    console.log('Upgrade to plan:', plan.id);
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
      <p className="text-3xl font-bold mb-4 dark:text-blue-400">₹{details.price}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
      <ul className="space-y-2 mb-6">
        {details.features.map((feat, idx) => (
          <li key={idx} className="text-gray-600 dark:text-gray-300">✓ {feat}</li>
        ))}
      </ul>
      <button
        onClick={handleSelectPlan}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
      >
        {plan.plan_name === 'free' ? 'Current Plan' : 'Upgrade'}
      </button>
    </div>
  );
}

export default PricingCard;
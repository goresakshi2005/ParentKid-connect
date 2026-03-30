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
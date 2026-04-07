import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import PricingCard from '../components/Pricing/PricingCard';

function PricingPage() {
  const { user } = useAuth();
  const { plans, loading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login/parent');
    }
  }, [user, navigate]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 dark:border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 dark:text-slate-400 font-medium italic">Preparing plans...</p>
    </div>
  );

  const dashboardPath = user?.role === 'teen' ? '/dashboard/teen'
    : user?.is_expecting ? '/dashboard/pregnancy'
    : '/dashboard/parent';

  return (
    <div className="max-w-7xl mx-auto px-4 pt-10 pb-24 transition-colors duration-300">
      <button
        onClick={() => navigate(dashboardPath)}
        className="mb-6 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2 text-sm font-medium transition-colors"
      >
        ← Back to Dashboard
      </button>
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold mb-4 dark:text-white tracking-tight">Simple, <span className="dark:text-pink-500">Transparent</span> Pricing</h1>
        <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">Choose the perfect plan to unlock your child's full potential and track their growth journey with precision.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

export default PricingPage;
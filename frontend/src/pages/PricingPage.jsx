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

  if (loading) return <div className="text-center py-20">Loading plans...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 transition-colors duration-300">
      <h1 className="text-4xl font-bold text-center mb-12 dark:text-white">Simple, Transparent Pricing</h1>

      <div className="grid md:grid-cols-4 gap-8">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

export default PricingPage;
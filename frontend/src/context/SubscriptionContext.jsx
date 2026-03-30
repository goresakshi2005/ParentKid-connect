import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const { token } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchSubscription();
      fetchPlans();
    }
  }, [token]);

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/subscriptions/my_subscription/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/subscriptions/plans/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const isPremium = () => {
    return subscription && subscription.plan.plan_name !== 'free' && subscription.status === 'active';
  };

  const canCreateChildren = () => {
    if (!subscription) return false;
    return subscription.plan.max_child_profiles > 0;
  };

  const canAccessInsights = () => {
    return subscription?.plan.detailed_insights || false;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        plans,
        loading,
        isPremium,
        canCreateChildren,
        canAccessInsights,
        fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export default SubscriptionProvider;
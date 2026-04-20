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
    } else {
      setLoading(false);
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

  // New: get user tier as 'free' or 'paid'
  const getUserTier = () => {
    if (!subscription) return 'free';
    const planName = subscription.plan.plan_name;
    return planName === 'free' ? 'free' : 'paid';
  };

  const createOrder = async (planId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/subscriptions/create_order/`,
        { plan_id: planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/subscriptions/verify_payment/`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchSubscription();
      return response.data;
    } catch (error) {
      console.error('Failed to verify payment:', error);
      throw error;
    }
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
        getUserTier,
        createOrder,
        verifyPayment,
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
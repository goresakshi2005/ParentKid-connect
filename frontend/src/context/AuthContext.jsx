import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      // 1. Fetch Basic User Info
      const userResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/me/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const userData = userResponse.data;

      // 2. Fetch Subscription Features
      try {
        const featureResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/subscriptions/my-features/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        userData.features = featureResponse.data.features;
        userData.plan = featureResponse.data.plan;
      } catch (fErr) {
        console.warn('Failed to fetch features:', fErr);
        userData.features = [];
        userData.plan = "FREE";
      }

      // Always merge is_expecting from localStorage
      if (!userData.is_expecting) {
        userData.is_expecting = localStorage.getItem('is_expecting') === 'true';
      }

      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setToken(null);
      setUser(null);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const refreshFeatures = async () => {
    if (!token) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/subscriptions/my-features/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(prev => ({
        ...prev,
        features: response.data.features,
        plan: response.data.plan
      }));
    } catch (error) {
      console.error('Failed to refresh features:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/users/login/`,
        { email, password }
      );
      const { access, user } = response.data;
      localStorage.setItem('access_token', access);

      if (!user.is_expecting) {
        user.is_expecting = localStorage.getItem('is_expecting') === 'true';
      }

      setToken(access);
      setUser(user);
      return user;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const signup = async (email, password, firstName, lastName, role, inviteCode = null, expecting = false) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/users/signup/`,
        { email, password, first_name: firstName, last_name: lastName, role, invite_code: inviteCode, expecting }
      );
      const { access, user } = response.data;

      if (role === 'parent' && expecting) {
        localStorage.setItem('is_expecting', 'true');
        user.is_expecting = true;
      } else {
        localStorage.removeItem('is_expecting');
      }

      localStorage.setItem('access_token', access);
      setToken(access);
      setUser(user);
      return user;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('is_expecting');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, token, refreshFeatures }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;
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
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/me/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setToken(null);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
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
      setToken(access);
      setUser(user);
      return user;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const signup = async (email, password, firstName, lastName, role, inviteCode = null) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/users/signup/`,
        { email, password, first_name: firstName, last_name: lastName, role, invite_code: inviteCode }
      );
      const { access, user } = response.data;
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
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;
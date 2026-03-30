import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AuthGuard({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  if (!user) {
    return <Navigate to={`/login/${role}`} />;
  }

  if (user.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
}

export default AuthGuard;
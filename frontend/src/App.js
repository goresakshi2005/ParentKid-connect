import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import ParentDashboard from './pages/ParentDashboard';
import TeenDashboard from './pages/TeenDashboard';
import LoginParent from './components/Auth/LoginParent';
import SignupParent from './components/Auth/SignupParent';
import LoginTeen from './components/Auth/LoginTeen';
import SignupTeen from './components/Auth/SignupTeen';
import AuthGuard from './components/Auth/AuthGuard';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-white transition-colors duration-300">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login/parent" element={<LoginParent />} />
          <Route path="/signup/parent" element={<SignupParent />} />
          <Route path="/login/teen" element={<LoginTeen />} />
          <Route path="/signup/teen" element={<SignupTeen />} />

          <Route
            path="/dashboard/parent"
            element={
              <AuthGuard role="parent">
                <ParentDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/dashboard/teen"
            element={
              <AuthGuard role="teen">
                <TeenDashboard />
              </AuthGuard>
            }
          />

          <Route path="/dashboard" element={<Navigate to="/" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
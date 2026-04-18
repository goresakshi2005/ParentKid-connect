import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import TeenDashboard from './pages/TeenDashboard';
import PregnancyDashboard from './pages/PregnancyDashboard';
import LoginParent from './components/Auth/LoginParent';
import SignupParent from './components/Auth/SignupParent';
import SignupExpecting from './components/Auth/SignupExpecting';
import LoginTeen from './components/Auth/LoginTeen';
import SignupTeen from './components/Auth/SignupTeen';
import AuthGuard from './components/Auth/AuthGuard';
import NotFound from './pages/NotFound';
import ParentRouter from './components/ParentRouter';
import GoogleCallback from './pages/GoogleCallback';
import VoiceAssessmentPage from './pages/VoiceAssessmentPage';
import MentorChatPageWrapper from './pages/MentorChatPageWrapper';
import RelationshipIntelligencePage from './pages/RelationshipIntelligencePage';
import EarlyChildhoodIntelligencePage from './pages/EarlyChildhoodIntelligencePage';
import MagicFixPage from './pages/MagicFixPage';
import { useAuth } from './context/AuthContext';

import ScreenTimePage from './pages/ScreenTimePage';
import DeviceManagerPage from './pages/DeviceManagerPage';

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
          <Route path="/signup/expecting" element={<SignupExpecting />} />
          <Route path="/login/teen" element={<LoginTeen />} />
          <Route path="/signup/teen" element={<SignupTeen />} />
          <Route path="/google-callback" element={<GoogleCallback />} />

          {/* Voice Assessment page */}
          <Route
            path="/voice-assessment"
            element={
              <AuthGuard role="parent">
                <VoiceAssessmentPage />
              </AuthGuard>
            }
          />

          {/* Parent dashboards */}
          <Route
            path="/dashboard/parent"
            element={
              <AuthGuard role="parent">
                <ParentRouter />
              </AuthGuard>
            }
          />
          
          {/* Interactive AI Relationship Intelligence Page */}
          <Route
            path="/relationship-intelligence/:childId"
            element={
              <AuthGuard role="parent">
                <RelationshipIntelligencePage />
              </AuthGuard>
            }
          />
          
          {/* Magic Fix Engine */}
          <Route
            path="/magic-fix/:childId"
            element={
              <AuthGuard role="parent">
                <MagicFixPage />
              </AuthGuard>
            }
          />
          
          {/* Early Childhood Tracking */}
          <Route
            path="/early-childhood/:childId"
            element={
              <AuthGuard role="parent">
                <EarlyChildhoodIntelligencePage />
              </AuthGuard>
            }
          />

          <Route
            path="/dashboard/pregnancy"
            element={
              <AuthGuard role="parent">
                <PregnancyDashboard />
              </AuthGuard>
            }
          />

          {/* Teen dashboard */}
          <Route
            path="/dashboard/teen"
            element={
              <AuthGuard role="teen">
                <TeenDashboard />
              </AuthGuard>
            }
          />

          {/* Mentor Chat routes */}
          <Route
            path="/mentor-chat"
            element={
              <AuthGuard role="parent">
                <MentorChatPageWrapper />
              </AuthGuard>
            }
          />
          <Route
            path="/mentor-chat/teen"
            element={
              <AuthGuard role="teen">
                <MentorChatPageWrapper />
              </AuthGuard>
            }
          />
          <Route
            path="/dashboard/mentor"
            element={
              <AuthGuard role="mentor">
                <MentorChatPageWrapper />
              </AuthGuard>
            }
          />

          {/* Fallback routes */}
          <Route path="/dashboard" element={<Navigate to="/" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
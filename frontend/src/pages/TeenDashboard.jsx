import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function TeenDashboard() {
  const { user, token } = useAuth();
  const { canAccessInsights } = useSubscription();
  const [results, setResults] = useState([]);
  const [showAssessmentPrompt, setShowAssessmentPrompt] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [token]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/assessments/my_results/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data.results || response.data;
      setResults(data);
      if (data.length > 0) {
        setShowAssessmentPrompt(false);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading dashboard...</div>;

  const chartData = results.map((r) => ({
    date: new Date(r.created_at).toLocaleDateString(),
    score: r.final_score,
  }));

  const latestResult = results[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Growth Dashboard</h1>

      {showAssessmentPrompt && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded">
          <h3 className="text-lg font-semibold mb-2">Unlock Your Growth Insights</h3>
          <p className="text-gray-700 mb-4">
            Take a quick self-assessment to get personalized insights and track your growth
          </p>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Start Assessment
            </button>
            <button
              onClick={() => setShowAssessmentPrompt(false)}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {latestResult ? (
        <>
          <div className="bg-white p-8 rounded-lg shadow mb-8">
            <h2 className="text-2xl font-semibold mb-6">Latest Assessment</h2>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded">
                <p className="text-3xl font-bold text-blue-600">{latestResult.final_score}%</p>
                <p className="text-sm text-gray-600">Overall Score</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <p className="text-3xl font-bold text-green-600">{latestResult.health_score}%</p>
                <p className="text-sm text-gray-600">Health</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <p className="text-3xl font-bold text-orange-600">{latestResult.behavior_score}%</p>
                <p className="text-sm text-gray-600">Behavior</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <p className="text-3xl font-bold text-purple-600">{latestResult.routine_score}%</p>
                <p className="text-sm text-gray-600">Routine</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <p className="text-3xl font-bold text-red-600">{latestResult.emotional_score}%</p>
                <p className="text-sm text-gray-600">Emotional</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div>
                <h3 className="font-semibold text-green-600 mb-2">Your Strengths</h3>
                <ul className="space-y-2">
                  {latestResult.strengths.map((strength, idx) => (
                    <li key={idx} className="text-gray-700">✓ {strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-orange-600 mb-2">Areas to Improve</h3>
                <ul className="space-y-2">
                  {latestResult.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-gray-700">→ {improvement}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-4">Recommendations</h3>
              {canAccessInsights() ? (
                <div className="bg-blue-50 p-4 rounded space-y-2">
                  {latestResult.recommendations.map((rec, idx) => (
                    <p key={idx} className="text-gray-700">
                      {idx + 1}. {rec}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded text-center">
                  <p className="text-gray-700">Upgrade to Growth plan to unlock personalized recommendations.</p>
                  <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Upgrade</button>
                </div>
              )}
            </div>
          </div>

          {results.length > 1 && (
            <div className="bg-white p-8 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-6">Progress Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p>You haven't taken any assessments yet.</p>
          <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded">Start Assessment</button>
        </div>
      )}
    </div>
  );
}

export default TeenDashboard;
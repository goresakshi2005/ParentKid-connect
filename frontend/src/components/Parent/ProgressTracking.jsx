import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSubscription } from '../../context/SubscriptionContext';

function ProgressTracking({ childId, child }) {
  const { token } = useAuth();
  const { canAccessInsights } = useSubscription();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [childId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/assessments/my_results/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data.results || response.data;
      const childResults = data.filter(r => r.child?.id === childId);
      setResults(childResults);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = results.map(r => ({
    date: new Date(r.created_at).toLocaleDateString(),
    score: r.final_score,
  }));

  const latest = results[0];

  if (loading) return <div>Loading progress...</div>;

  return (
    <div className="space-y-6">
      {latest ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Latest Assessment for {child.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-blue-600">{latest.final_score}%</p>
              <p className="text-sm text-gray-600">Overall</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-green-600">{latest.health_score}%</p>
              <p className="text-sm text-gray-600">Health</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-orange-600">{latest.behavior_score}%</p>
              <p className="text-sm text-gray-600">Behavior</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-purple-600">{latest.routine_score}%</p>
              <p className="text-sm text-gray-600">Routine</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-red-600">{latest.emotional_score}%</p>
              <p className="text-sm text-gray-600">Emotional</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-semibold text-green-600">Strengths</h4>
              <ul className="list-disc pl-5">
                {latest.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-600">Areas to Improve</h4>
              <ul className="list-disc pl-5">
                {latest.improvements.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Recommendations</h4>
            {canAccessInsights() ? (
              <ul className="list-disc pl-5">
                {latest.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
              </ul>
            ) : (
              <div className="bg-gray-100 p-4 rounded text-center">
                <p className="text-gray-700">Upgrade to Growth plan for personalized recommendations.</p>
                <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Upgrade</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p>No assessments completed yet.</p>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Take Assessment</button>
        </div>
      )}

      {results.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Progress Over Time</h3>
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
    </div>
  );
}

export default ProgressTracking;
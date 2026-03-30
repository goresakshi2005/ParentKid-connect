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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 dark:border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 dark:text-slate-400 font-medium italic">Analyzing progress...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {latest ? (
        <div className="card dark:bg-slate-900 border dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 dark:bg-pink-500/10 rounded text-blue-600 dark:text-pink-500">📈</span>
            Latest Assessment for {child.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
              <p className="text-3xl font-black text-blue-600 dark:text-pink-500 mb-1">{latest.final_score}%</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Overall</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
              <p className="text-3xl font-black text-green-600 mb-1">{latest.health_score}%</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Health</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
              <p className="text-3xl font-black text-orange-600 mb-1">{latest.behavior_score}%</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Behavior</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
              <p className="text-3xl font-black text-purple-600 mb-1">{latest.routine_score}%</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Routine</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
              <p className="text-3xl font-black text-red-600 mb-1">{latest.emotional_score}%</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Emotional</p>
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
            <h4 className="font-bold mb-4 dark:text-white">Recommendations</h4>
            {canAccessInsights() ? (
              <div className="bg-blue-50 dark:bg-pink-500/5 p-6 rounded-2xl border border-blue-100 dark:border-pink-500/20 shadow-inner">
                <ul className="space-y-3">
                  {latest.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-3 dark:text-slate-300 italic">
                      <span className="text-blue-500 dark:text-pink-500 font-bold">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-slate-800 p-8 rounded-2xl text-center border dark:border-slate-700">
                <p className="text-gray-700 dark:text-slate-400 mb-4 font-medium">Upgrade to Growth plan for personalized AI-powered recommendations.</p>
                <button className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg dark:shadow-pink-500/20 transition-all">Upgrade Plan</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card dark:bg-slate-900 border dark:border-slate-800 p-12 text-center shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-pink-500/10 rounded-full flex items-center justify-center mb-4 text-3xl">📝</div>
          <p className="text-gray-600 dark:text-slate-400 mb-6 text-lg font-medium italic">No assessments completed for {child.name} yet.</p>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg dark:shadow-pink-500/20 transition-all">
            Take Assessment
          </button>
        </div>
      )}

      {results.length > 1 && (
        <div className="card dark:bg-slate-900 border dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-lg font-bold mb-6 dark:text-white tracking-tight uppercase text-xs">Progress Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }}
                itemStyle={{ color: '#ec4899' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#ec4899" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#ec4899', strokeWidth: 2, stroke: '#ffffff' }} 
                activeDot={{ r: 8, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ProgressTracking;
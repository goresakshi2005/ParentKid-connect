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
        if (childId) {
            fetchResults();
        }
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
        <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600 dark:border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 mt-2">Loading results...</p>
        </div>
    );

    if (!latest) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-slate-400">No assessments completed yet.</p>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Take First Assessment</button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600 dark:text-pink-500">{latest.final_score}%</p>
                    <p className="text-xs text-gray-500">Overall</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{latest.health_score}%</p>
                    <p className="text-xs text-gray-500">Health</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-2xl font-bold text-orange-600">{latest.behavior_score}%</p>
                    <p className="text-xs text-gray-500">Behavior</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-2xl font-bold text-purple-600">{latest.routine_score}%</p>
                    <p className="text-xs text-gray-500">Routine</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl col-span-2">
                    <p className="text-2xl font-bold text-red-600">{latest.emotional_score}%</p>
                    <p className="text-xs text-gray-500">Emotional</p>
                </div>
            </div>

            {results.length > 1 && (
                <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                            <Tooltip />
                            <Line type="monotone" dataKey="score" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {canAccessInsights() && latest.recommendations && latest.recommendations.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-pink-500/10 rounded-lg">
                    <p className="font-semibold text-sm mb-2">Recommendations:</p>
                    <ul className="text-xs space-y-1">
                        {latest.recommendations.map((rec, i) => (
                            <li key={i}>• {rec}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default ProgressTracking;
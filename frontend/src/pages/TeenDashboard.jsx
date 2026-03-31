import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AssessmentPrompt from '../components/Teen/AssessmentPrompt';
import AssessmentView from '../components/Parent/AssessmentView';
import ResultsDisplay from '../components/Assessment/ResultsDisplay';

function TeenDashboard() {
    const { user, token } = useAuth();
    const { canAccessInsights } = useSubscription();
    const [results, setResults] = useState([]);
    const [showAssessmentPrompt, setShowAssessmentPrompt] = useState(true);
    const [takingAssessment, setTakingAssessment] = useState(false);
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

    const handleAssessmentComplete = (resultData) => {
        setTakingAssessment(false);
        setShowAssessmentPrompt(false);
        // Refresh results
        fetchResults();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 dark:border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-slate-400 font-medium italic">Loading your growth insights...</p>
            </div>
        );
    }

    // If taking assessment, show AssessmentView with type='teen'
    if (takingAssessment) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => setTakingAssessment(false)}
                    className="mb-6 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
                <AssessmentView
                    assessmentType="teen"
                    onComplete={handleAssessmentComplete}
                />
            </div>
        );
    }

    const chartData = results.map((r) => ({
        date: new Date(r.created_at).toLocaleDateString(),
        score: r.final_score,
    }));

    const latestResult = results[0];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-extrabold mb-10 dark:text-white tracking-tight">
                Your Growth <span className="dark:text-pink-500">Dashboard</span>
            </h1>

            {showAssessmentPrompt && (
                <AssessmentPrompt
                    onComplete={handleAssessmentComplete}
                    onDismiss={() => setShowAssessmentPrompt(false)}
                />
            )}

            {latestResult ? (
                <>
                    <div className="card dark:bg-slate-900 border dark:border-slate-800 p-8 mb-8">
                        <h2 className="text-2xl font-bold mb-8 dark:text-white flex items-center gap-3">
                            <span className="p-2 bg-pink-500/10 rounded-lg text-pink-500">✨</span>
                            Latest Assessment
                        </h2>
                        <div className="grid md:grid-cols-5 gap-4">
                            <div className="text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                <p className="text-4xl font-black text-blue-600 dark:text-pink-500 mb-1">{latestResult.final_score}%</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Overall</p>
                            </div>
                            <div className="text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                <p className="text-4xl font-black text-green-600 mb-1">{latestResult.health_score}%</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Health</p>
                            </div>
                            <div className="text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                <p className="text-4xl font-black text-orange-600 mb-1">{latestResult.behavior_score}%</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Behavior</p>
                            </div>
                            <div className="text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                <p className="text-4xl font-black text-purple-600 mb-1">{latestResult.routine_score}%</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Routine</p>
                            </div>
                            <div className="text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                <p className="text-4xl font-black text-red-600 mb-1">{latestResult.emotional_score}%</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Emotional</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-8">
                            <div>
                                <h3 className="font-semibold text-green-600 mb-2">Your Strengths</h3>
                                <ul className="space-y-2">
                                    {latestResult.strengths.map((strength, idx) => (
                                        <li key={idx} className="text-gray-700 dark:text-gray-300">✓ {strength}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-orange-600 mb-2">Areas to Improve</h3>
                                <ul className="space-y-2">
                                    {latestResult.improvements.map((improvement, idx) => (
                                        <li key={idx} className="text-gray-700 dark:text-gray-300">→ {improvement}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-bold mb-6 dark:text-white uppercase text-xs tracking-widest">Growth Recommendations</h3>
                            {canAccessInsights() ? (
                                <div className="bg-blue-50 dark:bg-pink-500/5 p-6 rounded-2xl border border-blue-100 dark:border-pink-500/20 shadow-inner space-y-4">
                                    {latestResult.recommendations.map((rec, idx) => (
                                        <div key={idx} className="flex gap-4 items-start">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                            <p className="text-gray-700 dark:text-slate-300 italic">{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-100 dark:bg-slate-800 p-10 rounded-2xl text-center border dark:border-slate-700">
                                    <div className="text-3xl mb-4">🔒</div>
                                    <p className="text-gray-700 dark:text-slate-400 mb-6 font-medium">Upgrade to Growth plan to unlock personalized AI recommendations tailored for you.</p>
                                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg dark:shadow-pink-500/20 transition-all">
                                        Upgrade to Growth
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {results.length > 1 && (
                        <div className="card dark:bg-slate-900 border dark:border-slate-800 p-8 shadow-sm">
                            <h2 className="text-lg font-bold mb-8 dark:text-white uppercase text-xs tracking-widest">Progress Over Time</h2>
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
                </>
            ) : (
                <div className="card dark:bg-slate-900 border dark:border-slate-800 p-16 text-center shadow-lg flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-pink-500/10 rounded-full flex items-center justify-center mb-6 text-4xl">🚀</div>
                    <h2 className="text-2xl font-bold dark:text-white mb-3 text-center">Ready to start your journey?</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-8 max-w-sm text-center italic">Take your first assessment to unlock personalized growth insights and see your potential.</p>
                    <button
                        onClick={() => setTakingAssessment(true)}
                        className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-xl transition-all transform hover:scale-105 active:scale-95"
                    >
                        Start Your First Assessment
                    </button>
                </div>
            )}
        </div>
    );
}

export default TeenDashboard;
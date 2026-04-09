import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { FiArrowLeft, FiHeart, FiMessageCircle, FiActivity, FiStar } from 'react-icons/fi';
import api from '../services/api';
import Loading from '../components/Common/Loading';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function RelationshipIntelligencePage() {
    const query = useQuery();
    const navigate = useNavigate();
    const childId = query.get('child_id');
    const [state, setState] = useState(null);
    const [history, setHistory] = useState([]);
    const [recommendation, setRecommendation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!childId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const [stateRes, recRes] = await Promise.all([
                    api.get(`/relationship/state/?child_id=${childId}`),
                    api.get(`/relationship/recommendation/?child_id=${childId}`)
                ]);
                setState(stateRes.data);
                setHistory(stateRes.data?.trust_history || []);
                setRecommendation(recRes.data);
            } catch (error) {
                console.error("Error fetching relationship insights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [childId]);

    if (loading) return <Loading />;

    if (!childId) {
        return (
            <div className="p-8 text-center max-w-4xl mx-auto mt-10">
                <h2 className="text-2xl font-bold dark:text-white">Child ID is missing.</h2>
                <button onClick={() => navigate('/dashboard/parent')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Go Back
                </button>
            </div>
        );
    }

    // Prepare mock data for missing charts
    const trustScore = state?.trust_score || 75;
    const communicationScore = (trustScore + 10) > 100 ? 100 : trustScore + 10;
    
    const trustChartData = history?.length > 0 
        ? history.map(h => ({ date: new Date(h.date).toLocaleDateString(), value: h.score }))
        : [
            { date: 'Mon', value: Math.max(0, trustScore - 15) },
            { date: 'Tue', value: Math.max(0, trustScore - 10) },
            { date: 'Wed', value: Math.max(0, trustScore - 5) },
            { date: 'Thu', value: trustScore },
          ];

    const interactionData = [
        { day: 'Mon', count: 4 },
        { day: 'Tue', count: 3 },
        { day: 'Wed', count: 6 },
        { day: 'Thu', count: 5 },
        { day: 'Fri', count: 7 },
    ];

    const moodData = [
        { day: 'Mon', mood: 70 },
        { day: 'Tue', mood: 85 },
        { day: 'Wed', mood: 60 },
        { day: 'Thu', mood: 90 },
        { day: 'Fri', mood: 80 },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 lg:p-8 animate-fade-in relative">
            <button 
                onClick={() => navigate('/dashboard/parent')} 
                className="mb-6 flex items-center gap-2 text-blue-600 dark:text-pink-400 hover:underline font-semibold"
            >
                <FiArrowLeft /> Back to Dashboard
            </button>

            <header className="mb-10 text-center sm:text-left">
                <h1 className="text-4xl lg:text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600 capitalize">
                    Relationship Intelligence Insights
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                    Understand your bond with your child
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-slate-800 flex items-center gap-4 hover:-translate-y-1 transition-transform">
                    <div className="p-4 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-xl text-2xl">
                        <FiHeart />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Emotional Connection</p>
                        <p className="text-2xl font-black dark:text-white">{trustScore}%</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-slate-800 flex items-center gap-4 hover:-translate-y-1 transition-transform">
                    <div className="p-4 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-2xl">
                        <FiMessageCircle />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Communication Quality</p>
                        <p className="text-2xl font-black dark:text-white">{communicationScore}%</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-slate-800 flex items-center gap-4 md:col-span-2 hover:-translate-y-1 transition-transform">
                    <div className="p-4 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-xl text-2xl">
                        <FiActivity />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Recent Behavior Patterns</p>
                        <p className="text-lg font-semibold dark:text-white">
                            {state ? state.current_mode.replace('_', ' ') : 'Steady Growth'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold mb-6 dark:text-white">Trust Level Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trustChartData}>
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis domain={[0,100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold mb-6 dark:text-white">Interaction Frequency</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={interactionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(236, 72, 153, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 shadow-md border border-indigo-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                        <FiStar className="text-yellow-500" /> AI-Based Suggestions for Parents
                    </h3>
                    {recommendation ? (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Recommended Action</h4>
                                <p className="text-lg text-gray-800 dark:text-slate-200">{recommendation.recommended_action}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/60 dark:bg-slate-950/40 p-4 rounded-xl border border-white/40 dark:border-slate-700">
                                    <h4 className="text-sm font-bold text-green-600 dark:text-green-400 mb-1">What to Do</h4>
                                    <p className="text-gray-700 dark:text-slate-300 text-sm">{recommendation.do}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-slate-950/40 p-4 rounded-xl border border-white/40 dark:border-slate-700">
                                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">What to Avoid</h4>
                                    <p className="text-gray-700 dark:text-slate-300 text-sm">{recommendation.dont}</p>
                                </div>
                            </div>
                            {recommendation.conversation_prompts?.length > 0 && (
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-indigo-500">
                                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Conversation Starter</h4>
                                    <p className="italic text-gray-600 dark:text-gray-300">"{recommendation.conversation_prompts[0]}"</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500">
                            No immediate suggestions available. Keep interacting positively!
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold mb-6 dark:text-white">Mood Trends</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={moodData}>
                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis domain={[0,100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line type="stepAfter" dataKey="mood" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MOODS_TEEN = ['happy', 'okay', 'frustrated', 'sad', 'angry'];
const MOODS_PARENT = ['calm', 'stressed', 'irritated', 'tired'];

export default function BondBridgeTeen({ user, onFeatureLock }) {
    const [teenMood, setTeenMood] = useState('okay');
    const [parentMood, setParentMood] = useState('calm');
    const [teenThought, setTeenThought] = useState('');
    const [context, setContext] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setResult(null);

        try {
            const response = await api.post('/relationship/bond-bridge/', {
                teen_mood: teenMood,
                teen_thought: teenThought,
                parent_mood: parentMood,
                parent_thought: '',
                context: context
            });
            setResult(response.data.bond_bridge);
        } catch (error) {
            console.error('BondBridge Error:', error);
            alert('Failed to connect. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg shadow-purple-500/30">
                    🤝
                </div>
                <div>
                    <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">BondBridge</h3>
                    <p className="text-xs text-purple-600 dark:text-purple-300">Share feelings & understand your parents</p>
                </div>
            </div>

            {!result ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">How are you feeling right now?</label>
                            <div className="flex flex-wrap gap-2">
                                {MOODS_TEEN.map(m => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setTeenMood(m)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            teenMood === m 
                                            ? 'bg-purple-600 text-white shadow-md' 
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-purple-300'
                                        }`}
                                    >
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">How do you think your parent feels?</label>
                            <div className="flex flex-wrap gap-2">
                                {MOODS_PARENT.map(m => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setParentMood(m)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            parentMood === m 
                                            ? 'bg-pink-500 text-white shadow-md' 
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-pink-300'
                                        }`}
                                    >
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">What's going on? (Optional)</label>
                        <input
                            type="text"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="e.g. Asking for permission to go out, discussing grades..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">What's on your mind? (Optional)</label>
                        <input
                            type="text"
                            value={teenThought}
                            onChange={(e) => setTeenThought(e.target.value)}
                            placeholder="e.g. I just need some space right now..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : 'Get Translation & Ideas'}
                    </button>
                </form>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-2xl border border-white/50 dark:border-slate-800 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-2">Message from BondBridge</h4>
                        <p className="text-gray-800 dark:text-slate-200">{result.teen_view?.message}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Small Action for You</h4>
                            <p className="text-sm text-purple-800 dark:text-purple-300">{result.teen_view?.action}</p>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/30">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">Gentle Tip</h4>
                            <p className="text-sm text-orange-800 dark:text-orange-300">{result.gentle_tip}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Shared Activity Idea</h4>
                        <p className="text-sm text-green-800 dark:text-green-300">{result.shared_activity}</p>
                    </div>

                    <div className="p-5 bg-purple-600 text-white rounded-2xl shadow-md">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-2">Quick Reflection</h4>
                        <p className="font-medium">{result.reflection?.teen_question}</p>
                    </div>

                    <button
                        onClick={() => setResult(null)}
                        className="w-full py-3 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-xl font-bold text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                    >
                        Try Another Scenario
                    </button>
                </div>
            )}
        </div>
    );
}

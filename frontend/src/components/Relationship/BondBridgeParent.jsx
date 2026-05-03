import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MOODS_PARENT = ['calm', 'stressed', 'irritated', 'tired'];
const MOODS_TEEN = ['happy', 'okay', 'frustrated', 'sad', 'angry'];

export default function BondBridgeParent({ selectedTeenId, onFeatureLock }) {
    const [parentMood, setParentMood] = useState('calm');
    const [teenMood, setTeenMood] = useState('okay');
    const [parentThought, setParentThought] = useState('');
    const [context, setContext] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await api.post('/relationship/bond-bridge/', {
                child_id: selectedTeenId,
                parent_mood: parentMood,
                parent_thought: parentThought,
                teen_mood: teenMood,
                teen_thought: '',
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
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg shadow-indigo-500/30">
                    🌉
                </div>
                <div>
                    <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">BondBridge</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-300">Teen–Parent Emotional Bridge & Strength System</p>
                </div>
            </div>

            {!result ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">How are you feeling?</label>
                            <div className="flex flex-wrap gap-2">
                                {MOODS_PARENT.map(m => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setParentMood(m)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            parentMood === m 
                                            ? 'bg-indigo-600 text-white shadow-md' 
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                                        }`}
                                    >
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">How is your teen feeling?</label>
                            <div className="flex flex-wrap gap-2">
                                {MOODS_TEEN.map(m => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setTeenMood(m)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            teenMood === m 
                                            ? 'bg-blue-500 text-white shadow-md' 
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-blue-300'
                                        }`}
                                    >
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">What's the situation? (Optional)</label>
                        <input
                            type="text"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="e.g. Coming home from school, homework time..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Any quick thoughts? (Optional)</label>
                        <input
                            type="text"
                            value={parentThought}
                            onChange={(e) => setParentThought(e.target.value)}
                            placeholder="e.g. Want to talk but don't want to push..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !selectedTeenId}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : 'Get Connection Ideas'}
                    </button>
                </form>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-2xl border border-white/50 dark:border-slate-800 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Insight</h4>
                        <p className="text-gray-800 dark:text-slate-200">{result.parent_view?.insight}</p>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3">Suggested Approaches</h4>
                        <div className="space-y-3">
                            {result.parent_view?.choices?.map((choice, i) => (
                                <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-indigo-700 dark:text-indigo-400">{choice.option || `Option ${i+1}`}</span>
                                        <span className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">{choice.action}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 italic">"{choice.say}"</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/30">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">Gentle Tip</h4>
                            <p className="text-sm text-orange-800 dark:text-orange-300">{result.gentle_tip}</p>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Shared Activity</h4>
                            <p className="text-sm text-green-800 dark:text-green-300">{result.shared_activity}</p>
                        </div>
                    </div>

                    <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-md">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">Quick Reflection</h4>
                        <p className="font-medium">{result.reflection?.parent_question}</p>
                    </div>

                    <button
                        onClick={() => setResult(null)}
                        className="w-full py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                        Try Another Scenario
                    </button>
                </div>
            )}
        </div>
    );
}

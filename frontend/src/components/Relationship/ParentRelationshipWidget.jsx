import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ParentRelationshipWidget({ childId }) {
    const [recommendation, setRecommendation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedbackSent, setFeedbackSent] = useState(false);

    useEffect(() => {
        fetchRecommendation();
    }, [childId]);

    const fetchRecommendation = async () => {
        try {
            const res = await api.get(`/relationship/recommendation/?child_id=${childId}`);
            setRecommendation(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sendFeedback = async (outcome) => {
        try {
            // We would need an interaction ID; for simplicity we'll create one on the fly
            // But the backend expects an interaction_id; we should modify to accept child_id + action_taken
            await api.post('/relationship/feedback/', {
                child_id: childId,
                action_taken: 'followed',
                outcome: outcome,
            });
            setFeedbackSent(true);
            setTimeout(() => setFeedbackSent(false), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="animate-pulse p-4 bg-gray-100 dark:bg-slate-800 rounded-2xl">Loading insight...</div>;
    if (!recommendation) return null;

    const getModeColor = () => {
        switch (recommendation.mode) {
            case 'trust_rebuilding': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'resistance_handling': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-100 dark:border-slate-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <span className="p-2 bg-pink-100 dark:bg-pink-500/10 rounded-lg">🤝</span>
                    Relationship Intelligence
                </h3>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getModeColor()}`}>
                        {recommendation.mode === 'trust_rebuilding' ? '🔄 Trust Rebuilding' :
                         recommendation.mode === 'resistance_handling' ? '⚡ Resistance Handling' : '✅ Normal'}
                    </span>
                    <a href="/relationship" className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 hover:underline font-semibold">
                        View Details →
                    </a>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-slate-400">Recommended action</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{recommendation.recommended_action}</p>
            </div>

            {recommendation.conversation_prompts.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500 mb-2">💬 Conversation Prompt</p>
                    <p className="text-gray-700 dark:text-slate-300 italic">"{recommendation.conversation_prompts[0]}"</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="font-semibold text-green-700 dark:text-green-400">✅ Do</p>
                    <p className="text-gray-600 dark:text-slate-300">{recommendation.do}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="font-semibold text-red-700 dark:text-red-400">❌ Don't</p>
                    <p className="text-gray-600 dark:text-slate-300">{recommendation.dont}</p>
                </div>
            </div>

            {recommendation.parent_micro_tip && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <span className="font-bold text-blue-600 dark:text-blue-400">💡 Tip:</span> {recommendation.parent_micro_tip}
                </div>
            )}

            {recommendation.escalation_alert && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 rounded-lg text-sm text-red-700 dark:text-red-400">
                    ⚠️ {recommendation.escalation_alert}
                </div>
            )}

            <div className="flex gap-3 mt-4">
                <button
                    onClick={() => sendFeedback('positive')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition"
                >
                    👍 Helped
                </button>
                <button
                    onClick={() => sendFeedback('negative')}
                    className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl text-sm font-bold hover:bg-gray-300 dark:hover:bg-slate-600 transition"
                >
                    👎 Not helpful
                </button>
            </div>
            {feedbackSent && <p className="text-xs text-green-600 mt-2">Thank you for feedback!</p>}
        </div>
    );
}
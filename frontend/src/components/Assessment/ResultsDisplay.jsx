import React from 'react';
import ProgressBar from '../Common/ProgressBar';

function ResultsDisplay({ result, onRetake }) {
    // Safety check: if result is missing, show error
    if (!result) {
        return <div className="text-center py-10 text-red-500">No result data available.</div>;
    }

    const getRiskBadge = (risk) => {
        switch (risk) {
            case 'low':
                return <span className="badge badge-success">Low Risk</span>;
            case 'moderate':
                return <span className="badge badge-warning">Moderate Risk</span>;
            case 'high':
                return <span className="badge badge-danger">High Risk</span>;
            default:
                return null;
        }
    };

    return (
        <div className="card dark:bg-slate-900 border dark:border-slate-800 p-8 shadow-2xl">
            <h2 className="text-3xl font-black mb-8 dark:text-white flex items-center gap-3">
                <span className="p-2 bg-blue-100 dark:bg-pink-500/10 rounded-xl text-blue-600 dark:text-pink-500">🏆</span>
                Assessment Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="text-center p-8 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
                    <div className="text-5xl font-black text-blue-600 dark:text-pink-500 mb-2">{result.final_score}%</div>
                    <div className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-4">Overall Performance</div>
                    <div className="flex justify-center">{getRiskBadge(result.risk_level)}</div>
                </div>
                <div className="text-center p-8 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
                    <div className="text-5xl font-black text-purple-600 mb-2">{result.weighted_score}%</div>
                    <div className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-4">Weighted Score</div>
                    <div className="text-xs text-gray-400">(Health 30%, Behavior 25%, Routine 25%, Emotional 20%)</div>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <ProgressBar value={result.health_score} label="Health" color="green" />
                <ProgressBar value={result.behavior_score} label="Behavior" color="orange" />
                <ProgressBar value={result.routine_score} label="Routine" color="purple" />
                <ProgressBar value={result.emotional_score} label="Emotional" color="red" />
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="p-6 bg-green-50 dark:bg-green-500/5 rounded-2xl border border-green-100 dark:border-green-500/20">
                    <h3 className="font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                        <span className="text-xl">✅</span> Strengths
                    </h3>
                    <ul className="space-y-2">
                        {result.strengths && result.strengths.length > 0 ? (
                            result.strengths.map((s, i) => (
                                <li key={i} className="text-green-800 dark:text-green-300 flex items-start gap-2">
                                    <span className="font-bold">•</span>
                                    {s}
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-500">No specific strengths identified yet.</li>
                        )}
                    </ul>
                </div>
                <div className="p-6 bg-orange-50 dark:bg-orange-500/5 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                    <h3 className="font-bold text-orange-700 dark:text-orange-400 mb-4 flex items-center gap-2">
                        <span className="text-xl">🚀</span> Areas to Grow
                    </h3>
                    <ul className="space-y-2">
                        {result.improvements && result.improvements.length > 0 ? (
                            result.improvements.map((i, idx) => (
                                <li key={idx} className="text-orange-800 dark:text-orange-300 flex items-start gap-2">
                                    <span className="font-bold">•</span>
                                    {i}
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-500">Keep up the great work!</li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="mb-10 p-8 bg-blue-50 dark:bg-pink-500/5 rounded-2xl border-2 border-dashed border-blue-200 dark:border-pink-500/20">
                <h3 className="font-bold text-blue-700 dark:text-pink-400 mb-4 flex items-center gap-2 uppercase tracking-widest text-xs">AI Recommendations</h3>
                <ul className="space-y-4">
                    {result.recommendations && result.recommendations.length > 0 ? (
                        result.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-blue-900 dark:text-slate-300 flex gap-3 italic">
                                <span className="text-blue-500 dark:text-pink-500 font-bold">💡</span>
                                {rec}
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-500">No recommendations available.</li>
                    )}
                </ul>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={onRetake}
                    className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg transform active:scale-95 transition-all"
                >
                    Retake Assessment
                </button>
            </div>
        </div>
    );
}

export default ResultsDisplay;
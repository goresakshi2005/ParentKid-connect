import React from 'react';
import ProgressBar from '../Common/ProgressBar';

function ResultsDisplay({ result, onRetake }) {
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
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Assessment Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-4xl font-bold text-blue-600">{result.final_score}%</div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                    <div className="mt-2">{getRiskBadge(result.risk_level)}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-4xl font-bold text-purple-600">{result.weighted_score}%</div>
                    <div className="text-sm text-gray-600">Weighted Score</div>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <ProgressBar value={result.health_score} label="Health" color="green" />
                <ProgressBar value={result.behavior_score} label="Behavior" color="orange" />
                <ProgressBar value={result.routine_score} label="Routine" color="purple" />
                <ProgressBar value={result.emotional_score} label="Emotional" color="red" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 className="font-semibold text-green-600 mb-2">Strengths</h3>
                    <ul className="list-disc pl-5">
                        {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-orange-600 mb-2">Areas for Improvement</h3>
                    <ul className="list-disc pl-5">
                        {result.improvements.map((i, idx) => <li key={idx}>{i}</li>)}
                    </ul>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-semibold mb-2">Recommendations</h3>
                <ul className="list-disc pl-5 space-y-1">
                    {result.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                </ul>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={onRetake}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Take Again
                </button>
            </div>
        </div>
    );
}

export default ResultsDisplay;
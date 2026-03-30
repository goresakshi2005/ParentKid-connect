import React, { useState } from 'react';
import AssessmentForm from '../Assessment/AssessmentForm';

function AssessmentPrompt({ onDismiss, onComplete }) {
    const [showAssessment, setShowAssessment] = useState(false);

    if (showAssessment) {
        return (
            <AssessmentForm
                assessmentId={1} // Replace with actual teen assessment ID
                onComplete={onComplete}
            />
        );
    }

    return (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded">
            <h3 className="text-lg font-semibold mb-2">Unlock Your Growth Insights</h3>
            <p className="text-gray-700 mb-4">
                Take a quick self-assessment to get personalized insights and track your growth
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => setShowAssessment(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Start Assessment
                </button>
                <button
                    onClick={onDismiss}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}

export default AssessmentPrompt;
import React, { useState } from 'react';
import AssessmentView from '../Parent/AssessmentView';

function AssessmentPrompt({ onComplete, onDismiss }) {
    const [takingAssessment, setTakingAssessment] = useState(false);

    if (takingAssessment) {
        // Explicitly request teen self-assessment
        return <AssessmentView assessmentType="teen" onComplete={onComplete} />;
    }

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-pink-500 p-6 mb-8 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-2 dark:text-white">Unlock Your Growth Insights</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
                Take a quick self-assessment to get personalized insights and track your growth.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => setTakingAssessment(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 font-bold shadow-lg transition-all"
                >
                    Start Assessment
                </button>
                <button
                    onClick={onDismiss}
                    className="px-6 py-2.5 text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 dark:text-pink-400 dark:border-pink-500 dark:hover:bg-pink-500/10 transition-all font-semibold"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}

export default AssessmentPrompt;
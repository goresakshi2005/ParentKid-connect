import React from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceAssessmentFlow from '../components/VoiceAssessment/VoiceAssessmentFlow';

const VoiceAssessmentPage = () => {
    const navigate = useNavigate();

    const handleComplete = () => {
        // Optionally redirect after completion
        setTimeout(() => navigate('/dashboard/pregnancy'), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-slate-900 dark:to-slate-950 py-12 px-4">
            <button onClick={() => navigate('/dashboard/pregnancy')} className="mb-6 text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-2 text-sm font-medium transition-colors">← Back to Dashboard</button>
            <VoiceAssessmentFlow onComplete={handleComplete} onClose={() => navigate('/dashboard/pregnancy')} />
        </div>
    );
};

export default VoiceAssessmentPage;
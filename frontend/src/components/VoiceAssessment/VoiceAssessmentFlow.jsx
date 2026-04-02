import React, { useState, useEffect, useCallback } from 'react';
import { startVoiceSession, sendVoiceResponse, getVoiceResult } from '../../services/voiceAssessmentService';
import VoiceRecorder from './VoiceRecorder';
import Loading from '../Common/Loading';

const VoiceAssessmentFlow = ({ onComplete, onClose }) => {
    const [sessionId, setSessionId] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [questionNumber, setQuestionNumber] = useState(0);
    const [maxQuestions, setMaxQuestions] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecordingDisabled, setIsRecordingDisabled] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        initializeSession();
    }, []);

    const initializeSession = async () => {
        setIsLoading(true);
        try {
            const data = await startVoiceSession();
            setSessionId(data.session_id);
            setCurrentQuestion(data.question);
            setQuestionNumber(data.question_number);
            setMaxQuestions(data.max_questions);
        } catch (err) {
            setError('Failed to start voice assessment. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecordingComplete = useCallback(async (audioBlob) => {
        if (!sessionId) return;
        setIsRecordingDisabled(true);
        setIsLoading(true);
        try {
            const response = await sendVoiceResponse(sessionId, audioBlob);
            if (response.is_complete) {
                setResult(response.result);
                if (onComplete) onComplete(response.result);
            } else {
                setCurrentQuestion(response.question);
                setQuestionNumber(response.question_number);
                setIsRecordingDisabled(false);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error processing your voice. Please try again.');
            setIsRecordingDisabled(false);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, onComplete]);

    if (error) {
        return (
            <div className="text-center p-8">
                <div className="text-4xl mb-4">😔</div>
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-lg">Close</button>
            </div>
        );
    }

    if (result) {
        const { stress_score, confidence_score, fatigue_score, stress_level, insights, recommendations } = result;
        return (
            <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold mb-4 dark:text-white text-center">✨ Your Wellness Check Results</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-sm text-gray-500">Stress</p>
                        <p className="text-2xl font-bold text-red-600">{stress_score}%</p>
                        <span className="text-xs">{stress_level}</span>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-sm text-gray-500">Confidence</p>
                        <p className="text-2xl font-bold text-green-600">{confidence_score}%</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                        <p className="text-sm text-gray-500">Fatigue</p>
                        <p className="text-2xl font-bold text-yellow-600">{fatigue_score}%</p>
                    </div>
                </div>
                <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📝 Insights</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {insights.map((insight, idx) => <li key={idx}>{insight}</li>)}
                    </ul>
                </div>
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">💡 Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                    </ul>
                </div>
                <div className="flex justify-center gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-500 text-white rounded-xl">Close</button>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-pink-600 text-white rounded-xl">Take Again</button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loading /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Voice Wellness Check</h2>
                <span className="text-sm text-gray-500">Question {questionNumber} of {maxQuestions}</span>
            </div>
            <div className="mb-6 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                <p className="text-lg font-medium text-gray-800 dark:text-white">{currentQuestion}</p>
            </div>
            <VoiceRecorder onRecordingComplete={handleRecordingComplete} disabled={isRecordingDisabled} />
            <p className="text-xs text-center text-gray-400 mt-6">Your voice is analyzed for tone and rhythm to better understand how you're feeling. All data is private.</p>
        </div>
    );
};

export default VoiceAssessmentFlow;
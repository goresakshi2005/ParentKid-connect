// frontend/src/components/Child/ChildSelfAssessment.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import QuestionRenderer from '../Assessment/QuestionRenderer';
import ResultsDisplay from '../Assessment/ResultsDisplay';
import Loading from '../Common/Loading';

function ChildSelfAssessment({ childId, onComplete, onClose }) {
    const { token } = useAuth();
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssessment();
    }, [childId]);

    const fetchAssessment = async () => {
        try {
            const tier = 'free'; // or get from subscription context
            const url = `${process.env.REACT_APP_API_URL}/assessments/recommended/?type=child&child_id=${childId}&tier=${tier}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const assessmentData = response.data;
            setAssessment(assessmentData);
            const initialAnswers = assessmentData.questions.map(() => ({}));
            setAnswers(initialAnswers);
        } catch (error) {
            console.error('Failed to fetch assessment:', error);
            alert('Could not load the assessment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionIndex, value) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        const unanswered = answers.some(ans => Object.keys(ans).length === 0);
        if (unanswered) {
            alert('Please answer all questions before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                assessment_id: assessment.id,
                answers: answers,
                child_id: childId
            };
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/assessments/submit_assessment/`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResult(response.data);
            if (onComplete) onComplete(response.data);
        } catch (error) {
            console.error('Failed to submit assessment:', error);
            alert(error.response?.data?.error || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetake = () => {
        setResult(null);
        setCurrentQuestion(0);
        const resetAnswers = assessment.questions.map(() => ({}));
        setAnswers(resetAnswers);
    };

    if (loading) return <Loading />;

    if (result) {
        return (
            <div>
                <ResultsDisplay result={result} onRetake={handleRetake} />
                <div className="flex justify-center mt-8">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 shadow-lg transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestionData = assessment.questions[currentQuestion];
    const isLast = currentQuestion === assessment.questions.length - 1;

    return (
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-2xl p-8 border-2 border-blue-200 dark:border-pink-500/30">
            {/* Fun header */}
            <div className="text-center mb-8">
                <div className="text-6xl mb-4">✨</div>
                <h1 className="text-4xl font-bold text-blue-700 dark:text-pink-400">Let's Play & Learn!</h1>
                <p className="text-gray-600 dark:text-slate-300 mt-2">Answer these fun questions about yourself</p>
            </div>

            {/* Progress */}
            <div className="mb-10">
                <div className="flex justify-between text-sm font-bold text-blue-600 dark:text-pink-400 mb-2">
                    <span>Question {currentQuestion + 1} of {assessment.questions.length}</span>
                    <span>{Math.round(((currentQuestion + 1) / assessment.questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-blue-600 dark:bg-pink-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${((currentQuestion + 1) / assessment.questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question area */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md mb-8">
                <QuestionRenderer
                    question={currentQuestionData}
                    answer={answers[currentQuestion]}
                    onChange={(value) => handleAnswerChange(currentQuestion, value)}
                />
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-4">
                <button
                    onClick={() => setCurrentQuestion(prev => prev - 1)}
                    disabled={currentQuestion === 0}
                    className="px-8 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-2xl font-bold disabled:opacity-30 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all text-lg"
                >
                    ⬅ Back
                </button>
                {isLast ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 disabled:opacity-50 shadow-lg transform active:scale-95 transition-all text-lg"
                    >
                        {submitting ? 'Sending...' : 'Finish & See Results 🎉'}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(prev => prev + 1)}
                        className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg transform active:scale-95 transition-all text-lg"
                    >
                        Next Question ➡
                    </button>
                )}
            </div>
        </div>
    );
}

export default ChildSelfAssessment;
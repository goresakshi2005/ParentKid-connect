import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import QuestionRenderer from './QuestionRenderer';
import ResultsDisplay from './ResultsDisplay';
import Loading from '../Common/Loading';

function AssessmentForm({ assessmentId, childId, onComplete }) {
    const { token } = useAuth();
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchAssessment();
    }, [assessmentId]);

    const fetchAssessment = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/assessments/${assessmentId}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const assessmentData = response.data;
            setAssessment(assessmentData);
            // Initialize answers array with empty objects for each question
            const initialAnswers = assessmentData.questions.map(() => ({}));
            setAnswers(initialAnswers);
        } catch (error) {
            console.error('Failed to fetch assessment:', error);
            alert('Could not load assessment');
        }
    };

    const handleAnswerChange = (questionIndex, value) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        // Validate all questions answered
        const unanswered = answers.some(ans => Object.keys(ans).length === 0);
        if (unanswered) {
            alert('Please answer all questions before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                assessment_id: assessmentId,
                answers: answers,
                child_id: childId || null
            };
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/assessments/submit_assessment/`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Assessment result:', response.data);
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
        // Reset answers
        if (assessment) {
            const resetAnswers = assessment.questions.map(() => ({}));
            setAnswers(resetAnswers);
        }
    };

    if (!assessment) return <Loading />;

    // Show results if we have a result
    if (result) {
        return <ResultsDisplay result={result} onRetake={handleRetake} />;
    }

    const currentQuestionData = assessment.questions[currentQuestion];
    const isLast = currentQuestion === assessment.questions.length - 1;

    return (
        <div className="max-w-2xl mx-auto card dark:bg-slate-900 border dark:border-slate-800 p-8 shadow-xl">
            <h2 className="text-3xl font-bold mb-3 dark:text-white">{assessment.title}</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-8 italic">{assessment.description}</p>

            <div className="mb-10 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex justify-between text-sm font-bold text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                    <span>Question {currentQuestion + 1} of {assessment.questions.length}</span>
                    <span className="text-blue-600 dark:text-pink-500">{Math.round(((currentQuestion + 1) / assessment.questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-blue-600 dark:bg-pink-600 h-3 rounded-full transition-all duration-500" style={{ width: `${((currentQuestion + 1) / assessment.questions.length) * 100}%` }}></div>
                </div>
            </div>

            <QuestionRenderer
                question={currentQuestionData}
                answer={answers[currentQuestion]}
                onChange={(value) => handleAnswerChange(currentQuestion, value)}
            />

            <div className="flex justify-between mt-10">
                <button
                    onClick={() => setCurrentQuestion(prev => prev - 1)}
                    disabled={currentQuestion === 0}
                    className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl disabled:opacity-30 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-semibold"
                >
                    Back
                </button>
                {isLast ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 disabled:opacity-50 font-bold shadow-lg transform active:scale-95 transition-all"
                    >
                        {submitting ? 'Analyzing Results...' : 'Submit Assessment'}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(prev => prev + 1)}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 font-bold shadow-lg transform active:scale-95 transition-all"
                    >
                        Next Question
                    </button>
                )}
            </div>
        </div>
    );
}

export default AssessmentForm;
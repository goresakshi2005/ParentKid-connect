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
            setAssessment(response.data);
            setAnswers(new Array(response.data.questions.length).fill({}));
        } catch (error) {
            console.error('Failed to fetch assessment:', error);
        }
    };

    const handleAnswerChange = (questionIndex, value) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                assessment_id: assessmentId,
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

    if (!assessment) return <Loading />;

    if (result) {
        return <ResultsDisplay result={result} onRetake={() => setResult(null)} />;
    }

    const currentQuestionData = assessment.questions[currentQuestion];
    const isLast = currentQuestion === assessment.questions.length - 1;

    return (
        <div className="max-w-2xl mx-auto card dark:bg-slate-900 border dark:border-slate-800 p-8 shadow-xl transition-all duration-300">
            <h2 className="text-3xl font-bold mb-3 dark:text-white">{assessment.title}</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-8 italic">{assessment.description}</p>

            <div className="mb-10 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                <div className="flex justify-between text-sm font-bold text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 dark:bg-pink-500 rounded-full animate-pulse"></span>
                        Question {currentQuestion + 1} of {assessment.questions.length}
                    </span>
                    <span className="text-blue-600 dark:text-pink-500">{Math.round(((currentQuestion + 1) / assessment.questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-blue-600 dark:bg-pink-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${((currentQuestion + 1) / assessment.questions.length) * 100}%` }}></div>
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
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 disabled:opacity-50 font-bold shadow-lg dark:shadow-pink-500/20 transform active:scale-95 transition-all"
                    >
                        {submitting ? 'Analyzing Results...' : 'Submit Assessment'}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(prev => prev + 1)}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 font-bold shadow-lg dark:shadow-pink-500/20 transform active:scale-95 transition-all"
                    >
                        Next Question
                    </button>
                )}
            </div>
        </div>
    );
}

export default AssessmentForm;
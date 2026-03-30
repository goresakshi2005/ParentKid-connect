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
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">{assessment.title}</h2>
            <p className="text-gray-600 mb-6">{assessment.description}</p>

            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Question {currentQuestion + 1} of {assessment.questions.length}</span>
                    <span>{Math.round(((currentQuestion + 1) / assessment.questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((currentQuestion + 1) / assessment.questions.length) * 100}%` }}></div>
                </div>
            </div>

            <QuestionRenderer
                question={currentQuestionData}
                answer={answers[currentQuestion]}
                onChange={(value) => handleAnswerChange(currentQuestion, value)}
            />

            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentQuestion(prev => prev - 1)}
                    disabled={currentQuestion === 0}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    Previous
                </button>
                {isLast ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(prev => prev + 1)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
}

export default AssessmentForm;
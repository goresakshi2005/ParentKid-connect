import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AssessmentView from '../components/Parent/AssessmentView';
import ResultsDisplay from '../components/Assessment/ResultsDisplay';
import Loading from '../components/Common/Loading';
import ReportUploader from '../components/Reports/ReportUploader';

function PregnancyDashboard() {
    const { token, user } = useAuth();
    const [pregnancyChild, setPregnancyChild] = useState(null);
    const [pregnancyResults, setPregnancyResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [takingAssessment, setTakingAssessment] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showReportUploader, setShowReportUploader] = useState(false);

    useEffect(() => {
        fetchPregnancyChild();
    }, [token]);

    const fetchPregnancyChild = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/children/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const children = response.data.results || response.data;
            const pregChild = children.find(child => child.stage === 'pregnancy');
            setPregnancyChild(pregChild);
            if (pregChild) {
                fetchPregnancyResults(pregChild.id);
            }
        } catch (error) {
            console.error('Failed to fetch children:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPregnancyResults = async (childId) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/assessments/my_results/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const results = response.data.results || response.data;
            const childResults = results.filter(r => r.child && r.child.id === childId);
            setPregnancyResults(childResults);
        } catch (error) {
            console.error('Failed to fetch pregnancy results:', error);
        }
    };

    const handleAssessmentComplete = (resultData) => {
        if (pregnancyChild) {
            fetchPregnancyResults(pregnancyChild.id);
        }
        setTakingAssessment(false);
        setShowResult(true);
    };

    const handleRetake = () => {
        setShowResult(false);
        setTakingAssessment(true);
    };

    const handleBackToDashboard = () => {
        setTakingAssessment(false);
        setShowResult(false);
        setShowReportUploader(false);
    };

    if (loading) return <Loading />;

    if (!pregnancyChild) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <h1 className="text-3xl font-bold dark:text-white">Pregnancy Journey</h1>
                <p className="text-gray-600 dark:text-slate-400 mt-4">
                    It seems you don't have a pregnancy child. Please contact support.
                </p>
            </div>
        );
    }

    if (takingAssessment) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={handleBackToDashboard}
                    className="mb-6 text-green-600 dark:text-green-400 hover:underline flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
                <AssessmentView
                    assessmentType="parent"
                    childId={pregnancyChild.id}
                    onComplete={handleAssessmentComplete}
                />
            </div>
        );
    }

    if (showResult && pregnancyResults.length > 0) {
        const latest = pregnancyResults[0];
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={handleBackToDashboard}
                    className="mb-6 text-green-600 dark:text-green-400 hover:underline flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
                <ResultsDisplay result={latest} onRetake={handleRetake} />
            </div>
        );
    }

    // ── Report Uploader View ──
    if (showReportUploader) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={handleBackToDashboard}
                    className="mb-6 text-green-600 dark:text-green-400 hover:underline flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
                <ReportUploader token={token} />
            </div>
        );
    }

    const latestResult = pregnancyResults.length > 0 ? pregnancyResults[0] : null;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold dark:text-white tracking-tight">
                    Pregnancy <span className="dark:text-green-500">Journey</span>
                </h1>
                <div className="flex items-center gap-3">
                    {/* ── NEW: Upload Report Button ── */}
                    <button
                        onClick={() => setShowReportUploader(true)}
                        className="px-5 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 shadow-lg flex items-center gap-2 font-bold transition-all"
                    >
                        📋 Upload Report
                    </button>
                    <button
                        onClick={() => setTakingAssessment(true)}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-lg flex items-center gap-2 font-bold transition-all"
                    >
                        📝 Take Pregnancy Assessment
                    </button>
                </div>
            </div>

            {/* Welcome Banner */}
            <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-l-4 border-green-600 dark:border-green-500 shadow-sm">
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
                    <span className="text-3xl">🤰</span> Hello, {user.first_name || 'Parent'}!
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    You're in the pregnancy stage. Track your health, get weekly insights, and prepare for your baby's arrival.
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Your baby is due in {pregnancyChild.date_of_birth ? 'soon' : '—'} • Keep an eye on your wellness scores below.
                </div>
            </div>

            {/* ── NEW: Upload Report Card ── */}
            <div className="mb-8 p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <span className="text-4xl">📁</span>
                    <div>
                        <h3 className="text-lg font-bold text-pink-800 dark:text-pink-300">
                            Auto-Schedule Your Next Appointment
                        </h3>
                        <p className="text-sm text-pink-700 dark:text-pink-400">
                            Upload your checkup report — we'll extract your next appointment date and add it to Google Calendar automatically.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowReportUploader(true)}
                    className="shrink-0 px-5 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 font-bold shadow-md transition-all"
                >
                    Upload Report →
                </button>
            </div>

            {/* Assessment Results */}
            {latestResult ? (
                <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-6 dark:text-white">Your Latest Pregnancy Assessment</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-slate-800">
                            <div className="text-center">
                                <p className="text-5xl font-black text-green-600 dark:text-green-400 mb-2">
                                    {latestResult.final_score}%
                                </p>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Overall Score</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-slate-800">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">{latestResult.health_score}%</p>
                                    <p className="text-xs text-gray-500">Health</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-600">{latestResult.behavior_score}%</p>
                                    <p className="text-xs text-gray-500">Behavior</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">{latestResult.routine_score}%</p>
                                    <p className="text-xs text-gray-500">Routine</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">{latestResult.emotional_score}%</p>
                                    <p className="text-xs text-gray-500">Emotional</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold dark:text-white">Recommendations</h3>
                        <button
                            onClick={() => setShowResult(true)}
                            className="text-green-600 dark:text-green-400 hover:underline text-sm"
                        >
                            View Full Report →
                        </button>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <ul className="space-y-3">
                            {latestResult.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <span className="text-green-600 dark:text-green-400 font-bold">💡</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="mb-10 bg-gray-50 dark:bg-slate-800 p-10 rounded-2xl text-center">
                    <p className="text-gray-600 dark:text-slate-400 mb-6">
                        You haven't taken a pregnancy assessment yet. Start now to get personalized insights.
                    </p>
                    <button
                        onClick={() => setTakingAssessment(true)}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 font-bold shadow-lg"
                    >
                        Start Pregnancy Assessment
                    </button>
                </div>
            )}
        </div>
    );
}

export default PregnancyDashboard;
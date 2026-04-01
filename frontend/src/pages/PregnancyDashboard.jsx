import React, { useState, useEffect, useCallback } from 'react';
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

    // ✅ NEW: Next appointment state
    const [nextAppointment, setNextAppointment] = useState(null);
    const [apptLoading, setApptLoading] = useState(false);
    const [deletingAppt, setDeletingAppt] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const authHeaders = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchPregnancyChild();
        fetchNextAppointment();
    }, [token]);

    const fetchPregnancyChild = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/children/`,
                { headers: authHeaders }
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
                { headers: authHeaders }
            );
            const results = response.data.results || response.data;
            const childResults = results.filter(r => r.child && r.child.id === childId);
            setPregnancyResults(childResults);
        } catch (error) {
            console.error('Failed to fetch pregnancy results:', error);
        }
    };

    // ✅ NEW: Fetch the next upcoming appointment
    const fetchNextAppointment = async () => {
        setApptLoading(true);
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/appointments/next/`,
                { headers: authHeaders }
            );
            setNextAppointment(res.data.appointment); // null if none
        } catch (err) {
            console.error('Failed to fetch next appointment:', err);
        } finally {
            setApptLoading(false);
        }
    };

    // ✅ NEW: Delete the appointment (and its Google Calendar event)
    const handleDeleteAppointment = async () => {
        if (!nextAppointment) return;
        setDeletingAppt(true);
        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/appointments/${nextAppointment.id}/delete/`,
                { headers: authHeaders }
            );
            setNextAppointment(null);
            setDeleteConfirm(false);
        } catch (err) {
            console.error('Failed to delete appointment:', err);
            alert('Could not delete appointment. Please try again.');
        } finally {
            setDeletingAppt(false);
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
        // Refresh appointment after returning from uploader (user may have just scheduled one)
        fetchNextAppointment();
    };

    // ── Helper: format appointment datetime nicely ──
    const formatApptDate = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatApptTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const daysUntil = (isoString) => {
        const now = new Date();
        const appt = new Date(isoString);
        const diff = Math.ceil((appt - now) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        return `In ${diff} days`;
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

            {/* ✅ NEW: Next Appointment Card */}
            <div className="mb-8">
                {apptLoading ? (
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50 flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-blue-600 dark:text-blue-400 text-sm">Loading appointment...</span>
                    </div>
                ) : nextAppointment ? (
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-300 dark:border-blue-700 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                {/* Calendar icon block */}
                                <div className="shrink-0 w-14 h-14 bg-blue-600 rounded-xl flex flex-col items-center justify-center shadow-md">
                                    <span className="text-white text-xs font-bold uppercase leading-none">
                                        {new Date(nextAppointment.date_time).toLocaleString('en-IN', { month: 'short' })}
                                    </span>
                                    <span className="text-white text-2xl font-black leading-none">
                                        {new Date(nextAppointment.date_time).getDate()}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1">
                                        📅 Next Appointment · {daysUntil(nextAppointment.date_time)}
                                    </p>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        🤰 Pregnancy Checkup
                                        {nextAppointment.doctor && (
                                            <span className="text-sm font-normal text-gray-500 dark:text-slate-400 ml-2">
                                                with {nextAppointment.doctor}
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
                                        {formatApptDate(nextAppointment.date_time)} &nbsp;·&nbsp; {formatApptTime(nextAppointment.date_time)}
                                    </p>
                                    {nextAppointment.google_event_id && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                            ✅ Added to Google Calendar
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Delete button / confirm */}
                            <div className="shrink-0">
                                {!deleteConfirm ? (
                                    <button
                                        onClick={() => setDeleteConfirm(true)}
                                        className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    >
                                        🗑 Mark as Done
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-2 items-end">
                                        <p className="text-xs text-gray-600 dark:text-slate-400 text-right max-w-[160px]">
                                            Remove this appointment?
                                            {nextAppointment.google_event_id && ' It will also be deleted from Google Calendar.'}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setDeleteConfirm(false)}
                                                disabled={deletingAppt}
                                                className="px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeleteAppointment}
                                                disabled={deletingAppt}
                                                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg transition-all flex items-center gap-1"
                                            >
                                                {deletingAppt ? (
                                                    <>
                                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Deleting...
                                                    </>
                                                ) : 'Yes, Delete'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* No upcoming appointment — prompt to upload report */
                    <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800/50 flex items-center justify-between gap-4">
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
                )}
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
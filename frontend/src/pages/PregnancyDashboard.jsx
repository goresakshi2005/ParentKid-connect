// frontend/src/pages/PregnancyDashboard.jsx
// Updated: Added "Health Guide" tab alongside the existing Report Uploader.

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AssessmentView from '../components/Parent/AssessmentView';
import ResultsDisplay from '../components/Assessment/ResultsDisplay';
import Loading from '../components/Common/Loading';
import ReportUploader from '../components/Reports/ReportUploader';
import MaternalHealthGuide from '../components/Reports/MaternalHealthGuide'; // ← NEW

function PregnancyDashboard() {
    const { token, user } = useAuth();
    const [pregnancyChild, setPregnancyChild] = useState(null);
    const [pregnancyResults, setPregnancyResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [takingAssessment, setTakingAssessment] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showReportUploader, setShowReportUploader] = useState(false);
    const [showHealthGuide, setShowHealthGuide] = useState(false); // ← NEW

    // Next appointment state
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

    const fetchNextAppointment = async () => {
        setApptLoading(true);
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/appointments/next/`,
                { headers: authHeaders }
            );
            setNextAppointment(res.data.appointment);
        } catch (err) {
            console.error('Failed to fetch next appointment:', err);
        } finally {
            setApptLoading(false);
        }
    };

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
        setShowHealthGuide(false); // ← NEW
        fetchNextAppointment();
    };

    const formatApptDate = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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

    // ── Assessment Taking View ──────────────────────────────────────────────────
    if (takingAssessment) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={handleBackToDashboard} className="mb-6 text-green-600 dark:text-green-400 hover:underline flex items-center gap-2">
                    ← Back to Dashboard
                </button>
                <AssessmentView
                    assessmentType="parent"
                    stage="pregnancy"
                    childId={pregnancyChild.id}
                    onComplete={handleAssessmentComplete}
                />
            </div>
        );
    }

    // ── Assessment Result View ─────────────────────────────────────────────────
    const latest = pregnancyResults.length > 0 ? pregnancyResults[0] : null;
    if (showResult && latest) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={handleBackToDashboard} className="mb-6 text-green-600 dark:text-green-400 hover:underline flex items-center gap-2">
                    ← Back to Dashboard
                </button>
                <ResultsDisplay result={latest} onRetake={handleRetake} />
            </div>
        );
    }

    // ── Report Uploader View ───────────────────────────────────────────────────
    if (showReportUploader) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={handleBackToDashboard} className="mb-6 text-green-600 dark:text-green-400 hover:underline flex items-center gap-2">
                    ← Back to Dashboard
                </button>
                <ReportUploader token={token} />
            </div>
        );
    }

    // ── NEW: Maternal Health Guide View ────────────────────────────────────────
    if (showHealthGuide) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={handleBackToDashboard} className="mb-6 text-green-600 dark:text-green-400 hover:underline flex items-center gap-2">
                    ← Back to Dashboard
                </button>
                <MaternalHealthGuide />
            </div>
        );
    }

    // ── Main Dashboard ─────────────────────────────────────────────────────────
    const latestResult = pregnancyResults.length > 0 ? pregnancyResults[0] : null;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
                <h1 className="text-4xl font-extrabold dark:text-white tracking-tight">
                    Pregnancy <span className="dark:text-green-500">Journey</span>
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* NEW: Health Guide button */}
                    <button
                        onClick={() => setShowHealthGuide(true)}
                        className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg flex items-center gap-2 font-bold transition-all"
                    >
                        🌸 Health Guide
                    </button>
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
                        📝 Take Assessment
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
                    Your baby is due {pregnancyChild.date_of_birth ? 'soon' : '—'} • Keep an eye on your wellness scores below.
                </div>
            </div>

            {/* NEW: Quick Action Cards for new features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => setShowHealthGuide(true)}
                    className="group bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-5 text-left hover:shadow-lg hover:border-rose-400 dark:hover:border-rose-600 transition-all"
                >
                    <div className="text-3xl mb-3">🌸</div>
                    <h3 className="text-base font-bold text-rose-700 dark:text-rose-300 mb-1">Maternal Health Guide</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Upload your checkup report and get a simple, friendly health guide — food tips, goals, alerts and more.
                    </p>
                    <span className="mt-3 inline-block text-xs font-semibold text-rose-600 dark:text-rose-400 group-hover:underline">
                        Get my guide →
                    </span>
                </button>

                <button
                    onClick={() => setShowReportUploader(true)}
                    className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 text-left hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all"
                >
                    <div className="text-3xl mb-3">📅</div>
                    <h3 className="text-base font-bold text-blue-700 dark:text-blue-300 mb-1">Schedule Appointment</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Upload your report and we'll automatically extract your next appointment and add it to Google Calendar.
                    </p>
                    <span className="mt-3 inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                        Upload report →
                    </span>
                </button>
            </div>

            {/* Next Appointment Card */}
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
                                                    <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</>
                                                ) : 'Yes, Delete'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800/50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">📁</span>
                            <div>
                                <h3 className="text-lg font-bold text-pink-800 dark:text-pink-300">No Upcoming Appointment</h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400">Upload a checkup report to auto-schedule your next appointment.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowReportUploader(true)}
                            className="shrink-0 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-md transition-all text-sm"
                        >
                            Upload Report
                        </button>
                    </div>
                )}
            </div>

            {/* Assessment result summary */}
            {latestResult && (
                <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold dark:text-white">Latest Assessment</h2>
                        <button
                            onClick={() => setShowResult(true)}
                            className="text-sm text-green-600 dark:text-green-400 font-semibold hover:underline"
                        >
                            View Full Report →
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Health', score: latestResult.health_score },
                            { label: 'Emotional', score: latestResult.emotional_score },
                            { label: 'Routine', score: latestResult.routine_score },
                            { label: 'Behavior', score: latestResult.behavior_score },
                        ].map(({ label, score }) => (
                            <div key={label} className="text-center">
                                <div className="text-2xl font-black text-green-600 dark:text-green-400">{Math.round(score)}%</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!latestResult && (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-bold dark:text-white mb-2">No Assessments Yet</h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">Take a pregnancy assessment to track your wellness.</p>
                    <button
                        onClick={() => setTakingAssessment(true)}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-all"
                    >
                        Start Assessment
                    </button>
                </div>
            )}
        </div>
    );
}

export default PregnancyDashboard;
// frontend/src/pages/PregnancyDashboard.jsx
// Updated: Voice Wellness Check runs inline on dashboard and shows stress/confidence results after last question.

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AssessmentView from '../components/Parent/AssessmentView';
import ResultsDisplay from '../components/Assessment/ResultsDisplay';
import Loading from '../components/Common/Loading';
import ReportUploader from '../components/Reports/ReportUploader';
import MaternalHealthGuide from '../components/Reports/MaternalHealthGuide';
import VoiceAssessmentFlow from '../components/VoiceAssessment/VoiceAssessmentFlow';

// ── Inline Voice Wellness Result Card ─────────────────────────────────────────
function VoiceWellnessResult({ result, onClose, onRetake }) {
    if (!result) return null;
    const { stress_score, confidence_score, fatigue_score, stress_level, insights, recommendations } = result;

    const stressColor =
        stress_score >= 70 ? 'text-red-600 dark:text-red-400' :
        stress_score >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
        'text-green-600 dark:text-green-400';

    const stressBg =
        stress_score >= 70 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
        stress_score >= 40 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
        'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';

    const confidenceColor =
        confidence_score >= 70 ? 'text-green-600 dark:text-green-400' :
        confidence_score >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
        'text-red-600 dark:text-red-400';

    return (
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-purple-200 dark:border-purple-800 overflow-hidden fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🎙️</span>
                    <div>
                        <h2 className="text-lg font-bold text-white">Voice Wellness Results</h2>
                        <p className="text-xs text-purple-200">Based on your voice tone &amp; responses</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Dismiss"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-6">
                {/* Score cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Stress */}
                    <div className={`rounded-2xl border p-4 text-center ${stressBg}`}>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Stress</p>
                        <p className={`text-4xl font-black ${stressColor}`}>{stress_score}%</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 inline-block
                            ${stress_score >= 70
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : stress_score >= 40
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            }`}
                        >
                            {stress_level || (stress_score >= 70 ? 'High' : stress_score >= 40 ? 'Moderate' : 'Low')}
                        </span>
                    </div>

                    {/* Confidence */}
                    <div className={`rounded-2xl border p-4 text-center
                        ${confidence_score >= 70
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : confidence_score >= 40
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}
                    >
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Confidence</p>
                        <p className={`text-4xl font-black ${confidenceColor}`}>{confidence_score}%</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 inline-block
                            ${confidence_score >= 70
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : confidence_score >= 40
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            }`}
                        >
                            {confidence_score >= 70 ? 'High' : confidence_score >= 40 ? 'Moderate' : 'Low'}
                        </span>
                    </div>

                    {/* Fatigue */}
                    <div className={`rounded-2xl border p-4 text-center
                        ${fatigue_score >= 70
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                            : fatigue_score >= 40
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                    >
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Fatigue</p>
                        <p className={`text-4xl font-black
                            ${fatigue_score >= 70
                                ? 'text-orange-600 dark:text-orange-400'
                                : fatigue_score >= 40
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                        >
                            {fatigue_score}%
                        </p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 inline-block
                            ${fatigue_score >= 70
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                : fatigue_score >= 40
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}
                        >
                            {fatigue_score >= 70 ? 'High' : fatigue_score >= 40 ? 'Moderate' : 'Low'}
                        </span>
                    </div>
                </div>

                {/* Insights + Recommendations in two columns */}
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                    {insights && insights.length > 0 && (
                        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/40 rounded-xl p-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1.5">
                                <span>📝</span> Insights
                            </h3>
                            <ul className="space-y-2">
                                {insights.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-700 dark:text-slate-300 flex items-start gap-2">
                                        <span className="mt-1 text-purple-400 shrink-0">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {recommendations && recommendations.length > 0 && (
                        <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-800/40 rounded-xl p-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400 mb-3 flex items-center gap-1.5">
                                <span>💡</span> Recommendations
                            </h3>
                            <ul className="space-y-2">
                                {recommendations.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-700 dark:text-slate-300 flex items-start gap-2">
                                        <span className="mt-1 text-pink-400 shrink-0">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={onRetake}
                        className="px-5 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow transition-all"
                    >
                        🎙️ Check Again
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main PregnancyDashboard ────────────────────────────────────────────────────
function PregnancyDashboard() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [pregnancyChild, setPregnancyChild] = useState(null);
    const [pregnancyResults, setPregnancyResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [takingAssessment, setTakingAssessment] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showReportUploader, setShowReportUploader] = useState(false);
    const [showHealthGuide, setShowHealthGuide] = useState(false);

    // ── Voice wellness state ──────────────────────────────────────────────────
    const [showVoiceFlow, setShowVoiceFlow] = useState(false);
    const [voiceResult, setVoiceResult] = useState(null);

    // Next appointment state
    const [nextAppointment, setNextAppointment] = useState(null);
    const [apptLoading, setApptLoading] = useState(false);
    const [deletingAppt, setDeletingAppt] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // All scheduled appointments
    const [allAppointments, setAllAppointments] = useState([]);
    const [allApptLoading, setAllApptLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const authHeaders = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchPregnancyChild();
        fetchNextAppointment();
        fetchAllAppointments();
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
            setNextAppointment(res.data.next_appointment);
        } catch (err) {
            console.error('Failed to fetch next appointment:', err);
        } finally {
            setApptLoading(false);
        }
    };

    const fetchAllAppointments = async () => {
        setAllApptLoading(true);
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/appointments/`,
                { headers: authHeaders }
            );
            setAllAppointments(res.data);
        } catch (err) {
            console.error('Failed to fetch appointments:', err);
        } finally {
            setAllApptLoading(false);
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
            fetchAllAppointments();
        } catch (err) {
            console.error('Failed to delete appointment:', err);
            alert('Could not delete appointment. Please try again.');
        } finally {
            setDeletingAppt(false);
        }
    };

    const handleDeleteById = async (id) => {
        setDeletingId(id);
        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/appointments/${id}/delete/`,
                { headers: authHeaders }
            );
            setAllAppointments(prev => prev.filter(a => a.id !== id));
            setConfirmDeleteId(null);
            if (nextAppointment && nextAppointment.id === id) {
                setNextAppointment(null);
                fetchNextAppointment();
            }
        } catch (err) {
            console.error('Failed to delete appointment:', err);
            alert('Could not delete appointment. Please try again.');
        } finally {
            setDeletingId(null);
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
        setShowHealthGuide(false);
        fetchNextAppointment();
        fetchAllAppointments();
    };

    // ── Voice wellness handlers ───────────────────────────────────────────────
    const handleVoiceComplete = useCallback((result) => {
        setVoiceResult(result);
        setShowVoiceFlow(false);   // hide the recorder, show the result card on dashboard
    }, []);

    const handleVoiceClose = () => {
        setShowVoiceFlow(false);
    };

    const handleVoiceRetake = () => {
        setVoiceResult(null);
        setShowVoiceFlow(true);
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
        if (diff < 0) return 'Past';
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        return `In ${diff} days`;
    };

    const isPast = (isoString) => new Date(isoString) < new Date();

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

    // ── Voice assessment inline view (recorder active) ────────────────────────
    if (showVoiceFlow) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={handleVoiceClose}
                    className="mb-6 text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
                <VoiceAssessmentFlow
                    onComplete={handleVoiceComplete}
                    onClose={handleVoiceClose}
                />
            </div>
        );
    }

    const latestResult = pregnancyResults.length > 0 ? pregnancyResults[0] : null;
    const upcomingAppointments = allAppointments.filter(a => !isPast(a.date_time));
    const pastAppointments = allAppointments.filter(a => isPast(a.date_time));

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">

            <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
                <h1 className="text-4xl font-extrabold dark:text-white tracking-tight">
                    Pregnancy <span className="dark:text-green-500">Journey</span>
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
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
                    {/* Voice Wellness Check — opens inline */}
                    <button
                        onClick={() => { setVoiceResult(null); setShowVoiceFlow(true); }}
                        className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg flex items-center gap-2 font-bold transition-all"
                    >
                        🎙️ Voice Wellness Check
                    </button>
                </div>
            </div>

            {/* ── Voice Wellness Result card (shown right after completing the check) ── */}
            {voiceResult && (
                <VoiceWellnessResult
                    result={voiceResult}
                    onClose={() => setVoiceResult(null)}
                    onRetake={handleVoiceRetake}
                />
            )}

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

            <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🗓️</span>
                        <div>
                            <h2 className="text-xl font-bold dark:text-white">Scheduled Appointments</h2>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                All your pregnancy checkup appointments
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchAllAppointments}
                        disabled={allApptLoading}
                        className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        title="Refresh appointments"
                    >
                        <svg className={`w-5 h-5 ${allApptLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {allApptLoading && (
                    <div className="flex items-center justify-center gap-3 py-10">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-500 dark:text-slate-400">Loading appointments…</span>
                    </div>
                )}

                {!allApptLoading && (
                    <>
                        {upcomingAppointments.length > 0 ? (
                            <div>
                                <div className="px-6 pt-4 pb-1">
                                    <span className="text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400">
                                        Upcoming · {upcomingAppointments.length}
                                    </span>
                                </div>
                                <ul className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                    {upcomingAppointments.map((appt) => (
                                        <li key={appt.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-all">
                                            <div className="shrink-0 w-12 h-12 bg-blue-600 dark:bg-blue-700 rounded-xl flex flex-col items-center justify-center shadow">
                                                <span className="text-white text-[10px] font-bold uppercase leading-none">
                                                    {new Date(appt.date_time).toLocaleString('en-IN', { month: 'short' })}
                                                </span>
                                                <span className="text-white text-lg font-black leading-none">
                                                    {new Date(appt.date_time).getDate()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                        🤰 Pregnancy Checkup
                                                        {appt.doctor && (
                                                            <span className="text-gray-500 dark:text-slate-400 font-normal ml-1">
                                                                · {appt.doctor}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        daysUntil(appt.date_time) === 'Today'
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            : daysUntil(appt.date_time) === 'Tomorrow'
                                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                        {daysUntil(appt.date_time)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                    {formatApptDate(appt.date_time)} &nbsp;·&nbsp; {formatApptTime(appt.date_time)}
                                                </p>
                                                {appt.notes && (
                                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 italic truncate">
                                                        {appt.notes}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    {appt.google_event_id && (
                                                        <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                                                            ✅ Google Calendar
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 capitalize">
                                                        via {appt.source}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {confirmDeleteId === appt.id ? (
                                                    <div className="flex flex-col gap-1.5 items-end">
                                                        <p className="text-[10px] text-gray-500 dark:text-slate-400 text-right max-w-[130px]">
                                                            Remove?{appt.google_event_id ? ' Also deletes from Google Calendar.' : ''}
                                                        </p>
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => setConfirmDeleteId(null)}
                                                                disabled={deletingId === appt.id}
                                                                className="px-2.5 py-1 text-[10px] font-semibold border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteById(appt.id)}
                                                                disabled={deletingId === appt.id}
                                                                className="px-2.5 py-1 text-[10px] font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg transition-all flex items-center gap-1"
                                                            >
                                                                {deletingId === appt.id ? (
                                                                    <><span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting…</>
                                                                ) : 'Yes, Remove'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDeleteId(appt.id)}
                                                        className="p-2 text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                        title="Mark as done / delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                                <span className="text-4xl mb-3">📅</span>
                                <p className="text-gray-500 dark:text-slate-400 font-medium">No upcoming appointments</p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Upload a report to auto-schedule your next checkup.</p>
                                <button
                                    onClick={() => setShowReportUploader(true)}
                                    className="mt-4 px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-sm shadow transition-all"
                                >
                                    Upload Report
                                </button>
                            </div>
                        )}

                        {pastAppointments.length > 0 && (
                            <details className="group">
                                <summary className="flex items-center gap-2 px-6 py-3 cursor-pointer border-t border-gray-100 dark:border-slate-700 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 select-none list-none">
                                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Past Appointments · {pastAppointments.length}
                                </summary>
                                <ul className="divide-y divide-gray-50 dark:divide-slate-700/50 opacity-60">
                                    {pastAppointments.map((appt) => (
                                        <li key={appt.id} className="px-6 py-3 flex items-center gap-4">
                                            <div className="shrink-0 w-10 h-10 bg-gray-300 dark:bg-slate-600 rounded-xl flex flex-col items-center justify-center">
                                                <span className="text-gray-600 dark:text-slate-300 text-[9px] font-bold uppercase leading-none">
                                                    {new Date(appt.date_time).toLocaleString('en-IN', { month: 'short' })}
                                                </span>
                                                <span className="text-gray-600 dark:text-slate-300 text-sm font-black leading-none">
                                                    {new Date(appt.date_time).getDate()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 truncate line-through">
                                                    Pregnancy Checkup
                                                    {appt.doctor && ` · ${appt.doctor}`}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500">
                                                    {formatApptDate(appt.date_time)} · {formatApptTime(appt.date_time)}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                                                Done
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </>
                )}
            </div>

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
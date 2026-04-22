// frontend/src/pages/TeenDashboard.jsx
//
// Key change: voice / text input may contain MULTIPLE tasks in one paragraph.
// parse_voice  → returns { parsed: [task, task, ...] }
// add_from_voice → saves ALL tasks, syncs each to Google Calendar,
//                  returns { created: true, count: N, tasks: [...], skipped_duplicates: [...] }
//
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import AssessmentPrompt from '../components/Teen/AssessmentPrompt';
import CareerDiscovery from '../components/Teen/CareerDiscovery';
import UpgradeModal from '../components/Pricing/UpgradeModal';
import FeatureGuard from '../components/Common/FeatureGuard';
import { hasFeature, getRequiredPlan } from '../utils/featureAccess';
import { getCareerDiscoveryResults, deleteCareerDiscoveryResult } from '../services/assessmentService';
import api from '../services/api';
import {
    parseVoiceText,
    addTaskFromVoice,
    getTasks,
    updateTaskStatus,
    deleteTask,
} from '../services/studyPlannerService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
    High:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    Low:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const TYPE_ICONS = {
    'Test/Exam':           '📝',
    'Assignment/Deadline': '📌',
    'Meeting':             '🤝',
    'Task':                '✅',
};

function Badge({ text, color }) {
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
            {text}
        </span>
    );
}

// ─── Google Calendar banner ─────────────────────────────────────────────────

function GoogleCalendarBanner({ connected, onConnect, connecting }) {
    if (connected === null) return null;
    if (connected) {
        return (
            <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                <span className="text-xl">✅</span>
                <p className="text-green-700 dark:text-green-400 text-sm font-medium">
                    Google Calendar connected — your study tasks will be added automatically.
                </p>
            </div>
        );
    }
    return (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
                        Google Calendar not connected
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-400 text-xs">
                        Connect your Google account so tasks are added to your calendar automatically.
                    </p>
                </div>
            </div>
            <button
                onClick={onConnect}
                disabled={connecting}
                className="shrink-0 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
            >
                {connecting ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Connecting...
                    </>
                ) : (
                    "Connect Google Calendar"
                )}
            </button>
        </div>
    );
}

// ─── Multi-task preview card ────────────────────────────────────────────────

function MultiTaskPreview({ tasks, onConfirm, onDiscard, saving }) {
    if (!tasks || tasks.length === 0) return null;

    return (
        <div className="mb-6 p-4 bg-white dark:bg-slate-800 border border-violet-300 dark:border-violet-700 rounded-2xl shadow">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase text-violet-500">
                    AI Preview — {tasks.length} task{tasks.length > 1 ? 's' : ''} detected
                </p>
                <span className="text-xs text-gray-400 dark:text-slate-500">Review before saving</span>
            </div>

            <div className="space-y-3 mb-4">
                {tasks.map((t, idx) => (
                    <div
                        key={idx}
                        className="p-3 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30 rounded-xl"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                                {idx + 1}
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-white text-sm">
                                {TYPE_ICONS[t.type] ?? '📋'} {t.title}
                            </span>
                            <Badge text={t.priority} color={PRIORITY_COLORS[t.priority] ?? ''} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 dark:text-slate-400 pl-7">
                            <div><span className="font-semibold">Type: </span>{t.type}</div>
                            <div><span className="font-semibold">Date: </span>{t.date}</div>
                            <div><span className="font-semibold">Time: </span>{t.time ?? '—'}</div>
                            <div><span className="font-semibold">Reminder: </span>{t.reminder}</div>
                            <div><span className="font-semibold">Deadline: </span>{t.deadline ? 'Yes' : 'No'}</div>
                            <div>
                                <span className="font-semibold">Calendar: </span>
                                {t.calendar_event?.create
                                    ? `📅 ${t.calendar_event.event_type}`
                                    : 'Not scheduled'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onConfirm}
                    disabled={saving}
                    className="px-5 py-2 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving…
                        </>
                    ) : (
                        <>✅ Confirm & Save All {tasks.length > 1 ? `(${tasks.length})` : ''}</>
                    )}
                </button>
                <button
                    onClick={onDiscard}
                    disabled={saving}
                    className="px-5 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl text-sm font-bold hover:bg-gray-300 dark:hover:bg-slate-600"
                >
                    ✕ Discard
                </button>
            </div>
        </div>
    );
}

// ─── Study Planner ──────────────────────────────────────────────────────────

function StudyPlanner({ onFeatureLock, onBack }) {
    const { user } = useAuth();
    const { hasFeature } = useSubscription();
    const [activeTab, setActiveTab]       = useState('upcoming');
    const [tasks, setTasks]               = useState([]);
    const [loading, setLoading]           = useState(false);
    const [voiceText, setVoiceText]       = useState('');
    const [isListening, setIsListening]   = useState(false);
    const [parsing, setParsing]           = useState(false);
    const [saving, setSaving]             = useState(false);
    const [previews, setPreviews]         = useState(null);
    const [feedback, setFeedback]         = useState(null);
    const [clarify, setClarify]           = useState(false);
    const recognitionRef = useRef(null);

    const fetchTasks = useCallback(async (filter) => {
        setLoading(true);
        try {
            const { data } = await getTasks(filter);
            setTasks(Array.isArray(data) ? data : (data.results ?? []));
        } catch {
            setFeedback({ type: 'error', message: 'Failed to load tasks.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks(activeTab);
    }, [activeTab, fetchTasks]);

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setFeedback({ type: 'error', message: 'Your browser does not support voice input. Please type instead.' });
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.onresult = (e) => setVoiceText(e.results[0][0].transcript);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
            setIsListening(false);
            setFeedback({ type: 'error', message: 'Voice capture failed. Please try again.' });
        };
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    const handleParse = async () => {
        if (!hasFeature('study_planner')) {
            onFeatureLock();
            return;
        }
        if (!voiceText.trim()) return;
        setParsing(true);
        setPreviews(null);
        setFeedback(null);
        setClarify(false);
        try {
            const { data } = await parseVoiceText(voiceText);
            if (data.needs_clarification) {
                setClarify(true);
                setFeedback({ type: 'warn', message: data.question });
            } else {
                setPreviews(data.parsed);
            }
        } catch {
            setFeedback({ type: 'error', message: 'AI parsing failed. Please try again.' });
        } finally {
            setParsing(false);
        }
    };

    const handleConfirmSave = async () => {
        if (!hasFeature('study_planner')) {
            onFeatureLock();
            return;
        }
        if (!voiceText.trim()) return;
        setSaving(true);
        try {
            const { data } = await addTaskFromVoice(voiceText);

            if (data.needs_clarification) {
                setClarify(true);
                setFeedback({ type: 'warn', message: data.question });
                return;
            }

            const count = data.count ?? 0;
            const skipped = data.skipped_duplicates ?? [];
            let msg = '';

            if (count > 0) {
                const titles = data.tasks.map((t) => `"${t.title}"`).join(', ');
                msg = `✅ ${count} task${count > 1 ? 's' : ''} added: ${titles}`;
            }
            if (skipped.length > 0) {
                msg += ` (skipped ${skipped.length} duplicate${skipped.length > 1 ? 's' : ''}: ${skipped.map((s) => `"${s}"`).join(', ')})`;
            }
            if (count === 0 && skipped.length === 0) {
                msg = 'No tasks were added.';
            }

            setFeedback({ type: count > 0 ? 'success' : 'warn', message: msg });
            setVoiceText('');
            setPreviews(null);
            fetchTasks(activeTab);
        } catch {
            setFeedback({ type: 'error', message: 'Failed to save tasks. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (task) => {
        if (!hasFeature('study_planner')) {
            onFeatureLock();
            return;
        }
        const next = task.status === 'Pending' ? 'Completed' : 'Pending';
        try {
            await updateTaskStatus(task.id, next);
            fetchTasks(activeTab);
        } catch {
            setFeedback({ type: 'error', message: 'Status update failed.' });
        }
    };

    const handleDelete = async (id) => {
        if (!hasFeature('study_planner')) {
            onFeatureLock();
            return;
        }
        if (!window.confirm('Delete this task?')) return;
        try {
            await deleteTask(id);
            fetchTasks(activeTab);
        } catch {
            setFeedback({ type: 'error', message: 'Delete failed.' });
        }
    };

    const TABS = [
        { key: 'upcoming',  label: '📅 Upcoming' },
        { key: 'deadlines', label: '📌 Deadlines' },
        { key: 'completed', label: '✅ Completed' },
    ];

    const feedbackStyle = {
        success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        warn:    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        error:   'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    };

    return (
        <div className="card dark:bg-slate-900 border dark:border-slate-800 p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        📚 Study Planner
                    </h2>
                </div>
                <div className="text-gray-400 text-xs font-medium">Ai-powered scheduler</div>
            </div>

            <div className="mb-6 p-5 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/40 rounded-2xl">
                <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-1">
                    🎤 Speak or type one or more tasks
                </p>
                <p className="text-xs text-violet-500 dark:text-violet-400 mb-3">
                    e.g. "Math test on 10th April at 10 AM, submit science project by 15th April, meeting with mentor tomorrow at 5 PM"
                </p>
                <div className="flex gap-2">
                    <textarea
                        value={voiceText}
                        onFocus={() => {
                            if (!hasFeature('study_planner')) {
                                onFeatureLock();
                            }
                        }}
                        onChange={(e) => {
                            if (!hasFeature('study_planner')) return;
                            setVoiceText(e.target.value);
                        }}
                        placeholder='Describe all your tasks in one go…'
                        rows={3}
                        className="flex-1 p-3 rounded-xl border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <button
                        onClick={() => {
                            if (!hasFeature('study_planner')) {
                                onFeatureLock();
                            } else {
                                isListening ? stopListening() : startListening();
                            }
                        }}
                        title={isListening ? 'Stop' : 'Speak'}
                        className={`px-4 rounded-xl font-bold text-xl transition-all ${
                            isListening
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                    >
                        {isListening ? '⏹' : '🎙'}
                    </button>
                </div>
                <div className="flex gap-3 mt-3">
                    <button
                        onClick={handleParse}
                        disabled={parsing || saving || !voiceText.trim()}
                        className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
                    >
                        {parsing ? '⏳ Parsing…' : '🔍 Preview Tasks'}
                    </button>
                    <button
                        onClick={handleConfirmSave}
                        disabled={parsing || saving || !voiceText.trim()}
                        className="px-5 py-2 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700 disabled:opacity-50 transition flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving…
                            </>
                        ) : '➕ Add All Tasks'}
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={`mb-4 p-3 rounded-xl border text-sm font-medium ${feedbackStyle[feedback.type]}`}>
                    {feedback.message}
                    <button onClick={() => setFeedback(null)} className="float-right opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {previews && previews.length > 0 && (
                <MultiTaskPreview
                    tasks={previews}
                    onConfirm={handleConfirmSave}
                    onDiscard={() => { setPreviews(null); setVoiceText(''); }}
                    saving={saving}
                />
            )}

            <div className="flex gap-2 mb-5 border-b border-gray-100 dark:border-slate-800 pb-3">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                            activeTab === t.key
                                ? 'bg-violet-600 text-white shadow'
                                : 'text-gray-500 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
                {!loading && (
                    <span className="ml-auto self-center text-xs text-gray-400 dark:text-slate-500">
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-400 dark:text-slate-500 text-sm">No tasks here yet. Add one above!</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {tasks.map((task) => (
                        <li
                            key={task.id}
                            className={`flex items-start gap-4 p-4 rounded-2xl border transition ${
                                task.status === 'Completed'
                                    ? 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700/50 opacity-60'
                                    : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:shadow-md'
                            }`}
                        >
                            <button
                                onClick={() => toggleStatus(task)}
                                title="Toggle status"
                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition ${
                                    task.status === 'Completed'
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300 dark:border-slate-600 hover:border-violet-500'
                                }`}
                            >
                                {task.status === 'Completed' && (
                                    <span className="text-white text-xs leading-none flex items-center justify-center h-full">✓</span>
                                )}
                            </button>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className={`font-bold text-gray-800 dark:text-white truncate ${task.status === 'Completed' ? 'line-through' : ''}`}>
                                        {TYPE_ICONS[task.task_type]} {task.title}
                                    </span>
                                    <Badge text={task.priority} color={PRIORITY_COLORS[task.priority]} />
                                    <Badge text={task.task_type} color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" />
                                    {task.google_calendar_event_id && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400" title="Synced to Google Calendar">📅✓</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-gray-400 dark:text-slate-500">
                                    <span>📅 {task.date}</span>
                                    {task.time && <span>🕐 {task.time}</span>}
                                    <span>🔔 {task.reminder}</span>
                                    {task.deadline && <span className="text-red-500 font-semibold">⚠ Deadline</span>}
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(task.id)}
                                title="Delete"
                                className="text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition text-lg flex-shrink-0"
                            >
                                🗑
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Main TeenDashboard ─────────────────────────────────────────────────────

export default function TeenDashboard() {
    const { user, token } = useAuth();
    const { canAccessInsights, hasFeature } = useSubscription();
    const navigate = useNavigate();
    const location = useLocation();

    const [results, setResults]                         = useState([]);
    const [careerResults, setCareerResults]             = useState([]);
    const [loading, setLoading]                         = useState(true);
    const [takingAssessment, setTakingAssessment]       = useState(false);
    const [showAssessmentPrompt, setShowAssessmentPrompt] = useState(false);
    const [showCareerDiscovery, setShowCareerDiscovery] = useState(false);
    const [showStudyPlanner, setShowStudyPlanner] = useState(false);
    const [showCareerHistory, setShowCareerHistory] = useState(false);
    const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', plan: '' });

    const [googleConnected, setGoogleConnected]   = useState(null);
    const [connectingGoogle, setConnectingGoogle] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const [assessRes, careerRes] = await Promise.all([
                    api.get('/assessments/my_results/'),
                    getCareerDiscoveryResults()
                ]);
                const teen = (assessRes.data.results ?? assessRes.data).filter(
                    (r) => r.assessment?.assessment_type === 'teen'
                );
                setResults(teen);
                setCareerResults(careerRes.data.results ?? careerRes.data);
                if (teen.length === 0) setShowAssessmentPrompt(true);
            } catch {
                setResults([]);
                setCareerResults([]);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
        checkGoogleStatus();
    }, []);

    // Effect to reset sub-views when navigating back to the base dashboard path
    // This ensures that "Maybe Later" in UpgradeModal (which navigates to /dashboard/teen)
    // actually returns the user to the main dashboard view.
    useEffect(() => {
        if (location.pathname === '/dashboard/teen' && !location.search) {
            setShowStudyPlanner(false);
            setShowCareerDiscovery(false);
            setTakingAssessment(false);
        }
    }, [location]);

    const checkGoogleStatus = async () => {
        try {
            const res = await api.get('/users/google_status/');
            setGoogleConnected(res.data.connected);
        } catch {
            setGoogleConnected(false);
        }
    };

    const handleConnectGoogle = async () => {
        handleFeatureClick('study_planner', 'Google Calendar Sync', async () => {
            setConnectingGoogle(true);
            try {
                const res = await api.get('/users/google_oauth_url/');
                sessionStorage.setItem('redirectAfterGoogle', '/dashboard/teen');
                window.location.href = res.data.url;
            } catch {
                alert("Could not start Google connection. Please try again.");
                setConnectingGoogle(false);
            }
        });
    };

    const handleAssessmentComplete = () => {
        setTakingAssessment(false);
        setShowAssessmentPrompt(false);
        window.location.reload();
    };

    const handleFeatureClick = (featureKey, featureName, action) => {
        // Direct jump to modal for general features
        // But for Study Planner and Career Discovery, we now use the "Enter-to-Lock" flow
        if (!hasFeature(featureKey)) {
            setUpgradeModal({ 
                isOpen: true, 
                feature: featureName, 
                plan: getRequiredPlan(featureKey) 
            });
            return;
        }
        action();
    };

    const handleDeleteCareerResult = async (id) => {
        handleFeatureClick('career_discovery', 'Career Discovery', async () => {
            if (!window.confirm('Delete this career discovery result?')) return;
            try {
                await deleteCareerDiscoveryResult(id);
                setCareerResults((prev) => prev.filter(r => r.id !== id));
            } catch (error) {
                alert('Failed to delete career result.');
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
            </div>
        );
    }

    if (showStudyPlanner) {
        return (
            <div className="min-h-screen bg-transparent dark:bg-slate-900 p-4 md:p-8">
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    {/* Back button — Outside guard for accessibility */}
                    <button 
                        onClick={() => setShowStudyPlanner(false)}
                        className="self-start flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                    >
                        <span className="text-lg">←</span> Back to Dashboard
                    </button>

                    {/* Enter-to-Lock Content */}
                    <FeatureGuard feature="study_planner" maybeLaterPath="/dashboard/teen">
                        <StudyPlanner 
                            onBack={() => setShowStudyPlanner(false)}
                            onFeatureLock={() => {
                                setUpgradeModal({ 
                                    isOpen: true, 
                                    feature: 'Study Planner', 
                                    plan: getRequiredPlan('study_planner') 
                                });
                            }} 
                        />
                    </FeatureGuard>
                </div>
                {upgradeModal.isOpen && (
                    <UpgradeModal
                        isOpen={upgradeModal.isOpen}
                        onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                        featureName={upgradeModal.feature}
                        requiredPlan={upgradeModal.plan}
                        maybeLaterPath="/dashboard/teen"
                    />
                )}
            </div>
        );
    }

    if (showCareerDiscovery) {
        return (
            <>
                <CareerDiscovery onBack={() => setShowCareerDiscovery(false)} />
                {upgradeModal.isOpen && (
                    <UpgradeModal
                        isOpen={upgradeModal.isOpen}
                        onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                        featureName={upgradeModal.feature}
                        requiredPlan={upgradeModal.plan}
                        maybeLaterPath="/dashboard/teen"
                    />
                )}
            </>
        );
    }

    if (takingAssessment) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button 
                    onClick={() => setTakingAssessment(false)} 
                    className="mb-6 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    ← Back to Dashboard
                </button>
                <AssessmentPrompt
                    onComplete={handleAssessmentComplete}
                    onDismiss={() => setTakingAssessment(false)}
                />
                {upgradeModal.isOpen && (
                    <UpgradeModal
                        isOpen={upgradeModal.isOpen}
                        onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                        featureName={upgradeModal.feature}
                        requiredPlan={upgradeModal.plan}
                        maybeLaterPath="/dashboard/teen"
                    />
                )}
            </div>
        );
    }

    const chartData = results.map((r) => ({
        date: new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        score: Math.round(r.final_score),
    })).reverse();

    const latestResult = results[0];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            <h1 className="text-4xl font-extrabold dark:text-white tracking-tight">
                Your Growth <span className="dark:text-pink-500 text-blue-600">Dashboard</span>
            </h1>

            {showAssessmentPrompt && (
                <AssessmentPrompt
                    onComplete={handleAssessmentComplete}
                    onDismiss={() => setShowAssessmentPrompt(false)}
                />
            )}


            {/* Quick Actions Grid — Mirrored from Pregnancy Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {/* Study Planner Card */}
                <button 
                    onClick={() => setShowStudyPlanner(true)} 
                    className="group bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5 text-left hover:shadow-lg hover:border-violet-400 dark:hover:border-violet-600 transition-all relative overflow-hidden h-full min-h-[160px]"
                >
                    <div className="text-3xl mb-3 flex items-center justify-between">
                        <span>🎓</span>
                        {!hasFeature('study_planner') && <span className="text-[10px] px-2 py-0.5 bg-violet-200 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full font-bold">🔒 PREMIUM</span>}
                    </div>
                    <h3 className="text-base font-bold text-violet-700 dark:text-violet-300 mb-1 flex items-center gap-2">
                        AI Study Planner
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">AI-powered task scheduling, Google Calendar sync, and exam prep tracking.</p>
                    <span className="mt-4 inline-block text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:underline">Open Planner →</span>
                </button>

                {/* Career Discovery Card */}
                <button 
                    onClick={() => setShowCareerDiscovery(true)} 
                    className="group bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800 rounded-2xl p-5 text-left hover:shadow-lg hover:border-pink-400 dark:hover:border-pink-600 transition-all relative overflow-hidden h-full min-h-[160px]"
                >
                    <div className="text-3xl mb-3 flex items-center justify-between">
                        <span>🚀</span>
                        {!hasFeature('career_discovery') && <span className="text-[10px] px-2 py-0.5 bg-pink-200 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 rounded-full font-bold">🔒 PREMIUM</span>}
                    </div>
                    <h3 className="text-base font-bold text-pink-700 dark:text-pink-300 mb-1 flex items-center gap-2">
                        Career Discovery
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">Take an AI journey to find your perfect career path through interest analysis.</p>
                    <span className="mt-4 inline-block text-xs font-semibold text-pink-600 dark:text-pink-400 group-hover:underline">Start Journey →</span>
                </button>

                {/* Mentor Chat Card */}
                <a 
                    href="/mentor-chat/teen?stage=teen_age" 
                    className="group bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 text-left hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all relative h-full min-h-[160px]"
                >
                    <div className="text-3xl mb-3">💬</div>
                    <h3 className="text-base font-bold text-purple-700 dark:text-purple-300 mb-1">Mentor Chat</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">One-on-one guidance for studies, life goals, and personal development.</p>
                    <span className="mt-4 inline-block text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">Connect Now →</span>
                </a>

            </div>



            {/* Career Discovery Results History Toggle */}
            {careerResults && careerResults.length > 0 && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={() => setShowCareerHistory(!showCareerHistory)}
                        className="group relative px-8 py-3.5 bg-white dark:bg-slate-900 border border-violet-200 dark:border-slate-800 rounded-2xl shadow-xl hover:shadow-violet-500/20 transition-all duration-300 flex items-center gap-3 active:scale-95 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-xl">{showCareerHistory ? '🙈' : '🏆'}</span>
                        <span className="text-sm font-black text-gray-700 dark:text-white tracking-wide">
                            {showCareerHistory ? 'Hide My Career Quests' : 'Reveal Career Journey History'}
                        </span>
                        <svg 
                            className={`w-5 h-5 text-violet-500 transition-transform duration-500 ${showCareerHistory ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Career Discovery Results History Section */}
            {showCareerHistory && careerResults && careerResults.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
                            <span className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">🏆</span>
                            Your Career Quest History
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-violet-500/20 to-transparent ml-6 hidden md:block"></div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {careerResults.map((cres, idx) => (
                            <div key={cres.id || idx} className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                                {/* Gradient Background Pulse */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 blur-[80px] group-hover:bg-violet-500/20 transition-all duration-500"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="px-4 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-violet-200 dark:border-violet-800/50">
                                            {new Date(cres.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year:'numeric' })}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCareerResult(cres.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-gray-50/50 dark:bg-slate-800/50 rounded-xl hover:shadow-inner"
                                            title="Delete journey"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="text-5xl drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                                            {cres.best_career_emoji}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                                {cres.best_career_title}
                                            </h3>
                                            <div className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mt-1">Matched Career</div>
                                        </div>
                                    </div>

                                    <div className="relative mb-6">
                                        <div className="absolute left-0 top-0 w-1 h-full bg-violet-500/20 rounded-full"></div>
                                        <p className="pl-5 text-sm text-gray-600 dark:text-slate-300 italic leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                            "{cres.best_career_why}"
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3 ml-1">Your Key Traits</div>
                                            <div className="flex flex-wrap gap-2">
                                                {(cres.trait_labels || []).map((trait, tIdx) => (
                                                    <span key={tIdx} className="px-3 py-1.2 bg-white/50 dark:bg-slate-800/50 text-violet-700 dark:text-pink-400 text-[11px] font-black rounded-xl border border-violet-100 dark:border-slate-700 shadow-sm transition-all hover:border-violet-300 dark:hover:border-pink-500/30">
                                                        {trait}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {cres.alternatives && cres.alternatives.length > 0 && (
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3 ml-1">Alternative Paths</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {cres.alternatives.map((alt, aIdx) => (
                                                        <span key={aIdx} className="px-3 py-1 bg-violet-50/50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-300 text-[11px] font-bold rounded-lg border border-violet-100/50 dark:border-slate-800 transition-all hover:bg-violet-100 dark:hover:bg-slate-800">
                                                            {typeof alt === 'string' ? alt : `${alt.emoji || ''} ${alt.title || ''}`}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Assessment Results */}
            {latestResult ? (
                <>
                    <div className="card dark:bg-slate-900 border dark:border-slate-800 p-8 shadow-sm">
                        <h2 className="text-2xl font-bold mb-8 dark:text-white flex items-center gap-3">
                            <span className="p-2 bg-pink-500/10 rounded-lg text-pink-500">✨</span>
                            Latest Assessment
                        </h2>
                        <div className="grid md:grid-cols-5 gap-4">
                            {[
                                { label: 'Overall',   value: latestResult.final_score,     color: 'text-blue-600 dark:text-pink-500' },
                                { label: 'Health',    value: latestResult.health_score,    color: 'text-green-600' },
                                { label: 'Behavior',  value: latestResult.behavior_score,  color: 'text-orange-600' },
                                { label: 'Routine',   value: latestResult.routine_score,   color: 'text-purple-600' },
                                { label: 'Emotional', value: latestResult.emotional_score, color: 'text-red-600' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                    <p className={`text-4xl font-black ${color} mb-1`}>{value}%</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-8">
                            <div>
                                <h3 className="font-semibold text-green-600 mb-2">Your Strengths</h3>
                                <ul className="space-y-2">
                                    {latestResult.strengths.map((s, i) => (
                                        <li key={i} className="text-gray-700 dark:text-gray-300">✓ {s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-orange-600 mb-2">Areas to Improve</h3>
                                <ul className="space-y-2">
                                    {latestResult.improvements.map((imp, i) => (
                                        <li key={i} className="text-gray-700 dark:text-gray-300">→ {imp}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-bold mb-6 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2">
                                Growth Recommendations
                                {!canAccessInsights() && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black">PREMIUM</span>}
                            </h3>
                            
                            <div className={`relative rounded-2xl overflow-hidden ${!canAccessInsights() ? 'min-h-[200px]' : ''}`}>
                                {canAccessInsights() ? (
                                    <div className="bg-blue-50 dark:bg-pink-500/5 p-6 rounded-2xl border border-blue-100 dark:border-pink-500/20 shadow-inner space-y-4">
                                        {latestResult.recommendations.map((rec, i) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                                <p className="text-gray-700 dark:text-slate-300 italic">{rec}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 space-y-4">
                                        {[1, 2, 3].map((n) => (
                                            <div key={n} className="flex gap-4 items-start filter blur-[3px] opacity-40 select-none">
                                                <span className="flex-shrink-0 w-6 h-6 bg-gray-300 dark:bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-bold">{n}</span>
                                                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
                                            </div>
                                        ))}
                                        
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 dark:bg-slate-900/10 backdrop-blur-[1px]">
                                            <p className="text-gray-700 dark:text-slate-300 mb-4 font-bold text-center px-6">
                                                Upgrade to Growth plan to unlock personalised AI recommendations based on your scores.
                                            </p>
                                            <button 
                                                onClick={() => setUpgradeModal({ 
                                                    isOpen: true, 
                                                    feature: 'AI Insights', 
                                                    plan: getRequiredPlan('mental_health_guide') 
                                                })}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-xl transition-all transform hover:scale-105 active:scale-95"
                                            >
                                                Unlock Personalized Advice
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {results.length > 1 && (
                        <div className="card dark:bg-slate-900 border dark:border-slate-800 p-8 shadow-sm">
                            <h2 className="font-bold mb-8 dark:text-white uppercase text-xs tracking-widest">Progress Over Time</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }}
                                        itemStyle={{ color: '#ec4899' }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#ec4899" strokeWidth={4}
                                        dot={{ r: 6, fill: '#ec4899', strokeWidth: 2, stroke: '#ffffff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            ) : (
                <div className="card dark:bg-slate-900 border dark:border-slate-800 p-16 text-center shadow-lg flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-pink-500/10 rounded-full flex items-center justify-center mb-6 text-4xl">🚀</div>
                    <h2 className="text-2xl font-bold dark:text-white mb-3">Ready to start your journey?</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-8 max-w-sm italic">Take your first assessment to unlock personalised growth insights.</p>
                    <button
                        onClick={() => setTakingAssessment(true)}
                        className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                        Start Your First Assessment
                    </button>
                </div>
            )}

            {upgradeModal.isOpen && (
                <UpgradeModal
                    isOpen={upgradeModal.isOpen}
                    onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                    featureName={upgradeModal.feature}
                    requiredPlan={upgradeModal.plan}
                    maybeLaterPath="/dashboard/teen"
                />
            )}
        </div>
    );
}
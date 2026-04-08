// frontend/src/pages/TeenDashboard.jsx
//
// Key change: voice / text input may contain MULTIPLE tasks in one paragraph.
// parse_voice  → returns { parsed: [task, task, ...] }
// add_from_voice → saves ALL tasks, syncs each to Google Calendar,
//                  returns { created: true, count: N, tasks: [...], skipped_duplicates: [...] }
//
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import AssessmentPrompt from '../components/Teen/AssessmentPrompt';
import CareerDiscovery from '../components/Teen/CareerDiscovery';
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
//
// Shows all tasks parsed from one voice/text input so the teen can review them
// before confirming. Each task is shown as its own compact card inside the list.

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
                        {/* Task number badge */}
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

function StudyPlanner() {
    const [activeTab, setActiveTab]       = useState('upcoming');
    const [tasks, setTasks]               = useState([]);
    const [loading, setLoading]           = useState(false);
    const [voiceText, setVoiceText]       = useState('');
    const [isListening, setIsListening]   = useState(false);
    const [parsing, setParsing]           = useState(false);
    const [saving, setSaving]             = useState(false);
    // previews is now ALWAYS an array of task dicts (or null)
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

    // ── voice input ──────────────────────────────────────────────────────────

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

    // ── preview (parse only, no save) ────────────────────────────────────────

    const handleParse = async () => {
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
                // data.parsed is always an array now
                setPreviews(data.parsed);
            }
        } catch {
            setFeedback({ type: 'error', message: 'AI parsing failed. Please try again.' });
        } finally {
            setParsing(false);
        }
    };

    // ── confirm & save all tasks ─────────────────────────────────────────────

    const handleConfirmSave = async () => {
        if (!voiceText.trim()) return;
        setSaving(true);
        try {
            const { data } = await addTaskFromVoice(voiceText);

            if (data.needs_clarification) {
                setClarify(true);
                setFeedback({ type: 'warn', message: data.question });
                return;
            }

            // Build success message
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

    // ── task status / delete ─────────────────────────────────────────────────

    const toggleStatus = async (task) => {
        const next = task.status === 'Pending' ? 'Completed' : 'Pending';
        try {
            await updateTaskStatus(task.id, next);
            fetchTasks(activeTab);
        } catch {
            setFeedback({ type: 'error', message: 'Status update failed.' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await deleteTask(id);
            fetchTasks(activeTab);
        } catch {
            setFeedback({ type: 'error', message: 'Delete failed.' });
        }
    };

    // ── UI ───────────────────────────────────────────────────────────────────

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
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                    <span className="p-2 bg-violet-500/10 rounded-lg text-violet-500">🎓</span>
                    Study Planner
                </h2>
                <span className="text-xs text-gray-400 dark:text-slate-500">AI-powered scheduler</span>
            </div>

            {/* ── Voice / Text Input ─────────────────────────────────────── */}
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
                        onChange={(e) => setVoiceText(e.target.value)}
                        placeholder='Describe all your tasks in one go…'
                        rows={3}
                        className="flex-1 p-3 rounded-xl border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <button
                        onClick={isListening ? stopListening : startListening}
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

            {/* ── Feedback banner ─────────────────────────────────────────── */}
            {feedback && (
                <div className={`mb-4 p-3 rounded-xl border text-sm font-medium ${feedbackStyle[feedback.type]}`}>
                    {feedback.message}
                    <button onClick={() => setFeedback(null)} className="float-right opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* ── Multi-task Preview ──────────────────────────────────────── */}
            {previews && previews.length > 0 && (
                <MultiTaskPreview
                    tasks={previews}
                    onConfirm={handleConfirmSave}
                    onDiscard={() => { setPreviews(null); setVoiceText(''); }}
                    saving={saving}
                />
            )}

            {/* ── Tabs ────────────────────────────────────────────────────── */}
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
                {/* Task count badge */}
                {!loading && (
                    <span className="ml-auto self-center text-xs text-gray-400 dark:text-slate-500">
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── Task List ───────────────────────────────────────────────── */}
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
                            {/* Status toggle */}
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
                                    {/* Google Calendar sync indicator */}
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
    const { canAccessInsights } = useSubscription();
    const navigate = useNavigate();

    const [results, setResults]                         = useState([]);
    const [careerResults, setCareerResults]             = useState([]);
    const [loading, setLoading]                         = useState(true);
    const [takingAssessment, setTakingAssessment]       = useState(false);
    const [showAssessmentPrompt, setShowAssessmentPrompt] = useState(false);
    const [showCareerDiscovery, setShowCareerDiscovery] = useState(false);

    // Google Calendar connection state
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

    const checkGoogleStatus = async () => {
        try {
            const res = await api.get('/users/google_status/');
            setGoogleConnected(res.data.connected);
        } catch {
            setGoogleConnected(false);
        }
    };

    const handleConnectGoogle = async () => {
        setConnectingGoogle(true);
        try {
            const res = await api.get('/users/google_oauth_url/');
            sessionStorage.setItem('redirectAfterGoogle', '/dashboard/teen');
            window.location.href = res.data.url;
        } catch {
            alert("Could not start Google connection. Please try again.");
            setConnectingGoogle(false);
        }
    };

    const handleAssessmentComplete = () => {
        setTakingAssessment(false);
        setShowAssessmentPrompt(false);
        window.location.reload();
    };

    const handleDeleteCareerResult = async (id) => {
        if (!window.confirm('Delete this career discovery result?')) return;
        try {
            await deleteCareerDiscoveryResult(id);
            setCareerResults((prev) => prev.filter(r => r.id !== id));
        } catch (error) {
            alert('Failed to delete career result.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
            </div>
        );
    }

    if (showCareerDiscovery) {
        return <CareerDiscovery onBack={() => setShowCareerDiscovery(false)} />;
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

            {/* Google Calendar banner */}
            {googleConnected !== null && (
                <GoogleCalendarBanner
                    connected={googleConnected}
                    onConnect={handleConnectGoogle}
                    connecting={connectingGoogle}
                />
            )}

            {showAssessmentPrompt && (
                <AssessmentPrompt
                    onComplete={handleAssessmentComplete}
                    onDismiss={() => setShowAssessmentPrompt(false)}
                />
            )}

            {/* Study Planner (always visible) */}
            <StudyPlanner />

            {/* Career Discovery Journey */}
            <div
                onClick={() => setShowCareerDiscovery(true)}
                className="block cursor-pointer bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-violet-200 dark:border-slate-700 hover:shadow-lg transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
                            🚀
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Career Discovery Journey</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Discover your ideal career through an exciting, game-like adventure!
                            </p>
                        </div>
                    </div>
                    <span className="text-violet-600 dark:text-pink-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                        Start Journey →
                    </span>
                </div>
            </div>

            {/* Mentor Chat Section */}
            <a
                href="/mentor-chat/teen?stage=teen_age"
                className="block bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-purple-200 dark:border-slate-700 hover:shadow-lg transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-600 dark:bg-pink-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            💬
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Chat with Your Mentor</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Get guidance on studies, goals, and personal growth
                            </p>
                        </div>
                    </div>
                    <span className="text-purple-600 dark:text-pink-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                        Open Chat →
                    </span>
                </div>
            </a>

            {/* Career Discovery Results History */}
            {careerResults && careerResults.length > 0 && (
                <div className="card dark:bg-slate-900 border dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                            <span className="p-2 bg-violet-500/10 rounded-lg text-violet-500">🏆</span>
                            Your Career Journey Results
                        </h2>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        {careerResults.map((cres, idx) => (
                            <div key={cres.id || idx} className="p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-violet-100 dark:border-slate-700 shadow-sm transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 block uppercase tracking-wider">
                                        {new Date(cres.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year:'numeric' })}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteCareerResult(cres.id)}
                                        title="Delete"
                                        className="text-gray-400 hover:text-red-500 transition ml-auto block"
                                    >
                                        🗑
                                    </button>
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                    {cres.best_career_emoji} {cres.best_career_title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 italic leading-relaxed">
                                    "{cres.best_career_why}"
                                </p>
                                
                                <div className="mb-4">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-2">Top Traits</div>
                                    <div className="flex flex-wrap gap-2">
                                        {(cres.trait_labels || []).map((trait, tIdx) => (
                                            <span key={tIdx} className="px-2 py-1 bg-white dark:bg-slate-700 text-violet-600 dark:text-pink-400 text-xs font-bold rounded-lg border border-violet-100 dark:border-slate-600">
                                                {trait}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {cres.alternatives && cres.alternatives.length > 0 && (
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-2">Alternative Paths</div>
                                        <div className="flex flex-wrap gap-2">
                                            {cres.alternatives.map((alt, aIdx) => (
                                                <span key={aIdx} className="text-xs text-gray-600 dark:text-slate-300 bg-white/50 dark:bg-slate-900 border dark:border-slate-700 px-2 py-1 rounded-lg">
                                                    {typeof alt === 'string' ? alt : `${alt.emoji || ''} ${alt.title || ''}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                            <h3 className="font-bold mb-6 dark:text-white uppercase text-xs tracking-widest">Growth Recommendations</h3>
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
                                <div className="bg-gray-100 dark:bg-slate-800 p-10 rounded-2xl text-center border dark:border-slate-700">
                                    <div className="text-3xl mb-4">🔒</div>
                                    <p className="text-gray-700 dark:text-slate-400 mb-6 font-medium">Upgrade to Growth plan to unlock personalised AI recommendations.</p>
                                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg transition-all">
                                        Upgrade to Growth
                                    </button>
                                </div>
                            )}
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
        </div>
    );
}
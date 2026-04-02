// frontend/src/components/Reports/MaternalHealthGuide.jsx
//
// Drop-in component for the PregnancyDashboard.
// Handles:
//   1. File upload + optional trimester selection
//   2. Loading / progress feedback
//   3. Beautiful, mobile-friendly guide display
//   4. Past guides history panel

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    uploadReportForHealthGuide,
    getHealthGuideHistory,
} from '../../services/maternalHealthService';

// ── helpers ────────────────────────────────────────────────────────────────────

const TRIMESTERS = [
    '',
    'First Trimester (Months 1–3)',
    'Second Trimester (Months 4–6)',
    'Third Trimester (Months 7–9)',
    '1st Month', '2nd Month', '3rd Month',
    '4th Month', '5th Month', '6th Month',
    '7th Month', '8th Month', '9th Month',
];

const severityColor = (s = '') => {
    const m = s.toLowerCase();
    if (m === 'high') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (m === 'moderate') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
};

const statusColor = (s = '') => {
    const m = s.toLowerCase();
    if (m === 'high') return 'text-red-600 dark:text-red-400';
    if (m === 'low') return 'text-orange-500 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
};

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

// ── FIX: normalize anything → array of strings ────────────────────────────────
function toArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value];
    return [];
}

// ── sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ emoji, title, children, accent = 'blue' }) {
    const accentMap = {
        blue: 'border-blue-300 dark:border-blue-700',
        pink: 'border-pink-300 dark:border-pink-700',
        green: 'border-green-300 dark:border-green-700',
        yellow: 'border-yellow-300 dark:border-yellow-700',
        red: 'border-red-400 dark:border-red-600',
        purple: 'border-purple-300 dark:border-purple-700',
    };
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-l-4 ${accentMap[accent]} p-5 mb-4`}>
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <span>{emoji}</span>{title}
            </h3>
            {children}
        </div>
    );
}

function Chip({ text, color = 'blue' }) {
    const map = {
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    };
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mr-2 mb-2 ${map[color]}`}>
            {text}
        </span>
    );
}

// ── FIX: BulletList now uses toArray() so it never crashes on non-arrays ───────
function BulletList({ items }) {
    const safeItems = toArray(items);
    if (!safeItems.length) return null;
    return (
        <ul className="space-y-1">
            {safeItems.map((item, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-slate-300 flex items-start gap-2">
                    <span className="mt-1 text-pink-500 dark:text-pink-400">•</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

// ── main guide display ─────────────────────────────────────────────────────────

function GuideDisplay({ guide }) {
    const {
        overall_status,
        alerts,
    } = guide;

    // ── FIX: normalize every field so Gemini inconsistencies never crash the UI ──
    const positives     = toArray(guide.positives);
    const issues        = toArray(guide.issues);
    const care_goals    = toArray(guide.care_goals);

    const rawRec        = guide.recommendations || {};
    const recommendations = {
        food:          toArray(rawRec.food),
        water:         typeof rawRec.water === 'string' ? rawRec.water : '',
        exercise:      toArray(rawRec.exercise),
        sleep:         typeof rawRec.sleep === 'string' ? rawRec.sleep : '',
        mental_health: toArray(rawRec.mental_health),
        avoid:         toArray(rawRec.avoid),
    };

    return (
        <div className="space-y-4 fade-in">
            {/* Greeting */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-5 border border-pink-200 dark:border-pink-800">
                <p className="text-base font-semibold text-pink-700 dark:text-pink-300">
                    👋 Hi, based on your report, here is your simple health guide.
                </p>
            </div>

            {/* Overall status */}
            {overall_status && (
                <SectionCard emoji="📊" title="Overall Status" accent="blue">
                    <p className="text-sm text-gray-700 dark:text-slate-300">{overall_status}</p>
                </SectionCard>
            )}

            {/* Positives */}
            {positives.length > 0 && (
                <SectionCard emoji="✅" title="Positive Points" accent="green">
                    <div className="flex flex-wrap">
                        {positives.map((p, i) => <Chip key={i} text={p} color="green" />)}
                    </div>
                </SectionCard>
            )}

            {/* Key Issues */}
            {issues.length > 0 && (
                <SectionCard emoji="⚠️" title="Key Issues" accent="yellow">
                    <div className="space-y-3">
                        {issues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-bold text-sm text-gray-800 dark:text-white">{issue.parameter}</span>
                                        <span className={`text-xs font-semibold ${statusColor(issue.status)}`}>{issue.status}</span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityColor(issue.severity)}`}>
                                            {issue.severity}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-slate-400">{issue.meaning}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Recommendations */}
            <SectionCard emoji="🍽️" title="Daily Health Guide" accent="pink">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recommendations.food.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-1 uppercase tracking-wide">🥗 Food</p>
                            <BulletList items={recommendations.food} />
                        </div>
                    )}
                    {recommendations.water && (
                        <div>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">💧 Water</p>
                            <p className="text-sm text-gray-700 dark:text-slate-300">{recommendations.water}</p>
                        </div>
                    )}
                    {recommendations.exercise.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1 uppercase tracking-wide">🚶 Exercise</p>
                            <BulletList items={recommendations.exercise} />
                        </div>
                    )}
                    {recommendations.sleep && (
                        <div>
                            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide">😴 Rest & Sleep</p>
                            <p className="text-sm text-gray-700 dark:text-slate-300">{recommendations.sleep}</p>
                        </div>
                    )}
                    {recommendations.mental_health.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400 mb-1 uppercase tracking-wide">🧘 Mental Well-being</p>
                            <BulletList items={recommendations.mental_health} />
                        </div>
                    )}
                    {recommendations.avoid.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 uppercase tracking-wide">🚫 Avoid</p>
                            <BulletList items={recommendations.avoid} />
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* Care Goals */}
            {care_goals.length > 0 && (
                <SectionCard emoji="🎯" title="Daily Care Goals" accent="purple">
                    <div className="space-y-3">
                        {care_goals.map((cg, i) => (
                            <div key={i} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                                <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">🎯 {cg.goal}</p>
                                {/* FIX: cg.steps also normalized via BulletList → toArray */}
                                <BulletList items={cg.steps} />
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Alert */}
            {alerts && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-2xl p-5">
                    <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-1">
                        🚨 Alert
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300">{alerts}</p>
                </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-center text-gray-400 dark:text-slate-500 mt-4 italic">
                This is general guidance. Please consult your doctor.
            </p>
        </div>
    );
}

// ── main component ─────────────────────────────────────────────────────────────

export default function MaternalHealthGuide() {
    const [step, setStep] = useState('upload'); // upload | loading | result | error | history
    const [file, setFile] = useState(null);
    const [trimester, setTrimester] = useState('');
    const [guide, setGuide] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeHistory, setActiveHistory] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);

    // Fetch history when needed
    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await getHealthGuideHistory();
            setHistory(res.data);
        } catch {
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (step === 'history') fetchHistory();
    }, [step, fetchHistory]);

    // Drag-and-drop
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) setFile(dropped);
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setStep('loading');
        setErrorMsg('');
        try {
            const res = await uploadReportForHealthGuide(file, trimester);
            setGuide(res.data.guide);
            setStep('result');
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Something went wrong. Please try again.');
            setStep('error');
        }
    };

    const reset = () => {
        setStep('upload');
        setFile(null);
        setTrimester('');
        setGuide(null);
        setErrorMsg('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── UPLOAD STEP ────────────────────────────────────────────────────────────
    if (step === 'upload') return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-extrabold dark:text-white">🤰 Maternal Health Guide</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Upload your checkup report — get a simple, friendly health guide instantly.
                    </p>
                </div>
                <button
                    onClick={() => setStep('history')}
                    className="text-sm px-4 py-2 border border-pink-400 text-pink-600 dark:text-pink-400 dark:border-pink-600 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 font-semibold transition-all"
                >
                    📂 Past Guides
                </button>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all mb-5 ${
                    isDragging
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10'
                        : 'border-gray-300 dark:border-slate-600 hover:border-pink-400 dark:hover:border-pink-500 bg-gray-50 dark:bg-slate-800/50'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.tiff"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && setFile(e.target.files[0])}
                />
                <div className="text-5xl mb-3">{file ? '📄' : '⬆️'}</div>
                {file ? (
                    <p className="font-semibold text-pink-600 dark:text-pink-400">{file.name}</p>
                ) : (
                    <>
                        <p className="font-semibold text-gray-600 dark:text-slate-300">Drop your report here or click to browse</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Supports PDF, PNG, JPG, TIFF</p>
                    </>
                )}
            </div>

            {/* Trimester selector */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Pregnancy Stage <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                    value={trimester}
                    onChange={(e) => setTrimester(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 dark:text-white transition-all"
                >
                    {TRIMESTERS.map((t, i) => (
                        <option key={i} value={t}>{t || '— Select trimester / month —'}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={handleAnalyze}
                disabled={!file}
                className="w-full py-3.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg transition-all transform active:scale-[0.98]"
            >
                ✨ Analyze Report &amp; Get Health Guide
            </button>
        </div>
    );

    // ── LOADING ────────────────────────────────────────────────────────────────
    if (step === 'loading') return (
        <div className="flex flex-col items-center justify-center py-20 space-y-5">
            <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
            <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">Analyzing your report…</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center max-w-xs">
                Our AI is reading your report and creating a personalized health guide. This takes a few seconds.
            </p>
        </div>
    );

    // ── RESULT ─────────────────────────────────────────────────────────────────
    if (step === 'result' && guide) return (
        <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <h2 className="text-xl font-extrabold dark:text-white">🌸 Your Health Guide</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setStep('history')}
                        className="text-sm px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold transition-all"
                    >
                        📂 Past Guides
                    </button>
                    <button
                        onClick={reset}
                        className="text-sm px-4 py-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700 font-bold shadow transition-all"
                    >
                        Upload Another
                    </button>
                </div>
            </div>
            <GuideDisplay guide={guide} />
        </div>
    );

    // ── ERROR ──────────────────────────────────────────────────────────────────
    if (step === 'error') return (
        <div className="text-center py-16">
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong</h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">{errorMsg}</p>
            <button onClick={reset} className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow transition-all">
                Try Again
            </button>
        </div>
    );

    // ── HISTORY ────────────────────────────────────────────────────────────────
    if (step === 'history') return (
        <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <h2 className="text-xl font-extrabold dark:text-white">📂 Past Health Guides</h2>
                <button
                    onClick={reset}
                    className="text-sm px-4 py-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700 font-bold shadow transition-all"
                >
                    + New Guide
                </button>
            </div>

            {historyLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
                </div>
            )}

            {!historyLoading && history.length === 0 && (
                <div className="text-center py-16 text-gray-400 dark:text-slate-500">
                    <div className="text-5xl mb-3">📋</div>
                    <p>No guides yet. Upload your first report!</p>
                </div>
            )}

            {/* List of past guides */}
            {!historyLoading && !activeHistory && history.map((g) => (
                <div
                    key={g.id}
                    onClick={() => setActiveHistory(g)}
                    className="cursor-pointer bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 mb-3 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-600 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-800 dark:text-white">
                                {g.trimester || 'Pregnancy Report'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{formatDate(g.created_at)}</p>
                        </div>
                        <div className="text-right">
                            {g.alerts ? (
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">🚨 Alert</span>
                            ) : (
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">✅ Good</span>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 line-clamp-2">{g.overall_status}</p>
                </div>
            ))}

            {/* Past guide detail */}
            {activeHistory && (
                <div>
                    <button
                        onClick={() => setActiveHistory(null)}
                        className="mb-4 text-sm text-pink-600 dark:text-pink-400 font-semibold flex items-center gap-1 hover:underline"
                    >
                        ← Back to list
                    </button>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
                        {activeHistory.trimester && <span className="mr-2 font-semibold">{activeHistory.trimester}</span>}
                        {formatDate(activeHistory.created_at)}
                    </p>
                    <GuideDisplay guide={activeHistory} />
                </div>
            )}
        </div>
    );

    return null;
}
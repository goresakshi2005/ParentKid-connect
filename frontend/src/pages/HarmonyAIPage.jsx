import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowLeft, FiAlertTriangle, FiCheckCircle, FiActivity,
    FiShield, FiZap, FiRefreshCw, FiMessageCircle, FiPhone,
    FiEyeOff, FiTarget, FiHeart, FiClock, FiTrendingUp,
    FiMonitor, FiMic, FiFileText, FiUsers, FiTool, FiDatabase
} from 'react-icons/fi';

const HarmonyAIPage = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [activeSimTab, setActiveSimTab] = useState('calm_talk');
    const [realtimeScreen, setRealtimeScreen] = useState(null);
    const [childInfo, setChildInfo] = useState(null);
    const [showSources, setShowSources] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [analyzingStep, setAnalyzingStep] = useState(0);

    // On mount: load child info + latest saved report from history (NO auto-analysis)
    useEffect(() => {
        let unsub = null;
        const init = async () => {
            setLoading(true);
            try {
                const childRes = await api.get(`/children/${childId}/`);
                setChildInfo(childRes.data);

                // Load saved history — show the latest report if available
                const histRes = await api.get(`/insights/harmony-ai/history/${childId}/`);
                const reports = histRes.data || [];
                setHistory(reports);
                if (reports.length > 0) {
                    setData(reports[0]); // Show the most recent saved report
                }

                // Firebase listener for live screen data (display-only, never triggers analysis)
                const fbId = childRes.data?.email || childRes.data?.firebase_id;
                if (fbId) {
                    const docRef = doc(db, 'screen_time', fbId);
                    unsub = onSnapshot(docRef, (snap) => {
                        if (snap.exists()) setRealtimeScreen(snap.data());
                    });
                }
            } catch (e) {
                console.error('Init failed:', e);
            } finally {
                setLoading(false);
            }
        };
        init();
        return () => { if (unsub) unsub(); };
    }, [childId]);

    // Analysis progress steps
    const analysisSteps = [
        { label: 'Fetching screen time data from Firebase...', icon: <FiMonitor /> },
        { label: 'Analyzing relationship intelligence...', icon: <FiUsers /> },
        { label: 'Processing Magic Fix history...', icon: <FiTool /> },
        { label: 'Evaluating voice & assessment data...', icon: <FiMic /> },
        { label: 'Generating Harmony AI report...', icon: <FiZap /> },
    ];

    // Generate a NEW analysis — only called by explicit user action
    const generateNewAnalysis = async () => {
        setAnalyzing(true);
        setAnalyzingStep(0);
        setError(null);

        // Animate through progress steps
        const stepInterval = setInterval(() => {
            setAnalyzingStep(prev => {
                if (prev < analysisSteps.length - 1) return prev + 1;
                return prev;
            });
        }, 2500);

        try {
            const res = await api.get('/insights/harmony-ai/', { params: { child_id: childId } });
            clearInterval(stepInterval);
            setAnalyzingStep(analysisSteps.length - 1); // Jump to last step
            // Brief pause to show completion
            await new Promise(r => setTimeout(r, 600));
            setData(res.data);
            setHistory(prev => [res.data, ...prev]);
            setShowHistory(false);
        } catch (err) {
            clearInterval(stepInterval);
            setError(err.response?.data?.error || 'Analysis failed');
        } finally {
            setAnalyzing(false);
            setAnalyzingStep(0);
        }
    };

    // Load a past report from history
    const loadReport = (report) => {
        setData(report);
        setShowHistory(false);
    };

    const getRiskColor = (level) => {
        const l = (level || '').toUpperCase();
        if (l === 'LOW') return { bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-400', light: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' };
        if (l === 'MEDIUM') return { bg: 'from-amber-500 to-orange-600', text: 'text-amber-400', light: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' };
        return { bg: 'from-rose-500 to-pink-600', text: 'text-rose-400', light: 'bg-rose-500/10', border: 'border-rose-500/20', dot: 'bg-rose-400' };
    };

    const getBehaviorIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (t === 'addicted') return '📱';
        if (t === 'balanced') return '⚖️';
        if (t === 'resistant') return '🛡️';
        if (t === 'stressed') return '😰';
        return '🧠';
    };

    const getEmotionIcon = (cond) => {
        const c = (cond || '').toLowerCase();
        if (c === 'frustrated') return '😤';
        if (c === 'calm') return '😌';
        if (c === 'overwhelmed') return '😵';
        if (c === 'angry') return '😠';
        if (c === 'sad') return '😢';
        return '🤔';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                    className="w-24 h-24 bg-violet-500/10 rounded-3xl flex items-center justify-center mb-6"
                >
                    <FiZap className="text-5xl text-violet-500 animate-pulse" />
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-2">Loading Harmony AI...</h2>
                <p className="text-slate-400 max-w-xs">Fetching your saved intelligence reports.</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="min-h-screen bg-[#020617] p-6 flex flex-col items-center justify-center">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-red-900/20">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiAlertTriangle className="text-4xl text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Analysis Failed</h2>
                    <p className="text-slate-400 mb-8">{error}</p>
                    <div className="flex gap-3">
                        <button onClick={() => navigate(-1)} className="flex-1 py-4 border border-slate-700 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">Go Back</button>
                        <button onClick={generateNewAnalysis} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all">Retry</button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // No saved reports yet — prompt user to generate first one
    if (!data) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-violet-900/20">
                    <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiZap className="text-4xl text-violet-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">No Reports Yet</h2>
                    <p className="text-slate-400 mb-8">Generate your first Harmony AI analysis to get actionable parenting intelligence.</p>
                    <div className="flex gap-3">
                        <button onClick={() => navigate(-1)} className="flex-1 py-4 border border-slate-700 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">Go Back</button>
                        <button onClick={generateNewAnalysis} disabled={analyzing}
                            className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all flex items-center justify-center gap-2">
                            <FiZap className={analyzing ? 'animate-spin' : ''} />
                            {analyzing ? 'Analyzing...' : 'Generate Analysis'}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── ANALYZING PROGRESS OVERLAY ───
    if (analyzing) {
        const progress = ((analyzingStep + 1) / analysisSteps.length) * 100;
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[20%] left-[10%] w-[60%] h-[60%] bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-[0.07] blur-[100px] rounded-full"
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-gradient-to-br from-cyan-500 to-emerald-500 opacity-[0.05] blur-[80px] rounded-full"
                    />
                </div>

                <div className="relative z-10 max-w-lg w-full">
                    {/* Pulsing Icon */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mx-auto mb-8"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-28 h-28 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-[2rem] flex items-center justify-center mx-auto border border-violet-500/10 shadow-2xl shadow-violet-500/10"
                        >
                            <motion.div
                                key={analyzingStep}
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="text-4xl text-violet-400"
                            >
                                {analysisSteps[analyzingStep]?.icon}
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-white mb-2">Analyzing Intelligence...</h2>
                    <p className="text-slate-500 text-sm mb-10">Combining all data sources into your Harmony report</p>

                    {/* Progress Bar */}
                    <div className="w-full max-w-sm mx-auto mb-8">
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Step {analyzingStep + 1} of {analysisSteps.length}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">{Math.round(progress)}%</span>
                        </div>
                    </div>

                    {/* Step List */}
                    <div className="space-y-3 text-left">
                        {analysisSteps.map((step, idx) => {
                            const isDone = idx < analyzingStep;
                            const isActive = idx === analyzingStep;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: isActive || isDone ? 1 : 0.3 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                                        isActive
                                            ? 'bg-violet-500/10 border border-violet-500/20'
                                            : isDone
                                                ? 'bg-white/[0.02] border border-white/5'
                                                : 'border border-transparent'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all duration-500 ${
                                        isDone
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : isActive
                                                ? 'bg-violet-500/20 text-violet-400'
                                                : 'bg-slate-800 text-slate-600'
                                    }`}>
                                        {isDone ? <FiCheckCircle /> : isActive ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>{step.icon}</motion.div> : step.icon}
                                    </div>
                                    <span className={`text-sm font-bold transition-colors duration-500 ${
                                        isDone ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-600'
                                    }`}>
                                        {isDone ? step.label.replace('...', ' ✓') : step.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    const conflict = data.conflict_prediction || {};
    const childState = data.child_state || {};
    const sims = data.simulations || {};
    const strategy = data.best_strategy || {};
    const guidance = data.parent_guidance || {};
    const riskMeta = getRiskColor(conflict.level);
    const confidenceScore = data.confidence_score || 0;
    const dataSources = data.data_sources || {};
    const liveApps = realtimeScreen?.apps || {};
    const liveTotal = Object.values(liveApps).reduce((s, v) => s + (parseInt(v) || 0), 0);

    const sourceItems = [
        { key: 'screen_time', label: 'Screen Time', icon: <FiMonitor />, color: 'violet' },
        { key: 'voice_emotion', label: 'Voice Emotion', icon: <FiMic />, color: 'cyan' },
        { key: 'assessment', label: 'Assessment', icon: <FiFileText />, color: 'amber' },
        { key: 'relationship_intelligence', label: 'Relationship AI', icon: <FiUsers />, color: 'fuchsia' },
        { key: 'magic_fix_history', label: 'Magic Fix', icon: <FiTool />, color: 'emerald' },
    ];

    const simTabs = [
        { key: 'calm_talk', label: 'Calm Talk', icon: <FiMessageCircle />, color: 'from-emerald-500 to-teal-500' },
        { key: 'restrict_phone', label: 'Restrict Phone', icon: <FiPhone />, color: 'from-rose-500 to-pink-500' },
        { key: 'ignore', label: 'Ignore', icon: <FiEyeOff />, color: 'from-amber-500 to-orange-500' },
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans overflow-x-hidden">
            {/* ─── HEADER ─── */}
            <header className="relative bg-[#050a1f] overflow-hidden py-12 px-6">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className={`absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-10 blur-[80px] rounded-full`}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px]" />
                </div>

                <div className="max-w-6xl mx-auto w-full relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <motion.button initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            onClick={() => navigate(-1)}
                            className="bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl transition-all backdrop-blur-xl border border-white/10 group shadow-lg">
                            <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </motion.button>
                        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                            <div className="relative w-2 h-2 bg-violet-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">Harmony AI</span>
                        </motion.div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-[1.5px] bg-violet-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-400">Decision Intelligence</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black text-white leading-none tracking-tight mb-2">
                                {data.child_name}'s <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">Harmony Report</span>
                            </h1>
                            <p className="text-slate-400 text-sm">Real-time parenting intelligence powered by AI</p>
                        </motion.div>

                        <div className="flex items-center gap-3">
                            {history.length > 0 && (
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="bg-white/10 text-white px-5 py-3 rounded-2xl font-black transition-all shadow-lg flex items-center gap-2 text-xs uppercase tracking-widest border border-white/10 backdrop-blur-xl">
                                    <FiClock className="text-lg" />
                                    History ({history.length})
                                </motion.button>
                            )}
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={generateNewAnalysis} disabled={analyzing}
                                className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black transition-all shadow-lg flex items-center gap-3 text-xs uppercase tracking-widest">
                                <FiRefreshCw className={`text-lg ${analyzing ? "animate-spin" : ""}`} />
                                {analyzing ? "Analyzing..." : "New Analysis"}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── HISTORY PANEL (slides in from top) ─── */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[#050a1f] border-b border-white/5"
                    >
                        <div className="max-w-6xl mx-auto px-6 py-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <FiClock className="text-violet-400" /> Past Reports
                                </h3>
                                <button onClick={() => setShowHistory(false)}
                                    className="text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-wider">
                                    Close
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
                                {history.map((report, idx) => {
                                    const isActive = report.id === data?.id || (report.report_id === data?.report_id && report.report_id);
                                    const riskLevel = report.conflict_prediction?.level || 'LOW';
                                    const rc = getRiskColor(riskLevel);
                                    const dateStr = report.created_at
                                        ? new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : 'Unknown date';
                                    return (
                                        <button key={report.id || idx} onClick={() => loadReport(report)}
                                            className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] ${
                                                isActive
                                                    ? 'bg-violet-500/10 border-violet-500/30'
                                                    : 'bg-white/5 border-white/5 hover:border-white/10'
                                            }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{dateStr}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${rc.light} ${rc.text} border ${rc.border}`}>
                                                    {riskLevel}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-white truncate mb-1">
                                                {report.best_strategy?.recommended_action || 'Harmony Report'}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {report.child_state?.summary?.substring(0, 80) || 'AI analysis report'}...
                                            </p>
                                            {isActive && (
                                                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest mt-2 inline-block">Currently Viewing</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── REPORT TIMESTAMP ─── */}
            {data.created_at && (
                <div className="max-w-6xl mx-auto px-6 mt-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <FiClock size={10} />
                        <span>Report generated: {new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {data.saved && <span className="text-emerald-500 ml-2">• Saved</span>}
                    </div>
                </div>
            )}

            {/* ─── MAIN CONTENT ─── */}
            <main className="max-w-6xl mx-auto px-6 -mt-2 pb-32 relative z-20">
                <div className="space-y-8">

                    {/* ─── DATA SOURCES PANEL ─── */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="bg-slate-900/50 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/5 shadow-2xl">
                        <button onClick={() => setShowSources(!showSources)}
                            className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                    <FiDatabase className="text-lg text-violet-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-black text-white">Intelligence Sources</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {sourceItems.filter(s => dataSources[s.key]?.available).length} of {sourceItems.length} active
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {sourceItems.map(s => (
                                    <div key={s.key} className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        dataSources[s.key]?.available
                                            ? `bg-${s.color}-400 shadow-[0_0_6px_rgba(167,139,250,0.4)]`
                                            : 'bg-slate-700'
                                    }`} />
                                ))}
                            </div>
                        </button>
                        <AnimatePresence>
                            {showSources && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
                                        {sourceItems.map(s => {
                                            const src = dataSources[s.key] || {};
                                            const active = src.available;
                                            return (
                                                <div key={s.key} className={`p-4 rounded-2xl border transition-all ${
                                                    active
                                                        ? 'bg-white/5 border-white/10'
                                                        : 'bg-slate-900/30 border-slate-800/50 opacity-50'
                                                }`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={active ? 'text-violet-400' : 'text-slate-600'}>{s.icon}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-red-500'}`} />
                                                        <span className="text-[9px] font-bold text-slate-500">{active ? 'Connected' : 'No Data'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ─── REAL-TIME SCREEN DATA (Firebase) ─── */}
                    {Object.keys(liveApps).length > 0 && (
                        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
                            className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                        <FiMonitor className="text-2xl text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black">Live Screen Activity</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Firebase Real-Time</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Live</span>
                                    </div>
                                    <span className="text-2xl font-black text-white">{liveTotal}<span className="text-xs text-slate-500 ml-1">min</span></span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(liveApps).slice(0, 8).map(([name, mins]) => (
                                    <div key={name} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-emerald-500/20 transition-all">
                                        <p className="text-sm font-black text-white truncate">{name}</p>
                                        <p className="text-lg font-black text-emerald-400">{mins}<span className="text-[10px] text-slate-500 ml-1">min</span></p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ─── CHILD STATE + CONFLICT RISK ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Child State Card */}
                        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                            className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                                    <FiActivity className="text-2xl text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black">Child's Current State</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Multi-System Analysis</p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">{childState.summary}</p>
                            <div className="flex flex-wrap gap-3">
                                <span className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-sm font-bold text-violet-300 flex items-center gap-2">
                                    {getBehaviorIcon(childState.behavior_type)} {childState.behavior_type}
                                </span>
                                <span className="px-4 py-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl text-sm font-bold text-fuchsia-300 flex items-center gap-2">
                                    {getEmotionIcon(childState.emotional_condition)} {childState.emotional_condition}
                                </span>
                            </div>
                        </motion.div>

                        {/* Conflict Risk Card */}
                        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                            className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${riskMeta.bg} opacity-5 blur-[40px] rounded-full`} />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-12 h-12 ${riskMeta.light} rounded-2xl flex items-center justify-center`}>
                                        <FiAlertTriangle className={`text-2xl ${riskMeta.text}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black">Conflict Risk</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Predictive Score</p>
                                    </div>
                                </div>
                                <div className="flex items-end gap-4 mb-4">
                                    <span className={`text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r ${riskMeta.bg}`}>{conflict.score}</span>
                                    <span className={`text-sm font-black uppercase tracking-widest ${riskMeta.text} mb-2`}>{conflict.level}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${conflict.score}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`h-full bg-gradient-to-r ${riskMeta.bg} rounded-full`} />
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed">{conflict.reason}</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* ─── SIMULATIONS ─── */}
                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                        className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                                <FiTrendingUp className="text-2xl text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black">Action Simulations</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Predicted Outcomes</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {simTabs.map(tab => (
                                <button key={tab.key} onClick={() => setActiveSimTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${activeSimTab === tab.key
                                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                                    }`}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Active Sim Content */}
                        <AnimatePresence mode="wait">
                            {sims[activeSimTab] && (
                                <motion.div key={activeSimTab}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`w-3 h-3 rounded-full mt-1.5 ${getRiskColor(sims[activeSimTab].conflict_level).dot}`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-200 mb-1">Predicted Reaction</p>
                                            <p className="text-slate-400 text-sm leading-relaxed">{sims[activeSimTab].reaction}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conflict Level:</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${getRiskColor(sims[activeSimTab].conflict_level).light} ${getRiskColor(sims[activeSimTab].conflict_level).text} border ${getRiskColor(sims[activeSimTab].conflict_level).border}`}>
                                            {sims[activeSimTab].conflict_level}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ─── BEST STRATEGY + GUIDANCE ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Best Strategy */}
                        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-violet-900/30 to-fuchsia-900/20 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-violet-500/10 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-violet-500/20 rounded-2xl flex items-center justify-center">
                                    <FiTarget className="text-2xl text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black">Best Strategy</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/60">AI Recommended</p>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-4">
                                <p className="text-lg font-black text-violet-300 mb-2">{strategy.recommended_action}</p>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{strategy.why}</p>
                        </motion.div>

                        {/* Parent Guidance */}
                        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                            className="bg-gradient-to-br from-emerald-900/30 to-teal-900/20 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-emerald-500/10 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                                    <FiHeart className="text-2xl text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black">Parent Guidance</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">What To Do Now</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-2">Say This</p>
                                    <p className="text-emerald-200 text-sm font-bold italic">"{guidance.what_to_say}"</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Tone</p>
                                        <p className="text-sm font-bold text-slate-200">{guidance.tone}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Timing</p>
                                        <p className="text-sm font-bold text-slate-200">{guidance.timing}</p>
                                    </div>
                                </div>
                                <div className="bg-rose-500/5 rounded-xl p-3 border border-rose-500/10">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-400/60 mb-1">⚠️ Avoid Saying</p>
                                    <p className="text-sm text-rose-300/80">{guidance.avoid}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ─── CONFIDENCE FOOTER ─── */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                        className="bg-slate-900/30 backdrop-blur-xl rounded-2xl p-5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <FiShield className="text-violet-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">AI Confidence Score</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-48 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${confidenceScore}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                            </div>
                            <span className="text-lg font-black text-white">{confidenceScore}%</span>
                            {data.saved && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    <FiCheckCircle size={12} /> Saved
                                </span>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>

            <footer className="py-12 border-t border-white/5 opacity-50">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    <p>© 2024 ParentKid-Connect Intelligence</p>
                    <p>Harmony AI Decision Engine</p>
                </div>
            </footer>
        </div>
    );
};

export default HarmonyAIPage;

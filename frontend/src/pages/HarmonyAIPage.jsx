import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowLeft, FiAlertTriangle, FiCheckCircle, FiActivity,
    FiShield, FiZap, FiRefreshCw, FiMessageCircle, FiPhone,
    FiEyeOff, FiTarget, FiHeart, FiClock, FiTrendingUp
} from 'react-icons/fi';

const HarmonyAIPage = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [activeSimTab, setActiveSimTab] = useState('calm_talk');

    useEffect(() => { fetchAnalysis(); }, [childId]);

    const fetchAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/insights/harmony-ai/', { params: { child_id: childId } });
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate analysis');
        } finally {
            setLoading(false);
        }
    };

    const refresh = async () => {
        setAnalyzing(true);
        try {
            const res = await api.get('/insights/harmony-ai/', { params: { child_id: childId } });
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Refresh failed');
        } finally {
            setAnalyzing(false);
        }
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
                <h2 className="text-2xl font-black text-white mb-2">Harmony AI Analyzing...</h2>
                <p className="text-slate-400 max-w-xs">Combining screen behavior, voice emotions, assessments & relationship data into one unified intelligence report.</p>
            </div>
        );
    }

    if (error) {
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
                        <button onClick={fetchAnalysis} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all">Retry</button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!data) return null;

    const conflict = data.conflict_prediction || {};
    const childState = data.child_state || {};
    const sims = data.simulations || {};
    const strategy = data.best_strategy || {};
    const guidance = data.parent_guidance || {};
    const riskMeta = getRiskColor(conflict.level);
    const confidenceScore = data.confidence_score || 0;

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

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={refresh} disabled={analyzing}
                            className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black transition-all shadow-lg flex items-center gap-3 text-xs uppercase tracking-widest">
                            <FiRefreshCw className={`text-lg ${analyzing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"}`} />
                            {analyzing ? "Analyzing..." : "Refresh"}
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* ─── MAIN CONTENT ─── */}
            <main className="max-w-6xl mx-auto px-6 -mt-6 pb-32 relative z-20">
                <div className="space-y-8">

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

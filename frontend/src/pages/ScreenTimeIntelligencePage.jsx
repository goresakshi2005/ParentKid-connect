import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiArrowLeft, 
    FiClock, 
    FiAlertTriangle, 
    FiCheckCircle, 
    FiActivity, 
    FiSmartphone, 
    FiTrendingUp, 
    FiShield, 
    FiZap,
    FiRefreshCw,
    FiInfo,
    FiChevronRight
} from 'react-icons/fi';

const ScreenTimeIntelligencePage = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    
    // States
    const [loading, setLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [realTimeData, setRealTimeData] = useState(null);
    const [childInfo, setChildInfo] = useState(null);
    const [error, setError] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [childId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const childRes = await api.get(`/children/${childId}/`);
            const currentChild = childRes.data;
            
            if (!currentChild) throw new Error("Child info could not be retrieved");
            setChildInfo(currentChild);

            await runAnalysis();

            const firebaseId = currentChild.email || currentChild.firebase_id;
            
            if (firebaseId) {
                const docRef = doc(db, "screen_time", firebaseId);
                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setRealTimeData(docSnap.data());
                    }
                }, (err) => {
                    console.error("Firestore listener failed:", err);
                });
                
                setLoading(false);
                return () => unsubscribe();
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Error loading data:', err);
            setError(err.message || 'Failed to load screen intelligence');
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const response = await api.get(`/screen-monitor/screen-intelligence`, {
                params: { child_id: childId }
            });
            setAiAnalysis(response.data);
            setIsAnalyzing(false);
        } catch (err) {
            console.error('AI Analysis failed:', err);
            setIsAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                    className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6"
                >
                    <FiZap className="text-4xl text-indigo-500 animate-pulse" />
                </motion.div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Syncing Intelligence...</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">Establishing a secure, real-time link with the device monitoring system.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 flex flex-col items-center justify-center">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-red-100 dark:border-red-900/20"
                >
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiAlertTriangle className="text-4xl text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">Sync Interrupted</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">{error}</p>
                    <button onClick={() => navigate(-1)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">Return to Safety</button>
                </motion.div>
            </div>
        );
    }

    const calculateTotal = (appsMap) => {
        if (!appsMap) return 0;
        return Object.values(appsMap).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
    };

    const { apps_usage, overall, alert, original_usage } = aiAnalysis || {};
    const liveTotalTime = realTimeData?.apps 
        ? calculateTotal(realTimeData.apps) 
        : (original_usage ? calculateTotal(original_usage) : (aiAnalysis?.total_screen_time || 0));
    const liveApps = realTimeData?.apps || original_usage || {};

    const getRiskColors = (level) => {
        switch (level?.toLowerCase()) {
            case 'low': return { 
                bg: 'from-emerald-500 to-teal-600', 
                text: 'text-emerald-500', 
                light: 'bg-emerald-50 dark:bg-emerald-500/10',
                border: 'border-emerald-100 dark:border-emerald-500/20'
            };
            case 'medium': return { 
                bg: 'from-amber-500 to-orange-600', 
                text: 'text-amber-500', 
                light: 'bg-amber-50 dark:bg-amber-500/10',
                border: 'border-amber-100 dark:border-amber-500/20'
            };
            case 'high': return { 
                bg: 'from-rose-500 to-pink-600', 
                text: 'text-rose-500', 
                light: 'bg-rose-50 dark:bg-rose-500/10',
                border: 'border-rose-100 dark:border-rose-500/20'
            };
            default: return { 
                bg: 'from-indigo-600 to-violet-700', 
                text: 'text-indigo-500', 
                light: 'bg-indigo-50 dark:bg-indigo-500/10',
                border: 'border-indigo-100 dark:border-indigo-500/20'
            };
        }
    };

    const riskMeta = getRiskColors(overall?.risk_level);

    const AppCard = ({ name, mins, aiInfo }) => {
        const percentage = Math.min((mins / 120) * 100, 100); 
        const statusColors = getRiskColors(aiInfo?.status || (mins > 60 ? 'medium' : 'low'));

        return (
            <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="group relative overflow-hidden"
            >
                <div className="p-6 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all cursor-default">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex items-center gap-5 flex-1">
                            <div className={`w-16 h-16 ${statusColors.light} rounded-[1.5rem] flex items-center justify-center text-2xl font-black ${statusColors.text} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                {name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{name}</h4>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{mins}m</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full bg-gradient-to-r ${statusColors.bg}`}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{aiInfo?.category || 'Utility'}</span>
                                    {aiInfo?.usage_level && (
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${statusColors.light} ${statusColors.text}`}>
                                            {aiInfo.usage_level}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {aiInfo?.insight && (
                            <div className="md:w-72 bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:border-indigo-100 dark:group-hover:border-white/10 transition-all">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">
                                    {aiInfo.insight}
                                </p>
                                {aiInfo.suggestion && (
                                    <div className="mt-2 flex items-start gap-2 text-indigo-500 dark:text-indigo-400">
                                        <FiZap className="shrink-0 mt-0.5" size={12} />
                                        <p className="text-[11px] font-black uppercase tracking-tight">{aiInfo.suggestion}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white font-sans overflow-x-hidden">
            <header className={`relative bg-[#050a1f] overflow-hidden py-12 px-6`}>
                {/* Background Intelligence - Animated Mesh & Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className={`absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-gradient-to-br ${riskMeta.bg} opacity-10 blur-[80px] rounded-full`}
                    />
                    {/* Grid Pattern Overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                </div>

                <div className="max-w-6xl mx-auto w-full relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <motion.button 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            onClick={() => navigate(-1)} 
                            className="bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl transition-all backdrop-blur-xl border border-white/10 group shadow-lg"
                        >
                            <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </motion.button>
                        
                        <motion.div 
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-4 py-2 rounded-xl border border-white/10 shadow-lg"
                        >
                            <div className="relative w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">Sync Active</span>
                        </motion.div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-6 h-[1.5px] bg-indigo-500"></span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Intelligence Report</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-none tracking-tight mb-6 group whitespace-nowrap">
                                    {childInfo?.name.split(' ')[0]}'s <span className={`bg-clip-text text-transparent bg-gradient-to-r ${riskMeta.bg} opacity-90`}>Digital Intelligence</span>
                                </h1>
                            </motion.div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="bg-white/5 backdrop-blur-3xl border border-white/10 p-3 px-4 rounded-2xl flex items-center gap-4 shadow-lg"
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${riskMeta.bg} flex items-center justify-center shadow-md`}>
                                    <FiClock className="text-xl text-white" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-0.5">Total Usage</p>
                                    <p className="text-xl font-black text-white leading-none tracking-tighter">{liveTotalTime}<span className="text-xs text-white/30 ml-0.5">min</span></p>
                                </div>
                            </motion.div>

                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={runAnalysis}
                                disabled={isAnalyzing}
                                className="bg-white text-indigo-950 px-6 py-3 rounded-2xl font-black transition-all shadow-lg flex items-center gap-3 group text-xs uppercase tracking-widest"
                            >
                                <FiRefreshCw className={`text-lg ${isAnalyzing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"}`} />
                                {isAnalyzing ? "Scanning..." : "Refresh Intelligence"}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 -mt-10 pb-32 relative z-20">
                <AnimatePresence mode="wait">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-12 space-y-8">
                            {alert?.show && (
                                <motion.div 
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border-l-[16px] border-rose-500 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-8 text-rose-500/5 group-hover:text-rose-500/10 transition-colors">
                                        <FiAlertTriangle size={120} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-rose-500 text-white rounded-xl">
                                                <FiAlertTriangle size={20} />
                                            </div>
                                            <h3 className="text-rose-600 dark:text-rose-400 font-black text-xl uppercase tracking-tighter">Immediate Attention Required</h3>
                                        </div>
                                        <p className="text-slate-800 dark:text-slate-200 text-2xl font-black leading-tight mb-4">
                                            {alert.message}
                                        </p>
                                        {aiAnalysis?.parent_action && (
                                            <div className="flex flex-wrap gap-2">
                                                {aiAnalysis.parent_action.split('.').filter(s => s.trim()).map((action, i) => (
                                                    <span key={i} className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-rose-500/20">
                                                        {action.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            <motion.div 
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white dark:bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white dark:border-white/5 overflow-hidden"
                            >
                                <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                            <FiActivity className="text-3xl text-indigo-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Real-Time Activity</h2>
                                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Across all devices</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {Object.keys(liveApps).length > 0 ? (
                                        Object.entries(liveApps).map(([name, mins], idx) => {
                                            const aiInfo = apps_usage?.find(a => 
                                                a.app_name.toLowerCase().includes(name.toLowerCase()) || 
                                                name.toLowerCase().includes(a.app_name.toLowerCase())
                                            );

                                            return <AppCard key={idx} name={name} mins={mins} aiInfo={aiInfo} />;
                                        })
                                    ) : (
                                        <div className="p-20 text-center">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                                                <FiZap size={40} className="text-slate-400" />
                                            </div>
                                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">No live data detected</p>
                                            <p className="text-slate-500 text-xs mt-2">Waiting for the next sync burst...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50 dark:bg-white/5 p-6 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-center gap-2">
                                        <FiShield className="text-indigo-400" /> Secure Monitoring Active
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </AnimatePresence>
            </main>

            <footer className="py-12 border-t border-slate-200 dark:border-white/5 opacity-50">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    <p>© 2024 ParentKid-Connect Intelligence</p>
                    <p>Proprietary Risk Analysis Hub</p>
                </div>
            </footer>
        </div>
    );
};

export default ScreenTimeIntelligencePage;

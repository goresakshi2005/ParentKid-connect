import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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
    FiRefreshCw
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
            // 1. Fetch specific child info by ID directly
            const childRes = await api.get(`/children/${childId}/`);
            const currentChild = childRes.data;
            
            if (!currentChild) throw new Error("Child info could not be retrieved");
            setChildInfo(currentChild);

            // 2. Fetch AI Analysis from backend
            await runAnalysis();

            // 3. Setup Firestore Listener (Prefer Email, fallback to firebase_id)
            const firebaseId = currentChild.email || currentChild.firebase_id;
            
            if (firebaseId) {
                console.log(`Setting up real-time sync for: ${firebaseId}`);
                const docRef = doc(db, "screen_time", firebaseId);
                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log("Firebase data received:", data);
                        setRealTimeData(data);
                    } else {
                        console.warn("Firebase document does not exist for ID:", firebaseId);
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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Connecting to Intelligence Hub...</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Setting up real-time Firebase sync.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100 dark:border-red-900/30">
                    <FiAlertTriangle className="text-6xl text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Setup Required</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                    <button onClick={() => navigate(-1)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Go Back</button>
                </div>
            </div>
        );
    }

    // Helper to calculate total from apps map
    const calculateTotal = (appsMap) => {
        if (!appsMap) return 0;
        return Object.values(appsMap).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
    };

    const { child_name, total_screen_time, apps_usage, top_app, overall, alert, parent_action, original_usage } = aiAnalysis || {};

    // SOURCE OF TRUTH: Prefer real-time Firebase, fallback to original backend usage, last resort AI total
    const liveTotalTime = realTimeData?.apps 
        ? calculateTotal(realTimeData.apps) 
        : (original_usage ? calculateTotal(original_usage) : (total_screen_time || 0));
    
    // Live Map: Combine Firebase live apps with backend fallback
    const liveApps = realTimeData?.apps || original_usage || {};

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'good': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
            case 'warning': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20';
            case 'risk': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    const AppItem = ({ app, liveTime }) => (
        <div className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                        {app.app_name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xl font-black text-slate-800 dark:text-white">{app.app_name}</h4>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black text-slate-400 uppercase tracking-tighter">{app.category}</span>
                        </div>
                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            {liveTime} mins
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(app.status)}`}>
                                {app.usage_level}
                            </span>
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-1 md:text-right max-w-sm">
                    {app.insight && <p className="text-slate-800 dark:text-white font-bold leading-tight">{app.insight}</p>}
                    {app.suggestion && <p className="text-slate-400 text-xs font-medium italic mt-1 shrink-0 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-lg">💡 {app.suggestion}</p>}
                </div>
            </div>
        </div>
    );

    const getRiskBg = (level) => {
        switch (level?.toLowerCase()) {
            case 'low': return 'from-emerald-500 to-teal-600';
            case 'medium': return 'from-amber-500 to-orange-600';
            case 'high': return 'from-rose-500 to-pink-600';
            default: return 'from-indigo-500 to-purple-600';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500">
            {/* Header */}
            <header className={`bg-gradient-to-r ${getRiskBg(overall?.risk_level)} p-6 pb-24 text-white relative`}>
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-md">
                    <FiArrowLeft size={24} />
                </button>
                
                <div className="max-w-4xl mx-auto text-center mt-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                        <p className="uppercase tracking-widest text-indigo-100 text-xs font-bold opacity-80">Real-time Intelligence Active</p>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-2">{childInfo?.name}'s Live Usage</h1>
                    <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
                            <FiClock className="text-yellow-300" />
                            <span className="font-bold">{liveTotalTime} Minutes Today</span>
                        </div>
                        <button 
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                            className="flex items-center gap-2 bg-white text-indigo-900 px-4 py-2 rounded-full font-bold hover:bg-indigo-50 transition-all shadow-lg text-sm"
                        >
                            <FiRefreshCw className={isAnalyzing ? "animate-spin" : ""} />
                            {isAnalyzing ? "Analyzing..." : "Refresh Intelligence"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 -mt-16 pb-20 relative z-10">
                {/* Real-time Status Banner */}
                {realTimeData && (
                    <div className="bg-indigo-600 text-white p-3 rounded-full text-center shadow-lg mb-6 border-b-4 border-indigo-800 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                        <FiZap /> Data is syncing live from {childInfo?.name}'s device
                    </div>
                )}

                {/* AI Insights Section */}
                {aiAnalysis && (
                    <>
                        {alert?.show && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border-l-[12px] border-rose-500 flex items-start gap-5 mb-8 transform hover:scale-[1.01] transition-transform">
                                <div className="p-4 bg-rose-100 dark:bg-rose-500/20 rounded-2xl">
                                    <FiAlertTriangle className="text-3xl text-rose-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-rose-600 dark:text-rose-400 font-black text-xl mb-1 uppercase tracking-tight">AI Warning</h3>
                                    <p className="text-slate-700 dark:text-slate-300 text-lg font-medium leading-tight">{alert.message}</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Live App Breakdown */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-white dark:border-slate-800 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-2xl">
                                <FiActivity className="text-2xl text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Live App List</h2>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {Object.keys(liveApps).length > 0 ? (
                            Object.entries(liveApps).map(([name, mins], idx) => {
                                // Find AI insight for this app if it exists
                                const aiInfo = apps_usage?.find(a => 
                                    a.app_name === name || 
                                    a.app_name === name.replace(/\s+/g, '')
                                );

                                return (
                                    <AppItem 
                                        key={idx} 
                                        app={{
                                            app_name: name,
                                            category: aiInfo?.category || 'Syncing...',
                                            usage_level: aiInfo?.usage_level || (mins > 60 ? 'high' : 'moderate'),
                                            insight: aiInfo?.insight || '',
                                            suggestion: aiInfo?.suggestion || '',
                                            status: aiInfo?.status || 'Good'
                                        }} 
                                        liveTime={mins} 
                                    />
                                );
                            })
                        ) : (
                            <div className="p-10 text-center text-slate-400 font-bold">
                                {isAnalyzing ? "Analyzing Firebase data..." : "No live data detected yet."}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-center opacity-40">
                    <FiShield className="text-4xl text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Live Parental Shield Active</p>
                </div>
            </main>
        </div>
    );
};

export default ScreenTimeIntelligencePage;

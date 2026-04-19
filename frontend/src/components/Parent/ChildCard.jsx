import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressTracking from './ProgressTracking';
import { 
    FiUser, 
    FiCalendar, 
    FiBarChart2, 
    FiClipboard, 
    FiZap, 
    FiActivity, 
    FiShield, 
    FiCommand,
    FiSmartphone
} from 'react-icons/fi';

function ChildCard({ child, onTakeAssessment }) {
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    const getStageLabel = (stage) => {
        const stages = {
            pregnancy: 'Pregnancy',
            early_childhood: 'Childhood (0-5)',
            growing_stage: 'Growing (6-12)',
            teen_age: 'Teen (13-20)'
        };
        return stages[stage] || stage;
    };

    const isGrowingOrTeen = child.stage === 'growing_stage' || child.stage === 'teen_age';
    const isEarlyChildhood = child.stage === 'early_childhood';

    return (
        <div className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-indigo-500/20 border border-gray-100 dark:border-slate-800 hover:-translate-y-2">
            {/* Glossy Header */}
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="p-4 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <FiUser className="text-indigo-600 dark:text-indigo-400 text-3xl" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">
                                {child.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-200 dark:border-indigo-800">
                                    {getStageLabel(child.stage)}
                                </span>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                    Age {child.age}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-6">
                {/* Core Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onTakeAssessment(child.id)}
                        className="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 font-black shadow-lg transition-all flex items-center justify-center gap-2 text-sm group/btn"
                    >
                        <FiClipboard className="group-hover/btn:rotate-12 transition-transform" /> Assessment
                    </button>
                    <button
                        onClick={() => setShowResults(!showResults)}
                        className="px-4 py-3 border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <FiBarChart2 /> {showResults ? 'Hide' : 'Results'}
                    </button>
                </div>

                {/* Intelligence Suite Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <FiActivity className="text-rose-500 text-xs" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">AI Intelligence Suite</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {isEarlyChildhood && (
                            <button
                                onClick={() => navigate(`/early-childhood/${child.id}`)}
                                className="w-full px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-[1.5rem] hover:shadow-emerald-500/40 hover:scale-[1.02] font-black shadow-lg transition-all flex items-center justify-between group/action"
                            >
                                <span className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg"><FiActivity className="text-white" /></div>
                                    Growth Tracking
                                </span>
                                <FiZap className="text-yellow-300 animate-pulse" />
                            </button>
                        )}

                        {isGrowingOrTeen && (
                            <>
                                <button
                                    onClick={() => navigate(`/relationship-intelligence/${child.id}`)}
                                    className="w-full px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.5rem] hover:shadow-indigo-500/40 hover:scale-[1.02] font-black shadow-lg transition-all flex items-center justify-between group/action border-b-4 border-indigo-800"
                                >
                                    <span className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg"><FiShield className="text-white" /></div>
                                        Relationship AI
                                    </span>
                                    <FiZap className="text-yellow-400" />
                                </button>

                                <button
                                    onClick={() => navigate(`/magic-fix/${child.id}`)}
                                    className="w-full px-5 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-[1.5rem] hover:shadow-pink-500/40 hover:scale-[1.02] font-black shadow-lg transition-all flex items-center justify-between group/action border-b-4 border-rose-800"
                                >
                                    <span className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg"><FiCommand className="text-white" /></div>
                                        Magic Fix Engine
                                    </span>
                                    <FiZap className="text-white opacity-80" />
                                </button>

                                <button
                                    onClick={() => navigate(`/screen-intelligence/${child.id}`)}
                                    className="w-full px-5 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-[1.5rem] hover:shadow-emerald-500/40 hover:scale-[1.02] font-black shadow-lg transition-all flex items-center justify-between group/action border-b-4 border-emerald-800"
                                >
                                    <span className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg"><FiSmartphone className="text-white" /></div>
                                        Screen Intelligence
                                    </span>
                                    <FiBarChart2 className="text-white opacity-80" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Expandable Progress Area */}
                {showResults && (
                    <div className="mt-4 pt-4 border-t-2 border-slate-50 dark:border-slate-800/50 animate-in slide-up duration-500">
                        <ProgressTracking childId={child.id} child={child} />
                    </div>
                )}
            </div>
            
            {/* Footer Status */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <FiCalendar className="text-[8px]" /> SINCE {new Date(child.created_at).toLocaleDateString().toUpperCase()}
                </p>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Synced</span>
                </div>
            </div>
        </div>
    );
}

export default ChildCard;
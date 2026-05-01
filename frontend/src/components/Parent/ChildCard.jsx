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
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => onTakeAssessment(child.id)}
                        className="relative px-4 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-600 dark:to-violet-600 text-white rounded-[1.25rem] font-black shadow-[0_8px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_20px_rgba(99,102,241,0.3)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 text-sm group/btn overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 dark:bg-white/20 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300"></div>
                        <FiClipboard className="group-hover/btn:rotate-12 transition-transform relative z-10" /> 
                        <span className="relative z-10">Assessment</span>
                    </button>
                    <button
                        onClick={() => setShowResults(!showResults)}
                        className="relative px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[1.25rem] font-black shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 hover:-translate-y-1 flex items-center justify-center gap-2 text-sm group/btn2 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-700/50 -translate-y-full group-hover/btn2:translate-y-0 transition-transform duration-300"></div>
                        <FiBarChart2 className="relative z-10" /> 
                        <span className="relative z-10">{showResults ? 'Hide' : 'Results'}</span>
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
                                className="relative w-full p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border border-white/80 dark:border-white/10 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group/action flex items-center justify-between hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl group-hover:bg-emerald-400/40 transition-colors pointer-events-none"></div>
                                <span className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-emerald-500 group-hover:scale-110 transition-transform border border-gray-100 dark:border-slate-800">
                                        <FiActivity className="text-xl" />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 tracking-wide">Growth Tracking</span>
                                </span>
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center relative z-10 border border-gray-200 dark:border-slate-700 group-hover:border-emerald-400/50 transition-colors shadow-sm">
                                    <FiZap className="text-emerald-500 text-sm animate-pulse" />
                                </div>
                            </button>
                        )}

                        {isGrowingOrTeen && (
                            <>
                                <button
                                    onClick={() => navigate(`/relationship-intelligence/${child.id}`)}
                                    className="relative w-full p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border border-white/80 dark:border-white/10 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group/action flex items-center justify-between hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl group-hover:bg-indigo-400/40 transition-colors pointer-events-none"></div>
                                    <span className="flex items-center gap-4 relative z-10">
                                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform border border-gray-100 dark:border-slate-800">
                                            <FiShield className="text-xl" />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 tracking-wide">Relationship AI</span>
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center relative z-10 border border-gray-200 dark:border-slate-700 group-hover:border-indigo-400/50 transition-colors shadow-sm">
                                        <FiZap className="text-indigo-500 text-sm" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate(`/magic-fix/${child.id}`)}
                                    className="relative w-full p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border border-white/80 dark:border-white/10 shadow-sm hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 group/action flex items-center justify-between hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/20 rounded-full blur-3xl group-hover:bg-rose-400/40 transition-colors pointer-events-none"></div>
                                    <span className="flex items-center gap-4 relative z-10">
                                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-rose-500 group-hover:scale-110 transition-transform border border-gray-100 dark:border-slate-800">
                                            <FiCommand className="text-xl" />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 tracking-wide">Magic Fix Engine</span>
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center relative z-10 border border-gray-200 dark:border-slate-700 group-hover:border-rose-400/50 transition-colors shadow-sm">
                                        <FiZap className="text-rose-500 text-sm" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate(`/screen-intelligence/${child.id}`)}
                                    className="relative w-full p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border border-white/80 dark:border-white/10 shadow-sm hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 group/action flex items-center justify-between hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl group-hover:bg-cyan-400/40 transition-colors pointer-events-none"></div>
                                    <span className="flex items-center gap-4 relative z-10">
                                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-cyan-500 group-hover:scale-110 transition-transform border border-gray-100 dark:border-slate-800">
                                            <FiSmartphone className="text-xl" />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 tracking-wide">Screen Intelligence</span>
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center relative z-10 border border-gray-200 dark:border-slate-700 group-hover:border-cyan-400/50 transition-colors shadow-sm">
                                        <FiBarChart2 className="text-cyan-500 text-sm" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate(`/harmony-ai/${child.id}`)}
                                    className="relative w-full p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border border-white/80 dark:border-white/10 shadow-sm hover:shadow-lg hover:shadow-fuchsia-500/10 transition-all duration-300 group/action flex items-center justify-between hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-400/20 rounded-full blur-3xl group-hover:bg-fuchsia-400/40 transition-colors pointer-events-none"></div>
                                    <span className="flex items-center gap-4 relative z-10">
                                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-fuchsia-500 group-hover:scale-110 transition-transform border border-gray-100 dark:border-slate-800">
                                            <FiActivity className="text-xl" />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 tracking-wide">Harmony AI</span>
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center relative z-10 border border-gray-200 dark:border-slate-700 group-hover:border-fuchsia-400/50 transition-colors shadow-sm">
                                        <FiZap className="text-fuchsia-500 text-sm animate-pulse" />
                                    </div>
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
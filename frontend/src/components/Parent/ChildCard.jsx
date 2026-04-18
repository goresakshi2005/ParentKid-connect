import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressTracking from './ProgressTracking';
import { FiUser, FiCalendar, FiBarChart2, FiClipboard, FiZap } from 'react-icons/fi';

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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100 dark:border-slate-800">
            <div className="p-5 bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-pink-500/20 rounded-full">
                            <FiUser className="text-blue-600 dark:text-pink-500 text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold dark:text-white">{child.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {getStageLabel(child.stage)} • Age {child.age}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                            <FiCalendar /> Joined {new Date(child.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onTakeAssessment(child.id)}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        <FiClipboard /> Assessment
                    </button>
                    <button
                        onClick={() => setShowResults(!showResults)}
                        className="px-4 py-2.5 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 dark:border-pink-500 dark:text-pink-400 dark:hover:bg-pink-500/10 font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <FiBarChart2 /> {showResults ? 'Hide' : 'Results'}
                    </button>
                    {isEarlyChildhood && (
                        <button
                            onClick={() => navigate(`/early-childhood/${child.id}`)}
                            className="col-span-2 px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-1"
                        >
                            <FiZap className="text-yellow-300" /> Early Childhood Tracking
                        </button>
                    )}

                    {/* Relationship Intelligence AI - The interactive AI Analysis */}
                    {isGrowingOrTeen && (
                        <div className="col-span-2 flex flex-col gap-2 mt-1">
                            <button
                                onClick={() => navigate(`/relationship-intelligence/${child.id}`)}
                                className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <FiZap className="text-yellow-400" /> Relationship Intelligence AI
                            </button>
                            <button
                                onClick={() => navigate(`/magic-fix/${child.id}`)}
                                className="px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                🪄 Magic Fix Engine
                            </button>
                        </div>
                    )}
                </div>

                {showResults && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <ProgressTracking childId={child.id} child={child} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChildCard;
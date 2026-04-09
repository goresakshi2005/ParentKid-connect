// frontend/src/components/Parent/ChildCard.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressTracking from './ProgressTracking';
import { FiUser, FiCalendar, FiBarChart2, FiClipboard, FiHeart } from 'react-icons/fi';

function ChildCard({ child, onTakeAssessment }) {
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    const getStageLabel = (stage) => {
        const stages = {
            pregnancy: 'Pregnancy',
            early_childhood: 'Early Childhood (0-5)',
            growing_stage: 'Growing (6-12)',
            teen_age: 'Teen (13-20)'
        };
        return stages[stage] || stage;
    };

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
                <div className="flex gap-3">
                    <button
                        onClick={() => onTakeAssessment(child.id)}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        <FiClipboard /> Take Assessment
                    </button>
                    <button
                        onClick={() => setShowResults(!showResults)}
                        className="flex-1 px-4 py-2.5 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 dark:border-pink-500 dark:text-pink-400 dark:hover:bg-pink-500/10 font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <FiBarChart2 /> {showResults ? 'Hide Results' : 'View Results'}
                    </button>
                </div>

                {child.stage === 'growing_stage' && (
                    <button
                        onClick={() => navigate(`/relationship-intelligence?child_id=${child.id}`)}
                        className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-xl hover:from-pink-600 hover:to-violet-700 font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <FiHeart /> View Relationship Intelligence
                    </button>
                )}
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
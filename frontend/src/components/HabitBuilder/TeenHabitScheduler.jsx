import React, { useState, useEffect } from 'react';
import { getHabits, completeHabit, approveOrModifyHabit } from '../../services/habitService';
import { hasFeature, getRequiredPlan } from '../../utils/featureAccess';
import UpgradeModal from '../Pricing/UpgradeModal';
import './HabitBuilder.css';

const TeenHabitScheduler = ({ user, onFeatureLock }) => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingApproval, setPendingApproval] = useState([]);
    const [showModal, setShowModal] = useState(null);
    const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', plan: '' });

    const fetchHabits = async () => {
        setLoading(true);
        try {
            const res = await getHabits();
            const all = res.data.results || res.data || [];
            const active = all.filter(h => h.approval_status === 'approved' && h.is_active);
            const pending = all.filter(h => h.approval_status === 'pending' && h.created_by === 'parent');
            setHabits(active);
            setPendingApproval(pending);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHabits(); }, []);

    const handleComplete = async (habitId) => {
        try {
            await completeHabit(habitId);
            fetchHabits();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to mark as complete.');
        }
    };

    const handleApproval = async (habitId, status, feedback, adjustedTitle, adjustedDuration) => {
        try {
            await approveOrModifyHabit(habitId, status, feedback, adjustedTitle, adjustedDuration);
            fetchHabits();
            setShowModal(null);
        } catch (err) {
            alert('Failed to process approval.');
        }
    };

    if (loading) return <div className="text-center py-8">Loading your schedule...</div>;

    const hasAccess = hasFeature(user, 'habit_builder');
    if (!hasAccess) {
        return (
            <div className="relative">
                <div className="blur-sm pointer-events-none">
                    <HabitPreviewSkeleton />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
                    <button
                        onClick={() => setUpgradeModal({ isOpen: true, feature: 'Habit Builder', plan: getRequiredPlan('habit_builder') })}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold"
                    >
                        Unlock Habit Builder
                    </button>
                </div>
                <UpgradeModal
                    isOpen={upgradeModal.isOpen}
                    onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                    featureName={upgradeModal.feature}
                    requiredPlan={upgradeModal.plan}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 hb-container">
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                <span className="text-3xl drop-shadow-lg animate-bounce" style={{animationDuration: '3s'}}>📋</span> 
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 font-extrabold tracking-tight">
                    My Daily Habits
                </span>
            </h2>

            {pendingApproval.length > 0 && (
                <div className="mb-6 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm uppercase tracking-wider mb-2 ml-1">
                        <span className="text-pink-500">⏳</span> Awaiting Decision
                    </h3>
                    <div className="space-y-1">
                        {pendingApproval.map(h => (
                            <div key={h.id} className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 px-3 rounded-xl transition-colors last:border-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{h.title}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            ⏱️ {h.duration_minutes}m
                                        </span>
                                        {h.suggested_time && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                🕒 {h.suggested_time}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(h)} className="shrink-0 text-xs font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30 px-4 py-1.5 rounded-full hover:bg-pink-100 dark:hover:bg-pink-500/20 hover:text-pink-800 dark:hover:text-pink-300 transition-colors shadow-sm">
                                    Review →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {habits.length === 0 ? (
                <p className="text-gray-500">No tasks scheduled yet. Your parent might suggest some habits for you.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {habits.map(h => (
                        <div key={h.id} className="relative bg-white dark:bg-transparent hb-glass rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-white/10 flex flex-col justify-between overflow-hidden group">
                            {/* Decorative glowing orb */}
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 dark:bg-purple-500/20 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-colors duration-500 pointer-events-none"></div>
                            
                            <div className="relative z-10">
                                <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight leading-tight mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-pink-500 transition-all duration-300">
                                    {h.title}
                                </h3>
                                
                                <div className="flex flex-wrap items-center gap-3 mb-5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-purple-300 bg-indigo-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-purple-500/20">
                                        <span className="text-base leading-none">⏱️</span> {h.duration_minutes} min
                                    </div>
                                    {h.suggested_time && (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10 px-3 py-1.5 rounded-xl border border-pink-100 dark:border-pink-500/20">
                                            <span className="text-base leading-none">🕒</span> {h.suggested_time}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="text-xs font-extrabold hb-badge hb-badge-streak px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                                        🔥 Streak: {h.streak}
                                    </span>
                                    <span className="text-xs font-extrabold hb-badge hb-badge-pts px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                                        ⭐ {h.points_earned} pts
                                    </span>
                                </div>
                                <div className="mt-4 inline-block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/50 px-3 py-1 rounded-lg">
                                    {h.stage.replace('_', ' ')}
                                </div>
                            </div>

                            <button
                                onClick={() => handleComplete(h.id)}
                                className="relative z-10 mt-6 w-full py-3.5 hb-btn-glow text-white rounded-xl font-extrabold text-lg tracking-wide hover:shadow-2xl shadow-lg transition-all duration-300 group-hover:scale-[1.02]"
                            >
                                ✓ I Did It
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <ApprovalModal habit={showModal} onClose={() => setShowModal(null)} onApprove={handleApproval} />
            )}
        </div>
    );
};

const ApprovalModal = ({ habit, onClose, onApprove }) => {
    const [feedback, setFeedback] = useState('');
    const [adjustTitle, setAdjustTitle] = useState(habit.title);
    const [adjustDuration, setAdjustDuration] = useState(habit.duration_minutes);
    const [action, setAction] = useState('approve');

    const submit = () => {
        if (action === 'reject') onApprove(habit.id, 'rejected', feedback, '', null);
        else if (action === 'approve') onApprove(habit.id, 'approved', feedback, '', null);
        else if (action === 'modify') onApprove(habit.id, 'modified', feedback, adjustTitle, adjustDuration);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Review Task: <span className="text-indigo-600 dark:text-purple-400">{habit.title}</span></h3>
                <div className="space-y-4 mb-5">
                    <div>
                        <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Your feedback (optional)</label>
                        <textarea className="w-full p-3 border rounded-xl hb-input dark:border-slate-600" rows="2" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Tell your parent what you think..."></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Action</label>
                        <select value={action} onChange={e => setAction(e.target.value)} className="w-full border rounded-xl p-3 hb-input dark:border-slate-600 appearance-none bg-white dark:bg-slate-800 cursor-pointer">
                            <option value="approve">✅ Approve as is</option>
                            <option value="modify">✏️ Modify task</option>
                            <option value="reject">❌ Reject</option>
                        </select>
                    </div>

                    {action === 'modify' && (
                        <div className="space-y-3 mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Title</label>
                                <input type="text" placeholder="Modified title" value={adjustTitle} onChange={e => setAdjustTitle(e.target.value)} className="w-full p-2 border rounded-xl hb-input" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration (min)</label>
                                <input type="number" placeholder="Duration (min)" value={adjustDuration} onChange={e => setAdjustDuration(e.target.value)} className="w-full p-2 border rounded-xl hb-input" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 border rounded-xl font-semibold dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-800 transition bg-gray-100 hover:bg-gray-200 dark:bg-transparent">Cancel</button>
                    <button onClick={submit} className="px-5 py-2 hb-btn-glow text-white rounded-xl font-bold">Submit Decision</button>
                </div>
            </div>
        </div>
    );
};

const HabitPreviewSkeleton = () => (
    <div className="p-4 border rounded-2xl bg-gray-100 dark:bg-slate-800/50 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="h-16 bg-gray-300 rounded mb-3"></div>
        <div className="h-10 bg-gray-400 rounded"></div>
    </div>
);

export default TeenHabitScheduler;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import mentorshipService from '../../services/mentorshipService';
import MentorDashboard from './MentorDashboard';
import ChatWindow from './ChatWindow';
import ChangeMentorModal from './ChangeMentorModal';

const STAGE_META = {
    pregnancy: { label: 'Before Birth', emoji: '🤰', color: 'pink' },
    early_childhood: { label: 'Early Childhood', emoji: '👶', color: 'blue' },
    growing_stage: { label: 'Growing Stage', emoji: '🧒', color: 'green' },
    teen_age: { label: 'Teenager', emoji: '🧑‍🎓', color: 'purple' },
};

export default function MentorChatPage({ stage }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState('');
    const [showChangeMentor, setShowChangeMentor] = useState(false);

    // Check if user is a mentor
    const isMentor = user?.role === 'mentor';

    useEffect(() => {
        loadAssignments();
        // Poll every 10s for new messages
        const interval = setInterval(loadAssignments, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadAssignments = async () => {
        try {
            const res = await mentorshipService.getAssignments();
            const data = res.data;
            setAssignments(data);
            // For non-mentor users, find the assignment for the current stage
            if (!isMentor && stage) {
                const found = data.find(a => a.stage === stage && a.is_active);
                setAssignment(found || null);
            }
        } catch (err) {
            console.error('Failed to load assignments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAssign = async () => {
        setAssigning(true);
        setError('');
        try {
            const res = await mentorshipService.autoAssign(stage);
            setAssignment(res.data);
            await loadAssignments();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to assign a mentor.');
        } finally {
            setAssigning(false);
        }
    };

    const handleMentorChanged = async () => {
        setShowChangeMentor(false);
        setActiveChat(null);
        await loadAssignments();
        // Re-select the new assignment
        const res = await mentorshipService.getAssignments();
        const data = res.data;
        const found = data.find(a => a.stage === stage && a.is_active);
        setAssignment(found || null);
    };

    const meta = STAGE_META[stage] || { label: stage, emoji: '💬', color: 'gray' };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
            </div>
        );
    }

    // If mentor role, show mentor dashboard
    if (isMentor) {
        return (
            <MentorDashboard
                assignments={assignments}
                onSelectChat={setActiveChat}
                activeChat={activeChat}
                onRefresh={loadAssignments}
            />
        );
    }

    // Chat view when chatting
    if (activeChat) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-6">
                <button
                    onClick={() => setActiveChat(null)}
                    className="mb-4 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2 text-sm font-medium"
                >
                    ← Back to Mentor Dashboard
                </button>
                <ChatWindow
                    assignment={activeChat}
                    onClose={() => setActiveChat(null)}
                />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold dark:text-white tracking-tight flex items-center gap-3">
                    <span className="text-4xl">{meta.emoji}</span>
                    Mentor <span className="dark:text-pink-500 text-blue-600">Chat</span>
                </h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">
                    {meta.label} Stage — Private one-to-one guidance
                </p>
            </div>

            {/* Assignment Card */}
            {assignment ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-black/30 border dark:border-slate-800 overflow-hidden">
                    {/* Mentor info header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-pink-600 dark:to-purple-700 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold text-white">
                                    {assignment.mentor_detail?.user?.first_name?.charAt(0) || 'M'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {assignment.mentor_detail?.user?.first_name} {assignment.mentor_detail?.user?.last_name}
                                    </h2>
                                    <p className="text-white/80 text-sm">
                                        {assignment.mentor_detail?.specialization_display}
                                    </p>
                                    <p className="text-white/60 text-xs mt-1">
                                        Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowChangeMentor(true)}
                                className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-white text-sm hover:bg-white/30 transition font-medium"
                            >
                                Change Mentor
                            </button>
                        </div>
                    </div>

                    {/* Mentor bio */}
                    <div className="p-6">
                        {assignment.mentor_detail?.bio && (
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-6 italic">
                                "{assignment.mentor_detail.bio}"
                            </p>
                        )}

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-slate-800">
                                <p className="text-2xl font-bold text-blue-600 dark:text-pink-400">
                                    {assignment.unread_count || 0}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Unread</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-slate-800">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {assignment.last_message ? '✓' : '—'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {assignment.last_message ? 'Active' : 'No msgs'}
                                </p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-slate-800">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {meta.emoji}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{meta.label}</p>
                            </div>
                        </div>

                        {/* Last message preview */}
                        {assignment.last_message && (
                            <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border dark:border-slate-700">
                                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Last message</p>
                                <p className="text-sm text-gray-700 dark:text-slate-300 truncate">
                                    {assignment.last_message.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                    {new Date(assignment.last_message.timestamp).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {/* Start Chat Button */}
                        <button
                            onClick={() => setActiveChat(assignment)}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-pink-600 dark:to-purple-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-pink-500/20 transition-all transform hover:-translate-y-0.5 text-lg flex items-center justify-center gap-3"
                        >
                            💬 Open Chat
                            {assignment.unread_count > 0 && (
                                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
                                    {assignment.unread_count} new
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                /* No assignment yet */
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-black/30 border dark:border-slate-800 p-12 text-center">
                    <div className="w-24 h-24 bg-blue-100 dark:bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                        {meta.emoji}
                    </div>
                    <h2 className="text-2xl font-bold dark:text-white mb-2">
                        Get Matched with a Mentor
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                        Our system will connect you with a qualified <strong>{meta.label}</strong> mentor 
                        based on availability and expertise.
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleAutoAssign}
                        disabled={assigning}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-pink-600 dark:to-purple-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-pink-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        {assigning ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                Finding your mentor...
                            </span>
                        ) : (
                            '🔍 Find My Mentor'
                        )}
                    </button>
                </div>
            )}

            {/* Change Mentor Modal */}
            {showChangeMentor && assignment && (
                <ChangeMentorModal
                    assignment={assignment}
                    stage={stage}
                    onClose={() => setShowChangeMentor(false)}
                    onChanged={handleMentorChanged}
                />
            )}
        </div>
    );
}

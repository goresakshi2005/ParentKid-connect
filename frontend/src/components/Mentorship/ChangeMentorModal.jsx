import React, { useState, useEffect } from 'react';
import mentorshipService from '../../services/mentorshipService';

export default function ChangeMentorModal({ assignment, stage, onClose, onChanged }) {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [changing, setChanging] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMentors();
    }, [stage]);

    const loadMentors = async () => {
        try {
            const res = await mentorshipService.getMentors(stage);
            // Filter out current mentor
            const filtered = res.data.filter(
                m => m.id !== assignment.mentor_detail?.id
            );
            setMentors(filtered);
        } catch (err) {
            console.error('Failed to load mentors:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = async (mentorId) => {
        setChanging(true);
        setError('');
        try {
            await mentorshipService.changeMentor(assignment.id, mentorId);
            onChanged();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change mentor.');
        } finally {
            setChanging(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-black/50 border dark:border-slate-800 w-full max-w-lg max-h-[80vh] overflow-hidden animate-[fadeIn_0.2s_ease]">
                {/* Header */}
                <div className="px-6 py-5 border-b dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold dark:text-white">Change Mentor</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition text-gray-500 dark:text-slate-400"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Select a new mentor for this stage
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: '50vh' }}>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-3 border-pink-500 border-t-transparent"></div>
                        </div>
                    ) : mentors.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 dark:text-slate-500">
                                No other mentors available for this stage right now.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {mentors.map((mentor) => (
                                <div
                                    key={mentor.id}
                                    className="p-4 rounded-xl border dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-slate-800 transition group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-600 dark:bg-pink-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
                                            {mentor.user?.first_name?.charAt(0) || 'M'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold dark:text-white text-sm">
                                                {mentor.user?.first_name} {mentor.user?.last_name}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                                {mentor.bio?.substring(0, 80)}...
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                                {mentor.active_client_count}/{mentor.max_clients} clients
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleChange(mentor.id)}
                                            disabled={changing}
                                            className="px-4 py-2 bg-blue-600 dark:bg-pink-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 dark:hover:bg-pink-700 transition disabled:opacity-50 shrink-0"
                                        >
                                            Select
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

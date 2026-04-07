import React, { useState } from 'react';
import ChatWindow from './ChatWindow';

export default function MentorDashboard({ assignments, onSelectChat, activeChat, onRefresh }) {
    const [selectedAssignment, setSelectedAssignment] = useState(activeChat);

    const handleSelectChat = (assignment) => {
        setSelectedAssignment(assignment);
        onSelectChat(assignment);
    };

    // If a chat is open, show full chat
    if (selectedAssignment) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-6">
                <button
                    onClick={() => {
                        setSelectedAssignment(null);
                        onSelectChat(null);
                    }}
                    className="mb-4 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2 text-sm font-medium"
                >
                    ← Back to Client List
                </button>
                <ChatWindow
                    assignment={selectedAssignment}
                    onClose={() => {
                        setSelectedAssignment(null);
                        onSelectChat(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold dark:text-white tracking-tight flex items-center gap-3">
                    <span className="text-4xl">🧑‍🏫</span>
                    Mentor <span className="dark:text-pink-500 text-blue-600">Dashboard</span>
                </h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">
                    Your assigned clients • {assignments.length} active
                </p>
            </div>

            {/* Client Cards */}
            {assignments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-black/30 border dark:border-slate-800 p-12 text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                        ☕
                    </div>
                    <h2 className="text-xl font-bold dark:text-white mb-2">No Clients Yet</h2>
                    <p className="text-gray-400 dark:text-slate-500">
                        New clients will appear here once they're assigned to you.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {assignments.map((a) => {
                        const STAGE_EMOJIS = {
                            pregnancy: '🤰',
                            early_childhood: '👶',
                            growing_stage: '🧒',
                            teen_age: '🧑‍🎓',
                        };
                        return (
                            <div
                                key={a.id}
                                onClick={() => handleSelectChat(a)}
                                className="bg-white dark:bg-slate-900 rounded-xl shadow-md dark:shadow-black/20 border dark:border-slate-800 p-5 flex items-center gap-4 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-pink-500/30 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-pink-500/10 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-pink-400 shrink-0 group-hover:scale-110 transition-transform">
                                    {a.user_detail?.first_name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold dark:text-white text-sm">
                                            {a.user_detail?.first_name} {a.user_detail?.last_name}
                                        </h3>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-pink-400">
                                            {STAGE_EMOJIS[a.stage] || '💬'} {a.stage.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {a.last_message ? (
                                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-1">
                                            {a.last_message.sender_id === a.user_detail?.id ? '' : 'You: '}
                                            {a.last_message.message}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 italic">
                                            No messages yet
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    {a.last_message && (
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500">
                                            {new Date(a.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                    {a.unread_count > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-blue-600 dark:bg-pink-600 text-white text-[10px] font-bold flex items-center justify-center">
                                            {a.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

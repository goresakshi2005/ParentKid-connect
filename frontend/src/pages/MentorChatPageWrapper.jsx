import React from 'react';
import MentorChatPage from '../components/Mentorship/MentorChatPage';
import { useAuth } from '../context/AuthContext';

/**
 * Standalone page for mentor chat.
 * Determines the stage automatically from query params or user context.
 * URL: /mentor-chat?stage=pregnancy
 */
export default function MentorChatPageWrapper() {
    const { user } = useAuth();
    const params = new URLSearchParams(window.location.search);
    let stage = params.get('stage');

    // If no stage in URL, try to infer from user
    if (!stage) {
        if (user?.role === 'mentor') {
            // Mentor doesn't need a stage
            stage = null;
        } else if (user?.is_expecting) {
            stage = 'pregnancy';
        } else if (user?.role === 'teen') {
            stage = 'teen_age';
        } else {
            // Default for parents — let them pick
            stage = null;
        }
    }

    // If no stage and not a mentor, show stage picker
    if (!stage && user?.role !== 'mentor') {
        return <StageSelector />;
    }

    return <MentorChatPage stage={stage} />;
}

function StageSelector() {
    const stages = [
        { value: 'pregnancy', label: 'Before Birth', emoji: '🤰', desc: 'Chat with a pregnancy mentor', gradient: 'from-pink-500 to-rose-600' },
        { value: 'early_childhood', label: 'Early Childhood', emoji: '👶', desc: 'Guidance for ages 0-5', gradient: 'from-blue-500 to-cyan-600' },
        { value: 'growing_stage', label: 'Growing Stage', emoji: '🧒', desc: 'Support for ages 6-12', gradient: 'from-green-500 to-emerald-600' },
        { value: 'teen_age', label: 'Teenager', emoji: '🧑‍🎓', desc: 'Guidance for ages 13-21', gradient: 'from-purple-500 to-violet-600' },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-extrabold dark:text-white tracking-tight">
                    Choose Your <span className="dark:text-pink-500 text-blue-600">Stage</span>
                </h1>
                <p className="text-gray-500 dark:text-slate-400 mt-2">
                    Select the development stage to find the right mentor for you
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {stages.map((s) => (
                    <a
                        key={s.value}
                        href={`/mentor-chat?stage=${s.value}`}
                        className="group bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-black/30 border dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
                    >
                        <div className={`bg-gradient-to-r ${s.gradient} p-6`}>
                            <span className="text-4xl">{s.emoji}</span>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-bold dark:text-white mb-1">{s.label}</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{s.desc}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}

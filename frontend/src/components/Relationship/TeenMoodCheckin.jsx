import React, { useState } from 'react';
import api from '../../services/api';

const moods = [
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' },
    { value: 'low', emoji: '😔', label: 'Low' },
    { value: 'stressed', emoji: '😫', label: 'Stressed' },
];

export default function TeenMoodCheckin({ childId }) {
    const [selectedMood, setSelectedMood] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!selectedMood) return;
        try {
            await api.post('/relationship/mood-checkin/', {
                child: childId,
                mood: selectedMood,
            });
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border p-5 mb-6">
            <h3 className="text-md font-bold dark:text-white mb-3 flex items-center gap-2">🎭 How are you feeling right now?</h3>
            <div className="flex gap-3 mb-4">
                {moods.map(m => (
                    <button
                        key={m.value}
                        onClick={() => setSelectedMood(m.value)}
                        className={`flex-1 py-3 rounded-xl text-center transition-all ${
                            selectedMood === m.value
                                ? 'bg-pink-600 text-white scale-105 shadow-lg'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <div className="text-2xl">{m.emoji}</div>
                        <div className="text-xs font-semibold">{m.label}</div>
                    </button>
                ))}
            </div>
            <button
                onClick={handleSubmit}
                disabled={!selectedMood}
                className="w-full py-2 bg-pink-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
                Share mood
            </button>
            {submitted && <p className="text-green-600 text-sm mt-2 text-center">Thanks for sharing! 🌟</p>}
        </div>
    );
}
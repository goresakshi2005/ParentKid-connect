import React, { useState, useEffect } from 'react';
import { getHabits, createHabit, deleteHabit } from '../../services/habitService';
import './HabitBuilder.css';

const ParentHabitApproval = ({ user, selectedTeenId }) => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newHabit, setNewHabit] = useState({ title: '', duration_minutes: 10, suggested_time: '', teen: selectedTeenId });

    const fetchHabits = async () => {
        setLoading(true);
        try {
            const res = await getHabits();
            setHabits(res.data.results || res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHabits(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newHabit.title.trim() || !newHabit.teen) return;
        try {
            const payload = { ...newHabit, created_by: 'parent' };
            if (!payload.suggested_time) {
                payload.suggested_time = null;
            }
            await createHabit(payload);
            setNewHabit({ title: '', duration_minutes: 10, suggested_time: '', teen: selectedTeenId });
            fetchHabits();
        } catch (err) {
            alert('Failed to create habit.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this task?')) {
            await deleteHabit(id);
            fetchHabits();
        }
    };

    if (loading) return <div>Loading tasks...</div>;

    return (
        <div className="space-y-8 hb-container">
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                <span className="text-3xl drop-shadow-lg animate-pulse" style={{animationDuration: '4s'}}>🧑‍🏫</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 font-extrabold tracking-tight">
                    Parent Oversight – Habit Builder
                </span>
            </h2>

            <form onSubmit={handleCreate} className="bg-white dark:bg-transparent hb-glass p-6 rounded-2xl shadow-md border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-lg">
                    <span className="text-indigo-500 dark:text-purple-400">➕</span> Assign a new habit to your teen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task Title</label>
                        <input placeholder="E.g., Read for 20 minutes, Complete Math Homework" value={newHabit.title} onChange={e => setNewHabit({ ...newHabit, title: e.target.value })} className="w-full p-3 border rounded-xl hb-input" required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration (min)</label>
                        <input type="number" placeholder="2-20" value={newHabit.duration_minutes} onChange={e => setNewHabit({ ...newHabit, duration_minutes: e.target.value })} className="w-full p-3 border rounded-xl hb-input" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time (Optional)</label>
                        <input type="time" value={newHabit.suggested_time} onChange={e => setNewHabit({ ...newHabit, suggested_time: e.target.value })} className="w-full p-3 border rounded-xl hb-input" />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="w-full p-3 hb-btn-glow text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">
                            Send for Approval
                        </button>
                    </div>
                </div>
            </form>

            <div className="overflow-x-auto shadow-md rounded-2xl border border-gray-100 dark:border-transparent hb-table-container">
                <table className="min-w-full bg-white dark:bg-transparent hb-table overflow-hidden">
                    <thead className="bg-gray-50 dark:bg-transparent">
                        <tr>
                            <th className="p-3 text-left">Task</th>
                            <th className="p-3 text-left">Duration</th>
                            <th className="p-3 text-left">Approval</th>
                            <th className="p-3 text-left">Teen Feedback</th>
                            <th className="p-3 text-left">Completed?</th>
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(h => (
                            <tr key={h.id} className="border-b dark:border-transparent">
                                <td className="p-4 font-semibold text-gray-800 dark:text-white">{h.title}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{h.duration_minutes} min</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        h.approval_status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 dark:border dark:border-green-500/30' :
                                        h.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border dark:border-yellow-500/30' :
                                        h.approval_status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 dark:border dark:border-red-500/30' :
                                        'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/30'
                                    }`}>
                                        {h.approval_status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-300 italic">
                                    {h.teen_feedback ? `"${h.teen_feedback}"` : <span className="text-gray-400 dark:text-gray-500 not-italic">—</span>}
                                </td>
                                <td className="p-4 text-center">
                                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-purple-500/20 dark:text-purple-300 rounded-lg font-bold text-sm">
                                        {h.total_completions}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => handleDelete(h.id)} className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 rounded-lg transition hover:scale-110" title="Delete Habit">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ParentHabitApproval;
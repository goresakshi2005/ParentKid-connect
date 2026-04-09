import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function RelationshipDashboard() {
    const { user } = useAuth();
    const [state, setState] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (user?.role === 'parent') {
            // fetch first child's state
            api.get('/children/').then(res => {
                const child = res.data.results[0];
                if (child) {
                    api.get(`/relationship/state/?child_id=${child.id}`).then(res2 => setState(res2.data));
                    api.get(`/relationship/history/?child_id=${child.id}`).then(res3 => setHistory(res3.data));
                }
            });
        }
    }, [user]);

    if (!state) return <div className="p-8 text-center">Loading relationship insights...</div>;

    const chartData = state.trust_history.map(h => ({ date: new Date(h.date).toLocaleDateString(), trust: h.score }));

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold dark:text-white mb-6">Relationship Compass</h1>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Current Trust Score</h2>
                    <span className="text-3xl font-black text-pink-600">{state.trust_score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-pink-600 h-3 rounded-full" style={{ width: `${state.trust_score}%` }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Mode: <strong>{state.current_mode.replace('_',' ')}</strong></p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow">
                <h3 className="font-bold mb-4">Trust History (last 30 days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                        <YAxis domain={[0,100]} stroke="#94a3b8" />
                        <Tooltip />
                        <Line type="monotone" dataKey="trust" stroke="#ec4899" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
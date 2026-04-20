// frontend/src/components/ScreenTime/ScreenTimeDashboard.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiArrowLeft, 
    FiSmartphone, 
    FiClock, 
    FiRefreshCw, 
    FiActivity, 
    FiCalendar,
    FiAlertCircle,
    FiZap,
    FiBarChart2,
    FiChevronRight
} from 'react-icons/fi';
import { getUsage, getDevices } from '../../services/screenTimeService';

const fmtTime = (mins) => {
    if (!mins || mins <= 0) return '0m';
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const APP_COLORS = [
    'from-indigo-500 to-indigo-600',
    'from-amber-500 to-amber-600',
    'from-emerald-500 to-emerald-600',
    'from-rose-500 to-rose-600',
    'from-blue-500 to-blue-600',
    'from-fuchsia-500 to-fuchsia-600',
    'from-violet-500 to-violet-600',
];

const getRiskLevel = (mins) => {
    if (mins < 60) return { label: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' };
    if (mins < 180) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' };
    return { label: 'High', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' };
};

function StatCard({ label, value, icon, sub, accentClass }) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`flex-1 min-w-[200px] bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border-t-4 ${accentClass} border dark:border-white/5 transition-all`}
        >
            <div className="text-3xl mb-4">{icon}</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">{value}</div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</div>
            {sub && <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{sub}</div>}
        </motion.div>
    );
}

function AppBar({ app, index, maxTime }) {
    const pct = maxTime > 0 ? (app.usage_time / maxTime) * 100 : 0;
    const colorClass = APP_COLORS[index % APP_COLORS.length];
    const mins = app.usage_minutes ?? Math.round(app.usage_time / 60);

    return (
        <div className="group py-4 border-b border-slate-50 dark:border-white/5 flex items-center gap-5 hover:bg-slate-50/50 dark:hover:bg-white/5 px-4 -mx-4 transition-all rounded-2xl">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform`}>
                {app.app_name?.[0]?.toUpperCase() || '?'}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-slate-800 dark:text-white truncate max-w-[70%] text-sm uppercase tracking-tight">
                        {app.app_name}
                    </span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        {fmtTime(mins)}
                    </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
                    />
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-2 truncate opacity-60">
                    {app.package_name}
                </div>
            </div>
        </div>
    );
}

function DayTab({ day, isSelected, onClick }) {
    const risk = getRiskLevel(day.total_minutes);
    return (
        <button
            onClick={onClick}
            className={`
                flex-1 min-w-[90px] p-4 rounded-2xl border-2 transition-all text-center
                ${isSelected 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/30' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-indigo-200'}
            `}
        >
            <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">
                {day.date?.slice(5)}
            </div>
            <div className={`text-sm font-black ${isSelected ? 'text-white' : risk.color}`}>
                {fmtTime(day.total_minutes)}
            </div>
        </button>
    );
}

function DeviceCard({ device, isSelected, onClick }) {
    const lastSync = device.last_sync
        ? new Date(device.last_sync).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Never synced';
    return (
        <button
            onClick={onClick}
            className={`
                flex-1 min-w-[200px] p-6 rounded-[2rem] border-2 transition-all text-left group
                ${isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-600 shadow-lg' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-indigo-300'}
            `}
        >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📱</div>
            <div className={`font-black text-lg truncate uppercase tracking-tighter ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>
                {device.device_name}
            </div>
            <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest opacity-60">
                Sync: {lastSync}
            </div>
        </button>
    );
}

function TestDataUploader({ onUploaded }) {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const uploadDummy = async () => {
        setLoading(true);
        setMsg('');
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        const dummyPayload = {
            device_id: 'web-test-device-001',
            usages: [
                { app_name: 'YouTube', package_name: 'com.google.android.youtube', usage_time: 5400, date: today },
                { app_name: 'Instagram', package_name: 'com.instagram.android', usage_time: 3600, date: today },
                { app_name: 'WhatsApp', package_name: 'com.whatsapp', usage_time: 2700, date: today },
                { app_name: 'Chrome', package_name: 'com.android.chrome', usage_time: 1800, date: today },
                { app_name: 'Minecraft', package_name: 'com.mojang.minecraftpe', usage_time: 4500, date: today },
                { app_name: 'Spotify', package_name: 'com.spotify.music', usage_time: 2100, date: today },
                { app_name: 'TikTok', package_name: 'com.zhiliaoapp.musically', usage_time: 3200, date: today },
                { app_name: 'YouTube', package_name: 'com.google.android.youtube', usage_time: 7200, date: yesterday },
                { app_name: 'WhatsApp', package_name: 'com.whatsapp', usage_time: 1200, date: yesterday },
                { app_name: 'Minecraft', package_name: 'com.mojang.minecraftpe', usage_time: 5400, date: yesterday },
                { app_name: 'Chrome', package_name: 'com.android.chrome', usage_time: 900, date: yesterday },
            ],
        };

        try {
            const devRes = await fetch('/api/register-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({ device_id: 'web-test-device-001', device_name: "Test Child's Phone" }),
            });
            if (!devRes.ok) throw new Error('Device registration failed');

            const res = await fetch('/api/upload-screen-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify(dummyPayload),
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setMsg(`✓ Uploaded! ${data.created} new + ${data.updated} updated records.`);
            onUploaded();
        } catch (e) {
            setMsg(`❌ ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 dark:bg-indigo-500/5 border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 rounded-[2rem] p-6 mb-12 flex flex-wrap items-center gap-6"
        >
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                <FiZap />
            </div>
            <div className="flex-1 min-w-[200px]">
                <div className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-lg leading-none mb-1">
                    Demo Mode
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Load test data to preview the dashboard features
                </div>
            </div>
            <button
                onClick={uploadDummy}
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
            >
                {loading ? 'Processing...' : 'Load Simulation Data'}
            </button>
            {msg && <div className="w-full text-center text-xs font-black uppercase tracking-widest mt-2">{msg}</div>}
        </motion.div>
    );
}

export default function ScreenTimeDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [days, setDays] = useState(7);
    const [selectedDay, setSelectedDay] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDevices = useCallback(async () => {
        try {
            const res = await getDevices();
            setDevices(res.data);
        } catch (e) {}
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getUsage(selectedDevice, days);
            setData(res.data);
            setSelectedDay(0);
        } catch (e) {
            setError(e?.response?.status === 401 ? 'Authentication required' : 'System connectivity issue');
        } finally {
            setLoading(false);
        }
    }, [selectedDevice, days]);

    useEffect(() => { fetchDevices(); }, [fetchDevices]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const summary = data?.daily_summaries?.[selectedDay];
    const maxApp = summary ? Math.max(...summary.apps.map(a => a.usage_time), 1) : 1;
    const risk = summary ? getRiskLevel(summary.total_minutes) : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-8 md:p-12">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard/parent')}
                            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-4 hover:translate-x-[-4px] transition-transform"
                        >
                            <FiArrowLeft /> Back to Command Center
                        </button>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                            Screen Time <br />
                            <span className="text-indigo-600">Analytics</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={selectedDevice}
                            onChange={e => setSelectedDevice(e.target.value)}
                            className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-6 py-4 rounded-2xl font-black text-sm outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">All Active Devices</option>
                            {devices.map(d => <option key={d.device_id} value={d.device_id}>{d.device_name}</option>)}
                        </select>

                        <select
                            value={days}
                            onChange={e => setDays(Number(e.target.value))}
                            className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm outline-none appearance-none cursor-pointer"
                        >
                            <option value={1}>Today</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Monthly View</option>
                        </select>

                        <button onClick={fetchData} className="w-14 h-14 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-center text-slate-600 dark:text-white hover:bg-slate-50 transition-all shadow-sm">
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <TestDataUploader onUploaded={() => { fetchDevices(); fetchData(); }} />

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-50 dark:bg-rose-500/10 p-6 rounded-[2rem] border-2 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest text-xs flex items-center gap-3 mb-10">
                        <FiAlertCircle size={20} /> {error}
                    </motion.div>
                )}

                {loading ? (
                    <div className="py-32 text-center">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <FiActivity className="text-3xl text-indigo-500" />
                        </div>
                        <p className="font-black uppercase tracking-[0.3em] text-slate-400 text-sm">Synchronizing Data Streams...</p>
                    </div>
                ) : data && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Summary Column */}
                        <div className="lg:col-span-12">
                             <div className="flex flex-wrap gap-6 mb-10">
                                <StatCard
                                    icon="⏱️"
                                    label="Total Impact"
                                    value={fmtTime(data.total_minutes_overall)}
                                    sub={`Window: ${data.days_requested} Days`}
                                    accentClass="border-indigo-500"
                                />
                                <StatCard
                                    icon="📱"
                                    label="Active Fleet"
                                    value={data.device_count}
                                    sub="Registered Hardware"
                                    accentClass="border-emerald-500"
                                />
                                <StatCard
                                    icon="📅"
                                    label="Data Points"
                                    value={data.daily_summaries?.length ?? 0}
                                    sub="Snapshot range"
                                    accentClass="border-amber-500"
                                />
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="lg:col-span-12">
                            <div className="flex items-center gap-3 mb-6">
                                <FiCalendar className="text-indigo-500" />
                                <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Timeline Navigator</h2>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
                                {data.daily_summaries.map((day, i) => (
                                    <DayTab
                                        key={day.date}
                                        day={day}
                                        isSelected={i === selectedDay}
                                        onClick={() => setSelectedDay(i)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Detail View */}
                        <AnimatePresence mode="wait">
                            {summary && (
                                <motion.div 
                                    key={summary.date}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white dark:border-white/5"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                                        <div>
                                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter mb-4">
                                                {new Date(summary.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                    weekday: 'long', month: 'long', day: 'numeric',
                                                })}
                                            </h2>
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                                Observation of {summary.app_count} distinct applications
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className={`${risk.bg} ${risk.color} px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border ${risk.border}`}>
                                                {risk.label} Trend
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl text-center border border-slate-100 dark:border-white/5">
                                                <div className="text-4xl font-black text-slate-900 dark:text-white leading-none mb-1">
                                                    {fmtTime(summary.total_minutes)}
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Usage</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-12">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                            <span>Cumulative Burden</span>
                                            <span>6h Guideline</span>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-white/5 rounded-full h-4 overflow-hidden border border-white/10 shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((summary.total_minutes / 360) * 100, 100)}%` }}
                                                className={`h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full`}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                        <div className="col-span-full mb-6 flex items-center gap-3">
                                            <FiBarChart2 className="text-indigo-500" />
                                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-700 dark:text-white">App Velocity Breakdown</h3>
                                        </div>
                                        {summary.apps.length === 0 ? (
                                            <div className="col-span-full py-12 text-center text-slate-400 font-black uppercase tracking-[0.2em] text-xs">
                                                No digital footprint found
                                            </div>
                                        ) : (
                                            summary.apps.map((app, i) => (
                                                <AppBar key={app.package_name || i} app={app} index={i} maxTime={maxApp} />
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
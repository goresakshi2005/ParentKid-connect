// frontend/src/components/ScreenTime/DeviceManager.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiArrowLeft, 
    FiSmartphone, 
    FiPlus, 
    FiCheckCircle, 
    FiAlertCircle,
    FiCpu,
    FiLink,
    FiChevronRight,
    FiActivity
} from 'react-icons/fi';
import { getDevices, registerDevice } from '../../services/screenTimeService';

export default function DeviceManager() {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ device_id: '', device_name: '' });
    const [msg, setMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const res = await getDevices();
            setDevices(res.data);
        } catch (e) {
            setMsg('Failed to load devices.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDevices(); }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!form.device_id.trim() || !form.device_name.trim()) {
            setMsg('Both Device ID and Device Name are required.');
            return;
        }
        setSubmitting(true);
        setMsg('');
        try {
            await registerDevice(form.device_id.trim(), form.device_name.trim());
            setMsg('✓ Device registered successfully!');
            setForm({ device_id: '', device_name: '' });
            fetchDevices();
        } catch (e) {
            setMsg('❌ ' + (e?.response?.data?.error || 'Failed to register device.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-8 md:p-12">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                     <button
                        onClick={() => navigate('/dashboard/parent')}
                        className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-4 hover:translate-x-[-4px] transition-transform"
                    >
                        <FiArrowLeft /> Back to Command Center
                    </button>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                        Fleet <br />
                        <span className="text-indigo-600">Sync Manager</span>
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Form Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-5"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-white dark:border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 text-indigo-500/5 pointer-events-none">
                                <FiLink size={120} />
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter leading-none italic">
                                Register Device
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
                                Link a new Android device to the sync network
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 ml-1">
                                        Device Identifier Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Aarav's Galaxy"
                                        value={form.device_name}
                                        onChange={e => setForm(f => ({ ...f, device_name: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-[#0a0f1e] border-2 border-slate-100 dark:border-white/5 px-6 py-4 rounded-2xl font-black text-sm outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 ml-1">
                                        Unique Device ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. android-sync-789"
                                        value={form.device_id}
                                        onChange={e => setForm(f => ({ ...f, device_id: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-[#0a0f1e] border-2 border-slate-100 dark:border-white/5 px-6 py-4 rounded-2xl font-black text-sm outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 uppercase tracking-wider">
                                        Found in Android App Settings
                                    </p>
                                </div>

                                {msg && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`text-xs font-black uppercase tracking-widest p-4 rounded-xl text-center ${msg.startsWith('✓') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}
                                    >
                                        {msg}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <FiActivity className="animate-spin" /> Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <FiPlus /> Establish Link
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Devices List Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                Active Fleet <span className="opacity-30">/ {devices.length}</span>
                            </h2>
                        </div>

                        {loading ? (
                             <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <FiCpu className="text-2xl text-slate-400" />
                                </div>
                                <p className="font-black uppercase tracking-widest text-slate-400 text-[10px]">Scanning Sync Network...</p>
                            </div>
                        ) : devices.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5">
                                <FiSmartphone className="mx-auto text-6xl text-slate-200 dark:text-white/10 mb-6" />
                                <h3 className="font-black text-slate-400 uppercase tracking-widest text-sm">No Active Sync Nodes Detected</h3>
                                <p className="text-xs font-bold text-slate-500 mt-2">Initialize your first device to begin monitoring</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <AnimatePresence>
                                    {devices.map((device, idx) => (
                                        <motion.div 
                                            key={device.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all flex items-center gap-6"
                                        >
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                                📱
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-black text-xl text-slate-800 dark:text-white truncate uppercase tracking-tighter italic leading-none">
                                                        {device.device_name}
                                                    </h3>
                                                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                        Active
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-6 gap-y-1">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <FiLink className="text-indigo-400" /> ID: {device.device_id}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <FiCheckCircle className="text-emerald-400" /> Pulse: {device.last_sync
                                                            ? new Date(device.last_sync).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                            : 'Awaiting first sync'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden md:block">
                                                <button 
                                                    onClick={() => navigate(`/screen-time?device=${device.device_id}`)}
                                                    className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"
                                                >
                                                    <FiChevronRight size={20} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
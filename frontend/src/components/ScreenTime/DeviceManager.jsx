// frontend/src/components/ScreenTime/DeviceManager.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

    const handleSubmit = async () => {
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
        <div style={{
            maxWidth: 600, margin: '0 auto', padding: '32px 20px',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <button
                onClick={() => navigate('/dashboard/parent')}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6366f1', fontSize: 14, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 16, padding: 0, fontFamily: 'inherit',
                }}
                onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
            >
                ← Back to Dashboard
            </button>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                📱 Manage Devices
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
                Register your child's Android device to start tracking screen time.
            </p>

            {/* Register Form */}
            <div style={{
                background: 'white', borderRadius: 18, padding: 24,
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: 28,
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#374151' }}>
                    Register New Device
                </h3>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                        Device Name
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Aarav's Samsung"
                        value={form.device_name}
                        onChange={e => setForm(f => ({ ...f, device_name: e.target.value }))}
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                        Device ID
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. android-abc123xyz (from Android app)"
                        value={form.device_id}
                        onChange={e => setForm(f => ({ ...f, device_id: e.target.value }))}
                        style={inputStyle}
                    />
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                        Find this in the Android app's Settings screen, or use any unique string for testing.
                    </div>
                </div>

                {msg && (
                    <div style={{
                        fontSize: 13, fontWeight: 600, marginBottom: 14,
                        color: msg.startsWith('✓') ? '#10b981' : '#ef4444',
                    }}>
                        {msg}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                        padding: '10px 22px', borderRadius: 10, border: 'none',
                        background: submitting ? '#c7d2fe' : '#6366f1',
                        color: 'white', fontWeight: 700, fontSize: 14,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    {submitting ? 'Registering...' : '+ Register Device'}
                </button>
            </div>

            {/* Existing Devices */}
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 14 }}>
                Registered Devices ({devices.length})
            </h3>

            {loading ? (
                <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading...</div>
            ) : devices.length === 0 ? (
                <div style={{
                    background: '#f8fafc', borderRadius: 14, padding: 32,
                    textAlign: 'center', color: '#94a3b8', fontSize: 14,
                }}>
                    No devices registered yet.
                </div>
            ) : (
                devices.map(device => (
                    <div key={device.id} style={{
                        background: 'white', borderRadius: 14, padding: '16px 20px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 12,
                        display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                        <div style={{ fontSize: 28 }}>📱</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>
                                {device.device_name}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                ID: {device.device_id}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                Last sync: {device.last_sync
                                    ? new Date(device.last_sync).toLocaleString()
                                    : 'Never'}
                            </div>
                        </div>
                        <div style={{
                            background: '#d1fae5', color: '#065f46',
                            borderRadius: 99, padding: '4px 12px',
                            fontSize: 12, fontWeight: 600,
                        }}>
                            Active
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

const inputStyle = {
    width: '100%', padding: '10px 14px',
    borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, color: '#374151', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
};
// frontend/src/components/ScreenTime/ScreenTimeDashboard.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsage, getDevices } from '../../services/screenTimeService';

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
const fmtTime = (mins) => {
    if (!mins || mins <= 0) return '0m';
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const APP_COLORS = [
    '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
    '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4',
];

const getRiskLevel = (mins) => {
    if (mins < 60) return { label: 'Healthy', color: '#10b981', bg: '#d1fae5' };
    if (mins < 180) return { label: 'Moderate', color: '#f59e0b', bg: '#fef3c7' };
    return { label: 'High', color: '#ef4444', bg: '#fee2e2' };
};

// ─────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────

function StatCard({ label, value, icon, sub, accent }) {
    return (
        <div style={{
            background: 'white',
            borderRadius: 18,
            padding: '22px 24px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            flex: 1,
            minWidth: 140,
            borderTop: `4px solid ${accent || '#6366f1'}`,
        }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

function AppBar({ app, index, maxTime }) {
    const pct = maxTime > 0 ? (app.usage_time / maxTime) * 100 : 0;
    const color = APP_COLORS[index % APP_COLORS.length];
    const mins = app.usage_minutes ?? Math.round(app.usage_time / 60);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 0', borderBottom: '1px solid #f1f5f9',
        }}>
            {/* App icon placeholder */}
            <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: color + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
                color: color, fontWeight: 800,
            }}>
                {app.app_name?.[0]?.toUpperCase() || '?'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>
                        {app.app_name}
                    </span>
                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                        {fmtTime(mins)}
                    </span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                    <div style={{
                        width: `${pct}%`, height: '100%',
                        background: color, borderRadius: 99,
                        transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
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
            style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: `2px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                background: isSelected ? '#6366f1' : 'white',
                color: isSelected ? 'white' : '#475569',
                transition: 'all 0.2s',
                textAlign: 'center',
                minWidth: 88,
            }}
        >
            <div>{day.date?.slice(5)}</div>
            <div style={{
                marginTop: 4, fontSize: 13,
                color: isSelected ? 'rgba(255,255,255,0.9)' : risk.color,
                fontWeight: 700,
            }}>
                {fmtTime(day.total_minutes)}
            </div>
        </button>
    );
}

function DeviceCard({ device, isSelected, onClick }) {
    const lastSync = device.last_sync
        ? new Date(device.last_sync).toLocaleString()
        : 'Never synced';
    return (
        <button
            onClick={onClick}
            style={{
                background: isSelected ? '#ede9fe' : 'white',
                border: `2px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
                borderRadius: 14,
                padding: '12px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                minWidth: 160,
            }}
        >
            <div style={{ fontSize: 20, marginBottom: 4 }}>📱</div>
            <div style={{
                fontWeight: 700, fontSize: 14,
                color: isSelected ? '#4f46e5' : '#1e293b',
            }}>
                {device.device_name}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                Synced: {lastSync}
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────
// TestDataUploader — lets you add dummy data from the browser
// ─────────────────────────────────────────────────────
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
                // Today
                { app_name: 'YouTube', package_name: 'com.google.android.youtube', usage_time: 5400, date: today },
                { app_name: 'Instagram', package_name: 'com.instagram.android', usage_time: 3600, date: today },
                { app_name: 'WhatsApp', package_name: 'com.whatsapp', usage_time: 2700, date: today },
                { app_name: 'Chrome', package_name: 'com.android.chrome', usage_time: 1800, date: today },
                { app_name: 'Minecraft', package_name: 'com.mojang.minecraftpe', usage_time: 4500, date: today },
                { app_name: 'Spotify', package_name: 'com.spotify.music', usage_time: 2100, date: today },
                { app_name: 'TikTok', package_name: 'com.zhiliaoapp.musically', usage_time: 3200, date: today },
                // Yesterday
                { app_name: 'YouTube', package_name: 'com.google.android.youtube', usage_time: 7200, date: yesterday },
                { app_name: 'WhatsApp', package_name: 'com.whatsapp', usage_time: 1200, date: yesterday },
                { app_name: 'Minecraft', package_name: 'com.mojang.minecraftpe', usage_time: 5400, date: yesterday },
                { app_name: 'Chrome', package_name: 'com.android.chrome', usage_time: 900, date: yesterday },
            ],
        };

        try {
            // Register device first
            const devRes = await fetch('/api/register-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({ device_id: 'web-test-device-001', device_name: "Test Child's Phone" }),
            });
            if (!devRes.ok) throw new Error('Device registration failed');

            // Upload usage
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
            setMsg(`❌ ${e.message} — make sure you are logged in.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: '#fafaf9',
            border: '1.5px dashed #d1d5db',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
        }}>
            <span style={{ fontSize: 20 }}>🧪</span>
            <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>
                    No Android device yet?
                </div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                    Load dummy data to preview the dashboard.
                </div>
            </div>
            <button
                onClick={uploadDummy}
                disabled={loading}
                style={{
                    padding: '9px 18px', borderRadius: 10,
                    border: 'none', background: '#f59e0b',
                    color: 'white', fontWeight: 700, fontSize: 13,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? 'Loading...' : '⚡ Load Test Data'}
            </button>
            {msg && <div style={{ width: '100%', fontSize: 13, color: msg.startsWith('✓') ? '#10b981' : '#ef4444', fontWeight: 500 }}>{msg}</div>}
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────
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
        } catch (e) {
            // silently ignore — no devices yet
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getUsage(selectedDevice, days);
            setData(res.data);
            setSelectedDay(0);
        } catch (e) {
            setError(
                e?.response?.status === 401
                    ? 'Not authenticated. Please log in first.'
                    : 'Failed to load data. Is Django running on port 8000?'
            );
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
        <div style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: '36px 20px 60px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        }}>
            {/* Back to Dashboard */}
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

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{
                    fontSize: 30, fontWeight: 800, color: '#0f172a',
                    margin: 0, letterSpacing: '-0.5px',
                }}>
                    📱 Screen Time Monitor
                </h1>
                <p style={{ color: '#64748b', marginTop: 6, fontSize: 15 }}>
                    Track your child's daily app usage in real time.
                </p>
            </div>

            {/* Test Data Helper */}
            <TestDataUploader onUploaded={() => { fetchDevices(); fetchData(); }} />

            {/* Controls Row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                    value={selectedDevice}
                    onChange={e => setSelectedDevice(e.target.value)}
                    style={selectStyle}
                >
                    <option value="">All Devices</option>
                    {devices.map(d => (
                        <option key={d.device_id} value={d.device_id}>
                            {d.device_name}
                        </option>
                    ))}
                </select>

                <select
                    value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    style={selectStyle}
                >
                    <option value={1}>Today only</option>
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                </select>

                <button onClick={fetchData} style={btnStyle}>
                    🔄 Refresh
                </button>
            </div>

            {/* Devices Row */}
            {devices.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                    <DeviceCard
                        device={{ device_id: '', device_name: 'All Devices' }}
                        isSelected={selectedDevice === ''}
                        onClick={() => setSelectedDevice('')}
                    />
                    {devices.map(d => (
                        <DeviceCard
                            key={d.device_id}
                            device={d}
                            isSelected={selectedDevice === d.device_id}
                            onClick={() => setSelectedDevice(d.device_id)}
                        />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 14, padding: '14px 18px',
                    color: '#dc2626', marginBottom: 24, fontSize: 14,
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div style={{
                    textAlign: 'center', padding: 72,
                    color: '#94a3b8', fontSize: 16,
                }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                    Loading screen time data...
                </div>
            )}

            {/* Dashboard content */}
            {!loading && data && (
                <>
                    {/* Stat Cards */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
                        <StatCard
                            icon="⏱️"
                            label="Total Screen Time"
                            value={fmtTime(data.total_minutes_overall)}
                            sub={`Last ${data.days_requested} day(s)`}
                            accent="#6366f1"
                        />
                        <StatCard
                            icon="📱"
                            label="Devices Tracked"
                            value={data.device_count}
                            sub="Registered Android devices"
                            accent="#10b981"
                        />
                        <StatCard
                            icon="📅"
                            label="Days with Data"
                            value={data.daily_summaries?.length ?? 0}
                            sub="Days recorded"
                            accent="#f59e0b"
                        />
                    </div>

                    {/* Day Tabs */}
                    {data.daily_summaries?.length > 0 ? (
                        <>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 14 }}>
                                Select a Day
                            </h2>
                            <div style={{
                                display: 'flex', gap: 10, marginBottom: 28,
                                flexWrap: 'wrap',
                            }}>
                                {data.daily_summaries.map((day, i) => (
                                    <DayTab
                                        key={day.date}
                                        day={day}
                                        isSelected={i === selectedDay}
                                        onClick={() => setSelectedDay(i)}
                                    />
                                ))}
                            </div>

                            {/* Day Detail Card */}
                            {summary && (
                                <div style={{
                                    background: 'white',
                                    borderRadius: 22,
                                    padding: 28,
                                    boxShadow: '0 4px 28px rgba(0,0,0,0.08)',
                                }}>
                                    {/* Day header */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 24,
                                        flexWrap: 'wrap',
                                        gap: 12,
                                    }}>
                                        <div>
                                            <h2 style={{
                                                margin: 0, fontSize: 22,
                                                fontWeight: 800, color: '#0f172a',
                                            }}>
                                                {new Date(summary.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                    weekday: 'long', month: 'long', day: 'numeric',
                                                })}
                                            </h2>
                                            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
                                                {summary.app_count} apps used
                                            </p>
                                        </div>

                                        {/* Risk badge + total */}
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <span style={{
                                                background: risk.bg,
                                                color: risk.color,
                                                borderRadius: 99,
                                                padding: '5px 14px',
                                                fontSize: 13,
                                                fontWeight: 700,
                                            }}>
                                                {risk.label}
                                            </span>
                                            <div style={{
                                                background: '#f8fafc',
                                                borderRadius: 14,
                                                padding: '10px 20px',
                                                textAlign: 'center',
                                            }}>
                                                <div style={{
                                                    fontSize: 26, fontWeight: 800,
                                                    color: '#0f172a', lineHeight: 1,
                                                }}>
                                                    {fmtTime(summary.total_minutes)}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                                    total screen time
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Usage bar (total vs 6h limit) */}
                                    <div style={{ marginBottom: 28 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                                            <span>Daily usage</span>
                                            <span>6h recommended limit</span>
                                        </div>
                                        <div style={{ background: '#f1f5f9', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.min((summary.total_minutes / 360) * 100, 100)}%`,
                                                height: '100%',
                                                background: risk.color,
                                                borderRadius: 99,
                                                transition: 'width 0.8s ease',
                                            }} />
                                        </div>
                                    </div>

                                    {/* App list */}
                                    <h3 style={{
                                        fontSize: 15, fontWeight: 700,
                                        color: '#374151', marginBottom: 8,
                                    }}>
                                        App Breakdown
                                    </h3>

                                    {summary.apps.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                                            No app data for this day.
                                        </div>
                                    ) : (
                                        summary.apps.map((app, i) => (
                                            <AppBar
                                                key={app.package_name || i}
                                                app={app}
                                                index={i}
                                                maxTime={maxApp}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            textAlign: 'center', padding: 72,
                            background: 'white', borderRadius: 22,
                            color: '#94a3b8',
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                            <div style={{ fontSize: 18, fontWeight: 600, color: '#64748b' }}>
                                No screen time data yet
                            </div>
                            <div style={{ fontSize: 14, marginTop: 8 }}>
                                Use the "Load Test Data" button above, or sync the Android app.
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const selectStyle = {
    padding: '9px 14px',
    borderRadius: 10,
    border: '1.5px solid #e2e8f0',
    fontSize: 14,
    color: '#374151',
    background: 'white',
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'inherit',
};

const btnStyle = {
    padding: '9px 18px',
    borderRadius: 10,
    border: 'none',
    background: '#6366f1',
    color: 'white',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
};
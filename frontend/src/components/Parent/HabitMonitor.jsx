// frontend/src/components/Parent/HabitMonitor.jsx
//
// AI Habit Builder — Parent View
// Features: monitor teen habits, create habits for teens,
//           see approval status, completion tracking, and rewards

import React, { useState, useEffect, useCallback } from 'react';
import {
    getParentDashboard,
    createHabit,
    getRewardsSummary,
} from '../../services/habitBuilderService';
import '../../styles/habitBuilder.css';

export default function HabitMonitor({ onBack, linkedTeens = [] }) {
    const [dashboard, setDashboard] = useState([]);
    const [rewards, setRewards] = useState(null);
    const [loading, setLoading] = useState(true);

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', duration_minutes: 10,
        suggested_time: '', repetition: 'daily', teen_id: '',
    });
    const [creating, setCreating] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, rewardsRes] = await Promise.all([
                getParentDashboard(),
                getRewardsSummary(),
            ]);
            setDashboard(dashRes.data.parent_dashboard || []);
            setRewards(rewardsRes.data);
        } catch (err) {
            console.error('Failed to load habit monitor data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.teen_id) return;
        setCreating(true);
        try {
            await createHabit({
                ...form,
                duration_minutes: Math.max(1, form.duration_minutes),
                suggested_time: form.suggested_time || null,
                teen_id: parseInt(form.teen_id),
            });
            setForm({ title: '', description: '', duration_minutes: 10, suggested_time: '', repetition: 'daily', teen_id: '' });
            setShowCreate(false);
            fetchData();
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to create habit');
        } finally {
            setCreating(false);
        }
    };

    // ─── Helpers ──────────────────────────────────────────────────
    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return '✅';
            case 'pending': return '⏳';
            case 'rejected': return '❌';
            case 'modified': return '✏️';
            default: return '❔';
        }
    };

    if (loading) {
        return (
            <div className="hb-container" style={{ textAlign: 'center', paddingTop: 80 }}>
                <div className="hb-spinner" style={{ margin: '0 auto', width: 36, height: 36, borderWidth: 3 }} />
                <p style={{ marginTop: 16, color: 'var(--hb-text-muted)', fontWeight: 600 }}>
                    Loading habit monitor...
                </p>
            </div>
        );
    }

    return (
        <div className="hb-container">
            {/* Back */}
            <button className="hb-back-btn" onClick={onBack}>
                ← Back to Dashboard
            </button>

            {/* Header */}
            <div className="hb-header">
                <h1 className="hb-header__title">
                    📊 <span>Habit Monitor</span>
                </h1>
                <div className="hb-points-badge" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                    👨‍👩‍👧 Parent View
                </div>
            </div>

            {/* Stats Row */}
            <div className="hb-stats-row">
                <div className="hb-stat-card">
                    <div className="hb-stat-card__icon">📋</div>
                    <div className="hb-stat-card__value">{dashboard.length}</div>
                    <div className="hb-stat-card__label">Total Habits</div>
                </div>
                <div className="hb-stat-card">
                    <div className="hb-stat-card__icon">✅</div>
                    <div className="hb-stat-card__value">
                        {dashboard.filter(h => h.completion_status === 'completed').length}
                    </div>
                    <div className="hb-stat-card__label">Done Today</div>
                </div>
                <div className="hb-stat-card">
                    <div className="hb-stat-card__icon">🏆</div>
                    <div className="hb-stat-card__value">{rewards?.formed_habits || 0}</div>
                    <div className="hb-stat-card__label">Formed</div>
                </div>
                <div className="hb-stat-card">
                    <div className="hb-stat-card__icon">⚡</div>
                    <div className="hb-stat-card__value">{rewards?.total_points || 0}</div>
                    <div className="hb-stat-card__label">Total Points</div>
                </div>
            </div>

            {/* Create Habit for Teen */}
            {!showCreate ? (
                <button
                    className="hb-btn hb-btn--primary"
                    onClick={() => setShowCreate(true)}
                    style={{ marginBottom: 20 }}
                >
                    ➕ Suggest Habit for Teen
                </button>
            ) : (
                <form className="hb-form" onSubmit={handleCreate}>
                    <div className="hb-form__title">📝 Create Habit for Teen</div>
                    <div className="hb-form__field" style={{ marginBottom: 12 }}>
                        <label className="hb-form__label">Select Teen</label>
                        <select
                            className="hb-form__select"
                            value={form.teen_id}
                            onChange={e => setForm(f => ({ ...f, teen_id: e.target.value }))}
                            required
                        >
                            <option value="">— Choose a teen —</option>
                            {linkedTeens.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name || t.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="hb-form__field" style={{ marginBottom: 12 }}>
                        <label className="hb-form__label">Habit Title</label>
                        <input
                            className="hb-form__input"
                            type="text"
                            placeholder='e.g. "Practice guitar for 15 minutes"'
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="hb-form__field" style={{ marginBottom: 12 }}>
                        <label className="hb-form__label">Description (optional)</label>
                        <input
                            className="hb-form__input"
                            type="text"
                            placeholder="Brief description"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                    </div>
                    <div className="hb-form__row">
                        <div className="hb-form__field">
                            <label className="hb-form__label">Duration (min)</label>
                            <input
                                className="hb-form__input"
                                type="number"
                                min={1}
                                value={form.duration_minutes}
                                onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 10 }))}
                            />
                        </div>
                        <div className="hb-form__field">
                            <label className="hb-form__label">Suggested Time</label>
                            <input
                                className="hb-form__input"
                                type="time"
                                value={form.suggested_time}
                                onChange={e => setForm(f => ({ ...f, suggested_time: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="hb-form__field" style={{ marginBottom: 16 }}>
                        <label className="hb-form__label">Repetition</label>
                        <select
                            className="hb-form__select"
                            value={form.repetition}
                            onChange={e => setForm(f => ({ ...f, repetition: e.target.value }))}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="hb-btn hb-btn--primary" disabled={creating}>
                            {creating ? <><span className="hb-spinner" /> Sending...</> : '📤 Send to Teen'}
                        </button>
                        <button
                            type="button"
                            className="hb-btn hb-btn--ghost"
                            onClick={() => setShowCreate(false)}
                        >
                            Cancel
                        </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--hb-text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                        ℹ️ Teen will need to approve this habit before it becomes active.
                    </p>
                </form>
            )}

            {/* Habits Table */}
            <div className="hb-section-title">Teen Habits Overview</div>

            {dashboard.length === 0 ? (
                <div className="hb-empty">
                    <div className="hb-empty__icon">📭</div>
                    <div className="hb-empty__text">No habits found. Suggest one for your teen!</div>
                </div>
            ) : (
                dashboard.map(h => (
                    <div
                        key={h.id}
                        className={`hb-card ${h.completion_status === 'completed' ? 'hb-card--completed' : ''}`}
                    >
                        <div className="hb-card__row">
                            <div style={{ fontSize: '1.4rem' }}>
                                {h.completion_status === 'completed' ? '✅' : '⏳'}
                            </div>
                            <div className="hb-card__info">
                                <div className="hb-card__title">
                                    {h.habit}
                                </div>
                                <div className="hb-card__meta">
                                    <span>👦 {h.teen_name}</span>
                                    <span>{getStatusIcon(h.approval_status)} {h.approval_status}</span>
                                    <span className="hb-streak-flame">
                                        <span className="flame">🔥</span> {h.streak}
                                    </span>
                                    <span className={`hb-badge hb-badge--${h.stage}`}>
                                        {h.stage === 'formed' ? '🏆 Formed' :
                                         h.stage === 'building' ? '🔨 Building' : '🌱 New'}
                                    </span>
                                    <span className={`hb-badge hb-badge--${h.approval_status}`}>
                                        {h.approval_status}
                                    </span>
                                    <span className={`hb-badge hb-badge--${h.created_by}`}>
                                        {h.created_by === 'parent' ? '👤 You' : '🧑 Teen'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, color: 'var(--hb-gold)', fontSize: '0.85rem' }}>
                                    ⚡ {h.points_earned} pts
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}

            {/* Rewards Overview */}
            {rewards?.recent_rewards?.length > 0 && (
                <>
                    <div className="hb-section-title">Recent Teen Rewards</div>
                    <div className="hb-rewards-list">
                        {rewards.recent_rewards.map((r, i) => (
                            <div key={i} className="hb-reward-card">
                                <div className="hb-reward-card__emoji">{r.badge_emoji || '🎖'}</div>
                                <div className="hb-reward-card__info">
                                    <div className="hb-reward-card__title">{r.title}</div>
                                    <div className="hb-reward-card__pts">+{r.points} pts</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

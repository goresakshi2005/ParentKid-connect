// frontend/src/components/Teen/HabitBuilder.jsx
//
// AI Habit Builder & Scheduler — Teen View
// Features: daily habits dashboard, create habits, approve parent tasks,
//           check-in with rewards, streak tracking, AI analysis

import React, { useState, useEffect, useCallback } from 'react';
import {
    getTeenDashboard,
    getHabits,
    createHabit,
    checkInHabit,
    respondToHabit,
    aiAnalyzeTask,
    getRewardsSummary,
    deleteHabit,
} from '../../services/habitBuilderService';
import '../../styles/habitBuilder.css';

// ── Reward Toast ─────────────────────────────────────────────────
function RewardToast({ rewards, onDismiss }) {
    useEffect(() => {
        if (rewards && rewards.length > 0) {
            const timer = setTimeout(onDismiss, 5000);
            return () => clearTimeout(timer);
        }
    }, [rewards, onDismiss]);

    if (!rewards || rewards.length === 0) return null;

    return (
        <div className="hb-reward-toast">
            {rewards.map((r, i) => (
                <div key={i} className="hb-reward-toast__inner" style={{ marginBottom: i < rewards.length - 1 ? 8 : 0 }}>
                    <div className="hb-reward-toast__title">
                        <span style={{ fontSize: '1.2rem' }}>{r.badge_emoji || '🎉'}</span>
                        {r.title}
                    </div>
                    <div className="hb-reward-toast__desc">{r.description}</div>
                    <span className="hb-reward-toast__points">+{r.points} pts</span>
                </div>
            ))}
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────
export default function HabitBuilder({ onBack }) {
    const [activeTab, setActiveTab] = useState('today');
    const [dashboard, setDashboard] = useState([]);
    const [allHabits, setAllHabits] = useState([]);
    const [pendingHabits, setPendingHabits] = useState([]);
    const [rewards, setRewards] = useState(null);
    const [totalPoints, setTotalPoints] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toastRewards, setToastRewards] = useState([]);

    // Create form state
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', duration_minutes: 10,
        suggested_time: '', repetition: 'daily',
    });
    const [creating, setCreating] = useState(false);
    const [aiPreview, setAiPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Approval state
    const [feedbackText, setFeedbackText] = useState('');
    const [modifyTitle, setModifyTitle] = useState('');
    const [respondingId, setRespondingId] = useState(null);

    // ─── Data Fetching ────────────────────────────────────────────
    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, habitsRes, rewardsRes] = await Promise.all([
                getTeenDashboard(),
                getHabits(),
                getRewardsSummary(),
            ]);
            setDashboard(dashRes.data.teen_dashboard || []);
            setTotalPoints(dashRes.data.total_points || 0);
            setPendingCount(dashRes.data.pending_approvals || 0);

            const habits = Array.isArray(habitsRes.data)
                ? habitsRes.data
                : (habitsRes.data.results || []);
            setAllHabits(habits);
            setPendingHabits(habits.filter(h => h.approval_status === 'pending'));
            setRewards(rewardsRes.data);
        } catch (err) {
            console.error('Failed to load habit data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // ─── Handlers ─────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setCreating(true);
        try {
            const payload = {
                ...form,
                duration_minutes: Math.max(1, form.duration_minutes),
                suggested_time: form.suggested_time || null,
            };
            await createHabit(payload);
            setForm({ title: '', description: '', duration_minutes: 10, suggested_time: '', repetition: 'daily' });
            setShowCreate(false);
            setAiPreview(null);
            fetchDashboard();
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to create habit');
        } finally {
            setCreating(false);
        }
    };

    const handleAiAnalyze = async () => {
        if (!form.title.trim()) return;
        setAnalyzing(true);
        try {
            const { data } = await aiAnalyzeTask({ task_title: form.title });
            setAiPreview(data);
            if (data.recommended_duration) {
                setForm(f => ({ ...f, duration_minutes: data.recommended_duration }));
            }
        } catch {
            setAiPreview({ task_analysis: { feasibility: 'error', suggestion: 'AI analysis failed. Try again.' } });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCheckIn = async (habitId) => {
        try {
            const { data } = await checkInHabit(habitId);
            if (data.new_rewards && data.new_rewards.length > 0) {
                setToastRewards(data.new_rewards);
            }
            fetchDashboard();
        } catch (err) {
            if (err?.response?.data?.already_completed) {
                alert('Already checked in today! 🎯');
            } else {
                alert(err?.response?.data?.error || 'Check-in failed');
            }
        }
    };

    const handleRespond = async (habitId, responseStatus) => {
        setRespondingId(habitId);
        try {
            const payload = {
                status: responseStatus,
                feedback: feedbackText,
            };
            if (responseStatus === 'modified' && modifyTitle.trim()) {
                payload.adjusted_title = modifyTitle;
            }
            await respondToHabit(habitId, payload);
            setFeedbackText('');
            setModifyTitle('');
            fetchDashboard();
        } catch (err) {
            alert(err?.response?.data?.error || 'Response failed');
        } finally {
            setRespondingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this habit?')) return;
        try {
            await deleteHabit(id);
            fetchDashboard();
        } catch {
            alert('Failed to delete habit');
        }
    };

    // ─── Render ───────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="hb-container" style={{ textAlign: 'center', paddingTop: 80 }}>
                <div className="hb-spinner" style={{ margin: '0 auto', width: 36, height: 36, borderWidth: 3 }} />
                <p style={{ marginTop: 16, color: 'var(--hb-text-muted)', fontWeight: 600 }}>
                    Loading your habits...
                </p>
            </div>
        );
    }

    return (
        <div className="hb-container">
            {/* Reward Toast */}
            <RewardToast rewards={toastRewards} onDismiss={() => setToastRewards([])} />

            {/* Back */}
            <button className="hb-back-btn" onClick={onBack}>
                ← Back to Dashboard
            </button>

            {/* Header */}
            <div className="hb-header">
                <h1 className="hb-header__title">
                    🧠 <span>Habit Builder</span>
                </h1>
                <div className="hb-points-badge">
                    ⚡ {totalPoints} pts
                </div>
            </div>

            {/* Stats Row */}
            <div className="hb-stats-row">
                <div className="hb-stat-card">
                    <div className="hb-stat-card__icon">📋</div>
                    <div className="hb-stat-card__value">{dashboard.length}</div>
                    <div className="hb-stat-card__label">Today's Habits</div>
                </div>
                <div className="hb-stat-card">
                    <div className="hb-stat-card__icon">🔥</div>
                    <div className="hb-stat-card__value">
                        {dashboard.reduce((max, h) => Math.max(max, h.streak || 0), 0)}
                    </div>
                    <div className="hb-stat-card__label">Best Streak</div>
                </div>
                <div className="hb-stat-card">
                    <div className="hb-stat-card__icon">🏆</div>
                    <div className="hb-stat-card__value">
                        {rewards?.formed_habits || 0}
                    </div>
                    <div className="hb-stat-card__label">Habits Formed</div>
                </div>
                <div className="hb-stat-card">
                    <div className="hb-stat-card__icon">⏳</div>
                    <div className="hb-stat-card__value">{pendingCount}</div>
                    <div className="hb-stat-card__label">Pending</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="hb-tabs">
                <button
                    className={`hb-tab ${activeTab === 'today' ? 'hb-tab--active' : ''}`}
                    onClick={() => setActiveTab('today')}
                >
                    📅 Today
                </button>
                <button
                    className={`hb-tab ${activeTab === 'pending' ? 'hb-tab--active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    ⏳ Approval {pendingCount > 0 && `(${pendingCount})`}
                </button>
                <button
                    className={`hb-tab ${activeTab === 'rewards' ? 'hb-tab--active' : ''}`}
                    onClick={() => setActiveTab('rewards')}
                >
                    🏅 Rewards
                </button>
            </div>

            {/* ──────────────────── TODAY TAB ──────────────────── */}
            {activeTab === 'today' && (
                <>
                    {/* Pending approval banner */}
                    {pendingCount > 0 && (
                        <div className="hb-pending-banner">
                            ⚠️ You have {pendingCount} habit{pendingCount > 1 ? 's' : ''} waiting for your approval!
                            <button
                                className="hb-btn hb-btn--sm hb-btn--ghost"
                                onClick={() => setActiveTab('pending')}
                                style={{ marginLeft: 'auto' }}
                            >
                                Review →
                            </button>
                        </div>
                    )}

                    {/* Create button */}
                    {!showCreate && (
                        <button
                            className="hb-btn hb-btn--primary"
                            onClick={() => setShowCreate(true)}
                            style={{ marginBottom: 20 }}
                        >
                            ➕ New Habit
                        </button>
                    )}

                    {/* Create Form */}
                    {showCreate && (
                        <form className="hb-form" onSubmit={handleCreate}>
                            <div className="hb-form__title">✨ Create a New Habit</div>
                            <div className="hb-form__field" style={{ marginBottom: 12 }}>
                                <label className="hb-form__label">Habit Title</label>
                                <input
                                    className="hb-form__input"
                                    type="text"
                                    placeholder='e.g. "Read for 10 minutes"'
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

                            {/* AI Analyze */}
                            <button
                                type="button"
                                className="hb-btn hb-btn--ghost hb-btn--sm"
                                onClick={handleAiAnalyze}
                                disabled={analyzing || !form.title.trim()}
                                style={{ marginBottom: 12 }}
                            >
                                {analyzing ? (
                                    <><span className="hb-spinner" /> Analyzing...</>
                                ) : '🤖 AI Analyze'}
                            </button>

                            {aiPreview && (
                                <div className="hb-ai-box">
                                    <div className="hb-ai-box__label">🤖 AI Analysis</div>
                                    <p><strong>Feasibility:</strong> {aiPreview.task_analysis?.feasibility}</p>
                                    <p><strong>Suggestion:</strong> {aiPreview.task_analysis?.suggestion}</p>
                                    {aiPreview.motivation_tip && (
                                        <p style={{ marginTop: 6, fontStyle: 'italic', opacity: 0.8 }}>
                                            💡 {aiPreview.motivation_tip}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button type="submit" className="hb-btn hb-btn--primary" disabled={creating}>
                                    {creating ? <><span className="hb-spinner" /> Creating...</> : '✅ Create Habit'}
                                </button>
                                <button
                                    type="button"
                                    className="hb-btn hb-btn--ghost"
                                    onClick={() => { setShowCreate(false); setAiPreview(null); }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Habit Cards */}
                    <div className="hb-section-title">Today's Habits</div>

                    {dashboard.length === 0 ? (
                        <div className="hb-empty">
                            <div className="hb-empty__icon">🌱</div>
                            <div className="hb-empty__text">No habits yet. Create your first one!</div>
                            <button className="hb-btn hb-btn--primary" onClick={() => setShowCreate(true)}>
                                ➕ Add Habit
                            </button>
                        </div>
                    ) : (
                        dashboard.map(h => (
                            <div
                                key={h.id}
                                className={`hb-card ${h.status === 'completed' ? 'hb-card--completed' : ''}`}
                            >
                                <div className="hb-card__row">
                                    <button
                                        className={`hb-card__check ${h.status === 'completed' ? 'hb-card__check--done' : ''}`}
                                        onClick={() => h.status !== 'completed' && handleCheckIn(h.id)}
                                        disabled={h.status === 'completed'}
                                        title={h.status === 'completed' ? 'Done for today!' : 'Mark complete'}
                                    >
                                        {h.status === 'completed' ? '✓' : ''}
                                    </button>
                                    <div className="hb-card__info">
                                        <div className={`hb-card__title ${h.status === 'completed' ? 'hb-card__title--done' : ''}`}>
                                            {h.habit}
                                        </div>
                                        <div className="hb-card__meta">
                                            {h.time && <span>🕐 {h.time}</span>}
                                            <span>⏱️ {h.duration}m</span>
                                            <span className="hb-streak-flame">
                                                <span className="flame">🔥</span> {h.streak}
                                            </span>
                                            <span className={`hb-badge hb-badge--${h.stage}`}>
                                                {h.stage === 'formed' ? '🏆 Formed' :
                                                 h.stage === 'building' ? '🔨 Building' : '🌱 New'}
                                            </span>
                                            <span className={`hb-badge hb-badge--${h.created_by}`}>
                                                {h.created_by === 'parent' ? '👤 Parent' : '🧑 Self'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="hb-btn hb-btn--ghost hb-btn--sm"
                                        onClick={() => handleDelete(h.id)}
                                        title="Remove habit"
                                        style={{ padding: '6px 8px' }}
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {/* ──────────────── PENDING TAB ──────────────── */}
            {activeTab === 'pending' && (
                <>
                    <div className="hb-section-title">Parent Requests</div>
                    {pendingHabits.length === 0 ? (
                        <div className="hb-empty">
                            <div className="hb-empty__icon">✅</div>
                            <div className="hb-empty__text">All caught up! No pending requests.</div>
                        </div>
                    ) : (
                        pendingHabits.map(h => (
                            <div key={h.id} className="hb-card hb-card--pending-approval">
                                <div className="hb-card__row">
                                    <div style={{ fontSize: '1.5rem' }}>📩</div>
                                    <div className="hb-card__info">
                                        <div className="hb-card__title">{h.title}</div>
                                        <div className="hb-card__meta">
                                            <span>👤 From: {h.parent_name || 'Parent'}</span>
                                            <span>⏱️ {h.duration_minutes}m</span>
                                            {h.suggested_time && <span>🕐 {h.suggested_time}</span>}
                                            <span className="hb-badge hb-badge--pending">⏳ Pending</span>
                                        </div>
                                        {h.description && (
                                            <p style={{ fontSize: '0.82rem', color: 'var(--hb-text-muted)', marginTop: 6 }}>
                                                {h.description}
                                            </p>
                                        )}
                                        {h.ai_suggestion && (
                                            <div className="hb-ai-box" style={{ marginTop: 8 }}>
                                                <div className="hb-ai-box__label">🤖 AI Suggestion</div>
                                                <p>{h.ai_suggestion}</p>
                                            </div>
                                        )}
                                        <input
                                            className="hb-feedback-input"
                                            placeholder="Share your thoughts... (optional)"
                                            value={feedbackText}
                                            onChange={e => setFeedbackText(e.target.value)}
                                        />
                                        <input
                                            className="hb-feedback-input"
                                            placeholder="Suggest a modified title... (for Modify)"
                                            value={modifyTitle}
                                            onChange={e => setModifyTitle(e.target.value)}
                                            style={{ marginTop: 4 }}
                                        />
                                        <div className="hb-approval-actions">
                                            <button
                                                className="hb-btn hb-btn--success hb-btn--sm"
                                                onClick={() => handleRespond(h.id, 'approved')}
                                                disabled={respondingId === h.id}
                                            >
                                                ✅ Accept
                                            </button>
                                            <button
                                                className="hb-btn hb-btn--ghost hb-btn--sm"
                                                onClick={() => handleRespond(h.id, 'modified')}
                                                disabled={respondingId === h.id || !modifyTitle.trim()}
                                            >
                                                ✏️ Modify
                                            </button>
                                            <button
                                                className="hb-btn hb-btn--danger hb-btn--sm"
                                                onClick={() => handleRespond(h.id, 'rejected')}
                                                disabled={respondingId === h.id}
                                            >
                                                ❌ Decline
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {/* ──────────────── REWARDS TAB ──────────────── */}
            {activeTab === 'rewards' && (
                <>
                    <div className="hb-stats-row" style={{ marginTop: 0 }}>
                        <div className="hb-stat-card">
                            <div className="hb-stat-card__icon">⚡</div>
                            <div className="hb-stat-card__value">{rewards?.total_points || 0}</div>
                            <div className="hb-stat-card__label">Total Points</div>
                        </div>
                        <div className="hb-stat-card">
                            <div className="hb-stat-card__icon">✅</div>
                            <div className="hb-stat-card__value">{rewards?.total_completions || 0}</div>
                            <div className="hb-stat-card__label">Completions</div>
                        </div>
                        <div className="hb-stat-card">
                            <div className="hb-stat-card__icon">🏆</div>
                            <div className="hb-stat-card__value">{rewards?.formed_habits || 0}</div>
                            <div className="hb-stat-card__label">Habits Formed</div>
                        </div>
                        <div className="hb-stat-card">
                            <div className="hb-stat-card__icon">📋</div>
                            <div className="hb-stat-card__value">{rewards?.active_habits || 0}</div>
                            <div className="hb-stat-card__label">Active Habits</div>
                        </div>
                    </div>

                    <div className="hb-section-title">Recent Badges & Rewards</div>
                    {rewards?.recent_rewards?.length > 0 ? (
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
                    ) : (
                        <div className="hb-empty">
                            <div className="hb-empty__icon">🎮</div>
                            <div className="hb-empty__text">
                                Complete habits to earn badges and rewards!
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

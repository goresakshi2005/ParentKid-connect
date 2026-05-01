import api from './api';

export const getHabits = () => api.get('/habit-builder/habits/');

export const createHabit = (data) => api.post('/habit-builder/habits/', data);

export const updateHabit = (id, data) => api.patch(`/habit-builder/habits/${id}/`, data);

export const deleteHabit = (id) => api.delete(`/habit-builder/habits/${id}/`);

export const approveOrModifyHabit = (habitId, approvalStatus, feedback = '', adjustedTitle = '', adjustedDuration = null) => {
    const payload = {
        habit_id: habitId,
        approval_status: approvalStatus,
    };
    if (feedback) payload.feedback = feedback;
    if (adjustedTitle) payload.adjusted_title = adjustedTitle;
    if (adjustedDuration) payload.adjusted_duration = parseInt(adjustedDuration, 10);
    return api.post('/habit-builder/habits/approve_or_modify/', payload);
};

export const completeHabit = (habitId, notes = '') =>
    api.post('/habit-builder/habits/complete_task/', { habit_id: habitId, notes });
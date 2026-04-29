// frontend/src/services/habitBuilderService.js
import api from './api';

const BASE = '/habit-builder/habits';

/**
 * Create a new habit (parent or teen)
 */
export const createHabit = (data) => api.post(`${BASE}/`, data);

/**
 * List all habits for the current user (filtered by role)
 */
export const getHabits = () => api.get(`${BASE}/`);

/**
 * Get a single habit by ID
 */
export const getHabit = (id) => api.get(`${BASE}/${id}/`);

/**
 * Update a habit
 */
export const updateHabit = (id, data) => api.patch(`${BASE}/${id}/`, data);

/**
 * Delete a habit
 */
export const deleteHabit = (id) => api.delete(`${BASE}/${id}/`);

/**
 * Teen responds to a parent-created habit
 * @param {number} id - Habit ID
 * @param {Object} data - { status, feedback, adjusted_title }
 */
export const respondToHabit = (id, data) =>
    api.patch(`${BASE}/${id}/respond/`, data);

/**
 * Check in (complete) a habit for today
 */
export const checkInHabit = (id, data = {}) =>
    api.post(`${BASE}/${id}/check_in/`, data);

/**
 * Get completion history for a habit
 */
export const getHabitHistory = (id) => api.get(`${BASE}/${id}/history/`);

/**
 * AI analyze a proposed task (preview without creating)
 */
export const aiAnalyzeTask = (data) => api.post(`${BASE}/ai_analyze/`, data);

/**
 * Teen dashboard — daily view (max 3-4 items)
 */
export const getTeenDashboard = () => api.get(`${BASE}/teen_dashboard/`);

/**
 * Parent dashboard — monitoring view
 */
export const getParentDashboard = () => api.get(`${BASE}/parent_dashboard/`);

/**
 * Get rewards summary
 */
export const getRewardsSummary = () => api.get(`${BASE}/rewards_summary/`);

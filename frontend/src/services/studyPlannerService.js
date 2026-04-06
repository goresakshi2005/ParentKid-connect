// frontend/src/services/studyPlannerService.js
import api from './api';

/**
 * Parse a voice text string → structured JSON preview (no save).
 * Now returns { parsed: [task, task, ...] } — always an ARRAY of tasks.
 */
export const parseVoiceText = (voice_text) =>
    api.post('/study-tasks/parse_voice/', { voice_text });

/**
 * Parse + immediately save ALL tasks found in the voice text.
 * Returns { created: true, count: N, tasks: [...], skipped_duplicates: [...] }
 */
export const addTaskFromVoice = (voice_text) =>
    api.post('/study-tasks/add_from_voice/', { voice_text });

/**
 * Fetch all tasks. Optional filter: 'upcoming' | 'deadlines' | 'completed'
 */
export const getTasks = (filter = '') =>
    api.get('/study-tasks/', { params: filter ? { filter } : {} });

/**
 * Create a task manually (from structured form data)
 */
export const createTask = (data) => api.post('/study-tasks/', data);

/**
 * Update task status: 'Pending' or 'Completed'
 */
export const updateTaskStatus = (id, status) =>
    api.patch(`/study-tasks/${id}/update_status/`, { status });

/**
 * Delete a task
 */
export const deleteTask = (id) => api.delete(`/study-tasks/${id}/`);
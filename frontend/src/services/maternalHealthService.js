// frontend/src/services/maternalHealthService.js

import api from './api';

/**
 * Upload a pregnancy report and get back an AI-generated health guide.
 * @param {File}   file      - PDF or image file
 * @param {string} trimester - Optional e.g. "First Trimester", "7th month"
 * @returns {Promise<{success: boolean, guide: object}>}
 */
export const uploadReportForHealthGuide = (file, trimester = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (trimester) formData.append('trimester', trimester);

    return api.post('/reports/health-guide/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

/**
 * Fetch all previously generated health guides for the logged-in user.
 * @returns {Promise<Array>}
 */
export const getHealthGuideHistory = () => api.get('/reports/health-guide/history/');

/**
 * Fetch a single health guide by ID.
 * @param {number} id
 * @returns {Promise<object>}
 */
export const getHealthGuide = (id) => api.get(`/reports/health-guide/${id}/`);
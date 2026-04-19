// frontend/src/services/screenTimeService.js
import api from './api';

/**
 * Fetch screen time usage data.
 * @param {string} deviceId - Optional device ID to filter by
 * @param {number} days - Number of days to look back (default 7)
 */
export const getUsage = (deviceId = '', days = 7) =>
    api.get('/api/get-usage', {
        params: {
            ...(deviceId ? { device_id: deviceId } : {}),
            days,
        },
    });

/**
 * Get all devices registered by the logged-in parent.
 */
export const getDevices = () => api.get('/api/devices');

/**
 * Register a new child device.
 */
export const registerDevice = (deviceId, deviceName) =>
    api.post('/api/register-device', {
        device_id: deviceId,
        device_name: deviceName,
    });

/**
 * Upload screen time data (used by Android app, kept here for web-based testing).
 */
export const uploadScreenTime = (deviceId, usages) =>
    api.post('/api/upload-screen-time', {
        device_id: deviceId,
        usages,
    });

/**
 * Fetch AI-powered screen time intelligence/analysis for a child.
 * @param {string} childId - The ID of the child profile.
 */
export const getScreenIntelligence = (childId) =>
    api.get('/api/screen-intelligence', {
        params: { child_id: childId }
    });
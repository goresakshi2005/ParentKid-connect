import api from './api';

export const startVoiceSession = async () => {
    const response = await api.post('/voice-assessments/start/');
    return response.data;
};

export const sendVoiceResponse = async (sessionId, audioBlob) => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('audio', audioBlob, 'recording.webm');
    const response = await api.post('/voice-assessments/respond/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getVoiceResult = async (sessionId) => {
    const response = await api.get(`/voice-assessments/result/${sessionId}/`);
    return response.data;
};

/**
 * Fetches the most recent completed voice assessment for the logged-in user.
 * Returns null (not an error) when the user has never completed one.
 */
export const getLatestVoiceResult = async () => {
    try {
        const response = await api.get('/voice-assessments/latest/');
        return response.data;
    } catch (err) {
        if (err.response?.status === 404) return null;
        throw err;
    }
};
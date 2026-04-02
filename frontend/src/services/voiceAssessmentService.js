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
import api from './api';

export const getAssessments = (type, stage) => {
    let url = '/assessments/';
    const params = [];
    if (type) params.push(`type=${type}`);
    if (stage) params.push(`stage=${stage}`);
    if (params.length) url += `?${params.join('&')}`;
    return api.get(url);
};

export const getAssessment = (id) => {
    return api.get(`/assessments/${id}/`);
};

export const submitAssessment = (assessmentId, answers, childId) => {
    return api.post('/assessments/submit_assessment/', {
        assessment_id: assessmentId,
        answers,
        child_id: childId
    });
};

export const getMyResults = () => {
    return api.get('/assessments/my_results/');
};

export const getProgressTracking = (childId) => {
    return api.get(`/assessments/progress_tracking/?child_id=${childId || ''}`);
};

export const saveCareerDiscoveryResult = (resultData) => {
    return api.post('/career-discovery/', resultData);
};

export const getCareerDiscoveryResults = () => {
    return api.get('/career-discovery/');
};
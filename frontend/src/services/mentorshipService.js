import api from './api';

const mentorshipService = {
    // ─── Mentors ────────────────────────────────
    getMentors: (stage) => {
        const params = stage ? { stage } : {};
        return api.get('/mentorship/mentors/', { params });
    },

    // ─── Assignments ────────────────────────────
    getAssignments: () =>
        api.get('/mentorship/assignments/'),

    autoAssign: (stage) =>
        api.post('/mentorship/assignments/auto_assign/', { stage }),

    changeMentor: (assignmentId, newMentorId) =>
        api.post('/mentorship/assignments/change_mentor/', {
            assignment_id: assignmentId,
            new_mentor_id: newMentorId,
        }),

    // ─── Chat ───────────────────────────────────
    getChatHistory: (assignmentId) =>
        api.get(`/mentorship/chat/history/${assignmentId}/`),

    sendMessage: (assignmentId, message) =>
        api.post('/mentorship/chat/send/', {
            assignment_id: assignmentId,
            message,
        }),

    markRead: (assignmentId) =>
        api.post('/mentorship/chat/mark_read/', {
            assignment_id: assignmentId,
        }),
};

export default mentorshipService;

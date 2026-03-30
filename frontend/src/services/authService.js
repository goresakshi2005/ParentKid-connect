import api from './api';

export const signup = (email, password, firstName, lastName, role) => {
    return api.post('/users/signup/', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role
    });
};

export const login = (email, password) => {
    return api.post('/users/login/', { email, password });
};

export const getMe = () => {
    return api.get('/users/me/');
};